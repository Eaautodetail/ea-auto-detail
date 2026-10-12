# Before publishing – checklist

Business facts live in `src/config/site.ts`. How to add photos, a logo or a hero image: see [BILDER.md](BILDER.md)
(Swedish, step by step). E-mail details: README → *Booking requests and e-mail*.

## Already supplied (in `site.ts`)
- [x] E-mail for bookings and on the site: eaautodetail2026@gmail.com
- [x] Phone for calls and SMS: 072-350 48 05
- [x] Service area: Kristianstad, up to about 20 km (e.g. Åhus). Travel fee 150 kr within about 5 km, 250 kr for
      5–20 km, and *Vet inte* is confirmed by you from the address.
- [x] Social links: TikTok, Instagram, Facebook
- [x] Services: what each includes, approximate time, what is needed on site (el / vatten och el), extra-work note
- [x] Working hours: every day, 09.00–19.00 (summer) and 09.00–18.00 (winter)
- [x] Payment: Swish or cash, on site when the job is done
- [x] Response time: "Vi återkommer så snabbt vi kan – alltid inom 24 timmar."
- [x] Before/after photos of your own work (4 jobs) in the gallery

## Required before launch
Set these in the hosting environment (Vercel → Settings → Environment Variables), never in the code. Redeploy after
changing them: the site address and the e-mail provider named on `/integritet` are fixed when the site is built.

- [ ] **E-mail sending: `SMTP_USER` + `SMTP_PASS`** (Gmail app password).
  1. Turn on 2-Step Verification for eaautodetail2026@gmail.com (myaccount.google.com/security).
  2. Create an app password at myaccount.google.com/apppasswords.
  3. `SMTP_USER=eaautodetail2026@gmail.com`, `SMTP_PASS=<the 16-character app password>`.

  Without this, the form says plainly that the request could not be sent. Resend with its test sender
  (`onboarding@resend.dev`) only e-mails you: customers then get no receipt and no confirmation.
- [ ] **`BOOKING_SECRET`**: a long random string (e.g. `openssl rand -base64 32`). It keeps the confirmation links in
      your e-mails working even if you change the app password.
- [ ] **`NEXT_PUBLIC_SITE_URL`**: the real https address, without a trailing slash. Used for the links in e-mails, the
      sitemap, share images and Google's business data.
- [ ] **Privacy policy details** (`/integritet`): legal company name and organisation number, how long requests and
      e-mails are kept, and the web host (e.g. Vercel).
- [ ] **Test on the live site**:
  1. Send a booking request to yourself and check the e-mail you receive (photos attached; *Svara* goes to the customer).
  2. Check the customer receipt. It must say the time is not confirmed yet.
  3. Click *Bekräfta tid och skicka bekräftelse*, send a confirmation, and check that it arrives along with your Bcc copy.

## Recommended
- [ ] Check the photos before going live: the exterior and van photos show houses in the background. The number
      plates are already covered. See the privacy note in BILDER.md.
- [ ] `/om-oss`: your first names, a line on how you started, and a photo of the two of you (`aboutImage`, see BILDER.md).
- [ ] Logo (`site.logo`) and a hero photo of your own work (`site.heroImage`), see BILDER.md.
- [ ] Approve the wording "Mest prisvärt" and "49 kr billigare än att boka delarna var för sig". It is calculated from
      the prices (149 + 249 kr compared with 349 kr), not a separate discount.
- [ ] Switch `hours.currentSeason` between `"winter"` and `"summer"` when the season changes. The hours shown and the
      start times in the booking form follow it.
- [ ] Decide on analytics + cookie consent if you want tracking (README → Analytics).

## Launch switches
- [ ] `showPlaceholders: false` in `site.ts` (hides any remaining yellow "FYLL I" markers).
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=true` in the hosting environment.
- [ ] Connect the domain (Vercel → Settings → Domains) and make sure `NEXT_PUBLIC_SITE_URL` matches it.

## Not on the site (on purpose)
- Machine polishing, paint correction or other advanced treatments: not offered.
- Reviews, guarantees, discounts or certifications: none are shown until real ones are supplied.
- No online calendar: a request is not a booking until you have confirmed the time.
