import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero, CtaBand } from "@/components/blocks";
import { Gallery } from "@/components/gallery";
import { SocialLinks } from "@/components/social-links";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Galleri – före och efter",
  description: `Före- och efterbilder från ${site.name}: utvändig biltvätt och invändig bilrengöring i ${site.baseTown} med omnejd.`,
  alternates: { canonical: "/galleri" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Galleri"
        title="Före & efter."
        intro="Här samlar vi före- och efterbilder från våra jobb. Dra i reglaget på varje bild för att jämföra. Fler bilder och klipp finns på våra sociala medier."
      >
        <SocialLinks />
      </PageHero>
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
