/**
 * Mejlmallar för bokningsflödet – endast server.
 *
 *  - Till företaget: ny förfrågan (med länk för att bekräfta tiden).
 *  - Till kunden: kvitto på att förfrågan har TAGITS EMOT (inte bekräftad).
 *  - Till kunden: bekräftelse när företaget har godkänt en tid.
 *
 * Varje mejl byggs av enkla block som blir både HTML och ren text. All text
 * från kunden eller ägaren escapas i HTML-versionen. Företagsuppgifter
 * (priser, betalning, kontakt, krav på plats) hämtas från src/config/site.ts.
 */
import { onSiteNeeds, site, socialLinks } from "@/config/site";
import { bookingAsText, priceSummary, type BookingFields } from "@/lib/booking";
import type { BookingTokenData } from "@/lib/booking-token";
import { formatDate, formatSEK } from "@/lib/format";

export type RenderedEmail = { subject: string; text: string; html: string };

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "notice"; title: string; text?: string; tone: "strong" | "soft" }
  | { kind: "rows"; title?: string; rows: [label: string, value: string][] }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "button"; label: string; href: string; fallback?: string }
  | { kind: "pre"; text: string }
  | { kind: "contact"; intro: string };

const C = {
  page: "#ececee",
  card: "#ffffff",
  ink: "#0e0f11",
  text: "#232428",
  muted: "#5f6168",
  line: "#e4e4e7",
  soft: "#f4f4f5",
  onDark: "#d4d5d9",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Tar bort styrtecken och riktningsmarkeringar från text som användaren har skrivit. */
export function cleanText(value: string, { multiline = false } = {}) {
  const withoutBidi = value.replace(/[‪-‮⁦-⁩‎‏]/g, "");
  return multiline
    ? withoutBidi.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    : withoutBidi.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
}

const html = (s: string) => escapeHtml(s).replace(/\n/g, "<br>");

function renderHtmlBlock(b: Block): string {
  switch (b.kind) {
    case "heading":
      return `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:800;color:${C.ink};">${html(b.text)}</h1>`;
    case "paragraph":
      return `<p style="margin:0 0 16px;font-size:${b.muted ? 13 : 15}px;line-height:1.6;color:${b.muted ? C.muted : C.text};">${html(b.text)}</p>`;
    case "notice": {
      const strong = b.tone === "strong";
      const box = strong
        ? `background:${C.ink};color:#ffffff;border-radius:12px;`
        : `background:${C.soft};color:${C.ink};border-left:4px solid ${C.ink};border-radius:4px;`;
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="${box}padding:16px 18px;">
<div style="font-size:16px;line-height:1.4;font-weight:700;">${html(b.title)}</div>${
        b.text
          ? `<div style="margin-top:6px;font-size:14px;line-height:1.55;color:${strong ? C.onDark : C.text};">${html(b.text)}</div>`
          : ""
      }</td></tr></table>`;
    }
    case "rows":
      return `${b.title ? sectionTitle(b.title) : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">${b.rows
        .map(
          ([label, value]) =>
            `<tr><td valign="top" style="padding:9px 12px 9px 0;border-bottom:1px solid ${C.line};font-size:14px;line-height:1.45;color:${C.muted};width:38%;">${html(label)}</td><td valign="top" style="padding:9px 0;border-bottom:1px solid ${C.line};font-size:14px;line-height:1.45;color:${C.ink};font-weight:600;">${html(value)}</td></tr>`,
        )
        .join("")}</table>`;
    case "list":
      return `${b.title ? sectionTitle(b.title) : ""}<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.6;color:${C.text};">${b.items
        .map((i) => `<li style="margin:0 0 4px;">${html(i)}</li>`)
        .join("")}</ul>`;
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 12px;"><tr><td style="border-radius:999px;background:${C.ink};"><a href="${escapeHtml(b.href)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${html(b.label)}</a></td></tr></table>${
        b.fallback
          ? `<p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:${C.muted};">${html(b.fallback)}<br><a href="${escapeHtml(b.href)}" style="color:${C.muted};word-break:break-all;">${escapeHtml(b.href)}</a></p>`
          : ""
      }`;
    case "pre":
      return `<pre style="margin:0 0 20px;padding:16px;background:${C.soft};border-radius:10px;white-space:pre-wrap;word-break:break-word;font-family:${FONT};font-size:14px;line-height:1.55;color:${C.ink};">${escapeHtml(b.text)}</pre>`;
    case "contact":
      return `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${C.text};">${html(b.intro)}</p>${contactLinesHtml()}`;
  }
}

