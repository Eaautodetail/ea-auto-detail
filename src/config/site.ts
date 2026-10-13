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

/**
 * Reseavgift i SEK per upplägg och avstånd. `near` = inom ca TRAVEL_KM.near km
 * från Kristianstad, `far` = mellan TRAVEL_KM.near och TRAVEL_KM.max km.
 * "Lämna bilen hos oss" (dropoff) är gratis och finns därför inte här.
 */
const TRAVEL_FEE = {
  visit: { near: 150, far: 250 },
  pickup: { near: 250, far: 350 },
} as const;

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
  /**
   * Övre gränsen i `duration`, i minuter (t.ex. 45 för "30–45 minuter").
   * Styr vilka starttider som går att välja i bokningen, så att jobbet hinns
   * med före stängning. Ändra den tillsammans med `duration`.
   */
  maxMinutes?: number;
  /** Vad vi behöver tillgång till när vi jobbar hos kunden (mobil bilvård). */
  onSite: { electricity: boolean; water: boolean };
  highlighted?: boolean;
};

export type Arrangement = "visit" | "pickup" | "dropoff";

/** Upplägg där en reseavgift tillkommer (vi åker till kunden). */
export type FeeArrangement = keyof typeof TRAVEL_FEE;

export type TravelZone = {
  id: string;
  label: string;
  /** Kort etikett för tabellrubriker, t.ex. "Inom ca 5 km". */
  shortLabel: string;
  description: string;
  /** Reseavgift per upplägg. `null` = avgiften bekräftas manuellt utifrån adressen. */
  fees: Record<FeeArrangement, number> | null;
};

