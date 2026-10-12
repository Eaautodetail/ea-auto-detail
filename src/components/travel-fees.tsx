/**
 * Reseavgifter och totalpriser. Allt läses från `site.travelZones`,
 * `site.services` och `site.arrangements` i src/config/site.ts.
 */
import { site, type TravelZone } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { Icon, InfoCard } from "@/components/ui";

type PricedZone = TravelZone & { fee: number };

/** Zoner med fast avgift (150 kr, 250 kr …). */
export const feeZones = site.travelZones.filter((z): z is PricedZone => z.fee != null);

/** Zonen där avgiften bekräftas manuellt ("Vet inte"). */
const manualZone = site.travelZones.find((z) => z.fee == null);

/** "Inom ca 5 km från Kristianstad" → "Inom ca 5 km" (för smala tabellrubriker). */
export function shortZoneLabel(zone: TravelZone) {
  const suffix = ` från ${site.baseTown}`;
  return zone.label.endsWith(suffix) ? zone.label.slice(0, -suffix.length) : zone.label;
}

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** "vid mobil bilvård och vid hämtning och lämning" – de upplägg där reseavgiften gäller. */
export function feeArrangementsText() {
  return site.arrangements
    .filter((a) => a.feeApplies)
    .map((a) => `vid ${a.label.toLowerCase()}`)
    .join(" och ");
}

/** Reseavgiftens zoner med avstånd, exempelort och pris. */
export function TravelFeeZones({ titleAs = "h3", className = "" }: { titleAs?: "h2" | "h3" | "p"; className?: string }) {
  return (
    <InfoCard icon="pin" title="Reseavgift" titleAs={titleAs} className={className}>
      <p className="text-sm leading-relaxed text-mist-300">
        Tillkommer utöver priset för tjänsten, {feeArrangementsText()}. Avståndet räknas från {site.baseTown}.
      </p>
      <ul className="mt-5 space-y-3">
        {feeZones.map((z) => (
          <li
            key={z.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-ink-900 px-4 py-3.5"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-white">{z.label}</span>
              <span className="block text-sm text-mist-400">{z.description}</span>
            </span>
            <span className="font-display shrink-0 text-2xl font-extrabold tracking-tight text-white">
              {formatSEK(z.fee)}
            </span>
          </li>
        ))}
      </ul>
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
      </p>
    </InfoCard>
  );
}

/** Totalpris per tjänst och resezon (tjänst + reseavgift). */
export function PriceTable({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <div id={id} className={`scroll-mt-28 ${className}`}>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[18.5rem] text-left text-sm">
          <caption className="sr-only">
            Totalpris per tjänst inklusive reseavgift, beroende på avståndet från {site.baseTown}
          </caption>
          <thead className="bg-ink-800 text-xs uppercase tracking-wider text-mist-400">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-semibold sm:px-5">
                Tjänst
              </th>
              {feeZones.map((z) => (
                <th key={z.id} scope="col" className="px-3 py-3.5 text-right align-bottom font-semibold sm:px-5">
                  <span className="block text-mist-200">{shortZoneLabel(z)}</span>
                  <span className="mt-0.5 block font-normal normal-case tracking-normal">
                    +{formatSEK(z.fee)} resa
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-ink-850">
            {site.services.map((s) => (
              <tr key={s.id}>
                <th scope="row" className="px-4 py-4 font-semibold text-white sm:px-5">
                  {s.name}
                  <span className="mt-0.5 block text-xs font-normal text-mist-400">Tjänst {formatSEK(s.price)}</span>
                </th>
                {feeZones.map((z) => (
                  <td
                    key={z.id}
                    className="font-display whitespace-nowrap px-3 py-4 text-right text-base font-bold text-white sm:px-5 sm:text-lg"
                  >
                    {formatSEK(s.price + z.fee)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-mist-400">
        Totalpris = tjänst + reseavgift. {feeZones.map((z) => `${shortZoneLabel(z)}: ${z.description}`).join(" ")}{" "}
        Gäller utan eventuellt extraarbete.
      </p>
    </div>
  );
}
