// Map.js 파일 (다크모드/라이트모드 감성 스타일 강화 + 이름 표시 토글 추가)

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function Map({ setSelectedCountry, viewMode, showLabels }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [countryCenters, setCountryCenters] = useState({});
  const [themeVersion, setThemeVersion] = useState(0);

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

  useEffect(() => {
    if (mapInstanceRef.current) return;

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

    const setUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 4);
    };

    const handleLocationError = (error) => {
      console.warn('Failed to fetch location:', error.message);
      map.setView([20, 0], 2);
    };

    navigator.geolocation.getCurrentPosition(setUserLocation, handleLocationError);

    fetch('/data/countryCenters.json')
      .then((res) => res.json())
      .then((data) => setCountryCenters(data));

    const observer = new MutationObserver(() => {
      setThemeVersion((v) => v + 1);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      map.removeLayer(layer);
    });

    const isDark = document.documentElement.classList.contains('dark');

    const backgroundColor = (viewMode === 'border')
      ? (isDark ? '#0d1117' : '#ffffff')
      : (isDark ? '#1f2937' : '#f3f4f6');

    const borderColor = (viewMode === 'border')
      ? (isDark ? '#f9fafb' : '#1f2937')
      : (isDark ? 'transparent' : 'transparent');

    const textColor = (viewMode === 'border')
      ? (isDark ? '#ffffff' : '#000000')
      : (isDark ? '#f3f4f6' : '#374151');

    document.getElementById('map').style.backgroundColor = backgroundColor;

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

    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        L.geoJSON(geojson, {
          style: (feature) => ({
            color: borderColor,
            weight: viewMode === 'border' ? 1 : 0,
            fillColor: viewMode === 'border' ? backgroundColor : '#ccc',
            fillOpacity: viewMode === 'border' ? 1 : 0.2,
          }),
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: function () {
                layer.setStyle({
                  color: '#2563eb',
                  weight: 2,
                  fillColor: '#93c5fd',
                  fillOpacity: 0.5,
                });
                layer.bringToFront();
              },
              mouseout: function () {
                layer.setStyle({
                  color: borderColor,
                  weight: viewMode === 'border' ? 1 : 0,
                  fillColor: viewMode === 'border' ? backgroundColor : '#ccc',
                  fillOpacity: viewMode === 'border' ? 1 : 0.2,
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

            if (viewMode === 'border' && showLabels) {
              const countryName = feature.properties.ADMIN || feature.properties.name;
              const centerData = countryCenters[countryName];
              let center;

              if (centerData) {
                center = L.latLng(centerData.lat, centerData.lng);
              } else {
                center = layer.getBounds().getCenter();
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
  }, [viewMode, setSelectedCountry, countryCenters, themeVersion, showLabels]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
