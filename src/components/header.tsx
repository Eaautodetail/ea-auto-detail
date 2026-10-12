"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/config/site";
import { Logo } from "@/components/logo";
import { TrackedLink } from "@/components/tracked-link";
import { buttonClasses } from "@/components/ui";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Stäng menyn vid sidbyte.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape stänger menyn, fokus hålls inom panelen och sidan scrollar inte bakom.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const button = menuButton.current;
    panel.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button?.focus();
      }
      if (e.key === "Tab" && panel.current) {
        const items = [button, ...panel.current.querySelectorAll<HTMLElement>("a")].filter(Boolean) as HTMLElement[];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open || pathname !== "/";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid ? "border-b border-white/10 bg-ink-950/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:gap-6 sm:px-8">
        <Link href="/" aria-label="EA Auto Detail – till startsidan" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Huvudmeny" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      active ? "text-white" : "text-mist-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <TrackedLink
            href="/boka"
            event="booking_cta_click"
            eventProps={{ location: "header" }}
            className={buttonClasses("primary", "md", "max-[379px]:hidden !px-4 sm:!px-5")}
          >
            Boka tid
          </TrackedLink>
          <button
            ref={menuButton}
            type="button"
            className="grid size-11 place-items-center rounded-full border border-white/15 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobilmeny"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Stäng meny" : "Öppna meny"}</span>
            <span aria-hidden="true" className="relative block h-3 w-4.5">
              <span
                className={`absolute left-0 h-0.5 w-full rounded bg-current transition-transform duration-300 ${
                  open ? "top-[5px] rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full rounded bg-current transition-transform duration-300 ${
                  open ? "top-[5px] -rotate-45" : "top-2.5"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobilmeny"
        ref={panel}
        hidden={!open}
        className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-white/10 bg-ink-950 lg:hidden"
      >
        <nav aria-label="Mobilmeny" className="mx-auto flex max-w-6xl flex-col px-5 py-6 sm:px-8">
          <ul className="flex flex-col">
            {[{ href: "/", label: "Hem" }, ...navigation].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="font-display flex items-center justify-between border-b border-white/10 py-4 text-2xl font-bold text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <TrackedLink
            href="/boka"
            event="booking_cta_click"
            eventProps={{ location: "mobile_menu" }}
            onClick={() => setOpen(false)}
            className={buttonClasses("primary", "lg", "mt-8 w-full")}
          >
            Skicka bokningsförfrågan
          </TrackedLink>
        </nav>
      </div>
    </header>
  );
}
