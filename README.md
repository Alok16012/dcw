# DCW Education Super-App

Production-style Next.js prototype based on `DCW-SuperApp-PRD-v1.md`.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000/distance](http://localhost:3000/distance).

## Implemented routes

- `/distance`, `/distance/universities`, `/distance/university/amity-online`, `/distance/boards`
- `/colleges`, `/colleges/search`, `/colleges/college/aiims-patna`, `/colleges/neet-predictor`
- `/jobs`, `/jobs/search`, `/jobs/hdfc-relationship`, `/jobs/resume-builder`
- `/saved`, `/applications`

Additional entity slugs from the seed dataset resolve through the same full detail experience.

## Prototype behavior

- Saved and comparison state persists locally.
- Search, filters, sorting, accordions, board quiz, NEET predictor and resume wizard are interactive.
- Lead/application verification is explicitly simulated. Use demo code `123456`; no OTP, CRM or WhatsApp request is sent.
- Fees, cutoffs, salaries and ratings are indicative dummy data.

## Verification

`npm run build` passes. Browser QA covered desktop and 390px mobile, direct detail routes, search, predictor results, resume steps, lead flow, console errors and horizontal overflow.