export type ArrangementInfo = {
  id: Arrangement;
  label: string;
  description: string;
  /** `true` = reseavgift tillkommer och kunden anger adress och avstånd. */
  feeApplies: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  category: "interior" | "exterior";
  vehicle: string | null;
  /** Vilken tjänst jobbet var. `null` = inte bekräftat ännu – då visas ingen tjänst under bilden. */
  serviceId: ServiceId | null;
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

const NAME = "EA Auto Detail";

export const site = {
  name: NAME,
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
  showPlaceholders: false,

  tagline: "Noggrann bilvård – hos dig eller hos oss",
  description:
    "EA Auto Detail är ett litet bilvårdsföretag i Kristianstad som drivs av två unga entreprenörer. Utvändig biltvätt, invändig rengöring och mobil bilvård – vi kommer till dig, hämtar bilen eller så lämnar du den hos oss.",

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
    serviceArea: `Kristianstad med omnejd, upp till ca ${TRAVEL_KM.max} km` as string | null,
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
   * Reseavgift som tillkommer vid mobil bilvård och vid hämtning och lämning
   * (beloppen per upplägg står i TRAVEL_FEE överst i filen). Kunden väljer zon
   * i bokningen och vi bekräftar avgiften utifrån adressen. När kunden lämnar
   * bilen hos oss behövs ingen zon och ingen reseavgift.
   */
  travelZones: [
    {
      id: "near",
      label: `Inom ca ${TRAVEL_KM.near} km från Kristianstad`,
      shortLabel: `Inom ca ${TRAVEL_KM.near} km`,
      description: "Kristianstad med närområde.",
      fees: { visit: TRAVEL_FEE.visit.near, pickup: TRAVEL_FEE.pickup.near },
    },
    {
      id: "far",
      label: `${TRAVEL_KM.near}–${TRAVEL_KM.max} km från Kristianstad`,
      shortLabel: `${TRAVEL_KM.near}–${TRAVEL_KM.max} km`,
      description: `Upp till ca ${TRAVEL_KM.max} km från Kristianstad.`,
      fees: { visit: TRAVEL_FEE.visit.far, pickup: TRAVEL_FEE.pickup.far },
    },
    {
      id: "unsure",
      label: "Vet inte",
      shortLabel: "Vet inte",
      description: "Vi kollar adressen och bekräftar avgiften.",
      fees: null,
    },
  ] satisfies TravelZone[] as TravelZone[],

  /** Hur långt vi åker (km från Kristianstad) och gränsen för närzonen. */
  travelMaxKm: TRAVEL_KM.max,
  travelNearKm: TRAVEL_KM.near,

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
      maxMinutes: 45,
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
      maxMinutes: 60,
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
      maxMinutes: 120,
      onSite: { electricity: true, water: true },
      highlighted: true,
    },
  ] satisfies Service[] as Service[],

  /**
   * "X kr billigare än att boka delarna var för sig" och en etikett på
   * kombinationstjänsten. Besparingen räknas fram ur priserna ovan.
   * Avstängt (`show: false`) tills ni har godkänt formuleringen.
   */
  comboSaving: { show: false, badge: "Mest prisvärt" },

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
    {
      id: "dropoff",
      label: "Lämna bilen hos oss",
      description: "Du lämnar bilen hos oss och hämtar den när den är klar.",
      feeApplies: false,
    },
  ] satisfies ArrangementInfo[] as ArrangementInfo[],

  /** Krav vid mobil bilvård, utöver el/vatten som beror på tjänst (se `onSiteNeeds`). */
  onSite: {
    parking: "En lämplig parkeringsplats där bilen kan stå och där vi får plats att arbeta.",
    mat: "Vi lägger en miljömatta under bilen som samlar upp tvättvattnet.",
    pickupNote: "Vid hämtning och lämning gör vi jobbet hos oss – du behöver inte ordna vatten, el eller tvättplats.",
    dropoffNote: "När du lämnar bilen hos oss gör vi jobbet hos oss – du behöver inte ordna vatten, el eller tvättplats.",
    /** Vi har ingen publik adress i den här filen – den skickas när vi bekräftar. */
    dropoffHandover: "Adress och tid för lämning och hämtning får du när vi bekräftar bokningen.",
    /** Visas vid mobil bilvård för den som saknar vatten, el eller plats. */
    atOurPlaceNote:
      "Välj hämtning och lämning eller lämna bilen hos oss – då gör vi jobbet hos oss och du behöver inte ordna vatten, el eller tvättplats.",
  },

  /**
   * Texten under "Vår historia" på /om-oss, ett stycke per rad. Skriv gärna om
   * den med egna ord. Arbetstider och upplägg läggs till automatiskt efteråt.
   */
  about: {
    /**
     * Foton på oss som driver företaget (i /public/about/). Lägg till `name`
     * om ni vill visa era förnamn under bilderna.
     */
    founders: [
      { src: "/about/grundare-1.jpg", alt: "Albin Seferi, en av grundarna till EA Auto Detail.", name: "Albin Seferi" },
      { src: "/about/grundare-2.jpg", alt: "Erjon Hasi, en av grundarna till EA Auto Detail.", name: "Erjon Hasi" },
    ] as { src: string; alt: string; name: string | null }[],
    story: [
      `${NAME} drivs av oss två – unga entreprenörer som går på Söderportgymnasiet och som delar samma intresse: bilar, och känslan när en bil verkligen är ren. Ur det intresset växte idén att starta något eget. Vi bygger företaget från grunden, vid sidan av studierna, och gör allt arbete själva.`,
      "Hos oss pratar du direkt med dem som tar hand om din bil. Vi är inget stort, opersonligt företag – bara vi två och ett jobb som vi vill att du ska bli nöjd med. Vi är noggranna med detaljerna och anpassar arbetet efter bilens skick och vad du behöver. Skillnaden mellan före och efter ska märkas på riktigt.",
      "Vi vill göra bilvård enkel. Därför kommer vi till dig och tvättar bilen där den står, eller hämtar den och lämnar tillbaka den när den är klar. Du slipper åka till en biltvätt och lägga din egen tid och energi på jobbet.",
      "Vi lär oss hela tiden. Vi testar nya arbetssätt, satsar på bättre utrustning och bygger ut det vi erbjuder i takt med att vi kan mer. Vi lovar hellre lite och gör ett ordentligt jobb än tvärtom – och vi säger aldrig att vi gör något som vi ännu inte kan göra bra.",
      "Vi vill växa genom bra resultat och nöjda kunder, inte genom stora ord. Därför visar vi vårt arbete med före- och efterbilder och klipp på TikTok, Instagram och Facebook. Ta gärna en titt – och blir du nöjd blir vi glada om du berättar om oss för någon du känner.",
    ] as string[],
  },

  /**
   * Galleri med EA Auto Details egna före- och efterbilder (i /public/gallery/).
   * Nya jobb läggs till som ett objekt per jobb – se BILDER.md. Det första
   * jobbet i listan visas först, och de första visas också på startsidan.
   * `serviceId: null` = vi vet inte vilken tjänst jobbet var, så ingen tjänst
   * visas under bilden. Fyll i den när ni har bekräftat det.
   */
  gallery: [
    {
      id: "svart-bil-utvandig",
      title: "Svart bil",
      category: "exterior",
      vehicle: null,
      serviceId: null,
      before: { src: "/gallery/utvandig-fore.jpg", alt: "Före: svart bil framifrån med dammig och smutsig lack." },
      after: { src: "/gallery/utvandig-efter.jpg", alt: "Efter: samma bil framifrån, nytvättad och blank." },
      placeholder: false,
    },
    {
      id: "framsate-invandig",
      title: "Framsäte i tyg",
      category: "interior",
      vehicle: null,
      serviceId: null,
      before: {
        src: "/gallery/framsate-fore.jpg",
        alt: "Före: ljust mönstrat framsäte i tyg med stora mörka fläckar på sittdynan.",
      },
      after: { src: "/gallery/framsate-efter.jpg", alt: "Efter: samma framsäte med ren sittdyna utan synliga fläckar." },
      placeholder: false,
    },
    {
      id: "skapbil-lastutrymme",
      title: "Lastutrymme i skåpbil",
      category: "interior",
      vehicle: null,
      serviceId: null,
      before: { src: "/gallery/skapbil-fore.jpg", alt: "Före: lastutrymmet i en vit skåpbil med smutsigt och fläckigt golv." },
      after: { src: "/gallery/skapbil-efter.jpg", alt: "Efter: samma lastutrymme med rent golv." },
      placeholder: false,
    },
    {
      id: "baksate-invandig",
      title: "Baksäte i tyg",
      category: "interior",
      vehicle: null,
      serviceId: null,
      before: {
        src: "/gallery/baksate-fore.jpg",
        alt: "Före: mörkgrått baksäte i tyg med fläckar på sittdynan och smuts på golv och tröskel.",
      },
      after: { src: "/gallery/baksate-efter.jpg", alt: "Efter: samma baksäte, golv och tröskel rengjorda." },
      placeholder: false,
    },
  ] satisfies GalleryItem[] as GalleryItem[],

  /**
   * Vanliga frågor. Svaren byggs av uppgifterna ovan (priser, tider, krav på
   * plats, betalning, kontakt), så de hålls uppdaterade automatiskt – se
   * `buildFaq()` längre ned om du vill ändra formuleringarna.
   */
  get faq(): Faq[] {
    return buildFaq();
  },
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

