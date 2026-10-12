import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-out-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-black shadow-[0_8px_30px_-8px_rgba(255,255,255,0.35)] hover:bg-mist-200 hover:shadow-[0_10px_40px_-8px_rgba(255,255,255,0.45)]",
  secondary: "border border-white/20 bg-white/5 text-white backdrop-blur hover:border-white/40 hover:bg-white/10",
  ghost: "text-mist-200 hover:text-white",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M4 10h11m0 0-4.5-4.5M15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Enkla linjeikoner (24×24) som används i informationskorten. */
const iconPaths = {
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.5V12l3 2",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  phone:
    "M5.5 4h3l1.5 4-2 1.3a11 11 0 0 0 6.7 6.7L16 14l4 1.5v3a2 2 0 0 1-2.1 2A16 16 0 0 1 3.5 6.1 2 2 0 0 1 5.5 4Z",
  chat: "M4.5 5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5V16h-1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  mail: "M4 6h16a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-11A.5.5 0 0 1 4 6Zm-.5.5 8.5 7 8.5-7",
  wallet: "M4 7.5h15.5a.5.5 0 0 1 .5.5v10.5a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1-.5-.5V7.5Zm0 0L16 4v3.5M15.5 13.5h1.5",
  bolt: "M13 3 5.5 13.5h6L10.5 21 18 10.5h-6L13 3Z",
  drop: "M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z",
  parking: "M5.5 4h13a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-15a.5.5 0 0 1 .5-.5ZM10 16.5v-9h3a2.5 2.5 0 0 1 0 5h-3",
  layers: "m12 4 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5",
  swap: "M4 8h14m0 0-3.5-3.5M18 8l-3.5 3.5M20 16H6m0 0 3.5-3.5M6 16l3.5 3.5",
  reply: "M9.5 6.5 4 12l5.5 5.5M4 12h10a6 6 0 0 1 6 6v.5",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5.5m0-9v.01",
  calendar: "M4.5 6h15a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5ZM4 10h16M8 3.5V7m8-3.5V7",
} as const;

export type IconName = keyof typeof iconPaths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

/** Rund ikonbricka till rubriker i informationskort. Dekorativ. */
export function IconBadge({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white ${className}`}
    >
      <Icon name={name} className="size-5" />
    </span>
  );
}

/** Kort med ikon och rubrik – används för arbetstider, betalning, svarstid m.m. */
export function InfoCard({
  icon,
  title,
  titleAs: Title = "h3",
  className = "",
  children,
}: {
  icon: IconName;
  title: ReactNode;
  titleAs?: "h2" | "h3" | "p";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border border-white/10 bg-ink-850 p-6 sm:p-7 ${className}`}>
      <div className="flex items-center gap-3">
        <IconBadge name={icon} />
        <Title className="font-display text-lg font-bold text-white">{title}</Title>
      </div>
      <div className="mt-5 flex-1">{children}</div>
    </div>
  );
}

/** Liten etikett ovanför rubriker ("eyebrow"). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.25em] text-mist-400 ${className}`}>{children}</p>
  );
}

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({
  id,
  className = "",
  children,
  labelledBy,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  as: Tag = "h2",
  align = "left",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2";
  align?: "left" | "center";
}) {
  return (
    <div className={`reveal max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <Tag id={id} className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
        {title}
      </Tag>
      {intro && <p className="mt-5 text-base leading-relaxed text-mist-300 sm:text-lg">{intro}</p>}
    </div>
  );
}

/**
 * Tydligt markerad platshållare för uppgifter som EA Auto Detail ännu inte
 * har lämnat. Visas bara när `site.showPlaceholders` är true.
 */
export function Placeholder({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-start gap-2 rounded-md border border-dashed border-amber-300/50 bg-amber-300/10 px-2.5 py-1.5 text-left text-sm font-medium text-amber-200 ${className}`}
    >
      <span aria-hidden="true" className="mt-px shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-amber-300">
        Fyll i
      </span>
      <span>
        <span className="sr-only">Platshållare: </span>
        {children}
      </span>
    </span>
  );
}
