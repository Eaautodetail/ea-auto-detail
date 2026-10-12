/**
 * Skickar e-post – endast server.
 *
 * Två sätt att skicka, i prioritetsordning (se README och .env.example):
 *
 *  1. SMTP via nodemailer – t.ex. Gmail med ett applösenord.
 *     SMTP_USER + SMTP_PASS (SMTP_HOST, SMTP_PORT och SMTP_SECURE är valfria,
 *     standard är smtp.gmail.com:465 med TLS). Kan skicka till vem som helst,
 *     alltså både till företaget och till kunder.
 *
 *  2. Resend via REST: RESEND_API_KEY + BOOKING_EMAIL_FROM (+ BOOKING_EMAIL_TO
 *     för mejl till företaget). Med Resends testavsändare (@resend.dev) går det
 *     bara att skicka till kontots egen adress – då kan kunder INTE få mejl.
 *     Med en egen, verifierad domän i Resend fungerar mejl till kunder.
 *
 * Inga hemligheter eller kunduppgifter loggas – fel beskrivs med `describeDeliveryError`.
 */
import { site } from "@/config/site";

type Env = Record<string, string | undefined>;

export type EmailAttachment = { filename: string; content: Buffer; contentType?: string };

export type OutgoingEmail = {
  to: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
};

type SmtpSettings = { host: string; port: number; secure: boolean; user: string; pass: string };

export type EmailConfig = {
  provider: "smtp" | "resend" | null;
  /** Mejl till företaget om nya förfrågningar. */
  canNotifyBusiness: boolean;
  /** Mejl till kunder (kvitto och bekräftelse). */
  canEmailCustomers: boolean;
  from: string | null;
  /** Företagets mottagare (BOOKING_EMAIL_TO, annars SMTP_USER). */
  businessRecipients: string[];
  /** Reply-To i mejl till kunder, så att svar hamnar hos företaget. */
  businessReplyTo: string | null;
  smtp: SmtpSettings | null;
  resendApiKey: string | null;
};

/** Resends testavsändare kan bara leverera till kontoägarens egen adress. */
export function isResendTestSender(from: string) {
  return /@resend\.dev\s*>?\s*$/i.test(from.trim());
}

function list(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function replyToFor(recipients: string[]) {
  return site.contact.email ?? recipients[0] ?? null;
}

/** Läser e-postinställningarna från miljövariablerna. */
export function emailConfig(env: Env = process.env): EmailConfig {
  const configuredFrom = env.BOOKING_EMAIL_FROM?.trim() || null;
  const configuredTo = list(env.BOOKING_EMAIL_TO);

  const smtpUser = env.SMTP_USER?.trim();
  const smtpPassRaw = env.SMTP_PASS;
  if (smtpUser && smtpPassRaw?.trim()) {
    const host = env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = Number.parseInt(env.SMTP_PORT ?? "", 10) || 465;
    const secure = env.SMTP_SECURE ? env.SMTP_SECURE.trim().toLowerCase() === "true" : port === 465;
    // Googles applösenord visas med mellanslag ("abcd efgh ijkl mnop") – de ska inte vara med.
    const pass = host === "smtp.gmail.com" ? smtpPassRaw.replace(/\s+/g, "") : smtpPassRaw;
    const from = configuredFrom && !isResendTestSender(configuredFrom) ? configuredFrom : `${site.name} <${smtpUser}>`;
    const businessRecipients = configuredTo.length > 0 ? configuredTo : [smtpUser];
    return {
      provider: "smtp",
      canNotifyBusiness: true,
      canEmailCustomers: true,
      from,
      businessRecipients,
      businessReplyTo: replyToFor(businessRecipients),
      smtp: { host, port, secure, user: smtpUser, pass },
      resendApiKey: null,
    };
  }

  const resendApiKey = env.RESEND_API_KEY?.trim();
  if (resendApiKey && configuredFrom) {
    return {
      provider: "resend",
      canNotifyBusiness: configuredTo.length > 0,
      canEmailCustomers: !isResendTestSender(configuredFrom),
      from: configuredFrom,
      businessRecipients: configuredTo,
      businessReplyTo: replyToFor(configuredTo),
      smtp: null,
      resendApiKey,
    };
  }

  return {
    provider: null,
    canNotifyBusiness: false,
    canEmailCustomers: false,
    from: null,
    businessRecipients: [],
    businessReplyTo: replyToFor([]),
    smtp: null,
    resendApiKey: null,
  };
}

/**
 * Strikt kontroll av en mottagaradress innan vi skickar till den. Avvisar
 * tecken som kan tolkas som flera mottagare eller visningsnamn (, ; < > " ( ) mellanslag).
 */
const SAFE_ADDRESS = /^[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}][\p{L}\p{N}-]{1,62}$/u;

