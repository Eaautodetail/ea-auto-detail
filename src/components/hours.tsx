/**
 * Arbetstider. Allt läses från `site.hours` i src/config/site.ts – byt
 * `currentSeason` där när säsongen skiftar så uppdateras hela sajten.
 */
import { currentHours, seasonHoursText, site, type SeasonId } from "@/config/site";
import { InfoCard } from "@/components/ui";

const seasonIds = Object.keys(site.hours.seasons) as SeasonId[];

/** T.ex. "Alla dagar 09.00–18.00" för aktuell säsong. */
export function currentHoursText() {
  return `${site.hours.days} ${currentHours().text}`;
}

function SeasonList({ tone = "card" }: { tone?: "card" | "plain" }) {
  const current = site.hours.currentSeason;
  if (tone === "plain") {
    return (
      <ul className="space-y-0.5 text-sm text-mist-400">
        {seasonIds.map((id) => (
          <li key={id}>
            {site.hours.seasons[id].label}: <span className="whitespace-nowrap">{seasonHoursText(id)}</span>
            {id === current && <span className="text-mist-300"> (gäller nu)</span>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-white/10 border-t border-white/10 text-sm">
      {seasonIds.map((id) => {
        const active = id === current;
        return (
          <li key={id} className="flex items-center justify-between gap-3 py-2.5">
            <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${active ? "text-white" : "text-mist-400"}`}>
              {site.hours.seasons[id].label}
              {active && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                  Gäller nu
                </span>
              )}
            </span>
            <span className={`whitespace-nowrap font-semibold ${active ? "text-white" : "text-mist-400"}`}>
              {seasonHoursText(id)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Arbetstider med aktuell säsong framhävd och båda säsongerna listade.
 * - `card`: eget kort med rubrik (startsida, kontakt, tjänster)
 * - `list`: kompakt text (sidfot, kontaktuppgifter)
 */
export function OpeningHours({
  variant = "card",
  titleAs = "h3",
  className = "",
}: {
  variant?: "card" | "list";
  titleAs?: "h2" | "h3" | "p";
  className?: string;
}) {
  const now = currentHours();

  if (variant === "list") {
    return (
      <div className={className}>
        <p className="font-medium text-white">
          {site.hours.days} <span className="whitespace-nowrap">{now.text}</span>
        </p>
        <div className="mt-1">
          <SeasonList tone="plain" />
        </div>
      </div>
    );
  }

  return (
    <InfoCard icon="clock" title="Arbetstider" titleAs={titleAs} className={className}>
      <p className="text-sm text-mist-300">{site.hours.days}</p>
      <p className="font-display mt-1 text-4xl font-extrabold tracking-tight text-white">{now.text}</p>
      <div className="mt-5">
        <SeasonList />
      </div>
    </InfoCard>
  );
}
