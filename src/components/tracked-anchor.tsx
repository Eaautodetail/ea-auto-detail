"use client";

import type { ComponentProps } from "react";
import { track, type TrackEvent } from "@/lib/analytics";

/** Vanlig <a> (externa länkar, tel:, mailto:) som rapporterar en händelse. */
export function TrackedAnchor({
  event,
  eventProps,
  onClick,
  ...props
}: ComponentProps<"a"> & {
  event: TrackEvent;
  eventProps?: Record<string, string | number | boolean | undefined>;
}) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
