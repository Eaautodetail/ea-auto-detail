/** Betalning – läses från `site.payment` i src/config/site.ts. */
import { site } from "@/config/site";
import { InfoCard } from "@/components/ui";

/** ["Swish", "Kontanter"] → "Swish eller kontanter". */
export function paymentMethodsText(methods: readonly string[] = site.payment.methods) {
  const items = methods.map((m, i) => (i === 0 ? m : m.charAt(0).toLowerCase() + m.slice(1)));
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} eller ${items[items.length - 1]}`;
}

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
