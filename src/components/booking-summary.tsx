/**
 * Prisöversikt för bokningsförfrågan. Visas i en fast sidokolumn på dator och
 * direkt ovanför skicka-knappen på mobil, så att pris och reseavgift alltid
 * syns innan kunden skickar. Allt innehåll kommer från src/config/site.ts.
 */
import { site } from "@/config/site";
import type { priceSummary } from "@/lib/booking";
import { formatSEK } from "@/lib/format";

export type Price = ReturnType<typeof priceSummary>;

/** "cirka 60 minuter" → "Cirka 60 minuter". */
export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Första meningen i en text, t.ex. kortversionen av `site.durationNote`. */
export function firstSentence(text: string) {
  return text.split(/(?<=[.!?])\s+/)[0] ?? text;
}

/** ["Swish", "Kontanter"] → "Swish eller kontanter". */
export function paymentMethodsText(methods: readonly string[] = site.payment.methods) {
  const items = methods.map((m, i) => (i === 0 ? m : m.charAt(0).toLowerCase() + m.slice(1)));
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} eller ${items[items.length - 1]}`;
}

/** Reseavgiften som text för vald zon, eller vad som återstår att välja. */
export function travelFeeText(price: Price) {
  const { arrangement, zone } = price;
  if (!arrangement) return `Från ${formatSEK(site.travelFeeFrom)}`;
  if (!arrangement.feeApplies) return "Ingen";
  if (price.feeKnown) return `+${formatSEK(price.fee)}`;
  return zone ? "Bekräftas" : "Välj avstånd";
}

export function PriceSummary({ price, title = "Din förfrågan" }: { price: Price; title?: string }) {
  const { service, arrangement, zone } = price;
  const feeDetail = arrangement
    ? [arrangement.label, zone?.label].filter(Boolean).join(" · ")
    : `Beror på avståndet från ${site.baseTown}`;

  return (
    <div className="rounded-2xl border border-white/15 bg-ink-850 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist-400">{title}</p>

      <dl className="mt-4 space-y-3 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="min-w-0 text-mist-300">{service ? service.name : "Ingen tjänst vald"}</dt>
          <dd className="shrink-0 font-semibold text-white">{service ? formatSEK(price.base) : "–"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="min-w-0 text-mist-300">
            Reseavgift
            <span className="block text-xs text-mist-400">{feeDetail}</span>
          </dt>
          <dd className="shrink-0 font-semibold text-white">{travelFeeText(price)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="min-w-0 text-mist-300">Ungefärlig tid</dt>
          <dd className="shrink-0 text-right font-semibold text-white">
            {service?.duration ? capitalize(service.duration) : "–"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
          <dt className="font-semibold text-white">Preliminärt pris</dt>
          <dd className="shrink-0 text-right font-display text-2xl font-extrabold text-white">
            {service ? formatSEK(price.total) : "–"}
            {service && !price.feeKnown && (
              <span className="block text-xs font-semibold text-mist-400">+ reseavgift</span>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium leading-relaxed text-mist-100">
        Priset och tiden bekräftas när vi har gått igenom förfrågan.
      </p>

      <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-mist-400">
        <li>
          <span className="font-semibold text-mist-200">Reseavgift</span> tillkommer utöver priset för tjänsten:
          <ul className="mt-1 space-y-0.5">
            {site.travelZones
              .filter((z) => z.fee != null)
              .map((z) => (
                <li key={z.id} className="flex justify-between gap-3">
                  <span className="min-w-0">{z.label}</span>
                  <span className="shrink-0 font-semibold text-mist-200">{formatSEK(z.fee!)}</span>
                </li>
              ))}
          </ul>
        </li>
        <li>{firstSentence(site.durationNote)}</li>
        <li>{site.extraWorkNote}</li>
        <li>
          <span className="font-semibold text-mist-200">Betalning:</span> {paymentMethodsText()}. {site.payment.when}
        </li>
      </ul>
    </div>
  );
}
