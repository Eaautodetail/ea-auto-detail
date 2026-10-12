import type { Metadata } from "next";
import { site } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { PageHero, CtaBand, HowItWorks } from "@/components/blocks";
import { PricingTerms, ServiceCards } from "@/components/services";
import { Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tjänster & priser – biltvätt och invändig rengöring",
  description: `Utvändig biltvätt ${formatSEK(site.services[0].price)}, invändig bilrengöring ${formatSEK(site.services[1].price)} eller båda för ${formatSEK(site.services[2].price)}. Mobil bilvård med hämtning och lämning.`,
  alternates: { canonical: "/tjanster" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Tjänster & priser"
        title="Ren bil, tydligt pris."
        intro="Vi erbjuder tre tjänster: utvändig biltvätt, invändig rengöring eller båda delarna tillsammans. Alla priser anges i svenska kronor."
      />

      <Section labelledBy="priser-rubrik">
        <h2 id="priser-rubrik" className="sr-only">
          Våra tjänster
        </h2>
        <ServiceCards />
      </Section>

      <Section labelledBy="villkor-rubrik" className="border-t border-white/10 bg-ink-900">
        <SectionHeading
          id="villkor-rubrik"
          eyebrow="Bra att veta om priserna"
          title="Mobil service och extraarbete."
          intro="Priserna ovan är grundpriser för själva tjänsten. Så här fungerar det med mobil service och bilar som behöver lite mer kärlek."
        />
        <div className="mt-10">
          <PricingTerms />
        </div>
        <div className="reveal mt-10 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Prisexempel</caption>
            <thead className="bg-ink-800 text-xs uppercase tracking-wider text-mist-400">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold">Tjänst</th>
                <th scope="col" className="px-5 py-4 font-semibold">Grundpris</th>
                <th scope="col" className="hidden px-5 py-4 font-semibold sm:table-cell">Med reseavgift (inom 5 km / upp till Åhus)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-ink-850">
              {site.services.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="px-5 py-4 font-semibold text-white">{s.name}</th>
                  <td className="px-5 py-4 text-mist-200">{formatSEK(s.price)}</td>
                  <td className="hidden px-5 py-4 text-mist-200 sm:table-cell">
                    {site.travelZones
                      .filter((z) => z.fee != null)
                      .map((z) => formatSEK(s.price + z.fee!))
                      .join(" / ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-mist-400">
          Prisexemplen gäller utan extraarbete. Extraarbete kostar bara något om du har godkänt ett prisförslag först.
        </p>
      </Section>

      <Section labelledBy="steg-rubrik">
        <SectionHeading id="steg-rubrik" eyebrow="Så bokar du" title="Tre enkla steg." />
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Section>

      <CtaBand location="services_page_cta" />
    </>
  );
}
