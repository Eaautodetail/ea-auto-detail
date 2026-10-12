/**
 * Maskinläsbar sammanfattning av företaget (https://llmstxt.org/).
 * Gör det lätt för AI-assistenter och marknadsföringsagenter att hämta
 * korrekta tjänster, priser och villkor direkt från samma källa som sajten
 * (src/config/site.ts). Inga personuppgifter.
 */
import { currentHours, onSiteNeeds, seasonHoursText, site, socialLinks, type SeasonId } from "@/config/site";
import { formatSEK } from "@/lib/format";
import { paymentMethodsText } from "@/components/payment-info";
import { feeArrangementsText } from "@/components/travel-fees";

export function GET() {
  const { phone, email, serviceArea } = site.contact;
  const hours = currentHours();
  const seasons = Object.keys(site.hours.seasons) as SeasonId[];

  const lines: (string | null)[] = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## Tjänster och priser (SEK)",
    ...site.services.map(
      (s) => `- ${s.name}: ${formatSEK(s.price)}${s.duration ? ` (uppskattad tid: ${s.duration})` : ""}. Ingår: ${s.includes.join("; ")}.`,
    ),
    `- ${site.durationNote}`,
    `- ${site.extraWorkNote}`,
    "- Vi erbjuder inte maskinpolering, lackkorrigering eller andra avancerade behandlingar. Endast tjänsterna ovan kan bokas.",
    "",
    "## Mobil bilvård eller hämtning och lämning",
    ...site.arrangements.map((a) => `- ${a.label}: ${a.description}`),
    ...site.services.map((s) => `- Krav vid mobil bilvård, ${s.name.toLowerCase()}: ${onSiteNeeds(s.id).join("; ")}`),
    `- ${site.onSite.mat}`,
    `- ${site.onSite.pickupNote}`,
    "",
    "## Reseavgift",
    `Tillkommer utöver priset för tjänsten, ${feeArrangementsText()}. Avståndet räknas från ${site.baseTown}.`,
    ...site.travelZones.map((z) =>
      z.fee != null
        ? `- ${z.label}: ${formatSEK(z.fee)}. ${z.description}`
        : `- Osäker på avståndet: ${z.description} Kunden anger sin adress i bokningen.`,
    ),
    `- Vi åker upp till ca ${site.travelMaxKm} km från ${site.baseTown}.`,
    "",
    "## Arbetstider",
    `- ${site.hours.days}. Just nu (${hours.label.toLowerCase()}): ${hours.text}.`,
    ...seasons.map((id) => `- ${site.hours.seasons[id].label}: ${seasonHoursText(id)}`),
    "",
    "## Betalning",
    `- ${paymentMethodsText()}. ${site.payment.when}`,
    "",
    "## Bokning och kontakt",
    "- Boka via bokningsformuläret på webbplatsen (primär bokningsväg).",
    `- En bokningsförfrågan är inte en bekräftad bokning. Tiden gäller först när ${site.name} har bekräftat tid och pris.`,
    `- Svarstid: ${site.responseTime}`,
    phone ? `- Telefon och sms: ${phone}` : null,
    email ? `- E-post: ${email}` : null,
    serviceArea ? `- Område: ${serviceArea}` : null,
    `- Sociala medier: ${socialLinks
      .filter((s) => s.href)
      .map((s) => s.label)
      .join(", ")}`,
    "",
    "## Länkar",
    `- [Boka](${site.url}/boka)`,
    `- [Tjänster & priser](${site.url}/tjanster)`,
    `- [Vanliga frågor](${site.url}/vanliga-fragor)`,
    `- [Kontakt](${site.url}/kontakt)`,
    ...socialLinks.filter((s) => s.href).map((s) => `- [${s.label}](${s.href})`),
  ];

  return new Response(lines.filter((l) => l !== null).join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
