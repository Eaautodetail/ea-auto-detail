"use client";

import Image from "next/image";
import { useId, useState } from "react";

/** Standardformat innan bilden har laddats: stående 3:4, som en vanlig mobilbild. */
const DEFAULT_RATIO = 3 / 4;

/**
 * Före/efter-jämförelse med dragbar avdelare. Styrs med mus, touch eller
 * tangentbord (piltangenter) via ett vanligt range-reglage.
 *
 * Formatet (stående eller liggande) följer efterbilden automatiskt, så både
 * mobilbilder (3:4) och liggande bilder (4:3) fungerar utan inställningar.
 * Ta före- och efterbilden från samma vinkel och i samma format.
 */
export function BeforeAfter({
  before,
  after,
  label,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  label: string;
  sizes?: string;
}) {
  const [pos, setPos] = useState(50);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const id = useId();

  return (
    <div
      className="group relative w-full select-none overflow-hidden rounded-xl bg-ink-800"
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={after.src}
        alt={after.alt}
        fill
        sizes={sizes}
        className="object-cover"
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          // Begränsa till rimliga format så att extrema bilder inte blir jättehöga eller platta.
          if (w && h) setRatio(Math.min(16 / 9, Math.max(9 / 16, w / h)));
        }}
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before.src} alt={before.alt} fill sizes={sizes} className="object-cover" />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
        Före
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
        Efter
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `calc(${pos}% - 1px)` }}>
        <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg transition-transform group-has-[:focus-visible]:scale-110 group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-white/40">
          <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
            <path d="m7 5-4 5 4 5M13 5l4 5-4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <label htmlFor={id} className="sr-only">
        Jämför före och efter: {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-valuetext={`${pos}% före-bild synlig`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
