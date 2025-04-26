// Home.js 파일 (countryCodeMap과 continentMap fetch로 가져오기)

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
  const [favorites, setFavorites] = useState([]);
  const [countries, setCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [continentFilter, setContinentFilter] = useState('All');
  const [countryCodeMap, setCountryCodeMap] = useState({});
  const [continentMap, setContinentMap] = useState({});

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

  useEffect(() => {
    Promise.all([
      fetch('/data/countryCenters.json').then((res) => res.json()),
      fetch('/data/countryCodeMap.json').then((res) => res.json()),
      fetch('/data/continentMap.json').then((res) => res.json())
    ]).then(([centerData, codeData, continentData]) => {
      const sortedCountries = Object.keys(centerData).sort();
      setCountries(sortedCountries);
      setCountryCodeMap(codeData);
      setContinentMap(continentData);
    });

    const savedFavorites = JSON.parse(localStorage.getItem('favorites'));
    if (savedFavorites) setFavorites(savedFavorites);
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (country) => {
    if (!favorites.includes(country)) {
      setFavorites([...favorites, country]);
    }
  };

  const removeFromFavorites = (country) => {
    setFavorites(favorites.filter((fav) => fav !== country));
  };

  const addAllToFavorites = () => {
    setFavorites(countries);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const filteredCountries = countries.filter((country) => {
    const matchesSearch = country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContinent = continentFilter === 'All' || continentMap[country] === continentFilter;
    return matchesSearch && matchesContinent;
  });

  const getFlagEmoji = (countryName) => {
    const code = countryCodeMap[countryName];
    if (!code) return '🏳️';
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt()));
  };

  const handleCountryClick = (country) => {
    setSelectedCountry({ name: country });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-sky-100 via-yellow-50 to-white dark:from-blue-950 dark:via-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-500">
      {loading ? (
        <div className="flex flex-col justify-center items-center flex-grow animate-fadeIn">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-blue-600 dark:text-blue-300 font-medium">Loading Traveler Map...</p>
        </div>
      ) : (
        <>
          <header className="w-full px-4 py-3 flex justify-between items-center shadow-md bg-white/80 dark:bg-blue-950 sticky top-0 z-10 backdrop-blur-md">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-300 tracking-tight">Traveler Map</h1>
            <div className="flex gap-2">
              <button onClick={() => setIsDark(!isDark)} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform transform hover:scale-105">
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button onClick={() => setViewMode(viewMode === 'map' ? 'border' : 'map')} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-transform transform hover:scale-105">
                {viewMode === 'map' ? '🗺️ Border Mode' : '🌍 Map Mode'}
              </button>
              <button onClick={() => setShowLabels(!showLabels)} className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-white rounded-full hover:bg-green-200 dark:hover:bg-green-700 transition-transform transform hover:scale-105">
                {showLabels ? '📝 Hide Labels' : '📝 Show Labels'}
              </button>
            </div>
          </header>

          <nav className="flex justify-center gap-3 sm:gap-4 md:gap-6 text-sm md:text-base my-4">
            {['Map', 'Countries', 'Favorites'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 ${activeTab === tab ? 'bg-blue-500 text-white dark:bg-blue-700' : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700'}`}>{tab}</button>
            ))}
          </nav>

          <div className="flex justify-center gap-2 my-2">
            {['All', 'Asia', 'Europe', 'Africa', 'America', 'Oceania'].map((continent) => (
              <button key={continent} onClick={() => setContinentFilter(continent)} className={`px-3 py-1 text-sm rounded-full transition ${continentFilter === continent ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{continent}</button>
            ))}
          </div>

          <div className="flex-grow h-[60vh] sm:h-[65vh] md:h-[70vh] overflow-y-auto animate-fadeIn">
            {activeTab === 'Map' && (
              <Map
                setSelectedCountry={setSelectedCountry}
                viewMode={viewMode}
                showLabels={showLabels}
                countryCodeMap={countryCodeMap} // 여기! 추가됨
              />
            )}
            {/* (Countries 탭, Favorites 탭 코드는 그대로 유지) */}
          </div>

          <footer className="w-full px-4 py-4 text-center text-xs bg-sky-100 dark:bg-blue-950 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            © 2025 Traveler Map. Made by Traveler_Jin and ChatGPT for explorers.
          </footer>
        </>
      )}
    </div>
  );
}
