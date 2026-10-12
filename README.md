# EA Auto Detail – website

Swedish-language website for EA Auto Detail, built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**.
No paid services and no extra runtime dependencies beyond Next.js/React.

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero, services & prices, before/after gallery, why us, how booking works, social links, FAQ, contact + booking form |
| `/tjanster` | Services & pricing, mobile-fee and extra-work terms, price table |
| `/galleri` | Before/after gallery with interior/exterior filter and drag/keyboard slider |
| `/boka` | Booking request form (`?tjanst=exterior|interior|complete` preselects a service) |
| `/om-oss` | About the two founders |
| `/vanliga-fragor` | FAQ (with FAQPage structured data for answered questions) |
| `/kontakt` | Contact details, social links, booking CTA |
| `/integritet` | Privacy policy **template** – review before publishing |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/llms.txt` | SEO, social sharing image, machine-readable summary for AI tools |
| `POST /api/booking` | Receives booking requests and forwards them (see below) |

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

- `PRICE` and `MOBILE_FEE` at the top – change a price there and it updates everywhere (cards, table, form summary, FAQ, metadata, `llms.txt`).
- `contact` – phone, e-mail, service area, availability. `null` = not supplied yet.
- `social` – TikTok / Instagram / Facebook URLs.
- `services[].includes` / `includesConfirmed` / `duration` – what each service includes and how long it takes.
- `faq` – questions and answers. `answer: null` shows a marked placeholder.
- `gallery` – before/after projects.
- `logo`, `heroImage` – set when you have a real logo / hero photo.
- `showPlaceholders` – while `true`, missing information is shown as yellow **"FYLL I"** markers. Set it to
  `false` before launch: anything still missing is then hidden instead of shown.

### Adding before/after photos

1. Put the images in `public/gallery/` (e.g. `golf-before.jpg`, `golf-after.jpg`, ideally 4:3, ~1600 px wide).
2. Add an entry to `gallery` in `site.ts`:
   ```ts
   {
     id: "vw-golf-invandig",
     title: "Invändig rengöring",
     category: "interior",            // or "exterior"
     vehicle: "VW Golf",
     serviceId: "interior",
     before: { src: "/gallery/golf-before.jpg", alt: "VW Golf – baksäte före rengöring" },
     after:  { src: "/gallery/golf-after.jpg",  alt: "VW Golf – baksäte efter rengöring" },
     placeholder: false,
   },
   ```
3. Delete the four `placeholder: true` example entries (and the `placeholder-*.svg` files) once you have real work.

The current gallery images and the hero graphic are drawn placeholders. They are labelled as examples on the site and are
not presented as customer work.

## Booking form → how requests reach you

The form validates in the browser **and** on the server (`src/lib/booking.ts`), compresses attached photos in the
browser, and posts to `/api/booking`. The API forwards the request to whichever channels are configured:

| Option | Env vars | What you get |
| --- | --- | --- |
| **A. E-mail via Resend** (recommended) | `RESEND_API_KEY`, `BOOKING_EMAIL_TO`, `BOOKING_EMAIL_FROM` | An e-mail per request with a summary and the photos attached. Reply-to is set when the customer chose e-mail. |
| **B. Webhook** | `BOOKING_WEBHOOK_URL` (+ optional `BOOKING_WEBHOOK_SECRET`) | A JSON `POST` (`type`, `status: "unconfirmed"`, `reference`, `customer`, `vehicle`, `service`, `arrangement`, `location`, `preferredDate`, `preferredTime`, `estimatedTotal`, `message`, `summary`, `photos[]` as base64). Works with Make, Zapier, n8n or a Google Apps Script that appends to a Google Sheet. |

You can configure both. **If neither is configured, the API answers 503 and the form tells the visitor plainly that the
request could not be sent** (and shows the contact details). No fake confirmations are ever shown. On success the
visitor sees a reference number and an explicit "this is not a confirmed booking yet" message.

Simplest setup for Resend: create a free account, verify your domain, create an API key, then set
`BOOKING_EMAIL_FROM="EA Auto Detail <bokning@yourdomain.se>"` and `BOOKING_EMAIL_TO=your@inbox.se`.

Privacy: the server never stores or logs customer data; only technical delivery errors are logged. A honeypot field and a
simple per-IP rate limit (8 requests / 10 min) reduce spam.

## Analytics

`src/lib/analytics.ts` exposes `track()`, already called for: booking button clicks (with location), successful and
failed booking requests, social link clicks and contact clicks. It currently sends **nothing** to any provider, because
no analytics tool or cookie-consent solution has been chosen. Each event is also dispatched as a `ea:track` browser event
(no personal data), so a future tool or marketing agent can listen to it. To enable: add a consent banner, make
`hasAnalyticsConsent()` return the visitor's choice, and forward events in `sendToProvider()`.

## SEO

- Swedish titles/descriptions per page, Open Graph/Twitter tags and a generated share image.
- Targets: bilvård, biltvätt, invändig bilrengöring, utvändig biltvätt, mobil bilvård. No city names are used until a
  service area is set.
- `robots.txt` **blocks indexing until `NEXT_PUBLIC_ALLOW_INDEXING=true`** so an unfinished site doesn't end up in Google.
- `LocalBusiness` (AutoWash) structured data renders automatically **only** once a real site URL, phone number and
  service area are configured.

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

- `npm run lint` and `npm run build` pass with no errors or warnings.
- All pages rendered in headless Chromium at 1440×900 and 390×844: HTTP 200, no console errors, no horizontal overflow.
- Keyboard: skip link, mobile menu (focus trap, Escape closes, closes on navigation), gallery filter, before/after slider.
- Booking form: client validation and error summary, server validation (via direct API calls), honeypot,
  "not configured" path, and a full successful submission with a photo to a local mock webhook.
- **Not tested:** real e-mail delivery through Resend (no account/API key available), and a real deployment.
