"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import { track } from "@/lib/analytics";
import { ArrowIcon, Icon } from "@/components/ui";

/** Sidor där knapparna inte behövs (bokningen själv och interna sidor). */
const HIDDEN_ON = ["/boka", "/hantera", "/recensioner/dolj"];

/**
 * Fast rad längst ned på mobil med "Boka", "Ring" och "SMS". Visas på alla
 * sidor utom de i HIDDEN_ON. En lika hög tom yta under sidfoten gör att
 * inget innehåll hamnar bakom raden.
 */
export function MobileActionBar() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const number = site.contact.phoneHref;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Snabbval"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/boka"
            onClick={() => track("booking_cta_click", { location: "mobile_bar" })}
            className="group inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 text-base font-bold text-black"
          >
            Boka tid
            <ArrowIcon className="size-4 shrink-0" />
          </Link>
          {number && (
            <>
              <a
                href={`tel:${number}`}
                onClick={() => track("contact_click", { method: "phone", location: "mobile_bar" })}
                className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-4 text-sm font-semibold text-white"
              >
                <Icon name="phone" className="size-4" />
                Ring
              </a>
              <a
                href={`sms:${number}`}
                onClick={() => track("contact_click", { method: "sms", location: "mobile_bar" })}
                className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-4 text-sm font-semibold text-white"
              >
                <Icon name="chat" className="size-4" />
                SMS
              </a>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
