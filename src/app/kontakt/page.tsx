import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero } from "@/components/blocks";
import { ContactDetails, ResponseTimeNote } from "@/components/contact-details";
import { SocialLinks } from "@/components/social-links";
import { BookingButton } from "@/components/booking-button";
import { OpeningHours } from "@/components/hours";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Kontakt",
  description: `Kontakta ${site.name} i ${site.baseTown}: skicka en bokningsförfrågan, ring eller sms:a${site.contact.phone ? ` ${site.contact.phone}` : ""} eller skriv till oss på Instagram, Facebook eller TikTok.`,
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Kontakt"
        title="Hör av dig."
        intro="Enklast är att skicka en bokningsförfrågan här på sidan – då har vi allt vi behöver för att bekräfta tid och pris. Du kan också ringa, sms:a eller skriva till oss i sociala medier."
      />
      <Section labelledBy="kontakt-rubrik">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="reveal">
            <h2 id="kontakt-rubrik" className="font-display text-2xl font-bold text-white sm:text-3xl">
              Kontaktuppgifter
            </h2>
            <div className="mt-6">
              <ContactDetails />
            </div>

            <h2 className="font-display mt-12 text-2xl font-bold text-white sm:text-3xl">Sociala medier</h2>
            <p className="mt-3 text-mist-300">
              Skicka ett DM på Instagram eller skriv till oss på Facebook eller TikTok. Där ser du också före- och
              efterbilder från våra jobb.
            </p>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="reveal rounded-3xl border border-white/20 bg-ink-850 p-7 sm:p-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-mist-400">Rekommenderas</p>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Boka via formuläret</h2>
              <p className="mt-4 leading-relaxed text-mist-300">
                Välj tjänst, dag och tid och om vi ska komma till dig eller hämta bilen. Du ser priset och
                reseavgiften innan du skickar. En förfrågan är inte en bokning – vi bekräftar tid och pris med dig.
              </p>
              <BookingButton location="contact_page" className="mt-8 max-sm:w-full" />
              <ResponseTimeNote className="mt-4" />
            </div>
            <OpeningHours titleAs="h2" className="reveal" />
          </div>
        </div>
      </Section>
    </>
  );
}
