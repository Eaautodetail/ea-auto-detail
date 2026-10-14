/**
 * Reseavgifter och totalpriser. Allt läses från `site.travelZones`,
 * `site.services` och `site.arrangements` i src/config/site.ts
 * (beloppen står i TRAVEL_FEE överst i den filen).
 */
import { pricedZones, site, type ArrangementInfo, type FeeArrangement } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { Icon, InfoCard } from "@/components/ui";

/** Zonen där avgiften bekräftas manuellt ("Vet inte"). */
const manualZone = site.travelZones.find((z) => z.fees == null);

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Reseavgiften för ett upplägg i en zon (bara upplägg med reseavgift). */
function zoneFee(arrangement: ArrangementInfo, zone: (typeof pricedZones)[number]) {
  return zone.fees[arrangement.id as FeeArrangement];
}

/** "vid mobil bilvård och vid hämtning och lämning" – de upplägg där reseavgiften gäller. */
export function feeArrangementsText() {
  return site.arrangements
    .filter((a) => a.feeApplies)
    .map((a) => `vid ${a.label.toLowerCase()}`)
    .join(" och ");
}

/** "Lämna bilen hos oss" – upplägg utan reseavgift. */
const freeArrangements = site.arrangements.filter((a) => !a.feeApplies);

/** Reseavgift per upplägg och avstånd, som tabell. */
export function TravelFeeZones({ titleAs = "h3", className = "" }: { titleAs?: "h2" | "h3" | "p"; className?: string }) {
  return (
    <InfoCard icon="pin" title="Reseavgift" titleAs={titleAs} className={className}>
      <p className="text-sm leading-relaxed text-mist-300">
        Tillkommer utöver priset för tjänsten, {feeArrangementsText()}. Avståndet räknas från {site.baseTown}.
        {freeArrangements.length > 0 && (
          <> Väljer du {freeArrangements.map((a) => `”${a.label}”`).join(" eller ")} tillkommer ingen reseavgift.</>
        )}
      </p>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Reseavgift per upplägg och avstånd från {site.baseTown}</caption>
          <thead className="bg-ink-800 text-xs uppercase tracking-wider text-mist-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Upplägg</span>
              </th>
              {pricedZones.map((z) => (
                <th key={z.id} scope="col" className="px-3 py-3 text-right align-bottom font-semibold text-mist-200 sm:px-4">
                  {z.shortLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-ink-900">
            {site.arrangements.map((a) => (
              <tr key={a.id}>
                <th scope="row" className="px-4 py-3.5 font-semibold text-white">
                  {a.label}
                </th>
                {a.feeApplies ? (
                  pricedZones.map((z) => (
                    <td
                      key={z.id}
                      className="font-display whitespace-nowrap px-3 py-3.5 text-right text-lg font-extrabold tracking-tight text-white sm:px-4"
                    >
                      {formatSEK(zoneFee(a, z))}
                    </td>
                  ))
                ) : (
                  <td
                    colSpan={pricedZones.length}
                    className="font-display px-3 py-3.5 text-right text-lg font-extrabold tracking-tight text-white sm:px-4"
                  >
                    Gratis
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {manualZone && (
        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-mist-300">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          <span>
            Osäker på avståndet? Välj ”{manualZone.label}” när du bokar och skriv din adress –{" "}
            {lowerFirst(manualZone.description)}
          </span>
        </p>
      )}
      <p className="mt-2 text-sm text-mist-400">
        Vi åker upp till ca {site.travelMaxKm} km från {site.baseTown}.
        {freeArrangements.length > 0 && <> {site.onSite.dropoffHandover}</>}
      </p>
    </InfoCard>
  );
}

/** Totalpris per upplägg, tjänst och resezon (tjänst + reseavgift). */
export function PriceTable({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <div id={id} className={`scroll-mt-28 ${className}`}>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[18.5rem] text-left text-sm">
          <caption className="sr-only">
            Totalpris per upplägg och tjänst inklusive reseavgift, beroende på avståndet från {site.baseTown}
          </caption>
          <thead className="bg-ink-800 text-xs uppercase tracking-wider text-mist-400">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-semibold sm:px-5">
                Tjänst
              </th>
              {pricedZones.map((z) => (
                <th key={z.id} scope="col" className="px-3 py-3.5 text-right align-bottom font-semibold text-mist-200 sm:px-5">
                  {z.shortLabel}
                </th>
              ))}
            </tr>
          </thead>
          {site.arrangements.map((a) => (
            <tbody key={a.id} className="divide-y divide-white/10 border-t border-white/10 bg-ink-850">
              <tr className="bg-ink-900">
                <th
                  scope="rowgroup"
                  colSpan={pricedZones.length + 1}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-mist-300 sm:px-5"
                >
                  {a.label}
                  <span className="ml-2 font-normal normal-case tracking-normal text-mist-400">
                    {a.feeApplies
                      ? `reseavgift ${pricedZones.map((z) => formatSEK(zoneFee(a, z))).join(" / ")}`
                      : "ingen reseavgift"}
                  </span>
                </th>
              </tr>
              {site.services.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="px-4 py-3.5 font-semibold text-white sm:px-5">
                    {s.name}
                    <span className="sr-only">, {lowerFirst(a.label)}</span>
                  </th>
                  {a.feeApplies ? (
                    pricedZones.map((z) => (
                      <td
                        key={z.id}
                        className="font-display whitespace-nowrap px-3 py-3.5 text-right text-base font-bold text-white sm:px-5 sm:text-lg"
                      >
                        {formatSEK(s.price + zoneFee(a, z))}
                      </td>
                    ))
                  ) : (
                    <td
                      colSpan={pricedZones.length}
                      className="font-display whitespace-nowrap px-3 py-3.5 text-right text-base font-bold text-white sm:px-5 sm:text-lg"
                    >
                      {formatSEK(s.price)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="mt-3 text-sm text-mist-400">
        Totalpris = tjänst + reseavgift. Priserna gäller personbil – för SUV och skåpbil gäller priserna i tabellen
        ”Pris per fordonstyp”. Avståndet räknas från {site.baseTown}. Gäller utan eventuellt extraarbete.
      </p>
    </div>
  );
}
