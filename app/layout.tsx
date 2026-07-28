import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Price Pilot — Comparateur de prix au Sénégal",
  description:
    "Trouvez le prix le moins cher ou le meilleur rapport qualité-prix près de chez vous, à Dakar et au Sénégal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- police d'icônes chargée une fois dans le layout racine (équivalent App Router de _document), pas par page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <SessionProvider>{children}</SessionProvider>
        {/* Widget de paiement KkiaPay : chargé après l'affichage pour ne pas
            retarder le rendu, et disponible sur toute page proposant un palier. */}
        <Script src="https://cdn.kkiapay.me/k.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
