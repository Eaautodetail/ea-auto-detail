import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { emailConfig } from "@/lib/email";
import { PageHero } from "@/components/blocks";
import { Placeholder, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: `Så hanterar ${site.name} personuppgifter som skickas via bokningsformuläret.`,
  alternates: { canonical: "/integritet" },
};

/**
 * Vilken e-posttjänst som skickar mejlen, utifrån serverns inställningar när
 * sidan byggs. Bara leverantörens namn används – inga nycklar eller adresser.
 */
function emailProcessor(config = emailConfig()): string | null {
  if (config.provider === "smtp") {
    return config.smtp?.host === "smtp.gmail.com" ? "Google (Gmail)" : "vår e-postleverantör";
  }
  if (config.provider === "resend") return "Resend";
  return null;
}

export default function PrivacyPage() {
  const show = site.showPlaceholders;
  const { email, phone } = site.contact;
  const mail = emailConfig();
  const processor = emailProcessor(mail);
  const inboxAtGoogle = !!email && /@gmail\.com$/i.test(email);
  const webhookConfigured = !!process.env.BOOKING_WEBHOOK_URL;

  return (
    <>
      <PageHero eyebrow="Integritet" title={"Integritets\u00ADpolicy."} intro="Så hanterar vi uppgifterna du skickar till oss." />
      <Section>
        <div className="max-w-3xl space-y-10 leading-relaxed text-mist-200 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-mist-400">
          <section className="space-y-3">
            <h2>Vem ansvarar för dina uppgifter?</h2>
            <p>
              {site.name} är personuppgiftsansvarig för de uppgifter du skickar via webbplatsen.
              {email && (
                <>
                  {" "}
                  Du når oss på{" "}
                  <a href={`mailto:${email}`} className="break-all text-white underline underline-offset-4">
                    {email}
                  </a>
                </>
              )}
              {phone && (
                <>
                  {email ? " eller " : " Du når oss på "}
                  <span className="whitespace-nowrap text-white">{phone}</span>
                </>
              )}
              {(email || phone) && "."}
            </p>
            {show && <Placeholder>Företagets juridiska namn och organisationsnummer</Placeholder>}
          </section>

          <section className="space-y-3">
            <h2>Vilka uppgifter samlar vi in?</h2>
            <p>När du skickar en bokningsförfrågan får vi de uppgifter du själv fyller i:</p>
            <ul>
              <li>namn, telefonnummer och e-postadress</li>
              <li>registreringsnummer eller bilmodell</li>
              <li>önskad tjänst, datum och tid</li>
              <li>om du vill ha mobil bilvård eller hämtning och lämning</li>
              <li>adressen där bilen står eller ska hämtas, och ungefär hur långt från {site.baseTown} det är</li>
              <li>meddelande och bilder, om du väljer att skicka med det</li>
            </ul>
            <p>
              För att stoppa spam används din IP-adress kortvarigt i serverns minne för att begränsa hur många
              förfrågningar som kan skickas. Den sparas inte.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Varför använder vi uppgifterna?</h2>
            <p>Vi använder uppgifterna bara för att:</p>
            <ul>
              {mail.canEmailCustomers ? (
                <>
                  <li>svara på din förfrågan och bekräfta tid och pris</li>
                  <li>skicka ett mejl om att vi har tagit emot förfrågan, och en bekräftelse när tiden är godkänd</li>
                </>
              ) : (
                <li>svara på din förfrågan via telefon, sms eller e-post och bekräfta tid och pris</li>
              )}
              <li>räkna fram reseavgiften och planera besöket eller hämtningen</li>
              <li>utföra jobbet och kontakta dig om det</li>
            </ul>
            <p>
              Den rättsliga grunden är att vidta åtgärder inför ett avtal med dig och att fullgöra avtalet. Uppgifter
              som behövs för bokföringen sparas för att uppfylla krav i lag.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Hur hanteras förfrågan?</h2>
            <p>
              Webbplatsen sparar inte förfrågan i någon databas och personuppgifter loggas inte på servern.
              {mail.canNotifyBusiness
                ? " Förfrågan skickas som e-post till oss, med eventuella bilder som bilagor."
                : webhookConfigured
                  ? " Förfrågan, med eventuella bilder, förs över till det verktyg vi använder för att hålla ordning på bokningarna."
                  : " Förfrågan skickas direkt vidare till oss."}
              {mail.canEmailCustomers && " Du får ett mejl till den e-postadress du angav om att vi har tagit emot förfrågan."}
              {mail.canNotifyBusiness &&
                webhookConfigured &&
                " Förfrågan förs också över till det verktyg vi använder för att hålla ordning på bokningarna."}
            </p>
          </section>

          <section className="space-y-3">
            <h2>Vilka andra behandlar uppgifterna?</h2>
            <p>
              Vi säljer aldrig dina uppgifter. Vi använder leverantörer som behandlar uppgifterna för vår räkning
              (personuppgiftsbiträden):
            </p>
            <ul>
              {processor || !webhookConfigured ? (
                <li>
                  E-post: mejlen skickas via {processor ?? "en e-posttjänst"}
                  {inboxAtGoogle && processor !== "Google (Gmail)" && " och tas emot i vår inkorg hos Google (Gmail)"}
                  {inboxAtGoogle && processor === "Google (Gmail)" && ", där vi också tar emot och svarar på mejl"}.
                </li>
              ) : (
                <li>
                  Bokningsverktyg: förfrågan förs över till det verktyg vi använder för att hålla ordning på bokningarna.
                  {show && (
                    <>
                      {" "}
                      <Placeholder>Ange vilket verktyg förfrågningarna förs över till.</Placeholder>
                    </>
                  )}
                </li>
              )}
              <li>
                Webbhotell: den tjänst som driver webbplatsen tar emot förfrågan och skickar den vidare.
                {show && (
                  <>
                    {" "}
                    <Placeholder>Ange webbhotell (t.ex. Vercel)</Placeholder>
                  </>
                )}
              </li>
            </ul>
            {show && !processor && !webhookConfigured && (
              <Placeholder>E-post är inte konfigurerad ännu – ange e-postleverantör (Gmail eller Resend).</Placeholder>
            )}
          </section>

          <section className="space-y-3">
            <h2>Hur länge sparas uppgifterna?</h2>
            <p>
              Vi sparar uppgifterna så länge de behövs för förfrågan och bokningen, och längre bara när lagen kräver
              det (till exempel bokföringslagen).
            </p>
            {show && <Placeholder>Ange hur länge ni sparar förfrågningar och mejl som inte leder till en bokning.</Placeholder>}
          </section>

          <section className="space-y-3">
            <h2>Cookies och analys</h2>
            <p>
              Webbplatsen använder i dag inga cookies och ingen analys- eller spårningstjänst. Om vi inför det kommer
              vi att be om ditt samtycke först.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Dina rättigheter</h2>
            <p>
              Du har rätt att få veta vilka uppgifter vi har om dig, få dem rättade eller raderade och att invända mot
              behandlingen. <Link href="/kontakt" className="text-white underline underline-offset-4">Kontakta oss</Link>{" "}
              om du vill använda dina rättigheter. Du kan också lämna klagomål till Integritetsskyddsmyndigheten (IMY).
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
