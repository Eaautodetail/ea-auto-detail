import Image from "next/image";
import { site } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { HeroArt } from "@/components/hero-art";
import { BookingButton } from "@/components/booking-button";
import { ButtonLink, Container } from "@/components/ui";

export function Hero() {
  const lowest = Math.min(...site.services.map((s) => s.price));

  return (
    <section aria-labelledby="hero-rubrik" className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden pb-16 pt-32 sm:items-center sm:pb-24">
      <div className="absolute inset-0 -z-10">
        {site.heroImage ? (
          <Image src={site.heroImage.src} alt={site.heroImage.alt} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <HeroArt />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <Container>
        <div className="max-w-2xl">
          <p className="hero-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-mist-200 backdrop-blur">
            <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />
            Bilvård · Biltvätt · Mobil service
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
            Vi är två unga entreprenörer som tvättar och rengör bilar ordentligt – utvändigt, invändigt eller både
            och. Vi kommer till dig eller hämtar och lämnar bilen.
          </p>
          <div className="hero-in hero-in-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BookingButton location="hero" />
            <ButtonLink href="/tjanster" variant="secondary" size="lg">
              Se tjänster & priser
            </ButtonLink>
          </div>
          <p className="hero-in hero-in-delay-3 mt-6 text-sm text-mist-400">
            Från <span className="font-semibold text-white">{formatSEK(lowest)}</span> · Tydliga priser · Extraarbete
            endast efter ditt godkännande
          </p>
        </div>
      </Container>

      {!site.heroImage && site.showPlaceholders && (
        <p className="absolute bottom-3 right-4 text-[10px] uppercase tracking-widest text-mist-400/70">
          Grafik – byt gärna mot eget foto
        </p>
      )}
    </section>
  );
}
