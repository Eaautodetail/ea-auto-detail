import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero, CtaBand, FaqList } from "@/components/blocks";
import { ResponseTimeNote } from "@/components/contact-details";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Vanliga frågor om bilvård, mobil service och bokning",
  description: `Svar på vanliga frågor om ${site.name}s biltvätt, invändiga rengöring, mobila bilvård, hämtning och lämning, reseavgift, betalning och bokning i ${site.baseTown}.`,
  alternates: { canonical: "/vanliga-fragor" },
};

export default function FaqPage() {
  const answered = site.faq.filter((f) => f.answer);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow="Vanliga frågor"
        title="Frågor & svar."
        intro="Om tjänster, priser, reseavgift, mobil bilvård, hämtning och lämning, betalning och bokning. Hittar du inte svaret? Hör av dig."
      >
        <ResponseTimeNote />
      </PageHero>
      <Section labelledBy="faq-lista">
        <h2 id="faq-lista" className="sr-only">
          Frågor
        </h2>
        <div className="max-w-3xl">
          <FaqList />
        </div>
      </Section>
      <CtaBand location="faq_page_cta" />
    </>
  );
}
