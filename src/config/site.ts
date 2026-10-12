/**
 * EA Auto Detail – central innehållsfil.
 *
 * Allt som rör företaget (kontaktuppgifter, priser, tjänster, sociala medier,
 * galleri och vanliga frågor) uppdateras HÄR. Komponenterna läser bara från
 * den här filen, så ingen annan kod behöver ändras när något nytt ska ut.
 *
 * Värden som är `null` är uppgifter vi ännu inte har fått. De visas som
 * tydligt markerade platshållare så länge `showPlaceholders` är `true`.
 * Sätt `showPlaceholders` till `false` innan sidan publiceras – då döljs
 * allt som saknar riktig information i stället för att visa platshållare.
 */

import { formatSEK } from "@/lib/format";

/** Priser i hela kronor (SEK). Ändra här så uppdateras hela sajten. */
const PRICE = { exterior: 149, interior: 249, complete: 349 } as const;
const MOBILE_FEE = 150;

export type ServiceId = "exterior" | "interior" | "complete";

export type Service = {
  id: ServiceId;
  name: string;
  shortName: string;
  /** Pris i hela kronor (SEK). */
  price: number;
  summary: string;
  /**
   * Vad som ingår. `includesConfirmed: false` betyder att listan är ett
   * utkast som EA Auto Detail måste bekräfta innan publicering.
   */
  includes: string[];
  includesConfirmed: boolean;
  /** Ungefärlig tidsåtgång, t.ex. "ca 1 timme". `null` = ej angivet än. */
  duration: string | null;
  highlighted?: boolean;
};

export type Arrangement = "visit" | "pickup" | "other";

export type GalleryItem = {
  id: string;
  title: string;
  category: "interior" | "exterior";
  vehicle: string | null;
  serviceId: ServiceId;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  /**
   * `true` = bilden är en platshållare och INTE ett riktigt kundjobb.
   * Byt ut mot egna foton och sätt till `false`.
   */
  placeholder: boolean;
  note?: string;
};

export type Faq = {
  id: string;
  question: string;
  /** `null` = svaret beror på uppgifter vi inte har fått ännu. */
  answer: string | null;
  placeholderHint?: string;
};

