import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/blocks";
import { Gallery } from "@/components/gallery";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Galleri – före och efter",
  description: "Före- och efterbilder från EA Auto Detail: utvändig biltvätt och invändig bilrengöring.",
  alternates: { canonical: "/galleri" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Galleri"
        title="Före & efter."
        intro="Här samlar vi resultat från våra jobb. Dra i reglaget på varje bild för att jämföra."
      />
      <Section labelledBy="galleri-lista">
        <h2 id="galleri-lista" className="sr-only">
          Jobb
        </h2>
        <Gallery />
      </Section>
      <CtaBand title="Vill du se din bil här?" location="gallery_page_cta" />
    </>
  );
}
