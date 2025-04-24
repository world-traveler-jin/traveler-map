import Head from 'next/head';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Traveler Map</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main style={{ height: '100vh', margin: 0, padding: 0 }}>
        <Map />
      </main>
    </>
  );
}