export const site = {
  name: "EA Auto Detail",
  /** Används för sitemap, delningslänkar m.m. Sätts via NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "sv-SE",
  currency: "SEK",
  showPlaceholders: true,

  tagline: "Noggrann bilvård – hos dig eller hos oss",
  description:
    "EA Auto Detail är ett litet bilvårdsföretag som drivs av två unga entreprenörer. Utvändig biltvätt, invändig bilrengöring och mobil bilvård till schyssta priser.",

  /** Logotyp. `null` = textbaserad ordmärkning används. */
  logo: null as null | { src: string; width: number; height: number },

  /** Hero-bild. `null` = grafisk bakgrund används tills riktiga bilder finns. */
  heroImage: null as null | { src: string; alt: string },

  contact: {
    /** Telefonnummer i format för visning, t.ex. "070-123 45 67". */
    phone: null as string | null,
    /** Samma nummer i internationellt format för länkar, t.ex. "+46701234567". */
    phoneHref: null as string | null,
    email: "eaautodetail2026@gmail.com" as string | null,
    /** Område vi utgår från / åker till, t.ex. "Västerås med omnejd". */
    serviceArea: null as string | null,
    /** Svarstider eller tider vi tar emot bokningar, t.ex. "Vardagar 16–20". */
    availability: null as string | null,
  },

  social: {
    tiktok: null as string | null,
    instagram: null as string | null,
    facebook: null as string | null,
  },

  /** Mobil serviceavgift i SEK när vi åker till kunden eller hämtar/lämnar bilen. */
  mobileFee: MOBILE_FEE,

  services: [
    {
      id: "exterior",
      name: "Utvändig biltvätt",
      shortName: "Utvändigt",
      price: PRICE.exterior,
      summary: "En ordentlig tvätt av bilens utsida så att den blir ren och fräsch igen.",
      includes: ["Tvätt av kaross", "Fälgar och däck", "Rutor utvändigt", "Torkning"],
      includesConfirmed: false,
      duration: null,
    },
    {
      id: "interior",
      name: "Invändig rengöring",
      shortName: "Invändigt",
      price: PRICE.interior,
      summary: "Vi rengör kupén så att bilen känns ren och skön att sitta i.",
      includes: [
        "Dammsugning av säten, golv och mattor",
        "Avtorkning av instrumentbräda och paneler",
        "Rutor invändigt",
        "Dörrsidor och dörröppningar",
      ],
      includesConfirmed: false,
      duration: null,
    },
    {
      id: "complete",
      name: "Invändig + utvändig",
      shortName: "In- och utvändigt",
      price: PRICE.complete,
      summary: "Både insida och utsida i ett och samma besök – vårt mest prisvärda val.",
      includes: ["Allt i utvändig biltvätt", "Allt i invändig rengöring"],
      includesConfirmed: false,
      duration: null,
      highlighted: true,
    },
  ] satisfies Service[] as Service[],

  arrangements: [
    {
      id: "visit",
      label: "Ni kommer till mig",
      description: "Vi utför jobbet där bilen står.",
      feeApplies: true,
    },
    {
      id: "pickup",
      label: "Hämtning och lämning",
      description: "Vi hämtar bilen och lämnar tillbaka den när den är klar.",
      feeApplies: true,
    },
    {
      id: "other",
      label: "Annat upplägg",
      description: "Vi pratar ihop oss om vad som passar bäst.",
      feeApplies: false,
    },
  ] satisfies { id: Arrangement; label: string; description: string; feeApplies: boolean }[],

  timeWindows: ["Förmiddag", "Eftermiddag", "Kväll", "Flexibel"],

  contactMethods: [
    { id: "phone", label: "Telefonsamtal", inputLabel: "Telefonnummer", type: "tel" },
    { id: "sms", label: "SMS", inputLabel: "Mobilnummer", type: "tel" },
    { id: "email", label: "E-post", inputLabel: "E-postadress", type: "email" },
    { id: "instagram", label: "Instagram", inputLabel: "Instagram-användarnamn", type: "text" },
  ] as const,

  /**
   * Galleri. Lägg egna bilder i /public/gallery/ och lägg till ett objekt
   * per jobb. Platshållarna nedan ska tas bort när riktiga bilder finns.
   */
  gallery: [
    {
      id: "exempel-utvandig",
      title: "Utvändig tvätt",
      category: "exterior",
      vehicle: null,
      serviceId: "exterior",
      before: { src: "/gallery/placeholder-exterior-before.svg", alt: "Platshållare: före utvändig tvätt" },
      after: { src: "/gallery/placeholder-exterior-after.svg", alt: "Platshållare: efter utvändig tvätt" },
      placeholder: true,
    },
    {
      id: "exempel-invandig",
      title: "Invändig rengöring",
      category: "interior",
      vehicle: null,
      serviceId: "interior",
      before: { src: "/gallery/placeholder-interior-before.svg", alt: "Platshållare: före invändig rengöring" },
      after: { src: "/gallery/placeholder-interior-after.svg", alt: "Platshållare: efter invändig rengöring" },
      placeholder: true,
    },
    {
      id: "exempel-komplett",
      title: "Invändig + utvändig",
      category: "exterior",
      vehicle: null,
      serviceId: "complete",
      before: { src: "/gallery/placeholder-exterior-before.svg", alt: "Platshållare: före komplett rengöring" },
      after: { src: "/gallery/placeholder-exterior-after.svg", alt: "Platshållare: efter komplett rengöring" },
      placeholder: true,
    },
    {
      id: "exempel-kupe",
      title: "Kupé och säten",
      category: "interior",
      vehicle: null,
      serviceId: "interior",
      before: { src: "/gallery/placeholder-interior-before.svg", alt: "Platshållare: före rengöring av kupé" },
      after: { src: "/gallery/placeholder-interior-after.svg", alt: "Platshållare: efter rengöring av kupé" },
      placeholder: true,
    },
  ] satisfies GalleryItem[] as GalleryItem[],

  faq: [
    {
      id: "vad-ingar",
      question: "Vad ingår i de olika tjänsterna?",
      answer:
        `Utvändig biltvätt (${formatSEK(PRICE.exterior)}) gäller bilens utsida, invändig rengöring (${formatSEK(PRICE.interior)}) gäller kupén och invändig + utvändig (${formatSEK(PRICE.complete)}) är båda delarna i samma besök. Under Tjänster & priser ser du vad som ingår i varje tjänst.`,
    },
    {
      id: "hur-lang-tid",
      question: "Hur lång tid tar en rengöring?",
      answer: null,
      placeholderHint: "Ange ungefärlig tid per tjänst, t.ex. utvändigt ca X min, invändigt ca X min.",
    },
    {
      id: "mobil-service",
      question: "Hur fungerar mobil service?",
      answer:
        `Vi kan komma till dig och göra jobbet där bilen står. När vi åker ut till dig tillkommer en mobil serviceavgift på ${formatSEK(MOBILE_FEE)}. Skriv ungefär var bilen står i bokningsförfrågan så återkommer vi och bekräftar.`,
    },
    {
      id: "mobil-krav",
      question: "Vad behöver finnas på plats när ni kommer till mig?",
      answer: null,
      placeholderHint: "Beskriv vad som krävs på plats, t.ex. om ni behöver tillgång till vatten och el eller har med allt själva.",
    },
    {
      id: "hamtning",
      question: "Hur fungerar hämtning och lämning?",
      answer:
        `Om det passar dig bättre kan vi hämta bilen och lämna tillbaka den när den är klar. Då tillkommer den mobila serviceavgiften på ${formatSEK(MOBILE_FEE)}. Vi kommer överens om tider och nyckelöverlämning när vi bekräftar bokningen.`,
    },
    {
      id: "extra-smutsig",
      question: "Vad händer om bilen är extra smutsig?",
      answer:
        "Väldigt smutsiga bilar, svåra fläckar eller jobb som kräver mer arbete kan kosta extra. Då får du alltid ett prisförslag först, och vi börjar aldrig med extraarbetet innan du har godkänt det.",
    },
    {
      id: "boka",
      question: "Hur bokar jag?",
      answer:
        "Fyll i bokningsförfrågan här på sidan. Välj tjänst, önskad dag och tid och hur du vill att vi gör med bilen. Förfrågan är inte en bekräftad bokning – vi hör av oss och bekräftar tid och pris innan något är spikat.",
    },
    {
      id: "betalning",
      question: "Hur betalar jag?",
      answer: null,
      placeholderHint: "Ange betalsätt, t.ex. Swish, kort eller faktura, och när betalningen sker.",
    },
    {
      id: "kontakt",
      question: "Hur kontaktar jag er?",
      answer:
        "Enklast är att skicka en bokningsförfrågan, så återkommer vi på det sätt du föredrar. Du kan också nå oss via våra sociala medier.",
    },
    {
      id: "omrade",
      question: "Vilka områden åker ni till?",
      answer: null,
      placeholderHint: "Ange ert serviceområde (orter/kommuner) och om det finns någon gräns för hur långt ni åker.",
    },
  ] satisfies Faq[] as Faq[],
};

export type Site = typeof site;

export function getService(id: string | null | undefined): Service | undefined {
  return site.services.find((s) => s.id === id);
}

export function getArrangement(id: string | null | undefined) {
  return site.arrangements.find((a) => a.id === id);
}

export const socialLinks = (
  [
    { id: "tiktok", label: "TikTok", href: site.social.tiktok },
    { id: "instagram", label: "Instagram", href: site.social.instagram },
    { id: "facebook", label: "Facebook", href: site.social.facebook },
  ] as const
).map((s) => ({ ...s }));

export const navigation = [
  { href: "/tjanster", label: "Tjänster & priser" },
  { href: "/galleri", label: "Galleri" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/vanliga-fragor", label: "Vanliga frågor" },
  { href: "/kontakt", label: "Kontakt" },
] as const;
