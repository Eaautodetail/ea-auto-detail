import type { Metadata } from "next";
import Link from "next/link";
import { site, travelFeeFrom } from "@/config/site";
import { Hero } from "@/components/hero";
import { PricingTerms, ServiceCards } from "@/components/services";
import { ArrangementComparison } from "@/components/on-site-info";
import { Gallery } from "@/components/gallery";
import { FaqList, HowItWorks, WhyUs } from "@/components/blocks";
import { SocialLinks } from "@/components/social-links";
import { ContactDetails, ResponseTimeCard } from "@/components/contact-details";
import { OpeningHours } from "@/components/hours";
import { PaymentInfo } from "@/components/payment-info";
import { BookingForm } from "@/components/booking-form";
import { formatSEK } from "@/lib/format";
import { ArrowIcon, Eyebrow, Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: { absolute: `${site.name} – Bilvård & mobil biltvätt i ${site.baseTown}` },
  alternates: { canonical: "/" },
};

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-white">
      {children} <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section id="tjanster" labelledBy="tjanster-rubrik">
        <SectionHeading
          id="tjanster-rubrik"
          eyebrow="Tjänster & priser"
          title="Tre tjänster. Tydliga priser."
          intro={`Priset gäller själva tjänsten. Vid mobil bilvård tillkommer reseavgift från ${formatSEK(travelFeeFrom("visit"))} och vid hämtning och lämning från ${formatSEK(travelFeeFrom("pickup"))}. Lämnar du bilen hos oss är det gratis. Du ser avgiften innan du skickar din förfrågan.`}
        />
        <div className="mt-12">
          <ServiceCards />
        </div>
        <div className="mt-5">
          <PricingTerms />
        </div>
        <div className="mt-8">
          <MoreLink href="/tjanster#totalpris">Se totalpris med reseavgift</MoreLink>
        </div>
      </Section>

      <Section id="hos-dig-eller-hos-oss" labelledBy="upplagg-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading
          id="upplagg-rubrik"
          eyebrow="Hos dig eller hos oss"
          title="Hos dig eller hos oss?"
          intro={`Vi utgår från ${site.baseTown}. Välj om vi ska tvätta bilen där den står, hämta den och göra jobbet hos oss – eller om du lämnar bilen hos oss.`}
        />
        <div className="mt-12">
          <ArrangementComparison />
        </div>
      </Section>

      <Section id="galleri" labelledBy="galleri-rubrik">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="galleri-rubrik"
            eyebrow="Före & efter"
            title="Se skillnaden."
            intro="Dra i reglaget för att jämföra före och efter. Fler före- och efterbilder finns på våra sociala medier."
          />
          <MoreLink href="/galleri">Hela galleriet</MoreLink>
        </div>
        <div className="mt-12">
          <Gallery preview showFilters={false} />
        </div>
      </Section>

      <Section id="varfor" labelledBy="varfor-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading
          id="varfor-rubrik"
          eyebrow="Varför EA Auto Detail"
          title="Enkel bilvård, tydliga villkor."
          intro={`Vi är två unga entreprenörer som driver ett litet bilvårdsföretag i ${site.baseTown}.`}
        />
        <div className="mt-12">
          <WhyUs />
        </div>
      </Section>

      <Section id="sa-funkar-det" labelledBy="steg-rubrik">
        <SectionHeading
          id="steg-rubrik"
          eyebrow="Så bokar du"
          title="Från förfrågan till ren bil."
          intro="En bokningsförfrågan är inte en bokad tid. Tiden gäller först när vi har bekräftat den."
        />
        <div className="mt-12">
          <HowItWorks />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <OpeningHours className="reveal" />
          <PaymentInfo className="reveal" />
          <ResponseTimeCard className="reveal" />
        </div>
      </Section>

      <Section id="foljoss" labelledBy="social-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="reveal grid gap-8 rounded-3xl border border-white/10 bg-ink-850 p-7 sm:p-12 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <Eyebrow className="mb-4">Följ oss</Eyebrow>
            <h2 id="social-rubrik" className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Se fler resultat på TikTok, Instagram och Facebook.
            </h2>
            <p className="mt-4 text-mist-300">
              Där lägger vi upp före- och efterbilder från våra jobb. Du kan också skicka ett meddelande till oss där.
            </p>
          </div>
          <SocialLinks />
        </div>
      </Section>

      <Section id="faq" labelledBy="faq-rubrik">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading id="faq-rubrik" eyebrow="Vanliga frågor" title="Bra att veta." />
            <div className="mt-6">
              <MoreLink href="/vanliga-fragor">Alla frågor</MoreLink>
            </div>
          </div>
          <FaqList limit={5} />
        </div>
      </Section>

      <Section id="boka" labelledBy="boka-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <SectionHeading
            id="boka-rubrik"
            eyebrow="Kontakt & bokning"
            title="Skicka en förfrågan."
            intro="Fyll i formuläret så bekräftar vi tid och pris. Du kan också ringa, sms:a eller skriva till oss i sociala medier."
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
