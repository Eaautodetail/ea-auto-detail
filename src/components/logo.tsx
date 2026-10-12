import Image from "next/image";
import { site } from "@/config/site";

/**
 * Ordmärke för EA Auto Detail. När en riktig logotyp finns: lägg filen i
 * /public och ange den i `site.logo` – då används bilden automatiskt.
 */
export function Logo({ className = "" }: { className?: string }) {
  if (site.logo) {
    return (
      <Image
        src={site.logo.src}
        width={site.logo.width}
        height={site.logo.height}
        alt={site.name}
        className={`h-8 w-auto ${className}`}
        priority
      />
    );
  }

  return (
    <span className={`flex items-center gap-2.5 leading-none ${className}`}>
      <span
        aria-hidden="true"
        className="font-display grid h-8 w-10 place-items-center rounded-md bg-white text-[15px] sm:h-9 sm:w-11 sm:text-[17px] font-black italic tracking-tighter text-black"
      >
        EA
      </span>
      <span className="flex flex-col">
        <span className="font-display text-[13px] font-extrabold uppercase sm:text-[15px] tracking-[0.08em] text-white">
          EA Auto Detail
        </span>
        <span aria-hidden="true" className="mt-1 text-[9px] font-medium uppercase tracking-[0.42em] text-mist-400">
          Bilvård
        </span>
      </span>
    </span>
  );
}
