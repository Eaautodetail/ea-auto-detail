import { site } from "@/config/site";
import { Placeholder } from "@/components/ui";
import { TrackedAnchor } from "@/components/tracked-anchor";

/** Kontaktuppgifter från site.contact. Saknade uppgifter visas som platshållare. */
export function ContactDetails() {
  const { phone, phoneHref, email, serviceArea, availability } = site.contact;
  const show = site.showPlaceholders;

  const rows: { label: string; value: React.ReactNode | null; hint: string }[] = [
    {
      label: "Telefon",
      value: phone ? (
        <TrackedAnchor
          href={`tel:${phoneHref ?? phone.replace(/[^\d+]/g, "")}`}
          event="contact_click"
          eventProps={{ method: "phone" }}
          className="underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          {phone}
        </TrackedAnchor>
      ) : null,
      hint: "Telefonnummer",
    },
    {
      label: "SMS",
      value: phone ? (
        <TrackedAnchor
          href={`sms:${phoneHref ?? phone.replace(/[^\d+]/g, "")}`}
          event="contact_click"
          eventProps={{ method: "sms" }}
          className="underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          Skicka sms
        </TrackedAnchor>
      ) : null,
      hint: "Mobilnummer för sms",
    },
    {
      label: "E-post",
      value: email ? (
        <TrackedAnchor
          href={`mailto:${email}`}
          event="contact_click"
          eventProps={{ method: "email" }}
          className="break-all underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          {email}
        </TrackedAnchor>
      ) : null,
      hint: "E-postadress",
    },
    { label: "Område", value: serviceArea, hint: "Serviceområde (orter vi åker till)" },
    { label: "Tillgänglighet", value: availability, hint: "När vi tar emot bokningar / svarar" },
  ];

  const visible = rows.filter((r) => r.value || show);
  if (visible.length === 0) return null;

  return (
    <dl className="divide-y divide-white/10 border-y border-white/10">
      {visible.map((r) => (
        <div key={r.label} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="text-sm text-mist-400">{r.label}</dt>
          <dd className="font-medium text-white">{r.value ?? <Placeholder>{r.hint}</Placeholder>}</dd>
        </div>
      ))}
    </dl>
  );
}
