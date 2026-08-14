# Product Requirements Document
## DCW Education Super-App — Web + Mobile App

| | |
|---|---|
| **Product** | DCW Super-App (working name) |
| **Owner** | Distance Courses Wala (DCW), Patna |
| **Document version** | v1.0 |
| **Prepared for** | Development team handoff |
| **Related systems** | Sky-High CRM, WhatsApp Automation Module |

---

## 1. Executive summary

DCW ek single platform banana chahta hai jisme teen alag-alag education businesses ek hi app/website ke andar chalein — Flipkart aur Flipkart Minutes ki tarah, jahan top par tab switch karne se poora interface badal jaata hai lekin login, cart aur account same rehta hai.

Teen verticals:

| Tab | Name | Business |
|---|---|---|
| 1 | **Distance Courses Wala** | Open schooling (10th/12th), distance UG/PG, online degrees |
| 2 | **Colleges Wala** | Regular colleges, medical (MBBS/BDS), study abroad |
| 3 | **Berojgar Bharat** | Jobs, placement drives, skill courses, sarkari exam alerts |

**Core product thesis:** Student ek hi jagah par apni poori journey complete kare — 10th/12th se lekar degree, phir job tak. Har vertical ka lead ek hi CRM me jaata hai, isliye ek hi student ko teen baar monetise kiya ja sakta hai (school → college → placement).

**Business model:** Lead generation + admission commission (B2C), plus associate/franchise channel (B2B). Platform revenue directly nahi leta — value ye hai ki lead capture, comparison aur trust building automate ho jaaye.

### Reference products (developer ko dekhne chahiye)
| Reference | Kya lena hai |
|---|---|
| flipkart.com / app | Tab-switch navigation pattern, home page rhythm |
| collegevidya.com | Distance/online college comparison depth, verification badges |
| collegedunia.com | College listing filters, detail page structure, review system |
| shiksha.com | Fee data presentation, course-wise pages |
| naukri.com / apna.co | Job card, apply flow, entry-level job UX |

---

## 2. Goals & success metrics

### Business goals
1. Teen verticals ka lead capture ek platform par consolidate karna
2. Organic (SEO) traffic se paid ads par dependency kam karna
3. Comparison tools se lead quality badhana — student informed aakar aaye, counsellor ka time bache
4. Existing student base ko placement vertical me cross-sell karna

### Success metrics (Phase 1 ke 6 mahine baad)
| Metric | Target |
|---|---|
| Monthly organic sessions | 50,000+ |
| Lead form conversion rate | 6%+ of sessions |
| Cross-vertical engagement (2+ tabs visit) | 15% of users |
| Lead → counsellor connect (24 hrs) | 90%+ |
| Mobile page load (LCP, 4G) | < 2.5s |
| App store rating | 4.2+ |

### Non-goals (Phase 1 me nahi)
- Online fee payment gateway (Phase 2)
- Live classes / LMS
- User-generated reviews with moderation (Phase 2 — Phase 1 me curated reviews only)
- Regional languages beyond Hindi + English (Phase 3)

---

## 3. Target users

### Persona A — "Rahul", 19, Class 12 dropout, Gujarat
Gap year ho gaya hai, 12th complete karna hai jaldi. Mobile-only user, Hindi comfortable. Google par "12th fast track" search karta hai. Concern: "Ye valid hai ya nahi? Aage college me chalega?"
**Needs:** Board comparison, validity proof, fee clarity, WhatsApp par baat.

### Persona B — "Priya", 17, Class 12 PCB, Patna
NEET diya hai, rank 45,000. Government college nahi milega. Parents budget ₹25L tak. Confused between private Indian college vs MBBS abroad.
**Needs:** Rank-based college predictor, fee vs total cost comparison, NMC approval status, counselling date alerts.

### Persona C — "Amit", 23, B.Com graduate, Patna
Degree ho gayi, job nahi. Salary expectation ₹15–20K. English weak.
**Needs:** Freshers ke liye jobs, walk-in dates, resume, skill course jo job dilaye.

