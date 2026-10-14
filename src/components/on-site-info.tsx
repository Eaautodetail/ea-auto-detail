/**
 * "Hos dig eller hos oss?" – vad som gäller för respektive upplägg.
 * Allt läses från `site.arrangements`, `site.services[].onSite` och
 * `site.onSite` i src/config/site.ts.
 */
import { getArrangement, pricedZones, site, travelFeeFromText, type FeeArrangement, type Service } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { CheckIcon, Icon, IconBadge, type IconName } from "@/components/ui";

/** Vad en tjänst kräver på plats vid mobil bilvård, t.ex. "Vatten och el". */
export function utilitiesLabel(service: Service) {
  const { water, electricity } = service.onSite;
  if (water && electricity) return "Vatten och el";
  if (electricity) return "El";
  if (water) return "Vatten";
  return "Inget särskilt";
}

/** Ikoner för vatten/el, i samma ordning som texten. */
export function UtilityIcons({ service, className = "size-4" }: { service: Service; className?: string }) {
  const icons: IconName[] = [];
  if (service.onSite.water) icons.push("drop");
  if (service.onSite.electricity) icons.push("bolt");
  return (
    <span className="inline-flex shrink-0 gap-0.5 text-mist-200" aria-hidden="true">
      {icons.map((name) => (
        <Icon key={name} name={name} className={className} />
      ))}
    </span>
  );
}

/** Reseavgiften för ett upplägg, t.ex. "inom ca 5 km 150 kr · 5–20 km 250 kr". */
function FeeFootnote({ arrangement }: { arrangement: FeeArrangement | null }) {
  return (
    <p className="mt-6 border-t border-white/10 pt-4 text-sm text-mist-300">
      Reseavgift:{" "}
      {arrangement ? (
        pricedZones.map((z, i) => (
          <span key={z.id}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">
              {z.shortLabel.toLowerCase()}{" "}
              <strong className="font-semibold text-white">{formatSEK(z.fees[arrangement])}</strong>
            </span>
          </span>
        ))
      ) : (
        <strong className="font-semibold text-white">gratis</strong>
      )}
    </p>
  );
}

export function ArrangementComparison({ headingLevel: H = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const visit = getArrangement("visit");
  const pickup = getArrangement("pickup");
  const dropoff = getArrangement("dropoff");

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {visit && (
        <article className="reveal flex flex-col rounded-2xl border border-white/15 bg-ink-850 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <IconBadge name="pin" />
            <div>
              <H className="font-display text-xl font-bold text-white">{visit.label}</H>
              <p className="text-sm text-mist-400">Vi kommer till dig</p>
            </div>
          </div>
          <p className="mt-4 leading-relaxed text-mist-200">{visit.description}</p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-mist-400">
            Det här behöver finnas på plats
          </p>
          <dl className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 bg-ink-900 text-sm">
            {site.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="min-w-0 text-mist-200">{s.name}</dt>
                <dd className="flex shrink-0 items-center gap-2 font-semibold text-white">
                  <UtilityIcons service={s} />
                  {utilitiesLabel(s)}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-mist-200">
            <li className="flex items-start gap-3">
              <Icon name="parking" className="mt-0.5 size-5 shrink-0 text-white" />
              <span>{site.onSite.parking}</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="layers" className="mt-0.5 size-5 shrink-0 text-white" />
              <span>{site.onSite.mat}</span>
            </li>
          </ul>
          <div className="mt-auto">
            <FeeFootnote arrangement="visit" />
          </div>
        </article>
      )}

      {pickup && (
        <article className="reveal flex flex-col rounded-2xl border border-white/15 bg-ink-850 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <IconBadge name="swap" />
            <div>
              <H className="font-display text-xl font-bold text-white">{pickup.label}</H>
              <p className="text-sm text-mist-400">Vi gör jobbet hos oss</p>
            </div>
          </div>
          <p className="mt-4 leading-relaxed text-mist-200">{pickup.description}</p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-mist-400">
            Det här slipper du
          </p>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900 p-4 text-sm leading-relaxed text-mist-200">
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-black"
            >
              <CheckIcon className="size-3.5" />
            </span>
            <span>{site.onSite.pickupNote}</span>
          </div>
          <div className="mt-auto">
            <FeeFootnote arrangement="pickup" />
          </div>
        </article>
      )}

      {dropoff && (
        <article className="reveal flex flex-col rounded-2xl border border-white/15 bg-ink-850 p-6 sm:p-8 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <IconBadge name="parking" />
            <div>
              <H className="font-display text-xl font-bold text-white">{dropoff.label}</H>
              <p className="text-sm text-mist-400">Du lämnar, vi tvättar</p>
            </div>
          </div>
          <p className="mt-4 leading-relaxed text-mist-200">{dropoff.description}</p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-mist-400">
            Det här slipper du
          </p>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900 p-4 text-sm leading-relaxed text-mist-200">
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-black"
            >
              <CheckIcon className="size-3.5" />
            </span>
            <span>{site.onSite.dropoffNote}</span>
          </div>
          <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-mist-200">
            <Icon name="info" className="mt-0.5 size-5 shrink-0 text-white" />
            <span>{site.onSite.dropoffHandover}</span>
          </p>
          <div className="mt-auto">
            <FeeFootnote arrangement={null} />
          </div>
        </article>
      )}

      <BelongingsNote className="reveal md:col-span-2 lg:col-span-3" />
    </div>
  );
}

/** Gäller alla upplägg: töm bilen innan vi börjar. */
export function BelongingsNote({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6 ${className}`}>
      <IconBadge name="info" />
      <div>
        <p className="font-display text-lg font-bold text-white">{site.onSite.belongings.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-mist-200 sm:text-base">{site.onSite.belongings.text}</p>
      </div>
    </div>
  );
}

/** Kompakt version av "Hos dig eller hos oss?" för startsidan. */
export function ArrangementTiles() {
  const icons: Record<string, IconName> = { visit: "pin", pickup: "swap", dropoff: "parking" };
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {site.arrangements.map((a) => (
        <li key={a.id} className="reveal flex items-start gap-4 rounded-2xl border border-white/10 bg-ink-850 p-5">
          <IconBadge name={icons[a.id] ?? "pin"} />
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-white">{a.label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist-300">{a.description}</p>
            <p className="mt-2 text-sm font-semibold text-white">{travelFeeFromText(a.id)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
