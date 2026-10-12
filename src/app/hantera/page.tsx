import type { Metadata } from "next";
import { PageHero } from "@/components/blocks";
import { ManageBooking } from "@/components/manage-booking";
import { Section } from "@/components/ui";

/**
 * Intern sida för EA Auto Detail: öppnas via länken i mejlet om en ny
 * bokningsförfrågan (/hantera#t=…). Visas inte i menyn eller sitemap,
 * blockeras i robots.txt och indexeras aldrig.
 */
export const metadata: Metadata = {
  title: "Hantera bokningsförfrågan",
  description: "Intern sida för att bekräfta bokningsförfrågningar.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
  alternates: { canonical: null },
};

export default function ManageBookingPage() {
  return (
    <>
      <PageHero
        eyebrow="Internt"
        title="Bekräfta en bokning."
        intro="Gå igenom förfrågan, välj tid och pris och skicka en bekräftelse till kunden. Kunden får mejlet först när du skickar det."
      />
      <Section labelledBy="hantera-rubrik" className="!pt-12 sm:!pt-16">
        <h2 id="hantera-rubrik" className="sr-only">
          Bokningsförfrågan
        </h2>
        <ManageBooking />
      </Section>
    </>
  );
}
