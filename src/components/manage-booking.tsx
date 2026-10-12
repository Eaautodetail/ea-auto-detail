"use client";

/**
 * Hanteringssidan /hantera – för EA Auto Detail, inte för kunder.
 *
 * Länken i mejlet om en ny förfrågan ser ut som /hantera#t=<krypterad token>.
 * Token ligger efter # och skickas därför aldrig till servern i URL:en; den
 * skickas i en POST-body till /api/booking/open (visa uppgifterna) och
 * /api/booking/confirm (mejla bekräftelsen till kunden). Ingenting sparas.
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { pricedZones, travelFee, type FeeArrangement } from "@/config/site";
import { priceSummary, todayInSweden } from "@/lib/booking";
import { formatDate, formatSEK } from "@/lib/format";
import {
  CONFIRM_LIMITS,
  normalizeTime,
  timeInputValue,
  validateConfirmation,
  type ConfirmBookingResponse,
  type ConfirmErrors,
  type ConfirmField,
  type CustomerEmailStatus,
  type ManagedBooking,
  type OpenBookingResponse,
} from "@/lib/manage-booking";
import { buttonClasses, CheckIcon } from "@/components/ui";

type Failure = { ok: false; code: string; message: string };

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const readHash = () => window.location.hash;
const serverHash = () => null;

function tokenFromHash(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, "")).get("t")?.trim() || null;
}

async function postJson<T extends { ok: boolean }>(url: string, body: unknown, signal?: AbortSignal): Promise<T | Failure> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, code: "network", message: "Ingen kontakt med servern. Kontrollera uppkopplingen och försök igen." };
  }
  const data: unknown = await res.json().catch(() => null);
  if (data && typeof data === "object" && "ok" in data) return data as T;
  return { ok: false, code: "unknown", message: `Oväntat svar från servern (${res.status}). Försök igen om en stund.` };
}

const stockholmDateTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const stockholmDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ManageBooking() {
  // `null` under serverrenderingen och första klientrenderingen – fragmentet finns bara i webbläsaren.
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash);
  const token = hash === null ? null : tokenFromHash(hash);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ token: string; attempt: number; result: OpenBookingResponse | Failure } | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    postJson<OpenBookingResponse>("/api/booking/open", { token }, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setLoaded({ token, attempt, result });
      })
      .catch(() => {
        // Avbruten – en nyare förfrågan har tagit över.
      });
    return () => controller.abort();
  }, [token, attempt]);

  if (hash === null || (token && (loaded?.token !== token || loaded.attempt !== attempt))) {
    return (
      <Panel>
        <p role="status" className="flex items-center gap-3 text-mist-200">
          <Spinner />
          Läser in förfrågan…
        </p>
      </Panel>
    );
  }

  if (!token) {
    return (
      <Panel>
        <h3 className="font-display text-2xl font-extrabold text-white">Ingen förfrågan vald</h3>
        <p className="mt-3 max-w-xl leading-relaxed text-mist-300">
          Den här sidan öppnas via knappen <strong className="text-white">”Bekräfta tid och skicka bekräftelse”</strong> i
          mejlet om en ny bokningsförfrågan. Länken innehåller en krypterad nyckel till just den förfrågan.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-white underline underline-offset-4">
          Till startsidan
        </Link>
      </Panel>
    );
  }

  const result = loaded!.result;
  if (!result.ok) {
    const canRetry = result.code === "network" || result.code === "rate_limited" || result.code === "unknown";
    return (
      <div role="alert" className="rounded-2xl border border-red-400/50 bg-red-500/10 p-6 sm:p-8">
        <h3 className="font-display text-2xl font-extrabold text-white">Förfrågan kunde inte öppnas</h3>
        <p className="mt-3 max-w-xl leading-relaxed text-red-100">{result.message}</p>
        {canRetry && (
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className={buttonClasses("secondary", "md", "mt-6")}>
            Försök igen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
      <BookingDetails booking={result.booking} expiresAt={result.expiresAt} />
      <div className="lg:sticky lg:top-28">
        {result.customerEmail === "available" ? (
          <ConfirmForm key={token} token={token} booking={result.booking} />
        ) : (
          <EmailUnavailable booking={result.booking} reason={result.customerEmail} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ uppgifter */

