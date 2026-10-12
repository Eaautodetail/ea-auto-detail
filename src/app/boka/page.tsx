import type { Metadata } from "next";
import { site } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { PageHero } from "@/components/blocks";
import { BookingForm } from "@/components/booking-form";
import { phoneLinkNumber, ResponseTimeNote } from "@/components/contact-details";
import { TrackedAnchor } from "@/components/tracked-anchor";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Boka bilvård – skicka en bokningsförfrågan",
  description: `Boka utvändig biltvätt, invändig rengöring eller båda i ${site.baseTown} med omnejd. Vi kommer till dig eller hämtar och lämnar bilen – reseavgift från ${formatSEK(site.travelFeeFrom)}.`,
  alternates: { canonical: "/boka" },
};

export default function BookingPage() {
  const { phone } = site.contact;
  const number = phoneLinkNumber();

  return (
    <>
      <PageHero
        eyebrow="Boka"
        title={"Skicka en boknings\u00ADförfrågan."}
        intro="Fyll i formuläret så bekräftar vi tid och pris. En förfrågan är inte en bokning – tiden gäller först när vi har bekräftat den."
      >
        <div className="space-y-2">
          <ResponseTimeNote className="text-base" />
          {phone && number && (
            <p className="pl-6 text-sm text-mist-400">
              Hellre ringa eller sms:a?{" "}
              <TrackedAnchor
                href={`tel:${number}`}
                event="contact_click"
                eventProps={{ method: "phone", location: "booking_page" }}
                className="whitespace-nowrap font-semibold text-mist-200 underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                {phone}
              </TrackedAnchor>
            </p>
          )}
        </div>
      </PageHero>
      <Section labelledBy="formular-rubrik" className="!pt-12 sm:!pt-16">
        <h2 id="formular-rubrik" className="sr-only">
          Bokningsformulär
        </h2>
        <BookingForm />
      </Section>
    </>
  );
}
