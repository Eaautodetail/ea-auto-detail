/**
 * Maskinläsbar sammanfattning av företaget (https://llmstxt.org/).
 * Gör det lätt för AI-assistenter och marknadsföringsagenter att hämta
 * korrekta tjänster och priser direkt från samma källa som sajten.
 */
import { site, socialLinks } from "@/config/site";
import { formatSEK } from "@/lib/format";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## Tjänster och priser (SEK)",
    ...site.services.map((s) => `- ${s.name}: ${formatSEK(s.price)} – ${s.summary}`),
    "",
    "## Villkor",
    `- Mobil serviceavgift: ${formatSEK(site.mobileFee)} när vi åker till kunden eller hämtar och lämnar bilen.`,
    "- Extra smutsiga bilar eller extra arbete kan kosta mer. Kunden får ett prisförslag och måste godkänna det innan extraarbetet påbörjas.",
    "- Bokningar görs som förfrågan via webbplatsen och gäller först när EA Auto Detail har bekräftat tid och pris.",
    "- Vi erbjuder inte lackkorrigering eller maskinpolering.",
    "",
    "## Länkar",
    `- [Boka](${site.url}/boka)`,
    `- [Tjänster & priser](${site.url}/tjanster)`,
    `- [Vanliga frågor](${site.url}/vanliga-fragor)`,
    ...socialLinks.filter((s) => s.href).map((s) => `- [${s.label}](${s.href})`),
    site.contact.serviceArea ? `\nServiceområde: ${site.contact.serviceArea}` : "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
