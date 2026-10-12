import { site, type Service } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { BookingButton } from "@/components/booking-button";
import { CheckIcon, Icon, InfoCard } from "@/components/ui";
import { TravelFeeZones } from "@/components/travel-fees";
import { UtilityIcons, utilitiesLabel } from "@/components/on-site-info";
import { paymentMethodsText } from "@/components/payment-info";

/** "cirka 60 minuter" → "Cirka 60 minuter". */
function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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
  // Kombinationen jämförs med att boka de två delarna var för sig (räknas från priserna i site.ts).
  const separate = site.services
    .filter((s) => s.id === "exterior" || s.id === "interior")
    .reduce((sum, s) => sum + s.price, 0);
  const saving = service.id === "complete" ? separate - service.price : 0;

  return (
    <article
      className={`relative flex w-full flex-col rounded-2xl border p-6 transition-colors duration-300 sm:p-7 ${
        service.highlighted
          ? "border-white/30 bg-gradient-to-b from-white/[0.09] to-white/[0.02]"
          : "border-white/10 bg-ink-850 hover:border-white/20"
      }`}
    >
      {service.highlighted && saving > 0 && (
        <p className="absolute -top-3 left-6 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black sm:left-7">
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
      {saving > 0 && (
        <p className="mt-1 text-sm text-mist-300">{formatSEK(saving)} billigare än att boka delarna var för sig</p>
      )}
      <p className="mt-1 text-sm text-mist-400">+ reseavgift från {formatSEK(site.travelFeeFrom)}</p>

      {service.duration && (
        <p className="mt-5 flex items-center gap-2 text-sm text-mist-200">
          <Icon name="clock" className="size-4 shrink-0 text-white" />
          <span>
            {capitalize(service.duration)} <span className="text-mist-400">(uppskattad tid)</span>
          </span>
        </p>
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
      </div>

      <p className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-mist-300">
        <UtilityIcons service={service} />
        <span>
          Vid mobil bilvård behövs: <span className="font-semibold text-white">{utilitiesLabel(service).toLowerCase()}</span>
        </span>
      </p>

      <BookingButton
        location={`service_card_${service.id}`}
        service={service.id}
        variant={service.highlighted ? "primary" : "secondary"}
        size="md"
        className="mt-6 w-full"
      >
        Boka {service.shortName.toLowerCase()}
      </BookingButton>
    </article>
  );
}

/** Tidsåtgång och extraarbete (och ev. betalning) – gäller alla tjänster. */
export function ServiceNotes({
  titleAs = "h3",
  showPayment = false,
  className = "",
}: {
  titleAs?: "h2" | "h3" | "p";
  showPayment?: boolean;
  className?: string;
}) {
  return (
    <InfoCard icon="info" title="Bra att veta" titleAs={titleAs} className={className}>
      <div className="space-y-4 text-sm leading-relaxed text-mist-300">
        <p>
          <strong className="block font-semibold text-white">Extra smutsig bil?</strong>
          {site.extraWorkNote}
        </p>
        <p>
          <strong className="block font-semibold text-white">Tiderna är uppskattningar</strong>
          {site.durationNote}
        </p>
        {showPayment && (
          <p>
            <strong className="block font-semibold text-white">Betalning</strong>
            {paymentMethodsText()}. {site.payment.when}
          </p>
        )}
      </div>
    </InfoCard>
  );
}

/** Reseavgift + villkor – visas direkt under tjänstekorten. */
export function PricingTerms({ titleAs = "h3", showPayment = true }: { titleAs?: "h2" | "h3" | "p"; showPayment?: boolean }) {
  return (
    <div className="reveal grid gap-5 md:grid-cols-2">
      <TravelFeeZones titleAs={titleAs} />
      <ServiceNotes titleAs={titleAs} showPayment={showPayment} />
    </div>
  );
}
