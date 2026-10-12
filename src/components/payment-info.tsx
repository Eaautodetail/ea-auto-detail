/** Betalning – läses från `site.payment` i src/config/site.ts. */
import { paymentMethodsText, site } from "@/config/site";
import { InfoCard } from "@/components/ui";

/** ["Swish", "Kontanter"] → "Swish eller kontanter" (definieras i site.ts). */
export { paymentMethodsText };

export function PaymentMethodChips({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Betalningssätt">
      {site.payment.methods.map((m) => (
        <li
          key={m}
          className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-sm font-semibold text-white"
        >
          {m}
        </li>
      ))}
    </ul>
  );
}

export function PaymentInfo({ titleAs = "h3", className = "" }: { titleAs?: "h2" | "h3" | "p"; className?: string }) {
  return (
    <InfoCard icon="wallet" title="Betalning" titleAs={titleAs} className={className}>
      <PaymentMethodChips />
      <p className="mt-4 text-sm leading-relaxed text-mist-300">{site.payment.when}</p>
    </InfoCard>
  );
}
