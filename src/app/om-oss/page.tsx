import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero, CtaBand, WhyUs } from "@/components/blocks";
import { Placeholder, Section, SectionHeading } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";

export const metadata: Metadata = {
  title: "Om oss – två unga entreprenörer som brinner för bilar",
  description: "EA Auto Detail drivs av två unga entreprenörer med ett stort intresse för bilar. Läs om hur och varför vi startade.",
  alternates: { canonical: "/om-oss" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Om oss" title="Två unga entreprenörer med ett stort bilintresse." intro="Det här är EA Auto Detail." />

      <Section labelledBy="historia-rubrik">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="reveal space-y-5 text-lg leading-relaxed text-mist-200">
            <h2 id="historia-rubrik" className="font-display text-3xl font-bold text-white sm:text-4xl">
              Vår historia
            </h2>
            <p>
              Vi är två unga entreprenörer som alltid har gillat bilar – hur de ser ut, hur de känns och hur skönt det
              är att sätta sig i en bil som är riktigt ren. Av det intresset växte idén om att starta ett eget
              bilvårdsföretag.
            </p>
            <p>
              Med EA Auto Detail vill vi erbjuda bilvård som är noggrann men inte dyr. Vi tycker att alla ska ha råd
              att få bilen ordentligt omhändertagen, oavsett om det är familjens vardagsbil eller en bil man har lagt
              ner sin själ i.
            </p>
            <p>
              Vi är ett litet företag och bygger det steg för steg, med hårt arbete och ett jobb i taget. Därför är
              varje nöjd kund viktig för oss. Är du nöjd blir vi glada om du berättar det för någon du känner eller
              taggar oss i sociala medier.
            </p>
            {site.showPlaceholders && (
              <Placeholder>
                Lägg gärna till era förnamn, hur ni träffades, sedan när ni driver företaget och var ni utgår ifrån.
              </Placeholder>
            )}
          </div>
          <div className="reveal">
            <div className="grain relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_60%_20%,#34353a_0%,#131416_60%)]">
              <span className="font-display text-[8rem] font-black italic leading-none tracking-tighter text-white/10">EA</span>
              {site.showPlaceholders && (
                <span className="absolute inset-x-6 bottom-6">
                  <Placeholder>Byt mot ett foto på er två (lägg bilden i /public och uppdatera sidan).</Placeholder>
                </span>
              )}
            </div>
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
