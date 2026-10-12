import { site, socialLinks } from "@/config/site";
import { Placeholder } from "@/components/ui";
import { TrackedAnchor } from "@/components/tracked-anchor";

const icons: Record<string, React.ReactNode> = {
  tiktok: (
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.4-2.47V9.69a5.68 5.68 0 0 0-.8-.06A5.71 5.71 0 0 0 4.15 15.3 5.71 5.71 0 0 0 9.86 21a5.71 5.71 0 0 0 5.71-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.27-1.48Z" />
  ),
  instagram: (
    <path d="M12 7.38A4.62 4.62 0 1 0 16.62 12 4.62 4.62 0 0 0 12 7.38Zm0 7.62a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm5.88-7.8a1.08 1.08 0 1 1-1.08-1.08 1.08 1.08 0 0 1 1.08 1.08ZM21 8.29a5.32 5.32 0 0 0-1.45-3.77A5.36 5.36 0 0 0 15.78 3.07C14.29 3 9.71 3 8.22 3.07a5.35 5.35 0 0 0-3.77 1.44A5.34 5.34 0 0 0 3 8.28c-.08 1.49-.08 5.95 0 7.44a5.32 5.32 0 0 0 1.45 3.77 5.37 5.37 0 0 0 3.77 1.45c1.49.08 6.07.08 7.56 0a5.32 5.32 0 0 0 3.77-1.45A5.36 5.36 0 0 0 21 15.72c.09-1.49.09-5.94 0-7.43Zm-1.94 9.03a3.05 3.05 0 0 1-1.72 1.72c-1.19.47-4 .36-5.34.36s-4.16.1-5.34-.36a3.05 3.05 0 0 1-1.72-1.72C4.47 16.13 4.58 13.33 4.58 12s-.1-4.14.36-5.32A3.05 3.05 0 0 1 6.66 4.96C7.85 4.49 10.66 4.6 12 4.6s4.15-.1 5.34.36a3.05 3.05 0 0 1 1.72 1.72c.47 1.19.36 4 .36 5.32s.11 4.14-.36 5.32Z" />
  ),
  facebook: (
    <path d="M13.5 21v-7.6h2.56l.38-2.97H13.5V8.53c0-.86.24-1.44 1.47-1.44h1.57V4.44a21 21 0 0 0-2.29-.12c-2.27 0-3.82 1.38-3.82 3.93v2.18H7.87v2.97h2.56V21h3.07Z" />
  ),
};

export function SocialIcon({ id, className = "size-5" }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {icons[id]}
    </svg>
  );
}

/**
 * Länkar till sociala medier. Kanaler utan riktig adress visas som
 * platshållare (eller döljs när `showPlaceholders` är false).
 */
export function SocialLinks({ variant = "pills" }: { variant?: "pills" | "icons" }) {
  const available = socialLinks.filter((s) => s.href);
  const missing = socialLinks.filter((s) => !s.href);

  return (
    <div className="flex flex-col gap-3">
      {available.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {available.map((s) => (
            <li key={s.id}>
              <TrackedAnchor
                href={s.href!}
                target="_blank"
                rel="noopener noreferrer"
                event="social_link_click"
                eventProps={{ network: s.id }}
                className={
                  variant === "icons"
                    ? "grid size-11 place-items-center rounded-full border border-white/15 text-mist-200 transition-colors hover:border-white/40 hover:text-white"
                    : "inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10"
                }
              >
                <SocialIcon id={s.id} />
                <span className={variant === "icons" ? "sr-only" : ""}>
                  {s.label}
                  <span className="sr-only"> (öppnas i ny flik)</span>
                </span>
              </TrackedAnchor>
            </li>
          ))}
        </ul>
      )}
      {site.showPlaceholders && missing.length > 0 && (
        <Placeholder>Länk till {missing.map((s) => s.label).join(", ")} saknas</Placeholder>
      )}
    </div>
  );
}