/**
 * Reseavgiften för förfrågan: den kunden såg när förfrågan skickades, annars
 * den som gäller enligt site.ts för upplägg och zon. 0 när kunden lämnar bilen
 * hos er, `null` när avgiften inte är bestämd ("Vet inte").
 */
function bookingFee(booking: ManagedBooking): number | null {
  return booking.quotedFee ?? travelFee(booking.arrangement, booking.travelZone);
}

function BookingDetails({ booking, expiresAt }: { booking: ManagedBooking; expiresAt: string }) {
  const { service, arrangement, zone } = priceSummary(booking.service, booking.arrangement, booking.travelZone);
  const fee = bookingFee(booking);
  const quotedTotal = booking.quotedBase + (fee ?? 0);
  const feeUnknown = fee == null;

  return (
    <section aria-labelledby="forfragan-rubrik" className="min-w-0 rounded-2xl border border-white/15 bg-ink-850 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist-400">Bokningsförfrågan</p>
      <h3 id="forfragan-rubrik" className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
        {booking.reference}
      </h3>
      <p className="mt-1 text-sm text-mist-400">Skickad {stockholmDateTime.format(new Date(booking.issuedAt))}</p>

      <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-2">
        <Detail label="Kund">{booking.name}</Detail>
        <Detail label="Telefon">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href={`tel:${booking.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-2 hover:text-mist-200">
              {booking.phone}
            </a>
            <a
              href={`sms:${booking.phone.replace(/[^\d+]/g, "")}`}
              className="text-xs font-semibold text-mist-300 underline underline-offset-2 hover:text-white"
            >
              Skicka sms<span className="sr-only"> till {booking.phone}</span>
            </a>
          </span>
        </Detail>
        <Detail label="E-post">
          <a href={`mailto:${booking.email}`} className="[overflow-wrap:anywhere] underline underline-offset-2 hover:text-mist-200">
            {booking.email}
          </a>
        </Detail>
        <Detail label="Bil">{booking.vehicle}</Detail>
        <Detail label="Tjänst">
          {service?.name ?? booking.service} – {formatSEK(booking.quotedBase)}
        </Detail>
        <Detail label="Upplägg">{arrangement?.label ?? booking.arrangement}</Detail>
        <Detail label="Adress" wide>
          {arrangement && !arrangement.feeApplies ? "– (kunden lämnar bilen hos er)" : booking.location || "–"}
        </Detail>
        <Detail label="Reseavgift">
          {arrangement && !arrangement.feeApplies
            ? "Ingen"
            : fee != null
              ? `${formatSEK(fee)}${zone ? ` · ${zone.label}` : ""}`
              : `Ej bestämd – kunden valde ”${zone?.label ?? "Vet inte"}”`}
        </Detail>
        <Detail label="Önskad tid">
          {capitalize(formatDate(booking.date))}, {booking.time === "Flexibel" ? "flexibel tid" : `kl. ${booking.time}`}
        </Detail>
        <Detail label="Preliminärt pris" wide>
          {formatSEK(quotedTotal)}
          {feeUnknown && " + reseavgift"}
        </Detail>
      </dl>

      <ul className="mt-6 space-y-1.5 border-t border-white/10 pt-5 text-xs leading-relaxed text-mist-400">
        <li>Kundens meddelande och eventuella bilder finns i mejlet om förfrågan.</li>
        <li>
          Sidan sparar ingenting. Har ni redan skickat en bekräftelse finns kopian i er inkorg – skickar ni igen får kunden
          ett nytt mejl.
        </li>
        <li>Länken gäller till och med {stockholmDate.format(new Date(expiresAt))}. Vidarebefordra den inte.</li>
      </ul>
    </section>
  );
}

function Detail({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-mist-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-white">{children}</dd>
    </div>
  );
}

/* -------------------------------------------- e-post inte möjlig */

function EmailUnavailable({ booking, reason }: { booking: ManagedBooking; reason: Exclude<CustomerEmailStatus, "available"> }) {
  const phone = booking.phone.replace(/[^\d+]/g, "");
  return (
    <section
      aria-labelledby="ingen-epost-rubrik"
      className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-6 sm:p-7"
    >
      <h3 id="ingen-epost-rubrik" className="font-display text-xl font-extrabold text-white">
        Bekräftelsen kan inte mejlas härifrån
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-amber-100/90">
        {reason === "not_configured" ? (
          <>
            E-post till kunder är inte konfigurerad ännu. För att kunna skicka bekräftelser behövs SMTP (t.ex. Gmail med
            applösenord: <code className="text-amber-50">SMTP_USER</code> och <code className="text-amber-50">SMTP_PASS</code>)
            eller en egen, verifierad domän i Resend – se README.
          </>
        ) : (
          <>Kundens e-postadress kan inte användas för automatiska mejl.</>
        )}{" "}
        Kontakta kunden direkt i stället:
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`tel:${phone}`} className={buttonClasses("primary", "md")}>
          Ring {booking.phone}
        </a>
        <a href={`sms:${phone}`} className={buttonClasses("secondary", "md")}>
          Skicka sms
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ bekräfta tid */

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; sentTo: string; headline: string; copyToBusiness: boolean }
  | { state: "error"; code: string; message: string };

const fieldOrder: ConfirmField[] = ["date", "time", "price", "message"];

function ConfirmForm({ token, booking }: { token: string; booking: ManagedBooking }) {
  const formId = useId();
  const id = (f: string) => `${formId}-${f}`;
  const { arrangement } = priceSummary(booking.service, booking.arrangement, booking.travelZone);
  const fee = bookingFee(booking);
  const feeUnknown = fee == null;

  const [values, setValues] = useState(() => ({
    date: booking.date,
    time: timeInputValue(booking.time),
    price: String(booking.quotedBase + (fee ?? 0)),
    message: "",
  }));
  const [errors, setErrors] = useState<ConfirmErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const resultRef = useRef<HTMLDivElement>(null);
  const today = todayInSweden();

  function update(field: ConfirmField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.state === "sending") return;
    const check = validateConfirmation(values, todayInSweden());
    setErrors(check.errors);
    if (!check.value) {
      const first = fieldOrder.find((f) => check.errors[f]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    setStatus({ state: "sending" });
    const res = await postJson<ConfirmBookingResponse>("/api/booking/confirm", { token, ...values });
    if (res.ok) {
      setStatus({ state: "sent", sentTo: res.sentTo, headline: res.headline, copyToBusiness: res.copyToBusiness });
    } else {
      if ("errors" in res && res.errors) setErrors(res.errors);
      setStatus({ state: "error", code: res.code, message: res.message });
    }
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  if (status.state === "sent") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl border border-white/20 bg-ink-850 p-6 outline-none sm:p-7"
      >
        <span className="grid size-11 place-items-center rounded-full bg-white text-black">
          <CheckIcon className="size-5" />
        </span>
        <h3 className="font-display mt-5 text-xl font-extrabold text-white">Bekräftelsen är skickad.</h3>
        <p className="mt-3 text-sm leading-relaxed text-mist-200">
          Mejlet ”Din tid är bekräftad: {status.headline}” har skickats till{" "}
          <strong className="text-white [overflow-wrap:anywhere]">{status.sentTo}</strong>.
          {status.copyToBusiness && " En kopia har skickats till er inkorg."}
        </p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle" })}
          className={buttonClasses("secondary", "md", "mt-6")}
        >
          Ändra och skicka en ny bekräftelse
        </button>
      </div>
    );
  }

  const previewTime = normalizeTime(values.time);
  const previewOk = /^\d{4}-\d{2}-\d{2}$/.test(values.date) && previewTime;
  const phone = booking.phone.replace(/[^\d+]/g, "");

  return (
    <section aria-labelledby={id("rubrik")} className="rounded-2xl border border-white/15 bg-ink-850 p-6 sm:p-7">
      <h3 id={id("rubrik")} className="font-display text-xl font-extrabold text-white">
        Bekräfta tid och pris
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-mist-400">
        Förifyllt med kundens önskemål. Ändra om ni har kommit överens om något annat.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field id={id("date")} label="Datum *" error={errors.date}>
            <input
              id={id("date")}
              type="date"
              required
              min={today}
              value={values.date}
              onChange={(e) => update("date", e.target.value)}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? `${id("date")}-err` : undefined}
              className={inputClasses(errors.date)}
            />
          </Field>
          <Field
            id={id("time")}
            label="Tid *"
            hint={booking.time === "Flexibel" ? "Kunden angav flexibel tid." : undefined}
            error={errors.time}
          >
            <input
              id={id("time")}
              type="time"
              required
              value={values.time}
              onChange={(e) => update("time", e.target.value)}
              aria-invalid={!!errors.time}
              aria-describedby={describedBy(id("time"), booking.time === "Flexibel", errors.time)}
              className={inputClasses(errors.time)}
            />
          </Field>
        </div>

        <Field
          id={id("price")}
          label="Totalpris *"
          hint={
            feeUnknown
              ? `Reseavgiften är inte bestämd – lägg till rätt avgift${
                  arrangement?.feeApplies
                    ? ` för ${arrangement.label.toLowerCase()}: ${pricedZones
                        .map(
                          (z) =>
                            `${formatSEK(z.fees[arrangement.id as FeeArrangement])} (${z.label.charAt(0).toLowerCase()}${z.label.slice(1)})`,
                        )
                        .join(" eller ")}`
                    : ""
                }.`
              : `Tjänst ${formatSEK(booking.quotedBase)}${
                  arrangement?.feeApplies
                    ? ` + reseavgift ${formatSEK(fee ?? 0)}`
                    : arrangement
                      ? " (ingen reseavgift – kunden lämnar bilen hos er)"
                      : ""
                }. Ändra bara om kunden har godkänt något annat, t.ex. extra arbete.`
          }
          error={errors.price}
        >
          <div className="relative">
            <input
              id={id("price")}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              value={values.price}
              onChange={(e) => update("price", e.target.value)}
              aria-invalid={!!errors.price}
              aria-describedby={describedBy(id("price"), true, errors.price)}
              className={`${inputClasses(errors.price)} pr-12`}
            />
            <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-mist-400">
              kr
            </span>
          </div>
        </Field>

        <Field
          id={id("message")}
          label="Meddelande till kunden (valfritt)"
          hint="Visas i mejlet, t.ex. hur ni gör med nyckeln vid hämtning."
          error={errors.message}
        >
          <textarea
            id={id("message")}
            rows={3}
            maxLength={CONFIRM_LIMITS.messageMax}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            aria-invalid={!!errors.message}
            aria-describedby={describedBy(id("message"), true, errors.message)}
            className={`${inputClasses(errors.message)} resize-y`}
          />
        </Field>

        <p aria-live="polite" className="rounded-xl border border-white/10 bg-ink-900 p-4 text-sm leading-relaxed text-mist-300">
          {previewOk ? (
            <>
              Kunden får mejlet <strong className="text-white">”Din tid är bekräftad: {formatDate(values.date)} kl. {previewTime}”</strong>{" "}
              till <span className="text-white [overflow-wrap:anywhere]">{booking.email}</span>.
            </>
          ) : (
            <>Välj datum och tid för att se vad kunden får.</>
          )}
        </p>

        {status.state === "error" && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="alert"
            className="rounded-xl border border-red-400/50 bg-red-500/10 p-4 text-sm outline-none"
          >
            <p className="font-semibold text-red-100">{status.message}</p>
            {["not_configured", "delivery_failed", "invalid_address", "expired", "invalid_token"].includes(status.code) && (
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-red-100/90">
                <a href={`tel:${phone}`} className="font-semibold underline underline-offset-2">
                  Ring {booking.phone}
                </a>
                <a href={`sms:${phone}`} className="font-semibold underline underline-offset-2">
                  Skicka sms
                </a>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status.state === "sending"}
          className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-full bg-white px-7 text-base font-bold text-black transition-colors hover:bg-mist-200 disabled:cursor-wait disabled:opacity-70"
        >
          {status.state === "sending" && <Spinner dark />}
          {status.state === "sending" ? "Skickar bekräftelse…" : "Skicka bekräftelse till kunden"}
        </button>
      </form>
    </section>
  );
}

/* ------------------------------------------------------------ små delar */

const inputBase =
  "mt-2 block w-full rounded-xl border bg-ink-900 px-4 py-3 text-base text-white placeholder:text-mist-400/70 transition-colors focus:border-white focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-white/30 [color-scheme:dark]";

function inputClasses(error?: string) {
  return `${inputBase} ${error ? "border-red-400/70" : "border-white/15 hover:border-white/30"}`;
}

function describedBy(id: string, hasHint: boolean, error?: string) {
  return [hasHint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-mist-400">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-2 text-sm font-medium text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/15 bg-ink-850 p-6 sm:p-8">{children}</div>;
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-4 shrink-0 motion-safe:animate-spin rounded-full border-2 ${dark ? "border-black/30 border-t-black" : "border-white/30 border-t-white"}`}
    />
  );
}
