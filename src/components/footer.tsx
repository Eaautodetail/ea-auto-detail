import Link from "next/link";
import { navigation, site } from "@/config/site";
import { Logo } from "@/components/logo";
import { SocialLinks } from "@/components/social-links";
import { BookingButton } from "@/components/booking-button";
import { phoneLinkNumber, ResponseTimeNote } from "@/components/contact-details";
import { OpeningHours } from "@/components/hours";
import { paymentMethodsText } from "@/components/payment-info";
import { TrackedAnchor } from "@/components/tracked-anchor";
import { Container } from "@/components/ui";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-mist-400">{children}</h2>;
}

const linkClass = "text-mist-200 transition-colors hover:text-white";

export function Footer() {
  const { phone, email, serviceArea } = site.contact;
  const number = phoneLinkNumber();

  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_0.9fr]">
        <div className="flex flex-col items-start gap-5">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-mist-400">
            {site.tagline}. Mobil bilvård samt hämtning och lämning i {serviceArea ?? site.baseTown}.
          </p>
          <BookingButton location="footer" size="md" />
          <ResponseTimeNote className="max-w-xs" />
        </div>

        <div>
          <FooterHeading>Kontakt</FooterHeading>
          <ul className="space-y-2.5 text-sm">
            {phone && number && (
              <>
                <li>
                  <TrackedAnchor
                    href={`tel:${number}`}
                    event="contact_click"
                    eventProps={{ method: "phone", location: "footer" }}
                    className={linkClass}
                  >
                    Ring <span className="whitespace-nowrap font-semibold text-white">{phone}</span>
                  </TrackedAnchor>
                </li>
                <li>
                  <TrackedAnchor
                    href={`sms:${number}`}
                    event="contact_click"
                    eventProps={{ method: "sms", location: "footer" }}
                    className={linkClass}
                  >
                    Skicka sms
                  </TrackedAnchor>
                </li>
              </>
            )}
            {email && (
              <li>
                <TrackedAnchor
                  href={`mailto:${email}`}
                  event="contact_click"
                  eventProps={{ method: "email", location: "footer" }}
                  className={`break-all ${linkClass}`}
                >
                  {email}
                </TrackedAnchor>
              </li>
            )}
            <li>
              <Link href="/kontakt" className={linkClass}>
                Alla kontaktvägar
              </Link>
            </li>
          </ul>

          <div className="mt-8">
            <FooterHeading>Följ oss</FooterHeading>
            <SocialLinks variant="list" />
          </div>
        </div>

        <div>
          <FooterHeading>Arbetstider</FooterHeading>
          <OpeningHours variant="list" />

          <div className="mt-8">
            <FooterHeading>Betalning</FooterHeading>
            <p className="text-sm text-mist-200">{paymentMethodsText()}</p>
            <p className="mt-1 text-sm text-mist-400">{site.payment.when}</p>
          </div>
        </div>

        <nav aria-label="Sidfot">
          <FooterHeading>Sidor</FooterHeading>
          <ul className="space-y-2.5 text-sm">
            {[{ href: "/", label: "Hem" }, ...navigation, { href: "/boka", label: "Boka" }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-mist-400 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p>
          © <CopyrightYear /> {site.name}
        </p>
        <p>Alla priser anges i svenska kronor (SEK).</p>
        <Link href="/integritet" className="transition-colors hover:text-white">
          Integritetspolicy
        </Link>
      </Container>
    </footer>
  );
}

async function CopyrightYear() {
  "use cache";
  // Årtalet sätts när sidan byggs/cachas.
  return <>{new Date().getFullYear()}</>;
}
