"use client";

/**
 * Formulär för att lämna en recension. Alla kan lämna en – man behöver inte ha
 * bokat via hemsidan. Kommer besökaren från länken i recensionsmejlet (#t=…)
 * skickas länken med, så att recensionen markeras som lämnad av en kund som bokat.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/config/site";
import {
  REVIEW_LIMITS,
  STAR_LABELS,
  reviewFieldOrder,
  validateReview,
  validateReviewField,
  type ReviewErrors,
  type ReviewField,
  type ReviewFields,
  type ReviewResponse,
} from "@/lib/reviews";
import { FieldError, SelectField, TextAreaField, TextField } from "@/components/booking-fields";
import { buttonClasses, CheckIcon } from "@/components/ui";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; rating: number }
  | { state: "error"; code: string; message: string };

const empty: ReviewFields = { name: "", rating: "", text: "", service: "", consent: false };

/** Läser förifyllt namn/tjänst ur länken i mejlet. Själva kontrollen av länken görs på servern. */
function readInvite(hash: string): { token: string; name: string; service: string } | null {
  const m = /^#t=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(hash);
  if (!m) return null;
  try {
    const b64 = m[1].split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { n?: unknown; s?: unknown };
    return {
      token: m[1],
      name: typeof data.n === "string" ? data.n.slice(0, REVIEW_LIMITS.nameMax) : "",
      service: typeof data.s === "string" && site.services.some((s) => s.id === data.s) ? data.s : "",
    };
  } catch {
    return { token: m[1], name: "", service: "" };
  }
}

