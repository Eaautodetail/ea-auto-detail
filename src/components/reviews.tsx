/**
 * Visning av recensioner (server). Alla utom de vi har dolt –
 * se src/lib/public-reviews.ts. Finns inga än visas en ärlig
 * tom-ruta, aldrig påhittade recensioner.
 */
import Link from "next/link";
import { site } from "@/config/site";
import { getPublicReviews } from "@/lib/public-reviews";
import { reviewMonth, type PublicReview } from "@/lib/reviews";
import { buttonClasses, CheckIcon } from "@/components/ui";

export function Stars({ rating, className = "size-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} av 5 stjärnor`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" aria-hidden="true" className={`${className} ${n <= rating ? "text-amber-300" : "text-white/15"}`}>
          <path
            fill="currentColor"
            d="M10 1.8l2.47 5.2 5.7.68-4.2 3.92 1.1 5.63L10 14.46l-5.07 2.77 1.1-5.63-4.2-3.92 5.7-.68L10 1.8Z"
          />
        </svg>
      ))}
    </span>
  );
}

export function ReviewCard({ review }: { review: PublicReview }) {
  const service = site.services.find((s) => s.id === review.service);
  return (
    <figure className="reveal flex h-full flex-col rounded-2xl border border-white/10 bg-ink-850 p-6 sm:p-7">
      <Stars rating={review.rating} />
      <blockquote className="mt-4 flex-1 whitespace-pre-line text-base leading-relaxed text-mist-100 [overflow-wrap:anywhere]">
        {review.text}
      </blockquote>
      <figcaption className="mt-6 border-t border-white/10 pt-4">
        <p className="font-semibold text-white [overflow-wrap:anywhere]">{review.name}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mist-400">
          <span>{[service?.name, reviewMonth(review.createdAt)].filter(Boolean).join(" · ")}</span>
          {review.verified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-xs font-medium text-mist-200">
              <CheckIcon className="size-3" /> Bokade via hemsidan
            </span>
          )}
        </p>
      </figcaption>
    </figure>
  );
}

/** Lista med recensioner. `limit` = visa bara de senaste. */
export async function ReviewList({ limit, emptyText }: { limit?: number; emptyText?: string }) {
  const { reviews } = await getPublicReviews();
  const shown = limit ? reviews.slice(0, limit) : reviews;
  if (shown.length === 0) {
    return (
      <div className="reveal rounded-2xl border border-dashed border-white/20 bg-ink-850/60 p-8 text-center sm:p-10">
        <Stars rating={5} className="size-5" />
        <p className="font-display mt-4 text-xl font-bold text-white">Inga recensioner här ännu.</p>
        <p className="mx-auto mt-2 max-w-md text-mist-300">
          {emptyText ?? "Har du anlitat oss? Bli först med att berätta hur det gick."}
        </p>
        <Link href="/recensioner#skriv" className={buttonClasses("primary", "md", "mt-6")}>
          Lämna en recension
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((r) => (
        <li key={r.id}>
          <ReviewCard review={r} />
        </li>
      ))}
    </ul>
  );
}

/** Formuläret – eller ett ärligt besked om att recensioner inte är aktiverade ännu. */
export async function ReviewFormOrNotice({ children }: { children: React.ReactNode }) {
  const { enabled } = await getPublicReviews();
  if (enabled) return <>{children}</>;
  return (
    <div className="rounded-3xl border border-white/10 bg-ink-850 p-6 text-mist-200 sm:p-9">
      <p className="font-semibold text-white">Det går inte att lämna recensioner på hemsidan just nu.</p>
      <p className="mt-2">Skriv gärna till oss i sociala medier i stället – vi blir glada för alla omdömen.</p>
    </div>
  );
}
