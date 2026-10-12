/**
 * EA Auto Detail – central innehållsfil.
 *
 * Allt som rör företaget (kontaktuppgifter, priser, tjänster, reseavgifter,
 * arbetstider, betalning, sociala medier, galleri och vanliga frågor)
 * uppdateras HÄR. Komponenterna läser bara från den här filen, så ingen annan
 * kod behöver ändras när något nytt ska ut.
 *
 * Värden som är `null` är uppgifter vi ännu inte har fått. De visas som
 * tydligt markerade platshållare så länge `showPlaceholders` är `true`.
 * Sätt `showPlaceholders` till `false` innan sidan publiceras – då döljs
 * allt som saknar riktig information i stället för att visa platshållare.
 */

import { formatSEK } from "@/lib/format";

/** Priser i hela kronor (SEK). Ändra här så uppdateras hela sajten. */
const PRICE = { exterior: 149, interior: 249, complete: 349 } as const;

/** Reseavgift i SEK när vi åker till kunden eller hämtar och lämnar bilen. */
const TRAVEL_FEE = { near: 150, far: 250 } as const;

/** Hur långt vi åker, i km från Kristianstad. */
const TRAVEL_KM = { near: 5, max: 20 } as const;

/** Arbetstider per säsong. Byt `currentSeason` längre ned när säsongen skiftar. */
const SEASONS = {
  summer: { label: "Varmare delen av året", open: "09.00", close: "19.00" },
  winter: { label: "Vinterhalvåret", open: "09.00", close: "18.00" },
} as const;

export type ServiceId = "exterior" | "interior" | "complete";
export type SeasonId = keyof typeof SEASONS;

export type Service = {
  id: ServiceId;
  name: string;
  shortName: string;
  /** Pris i hela kronor (SEK). */
  price: number;
  summary: string;
  /** Vad som ingår (bekräftat av EA Auto Detail). */
  includes: string[];
  /** Ungefärlig tidsåtgång, t.ex. "30–45 minuter". `null` = ej angivet. */
  duration: string | null;
  /** Vad vi behöver tillgång till när vi jobbar hos kunden (mobil bilvård). */
  onSite: { electricity: boolean; water: boolean };
  highlighted?: boolean;
};

export type Arrangement = "visit" | "pickup";

export type TravelZone = {
  id: string;
  label: string;
  description: string;
  /** `null` = avgiften bekräftas manuellt utifrån adressen. */
  fee: number | null;
};

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

const hoursText = (s: SeasonId) => `${SEASONS[s].open}–${SEASONS[s].close}`;

