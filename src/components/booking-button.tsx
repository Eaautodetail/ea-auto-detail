import type { ReactNode } from "react";
import type { ServiceId } from "@/config/site";
import { TrackedLink } from "@/components/tracked-link";
import { ArrowIcon, buttonClasses } from "@/components/ui";

/** Den primära konverteringsknappen. Används överallt där man kan boka. */
export function BookingButton({
  location,
  service,
  variant = "primary",
  size = "lg",
  className = "",
  children = "Skicka bokningsförfrågan",
}: {
  location: string;
  service?: ServiceId;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <TrackedLink
      href={service ? `/boka?tjanst=${service}` : "/boka"}
      event="booking_cta_click"
      eventProps={{ location, service }}
      className={buttonClasses(variant, size, `group ${className}`)}
    >
      {children}
      <ArrowIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </TrackedLink>
  );
}
