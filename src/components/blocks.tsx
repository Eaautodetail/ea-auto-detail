import { site } from "@/config/site";
import { BookingButton } from "@/components/booking-button";
import { Container, Placeholder } from "@/components/ui";

/** Sidhuvud för undersidor (under den fasta menyn). */
export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <section className="grain relative overflow-hidden border-b border-white/10 pb-14 pt-36 sm:pb-20 sm:pt-44">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_0%,#2a2b30_0%,#0e0f11_45%,#08090a_80%)]"
      />
      <Container>
        <p className="hero-in mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-mist-400">{eyebrow}</p>
        <h1 className="hero-in hero-in-delay-1 font-display max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">
          {title}
        </h1>
        {intro && <p className="hero-in hero-in-delay-2 mt-6 max-w-2xl text-lg leading-relaxed text-mist-300">{intro}</p>}
      </Container>
    </section>
  );
}

const reasons = [
  {
    title: "Noggrannhet framför allt",
    text: "Vi tar oss tid med varje bil och gör jobbet ordentligt. Det är våra resultat som ska tala för oss.",
  },
  {
    title: "Schyssta priser",
    text: "Bra bilvård ska inte behöva kosta som hos en bilhandlare. Våra priser är tydliga från början.",
  },
  {
    title: "Vi kommer till dig",
    text: "Vi kan tvätta bilen där den står eller hämta och lämna den – så slipper du lägga tid på det.",
  },
  {
    title: "Inga överraskningar",
    text: "Behövs extra arbete får du ett prisförslag först. Inget extra görs innan du har sagt ja.",
  },
  {
    title: "Ett litet, personligt företag",
    text: "Du har kontakt direkt med oss två som gör jobbet – inte med en stor kedja.",
  },
  {
    title: "Vi brinner för bilar",
    text: "Vardagsbil eller entusiastbil – vi behandlar alla bilar som om de vore våra egna.",
  },
];

export function WhyUs() {
  return (
    <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
      {reasons.map((r, i) => (
        <li key={r.title} className="reveal bg-ink-900 p-7">
          <p className="font-display text-sm font-bold text-mist-400">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 font-display text-lg font-bold text-white">{r.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">{r.text}</p>
        </li>
      ))}
    </ul>
  );
}

const steps = [
  {
    title: "Skicka en förfrågan",
    text: "Välj tjänst, önskad dag och om vi ska komma till dig eller hämta bilen. Det tar bara en minut.",
  },
  {
    title: "Vi bekräftar",
    text: "Vi hör av oss och bekräftar tid och pris. Först då är bokningen klar.",
  },
  {
    title: "Vi tar hand om bilen",
    text: "Vi gör jobbet noggrant. Behövs extra arbete frågar vi dig först.",
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="reveal relative rounded-2xl border border-white/10 bg-ink-900 p-7">
          <span className="font-display grid size-11 place-items-center rounded-full bg-white text-base font-extrabold text-black">
            {i + 1}
          </span>
          <h3 className="mt-5 font-display text-lg font-bold text-white">{s.title}</h3>
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
          <div className="pb-6 pr-12 leading-relaxed text-mist-300">
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
        <div className="grain reveal relative overflow-hidden rounded-3xl border border-white/15 bg-[radial-gradient(ellipse_at_80%_0%,#3a3c42_0%,#16171a_50%,#0e0f11_100%)] px-7 py-14 sm:px-14 sm:py-16">
          <h2 className="font-display max-w-xl text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-lg text-mist-300">
            Skicka en bokningsförfrågan så hör vi av oss och bekräftar tid och pris. Det är helt kostnadsfritt att
            fråga.
          </p>
          <BookingButton location={location} className="mt-8" />
        </div>
      </Container>
    </section>
  );
}
