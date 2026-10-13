# EA Auto Detail – website

Swedish-language website for EA Auto Detail, built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**.
No paid services required. The only runtime dependency besides Next.js/React is `nodemailer` (for sending e-mail via SMTP, e.g. Gmail).

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero, services & prices, travel fees, mobile service vs pickup vs drop-off, before/after gallery, why us, how booking works, hours/payment/response time, FAQ, contact + booking form |
| `/tjanster` | Services & prices, travel fees per arrangement and distance and a total-price table (`#totalpris`), mobile service vs pickup vs drop-off, payment, hours |
| `/galleri` | Before/after gallery with interior/exterior filter and drag/keyboard slider |
| `/boka` | Booking request form (`?tjanst=exterior|interior|complete` preselects a service) |
| `/om-oss` | About the two founders |
| `/vanliga-fragor` | FAQ (with FAQPage structured data for answered questions) |
| `/kontakt` | Contact details, social links, booking CTA |
| `/integritet` | Privacy policy – filled in from the real setup; legal name/org. no., retention period and web host still to be supplied |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/llms.txt` | SEO, social sharing image, machine-readable summary for AI tools |
| `POST /api/booking` | Receives booking requests, notifies the business and sends the customer a receipt (see below) |
| `/hantera` | **Internal** page for the owners to confirm a request (opened from the link in the booking e-mail; noindex, not in nav/sitemap, blocked in robots.txt) |
| `POST /api/booking/open`, `POST /api/booking/confirm` | Used by `/hantera`: open a sealed booking link, send the confirmation e-mail |

## Run locally

Requires Node.js 20.9+ (tested with Node 22).

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                  # http://localhost:3000
```

Production check: `npm run build && npm start`. Lint: `npm run lint`.

## Updating content (one file)

Everything business-related lives in **`src/config/site.ts`**:

- `PRICE`, `TRAVEL_FEE`, `TRAVEL_KM` and `SEASONS` at the top – change a price, fee, distance or opening time there and
  it updates everywhere (cards, tables, form summary, e-mails, FAQ, metadata, `llms.txt`).
- `contact` – phone, e-mail, service area. `null` = not supplied yet. `responseTime` – the promised response time.
- `hours` – working days and the current season (`currentSeason: "winter" | "summer"`); the booking form's start times
  follow it. Only start times where the chosen service (its `maxMinutes`) ends before closing time are offered, in the
  form and on the server.
- `TRAVEL_FEE` is per arrangement (`visit` = mobile service, `pickup` = pickup and return) and zone (`near`/`far`);
  `TRAVEL_KM` holds the zone limits. `travelZones` reads its fees from there; `travelFee(arrangement, zone)` gives the
  fee (0 for drop-off, `null` when it must be confirmed).
- `arrangements` (mobile service / pickup / drop-off – `feeApplies: false` means no address, zone or travel fee),
  `onSite` (what is needed on site, drop-off notes), `payment`.
- `social` – TikTok / Instagram / Facebook URLs.
- `services[]` – price, what is included, approximate time (`duration` text + `maxMinutes`, the upper bound in
  minutes) and on-site needs (water/electricity) per service.
- `comboSaving` – "X kr billigare än att boka delarna var för sig" and a badge on the combined service. Off
  (`show: false`) until you approve the wording.
- `about.story` – the paragraphs under *Vår historia* on `/om-oss`.
- `faq` – questions and answers, built by `buildFaq()` at the bottom of the file from the values above (prices,
  durations, on-site needs, payment, response time, phone, social links), so they stay in sync. Edit the wording there.
- `gallery` – before/after projects (see below). `serviceId: null` = which service the job was is not confirmed yet,
  so no service is shown under the photos.
- `logo`, `heroImage` – set when you have a real logo / hero photo.
- `showPlaceholders` – while `true`, missing information is shown as yellow **"FYLL I"** markers. Set it to
  `false` before launch: anything still missing is then hidden instead of shown.

### Adding before/after photos

**[BILDER.md](BILDER.md)** is a step-by-step guide in Swedish (upload on GitHub, edit `site.ts`, logo, hero and
*Om oss* photo). In short:

1. Put the images in `public/gallery/` (e.g. `golf-fore.jpg`, `golf-efter.jpg`, same angle and orientation, ~1200–1600 px
   on the long side; portrait phone photos work as they are).
2. Add an entry to `gallery` in `site.ts`:
   ```ts
   {
     id: "vw-golf-invandig",
     title: "Invändig rengöring",
     category: "interior",            // or "exterior"
     vehicle: "VW Golf",
     serviceId: "interior",            // or null if not confirmed
     before: { src: "/gallery/golf-before.jpg", alt: "VW Golf – baksäte före rengöring" },
     after:  { src: "/gallery/golf-after.jpg",  alt: "VW Golf – baksäte efter rengöring" },
     placeholder: false,
   },
   ```
