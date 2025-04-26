// Home.js 파일 (localStorage 저장 + 검색 기능 + 모두 추가/삭제 + 국기 표시 추가)

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
    fetch('/data/countryCenters.json')
      .then((res) => res.json())
      .then((data) => {
        const sortedCountries = Object.keys(data).sort();
        setCountries(sortedCountries);
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

  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFlagEmoji = (countryName) => {
    try {
      const code = countryName
        .split(' ')
        .slice(-1)[0]
        .toUpperCase()
        .slice(0, 2);
      return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt()));
    } catch {
      return '🏳️';
    }
  };

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
                <button onClick={() => setIsDark(!isDark)} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform duration-300 transform hover:scale-105">
                  {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <button onClick={() => setViewMode(viewMode === 'map' ? 'border' : 'map')} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-transform duration-300 transform hover:scale-105">
                  {viewMode === 'map' ? '🗺️ Border Mode' : '🌍 Map Mode'}
                </button>
                <button onClick={() => setShowLabels(!showLabels)} className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-white rounded-full hover:bg-green-200 dark:hover:bg-green-700 transition-transform duration-300 transform hover:scale-105">
                  {showLabels ? '📝 Hide Labels' : '📝 Show Labels'}
                </button>
              </div>
            </header>

            <nav className="flex justify-center gap-3 sm:gap-4 md:gap-6 text-sm md:text-base my-4 animate-fadeIn">
              {['Map', 'Countries', 'Favorites'].map((tab) => (
                <a key={tab} href="#" onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 ease-in-out ${activeTab === tab ? 'bg-blue-500 text-white dark:bg-blue-700' : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700'}`}>
                  {tab}
                </a>
              ))}
            </nav>

            <div className="flex-grow h-[60vh] sm:h-[65vh] md:h-[70vh] animate-fadeIn overflow-y-auto">
              {activeTab === 'Map' && (
                <Map setSelectedCountry={setSelectedCountry} viewMode={viewMode} showLabels={showLabels} />
              )}
              {activeTab === 'Countries' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Countries List</h2>
                  <input type="text" placeholder="Search countries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 mb-4 rounded-md border border-gray-300" />
                  <button onClick={addAllToFavorites} className="px-4 py-2 mb-4 bg-green-400 text-white rounded-full hover:bg-green-500">➕ Add All to Favorites</button>
                  <ul className="space-y-2">
                    {filteredCountries.map((country) => (
                      <li key={country} className="flex justify-between items-center">
                        <span>{getFlagEmoji(country)} {country}</span>
                        {favorites.includes(country) ? (
                          <span className="text-xs text-green-600 dark:text-green-300">Already Added</span>
                        ) : (
                          <button onClick={() => addToFavorites(country)} className="text-sm px-2 py-1 bg-green-200 dark:bg-green-700 text-green-800 dark:text-white rounded-full hover:bg-green-300 dark:hover:bg-green-600">Add</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeTab === 'Favorites' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">My Favorites</h2>
                  <button onClick={clearFavorites} className="px-4 py-2 mb-4 bg-red-400 text-white rounded-full hover:bg-red-500">🗑️ Clear All Favorites</button>
                  {favorites.length === 0 ? (
                    <p>No favorites yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {favorites.map((fav) => (
                        <li key={fav} className="flex justify-between items-center">
                          <span>{getFlagEmoji(fav)} {fav}</span>
                          <button onClick={() => removeFromFavorites(fav)} className="text-sm px-2 py-1 bg-red-200 dark:bg-red-700 text-red-800 dark:text-white rounded-full hover:bg-red-300 dark:hover:bg-red-600">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <footer className={`w-full px-4 py-4 text-center text-xs transition-colors duration-500 ${isDark ? 'text-gray-400 bg-blue-950 border-t border-gray-700' : 'text-gray-600 bg-sky-100 border-t border-gray-200'}`}>
              © 2025 Traveler Map. Made by Traveler_Jin and ChatGPT for explorers.
            </footer>
          </>
        )}
      </div>
    </>
  );
}
