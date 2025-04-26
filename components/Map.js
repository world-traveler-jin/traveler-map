import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map({ setSelectedCountry, viewMode, showLabels, countryCodeMap }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // ISO 국가코드를 국기 이모지로 변환하는 함수
  const getFlagEmoji = (countryName) => {
    const code = countryCodeMap[countryName];
    if (!code) return '🏳️';
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt()));
  };

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      minZoom: 3,
      worldCopyJump: false,
      noWrap: true,
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 4);
      },
      (error) => {
        console.warn('위치 불러오기 실패:', error.message);
        map.setView([20, 0], 2); // fallback 위치
      }
    );

    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        const defaultStyle = {
          color: '#333',
          weight: 1,
          fillColor: '#ccc',
          fillOpacity: 0.2,
        };

        const highlightStyle = {
          color: '#2563eb',
          weight: 2,
          fillColor: '#93c5fd',
          fillOpacity: 0.5,
        };

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
                setSelectedCountry({
                  ...feature.properties,
                });
              },
            });

            if (viewMode === 'border' && showLabels) {
              const center = layer.getBounds().getCenter();
              const flag = getFlagEmoji(feature.properties.ADMIN || feature.properties.name);

              const label = L.marker(center, {
                icon: L.divIcon({
                  className: 'country-label',
                  html: `<span style="color:#333; font-size:12px;">${flag} ${feature.properties.name}</span>`,
                  iconSize: [100, 20],
                  iconAnchor: [50, 10],
                }),
              });
              label.addTo(map);
            }
          },
        }).addTo(map);
      });
  }, [setSelectedCountry, viewMode, showLabels, countryCodeMap]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
