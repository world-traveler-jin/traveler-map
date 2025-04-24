import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // 클릭한 국가의 정보를 저장할 state
  const [selectedCountry, setSelectedCountry] = useState(null);

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
              click: function () {
                // 클릭 시 국가 정보 저장
                setSelectedCountry(feature.properties);
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

      {/* 국가 정보 팝업 */}
      {selectedCountry && (
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 20 }}>
          <h2>{selectedCountry.name}</h2>
          <p>{selectedCountry.description}</p>
        </div>
      )}
    </div>
  );
}
