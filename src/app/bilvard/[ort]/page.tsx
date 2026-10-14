import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { feeArrangements, getTown, getTravelZone, pricedZones, site, travelFeeFrom } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { CtaBand, HowItWorks, PageHero, TrustBar } from "@/components/blocks";
import { BookingButton } from "@/components/booking-button";
import { ServiceCards } from "@/components/services";
import { ArrangementTiles } from "@/components/on-site-info";
import { Section, SectionHeading } from "@/components/ui";

/**
 * En sida per ort vi åker till (site.towns i src/config/site.ts), t.ex.
 * /bilvard/ahus. Allt innehåll byggs av uppgifterna i site.ts – inga
 * påhittade lokala uppgifter.
 */
export function generateStaticParams() {
  return site.towns.map((t) => ({ ort: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/bilvard/[ort]">): Promise<Metadata> {
  const town = getTown((await params).ort);
  if (!town) return {};
  const lowest = Math.min(...site.services.map((s) => s.price));
  return {
    title: `Bilvård & mobil biltvätt i ${town.name}`,
    description: `Utvändig biltvätt, invändig rengöring eller båda i ${town.name} – från ${formatSEK(lowest)}. Vi kommer till dig, hämtar bilen eller så lämnar du den hos oss. ${site.name}, ${site.baseTown}.`,
    alternates: { canonical: `/bilvard/${town.slug}` },
  };
}

export default async function TownPage({ params }: PageProps<"/bilvard/[ort]">) {
  const town = getTown((await params).ort);
  if (!town) notFound();

  const zone = getTravelZone(town.zone);
  const isBase = town.name === site.baseTown;
  const zones = zone?.fees ? [zone as (typeof pricedZones)[number]] : pricedZones;
  const others = site.towns.filter((t) => t.slug !== town.slug);

  return (
    <>
      <PageHero
        eyebrow={`Bilvård i ${town.name}`}
        title={`Ren bil i ${town.name}.`}
        intro={`Utvändig biltvätt, invändig rengöring eller både och. ${
          isBase ? `Vi utgår från ${site.baseTown}` : `Vi utgår från ${site.baseTown} och åker till ${town.name}`
        } – vi tvättar bilen där den står, hämtar och lämnar den, eller så lämnar du bilen hos oss.`}
      >
        <BookingButton location={`town_${town.slug}`} className="max-sm:w-full" />
      </PageHero>
      <TrustBar />

      <Section labelledBy="ort-priser">
        <SectionHeading
          id="ort-priser"
          eyebrow="Tjänster & priser"
          title="Samma priser som i stan."
          intro="Priserna gäller personbil – SUV och skåpbil kostar lite mer. Reseavgiften står nedan."
        />
        <div className="mt-12">
          <ServiceCards />
        </div>
      </Section>

      <Section labelledBy="ort-reseavgift" className="border-t border-white/10 bg-ink-900">
        <SectionHeading
          id="ort-reseavgift"
          eyebrow="Reseavgift"
          title={`Reseavgift till ${town.name}`}
          intro={
            zone?.fees
              ? `${town.name} ligger normalt i zonen ${zone.label.charAt(0).toLowerCase()}${zone.label.slice(1)}. Vi kontrollerar avgiften mot adressen innan vi bekräftar.`
              : `Reseavgiften beror på hur långt från ${site.baseTown} bilen står. Vi kontrollerar avgiften mot adressen innan vi bekräftar.`
          }
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {feeArrangements.map((a) => (
            <li key={a.id} className="rounded-2xl border border-white/10 bg-ink-850 p-5">
              <p className="font-display text-lg font-bold text-white">{a.label}</p>
              <ul className="mt-2 space-y-1 text-sm text-mist-300">
                {zones.map((z) => (
                  <li key={z.id} className="flex justify-between gap-3">
                    <span>{zones.length > 1 ? z.shortLabel : "Reseavgift"}</span>
                    <span className="font-semibold text-white">{formatSEK(z.fees[a.id])}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="rounded-2xl border border-white/10 bg-ink-850 p-5">
            <p className="font-display text-lg font-bold text-white">Lämna bilen hos oss</p>
            <p className="mt-2 flex justify-between gap-3 text-sm text-mist-300">
              <span>Reseavgift</span>
              <span className="font-semibold text-white">Gratis</span>
            </p>
          </li>
        </ul>
        <p className="mt-5 text-sm text-mist-400">
          Exempel: utvändig biltvätt av en personbil med mobil bilvård kostar{" "}
          {formatSEK(site.services[0].price + (zones[0]?.fees.visit ?? travelFeeFrom("visit")))}
          {zones.length > 1 ? ` inom ca ${site.travelNearKm} km` : ""} inklusive reseavgift.
        </p>
      </Section>

      <Section labelledBy="ort-upplagg">
        <SectionHeading id="ort-upplagg" eyebrow="Hos dig eller hos oss" title="Du väljer var." />
        <div className="mt-10">
          <ArrangementTiles />
        </div>
      </Section>

      <Section labelledBy="ort-steg" className="border-t border-white/10 bg-ink-900">
        <SectionHeading id="ort-steg" eyebrow="Så bokar du" title="Från förfrågan till ren bil." />
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Section>

      <Section labelledBy="ort-andra">
        <SectionHeading id="ort-andra" eyebrow="Fler orter" title="Här åker vi också." />
        <ul className="mt-8 flex flex-wrap gap-2">
          {others.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/bilvard/${t.slug}`}
                className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-mist-200 transition-colors hover:border-white/40 hover:text-white"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-mist-400">
          Vi åker upp till ca {site.travelMaxKm} km från {site.baseTown}. Hittar du inte din ort? Skicka en förfrågan så
          kollar vi.
        </p>
      </Section>

      <CtaBand title={`Dags att få bilen ren i ${town.name}?`} location={`town_${town.slug}_cta`} />
    </>
  );
}
