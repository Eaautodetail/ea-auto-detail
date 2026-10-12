/**
 * Små formulärbyggstenar för bokningsformuläret (etiketter, felmeddelanden,
 * textfält, val-kort). Används bara av `booking-form.tsx`.
 */
import type { ReactNode } from "react";
import { CheckIcon } from "@/components/ui";

/**
 * "Namn *" → "Namn" + en asterisk som bara syns. Att fältet är obligatoriskt
 * meddelas i stället via `required` på själva fältet, så att skärmläsare säger
 * "obligatoriskt" i stället för "asterisk".
 */
export function RequiredText({ children }: { children: ReactNode }) {
  if (typeof children === "string" && children.endsWith(" *")) {
    return (
      <>
        {children.slice(0, -2)} <span aria-hidden="true">*</span>
      </>
    );
  }
  return <>{children}</>;
}

export function Legend({ step, children }: { step: number; children: ReactNode }) {
  return (
    <legend className="mb-4 flex items-center gap-3 font-display text-lg font-bold text-white">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full border border-white/25 text-xs font-bold text-mist-200"
      >
        {step}
      </span>
      <span>
        <RequiredText>{children}</RequiredText>
      </span>
    </legend>
  );
}

export function FieldError({ id, message }: { id: string; message?: string | false }) {
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
  "mt-2 block w-full min-w-0 scroll-mt-32 rounded-xl border bg-ink-900 px-4 py-3 text-base text-white placeholder:text-mist-400/70 transition-colors focus:border-white focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-white/30 [color-scheme:dark]";

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
  /** Id på en gemensam hjälptext utanför fältet (t.ex. för en hel fieldset). */
  describedBy?: string;
};

function ariaDescribedBy(id: string, hint?: string, error?: string | false, extra?: string) {
  return [extra ?? "", hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
}

function Label({ id, label, hint }: { id: string; label: string; hint?: string }) {
  return (
    <>
      <label htmlFor={id} className="text-sm font-medium text-white">
        <RequiredText>{label}</RequiredText>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-mist-400">
          {hint}
        </p>
      )}
    </>
  );
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  describedBy,
  className = "",
  ...rest
}: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value">) {
  return (
    <div>
      <Label id={id} label={label} hint={hint} />
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy(id, hint, error, describedBy)}
        className={`${inputClasses(error)} ${className}`}
        {...rest}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  describedBy,
  maxLength,
}: FieldProps & { maxLength?: number }) {
  return (
    <div>
      <Label id={id} label={label} hint={hint} />
      <textarea
        id={id}
        name={name}
        rows={4}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy(id, hint, error, describedBy)}
        className={`${inputClasses(error)} resize-y`}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  describedBy,
  options,
  placeholder,
  required,
}: FieldProps & { options: { value: string; label: string }[]; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <Label id={id} label={label} hint={hint} />
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy(id, hint, error, describedBy)}
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

/** Ett klickbart kort som fungerar som en vanlig radioknapp (tangentbord, skärmläsare). */
export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  meta,
  invalid,
  required,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: ReactNode;
  meta: string;
  invalid?: boolean;
  required?: boolean;
}) {
  return (
    <label
      className={`relative flex min-w-0 cursor-pointer flex-col rounded-xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white ${
        checked
          ? "border-white bg-white/10"
          : invalid
            ? "border-red-400/60 bg-ink-900 hover:border-red-300"
            : "border-white/15 bg-ink-900 hover:border-white/35"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        required={required}
        className="sr-only"
      />
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
      <span className="mt-auto pt-3 text-sm font-bold text-mist-100">{meta}</span>
    </label>
  );
}

/** Liten klockikon för tidsåtgång. */
export function ClockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
