import type { AppProps } from "next/app";
import Head from "next/head";
import AppHeader from "../components/layout/AppHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { AuthProvider } from "../contexts/auth-context";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>Jobhunter</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
