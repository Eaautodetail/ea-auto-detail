import type { Metadata } from "next";
import { getService, site, travelFeeFrom } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { PageHero, CtaBand, HowItWorks } from "@/components/blocks";
import { ServiceCards, ServiceNotes } from "@/components/services";
import { PriceTable, TravelFeeZones } from "@/components/travel-fees";
import { ArrangementComparison } from "@/components/on-site-info";
import { OpeningHours } from "@/components/hours";
import { PaymentInfo } from "@/components/payment-info";
import { ResponseTimeCard } from "@/components/contact-details";
import { Section, SectionHeading } from "@/components/ui";

const price = (id: string) => formatSEK(getService(id)?.price ?? 0);

export const metadata: Metadata = {
  title: `Tjänster & priser – biltvätt och invändig rengöring i ${site.baseTown}`,
  description: `Utvändig biltvätt ${price("exterior")}, invändig rengöring ${price("interior")} eller båda för ${price("complete")}. Mobil bilvård (reseavgift från ${formatSEK(travelFeeFrom("visit"))}), hämtning och lämning (från ${formatSEK(travelFeeFrom("pickup"))}) eller lämna bilen hos oss utan reseavgift i ${site.baseTown}.`,
  alternates: { canonical: "/tjanster" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Tjänster & priser"
        title="Ren bil, tydligt pris."
        intro={`Utvändig biltvätt, invändig rengöring eller båda delarna tillsammans – hos dig i ${site.baseTown} med omnejd eller hos oss, med hämtning och lämning eller när du lämnar bilen själv. Alla priser anges i svenska kronor.`}
      />

      <Section labelledBy="priser-rubrik">
        <h2 id="priser-rubrik" className="sr-only">
          Våra tjänster
        </h2>
        <ServiceCards />
      </Section>

      <Section id="reseavgift" labelledBy="reseavgift-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading
          id="reseavgift-rubrik"
          eyebrow="Reseavgift och totalpris"
          title="Vad kostar det totalt?"
          intro={`Reseavgiften tillkommer utöver priset för tjänsten och beror på upplägget och avståndet från ${site.baseTown}. Lämnar du bilen hos oss tillkommer ingen reseavgift. Du ser avgiften i bokningsformuläret innan du skickar din förfrågan.`}
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <TravelFeeZones className="reveal" />
          <div id="totalpris" className="reveal scroll-mt-28">
            <h3 className="font-display mb-4 text-lg font-bold text-white">Totalpris med reseavgift</h3>
            <PriceTable />
          </div>
        </div>
        <div className="mt-5">
          <ServiceNotes className="reveal" />
        </div>
      </Section>

      <Section id="hos-dig-eller-hos-oss" labelledBy="upplagg-rubrik">
        <SectionHeading
          id="upplagg-rubrik"
          eyebrow="Hos dig eller hos oss"
          title="Hos dig eller hos oss?"
          intro="Vid mobil bilvård tvättar vi bilen hos dig. Vid hämtning och lämning tar vi bilen till oss och gör jobbet där. Du kan också lämna bilen hos oss själv."
        />
        <div className="mt-12">
          <ArrangementComparison />
        </div>
      </Section>

      <Section id="praktiskt" labelledBy="praktiskt-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading id="praktiskt-rubrik" eyebrow="Praktiskt" title="Betalning, tider och svar." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <PaymentInfo className="reveal" />
          <OpeningHours className="reveal" />
          <ResponseTimeCard className="reveal" />
        </div>
      </Section>

      <Section labelledBy="steg-rubrik">
        <SectionHeading id="steg-rubrik" eyebrow="Så bokar du" title="Så går det till." />
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Section>

      <CtaBand location="services_page_cta" />
    </>
  );
}