export function isSafeRecipient(address: string) {
  return address.length <= 254 && SAFE_ADDRESS.test(address) && !address.includes("..");
}

/** Fel med ett meddelande som är säkert att logga (inga kunduppgifter eller hemligheter). */
export class DeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryError";
  }
}

/**
 * Kort, loggbar beskrivning av ett leveransfel, t.ex. "EAUTH SMTP 535" eller
 * "Resend svarade 403". Serverns svarstext loggas aldrig (den kan innehålla adresser).
 */
export function describeDeliveryError(error: unknown): string {
  if (error instanceof DeliveryError) return error.message;
  if (error && typeof error === "object") {
    const e = error as { code?: unknown; responseCode?: unknown; name?: unknown; cause?: unknown };
    const code = (c: unknown) => (typeof c === "string" && /^[A-Z0-9_]{2,40}$/.test(c) ? c : null);
    const causeCode = e.cause && typeof e.cause === "object" ? code((e.cause as { code?: unknown }).code) : null;
    const parts = [code(e.code) ?? causeCode, typeof e.responseCode === "number" ? `SMTP ${e.responseCode}` : null].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    if (e.name === "TimeoutError" || e.name === "AbortError") return "timeout";
  }
  return "okänt fel";
}

type SmtpTransport = { sendMail: (options: Record<string, unknown>) => Promise<unknown> };
let cachedTransport: { key: string; transport: SmtpTransport } | null = null;

async function smtpTransport(s: SmtpSettings): Promise<SmtpTransport> {
  const key = `${s.host}:${s.port}:${s.secure}:${s.user}:${s.pass}`;
  if (cachedTransport?.key === key) return cachedTransport.transport;
  // Laddas först när SMTP faktiskt används.
  const nodemailer = (await import("nodemailer")).default;
  const transport = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    requireTLS: !s.secure,
    auth: { user: s.user, pass: s.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    // Bilagor skickas alltid som data – aldrig som filsökväg eller URL.
    disableFileAccess: true,
    disableUrlAccess: true,
    maxRecipients: 20,
  }) as unknown as SmtpTransport;
  cachedTransport = { key, transport };
  return transport;
}

/** Skickar ett mejl med den konfigurerade tjänsten. Kastar fel om det inte gick. */
export async function sendEmail(message: OutgoingEmail, config: EmailConfig = emailConfig()): Promise<void> {
  if (!config.from || !config.provider) throw new DeliveryError("e-post är inte konfigurerad");
  if (message.to.length === 0) throw new DeliveryError("mottagare saknas");

  if (config.provider === "smtp" && config.smtp) {
    const transport = await smtpTransport(config.smtp);
    await transport.sendMail({
      from: config.from,
      to: message.to.map((address) => ({ name: "", address })),
      bcc: message.bcc?.length ? message.bcc.map((address) => ({ name: "", address })) : undefined,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return;
  }

  if (config.provider === "resend" && config.resendApiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: message.to,
        ...(message.bcc?.length ? { bcc: message.bcc } : {}),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.headers ? { headers: message.headers } : {}),
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString("base64"),
                ...(a.contentType ? { content_type: a.contentType } : {}),
              })),
            }
          : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new DeliveryError(`Resend svarade ${res.status}`);
    return;
  }

  throw new DeliveryError("e-post är inte konfigurerad");
}