function sectionTitle(title: string) {
  return `<p style="margin:8px 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">${html(title)}</p>`;
}

function contactLines(): { label: string; value: string; href: string | null }[] {
  const lines: { label: string; value: string; href: string | null }[] = [];
  if (site.contact.phone) {
    lines.push({ label: "Ring", value: site.contact.phone, href: site.contact.phoneHref ? `tel:${site.contact.phoneHref}` : null });
    lines.push({ label: "SMS", value: site.contact.phone, href: site.contact.phoneHref ? `sms:${site.contact.phoneHref}` : null });
  }
  for (const s of socialLinks) {
    if (s.href) lines.push({ label: s.label, value: s.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/?(\?.*)?$/, ""), href: s.href });
  }
  return lines;
}

function contactLinesHtml() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${contactLines()
    .map(
      (l) =>
        `<tr><td style="padding:3px 14px 3px 0;font-size:14px;color:${C.muted};">${html(l.label)}</td><td style="padding:3px 0;font-size:14px;">${
          l.href
            ? `<a href="${escapeHtml(l.href)}" style="color:${C.ink};font-weight:600;">${html(l.value)}</a>`
            : `<span style="color:${C.ink};font-weight:600;">${html(l.value)}</span>`
        }</td></tr>`,
    )
    .join("")}</table>`;
}

function renderTextBlock(b: Block): string {
  switch (b.kind) {
    case "heading":
      return b.text;
    case "paragraph":
      return b.text;
    case "notice":
      return b.tone === "strong" ? `>> ${b.title}${b.text ? `\n${b.text}` : ""}` : `${b.title}${b.text ? `\n${b.text}` : ""}`;
    case "rows":
      return [b.title?.toUpperCase(), ...b.rows.map(([l, v]) => `${l}: ${v}`)].filter(Boolean).join("\n");
    case "list":
      return [b.title?.toUpperCase(), ...b.items.map((i) => `- ${i}`)].filter(Boolean).join("\n");
    case "button":
      return `${b.label}:\n${b.href}`;
    case "pre":
      return b.text;
    case "contact":
      return [b.intro, ...contactLines().map((l) => `${l.label}: ${l.label === "Ring" || l.label === "SMS" ? l.value : l.href}`)].join("\n");
  }
}

function render(subject: string, preheader: string, blocks: Block[], footer: string): RenderedEmail {
  const text = [...blocks.map(renderTextBlock), "--", footer].join("\n\n");
  const body = blocks.map(renderHtmlBlock).join("\n");
  const htmlDoc = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${C.card};border-radius:16px;overflow:hidden;font-family:${FONT};">
<tr><td style="background:${C.ink};padding:22px 28px;">
<div style="font-size:15px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;">${escapeHtml(site.name)}</div>
<div style="margin-top:6px;font-size:13px;color:#8d8f96;">${escapeHtml(site.tagline)}</div>
</td></tr>
<tr><td style="padding:28px 28px 12px;">
${body}
</td></tr>
<tr><td style="padding:18px 28px 22px;background:${C.soft};border-top:1px solid ${C.line};font-size:12px;line-height:1.55;color:${C.muted};">${html(footer)}</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
  return { subject, text, html: htmlDoc };
}

/* ---------------------------------------------------------------- hjälp */

const firstName = (name: string) => cleanText(name).split(/\s+/)[0] || cleanText(name);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const timeText = (time: string) => (time === "Flexibel" ? "flexibel tid" : `kl. ${time}`);

function onSiteBlocks(serviceId: string, arrangementId: string): Block[] {
  if (arrangementId === "visit") {
    return [
      { kind: "list", title: "Det här behöver vi på plats", items: onSiteNeeds(serviceId) },
      { kind: "paragraph", text: site.onSite.mat, muted: true },
    ];
  }
  if (arrangementId === "pickup") return [{ kind: "paragraph", text: site.onSite.pickupNote }];
  return [];
}

function paymentBlock(): Block {
  return { kind: "list", title: "Betalning", items: [`Betalsätt: ${site.payment.methods.join(", ")}`, site.payment.when] };
}

const customerFooter = (reason: string) =>
  `${site.name}${site.contact.serviceArea ? ` · ${site.contact.serviceArea}` : ""}\n${reason}`;

/* ---------------------------------------------------- till företaget */

export function businessNotificationEmail(
  v: BookingFields,
  reference: string,
  photoCount: number,
  opts: { manageUrl: string | null; customerReceipt: "sending" | "not_configured" | "invalid_address" },
): RenderedEmail {
  const { service } = priceSummary(v.service, v.arrangement, v.travelZone);
  const subject = `Bokningsförfrågan ${reference}: ${service?.name ?? v.service} – ${cleanText(v.name).slice(0, 80)}`;
  const summary = bookingAsText(v, reference, photoCount);

  const receiptNote =
    opts.customerReceipt === "sending"
      ? "Kunden får ett automatiskt kvitto på att förfrågan har tagits emot. Det står tydligt att tiden INTE är bekräftad än."
      : opts.customerReceipt === "invalid_address"
        ? "Kunden har INTE fått något automatiskt kvitto (e-postadressen kunde inte användas). Kontakta kunden via telefon/SMS."
        : "Kunden har INTE fått något automatiskt mejl – e-post till kunder är inte konfigurerad (se README). Kontakta kunden via telefon/SMS.";

  const blocks: Block[] = [
    { kind: "heading", text: `Ny bokningsförfrågan ${reference}` },
    { kind: "notice", tone: "soft", title: "Inte bekräftad än", text: receiptNote },
  ];
  if (opts.manageUrl) {
    blocks.push(
      {
        kind: "button",
        label: "Bekräfta tid och skicka bekräftelse",
        href: opts.manageUrl,
        fallback: "Fungerar inte knappen? Öppna länken:",
      },
      {
        kind: "paragraph",
        muted: true,
        text: "Länken fungerar i 60 dagar och ger tillgång till kundens uppgifter – vidarebefordra den inte.",
      },
    );
  }
  blocks.push({ kind: "pre", text: summary });

  const text = [
    summary,
    "",
    receiptNote,
    ...(opts.manageUrl
      ? ["", "Bekräfta tid och skicka bekräftelse till kunden:", opts.manageUrl, "(Länken fungerar i 60 dagar – vidarebefordra den inte.)"]
      : []),
  ].join("\n");
  const rendered = render(subject, `${service?.name ?? ""} – ${cleanText(v.name)}`, blocks, `Skickat automatiskt från bokningsformuläret på ${site.name}s webbplats.`);
  return { ...rendered, text };
}

/* ------------------------------------------ kvitto till kunden */

export function customerReceiptEmail(v: BookingFields, reference: string): RenderedEmail {
  const { service, arrangement, zone, base, fee, feeKnown, total } = priceSummary(v.service, v.arrangement, v.travelZone);
  const subject = `Vi har tagit emot din bokningsförfrågan (${reference})`;

  const travelFee = !arrangement?.feeApplies
    ? "Ingen"
    : zone?.fee != null
      ? `${formatSEK(fee)} (${zone.label.charAt(0).toLowerCase()}${zone.label.slice(1)})`
      : "Bekräftas av oss utifrån adressen";

  const rows: [string, string][] = [
    ["Referens", reference],
    ["Tjänst", service ? `${service.name} – ${formatSEK(base)}` : v.service],
    ["Upplägg", arrangement?.label ?? v.arrangement],
  ];
  if (v.location) rows.push(["Adress", cleanText(v.location)]);
  rows.push(
    ["Reseavgift", travelFee],
    ["Önskad dag", `${capitalize(formatDate(v.date))}, ${timeText(v.time)}`],
    ["Bil", cleanText(v.vehicle)],
  );
  if (service?.duration) rows.push(["Ungefärlig tidsåtgång", `${service.duration} (uppskattning)`]);
  rows.push(["Preliminärt pris", feeKnown ? formatSEK(total) : `${formatSEK(total)} + reseavgift (bekräftas)`]);

  const blocks: Block[] = [
    { kind: "heading", text: `Tack ${firstName(v.name)}! Vi har tagit emot din förfrågan.` },
    {
      kind: "notice",
      tone: "strong",
      title: "Observera: tiden är inte bekräftad än",
      text: "Det här är ett kvitto på att vi har fått din förfrågan – inte en bokningsbekräftelse. Vi går igenom den och bekräftar tid och pris. Först då är bokningen klar.",
    },
    { kind: "paragraph", text: site.responseTime },
    { kind: "rows", title: "Din förfrågan", rows },
    { kind: "paragraph", text: `${site.extraWorkNote} ${site.durationNote}`, muted: true },
    ...onSiteBlocks(v.service, v.arrangement),
    paymentBlock(),
    { kind: "contact", intro: "Har du frågor eller vill ändra något? Svara på det här mejlet eller kontakta oss:" },
  ];

  return render(
    subject,
    `Tiden är inte bekräftad än. ${site.responseTime}`,
    blocks,
    customerFooter(
      `Du får det här mejlet för att någon skickade en bokningsförfrågan med den här e-postadressen på ${site.name}s webbplats. Var det inte du kan du bortse från mejlet.`,
    ),
  );
}

/* ------------------------------------- bekräftelse till kunden */

export type ConfirmedDetails = {
  /** ÅÅÅÅ-MM-DD */
  date: string;
  /** "HH.MM" */
  time: string;
  /** Totalpris i SEK. */
  price: number;
  message: string;
};

export function confirmationHeadline(date: string, time: string) {
  return `${capitalize(formatDate(date))} kl. ${time}`;
}

export function customerConfirmationEmail(b: BookingTokenData, c: ConfirmedDetails): RenderedEmail {
  const { service, arrangement } = priceSummary(b.service, b.arrangement, b.travelZone);
  const when = confirmationHeadline(c.date, c.time);
  const subject = `Din tid är bekräftad: ${formatDate(c.date)} kl. ${c.time} (${b.reference})`;

  const rows: [string, string][] = [
    ["Referens", b.reference],
    ["Tjänst", service?.name ?? b.service],
    ["Upplägg", arrangement?.label ?? b.arrangement],
  ];
  if (b.location) rows.push(["Adress", cleanText(b.location)]);
  rows.push(["Bil", cleanText(b.vehicle)]);
  if (service?.duration) rows.push(["Ungefärlig tidsåtgång", `${service.duration} (uppskattning)`]);
  rows.push(["Pris", `${formatSEK(c.price)}${arrangement?.feeApplies ? " inkl. reseavgift" : ""}`]);

  const message = cleanText(c.message, { multiline: true }).trim();
  const blocks: Block[] = [
    { kind: "heading", text: `Hej ${firstName(b.name)}! Din tid är bekräftad.` },
    {
      kind: "notice",
      tone: "strong",
      title: when,
      text: [service?.name, arrangement?.label].filter(Boolean).join(" · "),
    },
    ...(message ? [{ kind: "notice", tone: "soft", title: "Meddelande från oss", text: message } satisfies Block] : []),
    { kind: "rows", title: "Din bokning", rows },
    { kind: "paragraph", text: site.extraWorkNote, muted: true },
    ...onSiteBlocks(b.service, b.arrangement),
    paymentBlock(),
    { kind: "contact", intro: "Behöver du ändra något? Svara på det här mejlet eller kontakta oss:" },
  ];

  return render(
    subject,
    `${when} – ${service?.name ?? ""}`,
    blocks,
    customerFooter(`Du får det här mejlet för att du har skickat en bokningsförfrågan till ${site.name} (${b.reference}).`),
  );
}
