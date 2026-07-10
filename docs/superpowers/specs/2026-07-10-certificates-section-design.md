# Certificates Section Design
**Date:** 2026-07-10
**Status:** Approved
**Approach:** New `/certificates` page. Certificates are auto-fetched server-side at request/revalidation time from Credly and Platzi's public (undocumented) APIs — no manual data entry, no separate backend service.

---

## 1. Goal

Add a certificates section to the portfolio, sourced initially from Credly and Platzi, with room to add other official tech-provider certificates (AWS, Google Cloud, Microsoft Learn, etc.) later without a redesign.

---

## 2. Rejected Approaches (and why)

| Approach | Why rejected |
|---|---|
| Manual data file only (like `projects.ts`) for all providers | Credly and Platzi both expose usable data endpoints — manual entry would mean re-typing certificates that are already available programmatically. Kept only as a fallback for providers with no API. |
| Standalone FastAPI microservice (own repo, DB, weekly scraper, hosted on Railway/Supabase) | Explicitly rejected by the user — too much infrastructure for what the data sources already support directly. Railway also turned out to have no real permanent free tier (30-day trial credit, then $1–5/mo minimum). |
| Client-side fetch from the browser directly to Credly/Platzi | Blocked by CORS, confirmed empirically: Credly's `badges.json` returns no `access-control-allow-origin` header at all (browsers block cross-origin reads by default). Platzi's diplomas API returns `access-control-allow-origin: https://platzi.com` unconditionally, regardless of the requesting origin. Both must be fetched server-side. |
| Scraping Platzi's public profile HTML page | The HTML page (`platzi.com/p/<user>/`) sits behind Cloudflare bot protection and returned HTTP 403 to plain server-side requests (`curl`, and by extension Next.js's server `fetch()`) in testing. Superseded once the real Platzi diplomas JSON API was found (see §3.2) — that endpoint is not behind the same block. |

---

## 3. Data Model

```ts
// src/data/certificates.ts (or src/lib/certificates.ts — types only)
export type CertificateProvider = 'credly' | 'platzi' | string; // open for future providers

export interface Certificate {
  id: string;
  title: string;
  issuer: string;              // e.g. "Microsoft Americas Azure Team", "Platzi"
  provider: CertificateProvider;
  date: string;                 // ISO 8601
  url: string;                  // verification / diploma link
  image?: string;                // badge image URL
}
```

---

## 4. Data Sources

All fetching happens server-side, inside the `/certificates` Server Component, at request/revalidation time (see §6). No data is fetched from the browser.

### 4.1 Credly — `src/lib/credly.ts`

```ts
export async function getCredlyBadges(username: string): Promise<Certificate[]>
```

- `GET https://www.credly.com/users/${username}/badges.json`
- Confirmed working with a plain `fetch()`, no special headers needed.
- Maps each entry in `data[]`:
  - `title` ← `badge_template.name`
  - `issuer` ← `issuer.summary` (fallback: first `issuer.entities[].entity.name`)
  - `date` ← `issued_at_date`
  - `url` ← `https://www.credly.com/badges/${id}`
  - `image` ← `badge_template.image` URL
  - `provider` ← `'credly'`
- Username for this site: `andres-lopez.e11df47d`.

### 4.2 Platzi — `src/lib/platzi.ts`

```ts
export async function getPlatziDiplomas(username: string): Promise<Certificate[]>
```

- `GET https://api.platzi.com/students/v1/diplomas/${username}/?page=1&page_size=100`
- Confirmed working, but **requires** these headers or Cloudflare returns the generic homepage HTML instead of JSON:
  - `Referer: https://platzi.com/p/${username}/`
  - `Origin: https://platzi.com`
  - A realistic browser `User-Agent`
