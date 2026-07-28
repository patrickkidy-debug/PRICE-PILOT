"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ID_PIXEL, evenementPixel } from "@/lib/pixel";

/**
 * Charge le pixel Meta et suit les changements de page.
 *
 * Next.js navigue côté client sans recharger le document : le script du pixel
 * ne verrait donc qu'une seule page par visite. L'effet ci-dessous renvoie un
 * PageView à chaque changement d'URL pour rétablir un comptage correct.
 */
export function PixelFacebook() {
  const chemin = usePathname();
  const premierRendu = useRef(true);

  useEffect(() => {
    // Le script d'initialisation envoie déjà le PageView d'arrivée ;
    // on ne couvre ici que les navigations internes suivantes.
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    evenementPixel("PageView");
  }, [chemin]);

  if (!ID_PIXEL) return null;

  return (
    <>
      <Script id="pixel-facebook" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${ID_PIXEL}');
fbq('track','PageView');`}
      </Script>
      {/* Repli pour les visiteurs sans JavaScript : compte au moins la visite. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${ID_PIXEL}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
