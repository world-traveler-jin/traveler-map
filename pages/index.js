import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState(null);

  return (
    <>
      <Head>
        <title>Traveler Map</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-800">
        {/* Header */}
        <header className="w-full p-4 flex justify-between items-center shadow-md bg-white sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-blue-600">Traveler Map</h1>
          <nav className="space-x-4">
            <a href="#" className="text-gray-600 hover:text-blue-500">지도</a>
            <a href="#" className="text-gray-600 hover:text-blue-500">국가별</a>
            <a href="#" className="text-gray-600 hover:text-blue-500">찜목록</a>
          </nav>
        </header>

        {/* 지도 영역 */}
        <div className="flex-grow h-[70vh]">
          <Map setSelectedCountry={setSelectedCountry} />
        </div>

        {/* 국가 정보 팝업 */}
        {selectedCountry && (
          <section className="p-8 text-center bg-white shadow-lg max-w-4xl mx-auto mt-6">
            <h2 className="text-2xl font-bold mb-2">{selectedCountry.name}</h2>
            {selectedCountry.flag && (
              <img src={selectedCountry.flag} alt={`${selectedCountry.name} Flag`} className="w-16 h-16 mb-2 mx-auto" />
            )}
            <p className="text-gray-600">{selectedCountry.description}</p>
          </section>
        )}

        {/* 소개 카드 */}
        <section className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">여행의 시작, 여기에 담다</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Traveler Map은 전 세계를 자유롭게 여행하는 사람들을 위한 감성 지도 플랫폼입니다. 지도 위 나라를 클릭하면 내가 기록한 추억이 열립니다.
          </p>
        </section>

        {/* Footer */}
        <footer className="w-full p-4 bg-white text-center text-sm text-gray-500 border-t">
          &copy; 2025 Traveler Map. Made with ❤️ for explorers.
        </footer>
      </div>
    </>
  );
}