export function ReviewForm() {
  const router = useRouter();
  const formId = useId();
  const id = (f: string) => `${formId}-${f}`;
  const [values, setValues] = useState<ReviewFields>(empty);
  const [touched, setTouched] = useState<Partial<Record<ReviewField, boolean>>>({});
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [invite, setInvite] = useState<string | null>(null);
  const [hover, setHover] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Länken från recensionsmejlet: fyll i namn och tjänst, ta bort token ur adressfältet.
  useEffect(() => {
    const found = readInvite(window.location.hash);
    if (!found) return;
    /* eslint-disable react-hooks/set-state-in-effect -- läser webbläsarens adress en gång */
    setInvite(found.token);
    setValues((v) => ({ ...v, name: v.name || found.name, service: v.service || found.service }));
    /* eslint-enable react-hooks/set-state-in-effect */
    window.history.replaceState(null, "", `${window.location.pathname}#skriv`);
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ block: "start" }));
  }, []);

  function update<K extends ReviewField>(field: K, value: ReviewFields[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field] || errors[field]) setErrors((e) => ({ ...e, [field]: validateReviewField(field, next) }));
  }
  const blur = (field: ReviewField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateReviewField(field, values) }));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.state === "sending") return;
    const check = validateReview(values);
    setErrors(check);
    const first = reviewFieldOrder.find((f) => check[f]);
    if (first) {
      document.getElementById(first === "rating" ? id("rating-1") : id(first))?.focus();
      return;
    }
    setStatus({ state: "sending" });
    const company = (e.currentTarget.elements.namedItem("company") as HTMLInputElement | null)?.value ?? "";
    let res: ReviewResponse;
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, invite, company }),
        cache: "no-store",
      });
      res = (await r.json().catch(() => null)) ?? { ok: false, code: "server", message: "Något gick fel. Försök igen om en stund." };
    } catch {
      res = { ok: false, code: "network", message: "Ingen kontakt med servern. Kontrollera uppkopplingen och försök igen." };
    }
    if (res.ok) {
      setStatus({ state: "sent", rating: Number(values.rating) });
      router.refresh();
    } else {
      if (res.errors) setErrors(res.errors);
      setStatus({ state: "error", code: res.code, message: res.message });
    }
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  const rating = Number(values.rating) || 0;
  const shownRating = hover || rating;

  if (status.state === "sent") {
    const good = status.rating >= 4;
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="rounded-2xl border border-white/20 bg-ink-850 p-6 outline-none sm:p-8">
        <span className="grid size-11 place-items-center rounded-full bg-white text-black">
          <CheckIcon className="size-5" />
        </span>
        <h3 className="font-display mt-5 text-2xl font-extrabold text-white">Tack för din recension!</h3>
        <p className="mt-3 max-w-xl leading-relaxed text-mist-200">
          {good
            ? "Vi blir jätteglada. Din recension syns nu bland de andra här på sidan."
            : `Din recension syns nu här på sidan. Vi tar alla omdömen på allvar – vill du berätta mer, ring eller sms:a oss på ${site.contact.phone}.`}
        </p>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="scroll-mt-28">
      <form noValidate onSubmit={onSubmit} className="relative space-y-6 rounded-3xl border border-white/10 bg-ink-850 p-6 sm:p-9">
        {invite && (
          <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-mist-100">
            Tack för att du bokade hos oss! Din recension markeras som lämnad av en kund som bokat via hemsidan.
          </p>
        )}

        <fieldset aria-describedby={errors.rating ? `${id("rating")}-err` : undefined}>
          <legend className="text-sm font-medium text-white">
            Hur nöjd är du? <span aria-hidden="true">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
                  <input
                    id={id(`rating-${n}`)}
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => update("rating", String(n))}
                    className="peer sr-only"
                    required
                  />
                  <span className="sr-only">
                    {n} {n === 1 ? "stjärna" : "stjärnor"} – {STAR_LABELS[n]}
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={`size-9 rounded-md transition-[color,transform] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white sm:size-10 ${
                      n <= shownRating ? "text-amber-300" : "text-white/20 hover:text-white/40"
                    } ${hover === n ? "scale-110" : ""}`}
                  >
                    <path
                      fill="currentColor"
                      d="M10 1.8l2.47 5.2 5.7.68-4.2 3.92 1.1 5.63L10 14.46l-5.07 2.77 1.1-5.63-4.2-3.92 5.7-.68L10 1.8Z"
                    />
                  </svg>
                </label>
              ))}
            </div>
            <span aria-hidden="true" className="text-sm font-medium text-mist-200">
              {shownRating ? STAR_LABELS[shownRating] : "Välj antal stjärnor"}
            </span>
          </div>
          <FieldError id={`${id("rating")}-err`} message={errors.rating} />
        </fieldset>

        <TextAreaField
          id={id("text")}
          name="text"
          label="Din recension *"
          hint="Vad gjorde vi, och hur blev det?"
          value={values.text}
          onChange={(v) => update("text", v)}
          onBlur={() => blur("text")}
          error={errors.text}
          maxLength={REVIEW_LIMITS.textMax}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id={id("name")}
            name="name"
            label="Namn som visas *"
            hint="T.ex. förnamn och första bokstaven i efternamnet."
            autoComplete="given-name"
            maxLength={REVIEW_LIMITS.nameMax}
            value={values.name}
            onChange={(v) => update("name", v)}
            onBlur={() => blur("name")}
            error={errors.name}
            required
          />
          <SelectField
            id={id("service")}
            name="service"
            label="Tjänst (valfritt)"
            hint="Vad hjälpte vi dig med?"
            value={values.service}
            onChange={(v) => update("service", v)}
            onBlur={() => blur("service")}
            error={errors.service}
            options={[{ value: "", label: "Vill inte ange" }, ...site.services.map((s) => ({ value: s.id, label: s.name }))]}
          />
        </div>

        {/* Honeypot mot spam – dolt för besökare och skärmläsare. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Företag
            <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div>
          <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mist-200">
            <input
              id={id("consent")}
              name="consent"
              type="checkbox"
              checked={values.consent}
              onChange={(e) => update("consent", e.target.checked)}
              required
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? `${id("consent")}-err` : undefined}
              className="mt-0.5 size-5 shrink-0 accent-white"
            />
            <span>
              Jag godkänner att {site.name} visar min recension och namnet ovan på hemsidan. Läs mer i vår{" "}
              <Link href="/integritet" className="font-semibold text-white underline underline-offset-2">
                integritetspolicy
              </Link>
              . <span aria-hidden="true">*</span>
            </span>
          </label>
          <FieldError id={`${id("consent")}-err`} message={errors.consent} />
        </div>

        {status.state === "error" && (
          <div ref={resultRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-400/50 bg-red-500/10 p-5 outline-none">
            <p className="font-semibold text-red-100">{status.message}</p>
          </div>
        )}

        <button type="submit" disabled={status.state === "sending"} className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
          {status.state === "sending" && (
            <span aria-hidden="true" className="size-4 rounded-full border-2 border-black/30 border-t-black motion-safe:animate-spin" />
          )}
          {status.state === "sending" ? "Skickar…" : "Skicka recension"}
        </button>
      </form>
    </div>
  );
}
