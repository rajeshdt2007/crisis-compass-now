
# Disaster Relief Resource Management Platform

A single Lovable project hosting two distinct experiences:
- **User site** (`/`) — colorful, animated, citizen-facing
- **Server/NGO dashboard** (`/admin`) — data-dense ops console

Both share one Lovable Cloud backend so SOS alerts flow live from user → server.

---

## Tech & backend

- **Lovable Cloud** (Supabase under the hood) as primary database, auth, storage, realtime
- **Google Sign-in** (via Lovable broker) + name-only signup; **location permission required** before continuing
- **Google Sheets mirror**: server function writes every new user + SOS event to a Google Sheet (via Google Sheets connector) so you can view/export there
- **OpenStreetMap Overpass API** for nearby NGOs, hospitals, rescue centers (free, no key)
- **Leaflet** for maps (lightweight, free tiles)
- **Recharts** for pie/bar charts
- **Framer Motion + custom CSS** for water-ripple, wave, and glass animations

---

## User site (`/`)

**Auth & onboarding**
1. Landing → "Continue with Google" (only Google + name field; password-less)
2. Browser prompts for **location permission** — blocked until granted
3. Profile form: name, phone, **vulnerability flags** (pregnant woman, child, minor, elderly, physically disabled) — stored on profile

**Main app (after login)**
- **Big animated SOS button** (pulsing water-ripple effect) → one tap creates an `sos_alerts` row with geolocation + vulnerability flags → instantly visible on server dashboard via Supabase realtime
- **Nearest help panel** (background-analyzed): pulls hospitals, rescue centers, police, shelters from Overpass API based on user's coords, sorted by distance
- **NGO explore page**: list + map of nearby NGOs with profile cards
- **Donation portal**: per-NGO donation page (UI prototype; payment integration optional later)
- **WHO disaster guidance**: curated list of WHO-prescribed actions per disaster type (flood, earthquake, cyclone, landslide) with illustrated cards
- **Missing person report**: form with photo upload (Lovable Cloud Storage), name, last seen, age, description, contact → stored in `missing_persons` table, visible to server side
- **Visual style**: vibrant gradients, glassmorphism cards, water-wave SVG dividers, ripple animations on tap, smooth page transitions — inspired by imohealth.com & apple.com

---

## Server/NGO dashboard (`/admin`)

Separate login (role-gated via `user_roles` table; `admin` role required).

**Live operations**
- **Realtime SOS feed**: incoming alerts pop in with sound + toast; map shows all active SOS pins colored by vulnerability (red = pregnant/child/disabled, orange = standard)
- **Alert detail drawer**: user info, location, nearest NGO + gov org auto-matched (Overpass query), one-click "Notify" button (logs notification; can wire email/SMS later)

**Analytics (Recharts)**
- **Pie**: people rescued by category
- **Bar**: health kits / food kits / water supply distributed per day
- **Stats cards**: active NGOs working, total alerts today, response time avg
- **Resource levels**: water supply gauge, kit inventory bars

**Ambulance fleet (Uber-style prototype)**
- Map with ~15 simulated ambulances moving on real roads (interpolated routes)
- Dispatch panel: pick SOS alert → assign nearest available ambulance → live ETA
- Status: available / en-route / on-scene / returning

**Missing persons board**
- Grid of uploaded photos with filter/search

**Visual style**: dark professional theme, dense data, monospace numerics, subtle motion.

---

## Database schema (Lovable Cloud)

- `profiles` — user_id, name, phone, lat, lng, vulnerability flags
- `user_roles` — user_id, role (`user` | `admin` | `ngo`) — separate table per security best practice
- `sos_alerts` — id, user_id, lat, lng, status, vulnerability_snapshot, created_at
- `ngos` — seeded + Overpass-discovered
- `notifications` — alert_id, ngo_id, sent_at, channel
- `missing_persons` — reporter_id, photo_url, name, last_seen_lat/lng, description
- `resource_distributions` — type (health/food/water), quantity, ngo_id, date
- `ambulances` — id, lat, lng, status, assigned_alert_id (seeded + simulated)
- `rescues` — alert_id, category, count, date

RLS: users read/write own data; admins read all via `has_role()` security-definer function.

---

## Google Sheets mirror

- Connect Google Sheets via Lovable connector (one-time OAuth)
- Server function on `sos_alerts` insert + `profiles` insert appends rows to your sheet
- Sheet URL surfaced in admin settings page

---

## Build order

1. Enable Lovable Cloud + schema + RLS + roles
2. Auth (Google + name + location gate) + user profile
3. User site UI: SOS, nearby help, NGO explore, WHO guidance, donation, missing person, vulnerability flags
4. Admin shell + role gate + realtime SOS feed + map
5. Charts + resource analytics
6. Ambulance simulation + dispatch
7. Google Sheets connector + mirror function
8. Polish: water animations, gradients, transitions

---

## Notes / trade-offs

- **Notifications to NGOs**: dashboard alert + logged notification record in v1. Real SMS/email needs a provider (Twilio/Resend) — can add later with one secret.
- **Ambulances are simulated** — real fleet would need a driver app.
- **Donation portal is UI-only** in v1 — Stripe can be added when you're ready.
- **Two "sites" share one codebase + domain** (`/` and `/admin`). True separate domains can be configured post-publish.

Ready to build on approval.