### Persona D — "Associate/Partner", 30s, tier-3 town
DCW ka franchise partner. Apne students ke liye platform use karta hai.
**Needs:** Apna referral link, wallet/commission view, student status tracking. (Detailed spec Sky-High CRM B2B portal me hai — yahan sirf entry point.)

---

## 4. Information architecture

```
┌─────────────────────────────────────────────┐
│ HEADER (persistent, theme changes per tab)  │
│  Logo · Location · Notifications · Profile  │
│  Search bar (context-aware placeholder)     │
│  ┌─────────┬──────────┬─────────┐           │
│  │DISTANCE │ COLLEGES │ BEROJGAR│  ← TABS   │
│  │Courses  │   Wala   │  Bharat │           │
│  └─────────┴──────────┴─────────┘           │
│  Live ticker (deadline / vacancy count)     │
├─────────────────────────────────────────────┤
│                                             │
│   TAB CONTENT (fully swaps, theme + data)   │
│                                             │
├─────────────────────────────────────────────┤
│ COMPARE TRAY (floating, if items selected)  │
├─────────────────────────────────────────────┤
│ Home · Compare · Counsellor · Apps · Profile│
└─────────────────────────────────────────────┘
```

### Navigation rules
1. **Tab switch = vertical switch.** Theme colour, search scope, home content, aur category set — sab badalta hai. URL bhi badalta hai (`/distance`, `/colleges`, `/jobs`).
2. **Persistent layer:** login session, saved items, applications, notifications, counsellor chat — sab tabs me shared.
3. **Compare tray tab-scoped hai.** Distance college ko regular college ke saath compare nahi kar sakte (apples-to-oranges). Tab switch par tray clear ho jaata hai — lekin state memory me rehta hai, wapas aane par restore ho.
4. **Bottom nav 5 items par fixed.** Icons same rehte hain, colour theme se aata hai.
5. **Deep link handling:** har college/job/course ka apna shareable URL. Link kholne par correct tab auto-select ho.

### Theme tokens
| Vertical | Primary | Secondary | Tint (backgrounds) |
|---|---|---|---|
| Distance | `#2C3EE0` | `#6B4BEA` | `#ECEEFF` |
| Colleges | `#00786A` | `#14A88F` | `#E2F5F1` |
| Jobs | `#D93A17` | `#FF7A1A` | `#FFEDE6` |

Implementation: CSS custom properties root par set karein, tab change par variable swap. Har vertical ke liye alag CSS file **nahi** banani.

---

## 5. TAB 1 — Distance Courses Wala

### 5.1 Home screen
| Section | Content | Notes |
|---|---|---|
| Category pucks (horizontal scroll) | 10th Open, 12th Open, UG Distance, PG Distance, Online Degree, Fast Track | Tap → filtered listing |
| Hero banner | "10th / 12th sirf 45 din me" + CTA | Admin se editable (CMS banner slot) |
| **Board comparison widget** | BOSSE / NIOS / BBOSE, visual bar showing acceptance level + speed | Signature feature — ye DCW ka core differentiator hai |
| University listing | Top online/distance universities, card format | Sorted by admin-set priority, then rating |
| Trust strip | Verified count, students admitted, 1:1 counsellor | Static, admin editable |
| SEO content block | 300–500 word text about open schooling | Collapsible, crawlable |

### 5.2 College/University listing page
**Filters (multi-select, applied without page reload):**
- Course level: 10th, 12th, UG, PG, Diploma
- Stream: Arts, Commerce, Science, Management, IT
- Fee range: slider (₹10K – ₹3L)
- Approval: UGC-DEB, AICTE, NAAC grade
- Mode: Distance, Online, Open school
- EMI available: yes/no
- University type: Central, State, Private, Deemed

