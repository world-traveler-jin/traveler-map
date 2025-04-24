import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    // 1. 지도 초기화
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
      noWrap: true,
      minZoom: 3, // ✅ 최소 줌 3으로 설정 (과도한 축소 방지)
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
    });

    mapInstanceRef.current = map;

    // 2. 글로벌 스타일 타일 (Mapbox streets-v11)
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

    // 3. 사용자 위치 감지 → 중심으로 이동
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 4);
      },
      (error) => {
        console.warn('위치 정보 불러오기 실패:', error.message);
        map.setView([20, 0], 2); // fallback: 전세계 공통 기준 중심
      }
    );
  }, []);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
