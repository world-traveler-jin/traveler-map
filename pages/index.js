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
    // (나머지 코드는 동일)
    <>... (생략) ...</>
  );
}