**Sort:** Relevance · Fee low→high · Fee high→low · Rating · Fastest completion

**Card must show:** Logo, name, location, mode badge, rating, course name + duration, approval badges (max 3), total fee with strikethrough MRP, EMI per month, **Compare checkbox**, Apply button.

### 5.3 College detail page
Tabs within page: Overview · Courses & Fees · Approvals · Admission Process · Placement · Reviews · FAQs

Mandatory blocks:
1. Sticky header with fee + "Apply now" / "Talk to counsellor" (mobile par bottom sticky bar)
2. Approval documents — actual certificate images, zoomable (trust ka sabse bada driver)
3. Course-wise fee table — semester/year breakup, EMI options
4. Admission process — step-by-step with document checklist
5. "Similar universities" — 4 cards
6. FAQ accordion — schema markup ke saath (SEO)

### 5.4 Board comparison tool (dedicated page)
Full-width comparison table: NIOS vs BOSSE vs BBOSE vs CBSE patra.
Rows: Recognition, Exam frequency, Result time, Subject flexibility, Fee, TC required?, Best for whom.
Ek "Aapke liye kaunsa?" mini-quiz (4 questions) jo recommendation deta hai + lead capture karta hai.

### 5.5 Comparison engine (up to 3 items)
Side-by-side sticky-header table. Rows: Fee, Duration, Approvals, Mode, EMI, Exam pattern, Placement support, Rating.
Differences highlighted ho — same values grey, different values bold.
Bottom par "Enquire about all 3" — ek form se teeno ke liye lead generate ho.

---

## 6. TAB 2 — Colleges Wala

### 6.1 Home screen
| Section | Content |
|---|---|
| Stream pucks | Medical, Engineering, Management, Law, Study Abroad, Commerce |
| Tool tiles (2×2 grid) | NEET Rank Predictor · Fee vs Package (ROI) · Counselling Dates · Abroad Eligibility Checker |
| Featured colleges | Medical + Engineering, cutoff aur seat matrix ke saath |
| Study abroad banner | "MBBS abroad, bina donation" |
| Country cards | Georgia, Russia, Canada, UK — intake + total cost |
| Exam calendar strip | NEET, JEE, BCECE, CUET — next date countdown |

### 6.2 College listing filters (regular)
- Stream + specific course (MBBS, BDS, B.Tech CSE, etc.)
- State / City
- College type: Government, Private, Deemed, Autonomous
- Entrance exam accepted
- Fee range (₹50K – ₹50L — much wider than Tab 1)
- NIRF rank band
- Hostel available
- Placement package range

### 6.3 College detail page (extra blocks vs Tab 1)
- **Cutoff trends** — last 3 years, category-wise (Gen/OBC/SC/ST), simple line chart
- **Seat matrix** — total, category-wise, management quota
- **Placement data** — highest, average, median package; top recruiters
- **Hostel & campus** — fee, facilities, photos
- **Total cost calculator** — tuition + hostel + misc × years = real number (students ye kahin nahi dekh paate)

### 6.4 NEET Rank Predictor
Input: NEET score OR rank, category, state, domicile, budget.
Output: 3 buckets — "Strong chance", "Possible", "Backup". Har bucket me colleges with last year's closing rank.
**Lead gate:** results dikhane se pehle phone number lena — but pehle 3 results free dikhaayein, baaki ke liye number. (Pura gate rakhne se bounce badhta hai.)

### 6.5 Study Abroad module
- Country landing pages: Georgia, Russia, Kazakhstan, Uzbekistan, Philippines, Canada, UK, Australia
- Har country page: universities list, total cost breakdown (tuition + hostel + food + visa + flight), intake months, NMC/NMC-equivalent approval, FMGE passing data, language requirement
- **Country comparison tool** — 3 countries side by side
- Eligibility checker: 12th marks + NEET qualified? + budget → suggested countries
- Process timeline: application → offer letter → visa → departure (visual stepper)
- Document checklist download (PDF, gated by lead form)

