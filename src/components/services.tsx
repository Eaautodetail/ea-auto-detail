import { site, type Service } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { BookingButton } from "@/components/booking-button";
import { CheckIcon, Placeholder } from "@/components/ui";

export function ServiceCards({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {site.services.map((service) => (
        <li key={service.id} className="reveal flex">
          <ServiceCard service={service} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

function ServiceCard({ service, headingLevel: H }: { service: Service; headingLevel: "h2" | "h3" }) {
  const separate = site.services
    .filter((s) => s.id === "exterior" || s.id === "interior")
    .reduce((sum, s) => sum + s.price, 0);
  const saving = service.id === "complete" ? separate - service.price : 0;

  return (
    <article
      className={`relative flex w-full flex-col rounded-2xl border p-7 transition-colors duration-300 ${
        service.highlighted
          ? "border-white/30 bg-gradient-to-b from-white/[0.09] to-white/[0.02]"
          : "border-white/10 bg-ink-850 hover:border-white/20"
      }`}
    >
      {service.highlighted && (
        <p className="absolute -top-3 left-7 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
          Mest prisvärt
        </p>
      )}
      <H className="font-display text-xl font-bold text-white">{service.name}</H>
      <p className="mt-2 text-sm leading-relaxed text-mist-300">{service.summary}</p>

      <p className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-5xl font-extrabold tracking-tight text-white">
          {formatSEK(service.price).replace(/\s?kr$/, "")}
        </span>
        <span className="text-lg font-semibold text-mist-300">kr</span>
      </p>
      {saving > 0 ? (
        <p className="mt-1 text-sm text-mist-400">Spara {formatSEK(saving)} jämfört med att boka var för sig</p>
      ) : (
        <p className="mt-1 text-sm text-mist-400">Grundpris</p>
      )}

      <div className="mt-6 flex-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-mist-400">Det här ingår</p>
        <ul className="space-y-2.5 text-sm text-mist-200">
          {service.includes.map((item) => (
            <li key={item} className="flex gap-2.5">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-white" />
              {item}
            </li>
          ))}
        </ul>
        {!service.includesConfirmed && site.showPlaceholders && (
          <Placeholder className="mt-4 text-xs">Bekräfta vad som ingår</Placeholder>
        )}
        <p className="mt-4 text-sm text-mist-400">
          Tidsåtgång:{" "}
          {service.duration ?? (site.showPlaceholders ? <Placeholder className="text-xs">ca X min</Placeholder> : "enligt överenskommelse")}
        </p>
      </div>

      <BookingButton
        location={`service_card_${service.id}`}
        service={service.id}
        variant={service.highlighted ? "primary" : "secondary"}
        size="md"
        className="mt-7 w-full"
      >
        Boka {service.shortName.toLowerCase()}
      </BookingButton>
    </article>
  );
}

/** Villkor kring mobil serviceavgift och extraarbete – visas nära priserna. */
export function PricingTerms({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`reveal grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
      <div className="rounded-2xl border border-white/10 bg-ink-900 p-6">
        <p className="flex items-baseline justify-between gap-4">
          <span className="font-display text-lg font-bold text-white">Mobil serviceavgift</span>
          <span className="font-display text-lg font-bold text-white">+{formatSEK(site.mobileFee)}</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          Tillkommer när vi <strong className="font-semibold text-white">åker till dig</strong> eller{" "}
          <strong className="font-semibold text-white">hämtar och lämnar bilen</strong>. Väljer du ett annat upplägg
          kommer vi överens om villkoren innan bokningen bekräftas.
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-ink-900 p-6">
        <p className="font-display text-lg font-bold text-white">Extra smutsigt? Du godkänner först.</p>
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          Väldigt smutsiga bilar, svåra fläckar eller jobb som kräver extra arbete kan kosta mer. Då får du ett
          prisförslag först – vi börjar aldrig med extraarbetet innan du har godkänt kostnaden.
        </p>
      </div>
    </div>
  );
}
