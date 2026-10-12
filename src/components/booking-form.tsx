"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/config/site";
import {
  emptyBooking,
  fieldOrder,
  locationRequired,
  PHOTO_LIMITS,
  priceSummary,
  todayInSweden,
  validateBooking,
  validateField,
  validatePhotos,
  type BookingErrors,
  type BookingField,
  type BookingFields,
} from "@/lib/booking";
import { formatDate, formatSEK } from "@/lib/format";
import { track } from "@/lib/analytics";
import { CheckIcon } from "@/components/ui";
import { ContactDetails } from "@/components/contact-details";
import { SocialLinks } from "@/components/social-links";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; reference: string }
  | { state: "error"; code: string; message: string };

type PhotoItem = { id: string; file: File; url: string };

/** Skalar ned bilder i webbläsaren så att de går snabbt att skicka. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // T.ex. HEIC i webbläsare som inte kan läsa formatet – skicka originalet.
    return file;
  }
}

export function BookingForm({ headingLevel = "h2" }: { headingLevel?: "h2" | "h3" }) {
  const formId = useId();
  const [values, setValues] = useState<BookingFields>(emptyBooking);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [touched, setTouched] = useState<Partial<Record<BookingField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [today, setToday] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const H = headingLevel;

  // Förvälj tjänst från länkar som /boka?tjanst=complete, och sätt dagens datum.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- engångsinitiering från URL och klocka i webbläsaren */
    setToday(todayInSweden());
    const preset = new URLSearchParams(window.location.search).get("tjanst");
    if (preset && site.services.some((s) => s.id === preset)) {
      setValues((v) => ({ ...v, service: preset }));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Frigör förhandsvisningarnas minne när formuläret lämnas.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const price = priceSummary(values.service, values.arrangement, values.travelZone);
  const method = site.contactMethods.find((m) => m.id === values.contactMethod) ?? site.contactMethods[0];
  const fieldId = (f: string) => `${formId}-${f}`;
  const showError = (f: BookingField) => (submitted || touched[f]) && errors[f];

  function update(field: BookingField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted || touched[field]) {
      const nextErrors = { ...errors };
      for (const f of fieldOrder) {
        if (f === field || f === "location" || f === "travelZone" || f === "contactValue") {
          const e = validateField(f, next, today || todayInSweden());
          if (e && (submitted || touched[f])) nextErrors[f] = e;
          else delete nextErrors[f];
        }
      }
      setErrors(nextErrors);
    }
  }

  function blur(field: BookingField) {
    if (!values[field] && !submitted) return;
    setTouched((t) => ({ ...t, [field]: true }));
    const e = validateField(field, values, today || todayInSweden());
    setErrors((prev) => {
      const next = { ...prev };
      if (e) next[field] = e;
      else delete next[field];
      return next;
    });
  }

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    setProcessingPhotos(true);
    const room = PHOTO_LIMITS.maxFiles - photos.length;
    const incoming = Array.from(list).slice(0, Math.max(0, room));
    const compressed = await Promise.all(incoming.map(compressImage));
    const items = compressed.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    const all = [...photos, ...items];
    setPhotos(all);
    setProcessingPhotos(false);
    const err =
      list.length > room
        ? `Du kan bifoga högst ${PHOTO_LIMITS.maxFiles} bilder.`
        : validatePhotos(all.map((p) => ({ size: p.file.size, type: p.file.type })));
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next.photos = err;
      else delete next.photos;
      return next;
    });
    if (photoInput.current) photoInput.current.value = "";
  }

  function removePhoto(id: string) {
    const removed = photos.find((p) => p.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    const remaining = photos.filter((p) => p.id !== id);
    setPhotos(remaining);
    setErrors((prev) => {
      const next = { ...prev };
      const err = validatePhotos(remaining.map((p) => ({ size: p.file.size, type: p.file.type })));
      if (err) next.photos = err;
      else delete next.photos;
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.state === "submitting") return;
    setSubmitted(true);

    const nextErrors = validateBooking(values, today || todayInSweden());
    const photoErr = validatePhotos(photos.map((p) => ({ size: p.file.size, type: p.file.type })));
    if (photoErr) nextErrors.photos = photoErr;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus({ state: "submitting" });
    const body = new FormData(e.currentTarget);
    body.delete("photos");
    photos.forEach((p) => body.append("photos", p.file, p.file.name));

    try {
      const res = await fetch("/api/booking", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        code?: string;
        message?: string;
        errors?: BookingErrors;
      };
      if (res.ok && data.ok && data.reference) {
        setStatus({ state: "success", reference: data.reference });
        track("booking_request_submitted", { service: values.service, arrangement: values.arrangement });
      } else {
        if (data.errors) setErrors(data.errors);
        setStatus({
          state: "error",
          code: data.code ?? "unknown",
          message: data.message ?? "Något gick fel när förfrågan skulle skickas.",
        });
        track("booking_request_failed", { code: data.code ?? String(res.status) });
      }
    } catch {
      setStatus({ state: "error", code: "network", message: "Ingen kontakt med servern. Kontrollera din uppkoppling." });
      track("booking_request_failed", { code: "network" });
    }
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  if (status.state === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="scroll-mt-28 rounded-2xl border border-white/20 bg-ink-850 p-7 outline-none sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-white text-black">
          <CheckIcon className="size-6" />
        </span>
        <H className="font-display mt-6 text-2xl font-extrabold text-white sm:text-3xl">
          Tack {values.name.split(" ")[0]}! Vi har fått din förfrågan.
        </H>
        <p className="mt-4 max-w-xl leading-relaxed text-mist-200">
          <strong className="text-white">Observera att bokningen inte är bekräftad än.</strong> Vi hör av oss via{" "}
          {method.label.toLowerCase()} ({values.contactValue}) för att bekräfta tid och pris.
        </p>
        <dl className="mt-8 grid gap-3 rounded-xl border border-white/10 bg-ink-900 p-5 text-sm sm:grid-cols-2">
          <SummaryRow label="Referens" value={status.reference} />
          <SummaryRow label="Tjänst" value={price.service ? `${price.service.name} – ${formatSEK(price.base)}` : "–"} />
          <SummaryRow label="Önskad dag" value={`${formatDate(values.date)}, ${values.timeWindow.toLowerCase()}`} />
          <SummaryRow label="Upplägg" value={price.arrangement?.label ?? "–"} />
        </dl>
        <p className="mt-6 text-sm text-mist-400">
          Behöver du ändra något? Skriv referensen när du kontaktar oss.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-white underline underline-offset-4">
          Till startsidan
        </Link>
      </div>
    );
  }

  const errorList = fieldOrder.filter((f) => errors[f]).map((f) => ({ field: f as string, message: errors[f]! }));
  if (errors.photos) errorList.push({ field: "photos", message: errors.photos });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <form noValidate onSubmit={onSubmit} aria-describedby={`${formId}-intro`} className="min-w-0 space-y-10">
        <p id={`${formId}-intro`} className="text-sm text-mist-400">
          Fält markerade med <span aria-hidden="true">*</span>
          <span className="sr-only">asterisk</span> är obligatoriska. Det här är en förfrågan – vi bekräftar tid och
          pris innan bokningen gäller.
        </p>

        {submitted && errorList.length > 0 && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="scroll-mt-28 rounded-xl border border-red-400/50 bg-red-500/10 p-5 outline-none">
            <p className="font-semibold text-red-200">Kontrollera följande:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-200">
              {errorList.map((e) => (
                <li key={e.field}>
                  <a href={`#${fieldId(e.field)}`} className="underline underline-offset-2">
                    {e.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. Tjänst */}
        <fieldset aria-describedby={showError("service") ? `${fieldId("service")}-err` : undefined}>
          <Legend step={1}>Välj tjänst *</Legend>
          <div className="grid scroll-mt-32 gap-3 sm:grid-cols-3" id={fieldId("service")} tabIndex={-1}>
            {site.services.map((s) => (
              <OptionCard
                key={s.id}
                name="service"
                value={s.id}
                checked={values.service === s.id}
                onChange={() => update("service", s.id)}
                title={s.name}
                meta={formatSEK(s.price)}
                invalid={!!showError("service")}
              />
            ))}
          </div>
          <FieldError id={`${fieldId("service")}-err`} message={showError("service")} />
        </fieldset>

        {/* 2. Upplägg */}
        <fieldset aria-describedby={showError("arrangement") ? `${fieldId("arrangement")}-err` : undefined}>
          <Legend step={2}>Var ska vi ta hand om bilen? *</Legend>
          <div className="grid scroll-mt-32 gap-3 sm:grid-cols-3" id={fieldId("arrangement")} tabIndex={-1}>
            {site.arrangements.map((a) => (
              <OptionCard
                key={a.id}
                name="arrangement"
                value={a.id}
                checked={values.arrangement === a.id}
                onChange={() => update("arrangement", a.id)}
                title={a.label}
                description={a.description}
                meta={a.feeApplies ? `Reseavgift från ${formatSEK(site.travelFeeFrom)}` : "Enligt överenskommelse"}
                invalid={!!showError("arrangement")}
              />
            ))}
          </div>
          <FieldError id={`${fieldId("arrangement")}-err`} message={showError("arrangement")} />

          {values.arrangement && (
            <div className="mt-5">
              <TextField
                id={fieldId("location")}
                name="location"
                label={locationRequired(values.arrangement) ? "Adress där bilen står *" : "Var finns bilen?"}
                hint={
                  locationRequired(values.arrangement)
                    ? "Gatuadress och ort. Vi använder den för att planera besöket och bekräfta reseavgiften."
                    : "Ort eller område räcker."
                }
                value={values.location}
                onChange={(v) => update("location", v)}
                onBlur={() => blur("location")}
                error={showError("location")}
                autoComplete={locationRequired(values.arrangement) ? "street-address" : "address-level2"}
                maxLength={120}
              />
            </div>
          )}

          {locationRequired(values.arrangement) && (
            <div
              role="radiogroup"
              aria-labelledby={`${fieldId("travelZone")}-label`}
              aria-describedby={showError("travelZone") ? `${fieldId("travelZone")}-err` : `${fieldId("travelZone")}-hint`}
              className="mt-5"
            >
              <p id={`${fieldId("travelZone")}-label`} className="text-sm font-semibold text-white">
                Hur långt från {site.baseTown} står bilen? *
              </p>
              <p id={`${fieldId("travelZone")}-hint`} className="mt-1 text-sm text-mist-400">
                Reseavgiften tillkommer utöver tjänsten. Vi dubbelkollar den mot adressen innan vi bekräftar.
              </p>
              <div className="mt-3 grid scroll-mt-32 gap-3 sm:grid-cols-3" id={fieldId("travelZone")} tabIndex={-1}>
                {site.travelZones.map((z) => (
                  <OptionCard
                    key={z.id}
                    name="travelZone"
                    value={z.id}
                    checked={values.travelZone === z.id}
                    onChange={() => update("travelZone", z.id)}
                    title={z.label}
                    description={z.description}
                    meta={z.fee != null ? `+${formatSEK(z.fee)}` : "Bekräftas av oss"}
                    invalid={!!showError("travelZone")}
                  />
                ))}
              </div>
              <FieldError id={`${fieldId("travelZone")}-err`} message={showError("travelZone")} />
            </div>
          )}
        </fieldset>

        {/* 3. Tid */}
        <fieldset>
          <Legend step={3}>När passar det? *</Legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id={fieldId("date")}
              name="date"
              type="date"
              label="Önskat datum *"
              value={values.date}
              min={today || undefined}
              onChange={(v) => update("date", v)}
              onBlur={() => blur("date")}
              error={showError("date")}
            />
            <SelectField
              id={fieldId("timeWindow")}
              name="timeWindow"
              label="Ungefärlig tid *"
              value={values.timeWindow}
              onChange={(v) => update("timeWindow", v)}
              onBlur={() => blur("timeWindow")}
              error={showError("timeWindow")}
              options={site.timeWindows.map((t) => ({ value: t, label: t }))}
              placeholder="Välj tid"
            />
          </div>
        </fieldset>

        {/* 4. Bil och kontakt */}
        <fieldset>
          <Legend step={4}>Bil och kontaktuppgifter</Legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                id={fieldId("vehicle")}
                name="vehicle"
                label="Bilens märke och modell *"
                placeholder="T.ex. Volvo V60"
                value={values.vehicle}
                onChange={(v) => update("vehicle", v)}
                onBlur={() => blur("vehicle")}
                error={showError("vehicle")}
                maxLength={100}
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                id={fieldId("name")}
                name="name"
                label="Ditt namn *"
                value={values.name}
                onChange={(v) => update("name", v)}
                onBlur={() => blur("name")}
                error={showError("name")}
                autoComplete="name"
                maxLength={100}
              />
            </div>
            <SelectField
              id={fieldId("contactMethod")}
              name="contactMethod"
              label="Hur vill du bli kontaktad? *"
              value={values.contactMethod}
              onChange={(v) => update("contactMethod", v)}
              onBlur={() => blur("contactMethod")}
              error={showError("contactMethod")}
              options={site.contactMethods.map((m) => ({ value: m.id, label: m.label }))}
            />
            <TextField
              id={fieldId("contactValue")}
              name="contactValue"
              type={method.type}
              label={`${method.inputLabel} *`}
              value={values.contactValue}
              onChange={(v) => update("contactValue", v)}
              onBlur={() => blur("contactValue")}
              error={showError("contactValue")}
              autoComplete={method.type === "tel" ? "tel" : method.type === "email" ? "email" : "off"}
              inputMode={method.type === "tel" ? "tel" : method.type === "email" ? "email" : "text"}
              maxLength={120}
            />
          </div>
        </fieldset>

        {/* 5. Övrigt */}
        <fieldset>
          <Legend step={5}>Övrigt (valfritt)</Legend>
          <TextAreaField
            id={fieldId("message")}
            name="message"
            label="Något vi bör veta?"
            hint="T.ex. fläckar, djurhår eller särskilda önskemål."
            value={values.message}
            onChange={(v) => update("message", v)}
            onBlur={() => blur("message")}
            error={showError("message")}
            maxLength={1500}
          />

          <div className="mt-5">
            <p className="text-sm font-medium text-white" id={`${fieldId("photos")}-label`}>
              Bilder på bilen
            </p>
            <p className="mt-1 text-sm text-mist-400" id={`${fieldId("photos")}-hint`}>
              Valfritt, max {PHOTO_LIMITS.maxFiles} bilder. Hjälper oss att ge ett rättvist pris om bilen behöver extra
              arbete.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative size-20 overflow-hidden rounded-lg border border-white/15 bg-ink-800">
                  {/* eslint-disable-next-line @next/next/no-img-element -- lokal förhandsvisning (blob-URL) */}
                  <img src={p.url} alt={`Vald bild: ${p.file.name}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/80 text-white hover:bg-black"
                  >
                    <span className="sr-only">Ta bort {p.file.name}</span>
                    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden="true">
                      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {photos.length < PHOTO_LIMITS.maxFiles && (
                <label
                  htmlFor={fieldId("photos")}
                  className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-white/25 text-mist-300 transition-colors hover:border-white/50 hover:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white"
                >
                  <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    {processingPhotos ? "Laddar…" : "Lägg till"}
                  </span>
                  <input
                    ref={photoInput}
                    id={fieldId("photos")}
                    name="photos"
                    type="file"
                    accept={PHOTO_LIMITS.acceptedTypes.join(",")}
                    multiple
                    className="sr-only"
                    aria-labelledby={`${fieldId("photos")}-label`}
                    aria-describedby={`${fieldId("photos")}-hint${errors.photos ? ` ${fieldId("photos")}-err` : ""}`}
                    onChange={(e) => addPhotos(e.target.files)}
                  />
                </label>
              )}
            </div>
            <FieldError id={`${fieldId("photos")}-err`} message={errors.photos} />
          </div>
        </fieldset>

        {/* Honeypot mot spam – dolt för besökare och skärmläsare. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Företag
            <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div className="lg:hidden">
          <PriceSummary price={price} />
        </div>

        <div>
          <label htmlFor={fieldId("consent")} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mist-200">
            <input
              id={fieldId("consent")}
              name="consent"
              type="checkbox"
              checked={values.consent === "on"}
              onChange={(e) => {
                update("consent", e.target.checked ? "on" : "");
                setTouched((t) => ({ ...t, consent: true }));
              }}
              aria-invalid={!!showError("consent")}
              aria-describedby={showError("consent") ? `${fieldId("consent")}-err` : undefined}
              className="mt-0.5 size-5 shrink-0 accent-white"
            />
            <span>
              Jag godkänner att EA Auto Detail använder mina uppgifter för att svara på förfrågan. Läs mer i vår{" "}
              <Link href="/integritet" className="font-semibold text-white underline underline-offset-2">
                integritetspolicy
              </Link>
              . *
            </span>
          </label>
          <FieldError id={`${fieldId("consent")}-err`} message={showError("consent")} />
        </div>

        {status.state === "error" && (
          <div ref={resultRef} tabIndex={-1} role="alert" className="scroll-mt-28 rounded-xl border border-red-400/50 bg-red-500/10 p-5 outline-none">
            <p className="font-semibold text-red-100">{status.message}</p>
            {status.code === "not_configured" ? (
              <div className="mt-3 space-y-4 text-sm text-red-100/90">
                <p>Kontakta oss direkt så länge – dina uppgifter finns kvar i formuläret.</p>
                <ContactDetails />
                <SocialLinks />
              </div>
            ) : (
              <p className="mt-2 text-sm text-red-100/90">Dina uppgifter finns kvar. Försök igen om en stund.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={status.state === "submitting" || processingPhotos}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-bold text-black transition-colors hover:bg-mist-200 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:self-start"
          >
            {status.state === "submitting" && (
              <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            )}
            {status.state === "submitting" ? "Skickar förfrågan…" : "Skicka bokningsförfrågan"}
          </button>
          <p className="text-xs text-mist-400">
            Du förbinder dig inte till något. Vi återkommer och bekräftar tid och pris innan bokningen gäller.
          </p>
        </div>
      </form>

      <aside aria-label="Sammanfattning" className="hidden lg:sticky lg:top-28 lg:block">
        <PriceSummary price={price} />
      </aside>
    </div>
  );
}

function PriceSummary({ price }: { price: ReturnType<typeof priceSummary> }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-ink-850 p-6" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist-400">Din förfrågan</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-mist-300">{price.service ? price.service.name : "Ingen tjänst vald"}</dt>
          <dd className="font-semibold text-white">{price.service ? formatSEK(price.base) : "–"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mist-300">
            {price.arrangement ? price.arrangement.label : "Upplägg ej valt"}
            {price.arrangement?.feeApplies && (
              <span className="block text-xs text-mist-400">Reseavgift{price.zone ? ` · ${price.zone.label}` : ""}</span>
            )}
          </dt>
          <dd className="shrink-0 font-semibold text-white">
            {!price.arrangement
              ? "–"
              : !price.arrangement.feeApplies
                ? "Enl. överensk."
                : price.feeKnown
                  ? `+${formatSEK(price.fee)}`
                  : price.zone
                    ? "Bekräftas"
                    : "Välj avstånd"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
          <dt className="font-semibold text-white">Preliminärt pris</dt>
          <dd className="font-display text-2xl font-extrabold text-white">
            {price.service ? formatSEK(price.total) : "–"}
            {price.service && price.arrangement?.feeApplies && !price.feeKnown && (
              <span className="block text-right text-xs font-semibold text-mist-400">+ reseavgift</span>
            )}
          </dd>
        </div>
      </dl>
      <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-mist-400">
        <li>
          Reseavgift när vi åker till dig eller hämtar och lämnar bilen:{" "}
          {site.travelZones
            .filter((z) => z.fee != null)
            .map((z) => `${formatSEK(z.fee!)} ${z.label.charAt(0).toLowerCase()}${z.label.slice(1)}`)
            .join(", ")}
          .
        </li>
        {price.arrangement?.id === "other" && <li>Vid annat upplägg kommer vi överens om villkoren innan bokningen bekräftas.</li>}
        <li>Extra smutsig bil eller extra arbete kan kosta mer – du får alltid ett prisförslag att godkänna innan vi börjar.</li>
        <li>Priset bekräftas när vi har gått igenom förfrågan.</li>
      </ul>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-mist-400">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}

function Legend({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <legend className="mb-4 flex items-center gap-3 font-display text-lg font-bold text-white">
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-full border border-white/25 text-xs font-bold text-mist-200">
        {step}
      </span>
      {children}
    </legend>
  );
}

function FieldError({ id, message }: { id: string; message?: string | false }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-red-300">
      <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 4.5h1.5v5h-1.5v-5Zm0 6.5h1.5v1.5h-1.5V13Z" />
      </svg>
      {message}
    </p>
  );
}

const inputBase =
  "mt-2 block w-full scroll-mt-32 rounded-xl border bg-ink-900 px-4 py-3 text-base text-white placeholder:text-mist-400/70 transition-colors focus:border-white focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-white/30 [color-scheme:dark]";

function inputClasses(error?: string | false) {
  return `${inputBase} ${error ? "border-red-400/70" : "border-white/15 hover:border-white/30"}`;
}

type FieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string | false;
  hint?: string;
};

function describedBy(id: string, hint?: string, error?: string | false) {
  return [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  ...rest
}: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value">) {
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
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClasses(error)}
        {...rest}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

function TextAreaField({ id, name, label, value, onChange, onBlur, error, hint, maxLength }: FieldProps & { maxLength?: number }) {
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
      <textarea
        id={id}
        name={name}
        rows={4}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClasses(error)} resize-y`}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  options,
  placeholder,
}: FieldProps & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, undefined, error)}
        className={`${inputClasses(error)} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='m6 8 4 4 4-4' stroke='%23b0b2b8' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")] bg-[length:1.25rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  meta,
  invalid,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  meta: string;
  invalid?: boolean;
}) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white ${
        checked
          ? "border-white bg-white/10"
          : invalid
            ? "border-red-400/60 bg-ink-900 hover:border-red-300"
            : "border-white/15 bg-ink-900 hover:border-white/35"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold leading-snug text-white">{title}</span>
        <span
          aria-hidden="true"
          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${checked ? "border-white bg-white text-black" : "border-white/30"}`}
        >
          {checked && <CheckIcon className="size-3.5" />}
        </span>
      </span>
      {description && <span className="mt-1 text-sm leading-snug text-mist-400">{description}</span>}
      <span className="mt-3 text-sm font-bold text-mist-100">{meta}</span>
    </label>
  );
}
