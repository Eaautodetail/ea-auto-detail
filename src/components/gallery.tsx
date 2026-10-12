"use client";

import { useState } from "react";
import { getService, site, type GalleryItem } from "@/config/site";
import { BeforeAfter } from "@/components/before-after";

const filters = [
  { id: "all", label: "Alla" },
  { id: "exterior", label: "Utvändigt" },
  { id: "interior", label: "Invändigt" },
] as const;

type FilterId = (typeof filters)[number]["id"];

export function Gallery({ items = site.gallery, limit, showFilters = true }: { items?: GalleryItem[]; limit?: number; showFilters?: boolean }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const visibleItems = (site.showPlaceholders ? items : items.filter((i) => !i.placeholder))
    .filter((i) => filter === "all" || i.category === filter)
    .slice(0, limit);
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
          <strong className="font-semibold">Exempelbilder.</strong> Bilderna nedan är platshållare och visar inte
          riktiga kundjobb. Byt ut dem mot egna före- och efterbilder i <code className="text-amber-100">src/config/site.ts</code>.
        </p>
      )}

      {visibleItems.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-ink-900 px-6 py-10 text-center text-mist-300">
          Här kommer snart bilder från våra jobb. Följ oss i sociala medier så länge!
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {visibleItems.map((item) => {
            const service = getService(item.serviceId);
            return (
              <li key={item.id} className="reveal">
                <figure className="rounded-2xl border border-white/10 bg-ink-900 p-3">
                  <BeforeAfter before={item.before} after={item.after} label={item.title} />
                  <figcaption className="flex items-center justify-between gap-4 px-2 pb-1 pt-4">
                    <span>
                      <span className="block font-semibold text-white">{item.title}</span>
                      <span className="text-sm text-mist-400">
                        {[item.vehicle, service?.name].filter(Boolean).join(" · ")}
                      </span>
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
