// Home.js 파일 (Footer, Header, Nav 감성 색상 업데이트 - 여행가 느낌)

import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const [showLabels, setShowLabels] = useState(true);
  const [activeTab, setActiveTab] = useState('Map');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

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
      <Head>
        <title>Traveler Map</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-blue-950 via-gray-900 to-gray-800 text-gray-100' : 'bg-gradient-to-br from-sky-100 via-yellow-50 to-white text-gray-800'}`}>
        {loading ? (
          <div className="flex flex-col justify-center items-center flex-grow animate-fadeIn">
            <img src="/loading-globe.gif" alt="Loading Globe" className="w-16 h-16 animate-bounce" />
            <p className="mt-4 text-blue-600 dark:text-blue-300 font-medium">Traveling the World...</p>
          </div>
        ) : (
          <>
            <header className={`w-full px-4 py-3 flex justify-between items-center shadow-md sticky top-0 z-10 transition-all duration-500 ease-in-out ${isDark ? 'bg-blue-950' : 'bg-sky-100/80 backdrop-blur-md'}`}>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-300 tracking-tight animate-fadeIn">Traveler Map</h1>
              <div className="flex gap-2 animate-fadeIn">
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform duration-300 transform hover:scale-105"
                >
                  {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'map' ? 'border' : 'map')}
                  className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-transform duration-300 transform hover:scale-105"
                >
                  {viewMode === 'map' ? '🗺️ Border Mode' : '🌍 Map Mode'}
                </button>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-white rounded-full hover:bg-green-200 dark:hover:bg-green-700 transition-transform duration-300 transform hover:scale-105"
                >
                  {showLabels ? '📝 Hide Labels' : '📝 Show Labels'}
                </button>
              </div>
            </header>

            <nav className="flex justify-center gap-3 sm:gap-4 md:gap-6 text-sm md:text-base my-4 animate-fadeIn">
              {['Map', 'Countries', 'Favorites'].map((tab) => (
                <a
                  key={tab}
                  href="#"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 ease-in-out
                    ${activeTab === tab
                      ? 'bg-blue-500 text-white dark:bg-blue-700'
                      : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700'}`}
                >
                  {tab}
                </a>
              ))}
            </nav>

            <div className="flex-grow h-[60vh] sm:h-[65vh] md:h-[70vh] animate-fadeIn">
              <Map setSelectedCountry={setSelectedCountry} viewMode={viewMode} showLabels={showLabels} />
            </div>

            <footer className={`w-full px-4 py-4 text-center text-xs transition-colors duration-500 ${isDark ? 'text-gray-400 bg-blue-950 border-t border-gray-700' : 'text-gray-600 bg-sky-100 border-t border-gray-200'}`}>
              © 2025 Traveler Map. Made with ❤️ for explorers.
            </footer>
          </>
        )}
      </div>
    </>
  );
}