/** Upplägg med reseavgift (mobil bilvård, hämtning och lämning). */
export const feeArrangements = site.arrangements.filter(
  (a): a is ArrangementInfo & { id: FeeArrangement } => a.feeApplies && a.id in TRAVEL_FEE,
);

/** Zoner med fast avgift ("Inom ca 5 km", "5–20 km"). */
export const pricedZones = site.travelZones.filter(
  (z): z is TravelZone & { fees: Record<FeeArrangement, number> } => z.fees != null,
);

/**
 * Reseavgiften i kronor för ett upplägg och en zon.
 * 0 = ingen reseavgift (t.ex. när kunden lämnar bilen hos oss).
 * `null` = kan inte räknas ut än (zon ej vald eller "Vet inte") – bekräftas manuellt.
 */
export function travelFee(arrangementId: string | null | undefined, zoneId: string | null | undefined): number | null {
  const arrangement = getArrangement(arrangementId);
  if (!arrangement) return null;
  if (!arrangement.feeApplies) return 0;
  const fees = getTravelZone(zoneId)?.fees;
  return fees ? fees[arrangement.id as FeeArrangement] : null;
}

/** Lägsta reseavgiften för ett upplägg, t.ex. 150 för mobil bilvård och 0 för "Lämna bilen hos oss". */
export function travelFeeFrom(arrangementId: string | null | undefined): number {
  const arrangement = getArrangement(arrangementId);
  if (!arrangement?.feeApplies) return 0;
  return Math.min(...pricedZones.map((z) => z.fees[arrangement.id as FeeArrangement]));
}

/** "Reseavgift från 150 kr" eller "Gratis – ingen reseavgift". */
export function travelFeeFromText(arrangementId: string | null | undefined): string {
  const from = travelFeeFrom(arrangementId);
  return from > 0 ? `Reseavgift från ${formatSEK(from)}` : "Gratis – ingen reseavgift";
}

