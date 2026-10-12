import type { Metadata } from "next";
import { PageHero } from "@/components/blocks";
import { BookingForm } from "@/components/booking-form";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Boka bilvård – skicka en bokningsförfrågan",
  description: "Boka utvändig biltvätt, invändig bilrengöring eller båda. Vi kommer till dig eller hämtar och lämnar bilen.",
  alternates: { canonical: "/boka" },
};

export default function BookingPage() {
  return (
    <>
      <PageHero
        eyebrow="Boka"
        title="Skicka en bokningsförfrågan."
        intro="Fyll i formuläret så hör vi av oss och bekräftar tid och pris. Bokningen gäller först när vi har bekräftat den."
      />
      <Section labelledBy="formular-rubrik" className="!pt-12 sm:!pt-16">
        <h2 id="formular-rubrik" className="sr-only">
          Bokningsformulär
        </h2>
        <BookingForm />
      </Section>
    </>
  );
}
