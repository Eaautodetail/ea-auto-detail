import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { site, travelFeeFrom } from "@/config/site";
import { Hero } from "@/components/hero";
import { ServiceCards } from "@/components/services";
import { ArrangementTiles } from "@/components/on-site-info";
import { Gallery } from "@/components/gallery";
import { CtaBand, ExtraWorkLine, FaqList, HowItWorks, TrustBar } from "@/components/blocks";
import { GoogleReviewLinks, RatingSummary, ReviewList } from "@/components/reviews";
import { formatSEK } from "@/lib/format";
import { ArrowIcon, Section, SectionHeading } from "@/components/ui";

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
      <TrustBar />

      <Section id="tjanster" labelledBy="tjanster-rubrik">
        <SectionHeading
          id="tjanster-rubrik"
          eyebrow="Tjänster & priser"
          title="Tre tjänster. Tydliga priser."
          intro={`Priserna gäller personbil – SUV och skåpbil kostar lite mer. Vid mobil bilvård tillkommer reseavgift från ${formatSEK(travelFeeFrom("visit"))} och vid hämtning och lämning från ${formatSEK(travelFeeFrom("pickup"))}. Lämnar du bilen hos oss är det gratis.`}
        />
        <div className="mt-12">
          <ServiceCards />
        </div>
        <ExtraWorkLine className="mt-6 max-w-3xl" />
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <MoreLink href="/tjanster#fordonstyp">Pris för SUV och skåpbil</MoreLink>
          <MoreLink href="/tjanster#totalpris">Totalpris med reseavgift</MoreLink>
        </div>
      </Section>

      <Section id="recensioner" labelledBy="recensioner-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <SectionHeading
              id="recensioner-rubrik"
              eyebrow="Recensioner"
              title="Vad säger kunderna?"
              intro="Omdömen från kunder som har anlitat oss."
            />
            <Suspense fallback={null}>
              <RatingSummary className="mt-5" />
            </Suspense>
          </div>
          <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-3">
            <MoreLink href="/recensioner">Alla recensioner</MoreLink>
            <MoreLink href="/recensioner#skriv">Lämna en recension</MoreLink>
          </div>
        </div>
        <div className="mt-12">
          <Suspense fallback={<div className="h-48 rounded-2xl border border-white/10 bg-ink-850/60" />}>
            <ReviewList limit={3} />
          </Suspense>
        </div>
        <GoogleReviewLinks className="mt-6" />
      </Section>

      <Section id="galleri" labelledBy="galleri-rubrik">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="galleri-rubrik"
            eyebrow="Före & efter"
            title="Se skillnaden."
            intro="Dra i reglaget för att jämföra före och efter."
          />
          <MoreLink href="/galleri">Hela galleriet</MoreLink>
        </div>
        <div className="mt-12">
          <Gallery preview showFilters={false} />
        </div>
      </Section>

      <Section id="hos-dig-eller-hos-oss" labelledBy="upplagg-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="upplagg-rubrik"
            eyebrow="Hos dig eller hos oss"
            title="Du väljer var."
            intro={`Vi utgår från ${site.baseTown} och åker upp till ca ${site.travelMaxKm} km.`}
          />
          <MoreLink href="/tjanster#hos-dig-eller-hos-oss">Vad som gäller</MoreLink>
        </div>
        <div className="mt-10">
          <ArrangementTiles />
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
      </Section>

      <Section id="faq" labelledBy="faq-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading id="faq-rubrik" eyebrow="Vanliga frågor" title="Bra att veta." />
            <div className="mt-6">
              <MoreLink href="/vanliga-fragor">Alla frågor</MoreLink>
            </div>
          </div>
          <FaqList limit={4} />
        </div>
      </Section>

      <CtaBand location="home_cta" />
    </>
  );
}
