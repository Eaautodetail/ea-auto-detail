import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config/site";
import { PageHero, CtaBand, WhyUs } from "@/components/blocks";
import { Placeholder, Section, SectionHeading } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";

export const metadata: Metadata = {
  title: "Om oss – två unga entreprenörer med bilintresse",
  description: `${site.name} är ett litet bilvårdsföretag i ${site.baseTown} som drivs av två unga entreprenörer. Läs om hur och varför vi startade.`,
  alternates: { canonical: "/om-oss" },
};

/**
 * Valfritt foto på grundarna. Läggs till som `aboutImage` i site.ts (se
 * BILDER.md). Fältet är valfritt, så sidan fungerar även utan det.
 */
const aboutImage = (site as { aboutImage?: { src: string; alt: string } | null }).aboutImage ?? null;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Om oss"
        title="Två unga entreprenörer med ett stort bilintresse."
        intro={`Det här är ${site.name} – ett litet bilvårdsföretag i ${site.baseTown}.`}
      />

      <Section labelledBy="historia-rubrik">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="reveal space-y-5 text-lg leading-relaxed text-mist-200">
            <h2 id="historia-rubrik" className="font-display text-3xl font-bold text-white sm:text-4xl">
              Vår historia
            </h2>
            {/* Berättelsen redigeras i src/config/site.ts (about.story). */}
            {site.about.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {site.showPlaceholders && (
              <Placeholder>
                Lägg gärna till era förnamn, hur ni träffades och sedan när ni driver företaget.
              </Placeholder>
            )}
          </div>
          <div className="reveal">
            {site.about.founders.length > 0 ? (
              <figure>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {site.about.founders.map((f) => (
                    <div key={f.src}>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-ink-850">
                        <Image src={f.src} alt={f.alt} fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover" />
                      </div>
                      {f.name && <p className="mt-2 text-sm font-semibold text-white">{f.name}</p>}
                    </div>
                  ))}
                </div>
                <figcaption className="mt-4 text-sm text-mist-400">Vi som driver {site.name} och gör jobbet själva.</figcaption>
              </figure>
            ) : aboutImage ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-ink-850">
                <Image
                  src={aboutImage.src}
                  alt={aboutImage.alt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grain relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_60%_20%,#34353a_0%,#131416_60%)]">
                <span
                  aria-hidden="true"
                  className="font-display text-[8rem] font-black italic leading-none tracking-tighter text-white/10"
                >
                  EA
                </span>
                {site.showPlaceholders && (
                  <span className="absolute inset-x-6 bottom-6">
                    <Placeholder>Plats för ett foto på er två (se BILDER.md).</Placeholder>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section labelledBy="varderingar-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading id="varderingar-rubrik" eyebrow="Det vi står för" title="Så jobbar vi." />
        <div className="mt-12">
          <WhyUs />
        </div>
        <div className="mt-12">
          <SocialLinks />
        </div>
      </Section>

      <CtaBand title="Låt oss ta hand om din bil." location="about_page_cta" />
    </>
  );
}