---

## 7. TAB 3 — Berojgar Bharat

### 7.1 Home screen
| Section | Content |
|---|---|
| Hero | "Degree ho gayi. Ab kaam." + Free resume builder CTA |
| Live counters | Today's vacancies · Walk-in drives · Hiring partners |
| Job feed | Personalised if profile complete, else location + fresher default |
| Skill courses grid | Digital Marketing, Tally+GST, Spoken English, Interview Prep |
| Sarkari exam alerts | BSSC, SSC, Railway — form dates |

### 7.2 Job listing & filters
- Role / keyword search
- Location + "Work from home" toggle
- Salary range
- Qualification: 10th, 12th, Graduate, Any
- Experience: Fresher, 0–2 yrs, 2+ yrs
- Job type: Full-time, Part-time, Internship
- Industry

**Job card:** Role, company, location, salary range (mandatory — no "negotiable"), qualification, openings count, posted date, Save + Apply.

### 7.3 Job detail & apply flow
Detail: full JD, responsibilities, requirements, company info, interview location/mode, contact person (masked number — Sky-High number masking use karein).

**Apply flow (max 3 taps):**
1. Tap Apply → profile check
2. Profile incomplete → minimal form (name, phone, qualification, city, resume optional)
3. Confirmation + WhatsApp message with interview details

### 7.4 Resume builder
3-step form → 2 template options → PDF download. Free, no gate — ye acquisition tool hai.
Data profile me save ho, aage ke applications me auto-fill.

### 7.5 Skill courses
Course detail: syllabus, duration, mode (online/offline Patna centre), fee, certificate, placement assistance claim, batch dates.
Enquiry form → CRM (separate lead type: `skill_course`).

### 7.6 Employer side (Phase 2)
Employer login, post job, view applicants, download resumes. Phase 1 me jobs admin panel se manually add honge.

---

## 8. Shared modules (all tabs)

### 8.1 Search
- Context-aware: current tab ke andar search karta hai, but "Other verticals me results" section bhi dikhata hai
- Autosuggest: colleges, courses, jobs, cities, exams — type badge ke saath
- Recent searches + trending searches
- Zero-result state: "Ye nahi mila. Counsellor se baat karein?" + form

### 8.2 Lead capture form (**most important module**)
Ek hi reusable component, har jagah use hoga. Fields:

| Field | Required | Notes |
|---|---|---|
| Name | Yes | |
| Mobile | Yes | 10-digit validation + **OTP verify** |
| WhatsApp same? | Yes | Default checked |
| City / State | Yes | |
| Current qualification | Yes | Dropdown |
| Interest | Auto | Page context se pre-filled |
| Associate referral code | No | Hidden field, URL param se auto-fill |

**Behaviour:**
- OTP verification mandatory — junk leads block karne ke liye
- Submit ke baad: instant WhatsApp confirmation message (WhatsApp Automation Module trigger)
- Duplicate detection: same number 30 din ke andar → existing lead update ho, naya lead na bane, but activity log ho
- Source tracking: UTM params, page URL, tab, device — sab CRM me jaaye

### 8.3 CRM integration (Sky-High)
Ye platform ka lead flow **exactly** Sky-High pipeline se judega. Naya lead system nahi banega.

```
Website/App lead form
   ↓ POST /api/leads (with source metadata)
Sky-High CRM  →  lead status: New
   ↓
Auto-assignment (round robin / vertical-wise team)
   ↓
WhatsApp Automation Module  →  status-wise follow-up cadence
   ↓
Counsellor call (number masking)
   ↓
Status updates flow back → app me student ko "Application status" dikhe
```

**Required:**
- `POST /api/leads` — website → CRM, with `vertical` field (`distance` / `colleges` / `jobs`)
- Webhook: CRM status change → app notification + WhatsApp trigger
- Student login me apni application ka live status dikhe (CRM se read-only)
- Associate referral code lead ke saath attach ho, commission routing ke liye

