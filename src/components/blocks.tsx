import type { ReactNode } from "react";
import { site, travelFeeFrom } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { BookingButton } from "@/components/booking-button";
import { ResponseTimeNote } from "@/components/contact-details";
import { paymentMethodsText } from "@/components/payment-info";
import { Container, Eyebrow, Placeholder } from "@/components/ui";

/** Sidhuvud för undersidor (under den fasta menyn). */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Valfritt extra innehåll under ingressen (t.ex. svarstid). */
  children?: ReactNode;
}) {
  return (
    <section className="grain relative overflow-hidden border-b border-white/10 pb-14 pt-36 sm:pb-20 sm:pt-44">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_0%,#2a2b30_0%,#0e0f11_45%,#08090a_80%)]"
      />
      <Container>
        <Eyebrow className="hero-in mb-4">{eyebrow}</Eyebrow>
        <h1 className="hero-in hero-in-delay-1 font-display max-w-3xl break-words text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">
          {title}
        </h1>
        {intro && <p className="hero-in hero-in-delay-2 mt-6 max-w-2xl text-lg leading-relaxed text-mist-300">{intro}</p>}
        {children && <div className="hero-in hero-in-delay-3 mt-6 max-w-2xl">{children}</div>}
      </Container>
    </section>
  );
}

const lowestPrice = Math.min(...site.services.map((s) => s.price));

/**
 * Varför välja oss. Bara sådant som stöds av uppgifterna i site.ts och
 * EA Auto Details egen beskrivning – inga påhittade löften.
 */
const reasons = [
  {
    title: "Tydligt vad som ingår",
    text: "Varje tjänst har en fast lista över vad som ingår, så du vet vad du får innan du bokar.",
  },
  {
    title: "Tydliga priser",
    text: `Från ${formatSEK(lowestPrice)}. Reseavgift från ${formatSEK(travelFeeFrom("visit"))} vid mobil bilvård och från ${formatSEK(travelFeeFrom("pickup"))} vid hämtning och lämning – lämnar du bilen hos oss är den gratis. Du ser priset och reseavgiften innan du skickar förfrågan.`,
  },
  {
    title: "Hos dig eller hos oss",
    text: "Vi tvättar bilen där den står, hämtar den och lämnar tillbaka den när den är klar – eller så lämnar du bilen hos oss.",
  },
  {
    title: "Inget extra utan ditt ja",
    text: "Behöver bilen extra arbete får du veta vad det kostar och godkänna det innan vi gör det.",
  },
  {
    title: "Snabbt svar",
    text: site.responseTime,
  },
  {
    title: "Betala när jobbet är klart",
    text: `${site.payment.when} ${paymentMethodsText()} går bra.`,
  },
];

export function WhyUs() {
  return (
    <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
      {reasons.map((r, i) => (
        <li key={r.title} className="reveal bg-ink-900 p-6 sm:p-7">
          <p className="font-display text-sm font-bold text-mist-400">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 font-display text-lg font-bold text-white">{r.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">{r.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** Bokningsflödet: förfrågan → svar inom 24 h → bekräftad tid → jobbet → betalning på plats. */
const steps = [
  {
    title: "Skicka en förfrågan",
    text: "Välj tjänst, dag och tid och var vi ska ta hand om bilen – hos dig eller hos oss. Du ser pris och reseavgift innan du skickar.",
  },
  {
    title: "Vi återkommer",
    text: site.responseTime,
  },
  {
    title: "Tiden bekräftas",
    text: "Vi bekräftar tid och pris med dig. Först då är bokningen klar – en förfrågan är ingen bokning.",
  },
  {
    title: "Vi tar hand om bilen",
    text: "Hos dig med mobil bilvård eller hos oss med hämtning och lämning. Behövs extra arbete frågar vi dig först.",
  },
  {
    title: "Betala på plats",
    text: `${site.payment.when.replace(/\.$/, "")}, med ${paymentMethodsText()}.`,
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((s, i) => (
        <li key={s.title} className="reveal relative rounded-2xl border border-white/10 bg-ink-900 p-6">
          <span
            aria-hidden="true"
            className="font-display grid size-10 place-items-center rounded-full bg-white text-base font-extrabold text-black"
          >
            {i + 1}
          </span>
          <h3 className="mt-5 font-display text-lg font-bold leading-snug text-white">
            <span className="sr-only">Steg {i + 1}: </span>
            {s.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ limit }: { limit?: number }) {
  const items = site.faq.filter((f) => f.answer || site.showPlaceholders).slice(0, limit);
  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {items.map((f) => (
        <details key={f.id} id={f.id} className="group scroll-mt-28">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-semibold text-white transition-colors hover:text-mist-200 sm:text-lg [&::-webkit-details-marker]:hidden">
            {f.question}
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 text-mist-200 transition-transform duration-300 group-open:rotate-45"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="pb-6 pr-4 leading-relaxed text-mist-300 sm:pr-12">
            {f.answer ?? <Placeholder>{f.placeholderHint ?? "Svar saknas"}</Placeholder>}
          </div>
        </details>
      ))}
    </div>
  );
}

/** Avslutande uppmaning att boka – används längst ned på de flesta sidor. */
export function CtaBand({ title = "Dags att få bilen ren?", location }: { title?: string; location: string }) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="grain reveal relative overflow-hidden rounded-3xl border border-white/15 bg-[radial-gradient(ellipse_at_80%_0%,#3a3c42_0%,#16171a_50%,#0e0f11_100%)] px-6 py-12 sm:px-14 sm:py-16">
          <h2 className="font-display max-w-xl text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-lg text-mist-300">
            Skicka en bokningsförfrågan så bekräftar vi tid och pris. Bokningen gäller först när vi har bekräftat den.
          </p>
          <BookingButton location={location} className="mt-8 max-sm:w-full" />
          <ResponseTimeNote className="mt-4" />
        </div>
      </Container>
    </section>
  );
}
