import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

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

    // 개발 환경에서만 TOKEN 출력
    if (process.env.NODE_ENV === 'development') {
      console.log("MAPBOX TOKEN:", accessToken);
    }

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

    // 사용자 위치로 지도 중심 설정
    const setUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 4);
    };

    const handleLocationError = (error) => {
      console.warn('위치 정보 불러오기 실패:', error.message);
      map.setView([20, 0], 2); // fallback 위치 설정
    };

    navigator.geolocation.getCurrentPosition(setUserLocation, handleLocationError);

    // GeoJSON 스타일 설정
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

    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        L.geoJSON(geojson, {
          style: defaultStyle,
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: function () {
                layer.setStyle(highlightStyle); // 마우스 오버시 강조
                layer.bringToFront();            // 맨 위로 올리기
              },
              mouseout: function () {
                layer.setStyle(defaultStyle);    // 마우스 아웃시 기본 스타일로 되돌리기
              },
            });
          },
        }).addTo(map);
      });
  }, []);

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      {/* 헤더와 메뉴 */}
      <header style={{ position: 'absolute', top: 0, width: '100%', zIndex: 10, padding: '20px', backgroundColor: 'white' }}>
        <h1>Traveler Map</h1>
        <nav>
          <a href="#">Home</a> | <a href="#">Countries</a> | <a href="#">Favorites</a>
        </nav>
      </header>

      {/* 지도 영역 */}
      <div
        ref={mapContainerRef}
        id="map"
        style={{ width: '100%', height: '100%', marginTop: '60px' }} // 헤더 공간 제외
      />

      {/* 본문 (하단) */}
      <div style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 10, padding: '20px', textAlign: 'center', backgroundColor: 'white' }}>
        <p>Welcome to the Traveler Map!</p>
      </div>
    </div>
  );
}
