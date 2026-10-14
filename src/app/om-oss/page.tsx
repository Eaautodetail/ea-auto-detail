import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero, CtaBand, WhyUs } from "@/components/blocks";
import { Section, SectionHeading } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";

export const metadata: Metadata = {
  title: "Om oss – två unga entreprenörer med bilintresse",
  description: `${site.name} är ett litet bilvårdsföretag i ${site.baseTown} som drivs av två unga entreprenörer. Läs om hur och varför vi startade.`,
  alternates: { canonical: "/om-oss" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Om oss"
        title="Två unga entreprenörer med ett stort bilintresse."
        intro={`Det här är ${site.name} – ett litet bilvårdsföretag i ${site.baseTown}.`}
      />

      <Section labelledBy="historia-rubrik">
        <div className="reveal max-w-3xl space-y-5 text-lg leading-relaxed text-mist-200">
          <h2 id="historia-rubrik" className="font-display text-3xl font-bold text-white sm:text-4xl">
            Vår historia
          </h2>
          {/* Berättelsen redigeras i src/config/site.ts (about.story). */}
          {site.about.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
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
