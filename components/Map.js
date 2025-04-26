import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map({ setSelectedCountry, viewMode, showLabels, countryCodeMap, isDark }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

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
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      noWrap: true,
    });

    mapInstanceRef.current = map;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    let tileLayer;
    if (viewMode === 'map') {
      tileLayer = L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
        {
          tileSize: 512,
          zoomOffset: -1,
          attribution: '© Mapbox © OpenStreetMap',
          noWrap: true,
        }
      ).addTo(map);
    }

    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        const borderStyle = {
          color: isDark ? '#ffffff' : '#333333', // 다크모드/라이트모드 선 색
          weight: 1,
          fillColor: 'transparent',
          fillOpacity: 0,
        };

        L.geoJSON(geojson, {
          style: viewMode === 'border' ? borderStyle : undefined,
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: function () {
                if (viewMode === 'border') {
                  layer.setStyle({ color: isDark ? '#93c5fd' : '#2563eb' });
                  layer.bringToFront();
                }
              },
              mouseout: function () {
                if (viewMode === 'border') {
                  layer.setStyle({ color: isDark ? '#ffffff' : '#333333' });
                }
              },
              click: function () {
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
                  html: `<span style="color:${isDark ? '#ffffff' : '#333333'}; font-size:12px;">${flag} ${feature.properties.name}</span>`,
                  iconSize: [100, 20],
                  iconAnchor: [50, 10],
                }),
              });
              label.addTo(map);
            }
          },
        }).addTo(map);
      });

  }, [setSelectedCountry, viewMode, showLabels, countryCodeMap, isDark]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
