import '../styles/globals.css';  // 절대 경로로 변경

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
