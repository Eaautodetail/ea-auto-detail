import Link from "next/link";
import { navigation, site } from "@/config/site";
import { Logo } from "@/components/logo";
import { SocialLinks } from "@/components/social-links";
import { BookingButton } from "@/components/booking-button";
import { Container } from "@/components/ui";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-5">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-mist-400">
            Noggrann bilvård till schyssta priser. Vi kommer till dig eller hämtar och lämnar bilen – du väljer det
            som passar.
          </p>
          <BookingButton location="footer" size="md" />
        </div>

        <nav aria-label="Sidfot">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-mist-400">Sidor</p>
          <ul className="space-y-2.5 text-sm">
            {[...navigation, { href: "/boka", label: "Boka" }, { href: "/integritet", label: "Integritetspolicy" }].map(
              (item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-mist-200 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-mist-400">Följ oss</p>
          <SocialLinks variant="icons" />
        </div>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-mist-400 sm:flex-row sm:justify-between">
        <p>
          © <CopyrightYear /> {site.name}
        </p>
        <p>Alla priser anges i svenska kronor (SEK).</p>
      </Container>
    </footer>
  );
}

async function CopyrightYear() {
  "use cache";
  // Årtalet sätts när sidan byggs/cachas.
  return <>{new Date().getFullYear()}</>;
}
