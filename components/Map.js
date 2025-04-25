// Map.js 파일

// React에서 제공하는 훅을 import함
// useEffect: 컴포넌트가 렌더링된 후 특정 작업을 수행할 때 사용
// useRef: DOM 요소나 값을 기억할 때 사용 (리렌더링 없이)
import { useEffect, useRef } from 'react';

// Leaflet(리플렛) 라이브러리를 import함
// 지도(map) 생성 및 제어를 위한 라이브러리
import L from 'leaflet';

// Map 컴포넌트를 export (내보내기) 함
export default function Map({ setSelectedCountry }) {
  // 지도를 렌더링할 HTML 요소를 참조할 ref 생성
  const mapContainerRef = useRef(null);

  // Leaflet 지도 인스턴스를 저장할 ref 생성 (지도 객체를 메모리에 저장)
  const mapInstanceRef = useRef(null);

  // 국가 이름을 기반으로 위키피디아에서 정보(설명, 깃발)를 가져오는 비동기 함수
  const getCountryInfo = async (countryName) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts%7Cpageimages&exintro&explaintext&titles=${countryName}&piprop=thumbnail&pithumbsize=500&redirects=1`;

    // fetch()를 이용해 API 요청 후, 결과를 JSON 형식으로 변환
    const res = await fetch(url);
    const data = await res.json();

    // 응답 데이터에서 페이지 ID 추출
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    // 유효한 페이지가 존재할 경우 설명과 썸네일 반환
    if (pageId && pages[pageId]) {
      const extract = pages[pageId].extract;
      const thumbnail = pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null;

      return {
        description: extract, // 국가 설명 텍스트
        flag: thumbnail,      // 국가 깃발 이미지 URL
      };
    }

    // 데이터가 없거나 실패 시 기본 메시지 반환
    return {
      description: 'Unable to fetch information.',
      flag: null,
    };
  };

  // 컴포넌트가 마운트될 때 지도 초기화 및 설정하는 useEffect
  useEffect(() => {
    // 이미 초기화된 경우 중복 초기화 방지
    if (mapInstanceRef.current) return;

    // Leaflet map 객체 생성 (mapContainerRef가 참조하는 div에 지도 렌더링)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,         // 줌 버튼 활성화
      dragging: true,            // 지도 드래그 가능
      scrollWheelZoom: true,     // 마우스 스크롤로 줌 조정 가능
      worldCopyJump: false,      // 지도 무한 스크롤 비활성화
      noWrap: true,              // 지도 경계 넘어가는 것 방지
      minZoom: 3,                // 최소 확대 레벨
      maxBounds: [               // 지도 이동 가능한 최대 영역
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,   // 지도 경계 저항도 설정
    });

    // map 인스턴스를 ref에 저장해 재사용 가능하게 함
    mapInstanceRef.current = map;

    // Mapbox API를 통한 지도 타일 불러오기
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
      {
        tileSize: 512,            // 타일 크기 설정
        zoomOffset: -1,           // 줌 오프셋 (Mapbox 스타일과 Leaflet 맞추기 위해)
        attribution: '© Mapbox © OpenStreetMap', // 지도 데이터 출처 표시
        noWrap: true,
        bounds: [[-85, -180], [85, 180]], // 타일 유효 범위 설정
      }
    ).addTo(map); // 생성된 타일 레이어를 지도에 추가

    // 사용자 위치 정보를 받아와서 지도 중심 이동하는 함수
    const setUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 4); // 현재 위치 기준으로 줌 4로 설정
    };

    // 위치 가져오기에 실패했을 때 기본 위치로 이동하는 함수
    const handleLocationError = (error) => {
      console.warn('Failed to fetch location:', error.message);
      map.setView([20, 0], 2); // 실패 시 기본 세계 지도 보기로 설정
    };

    // 브라우저의 Geolocation API를 사용하여 현재 위치 요청
    navigator.geolocation.getCurrentPosition(setUserLocation, handleLocationError);

    // 국가 기본 스타일 (회색 배경, 연한 테두리)
    const defaultStyle = {
      color: '#333',       // 테두리 색
      weight: 1,           // 테두리 두께
      fillColor: '#ccc',   // 내부 채우기 색
      fillOpacity: 0.2,    // 내부 색 투명도
    };

    // 마우스 오버 시 하이라이트 스타일 (밝은 파란색 강조)
    const highlightStyle = {
      color: '#2563eb',
      weight: 2,
      fillColor: '#93c5fd',
      fillOpacity: 0.5,
    };

    // 국가 경계선이 담긴 GeoJSON 파일 불러오기
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        // GeoJSON 데이터를 지도에 추가
        L.geoJSON(geojson, {
          style: defaultStyle, // 기본 스타일 지정
          onEachFeature: (feature, layer) => {
            // 각 나라에 대해 이벤트 핸들러 등록
            layer.on({
              mouseover: function () {
                // 마우스 올리면 하이라이트 스타일 적용
                layer.setStyle(highlightStyle);
                layer.bringToFront(); // 다른 나라보다 위로 올림
              },
              mouseout: function () {
                // 마우스 벗어나면 기본 스타일로 복구
                layer.setStyle(defaultStyle);
              },
              click: async function () {
                // 국가를 클릭했을 때 위키피디아에서 국가 정보 불러오기
                const countryData = await getCountryInfo(feature.properties.name);
                setSelectedCountry({
                  ...feature.properties,         // GeoJSON 속성 복사
                  description: countryData.description, // 설명 추가
                  flag: countryData.flag,         // 깃발 이미지 추가
                });
              },
            });
          },
        }).addTo(map); // 완성된 레이어를 지도에 추가
      });
  }, [setSelectedCountry]); // setSelectedCountry가 변경될 때만 useEffect 재실행

  // 실제 지도를 렌더링할 div 반환
  return (
    <div
      ref={mapContainerRef} // Leaflet이 사용할 div 요소 참조 연결
      id="map"               // ID 부여 (스타일링 또는 접근 용도)
      style={{ width: '100%', height: '100%' }} // div 크기 설정 (전체 영역 차지)
    />
  );
}