3. The first entries are also shown on the home page (two on phones and tablets, three on desktop).

The gallery shows EA Auto Detail's own photos (4 jobs). The old `placeholder-*.svg` example images are no longer used and
can be deleted. The hero graphic is still a drawn placeholder until `heroImage` is set.

## Booking requests and e-mail

### The flow

1. **Customer** fills in `/boka`. Fields are validated in the browser and again on the server (`src/lib/booking.ts`);
   photos are compressed in the browser and posted with the form to `POST /api/booking`.
2. **You are notified** by e-mail (summary + photos attached, *Reply-To* = the customer) and/or by webhook. If no channel
   is configured the API answers 503 and the form says so plainly – no fake confirmations.
3. **The customer gets an automatic receipt** (“Vi har tagit emot din bokningsförfrågan”). It says clearly that the
   time is **not confirmed yet**, and contains the reference, service and price, travel fee (or “bekräftas av oss” when
   the customer chose *Vet inte*), arrangement, address, wished date/time, “Vi återkommer så snabbt vi kan – alltid inom
   24 timmar.”, what is needed on site (mobile service), the pickup note or the drop-off note (address sent when confirmed), payment (Swish/kontanter, on site after the
   job) and your phone number and social links. It is only sent when customer e-mail is possible (see table); if it
   fails, the request still succeeds (`customerEmailSent: false`), the success page tells the customer that no e-mail
   copy was sent, and you get a short separate e-mail saying the receipt did not go out.
4. **You confirm the time.** The e-mail you receive has a button *“Bekräfta tid och skicka bekräftelse”*. It opens
   `/hantera`, which shows the request and a short form (date, time, total price – prefilled from the request – and an
   optional message). Sending it e-mails the customer **“Din tid är bekräftad: …”** with *Reply-To* set to you and a
   hidden copy (Bcc) to your inbox, which is your record of what was sent.

There is **no database and no automatic calendar**: the site does not check availability or block times. A request is
only a request until you confirm it, by e-mail from `/hantera` or by phone/SMS.

All texts come from `src/config/site.ts` (prices, travel fees, payment, on-site needs, response time, contact, social
links). The e-mail templates are in `src/lib/email-templates.ts`.

### What each feature needs

