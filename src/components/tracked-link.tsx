"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type TrackEvent } from "@/lib/analytics";

/** Länk som rapporterar en händelse (t.ex. klick på "Boka") via `track()`. */
export function TrackedLink({
  event,
  eventProps,
  onClick,
  ...props
}: ComponentProps<typeof Link> & {
  event: TrackEvent;
  eventProps?: Record<string, string | number | boolean | undefined>;
}) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
