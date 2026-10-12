import { site, socialLinks } from "@/config/site";

/**
 * Strukturerad data (schema.org/AutoWash) för lokala sökresultat.
 * Renderas ENDAST när de uppgifter Google kräver finns: riktig webbadress,
 * telefonnummer och serviceområde. Annars renderas ingenting.
 */
export function LocalBusinessJsonLd() {
  const { phoneHref, phone, serviceArea, email } = site.contact;
  const hasRealUrl = !site.url.includes("localhost");
  if (!hasRealUrl || !phone || !serviceArea) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: phoneHref ?? phone,
    ...(email ? { email } : {}),
    areaServed: serviceArea,
    priceRange: `${Math.min(...site.services.map((s) => s.price))}–${Math.max(...site.services.map((s) => s.price))} SEK`,
    currenciesAccepted: "SEK",
    sameAs: socialLinks.filter((s) => s.href).map((s) => s.href),
    makesOffer: site.services.map((s) => ({
      "@type": "Offer",
      name: s.name,
      price: s.price,
      priceCurrency: "SEK",
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
