// Home.js 파일 (다크모드, 지도/국경 모드 토글 포함)

import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Map 컴포넌트를 동적으로 import하고 서버 사이드 렌더링 비활성화
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState(null); // 선택된 국가 정보를 저장하는 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [isDark, setIsDark] = useState(false); // 다크모드 on/off 상태
  const [viewMode, setViewMode] = useState('map'); // 지도/국경 모드 상태 ('map' 또는 'border')

  // 컴포넌트가 마운트될 때 로딩을 1.5초 후 종료
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

  // 다크모드 상태가 변경될 때 body classList 수정
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <>
      {/* 브라우저 탭 설정 */}
      <Head>
        <title>Traveler Map</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      {/* 페이지 전체 배경 및 다크모드 적용 */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-500">

        {/* 로딩 중일 때 로딩 스피너 표시 */}
        {loading ? (
          <div className="flex flex-col justify-center items-center flex-grow animate-fadeIn">
            <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-blue-600 dark:text-blue-300 font-medium">Loading Traveler Map...</p>
          </div>
        ) : (
          <>
            {/* 헤더 영역 */}
            <header className="w-full px-4 py-3 flex justify-between items-center shadow-md bg-white dark:bg-gray-900 sticky top-0 z-10 transition-all duration-500 ease-in-out">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">Traveler Map</h1>

              {/* 다크모드 및 지도모드 토글 버튼 그룹 */}
              <div className="flex gap-2">
                {/* 다크모드 토글 버튼 */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                {/* 지도/국경 모드 토글 버튼 */}
                <button
                  onClick={() => setViewMode(viewMode === 'map' ? 'border' : 'map')}
                  className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                >
                  {viewMode === 'map' ? '🗺️ Border Mode' : '🌍 Map Mode'}
                </button>
              </div>
            </header>

            {/* 네비게이션 메뉴 */}
            <nav className="flex justify-center gap-3 sm:gap-4 md:gap-6 text-sm md:text-base my-4">
              <a href="#" className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-300 ease-in-out">Map</a>
              <a href="#" className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-300 ease-in-out">Countries</a>
              <a href="#" className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-300 ease-in-out">Favorites</a>
            </nav>

            {/* 지도 컴포넌트에 viewMode 전달 */}
            <div className="flex-grow h-[60vh] sm:h-[65vh] md:h-[70vh] animate-fadeIn">
              <Map setSelectedCountry={setSelectedCountry} viewMode={viewMode} />
            </div>

            {/* 국가 선택 시 카드 표시 */}
            {selectedCountry && (
              <section className="p-6 sm:p-8 text-center bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl mx-auto mt-8 transform transition-all duration-700 ease-in-out animate-pop">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-600 dark:text-blue-300">{selectedCountry.name}</h2>
                {selectedCountry.flag && (
                  <img src={selectedCountry.flag} alt={`${selectedCountry.name} Flag`} className="w-16 h-16 sm:w-20 sm:h-20 mb-4 mx-auto rounded-full shadow-md" />
                )}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{selectedCountry.description}</p>
              </section>
            )}

            {/* 사이트 소개 영역 */}
            <section className="p-8 sm:p-12 text-center animate-fadeInUp delay-200">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-blue-600 dark:text-blue-300">Every country holds a story.</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">
                Click the map, and unlock your memories with Traveler Map.
              </p>
            </section>

            {/* 하단 푸터 */}
            <footer className="w-full p-4 bg-white dark:bg-gray-900 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 mt-8 transition-all duration-500 ease-in-out">
              &copy; 2025 Traveler Map. Made with ❤️ for explorers.
            </footer>
          </>
        )}
      </div>

      {/* 커스텀 애니메이션 정의 */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }

        .animate-fadeInUp {
          animation: fadeInUp 1s ease forwards;
        }

        .animate-pop {
          animation: pop 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pop {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