/** Adress och avstånd behövs bara när vi åker till kunden (mobil bilvård, hämtning och lämning). */
export function arrangementNeedsLocation(arrangementId: string | null | undefined): boolean {
  return !!getArrangement(arrangementId)?.feeApplies;
}

/** "150 kr inom ca 5 km från Kristianstad och 250 kr för 5–20 km" för ett upplägg. */
export function zoneFeesText(arrangementId: FeeArrangement): string {
  return listText(
    pricedZones.map((z, i) =>
      i === 0
        ? `${formatSEK(z.fees[arrangementId])} ${lowerFirst(z.label)}`
        : `${formatSEK(z.fees[arrangementId])} för ${z.shortLabel}`,
    ),
  );
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

/** "09.00" → 540 (minuter efter midnatt). */
function toMinutes(time: string) {
  const [h, m] = time.split(".").map(Number);
  return h * 60 + (m || 0);
}

/** 540 → "09.00". */
function fromMinutes(minutes: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}.${pad(minutes % 60)}`;
}

/**
 * Starttider kunden kan välja i bokningen: varje hel timme från öppning enligt
 * aktuell säsong, plus "Flexibel". Med en vald tjänst visas bara tider då
 * jobbet hinns med före stängning (utifrån tjänstens `maxMinutes`), annars
 * fram till en timme före stängning. Samma regel används i formuläret och på servern.
 */
export function bookingTimes(serviceId?: string | null): string[] {
  const { open, close } = currentHours();
  const length = getService(serviceId)?.maxMinutes ?? 60;
  const closeAt = toMinutes(close);
  const times: string[] = [];
  for (let t = toMinutes(open); t + length <= closeAt; t += 60) times.push(fromMinutes(t));
  return [...times, "Flexibel"];
}

/** Senaste starttiden för en tjänst, t.ex. "16.00". `null` om ingen tid passar. */
export function latestStartTime(serviceId?: string | null): string | null {
  const times = bookingTimes(serviceId).filter((t) => t !== "Flexibel");
  return times[times.length - 1] ?? null;
}

/** Vad en tjänst kräver på plats vid mobil bilvård, t.ex. "Tillgång till vatten och el". */
export function utilityNeed(service: Service): string | null {
  const { water, electricity } = service.onSite;
  if (water && electricity) return "Tillgång till vatten och el";
  if (electricity) return "Tillgång till el";
  if (water) return "Tillgång till vatten";
  return null;
}

/**
 * Vad kunden behöver ordna vid mobil bilvård för en viss tjänst. Utöver det
 * gäller alltid `site.onSite.mat` (miljömattan) vid mobil bilvård.
 */
export function onSiteNeeds(serviceId: string | null | undefined): string[] {
  const service = getService(serviceId);
  const needs: string[] = [];
  const utility = service ? utilityNeed(service) : null;
  if (utility) needs.push(utility);
  needs.push(site.onSite.parking);
  return needs;
}

/** "a", "a och b", "a, b och c". */
function listText(items: string[], conjunction = "och") {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** ["Swish", "Kontanter"] → "Swish eller kontanter". */
export function paymentMethodsText(methods: readonly string[] = site.payment.methods) {
  return listText(
    methods.map((m, i) => (i === 0 ? m : lowerFirst(m))),
    "eller",
  );
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
  { href: "/recensioner", label: "Recensioner" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/vanliga-fragor", label: "Vanliga frågor" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

/**
 * Svaren på vanliga frågor. Allt som är fakta (priser, tider, krav på plats,
 * betalning, svarstid, kontakt) hämtas från `site` ovan, så ändringar där
 * slår igenom här och i FAQ-datan till Google utan att något behöver skrivas om.
 */
function buildFaq(): Faq[] {
  const { services, onSite, contact } = site;
  const dropoff = getArrangement("dropoff");

  const timed = services.filter((s) => s.duration);

  // Gruppera tjänsterna efter vad de kräver på plats ("vatten och el", "el").
  const byNeed = new Map<string, string[]>();
  for (const s of services) {
    const need = utilityNeed(s);
    if (need) byNeed.set(need, [...(byNeed.get(need) ?? []), lowerFirst(s.name)]);
  }

  const socials = socialLinks.filter((l) => l.href).map((l) => l.label);
  const otherWays = [
    contact.phone ? `ringa eller sms:a oss på ${contact.phone}` : null,
    socials.length ? `skriva till oss på ${listText(socials, "eller")}` : null,
  ].filter((x): x is string => !!x);

  return [
    {
      id: "vad-ingar",
      question: "Vad ingår i de olika tjänsterna?",
      answer: services
        .map((s) => `${s.name} (${formatSEK(s.price)}): ${listText(s.includes.map(lowerFirst))}.`)
        .join(" "),
    },
    {
      id: "hur-lang-tid",
      question: "Hur lång tid tar en rengöring?",
      answer: timed.length
        ? `Ungefärlig tidsåtgång: ${listText(timed.map((s) => `${lowerFirst(s.name)} ${s.duration}`))}. ${site.durationNote}`
        : null,
      placeholderHint: "Ange ungefärlig tid per tjänst (duration i site.ts).",
    },
    {
      id: "mobil-service",
      question: "Hur fungerar mobil bilvård?",
      answer: `${getArrangement("visit")?.description ?? ""} Då tillkommer en reseavgift: ${zoneFeesText("visit")}. Skriv adressen i bokningsförfrågan så bekräftar vi avgiften.`.trim(),
    },
    {
      id: "mobil-krav",
      question: "Vad behöver finnas på plats när ni kommer till mig?",
      answer: [
        ...Array.from(byNeed, ([need, names]) => `För ${listText(names)} behöver vi ${lowerFirst(need)}.`),
        `Vi behöver också ${lowerFirst(onSite.parking)}`,
        onSite.mat,
        `Saknar du något av detta? ${onSite.atOurPlaceNote}`,
      ].join(" "),
    },
    {
      id: "hamtning",
      question: "Hur fungerar hämtning och lämning?",
      answer: `${getArrangement("pickup")?.description ?? ""} Du behöver inte ordna vatten, el eller tvättplats. Reseavgiften är ${zoneFeesText("pickup")}. Tider och nyckelöverlämning bestämmer vi när vi bekräftar bokningen.`.trim(),
    },
    ...(dropoff
      ? [
          {
            id: "lamna-bilen",
            question: "Kan jag lämna bilen hos er?",
            answer: `Ja. ${dropoff.description} Det kostar ingen reseavgift och du behöver inte ordna vatten, el eller tvättplats. ${onSite.dropoffHandover}`,
          },
        ]
      : []),
    {
      id: "extra-smutsig",
      question: "Vad händer om bilen är extra smutsig?",
      answer: site.extraWorkNote,
    },
    {
      id: "boka",
      question: "Hur bokar jag?",
      answer: `Fyll i bokningsförfrågan här på sidan. Välj tjänst, dag och tid och om vi ska komma till dig, hämta bilen eller om du lämnar den hos oss. En förfrågan är inte en bekräftad bokning – vi bekräftar tid och pris innan bokningen gäller. ${site.responseTime}`,
    },
    {
      id: "betalning",
      question: "Hur betalar jag?",
      answer: `Du kan betala med ${paymentMethodsText()}. ${site.payment.when}`,
    },
    {
      id: "arbetstider",
      question: "När jobbar ni?",
      answer: `Vi jobbar ${site.hours.days.toLowerCase()} i veckan: ${hoursText("summer")} under den varmare delen av året och ${hoursText("winter")} under vinterhalvåret.`,
    },
    {
      id: "svarstid",
      question: "Hur snabbt svarar ni?",
      answer: `${site.responseTime} Ofta svarar vi direkt.`,
    },
    {
      id: "kontakt",
      question: "Hur kontaktar jag er?",
      answer: `Enklast är att skicka en bokningsförfrågan här på sidan.${otherWays.length ? ` Du kan också ${listText(otherWays, "eller")}.` : ""}`,
    },
    {
      id: "omrade",
      question: "Vilka områden åker ni till?",
      answer: `Vi utgår från ${site.baseTown} och åker upp till ca ${TRAVEL_KM.max} km därifrån. Reseavgiften vid mobil bilvård är ${zoneFeesText("visit")}. Vid hämtning och lämning är den ${zoneFeesText("pickup")}. Lämnar du bilen hos oss tillkommer ingen reseavgift.`,
    },
  ];
}