| | Gmail via SMTP (app password) | Resend, test sender `onboarding@resend.dev` | Resend, own verified domain | Webhook only |
| --- | --- | --- | --- | --- |
| E-mail to you about each request | yes | yes | yes | no (JSON to the webhook instead) |
| Automatic receipt to the customer | yes | **no** (Resend's test sender can only deliver to the account owner) | yes | no |
| Confirmation e-mail from `/hantera` | yes | **no** – the page says so and shows the customer's phone number | yes | no (no link is sent) |

**In short: the customer receipt and the confirmation e-mail need SMTP (a Gmail app password) or a verified own domain
in Resend.** If both SMTP and Resend are configured, SMTP is used.

### Option A (recommended): Gmail with an app password

Free, no domain needed, and it can e-mail customers.

1. Turn on **2-Step Verification** for the Google account `eaautodetail2026@gmail.com`
   (myaccount.google.com/security). App passwords can't be created without it.
2. Create an app password at **myaccount.google.com/apppasswords** (name it e.g. “Hemsida”). Google shows a
   16-character password once.
3. Set `SMTP_USER=eaautodetail2026@gmail.com` and `SMTP_PASS=<the app password>` (spaces don't matter). Never use the
   account's normal password.
4. Optional: `BOOKING_EMAIL_TO` (defaults to `SMTP_USER`; comma-separate several addresses) and `BOOKING_SECRET` (see below).

Defaults are `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, TLS (`SMTP_SECURE=true`); set them only for another provider
(port 587 uses STARTTLS, which is then required). E-mails are sent from `EA Auto Detail <SMTP_USER>`; a
`BOOKING_EMAIL_FROM` is used instead only if it isn't an `@resend.dev` address (Gmail may still rewrite it to the
account's own address). Sent mails show up in the account's *Sent* folder. Revoking the app password stops all e-mail
until a new one is set. If your host blocks outgoing SMTP, use Resend with your own domain instead.

### Option B: Resend

Used only when `SMTP_USER`/`SMTP_PASS` are not both set. Needs `RESEND_API_KEY`, `BOOKING_EMAIL_FROM` and (for
e-mails to you) `BOOKING_EMAIL_TO`.

- **Test sender, no domain:** sign up at resend.com with `eaautodetail2026@gmail.com`, then
  `BOOKING_EMAIL_FROM="EA Auto Detail <onboarding@resend.dev>"` and `BOOKING_EMAIL_TO=eaautodetail2026@gmail.com`. You get
  the requests, but customers get **no receipt and no confirmation** e-mail.
- **Own domain:** verify the domain in Resend and set e.g. `BOOKING_EMAIL_FROM="EA Auto Detail <bokning@yourdomain.se>"`.
  Then customer e-mails work too.

### Confirmation links (`/hantera`) and `BOOKING_SECRET`

The link in your e-mail looks like `https://<site>/hantera#t=v1.…`. The part after `t=` is a **sealed token**: the
request's details (reference, name, e-mail, phone, vehicle, service, arrangement, address, travel zone, wished date/time,
quoted price, issued-at) encrypted with **AES-256-GCM**. It can't be read or changed without the key, and it expires
after **60 days**.

- The key is derived with HKDF-SHA256 from `BOOKING_SECRET`. If that is empty it is derived from `SMTP_PASS` or
  `RESEND_API_KEY` (each with its own HKDF label), so links work as soon as e-mail works. **Set `BOOKING_SECRET`**
  (e.g. `openssl rand -base64 32`) so that changing the app password or API key doesn't break links. Links created before
  you add `BOOKING_SECRET` keep working as long as the old password/key is unchanged. Changing `BOOKING_SECRET` breaks
  the links created with it.
- The token sits in the URL **fragment** (`#…`), which browsers never send to the server, so it doesn't end up in
  server or proxy logs. The page posts it in a request body to `/api/booking/open` and `/api/booking/confirm`, which
  re-validate it every time.
- Anyone with the link can see that request and send the confirmation to that customer: **don't forward the
  e-mail.** The link is intentionally not included in the webhook payload. The links use `NEXT_PUBLIC_SITE_URL` when it is
  an https address (otherwise the address the request came in on), so set it before launch.
- Nothing is stored, so the page can't tell whether a request was already confirmed. Your Bcc copy is the record;
  sending again sends the customer a new confirmation (useful if the time changes).
- `/hantera` is `noindex`, has a `no-referrer` referrer policy, is disallowed in `robots.txt` and is not linked anywhere.

### Webhook

`BOOKING_WEBHOOK_URL` (+ optional `BOOKING_WEBHOOK_SECRET`, sent as `X-Webhook-Secret`) receives a JSON `POST` per
request: `type: "booking_request"`, `status: "unconfirmed"`, `reference`, `receivedAt`,
`customer {name, phone, email}`, `vehicle`, `service {id, name, price}`, `arrangement {id, label}`, `address`,
`travel {zone, label, fee}` (`fee: null` = to be confirmed; `travel: null` for drop-off), `travelFee` (0 for drop-off), `preferredDate`, `preferredTime`, `estimatedTotal`,
`feeConfirmed`, `currency`, `message`, `summary` (plain text) and `photos[]` (base64). Works with Make, Zapier, n8n or a
Google Apps Script that appends to a Google Sheet. It can be used instead of, or together with, e-mail.

### API responses (`POST /api/booking`)

Success: `200 {ok: true, reference, customerEmailSent}`. Errors: `{ok: false, code, message, errors?}` with
`422 validation`, `503 not_configured`, `502 delivery_failed` (no channel to you worked), `429 rate_limited`,
`400 bad_request | rejected`.

### Privacy and abuse protection

- The server never stores or logs customer data. Only short technical error codes are logged
  (e.g. `[booking] … EAUTH SMTP 535` = wrong app password, `Resend svarade 403`).
- Honeypot field, plus simple per-IP rate limits per server instance: 8 requests / 10 min for bookings, 30 for opening
  a link, 10 for sending confirmations. The key is the first `X-Forwarded-For` address, which Vercel sets itself; behind
  another proxy that appends to that header, change `clientIp()` in `src/lib/http.ts`.
- Automatic receipts are capped per server instance (20 per hour, 60 per 24 hours, `receiptBudget` in
  `src/app/api/booking/route.ts`) so the form cannot be used to send mass e-mail from your Gmail. Above the cap the
  request still reaches you, your e-mail says no receipt was sent, and the customer is told so. The counters live in
  memory per instance; for real protection add a CAPTCHA (e.g. Cloudflare Turnstile) and/or a shared store (e.g.
  Upstash Redis) before heavy traffic.
- The receipt only contains what the customer entered in fixed fields (not the free-text message), and it is only sent
  to addresses that pass a strict check (no lists or display-name tricks). It ends with “if this wasn't you, ignore this
  e-mail”.
- User input is HTML-escaped in every e-mail; attachments are always sent as data (nodemailer file/URL access is off).
- Photos are checked on their content (JPEG/PNG/WEBP/HEIC signatures), not on the file name or the type the browser
  claims; anything else is rejected with 422. Attachments are renamed `bild-1.jpg`, `bild-2.png` … with the detected
  type, so no other file type can reach your inbox through the form.

## Analytics

`src/lib/analytics.ts` exposes `track()`, already called for: booking button clicks (with location), successful and
failed booking requests, social link clicks and contact clicks. It currently sends **nothing** to any provider, because
no analytics tool or cookie-consent solution has been chosen. Each event is also dispatched as a `ea:track` browser event
(no personal data), so a future tool or marketing agent can listen to it. To enable: add a consent banner, make
`hasAnalyticsConsent()` return the visitor's choice, and forward events in `sendToProvider()`.

## SEO

- Swedish titles/descriptions per page, Open Graph/Twitter tags and a generated share image.
- Targets: bilvård, biltvätt, invändig bilrengöring, utvändig biltvätt, mobil bilvård, plus Kristianstad.
- `robots.txt` **blocks indexing until `NEXT_PUBLIC_ALLOW_INDEXING=true`** so an unfinished site doesn't end up in Google.
- `LocalBusiness` (AutoWash) structured data (no street address, hours from the current season) renders **only** when
  the site URL is a real https address and a phone number is set.

## AI / marketing-agent friendly

- All facts come from `src/config/site.ts` – an agent can read or edit one typed file.
- `/llms.txt` serves a plain-text summary of services, prices and terms generated from that file.
- Booking webhook payloads are structured JSON, easy to feed into a CRM or automation.

## Deploying (Vercel, free tier)

1. Push this folder to a GitHub repository.
2. Import it at vercel.com → New Project (framework is auto-detected).
3. Add the environment variables from `.env.example`.
4. Deploy, then connect your domain under Settings → Domains and set `NEXT_PUBLIC_SITE_URL` to it.

Any Node.js host that runs `npm run build && npm start` also works. Photo uploads are capped at ~4 MB total to stay
under Vercel's request size limit.

## What was tested

- `npx tsc --noEmit`, `npm run lint` and `npm run build` pass with no errors or warnings.
- A build with dummy values in every secret variable was searched: none of them appear anywhere in `.next`
  (client bundles or prerendered pages).
- Production server (`next start`) end to end against a local SMTP test server with real TLS, both implicit TLS
  (port 465 style) and STARTTLS:
  - `POST /api/booking`: every validation error (422), honeypot and non-multipart bodies (400), the per-IP rate
    limit (429), and successful requests with photos (200, `customerEmailSent: true`).
  - The e-mails: the business e-mail (Reply-To = customer, photo attached, `/hantera#t=` link) and the customer
    receipt ("tiden är inte bekräftad än", response time, price and travel fee).
  - `/api/booking/open` and `/confirm`: a valid token works; tampered, truncated, expired, future-dated and
    wrong-key tokens are rejected. The confirmation e-mail goes to the customer with a Bcc to the business, and
    user input is HTML-escaped.
  - Configuration paths: no e-mail settings gives 503 `not_configured`, and Resend-only with the test sender gives
    502 `delivery_failed` when delivery fails. The server log contains only error codes.
- All pages rendered in headless Chromium at 1280×900, 390×844, 360 and 320 px wide (including the filled booking form,
  the success panel and `/hantera`): no console errors, no horizontal overflow.
- Keyboard: skip link, mobile menu (focus trap, Escape closes, closes on navigation), gallery filter, before/after slider.
- Booking form: client validation and error summary, server validation (via direct API calls), honeypot,
  "not configured" path, and a full successful submission with a photo to a local mock webhook.
- Booking e-mail flow (receipt, `/hantera`, confirmation): the API routes were exercised end to end through `next dev`
  against a local SMTP test server via nodemailer, plus unit tests of the sealed token (round trip, tampering, expiry),
  the e-mail templates (escaping, content) and the `/hantera` page logic (jsdom).
- **Not tested:** delivery through the real Gmail SMTP server or Resend (no credentials available), and a real deployment.
  Send yourself one test booking after setting the variables.

## Recensioner

- `/recensioner` visar recensioner med 4–5 stjärnor och har ett formulär där vem som helst kan lämna en recension.
  Alla recensioner sparas; företaget får ett mejl om varje ny, med en länk för att dölja den (spam e.d.).
- Startsidan visar de tre senaste under "Vad säger kunderna?".
- När en tid bekräftas på `/hantera` planeras ett mejl till kunden dagen efter den bokade tiden med en länk
  till formuläret. Vercel Cron (`vercel.json`) kör `/api/cron/review-requests` varje morgon kl. 08 UTC.
  Kundens uppgifter raderas när mejlet har skickats.
- Lagring: Upstash Redis (`KV_REST_API_URL`, `KV_REST_API_TOKEN`), se `.env.example`. Utan den visar sidan
  ett ärligt besked i stället för formuläret och inga recensionsmejl planeras.
