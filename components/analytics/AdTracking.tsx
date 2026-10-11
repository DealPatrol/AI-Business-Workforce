import Script from 'next/script';
import { readGa4Id, readGoogleAdsId, readMetaPixelId } from '@/lib/analytics/config';

/**
 * Google tag (Ads and/or GA4) and Meta Pixel.
 * Renders nothing when the matching public env vars are unset or invalid.
 */
export function AdTracking() {
  const googleAdsId = readGoogleAdsId();
  const ga4Id = readGa4Id();
  const metaPixelId = readMetaPixelId();
  const googleTagId = googleAdsId || ga4Id;

  if (!googleTagId && !metaPixelId) return null;

  const googleConfig = [
    googleAdsId ? `gtag('config','${googleAdsId}',{allow_enhanced_conversions:true});` : '',
    ga4Id ? `gtag('config','${ga4Id}');` : '',
  ].join('');

  return (
    <>
      {googleTagId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} strategy="afterInteractive" />
          <Script id="ava-gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${googleConfig}`}
          </Script>
        </>
      ) : null}
      {metaPixelId ? (
        <Script id="ava-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
