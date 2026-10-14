"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  bookingTimes,
  currentHours,
  getService,
  latestStartTime,
  onSiteNeeds,
  servicePrice,
  site,
  vehicleSurcharge,
  travelFee,
  travelFeeFromText,
  type Service,
} from "@/config/site";
import {
  dropUnusedLocation,
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
import { BelongingsNote } from "@/components/on-site-info";
import {
  ClockIcon,
  FieldError,
  Legend,
  OptionCard,
  RequiredText,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/booking-fields";
import {
  capitalize,
  paymentMethodsText,
  PriceLine,
  PriceSummary,
  travelFeeText,
  type Price,
} from "@/components/booking-summary";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; reference: string; customerEmailSent: boolean }
  | { state: "error"; code: string; message: string };

/** Svar från POST /api/booking. */
type BookingResponse = {
  ok?: boolean;
  reference?: string;
  customerEmailSent?: boolean;
  code?: string;
  message?: string;
  errors?: BookingErrors;
};

type PhotoItem = { id: string; file: File; url: string };

/** Värdet för "Flexibel" i `bookingTimes()`. */
const FLEXIBLE_TIME = "Flexibel";

/** Fält som ska valideras om när ett annat fält ändras. */
const dependentFields: Partial<Record<BookingField, BookingField[]>> = {
  service: ["time"],
  vehicleSize: ["time"],
  arrangement: ["location", "travelZone"],
};

/**
 * Flyttar fokus till ett meddelande och visar dess överkant (under det fasta
 * sidhuvudet tack vare `scroll-mt-*`). `focus()` utan `preventScroll` centrerar
 * i stället höga element, så rubriken hamnar ovanför skärmen på mobil.
 */
function focusAndReveal(el: HTMLElement | null) {
  if (!el) return;
  el.focus({ preventScroll: true });
  // "auto" följer CSS scroll-behavior, som är avstängd vid reducerad rörelse.
  el.scrollIntoView({ block: "start", behavior: "auto" });
}

function timeLabel(time: string) {
  return time === FLEXIBLE_TIME ? "Flexibel – ni föreslår en tid" : `kl. ${time}`;
}

/** Priset på fordonskortet: priset för vald tjänst, annars tillägget jämfört med personbil. */
function vehicleSizeMeta(sizeId: string, serviceId: string) {
  if (getService(serviceId)) return formatSEK(servicePrice(serviceId, sizeId));
  const extras = site.services.map((s) => vehicleSurcharge(s.id, sizeId));
  const [min, max] = [Math.min(...extras), Math.max(...extras)];
  if (max === 0) return "Grundpris";
  return min === max ? `+${formatSEK(min)}` : `+${min}–${formatSEK(max)}`;
}

/** Vad en tjänst kräver på plats, t.ex. "vatten och el". */
function utilitiesText(service: Service) {
  const { water, electricity } = service.onSite;
  if (water && electricity) return "vatten och el";
  if (electricity) return "el";
  if (water) return "vatten";
  return "varken vatten eller el";
}

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
  const introRef = useRef<HTMLParagraphElement>(null);
  const focusIntroOnReset = useRef(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const H = headingLevel;

  // Förvälj tjänst från länkar som /boka?tjanst=complete, och sätt dagens datum.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- engångsinitiering från URL och klocka i webbläsaren */
    setToday(todayInSweden());
    const preset = new URLSearchParams(window.location.search).get("tjanst");
    if (preset && getService(preset)) {
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

  // Efter "Skicka en ny förfrågan": visa formulärets början igen.
  useEffect(() => {
    if (status.state === "idle" && focusIntroOnReset.current) {
      focusIntroOnReset.current = false;
      focusAndReveal(introRef.current);
    }
  }, [status]);

  const price = priceSummary(values.service, values.arrangement, values.travelZone, values.vehicleSize);
  const selectedService = price.service;
  const hours = currentHours();
  const fieldId = (f: string) => `${formId}-${f}`;
  const showError = (f: BookingField) => (submitted || touched[f]) && errors[f];
  const day = () => today || todayInSweden();

  function update(field: BookingField, value: string, opts: { touch?: boolean } = {}) {
    const next = { ...values, [field]: value };
    // Byts tjänsten till en som inte hinns med på vald starttid nollställs tiden,
    // med en förklaring under tidsfältet.
    let timeNotice: string | undefined;
    if ((field === "service" || field === "vehicleSize") && next.time && !bookingTimes(next.service, next.vehicleSize).includes(next.time)) {
      timeNotice = validateField("time", next, day());
      next.time = "";
    }
    setValues(next);
    if (opts.touch) setTouched((t) => ({ ...t, [field]: true }));
    if (timeNotice) setTouched((t) => ({ ...t, time: true }));
    const isActive = (f: BookingField) => submitted || touched[f] || (opts.touch && f === field);
    const recheck = [field, ...(dependentFields[field] ?? [])].filter((f) => isActive(f) && !(timeNotice && f === "time"));
    // Lämnar kunden bilen hos oss döljs adress och avstånd – ta bort deras fel.
    const hidesLocation = field === "arrangement" && !locationRequired(value);
    if (recheck.length === 0 && !timeNotice && !hidesLocation) return;
    setErrors((prev) => {
      const nextErrors = { ...prev };
      if (timeNotice) nextErrors.time = timeNotice;
      if (hidesLocation) {
        delete nextErrors.location;
        delete nextErrors.travelZone;
      }
      for (const f of recheck) {
        const e = validateField(f, next, day());
        if (e) nextErrors[f] = e;
        else delete nextErrors[f];
      }
      return nextErrors;
    });
  }

  function blur(field: BookingField) {
    if (!values[field] && !submitted) return;
    setTouched((t) => ({ ...t, [field]: true }));
    const e = validateField(field, values, day());
    setErrors((prev) => {
      const next = { ...prev };
      if (e) next[field] = e;
      else delete next[field];
      return next;
    });
  }

  /** Flyttar fokus till ett fält från felsammanfattningen (radiogrupper → vald/första knappen). */
  function focusField(field: string) {
    const el = document.getElementById(fieldId(field)) ?? document.getElementById(`${fieldId(field)}-group`);
    if (!el) return;
    const target =
      el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement
        ? el
        : (el.querySelector<HTMLInputElement>("input:checked") ?? el.querySelector<HTMLInputElement>("input") ?? el);
    target.focus({ preventScroll: true });
    // "auto" följer CSS scroll-behavior, som är avstängd vid reducerad rörelse.
    el.scrollIntoView({ block: "center", behavior: "auto" });
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

    const nextErrors = validateBooking(dropUnusedLocation(values), day());
    const photoErr = validatePhotos(photos.map((p) => ({ size: p.file.size, type: p.file.type })));
    if (photoErr) nextErrors.photos = photoErr;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => focusAndReveal(summaryRef.current));
      return;
    }

    setStatus({ state: "submitting" });
    // Honeypot-fältet ("company") följer med från formuläret; övriga värden tas
    // från state så att de alltid stämmer med det kunden ser.
    const body = new FormData(e.currentTarget);
    body.delete("photos");
    const sent = dropUnusedLocation(values);
    for (const key of Object.keys(emptyBooking) as BookingField[]) body.set(key, sent[key]);
    photos.forEach((p) => body.append("photos", p.file, p.file.name));

    try {
      const res = await fetch("/api/booking", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as BookingResponse;
      if (res.ok && data.ok && data.reference) {
        setStatus({ state: "success", reference: data.reference, customerEmailSent: data.customerEmailSent === true });
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
    requestAnimationFrame(() => focusAndReveal(resultRef.current));
  }

  /** Ny förfrågan (t.ex. för en till bil): kontaktuppgifterna finns kvar, resten töms. */
  function startNewRequest() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setValues({ ...emptyBooking, name: values.name, phone: values.phone, email: values.email });
    setErrors({});
    setTouched({});
    setSubmitted(false);
    focusIntroOnReset.current = true;
    setStatus({ state: "idle" });
  }

  if (status.state === "success") {
    return (
      <SuccessPanel
        ref={resultRef}
        H={H}
        values={values}
        price={price}
        reference={status.reference}
        customerEmailSent={status.customerEmailSent}
        onNewRequest={startNewRequest}
      />
    );
  }

  const errorList = fieldOrder.filter((f) => errors[f]).map((f) => ({ field: f as string, message: errors[f]! }));
  if (errors.photos) errorList.push({ field: "photos", message: errors.photos });

  const timeOptions = bookingTimes(values.service, values.vehicleSize).map((t) => ({ value: t, label: timeLabel(t) }));
  const latestStart = selectedService ? latestStartTime(selectedService.id, values.vehicleSize) : null;
  const biggerVehicle = !!price.vehicleSize && price.vehicleSize.extraMinutes > 0;
  const whenHintId = `${formId}-when-hint`;
  const isPickup = values.arrangement === "pickup";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <form noValidate onSubmit={onSubmit} aria-describedby={`${formId}-intro`} className="min-w-0 space-y-10">
        <p
          id={`${formId}-intro`}
          ref={introRef}
          tabIndex={-1}
          className="scroll-mt-28 text-sm text-mist-400 outline-none"
        >
          Fält markerade med <span aria-hidden="true">*</span>
          <span className="sr-only">asterisk</span> är obligatoriska. Det här är en förfrågan – vi bekräftar tid och
          pris innan bokningen gäller.
        </p>

        {submitted && errorList.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="scroll-mt-28 rounded-xl border border-red-400/50 bg-red-500/10 p-5 outline-none"
          >
            <p className="font-semibold text-red-200">Kontrollera följande:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-200">
              {errorList.map((e) => (
                <li key={e.field}>
                  <a
                    href={`#${fieldId(e.field)}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      focusField(e.field);
                    }}
                    className="underline underline-offset-2"
                  >
                    {e.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. Tjänst */}
        <fieldset aria-describedby={showError("service") ? `${fieldId("service")}-err` : `${fieldId("service")}-hint`}>
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
                description={
                  s.duration ? (
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="size-4 shrink-0" />
                      <span className="sr-only">Ungefärlig tid:</span>
                      {capitalize(s.duration)}
                    </span>
                  ) : undefined
                }
                meta={values.vehicleSize ? formatSEK(servicePrice(s.id, values.vehicleSize)) : `från ${formatSEK(s.price)}`}
                invalid={!!showError("service")}
                required
              />
            ))}
          </div>
          <FieldError id={`${fieldId("service")}-err`} message={showError("service")} />
          <p id={`${fieldId("service")}-hint`} className="mt-3 text-sm text-mist-400">
            {site.durationNote}
          </p>
          {selectedService && (
            <details className="group mt-3 rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm">
              <summary className="cursor-pointer list-none font-semibold text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  Vad ingår i {selectedService.name.toLowerCase()}?
                  <svg
                    viewBox="0 0 20 20"
                    className="size-4 shrink-0 text-mist-300 transition-transform group-open:rotate-180"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <ul className="mt-3 space-y-1.5 text-mist-200">
                {selectedService.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-mist-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </fieldset>

        {/* 2. Fordon */}
        <fieldset
          aria-describedby={showError("vehicleSize") ? `${fieldId("vehicleSize")}-err` : `${fieldId("vehicleSize")}-hint`}
        >
          <Legend step={2}>Vilket fordon gäller det? *</Legend>
          <div className="grid scroll-mt-32 gap-3 sm:grid-cols-3" id={fieldId("vehicleSize")} tabIndex={-1}>
            {site.vehicleSizes.map((v) => (
              <OptionCard
                key={v.id}
                name="vehicleSize"
                value={v.id}
                checked={values.vehicleSize === v.id}
                onChange={() => update("vehicleSize", v.id)}
                title={v.label}
                description={v.description}
                meta={vehicleSizeMeta(v.id, values.service)}
                invalid={!!showError("vehicleSize")}
                required
              />
            ))}
          </div>
          <FieldError id={`${fieldId("vehicleSize")}-err`} message={showError("vehicleSize")} />
          <p id={`${fieldId("vehicleSize")}-hint`} className="mt-3 text-sm text-mist-400">
            {site.vehicleSizeNote}
          </p>
          <div className="mt-6">
            <TextField
              id={fieldId("vehicle")}
              name="vehicle"
              label="Registreringsnummer eller bilmodell *"
              placeholder="T.ex. ABC 123 eller Volvo V60"
              value={values.vehicle}
              onChange={(v) => update("vehicle", v)}
              onBlur={() => blur("vehicle")}
              error={showError("vehicle")}
              autoComplete="off"
              spellCheck={false}
              maxLength={100}
              required
            />
          </div>
        </fieldset>

        {/* 3. Upplägg, adress och reseavgift */}
        <fieldset aria-describedby={showError("arrangement") ? `${fieldId("arrangement")}-err` : undefined}>
          <Legend step={3}>Var ska vi ta hand om bilen? *</Legend>
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
                meta={travelFeeFromText(a.id)}
                invalid={!!showError("arrangement")}
                required
              />
            ))}
          </div>
          <FieldError id={`${fieldId("arrangement")}-err`} message={showError("arrangement")} />

          {/* Vad som gäller för valt upplägg – läses upp när valet ändras. */}
          <div aria-live="polite">
            <ArrangementInfo arrangement={values.arrangement} service={selectedService} />
          </div>
          <BelongingsNote className="mt-5" />

          {locationRequired(values.arrangement) && (
            <>
              <div className="mt-6">
                <TextField
                  id={fieldId("location")}
                  name="location"
                  label={isPickup ? "Adress där vi hämtar bilen *" : "Adress där bilen står *"}
                  hint="Gatuadress och ort, t.ex. Storgatan 1, Kristianstad. Vi använder den för att planera och kontrollera reseavgiften."
                  value={values.location}
                  onChange={(v) => update("location", v)}
                  onBlur={() => blur("location")}
                  error={showError("location")}
                  autoComplete="street-address"
                  maxLength={120}
                  required
                />
              </div>

              <div
                role="radiogroup"
                aria-required="true"
                aria-labelledby={`${fieldId("travelZone")}-label`}
                aria-describedby={[
                  `${fieldId("travelZone")}-hint`,
                  showError("travelZone") ? `${fieldId("travelZone")}-err` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                className="mt-6"
              >
                <p id={`${fieldId("travelZone")}-label`} className="text-sm font-semibold text-white">
                  <RequiredText>
                    {isPickup
                      ? `Hur långt från ${site.baseTown} hämtar vi bilen? *`
                      : `Hur långt från ${site.baseTown} står bilen? *`}
                  </RequiredText>
                </p>
                <p id={`${fieldId("travelZone")}-hint`} className="mt-1 text-sm text-mist-400">
                  Reseavgiften för {price.arrangement?.label.toLowerCase()} tillkommer utöver priset för tjänsten. Vi åker
                  upp till ca {site.travelMaxKm} km från {site.baseTown}. Vi kontrollerar avgiften mot adressen innan vi
                  bekräftar.
                </p>
                <div className="mt-3 grid scroll-mt-32 gap-3 sm:grid-cols-3" id={fieldId("travelZone")} tabIndex={-1}>
                  {site.travelZones.map((z) => {
                    const zoneFee = travelFee(values.arrangement, z.id);
                    return (
                      <OptionCard
                        key={z.id}
                        name="travelZone"
                        value={z.id}
                        checked={values.travelZone === z.id}
                        onChange={() => update("travelZone", z.id)}
                        title={z.label}
                        description={z.description}
                        meta={zoneFee != null ? `+${formatSEK(zoneFee)}` : "Bekräftas av oss"}
                        invalid={!!showError("travelZone")}
                        required
                      />
                    );
                  })}
                </div>
                <FieldError id={`${fieldId("travelZone")}-err`} message={showError("travelZone")} />
              </div>
            </>
          )}
        </fieldset>

        {/* 4. När */}
        <fieldset>
          <Legend step={4}>När passar det? *</Legend>
          <div id={whenHintId} className="mb-5 space-y-1 text-sm text-mist-400">
            <p className="flex items-start gap-2 text-mist-200">
              <ClockIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                Våra arbetstider just nu: {site.hours.days.toLowerCase()}{" "}
                <span className="whitespace-nowrap">{hours.text}</span> ({hours.label.toLowerCase()}).
              </span>
            </p>
            {selectedService && latestStart && (
              <p>
                {capitalize(selectedService.name.toLowerCase())} tar{" "}
                {selectedService.duration ? `ungefär ${selectedService.duration.replace(/^cirka /, "")}` : "en stund"}
                {biggerVehicle ? ` för en personbil och lite längre för en ${price.vehicleSize!.label.toLowerCase()}` : ""}, så
                senaste starttid är kl. {latestStart} för att vi ska hinna klart före {hours.close}.
              </p>
            )}
            <p>Datum och tid är ett önskemål – inte en bekräftad tid. Vi bekräftar tiden när vi har gått igenom förfrågan.</p>
          </div>
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
              describedBy={whenHintId}
              className="min-h-[3.125rem] [&::-webkit-date-and-time-value]:text-left"
              required
            />
            <SelectField
              id={fieldId("time")}
              name="time"
              label="Önskad starttid *"
              value={values.time}
              onChange={(v) => update("time", v)}
              onBlur={() => blur("time")}
              error={showError("time")}
              describedBy={whenHintId}
              options={timeOptions}
              placeholder="Välj tid"
              required
            />
          </div>
        </fieldset>

        {/* 5. Kontaktuppgifter */}
        <fieldset>
          <Legend step={5}>Dina uppgifter</Legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                id={fieldId("name")}
                name="name"
                label="Namn *"
                value={values.name}
                onChange={(v) => update("name", v)}
                onBlur={() => blur("name")}
                error={showError("name")}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
            <TextField
              id={fieldId("phone")}
              name="phone"
              type="tel"
              label="Telefonnummer *"
              placeholder="T.ex. 070-123 45 67"
              value={values.phone}
              onChange={(v) => update("phone", v)}
              onBlur={() => blur("phone")}
              error={showError("phone")}
              autoComplete="tel"
              inputMode="tel"
              maxLength={30}
              required
            />
            <TextField
              id={fieldId("email")}
              name="email"
              type="email"
              label="E-postadress *"
              placeholder="namn@exempel.se"
              value={values.email}
              onChange={(v) => update("email", v)}
              onBlur={() => blur("email")}
              error={showError("email")}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={120}
              required
            />
          </div>
        </fieldset>

        {/* 6. Meddelande och bilder */}
        <fieldset>
          <Legend step={6}>Meddelande (valfritt)</Legend>
          <TextAreaField
            id={fieldId("message")}
            name="message"
            label="Kommentar om bilens skick eller särskilda önskemål"
            hint="T.ex. om bilen är extra smutsig, har fläckar, eller om det finns saker i bilen som ska ligga kvar och som vi inte ska röra."
            value={values.message}
            onChange={(v) => update("message", v)}
            onBlur={() => blur("message")}
            error={showError("message")}
            maxLength={1500}
          />

          <div className="mt-5 scroll-mt-32" id={`${fieldId("photos")}-group`} tabIndex={-1}>
            <p className="text-sm font-medium text-white" id={`${fieldId("photos")}-label`}>
              Bilder på bilen
            </p>
            <p className="mt-1 text-sm text-mist-400" id={`${fieldId("photos")}-hint`}>
              Valfritt, max {PHOTO_LIMITS.maxFiles} bilder. Hjälper oss att se om bilen behöver extra arbete.
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
                    aria-label={processingPhotos ? "Laddar bilder…" : "Lägg till bilder på bilen"}
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

        <div>
          <label
            htmlFor={fieldId("consent")}
            className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mist-200"
          >
            <input
              id={fieldId("consent")}
              name="consent"
              type="checkbox"
              checked={values.consent === "on"}
              onChange={(e) => update("consent", e.target.checked ? "on" : "", { touch: true })}
              required
              aria-invalid={!!showError("consent")}
              aria-describedby={showError("consent") ? `${fieldId("consent")}-err` : undefined}
              className="mt-0.5 size-5 shrink-0 accent-white"
            />
            <span>
              Jag godkänner att {site.name} använder mina uppgifter för att svara på förfrågan. Läs mer i vår{" "}
              <Link href="/integritet" className="font-semibold text-white underline underline-offset-2">
                integritetspolicy
              </Link>
              . <span aria-hidden="true">*</span>
            </span>
          </label>
          <FieldError id={`${fieldId("consent")}-err`} message={showError("consent")} />
        </div>

        {status.state === "error" && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="alert"
            className="scroll-mt-28 rounded-xl border border-red-400/50 bg-red-500/10 p-5 outline-none"
          >
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

        {/* Priset syns alltid direkt ovanför knappen: hela sammanfattningen på mobil, en kort rad på dator. */}
        <div className="lg:hidden">
          <PriceSummary price={price} title="Sammanfattning innan du skickar" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="mb-2 hidden lg:block">
            <PriceLine price={price} />
          </div>
          <button
            type="submit"
            disabled={status.state === "submitting" || processingPhotos}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-bold text-black transition-colors hover:bg-mist-200 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:self-start"
          >
            {status.state === "submitting" && (
              <span
                aria-hidden="true"
                className="size-4 rounded-full border-2 border-black/30 border-t-black motion-safe:animate-spin"
              />
            )}
            {status.state === "submitting" ? "Skickar förfrågan…" : "Skicka bokningsförfrågan"}
          </button>
          <p className="flex items-start gap-2 text-sm font-medium text-mist-100">
            <ClockIcon className="mt-0.5 size-4 shrink-0 text-mist-300" />
            <span>{site.responseTime}</span>
          </p>
          <p className="text-xs leading-relaxed text-mist-400">
            Det här är en förfrågan, inte en bekräftad bokning. Du förbinder dig inte till något – vi bekräftar tid och
            pris innan bokningen gäller.
          </p>
        </div>
      </form>

      <aside aria-label="Sammanfattning av din förfrågan" className="hidden lg:sticky lg:top-28 lg:block">
        <PriceSummary price={price} />
      </aside>
    </div>
  );
}

/** Vad kunden behöver ordna (mobil bilvård) eller inte behöver ordna (hämtning och lämning, lämna bilen hos oss). */
function ArrangementInfo({ arrangement, service }: { arrangement: string; service?: Service }) {
  if (arrangement === "visit") {
    const needs = onSiteNeeds(service?.id);
    return (
      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
        <p className="font-semibold text-white">Det här behöver vi hos dig</p>
        {service ? (
          <p className="mt-1 text-sm text-mist-400">Gäller {service.name.toLowerCase()}.</p>
        ) : (
          <div className="mt-1 text-sm text-mist-400">
            <p>Om vi behöver el eller vatten beror på tjänsten:</p>
            <ul className="mt-1 space-y-0.5">
              {site.services.map((s) => (
                <li key={s.id}>
                  {s.name}: <span className="text-mist-200">{utilitiesText(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="mt-3 space-y-2 text-sm text-mist-100">
          {needs.map((need) => (
            <li key={need} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-white" />
              {need}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-mist-300">{site.onSite.mat}</p>
        <p className="mt-3 border-t border-white/10 pt-3 text-sm text-mist-400">
          Saknar du något av detta? {site.onSite.atOurPlaceNote}
        </p>
      </div>
    );
  }

  if (arrangement === "pickup") {
    return (
      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
        <p className="font-semibold text-white">Bra att veta</p>
        <p className="mt-1 text-sm text-mist-200">{site.onSite.pickupNote}</p>
      </div>
    );
  }

  if (arrangement === "dropoff") {
    return (
      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
        <p className="font-semibold text-white">Bra att veta</p>
        <ul className="mt-2 space-y-2 text-sm text-mist-200">
          <li className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-white" />
            Ingen reseavgift tillkommer.
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-white" />
            {site.onSite.dropoffNote}
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-white" />
            {site.onSite.dropoffHandover}
          </li>
        </ul>
      </div>
    );
  }

  return null;
}

function SuccessPanel({
  ref,
  H,
  values,
  price,
  reference,
  customerEmailSent,
  onNewRequest,
}: {
  ref: React.Ref<HTMLDivElement>;
  H: "h2" | "h3";
  values: BookingFields;
  price: Price;
  reference: string;
  customerEmailSent: boolean;
  onNewRequest: () => void;
}) {
  const firstName = values.name.trim().split(/\s+/)[0];
  const when = [
    values.date ? formatDate(values.date) : "",
    values.time ? (values.time === FLEXIBLE_TIME ? "flexibel tid" : `kl. ${values.time}`) : "",
  ]
    .filter(Boolean)
    .join(", ");
  const fee = !price.zone
    ? travelFeeText(price)
    : price.feeKnown
      ? `${formatSEK(price.fee)} – ${price.zone.label.charAt(0).toLowerCase()}${price.zone.label.slice(1)}`
      : "Bekräftas utifrån adressen";

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="scroll-mt-28 rounded-2xl border border-white/20 bg-ink-850 p-6 outline-none sm:p-10"
    >
      <span className="grid size-12 place-items-center rounded-full bg-white text-black">
        <CheckIcon className="size-6" />
      </span>
      <H className="font-display mt-6 text-2xl font-extrabold text-white sm:text-3xl">
        Tack {firstName}! Vi har tagit emot din förfrågan.
      </H>
      <p className="mt-4 max-w-xl leading-relaxed text-mist-200">
        <strong className="text-white">Det här är ingen bekräftad tid än.</strong> Vi går igenom förfrågan och hör av
        oss för att bekräfta tid och pris. {site.responseTime}
      </p>
      {customerEmailSent ? (
        <p className="mt-3 max-w-xl leading-relaxed text-mist-200">
          Vi har skickat en kopia av din förfrågan till{" "}
          <span className="font-semibold text-white [overflow-wrap:anywhere]">{values.email}</span>.
        </p>
      ) : (
        <p className="mt-3 max-w-xl leading-relaxed text-mist-200">
          Du får ingen kopia av förfrågan via e-post den här gången. Spara referensen{" "}
          <span className="font-semibold text-white">{reference}</span> – vi hör av oss på telefonnumret du angav.
        </p>
      )}
      <dl className="mt-8 grid gap-4 rounded-xl border border-white/10 bg-ink-900 p-5 text-sm sm:grid-cols-2">
        <SummaryRow label="Referens" value={reference} />
        <SummaryRow
          label="Tjänst"
          value={price.service ? `${price.service.name} – ${formatSEK(price.base)}` : "–"}
        />
        <SummaryRow label="Fordon" value={[price.vehicleSize?.label, values.vehicle].filter(Boolean).join(" · ") || "–"} />
        <SummaryRow label="Önskad dag och tid" value={when || "–"} />
        <SummaryRow label="Upplägg" value={price.arrangement?.label ?? "–"} />
        {values.location && locationRequired(values.arrangement) && <SummaryRow label="Adress" value={values.location} />}
        <SummaryRow label="Reseavgift" value={fee} />
        <SummaryRow
          label="Preliminärt pris"
          value={price.service ? `${formatSEK(price.total)}${price.feeKnown ? "" : " + reseavgift"}` : "–"}
        />
        {price.service?.duration && <SummaryRow label="Ungefärlig tid" value={capitalize(price.service.duration)} />}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-mist-400">
        {site.extraWorkNote} Betalning: {paymentMethodsText()}. {site.payment.when}
      </p>
      <p className="mt-6 text-sm text-mist-300">
        Behöver du ändra något? Ange referensen <span className="font-semibold text-white">{reference}</span> när du
        kontaktar oss
        {site.contact.phone && site.contact.phoneHref ? (
          <>
            {" "}
            på{" "}
            <a
              href={`tel:${site.contact.phoneHref}`}
              className="whitespace-nowrap font-semibold text-white underline underline-offset-4"
            >
              {site.contact.phone}
            </a>
          </>
        ) : null}
        .
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={onNewRequest}
          className="inline-flex h-11 items-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/5"
        >
          Skicka en ny förfrågan
        </button>
        <Link href="/" className="text-sm font-semibold text-white underline underline-offset-4">
          Till startsidan
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-mist-400">{label}</dt>
      <dd className="font-semibold text-white [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}