- `page_size=100` retrieves all courses in one request (tested: 66 courses, 1 request — no pagination loop needed at this account's scale). If a profile ever exceeds 100 courses, this will silently return only the first 100; acceptable for now, not worth a pagination loop for a personal portfolio.
- Maps each entry in `data.courses[]`:
  - `title` ← `title`
  - `issuer` ← `'Platzi'` (constant)
  - `date` ← `diploma.approved_date`
  - `url` ← `diploma.diploma_url`
  - `image` ← `badge_url`
  - `provider` ← `'platzi'`
- Username for this site: `ing.ratosocial`.

### 4.3 Manual fallback — `src/data/certificates.ts`

- Exported array `manualCertificates: Certificate[]`, same spirit as `src/data/projects.ts`.
- Empty by default. Reserved for future official-provider certificates with no public API (AWS, Google Cloud, Microsoft Learn, etc.) — add entries by hand, same shape as the auto-fetched ones.

---

## 5. Combining & Resilience

In `src/app/certificates/page.tsx`:

```ts
const [credly, platzi] = await Promise.all([
  getCredlyBadges('andres-lopez.e11df47d'),
  getPlatziDiplomas('ing.ratosocial'),
]);
const all = [...credly, ...platzi, ...manualCertificates]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

Both `getCredlyBadges` and `getPlatziDiplomas` are individually wrapped in `try/catch` **inside their own module**, not at the call site:
- On any fetch/parse failure: `console.warn(...)` with the provider name and error, return `[]`.
- Rationale: these are undocumented/unofficial endpoints that could change shape or start blocking without notice. A failure in one provider must never take down the page, break the build, or hide the other provider's certificates.

---

## 6. Freshness — ISR

The site runs on Vercel with full Next.js SSR (confirmed: no `output: 'export'` in `next.config.ts`, and the repo already migrated from GitHub Pages to Vercel per commit `053d51d`).

```ts
// src/app/certificates/page.tsx
export const revalidate = 3600; // 1 hour
```

Vercel regenerates the page in the background on the first request after the window expires. No GitHub Actions cron, no scheduled workflow, no extra infrastructure. At ~3 new certificates/week, a 1-hour window keeps staleness effectively unnoticeable.

---

## 7. UI

### `src/components/CertificatesPage.tsx` (client component)
Mirrors `RepositoriesPage.tsx`:
- Search input, filtering by `title` and `issuer`.
- Provider filter pills, derived dynamically from the certificates actually present (`[...new Set(certificates.map(c => c.provider))]`) — adding a new provider later requires zero UI changes.
- Sort select: Newest / Oldest / Name.
- Responsive grid of `CertificateCard`.

### `src/components/CertificateCard.tsx`
Mirrors `RepositoryCard.tsx` visual style (glass card):
- Badge/diploma image (`image`), with a generic provider-icon fallback if missing.
- Title, issuer, formatted date.
- Provider pill/badge.
- "Ver certificado" CTA linking to `url`, opens in a new tab.

### Navbar (`src/components/Navbar.tsx`)
- Add `{ name: 'Certificates', href: '/certificates' }` to `navItems`.

---

## 8. Files Changed / Created

| File | Action |
|---|---|
| `src/app/certificates/page.tsx` | Create — server component, fetches + combines + sorts, `revalidate = 3600` |
| `src/components/CertificatesPage.tsx` | Create — search/filter/sort/grid client component |
| `src/components/CertificateCard.tsx` | Create — certificate card |
| `src/lib/credly.ts` | Create — Credly fetcher |
| `src/lib/platzi.ts` | Create — Platzi fetcher |
| `src/data/certificates.ts` | Create — `Certificate`/`CertificateProvider` types + empty `manualCertificates[]` |
| `src/components/Navbar.tsx` | Update — add "Certificates" nav item |

---

## 9. Out of Scope

- Standalone backend service / microservice for certificates (explicitly rejected).
- Multi-user support (this remains a single personal-site feature; usernames are hardcoded call-site arguments, matching the existing `getRepositories('afelopez')` convention).
- Self-hosting/downloading badge images — hotlinked directly from each provider's CDN.
- Client-side data fetching (blocked by CORS on both providers, confirmed).
- A pagination loop for Platzi beyond 100 courses.

---

## 10. Open Risk

Both `credly.ts` and `platzi.ts` depend on unofficial/undocumented endpoints (Credly's `badges.json` is not publicly documented API; Platzi's `diplomas` endpoint required reverse-engineered headers). Either provider could change response shape or add stricter bot protection without notice. Mitigated by the try/catch-and-warn resilience in §5, but worth a periodic manual check if the Certificates section ever appears empty.
