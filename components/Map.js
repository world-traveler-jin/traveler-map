// Map.js 파일 (viewMode에 따라 지도모드/국경모드 전환 지원, 다크모드 대응 + countryCenters.json 사용)

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Map 컴포넌트 정의 (setSelectedCountry, viewMode props 전달 받음)
export default function Map({ setSelectedCountry, viewMode }) {
  const mapContainerRef = useRef(null); // 지도 div를 참조하기 위한 ref
  const mapInstanceRef = useRef(null);  // Leaflet map 인스턴스를 저장하는 ref
  const [countryCenters, setCountryCenters] = useState({}); // countryCenters.json 데이터 저장

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

  // 지도 초기화 및 countryCenters.json 불러오기
  useEffect(() => {
    if (mapInstanceRef.current) return; // 이미 초기화되어 있으면 중복 생성 방지

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

    // 사용자 위치로 이동하는 함수
    const setUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 4);
    };

    // 위치 가져오기 실패 시 기본 위치 설정
    const handleLocationError = (error) => {
      console.warn('Failed to fetch location:', error.message);
      map.setView([20, 0], 2);
    };

    navigator.geolocation.getCurrentPosition(setUserLocation, handleLocationError);

    // countryCenters.json 불러오기
    fetch('/data/countryCenters.json')
      .then((res) => res.json())
      .then((data) => setCountryCenters(data));
  }, []);

  // viewMode가 변경될 때마다 타일 및 레이어 적용
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      map.removeLayer(layer); // 기존 레이어 모두 삭제
    });

    // 지도모드일 경우 Mapbox 타일 레이어 추가
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

    // 기본 국경 스타일 (라이트모드 기준)
    const defaultStyle = {
      color: '#333',
      weight: 1,
      fillColor: '#ccc',
      fillOpacity: 0.2,
    };

    // 하이라이트 스타일 (국가 위에 마우스 올렸을 때)
    const highlightStyle = {
      color: '#2563eb',
      weight: 2,
      fillColor: '#93c5fd',
      fillOpacity: 0.5,
    };

    // 현재 다크모드인지 판단 (html에 dark 클래스 있는지 확인)
    const isDark = document.documentElement.classList.contains('dark');

    // 국경선과 텍스트 색상 다크모드에 맞춰 설정
    const borderColor = isDark ? '#ccc' : '#333';
    const textColor = isDark ? '#f3f4f6' : '#374151';

    // GeoJSON 데이터 가져와서 국경선 및 국가 이름 렌더링
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        L.geoJSON(geojson, {
          style: (feature) => ({
            color: borderColor,
            weight: 1,
            fillColor: viewMode === 'border' ? (isDark ? '#1f2937' : '#ffffff') : '#ccc',
            fillOpacity: viewMode === 'border' ? 0 : 0.2,
          }),
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: function () {
                layer.setStyle(highlightStyle);
                layer.bringToFront();
              },
              mouseout: function () {
                layer.setStyle({
                  color: borderColor,
                  weight: 1,
                  fillColor: viewMode === 'border' ? (isDark ? '#1f2937' : '#ffffff') : '#ccc',
                  fillOpacity: viewMode === 'border' ? 0 : 0.2,
                });
              },
              click: async function () {
                const countryData = await getCountryInfo(feature.properties.name);
                setSelectedCountry({
                  ...feature.properties,
                  description: countryData.description,
                  flag: countryData.flag,
                });
              },
            });

            // 국경 모드일 때만 나라 이름 라벨 추가
            if (viewMode === 'border') {
              const countryName = feature.properties.ADMIN || feature.properties.name;
              const centerData = countryCenters[countryName];
              let center;

              if (centerData) {
                center = L.latLng(centerData.lat, centerData.lng);
              } else {
                center = layer.getBounds().getCenter(); // fallback
              }

              const label = L.marker(center, {
                icon: L.divIcon({
                  className: 'country-label',
                  html: `<span style="color:${textColor}; font-size:12px;">${feature.properties.name}</span>`,
                  iconSize: [100, 20],
                  iconAnchor: [50, 10],
                }),
              });
              label.addTo(map);
            }
          },
        }).addTo(map);
      });
  }, [viewMode, setSelectedCountry, countryCenters]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
