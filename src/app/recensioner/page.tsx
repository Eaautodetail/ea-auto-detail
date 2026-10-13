import type { Metadata } from "next";
import { Suspense } from "react";
import { site } from "@/config/site";
import { PageHero, CtaBand } from "@/components/blocks";
import { ReviewForm } from "@/components/review-form";
import { ReviewFormOrNotice, ReviewList } from "@/components/reviews";
import { Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Recensioner – vad säger kunderna?",
  description: `Läs vad kunderna säger om ${site.name} i ${site.baseTown}, eller lämna en egen recension.`,
  alternates: { canonical: "/recensioner" },
};

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Recensioner"
        title="Vad säger kunderna?"
        intro="Här samlar vi omdömen från våra kunder. Har du anlitat oss – nyss eller för länge sedan? Lämna gärna en recension längre ned på sidan."
      >
        <a href="#skriv" className="inline-flex items-center gap-2 text-sm font-semibold text-white underline underline-offset-4">
          Skriv en recension
        </a>
      </PageHero>

      <Section labelledBy="recensioner-lista">
        <h2 id="recensioner-lista" className="sr-only">
          Recensioner
        </h2>
        <Suspense fallback={<div className="h-48 rounded-2xl border border-white/10 bg-ink-850/60" />}>
          <ReviewList />
        </Suspense>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mist-400">
          Alla kan lämna en recension, även utan att ha bokat via hemsidan. Vi läser alla och visar de med 4 eller 5
          stjärnor här. Märkningen ”Bokade via hemsidan” betyder att recensionen kom via länken vi mejlar efter en
          bokning.
        </p>
      </Section>

      <Section id="skriv" labelledBy="skriv-rubrik" className="border-t border-white/10 bg-ink-900">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:items-start">
          <SectionHeading
            id="skriv-rubrik"
            eyebrow="Lämna en recension"
            title="Hur blev det?"
            intro="Det tar under en minut. Ditt omdöme hjälper oss att bli bättre – och hjälper andra som funderar på att boka."
          />
          <Suspense fallback={<div className="h-96 rounded-3xl border border-white/10 bg-ink-850" />}>
            <ReviewFormOrNotice>
              <ReviewForm />
            </ReviewFormOrNotice>
          </Suspense>
        </div>
      </Section>

      <CtaBand title="Vill du också få bilen ren?" location="reviews_page_cta" />
    </>
  );
}
