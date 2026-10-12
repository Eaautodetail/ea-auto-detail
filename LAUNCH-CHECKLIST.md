# Before publishing – what EA Auto Detail needs to supply

Fill these in `src/config/site.ts` unless noted. Everything marked **FYLL I** on the site comes from this list.

## Required
- [ ] **How booking requests should reach you**: an e-mail address (for Resend) or a webhook/automation – see README.
- [ ] **Phone number** and/or **e-mail address** to show on the site (`contact.phone`, `contact.phoneHref`, `contact.email`).
- [ ] **Service area** – which towns/municipalities you cover (`contact.serviceArea`, and the FAQ "Vilka områden åker ni till?").
- [ ] **Social media URLs** for TikTok, Instagram and Facebook (`social`).
- [ ] **What each service includes** – confirm or edit the draft lists, then set `includesConfirmed: true`.
- [ ] **Approximate time per service** (`services[].duration`) and the FAQ "Hur lång tid tar en rengöring?".
- [ ] **Payment methods** (Swish, card, invoice…) for the FAQ.
- [ ] **What you need on site for mobile service** (water/electricity or self-sufficient) for the FAQ.
- [ ] **Real before/after photos** of your own work, then remove the example entries.
- [ ] **Privacy policy details**: legal company name, organisation number, contact, retention period, which providers you use (`/integritet`).
- [ ] **Domain name** → set `NEXT_PUBLIC_SITE_URL`.

## Recommended
- [ ] Logo file (SVG/PNG) → `site.logo`. Until then a text wordmark is used.
- [ ] A hero photo of your own work → `site.heroImage`.
- [ ] A photo of the two of you and a few personal details for `/om-oss`.
- [ ] When you are available / respond to requests (`contact.availability`).
- [ ] Confirm the wording of the "Ni kommer till mig / Hämtning och lämning / Annat upplägg" options.
- [ ] Decide on analytics + cookie consent if you want tracking (see README → Analytics).

## Launch switches
- [ ] `showPlaceholders: false` in `site.ts`.
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=true` in the hosting environment.
- [ ] Send one test booking and confirm it arrives.

## Not on the site (on purpose)
- Paint correction / machine polishing – not offered.
- Headlight restoration – add only when you confirm it's available.
- Reviews, guarantees, discounts, opening hours, certifications – none shown until you supply real ones.
