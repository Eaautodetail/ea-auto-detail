import type { Metadata } from "next";
import { PageHero } from "@/components/blocks";
import { HideReview } from "@/components/hide-review";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Dölj recension",
  robots: { index: false, follow: false },
};

export default function HideReviewPage() {
  return (
    <>
      <PageHero eyebrow="Recensioner" title="Dölj en recension." intro="Recensionen tas bort från hemsidan men finns kvar sparad." />
      <Section>
        <HideReview />
      </Section>
    </>
  );
}
