"use client";

import { useState } from "react";
import { getService, site, type GalleryItem } from "@/config/site";
import { BeforeAfter } from "@/components/before-after";
import { SocialLinks } from "@/components/social-links";

const filters = [
  { id: "all", label: "Alla" },
  { id: "exterior", label: "Utvändigt" },
  { id: "interior", label: "Invändigt" },
] as const;

type FilterId = (typeof filters)[number]["id"];

/**
 * Före/efter-galleri som byggs från `site.gallery` i src/config/site.ts.
 * Nya bilder läggs till enligt BILDER.md – ingen kod behöver ändras.
 * Platshållare (`placeholder: true`) märks alltid som exempel och döljs helt
 * när `site.showPlaceholders` är false.
 */
export function Gallery({
  items = site.gallery,
  limit,
  showFilters = true,
  preview = false,
}: {
  items?: GalleryItem[];
  limit?: number;
  showFilters?: boolean;
  /** Startsidans förhandsvisning: två jobb på mobil/surfplatta, tre på dator. */
  preview?: boolean;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const visibleItems = (site.showPlaceholders ? items : items.filter((i) => !i.placeholder))
    .filter((i) => filter === "all" || i.category === filter)
    .slice(0, preview ? 3 : limit);
  const hasPlaceholders = visibleItems.some((i) => i.placeholder);

  return (
    <div>
      {showFilters && (
        <div role="group" aria-label="Filtrera galleriet" className="mb-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                filter === f.id ? "bg-white text-black" : "border border-white/15 text-mist-200 hover:border-white/40 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {hasPlaceholders && (
        <p className="mb-6 rounded-lg border border-dashed border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
          <strong className="font-semibold">Exempelbilder.</strong> Bilderna nedan är tillfälliga platshållare och
          visar inte riktiga kundjobb. Våra egna före- och efterbilder läggs in här (se BILDER.md).
        </p>
      )}

      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-white/10 bg-ink-900 px-6 py-10 text-center">
          <p className="max-w-md text-mist-300">
            {filter === "all"
              ? "Här lägger vi upp före- och efterbilder från våra jobb. Så länge hittar du dem på våra sociala medier."
              : "Inga bilder i den här kategorin än. Fler före- och efterbilder hittar du på våra sociala medier."}
          </p>
          <SocialLinks />
        </div>
      ) : (
        <ul className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item, index) => {
            // Tjänsten visas bara när den är bekräftad (serviceId i site.ts).
            const service = getService(item.serviceId);
            const meta = [item.vehicle, service?.name].filter(Boolean).join(" · ");
            return (
              <li key={item.id} className={`reveal ${preview && index === 2 ? "hidden lg:block" : ""}`}>
                <figure className="rounded-2xl border border-white/10 bg-ink-900 p-3">
                  <BeforeAfter before={item.before} after={item.after} label={item.title} />
                  <figcaption className="flex items-start justify-between gap-4 px-2 pb-1 pt-4">
                    <span>
                      <span className="block font-semibold text-white">{item.title}</span>
                      {meta && <span className="text-sm text-mist-400">{meta}</span>}
                      {item.note && <span className="mt-1 block text-sm text-mist-300">{item.note}</span>}
                    </span>
                    {item.placeholder ? (
                      <span className="shrink-0 rounded-full border border-dashed border-amber-300/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200">
                        Exempel
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-mist-300">
                        {item.category === "interior" ? "Invändigt" : "Utvändigt"}
                      </span>
                    )}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
