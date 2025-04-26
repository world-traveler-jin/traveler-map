// Map.js 파일 (viewMode에 따라 지도모드/국경모드 전환 지원 + 다크모드 대응 + 나라 이름 중심 + 줌에 따른 크기 조정)

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Map 컴포넌트 정의 (setSelectedCountry, viewMode props 전달 받음)
export default function Map({ setSelectedCountry, viewMode }) {
  const mapContainerRef = useRef(null); // 지도 div를 참조하기 위한 ref
  const mapInstanceRef = useRef(null);  // Leaflet map 인스턴스를 저장하는 ref
  const labelsRef = useRef([]); // 나라 이름(label)들을 저장할 ref

  // 위키피디아에서 국가 정보를 가져오는 비동기 함수
  const getCountryInfo = async (countryName) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts%7Cpageimages&exintro&explaintext&titles=${countryName}&piprop=thumbnail&pithumbsize=500&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId && pages[pageId]) {
      const extract = pages[pageId].extract;
      const thumbnail = pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null;
      return { description: extract, flag: thumbnail };
    }

    return { description: 'Unable to fetch information.', flag: null };
  };

  // 폰트 크기 계산 함수 (줌 레벨에 따라 부드럽게 폰트 크기 변화)
  const calculateFontSize = (zoom) => {
    return 4 + zoom * 2; // 예: zoom 3 -> 10px, zoom 8 -> 20px
  };

  // 지도 초기화 및 기본 설정
  useEffect(() => {
    if (mapInstanceRef.current) return; // 이미 초기화 되어 있으면 무시

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
      noWrap: true,
      minZoom: 3,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
    });

    mapInstanceRef.current = map;

    // 사용자 위치 설정
    const setUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 4);
    };

    // 위치 불러오기 실패했을 때 기본 위치로
    const handleLocationError = (error) => {
      console.warn('Failed to fetch location:', error.message);
      map.setView([20, 0], 2);
    };

    navigator.geolocation.getCurrentPosition(setUserLocation, handleLocationError);
  }, []);

  // viewMode가 변경될 때마다 타일 및 레이어 적용
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 기존 레이어 및 라벨 모두 삭제
    map.eachLayer((layer) => map.removeLayer(layer));
    labelsRef.current.forEach((label) => map.removeLayer(label));
    labelsRef.current = []; // 라벨 배열 비우기

    // 다크모드 판단
    const isDark = document.documentElement.classList.contains('dark');
    const borderColor = isDark ? '#ccc' : '#333';
    const textColor = isDark ? '#f3f4f6' : '#374151';

    // 지도모드일 경우 Mapbox 타일 추가
    if (viewMode === 'map') {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
        {
          tileSize: 512,
          zoomOffset: -1,
          attribution: '© Mapbox © OpenStreetMap',
          noWrap: true,
          bounds: [[-85, -180], [85, 180]],
        }
      ).addTo(map);
    }

    // GeoJSON 로드
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        L.geoJSON(geojson, {
          style: () => ({
            color: borderColor,
            weight: 1,
            fillColor: viewMode === 'border' ? (isDark ? '#1f2937' : '#ffffff') : '#ccc',
            fillOpacity: viewMode === 'border' ? 0 : 0.2,
          }),
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: () => {
                layer.setStyle({
                  color: '#2563eb',
                  weight: 2,
                  fillColor: '#93c5fd',
                  fillOpacity: 0.5,
                });
                layer.bringToFront();
              },
              mouseout: () => {
                layer.setStyle({
                  color: borderColor,
                  weight: 1,
                  fillColor: viewMode === 'border' ? (isDark ? '#1f2937' : '#ffffff') : '#ccc',
                  fillOpacity: viewMode === 'border' ? 0 : 0.2,
                });
              },
              click: async () => {
                const countryData = await getCountryInfo(feature.properties.name);
                setSelectedCountry({
                  ...feature.properties,
                  description: countryData.description,
                  flag: countryData.flag,
                });
              },
            });

            // 국경모드일 때 나라 이름 추가
            if (viewMode === 'border') {
              const center = layer.getBounds().getCenter();
              const label = L.marker(center, {
                icon: L.divIcon({
                  className: 'country-label',
                  html: `<span style="color:${textColor}; font-size:${calculateFontSize(map.getZoom())}px;">${feature.properties.name}</span>`,
                  iconSize: [100, 20],
                  iconAnchor: [50, 10],
                }),
              });
              label.addTo(map);
              labelsRef.current.push(label);
            }
          },
        }).addTo(map);
      });

    // 지도 줌이 변경될 때 폰트 크기 업데이트
    const handleZoom = () => {
      const zoom = map.getZoom();
      labelsRef.current.forEach((label) => {
        const el = label.getElement()?.querySelector('span');
        if (el) {
          el.style.fontSize = `${calculateFontSize(zoom)}px`;
        }
      });
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom); // 이벤트 클린업
    };
  }, [viewMode, setSelectedCountry]);

  // 실제 지도를 렌더링하는 div
  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
