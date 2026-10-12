import Link from "next/link";
import { site } from "@/config/site";
import { Hero } from "@/components/hero";
import { PricingTerms, ServiceCards } from "@/components/services";
import { Gallery } from "@/components/gallery";
import { FaqList, HowItWorks, WhyUs } from "@/components/blocks";
import { SocialLinks } from "@/components/social-links";
import { ContactDetails } from "@/components/contact-details";
import { BookingForm } from "@/components/booking-form";
import { ArrowIcon, Section, SectionHeading } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section id="tjanster" labelledBy="tjanster-rubrik">
        <SectionHeading
          id="tjanster-rubrik"
          eyebrow="Tjänster & priser"
          title="Tre tjänster. Tydliga priser."
          intro="Välj det din bil behöver. Alla priser är i svenska kronor och du får alltid veta kostnaden innan vi börjar."
        />
        <div className="mt-12">
          <ServiceCards />
        </div>
        <div className="mt-5">
          <PricingTerms />
        </div>
      </Section>

      <Section id="galleri" labelledBy="galleri-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="galleri-rubrik"
            eyebrow="Före & efter"
            title="Resultatet säger det mesta."
            intro="Dra i reglaget för att jämföra före och efter."
          />
          <Link href="/galleri" className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-white">
            Hela galleriet <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-12">
          <Gallery limit={2} showFilters={false} />
        </div>
      </Section>

      <Section id="varfor" labelledBy="varfor-rubrik">
        <SectionHeading
          id="varfor-rubrik"
          eyebrow="Varför EA Auto Detail"
          title="Små nog att bry oss. Noggranna nog att märkas."
        />
        <div className="mt-12">
          <WhyUs />
        </div>
      </Section>

      <Section id="sa-funkar-det" labelledBy="steg-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading id="steg-rubrik" eyebrow="Så bokar du" title="Enkelt från förfrågan till ren bil." />
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Section>

      <Section id="foljoss" labelledBy="social-rubrik">
        <div className="reveal grid gap-8 rounded-3xl border border-white/10 bg-ink-900 p-8 sm:p-12 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-mist-400">Följ oss</p>
            <h2 id="social-rubrik" className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Se fler resultat på TikTok, Instagram och Facebook.
            </h2>
            <p className="mt-4 text-mist-300">Vi visar våra senaste jobb och före/efter-klipp i sociala medier.</p>
          </div>
          <SocialLinks />
        </div>
      </Section>

      <Section id="faq" labelledBy="faq-rubrik" className="border-t border-white/10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading id="faq-rubrik" eyebrow="Vanliga frågor" title="Bra att veta." />
            <Link href="/vanliga-fragor" className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
              Alla frågor <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <FaqList limit={5} />
        </div>
      </Section>

      <Section id="boka" labelledBy="boka-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <SectionHeading
            id="boka-rubrik"
            eyebrow="Kontakt & bokning"
            title="Skicka en förfrågan."
            intro="Fyll i formuläret så hör vi av oss och bekräftar tid och pris."
          />
          <ContactDetails />
        </div>
        <div className="mt-14">
          <BookingForm headingLevel="h3" />
        </div>
      </Section>
    </>
  );
}

export const metadata = {
  title: { absolute: `${site.name} – Bilvård, biltvätt & mobil bilvård` },
  alternates: { canonical: "/" },
};
