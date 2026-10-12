import type { Metadata } from "next";
import { PageHero } from "@/components/blocks";
import { ContactDetails } from "@/components/contact-details";
import { SocialLinks } from "@/components/social-links";
import { BookingButton } from "@/components/booking-button";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontakta EA Auto Detail om bilvård, biltvätt och mobil service – eller skicka en bokningsförfrågan direkt.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Kontakt"
        title="Hör av dig."
        intro="Snabbast är att skicka en bokningsförfrågan – då har vi allt vi behöver för att ge dig en tid och ett pris."
      />
      <Section labelledBy="kontakt-rubrik">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="reveal">
            <h2 id="kontakt-rubrik" className="font-display text-2xl font-bold text-white sm:text-3xl">
              Kontaktuppgifter
            </h2>
            <div className="mt-6">
              <ContactDetails />
            </div>
            <h2 className="font-display mt-12 text-2xl font-bold text-white sm:text-3xl">Sociala medier</h2>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>
          <div className="reveal rounded-3xl border border-white/15 bg-ink-850 p-8 sm:p-10">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Vill du boka?</h2>
            <p className="mt-4 leading-relaxed text-mist-300">
              Berätta vilken tjänst du vill ha, när det passar och om vi ska komma till dig eller hämta bilen. Vi hör
              av oss och bekräftar tid och pris.
            </p>
            <BookingButton location="contact_page" className="mt-8" />
          </div>
        </div>
      </Section>
    </>
  );
}
