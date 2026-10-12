import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero } from "@/components/blocks";
import { Placeholder, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: "Så hanterar EA Auto Detail personuppgifter som skickas via bokningsformuläret.",
  alternates: { canonical: "/integritet" },
};

export default function PrivacyPage() {
  const show = site.showPlaceholders;
  return (
    <>
      <PageHero eyebrow="Integritet" title="Integritetspolicy." intro="Så hanterar vi uppgifterna du skickar till oss." />
      <Section>
        <div className="max-w-3xl space-y-8 leading-relaxed text-mist-200 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white">
          {show && (
            <Placeholder>
              Mall – granska texten och fyll i företagets juridiska namn, organisationsnummer och kontaktuppgifter innan
              publicering.
            </Placeholder>
          )}
          <section className="space-y-3">
            <h2>Vem ansvarar för dina uppgifter?</h2>
            <p>
              {site.name} är personuppgiftsansvarig för de uppgifter du skickar via webbplatsen.{" "}
              {site.contact.email ? `Du når oss på ${site.contact.email}.` : show && <Placeholder>Organisationsnummer och e-post</Placeholder>}
            </p>
          </section>
          <section className="space-y-3">
            <h2>Vilka uppgifter samlar vi in?</h2>
            <p>
              När du skickar en bokningsförfrågan får vi de uppgifter du själv fyller i: namn, kontaktuppgift, bilens
              märke och modell, önskad tjänst, datum och tid, ungefärlig plats samt eventuellt meddelande och bilder.
            </p>
          </section>
          <section className="space-y-3">
            <h2>Varför och med vilken rätt?</h2>
            <p>
              Vi använder uppgifterna enbart för att svara på din förfrågan, boka in och utföra jobbet och kontakta dig
              om det. Den rättsliga grunden är att vidta åtgärder inför och fullgöra ett avtal med dig.
            </p>
          </section>
          <section className="space-y-3">
            <h2>Hur länge sparas uppgifterna?</h2>
            <p>
              Uppgifterna sparas inte på webbplatsens server. De skickas vidare till oss och sparas bara så länge det
              behövs för bokningen och för att uppfylla krav i t.ex. bokföringslagen.{" "}
              {show && <Placeholder>Ange hur länge ni sparar förfrågningar som inte leder till en bokning.</Placeholder>}
            </p>
          </section>
          <section className="space-y-3">
            <h2>Delar vi uppgifterna?</h2>
            <p>
              Vi säljer aldrig dina uppgifter. Förfrågan förmedlas via tjänsteleverantörer för e-post eller
              automatisering som behandlar uppgifterna för vår räkning.{" "}
              {show && <Placeholder>Ange vilka leverantörer ni använder (t.ex. Resend, Vercel, Make).</Placeholder>}
            </p>
          </section>
          <section className="space-y-3">
            <h2>Cookies och analys</h2>
            <p>
              Webbplatsen använder i dag inga cookies för analys eller marknadsföring. Om vi inför det kommer vi att be
              om ditt samtycke först.
            </p>
          </section>
          <section className="space-y-3">
            <h2>Dina rättigheter</h2>
            <p>
              Du har rätt att få veta vilka uppgifter vi har om dig, få dem rättade eller raderade och att invända mot
              behandlingen. Kontakta oss om du vill använda dina rättigheter. Du kan också lämna klagomål till
              Integritetsskyddsmyndigheten (IMY).
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
