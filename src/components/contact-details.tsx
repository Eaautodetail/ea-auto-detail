import type { ReactNode } from "react";
import { site } from "@/config/site";
import { Icon, InfoCard, Placeholder, type IconName } from "@/components/ui";
import { TrackedAnchor } from "@/components/tracked-anchor";
import { OpeningHours } from "@/components/hours";

const linkClass = "underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white";

/** Telefonnumret i format för tel:/sms:-länkar. */
export function phoneLinkNumber() {
  const { phone, phoneHref } = site.contact;
  return phoneHref ?? phone?.replace(/[^\d+]/g, "") ?? null;
}

/**
 * Kontaktuppgifter från `site.contact`, plus arbetstider och svarstid.
 * Saknade uppgifter visas som platshållare (eller döljs när
 * `showPlaceholders` är false).
 */
export function ContactDetails({
  showHours = true,
  showResponseTime = true,
}: {
  showHours?: boolean;
  showResponseTime?: boolean;
}) {
  const { phone, email, serviceArea } = site.contact;
  const number = phoneLinkNumber();
  const show = site.showPlaceholders;

  const rows: { label: string; icon: IconName; value: ReactNode | null; hint: string }[] = [
    {
      label: "Ring",
      icon: "phone",
      value:
        phone && number ? (
          <TrackedAnchor
            href={`tel:${number}`}
            event="contact_click"
            eventProps={{ method: "phone" }}
            className={`whitespace-nowrap ${linkClass}`}
          >
            {phone}
          </TrackedAnchor>
        ) : null,
      hint: "Telefonnummer",
    },
    {
      label: "SMS",
      icon: "chat",
      value:
        phone && number ? (
          <TrackedAnchor
            href={`sms:${number}`}
            event="contact_click"
            eventProps={{ method: "sms" }}
            className={linkClass}
          >
            Skicka sms till <span className="whitespace-nowrap">{phone}</span>
          </TrackedAnchor>
        ) : null,
      hint: "Mobilnummer för sms",
    },
    {
      label: "E-post",
      icon: "mail",
      value: email ? (
        <TrackedAnchor
          href={`mailto:${email}`}
          event="contact_click"
          eventProps={{ method: "email" }}
          className={`break-all ${linkClass}`}
        >
          {email}
        </TrackedAnchor>
      ) : null,
      hint: "E-postadress",
    },
    { label: "Område", icon: "pin", value: serviceArea, hint: "Serviceområde (orter vi åker till)" },
  ];

  if (showHours) {
    rows.push({ label: "Arbetstider", icon: "clock", value: <OpeningHours variant="list" />, hint: "Arbetstider" });
  }
  if (showResponseTime) {
    rows.push({ label: "Svarstid", icon: "reply", value: site.responseTime, hint: "Svarstid" });
  }

  const visible = rows.filter((r) => r.value || show);
  if (visible.length === 0) return null;

  return (
    <dl className="divide-y divide-white/10 border-y border-white/10">
      {visible.map((r) => (
        <div key={r.label} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="flex items-center gap-2 text-sm text-mist-400">
            <Icon name={r.icon} className="size-4 shrink-0" />
            {r.label}
          </dt>
          <dd className="min-w-0 font-medium text-white">{r.value ?? <Placeholder>{r.hint}</Placeholder>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Svarstiden ordagrant från `site.responseTime` – visas nära bokningsknappar. */
export function ResponseTimeNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm text-mist-300 ${className}`}>
      <Icon name="reply" className="mt-0.5 size-4 shrink-0 text-white" />
      <span>{site.responseTime}</span>
    </p>
  );
}

/** Kort om svarstid och kontaktvägar (formuläret först, telefon/sms sedan). */
export function ResponseTimeCard({ titleAs = "h3", className = "" }: { titleAs?: "h2" | "h3" | "p"; className?: string }) {
  const { phone } = site.contact;
  const number = phoneLinkNumber();
  return (
    <InfoCard icon="reply" title="Svarstid" titleAs={titleAs} className={className}>
      <p className="font-semibold leading-relaxed text-white">{site.responseTime}</p>
      <p className="mt-3 text-sm leading-relaxed text-mist-300">
        Enklast är att skicka en bokningsförfrågan här på sidan.
        {phone && number && (
          <>
            {" "}
            Du kan också ringa eller sms:a{" "}
            <TrackedAnchor
              href={`tel:${number}`}
              event="contact_click"
              eventProps={{ method: "phone" }}
              className={`whitespace-nowrap font-semibold text-white ${linkClass}`}
            >
              {phone}
            </TrackedAnchor>
            .
          </>
        )}
      </p>
    </InfoCard>
  );
}