### 8.4 Counsellor chat
- Entry point: bottom nav + floating button on detail pages
- Phase 1: WhatsApp par redirect (pre-filled message with context: "Amity Online MBA ke baare me jaanna hai")
- Phase 2: in-app chat with AI first-response (WhatsApp AI module ka same logic reuse karein), phir human handoff with mentor number

### 8.5 My Applications
Timeline view per application: Enquiry sent → Counsellor connected → Documents pending → Submitted → Confirmed.
Document upload directly yahan se (Aadhaar, marksheet, photo — CRM dispatch module me jaaye).

### 8.6 Notifications
| Type | Trigger |
|---|---|
| Deadline | Admission last date 7/3/1 din pehle |
| Status | Application status change |
| Job alert | Saved filter par nayi job |
| Counselling | NEET/JEE counselling round dates |
| Exam | Sarkari exam form open |

Push (FCM) + in-app + WhatsApp. User settings me per-type toggle.

### 8.7 Profile
Personal details, qualification, documents vault, saved colleges/jobs, applications, resume, language preference (Hindi/English), notification settings.

---

## 9. Admin panel (CMS)

Developer ko ye **must** banana hai — DCW team ko developer par depend nahi karna chahiye content ke liye.

| Module | Capabilities |
|---|---|
| Colleges | Add/edit/delete, bulk CSV import, course-wise fee, approval doc upload, priority/featured flag |
| Courses | Master list, mapping to colleges |
| Jobs | Add/edit, expiry date, applicant list export |
| Skill courses | Batch dates, fee, enquiry list |
| Banners | Per-tab hero banners, schedule (start/end date) |
| Content/SEO | Page titles, meta descriptions, blog posts, FAQ manager |
| Leads | View, filter, export — but primary source of truth Sky-High hai |
| Users | Student list, activity |
| Reports | Traffic → lead → conversion funnel per vertical |
| Staff roles | Admin, Content Editor, Job Manager, Read-only |

---

## 10. Data model (core tables)

```sql
-- shared
users(id, name, phone, phone_verified, email, city, state, qualification,
      language_pref, created_at, referral_code_used)

leads(id, user_id, vertical, interest_type, interest_id, source_url,
      utm_source, utm_medium, utm_campaign, device, crm_lead_id,
      associate_code, status, created_at)

documents(id, user_id, type, file_url, verified, uploaded_at)

applications(id, user_id, vertical, entity_type, entity_id, crm_lead_id,
             status, timeline_json, created_at)

saved_items(id, user_id, vertical, entity_type, entity_id, created_at)

-- tab 1 + tab 2 (shared table, differentiated by `vertical`)
institutions(id, vertical, name, slug, type, city, state, country,
             logo_url, established, rating, nirf_rank, featured_priority,
             description, is_active)

approvals(id, institution_id, body, grade, valid_till, certificate_url)

courses(id, name, slug, level, stream, duration_months, mode)

institution_courses(id, institution_id, course_id, total_fee, mrp_fee,
                    emi_available, emi_monthly, seats, eligibility,
                    exam_accepted)

cutoffs(id, institution_course_id, year, category, closing_rank, closing_score)

placements(id, institution_id, year, highest_pkg, average_pkg, median_pkg,
           top_recruiters_json)

-- tab 1 specific
boards(id, name, recognition, exam_frequency, result_days, fee, notes)

-- tab 2 specific
countries(id, name, slug, total_cost_min, total_cost_max, intake_months,
          approval_body, fmge_pass_rate, language_req)

-- tab 3
jobs(id, title, company_id, location, wfh, salary_min, salary_max,
     qualification, experience_min, job_type, industry, openings,
     jd_html, expires_on, is_active)

companies(id, name, logo_url, about, is_verified)

job_applications(id, job_id, user_id, resume_url, status, applied_at)

skill_courses(id, title, duration_weeks, mode, fee, syllabus_html,
              placement_support, next_batch_date)

-- content
banners(id, vertical, image_url, title, subtitle, cta_text, cta_link,
        start_date, end_date, priority)

seo_meta(id, page_type, entity_id, title, description, schema_json)
```

