import { currentHours, site, socialLinks } from "@/config/site";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "09.00" → "09:00" (schema.org vill ha kolon). */
function isoTime(time: string) {
  return time.replace(".", ":");
}

/** Sant bara för en riktig, publik https-adress (inte localhost eller exempeladresser). */
function isRealSiteUrl(url: string) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname !== "localhost" && !/(^|\.)example\.(se|com|org)$/.test(hostname);
  } catch {
    return false;
  }
}

/**
 * Strukturerad data (schema.org/AutoWash) för lokala sökresultat.
 * Renderas ENDAST när sajten har en riktig https-adress och telefonnummer
 * finns. Ingen gatuadress anges – vi är ett mobilt företag utan adress.
 * Arbetstiderna följer aktuell säsong (`site.hours.currentSeason`).
 */
export function LocalBusinessJsonLd() {
  const { phoneHref, phone, email } = site.contact;
  if (!isRealSiteUrl(site.url) || !phone) return null;

  const hours = currentHours();
  const prices = site.services.map((s) => s.price);

  const data = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: phoneHref ?? phone,
    ...(email ? { email } : {}),
    areaServed: { "@type": "City", name: site.baseTown },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAYS,
        opens: isoTime(hours.open),
        closes: isoTime(hours.close),
      },
    ],
    priceRange: `${Math.min(...prices)}–${Math.max(...prices)} SEK`,
    currenciesAccepted: "SEK",
    paymentAccepted: site.payment.methods.join(", "),
    sameAs: socialLinks.filter((s) => s.href).map((s) => s.href),
    makesOffer: site.services.map((s) => ({
      "@type": "Offer",
      price: s.price,
      priceCurrency: "SEK",
      itemOffered: { "@type": "Service", name: s.name, description: s.summary },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
