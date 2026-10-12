import Image from "next/image";
import { currentHours, site } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { HeroArt } from "@/components/hero-art";
import { BookingButton } from "@/components/booking-button";
import { ResponseTimeNote } from "@/components/contact-details";
import { ButtonLink, Container } from "@/components/ui";

/**
 * Startsidans hero. Bakgrunden är `site.heroImage` om den är satt (se
 * BILDER.md), annars en ritad grafik som tydligt märks som platshållare.
 */
export function Hero() {
  const lowest = Math.min(...site.services.map((s) => s.price));
  const hours = currentHours();

  const facts = [
    { label: "Från", value: formatSEK(lowest) },
    { label: "Reseavgift från", value: formatSEK(site.travelFeeFrom) },
    { label: site.hours.days, value: hours.text },
  ];

  return (
    <section
      aria-labelledby="hero-rubrik"
      className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden pb-14 pt-32 sm:items-center sm:pb-24"
    >
      <div className="absolute inset-0 -z-10">
        {site.heroImage ? (
          <Image src={site.heroImage.src} alt={site.heroImage.alt} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <HeroArt />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/75 to-ink-950/10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <Container>
        <div className="max-w-2xl">
          <p className="hero-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-mist-200 backdrop-blur">
            <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />
            Mobil bilvård · {site.baseTown}
          </p>
          <h1
            id="hero-rubrik"
            className="hero-in hero-in-delay-1 font-display text-[2.6rem] font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Ren bil.
            <br />
            <span className="text-mist-300">Utan krångel.</span>
          </h1>
          <p className="hero-in hero-in-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-mist-200">
            Utvändig biltvätt, invändig rengöring eller både och. Vi kommer till dig i {site.baseTown} med omnejd – eller
            hämtar bilen, gör jobbet hos oss och lämnar tillbaka den.
          </p>
          <div className="hero-in hero-in-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BookingButton location="hero" />
            <ButtonLink href="/tjanster" variant="secondary" size="lg">
              Se tjänster & priser
            </ButtonLink>
          </div>
          <ResponseTimeNote className="hero-in hero-in-delay-3 mt-5" />
          <dl className="hero-in hero-in-delay-3 mt-8 grid max-w-lg gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-left sm:grid-cols-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-baseline justify-between gap-4 bg-ink-950/70 px-4 py-2.5 backdrop-blur sm:block sm:py-3"
              >
                <dt className="text-sm text-mist-400 sm:text-xs">{f.label}</dt>
                <dd className="font-display whitespace-nowrap text-sm font-bold text-white sm:mt-1 sm:text-base">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>

      {!site.heroImage && site.showPlaceholders && (
        <p className="absolute bottom-3 right-4 text-[10px] uppercase tracking-widest text-mist-400/70">
          Grafik – byt mot eget foto (se BILDER.md)
        </p>
      )}
    </section>
  );
}