**Design note:** Tab 1 aur Tab 2 dono `institutions` table use karte hain with `vertical` column. Isse comparison engine, search aur detail page ka code reuse hota hai. Do alag tables banane ki galti na karein.

---

## 11. API surface (indicative)

```
GET  /api/:vertical/institutions?filters&sort&page
GET  /api/:vertical/institutions/:slug
POST /api/compare                    { ids: [] }
GET  /api/boards/compare
POST /api/tools/rank-predictor       { score, category, state }
POST /api/tools/abroad-eligibility   { marks, neet, budget }
GET  /api/jobs?filters&page
GET  /api/jobs/:id
POST /api/jobs/:id/apply
POST /api/resume/generate            → returns PDF url
POST /api/leads                      → forwards to Sky-High
POST /api/otp/send  |  /api/otp/verify
GET  /api/me/applications
POST /api/me/documents
GET  /api/search?q&vertical
POST /api/webhooks/crm-status        ← from Sky-High
```

---

## 12. Tech stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Web | **Next.js** (App Router) | SSR/SSG zaroori hai — SEO is the whole growth strategy |
| Mobile app | **React Native** (or Next.js PWA in Phase 1) | Web components reuse ho jaayein |
| Backend | Node.js (Next API routes / separate Express) | Team already Node par hai |
| Database | **Supabase (Postgres)** | Existing DCW stack, auth + storage built-in |
| Auth | Supabase Auth + phone OTP (MSG91/Twilio) | |
| Storage | Supabase Storage / Cloudflare R2 | Certificates, logos, resumes |
| Hosting | Vercel (web) | Existing setup |
| Push | Firebase Cloud Messaging | |
| Analytics | GA4 + Meta Pixel + Microsoft Clarity | Ads attribution + heatmaps |
| WhatsApp | Existing Baileys module | Reuse, rebuild nahi |

---

## 13. SEO requirements (non-negotiable)

Ye platform ka growth engine paid ads nahi, organic search hai. Isliye:

1. **Server-side rendered** — har college, course, job, country page crawlable ho
2. **URL structure:**
   - `/distance/university/amity-online`
   - `/distance/board/nios-vs-bosse`
   - `/colleges/mbbs/government-medical-college-patna`
   - `/colleges/study-abroad/georgia`
   - `/jobs/field-sales-executive-patna`
3. **Schema markup:** Organization, EducationalOrganization, Course, JobPosting, FAQPage, BreadcrumbList
4. **JobPosting schema mandatory** — Google for Jobs me free listing milti hai
5. Auto-generated sitemaps per vertical, updated daily
6. Every listing page: unique H1, meta title, meta description (admin editable, with sensible auto-fallback)
7. Programmatic pages: "MBBS in Georgia fees", "NIOS admission last date 2026" — template-driven, content admin se
8. Core Web Vitals: LCP < 2.5s, CLS < 0.1, image lazy loading + next/image
9. Hindi versions of top 50 pages with `hreflang`

---

## 14. Non-functional requirements

**Performance:** Mobile-first, 4G par test karein. Initial JS bundle < 200KB gzipped. Listing pages me pagination/infinite scroll — 20 items per load.

**Responsive:** 360px se 1440px. Design mobile par pehle bane — 85%+ traffic mobile hoga.

**Accessibility:** Keyboard focus visible, alt text, colour contrast AA, `prefers-reduced-motion` respected.

**Security:** OTP rate limiting, form CAPTCHA (invisible), document uploads private bucket + signed URLs, phone numbers masked in job/college listings, RLS policies on Supabase.

**Data:** Daily DB backup. Lead data 3 saal retention. Privacy policy + consent checkbox on forms.

