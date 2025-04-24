// Map.js (위의 코드에서 변경된 부분)
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map({ setSelectedCountry }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // 위키피디아에서 국가 정보를 가져오는 함수
  const getCountryInfo = async (countryName) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts%7Cpageimages&exintro&explaintext&titles=${countryName}&piprop=thumbnail&pithumbsize=500&redirects=1`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId && pages[pageId]) {
      const extract = pages[pageId].extract;
      const thumbnail = pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null;

      return {
        description: extract,
        flag: thumbnail,
      };
    }
    return {
      description: '정보를 가져올 수 없습니다.',
      flag: null,
    };
  };

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
      noWrap: true,
      minZoom: 3,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
    });

    mapInstanceRef.current = map;

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

    const setUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 4);
    };

    const handleLocationError = (error) => {
      console.warn('위치 정보 불러오기 실패:', error.message);
      map.setView([20, 0], 2); // fallback
    };

    navigator.geolocation.getCurrentPosition(setUserLocation, handleLocationError);

    const defaultStyle = {
      color: '#333',
      weight: 1,
      fillColor: '#ccc',
      fillOpacity: 0.2,
    };

    const highlightStyle = {
      color: '#2563eb',        // 파란 테두리
      weight: 2,
      fillColor: '#93c5fd',    // 연파랑 배경
      fillOpacity: 0.5,
    };

    // GeoJSON 데이터 로드 및 마우스 클릭 이벤트 추가
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        L.geoJSON(geojson, {
          style: defaultStyle,
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: function () {
                layer.setStyle(highlightStyle);
                layer.bringToFront();
              },
              mouseout: function () {
                layer.setStyle(defaultStyle);
              },
              click: async function () {
                // 클릭 시 국가 정보 저장
                const countryData = await getCountryInfo(feature.properties.name);
                setSelectedCountry({
                  ...feature.properties,
                  description: countryData.description,
                  flag: countryData.flag,
                });
              },
            });
          },
        }).addTo(map);
      });
  }, [setSelectedCountry]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