export const site = {
  name: "EA Auto Detail",
  /**
   * Används för sitemap, delningslänkar och länkar i mejl. Sätts via
   * NEXT_PUBLIC_SITE_URL, annars används Vercels produktionsadress automatiskt.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  locale: "sv-SE",
  currency: "SEK",
  showPlaceholders: true,

  tagline: "Noggrann bilvård – hos dig eller hos oss",
  description:
    "EA Auto Detail är ett litet bilvårdsföretag i Kristianstad som drivs av två unga entreprenörer. Utvändig biltvätt, invändig rengöring och mobil bilvård – vi kommer till dig eller hämtar bilen.",

  /** Logotyp. `null` = textbaserad ordmärkning används. */
  logo: null as null | { src: string; width: number; height: number },

  /** Hero-bild. `null` = grafisk bakgrund används tills riktiga bilder finns. */
  heroImage: null as null | { src: string; alt: string },

  contact: {
    /** Telefonnummer i format för visning. */
    phone: "072-350 48 05" as string | null,
    /** Samma nummer i internationellt format för länkar. */
    phoneHref: "+46723504805" as string | null,
    email: "eaautodetail2026@gmail.com" as string | null,
    /** Område vi utgår från / åker till. */
    serviceArea: `Kristianstad med omnejd, upp till ca ${TRAVEL_KM.max} km (t.ex. Åhus)` as string | null,
  },

  /** Svarstid – visas vid bokningen, på kontaktsidan och i kvittomejlet. */
  responseTime: "Vi återkommer så snabbt vi kan – alltid inom 24 timmar.",

  /**
   * Arbetstider. Vi jobbar alla dagar i veckan. Byt `currentSeason` till
   * "summer" eller "winter" när säsongen skiftar – då uppdateras tiderna på
   * hela sajten och i bokningsformuläret.
   */
  hours: {
    currentSeason: "winter" as SeasonId,
    days: "Alla dagar",
    seasons: SEASONS,
  },

  payment: {
    methods: ["Swish", "Kontanter"],
    when: "Du betalar på plats när jobbet är klart.",
  },

  social: {
    tiktok: "https://www.tiktok.com/@eaautodetail3" as string | null,
    instagram: "https://www.instagram.com/eaautodetail_/" as string | null,
    facebook: "https://www.facebook.com/share/1DJVY9R1bx/" as string | null,
  },

  /** Vi utgår från den här orten. */
  baseTown: "Kristianstad",

  /**
   * Reseavgift som tillkommer vid mobil bilvård och vid hämtning och lämning.
   * Kunden väljer zon i bokningen och vi bekräftar avgiften utifrån adressen.
   */
  travelZones: [
    {
      id: "near",
      label: `Inom ca ${TRAVEL_KM.near} km från Kristianstad`,
      description: "Kristianstad med närområde.",
      fee: TRAVEL_FEE.near,
    },
    {
      id: "far",
      label: `${TRAVEL_KM.near}–${TRAVEL_KM.max} km från Kristianstad`,
      description: "T.ex. Åhus.",
      fee: TRAVEL_FEE.far,
    },
    {
      id: "unsure",
      label: "Vet inte",
      description: "Vi kollar adressen och bekräftar avgiften.",
      fee: null,
    },
  ] satisfies TravelZone[] as TravelZone[],

  /** Lägsta reseavgiften, för texter som "från 150 kr". */
  travelFeeFrom: TRAVEL_FEE.near,
  travelMaxKm: TRAVEL_KM.max,

  services: [
    {
      id: "exterior",
      name: "Utvändig biltvätt",
      shortName: "Utvändigt",
      price: PRICE.exterior,
      summary: "En ordentlig tvätt av bilens utsida så att den blir ren och fräsch igen.",
      includes: [
        "Tvätt av bilens kaross",
        "Rengöring av fälgar och däck",
        "Rengöring av utvändiga rutor",
        "Torkning av bilen",
      ],
      duration: "30–45 minuter",
      onSite: { electricity: true, water: true },
    },
    {
      id: "interior",
      name: "Invändig rengöring",
      shortName: "Invändigt",
      price: PRICE.interior,
      summary: "Vi rengör kupén så att bilen känns ren och skön att sitta i.",
      includes: [
        "Dammsugning av säten, golv och mattor",
        "Avtorkning av instrumentpanel och plastytor",
        "Rengöring av invändiga rutor",
        "Rengöring av dörrpaneler",
        "Rengöring av dörrkarmar",
      ],
      duration: "cirka 60 minuter",
      onSite: { electricity: true, water: false },
    },
    {
      id: "complete",
      name: "Invändig + utvändig rengöring",
      shortName: "In- och utvändigt",
      price: PRICE.complete,
      summary: "Allt som ingår i både den invändiga rengöringen och den utvändiga biltvätten – i ett och samma besök.",
      includes: ["Allt i utvändig biltvätt", "Allt i invändig rengöring"],
      duration: "1,5–2 timmar",
      onSite: { electricity: true, water: true },
      highlighted: true,
    },
  ] satisfies Service[] as Service[],

  /** Tidsåtgången är alltid en uppskattning. */
  durationNote:
    "Alla tider är uppskattningar. Hur lång tid det tar beror på bilens storlek, skick och hur smutsig den är.",

  /** Gäller alla tjänster – visas nära priserna och i bokningen. */
  extraWorkNote:
    "Är bilen ovanligt smutsig eller behöver extra arbete kan en extra avgift tillkomma. Du får alltid veta vad det kostar och godkänna det innan vi gör extraarbetet.",

  arrangements: [
    {
      id: "visit",
      label: "Mobil bilvård",
      description: "Vi kommer till dig och tvättar bilen där den står.",
      feeApplies: true,
    },
    {
      id: "pickup",
      label: "Hämtning och lämning",
      description: "Vi hämtar bilen, gör jobbet hos oss och lämnar tillbaka den.",
      feeApplies: true,
    },
  ] satisfies { id: Arrangement; label: string; description: string; feeApplies: boolean }[],

  /** Krav vid mobil bilvård, utöver el/vatten som beror på tjänst (se `onSiteNeeds`). */
  onSite: {
    parking: "En lämplig parkeringsplats där bilen kan stå och där vi får plats att arbeta.",
    mat: "Vi lägger en miljömatta under bilen som samlar upp tvättvattnet.",
    pickupNote: "Vid hämtning och lämning gör vi jobbet hos oss – du behöver inte ordna vatten, el eller tvättplats.",
  },

  /**
   * Galleri. Lägg egna bilder i /public/gallery/ och lägg till ett objekt
   * per jobb (se BILDER.md). Platshållarna nedan ska tas bort när riktiga
   * bilder finns.
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
        `Utvändig biltvätt (${formatSEK(PRICE.exterior)}) är tvätt av kaross, fälgar, däck och utvändiga rutor samt torkning. Invändig rengöring (${formatSEK(PRICE.interior)}) är dammsugning, avtorkning av instrumentpanel och plastytor, invändiga rutor, dörrpaneler och dörrkarmar. Invändig + utvändig (${formatSEK(PRICE.complete)}) är båda delarna i samma besök.`,
    },
    {
      id: "hur-lang-tid",
      question: "Hur lång tid tar en rengöring?",
      answer:
        "Utvändig biltvätt tar ungefär 30–45 minuter, invändig rengöring cirka 60 minuter och invändig + utvändig 1,5–2 timmar. Tiderna är uppskattningar – det beror på bilens storlek, skick och hur smutsig den är.",
    },
    {
      id: "mobil-service",
      question: "Hur fungerar mobil bilvård?",
      answer:
        `Vi kommer till dig och tvättar bilen där den står. Då tillkommer en reseavgift: ${formatSEK(TRAVEL_FEE.near)} inom ca ${TRAVEL_KM.near} km från Kristianstad och ${formatSEK(TRAVEL_FEE.far)} upp till ${TRAVEL_KM.max} km (t.ex. Åhus). Skriv adressen i bokningsförfrågan så bekräftar vi avgiften.`,
    },
    {
      id: "mobil-krav",
      question: "Vad behöver finnas på plats när ni kommer till mig?",
      answer:
        "För invändig rengöring behöver vi tillgång till el. För utvändig biltvätt och för invändig + utvändig behöver vi tillgång till både vatten och el. Bilen behöver stå på en lämplig parkeringsplats där vi får plats att arbeta. Vi lägger en miljömatta under bilen som samlar upp tvättvattnet. Väljer du hämtning och lämning behöver du inte ordna något av detta.",
    },
    {
      id: "hamtning",
      question: "Hur fungerar hämtning och lämning?",
      answer:
        `Vi hämtar bilen, gör jobbet hos oss och lämnar tillbaka den när den är klar. Du behöver inte ordna vatten, el eller tvättplats. Samma reseavgift gäller som vid mobil bilvård: ${formatSEK(TRAVEL_FEE.near)} inom ca ${TRAVEL_KM.near} km från Kristianstad och ${formatSEK(TRAVEL_FEE.far)} upp till ${TRAVEL_KM.max} km. Tider och nyckelöverlämning bestämmer vi när vi bekräftar bokningen.`,
    },
    {
      id: "extra-smutsig",
      question: "Vad händer om bilen är extra smutsig?",
      answer:
        "Är bilen ovanligt smutsig eller behöver extra arbete kan en extra avgift tillkomma. Du får alltid veta vad det kostar och godkänna det innan vi gör extraarbetet.",
    },
    {
      id: "boka",
      question: "Hur bokar jag?",
      answer:
        "Fyll i bokningsförfrågan här på sidan. Välj tjänst, dag och tid och om vi ska komma till dig eller hämta bilen. En förfrågan är inte en bekräftad bokning – vi återkommer alltid inom 24 timmar och bekräftar tid och pris.",
    },
    {
      id: "betalning",
      question: "Hur betalar jag?",
      answer: "Du kan betala med Swish eller kontanter. Betalningen sker på plats när jobbet är klart.",
    },
    {
      id: "arbetstider",
      question: "När jobbar ni?",
      answer: `Vi jobbar alla dagar i veckan: ${hoursText("summer")} under den varmare delen av året och ${hoursText("winter")} under vinterhalvåret.`,
    },
    {
      id: "svarstid",
      question: "Hur snabbt svarar ni?",
      answer: "Vi återkommer så snabbt vi kan, ofta direkt – och alltid inom 24 timmar.",
    },
    {
      id: "kontakt",
      question: "Hur kontaktar jag er?",
      answer:
        "Enklast är att skicka en bokningsförfrågan här på sidan. Du kan också ringa eller sms:a oss på 072-350 48 05 eller skriva till oss på Instagram, Facebook eller TikTok.",
    },
    {
      id: "omrade",
      question: "Vilka områden åker ni till?",
      answer:
        `Vi utgår från Kristianstad och åker upp till ca ${TRAVEL_KM.max} km därifrån, t.ex. till Åhus. Inom ca ${TRAVEL_KM.near} km är reseavgiften ${formatSEK(TRAVEL_FEE.near)} och mellan ${TRAVEL_KM.near} och ${TRAVEL_KM.max} km ${formatSEK(TRAVEL_FEE.far)}.`,
    },
  ] satisfies Faq[] as Faq[],
};

export type Site = typeof site;

export function getService(id: string | null | undefined): Service | undefined {
  return site.services.find((s) => s.id === id);
}

export function getTravelZone(id: string | null | undefined) {
  return site.travelZones.find((z) => z.id === id);
}

export function getArrangement(id: string | null | undefined) {
  return site.arrangements.find((a) => a.id === id);
}

/** Aktuella arbetstider, t.ex. { label: "Vinterhalvåret", open: "09.00", close: "18.00", text: "09.00–18.00" }. */
export function currentHours() {
  const s = site.hours.seasons[site.hours.currentSeason];
  return { ...s, text: `${s.open}–${s.close}` };
}

/** Arbetstider för en viss säsong som text, t.ex. "09.00–19.00". */
export function seasonHoursText(season: SeasonId) {
  return hoursText(season);
}

/**
 * Starttider kunden kan välja i bokningen: varje hel timme från öppning till
 * en timme före stängning enligt aktuell säsong, plus "Flexibel".
 */
export function bookingTimes(): string[] {
  const { open, close } = currentHours();
  const first = parseInt(open, 10);
  const last = parseInt(close, 10) - 1;
  const times: string[] = [];
  for (let h = first; h <= last; h++) times.push(`${String(h).padStart(2, "0")}.00`);
  return [...times, "Flexibel"];
}

/** Vad vi behöver på plats vid mobil bilvård för en viss tjänst. */
export function onSiteNeeds(serviceId: string | null | undefined): string[] {
  const service = getService(serviceId);
  const needs: string[] = [];
  if (service) {
    if (service.onSite.water && service.onSite.electricity) needs.push("Tillgång till vatten och el");
    else if (service.onSite.electricity) needs.push("Tillgång till el");
    else if (service.onSite.water) needs.push("Tillgång till vatten");
  }
  needs.push(site.onSite.parking);
  return needs;
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