**Browser support:** Chrome/Safari last 2 versions, Android Chrome (primary), iOS Safari.

---

## 15. Phasing

### Phase 1 — Foundation (6–8 weeks)
- Tab shell + theme switching + bottom nav
- Tab 1 complete: listing, filters, detail, board comparison, compare engine
- Lead form + OTP + Sky-High integration
- Admin panel: institutions, courses, banners, SEO
- SEO foundation: SSR, sitemaps, schema
- Web only (responsive)

### Phase 2 — Expansion (5–6 weeks)
- Tab 2 complete: regular colleges, medical, study abroad, rank predictor, ROI calculator
- Cutoff + placement data modules
- My Applications + document upload
- Notifications (in-app + WhatsApp)

### Phase 3 — Placement (4–5 weeks)
- Tab 3 complete: jobs, filters, apply flow, resume builder, skill courses
- Job alerts + saved searches
- JobPosting schema + Google for Jobs

### Phase 4 — App & scale (5–6 weeks)
- React Native app (iOS + Android)
- In-app AI counsellor chat
- Employer portal
- Payment gateway
- Hindi localisation

---

## 16. Acceptance criteria (sample — Phase 1)

| # | Criterion |
|---|---|
| 1 | Teeno tabs par click karne se theme colour, search placeholder, category set aur content change hota hai; page reload nahi hota; URL update hota hai |
| 2 | Distance listing page par 4+ filters simultaneously apply ho sakte hain, result 1s ke andar update ho |
| 3 | Compare me max 3 items add ho sakte hain, tray dikhe, comparison table me differences highlighted hon |
| 4 | Lead form submit karne par OTP aaye, verify ho, Sky-High CRM me lead 5 second ke andar dikhe with correct `vertical` + UTM data |
| 5 | Duplicate number 30 din me submit ho to naya lead na bane, existing lead par activity log ho |
| 6 | Associate referral link se aane wale lead me referral code attach ho |
| 7 | College detail page ka HTML source me content dikhe (view-source test) — SEO ke liye |
| 8 | Admin panel se naya college add karne par 60 second me live site par dikhe, sitemap me aaye |
| 9 | Mobile 360px par koi horizontal scroll na ho, LCP 4G par < 2.5s |
| 10 | Approval certificate images detail page par zoom ho sakein |

---

## 17. Open questions for DCW (developer ko answer chahiye)

1. **Fee data source** — colleges ki fee manually enter hogi ya kisi aggregator/API se? Kitne colleges Phase 1 me? (Isse admin panel ka bulk-import design decide hoga.)
2. **Number masking** — Sky-High ka existing masking system reuse hoga ya naya provider?
3. **Cutoff data** — last 3 years ka NEET/JEE cutoff data kahan se aayega? Manual entry ka effort bada hai.
4. **Jobs supply** — Phase 1 me jobs kaun laayega? Manual posting, ya kisi job board se scraping/partnership?
5. **App vs PWA** — Phase 1 me native app zaroori hai ya PWA se kaam chalega? (PWA se 5–6 weeks bachte hain.)
6. **Existing DCW website** — migrate karni hai ya ye alag platform rahega? Domain strategy kya hai?
7. **CareerOptics project** — ye alag product rahega ya isme merge hoga? (Overlap significant hai.)
8. **Budget/timeline constraint** — Phase 1 ka hard deadline kya hai? CBSE result window target karna hai?

---

## Appendix A — Prototype reference
Clickable layout prototype separately share kiya gaya hai (`dcw-superapp-prototype.jsx`). Usme tab switching, theme change, card structure, compare tray aur bottom nav ka working demo hai. **Prototype ka saara data demo hai** — fees, ranks, salaries placeholder hain, replace karni hongi.

Prototype visual direction dikhata hai, final design nahi. Developer isse layout aur interaction pattern samjhe; actual design system Phase 1 me finalise hoga.
