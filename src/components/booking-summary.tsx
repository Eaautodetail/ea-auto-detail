/**
 * Prisöversikt för bokningsförfrågan. Visas i en fast sidokolumn på dator och
 * direkt ovanför skicka-knappen på mobil, så att pris och reseavgift alltid
 * syns innan kunden skickar. Allt innehåll kommer från src/config/site.ts.
 */
import { paymentMethodsText, pricedZones, site, travelFeeFrom, type FeeArrangement } from "@/config/site";
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

/** ["Swish", "Kontanter"] → "Swish eller kontanter" (definieras i site.ts). */
export { paymentMethodsText };

/** Reseavgiften som text för vald zon, eller vad som återstår att välja. */
export function travelFeeText(price: Price) {
  const { arrangement, zone } = price;
  if (!arrangement) return "Beror på upplägget";
  if (!arrangement.feeApplies) return "Gratis";
  if (price.feeKnown) return `+${formatSEK(price.fee)}`;
  return zone ? "Bekräftas" : "Välj avstånd";
}

export function PriceSummary({ price, title = "Din förfrågan" }: { price: Price; title?: string }) {
  const { service, arrangement, zone } = price;
  const feeDetail = arrangement
    ? [arrangement.label, zone?.label].filter(Boolean).join(" · ")
    : "Välj var vi ska ta hand om bilen";

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
          {arrangement && !arrangement.feeApplies ? (
            <>
              <span className="font-semibold text-mist-200">Reseavgift</span> tillkommer inte när du lämnar bilen hos oss.
            </>
          ) : (
            <>
              <span className="font-semibold text-mist-200">Reseavgift</span> tillkommer utöver priset för tjänsten
              {arrangement ? ` (${arrangement.label.toLowerCase()})` : ""}:
            </>
          )}
          {arrangement && !arrangement.feeApplies ? null : arrangement ? (
            <ul className="mt-1 space-y-0.5">
              {pricedZones.map((z) => (
                <li key={z.id} className="flex justify-between gap-3">
                  <span className="min-w-0">{z.label}</span>
                  <span className="shrink-0 font-semibold text-mist-200">
                    {formatSEK(z.fees[arrangement.id as FeeArrangement])}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {site.arrangements.map((a) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="min-w-0">{a.label}</span>
                  <span className="shrink-0 font-semibold text-mist-200">
                    {a.feeApplies ? `från ${formatSEK(travelFeeFrom(a.id))}` : "Gratis"}
                  </span>
                </li>
              ))}
            </ul>
          )}
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

/**
 * Kort prisrad direkt ovanför skicka-knappen på större skärmar, där den fasta
 * sammanfattningen i sidokolumnen kan hamna delvis under sidhuvudet.
 */
export function PriceLine({ price }: { price: Price }) {
  const { service } = price;
  return (
    <dl className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 rounded-xl border border-white/15 bg-ink-850 px-5 py-4 text-sm">
      <div className="min-w-0">
        <dt className="text-mist-400">Tjänst</dt>
        <dd className="font-semibold text-white">
          {service ? (
            <>
              {service.name} <span className="whitespace-nowrap">· {formatSEK(price.base)}</span>
            </>
          ) : (
            "Ingen tjänst vald"
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-mist-400">Reseavgift</dt>
        <dd className="font-semibold text-white">{travelFeeText(price)}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-mist-400">Preliminärt pris</dt>
        <dd className="font-display text-xl font-extrabold text-white">
          {service ? formatSEK(price.total) : "–"}
          {service && !price.feeKnown && <span className="block text-xs font-semibold text-mist-400">+ reseavgift</span>}
        </dd>
      </div>
    </dl>
  );
}
