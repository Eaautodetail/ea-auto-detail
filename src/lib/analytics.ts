/**
 * Händelsespårning – medvetet AVSTÄNGD tills ett analysverktyg och en
 * samtyckeslösning (cookie-banner) har kopplats in.
 *
 * Alla viktiga händelser på sajten går genom `track()`. I dag gör funktionen
 * bara två saker:
 *  1. skickar ett `ea:track`-event på `window` (utan persondata), så att ett
 *     framtida analysverktyg eller en marknadsföringsagent kan lyssna på det,
 *  2. loggar händelsen i konsolen under utveckling.
 *
 * När ni har valt verktyg (t.ex. Plausible, GA4 eller Meta Pixel) och har
 * samtycke på plats: skicka vidare händelsen i `sendToProvider` nedan, och
 * bara om `hasAnalyticsConsent()` returnerar true.
 */

export type TrackEvent =
  | "booking_cta_click"
  | "booking_request_submitted"
  | "booking_request_failed"
  | "social_link_click"
  | "contact_click";

type Props = Record<string, string | number | boolean | undefined>;

function hasAnalyticsConsent(): boolean {
  // Ingen samtyckeslösning finns än → inget samtycke.
  return false;
}

function sendToProvider(event: TrackEvent, props: Props) {
  // Koppla in analysverktyget här när det finns, t.ex.:
  // window.plausible?.(event, { props });
  void event;
  void props;
}

export function track(event: TrackEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ea:track", { detail: { event, props } }));
  if (process.env.NODE_ENV === "development") {
    console.debug("[track]", event, props);
  }
  if (hasAnalyticsConsent()) sendToProvider(event, props);
}
