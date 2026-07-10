# Certificates Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/certificates` page that auto-fetches and displays certificates from Credly and Platzi, refreshed hourly via ISR, with search/filter/sort — matching the existing `/repositories` page pattern.

**Architecture:** Two server-only fetcher modules (`src/lib/credly.ts`, `src/lib/platzi.ts`) each call a provider's public JSON endpoint and normalize the result into a shared `Certificate` shape. The `/certificates` server component calls both in parallel, merges with an empty manual-entry fallback array, sorts by date, and passes the combined list to a client component that mirrors `RepositoriesPage.tsx`'s search/filter/sort/grid UI.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion. No test framework exists in this repo — verification is via `tsc --noEmit`, `npm run lint`, standalone `tsx` smoke scripts for the two fetchers, and `curl`-based checks of server-rendered HTML.

## Global Constraints

- Follow the design in `docs/superpowers/specs/2026-07-10-certificates-section-design.md` exactly — endpoints, headers, and field mappings are copied from real, tested API responses (see spec §4).
- No new UI test framework — this repo has none (`package.json` scripts are only `dev`/`build`/`lint`); verification uses `tsc --noEmit`, `npm run lint`, and manual/curl checks, matching how `RepositoriesPage.tsx`/`FeaturedProjects.tsx` were built.
- No client-side fetching to Credly or Platzi — both are blocked by CORS (spec §2). All fetching happens server-side in `src/lib/*.ts` and `src/app/certificates/page.tsx`.
- Each fetcher (`getCredlyBadges`, `getPlatziDiplomas`) must never throw — wrap in `try/catch`, `console.warn` on failure, return `[]` (spec §5).
- Badge/diploma images are hotlinked directly from the provider's CDN via a plain `<img>` tag — no `next/image`, no `next.config.ts` changes (spec §9).
- `export const revalidate = 3600;` on the certificates route — no cron, no scheduled workflow (spec §6).
- Match existing visual conventions exactly: `glass` utility class, card layout/animation from `RepositoryCard.tsx`, controls layout from `RepositoriesPage.tsx`.

---

### Task 1: Certificate data model

**Files:**
- Create: `src/data/certificates.ts`

**Interfaces:**
- Produces: `Certificate` interface (`id: string`, `title: string`, `issuer: string`, `provider: CertificateProvider`, `date: string`, `url: string`, `image?: string`), `CertificateProvider` type, `manualCertificates: Certificate[]`, `providerLabel(provider: string): string`.

- [ ] **Step 1: Write the data model file**

```ts
// src/data/certificates.ts

export type CertificateProvider = 'credly' | 'platzi' | string;

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  provider: CertificateProvider;
  /** ISO 8601 date string */
  date: string;
  /** Verification / diploma URL */
  url: string;
  /** Badge or diploma image URL */
  image?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  credly: 'Credly',
  platzi: 'Platzi',
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Certificates from providers with no public API go here by hand.
// Same shape as the auto-fetched ones (see src/lib/credly.ts, src/lib/platzi.ts).
// ─────────────────────────────────────────────────────────────────────────────
export const manualCertificates: Certificate[] = [];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/data/certificates.ts
git commit -m "feat: add Certificate data model"
```

---

### Task 2: Credly fetcher

**Files:**
- Create: `src/lib/credly.ts`
- Create: `scripts/verify-credly.ts`
- Modify: `package.json` (add `verify:credly` script, add `tsx` devDependency)

**Interfaces:**
- Consumes: `Certificate` from `../data/certificates` (Task 1).
- Produces: `getCredlyBadges(username: string): Promise<Certificate[]>`.

- [ ] **Step 1: Install `tsx` for standalone script execution**

```bash
npm install --save-dev tsx
```

- [ ] **Step 2: Write `src/lib/credly.ts`**

```ts
// src/lib/credly.ts
import { Certificate } from '../data/certificates';

interface CredlyBadge {
  id: string;
  issued_at_date: string;
  issuer?: {
    summary?: string;
  };
  badge_template: {
    name: string;
    image?: { url?: string };
  };
}

interface CredlyResponse {
  data: CredlyBadge[];
}

export async function getCredlyBadges(username: string): Promise<Certificate[]> {
  try {
    const res = await fetch(`https://www.credly.com/users/${username}/badges.json`);
    if (!res.ok) {
      throw new Error(`Credly responded with ${res.status}`);
    }
    const { data }: CredlyResponse = await res.json();

    return data.map((badge) => ({
      id: badge.id,
      title: badge.badge_template.name,
      issuer: (badge.issuer?.summary ?? 'Credly').replace(/^issued by\s+/i, ''),
      provider: 'credly',
      date: badge.issued_at_date,
      url: `https://www.credly.com/badges/${badge.id}`,
      image: badge.badge_template.image?.url,
    }));
  } catch (err) {
    console.warn(`[certificates] Failed to fetch Credly badges for "${username}":`, err);
    return [];
  }
}
```

- [ ] **Step 3: Write the verification script**

```ts
// scripts/verify-credly.ts
import { getCredlyBadges } from '../src/lib/credly';

const username = process.argv[2] ?? 'andres-lopez.e11df47d';

getCredlyBadges(username).then((certs) => {
  console.log(`Fetched ${certs.length} Credly certificate(s) for "${username}"`);
  console.log(JSON.stringify(certs, null, 2));
  if (certs.length === 0) {
    console.error('No certificates returned — check the Credly endpoint or username.');
    process.exit(1);
  }
});
```

- [ ] **Step 4: Add the npm script**

In `package.json`, add to `"scripts"`:

```json
"verify:credly": "tsx scripts/verify-credly.ts"
```

- [ ] **Step 5: Run it against the real account**

Run: `npm run verify:credly`
Expected: `Fetched N Credly certificate(s) for "andres-lopez.e11df47d"` where N > 0, followed by a JSON array where every entry has non-empty `title`, `issuer`, `date` (format `YYYY-MM-DD`), and `url` starting with `https://www.credly.com/badges/`.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/credly.ts scripts/verify-credly.ts package.json package-lock.json
git commit -m "feat: add Credly badge fetcher"
```

---

### Task 3: Platzi fetcher

**Files:**
- Create: `src/lib/platzi.ts`
- Create: `scripts/verify-platzi.ts`
- Modify: `package.json` (add `verify:platzi` script)

**Interfaces:**
- Consumes: `Certificate` from `../data/certificates` (Task 1).
- Produces: `getPlatziDiplomas(username: string): Promise<Certificate[]>`.

- [ ] **Step 1: Write `src/lib/platzi.ts`**

```ts
// src/lib/platzi.ts
import { Certificate } from '../data/certificates';

interface PlatziCourse {
  id: number;
  title: string;
  badge_url?: string;
  diploma: {
    diploma_url: string;
    approved_date: string;
  };
}

interface PlatziResponse {
  data: {
    courses: PlatziCourse[];
  };
}

export async function getPlatziDiplomas(username: string): Promise<Certificate[]> {
  try {
    const res = await fetch(
      `https://api.platzi.com/students/v1/diplomas/${username}/?page=1&page_size=100`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: `https://platzi.com/p/${username}/`,
          Origin: 'https://platzi.com',
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Platzi responded with ${res.status}`);
    }
    const { data }: PlatziResponse = await res.json();

    return data.courses.map((course) => ({
      id: `platzi-${course.id}`,
      title: course.title,
      issuer: 'Platzi',
      provider: 'platzi',
      date: course.diploma.approved_date,
      url: course.diploma.diploma_url,
      image: course.badge_url,
    }));
  } catch (err) {
    console.warn(`[certificates] Failed to fetch Platzi diplomas for "${username}":`, err);
    return [];
  }
}
```

- [ ] **Step 2: Write the verification script**

```ts
// scripts/verify-platzi.ts
import { getPlatziDiplomas } from '../src/lib/platzi';

const username = process.argv[2] ?? 'ing.ratosocial';

getPlatziDiplomas(username).then((certs) => {
  console.log(`Fetched ${certs.length} Platzi certificate(s) for "${username}"`);
  console.log(JSON.stringify(certs.slice(0, 3), null, 2));
  if (certs.length === 0) {
    console.error('No certificates returned — check the Platzi endpoint, headers, or username.');
    process.exit(1);
  }
});
```

- [ ] **Step 3: Add the npm script**

In `package.json`, add to `"scripts"`:

```json
"verify:platzi": "tsx scripts/verify-platzi.ts"
```

- [ ] **Step 4: Run it against the real account**

Run: `npm run verify:platzi`
Expected: `Fetched N Platzi certificate(s) for "ing.ratosocial"` where N > 0 (66 at spec-writing time, will grow over time), followed by a JSON preview where every entry has non-empty `title`, `issuer: "Platzi"`, `date` (ISO datetime), and `url` starting with `https://platzi.com/p/ing.ratosocial/curso/`.

If instead you see 0 results or an error, check the response body — Cloudflare returns Platzi's homepage HTML instead of JSON when the `Referer`/`Origin`/`User-Agent` headers don't match what's in this file; re-verify those header values against spec §4.2.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/platzi.ts scripts/verify-platzi.ts package.json
git commit -m "feat: add Platzi diploma fetcher"
```

---

### Task 4: CertificateCard component

**Files:**
- Create: `src/components/CertificateCard.tsx`

**Interfaces:**
- Consumes: `Certificate`, `providerLabel` from `@/data/certificates` (Task 1).
- Produces: default export `CertificateCard({ certificate, index }: { certificate: Certificate; index: number })`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/CertificateCard.tsx
'use client';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';

export default function CertificateCard({ certificate, index }: { certificate: Certificate; index: number }) {
  const formattedDate = new Date(certificate.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
      className="glass rounded-xl p-6 flex flex-col justify-between"
    >
      <div className="flex items-start gap-4">
        {certificate.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={certificate.image}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg bg-white/40 object-contain p-1 dark:bg-gray-900/40"
            loading="lazy"
          />
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{certificate.title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{certificate.issuer}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-700">
            {providerLabel(certificate.provider)}
          </span>
          <span>{formattedDate}</span>
        </div>
        <a
          href={certificate.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 px-4 py-2 text-sm font-semibold text-blue-600 backdrop-blur-sm transition-colors hover:bg-blue-600/25 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          Ver certificado
        </a>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit code 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CertificateCard.tsx
git commit -m "feat: add CertificateCard component"
```

---

### Task 5: CertificatesPage component (search, filter, sort, grid)

**Files:**
- Create: `src/components/CertificatesPage.tsx`

**Interfaces:**
- Consumes: `Certificate`, `providerLabel` from `@/data/certificates` (Task 1); `CertificateCard` from `@/components/CertificateCard` (Task 4).
- Produces: default export `CertificatesPage({ certificates }: { certificates: Certificate[] })`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/CertificatesPage.tsx
'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
import CertificateCard from './CertificateCard';

type SortKey = 'newest' | 'oldest' | 'name';

export default function CertificatesPage({ certificates }: { certificates: Certificate[] }) {
  const [search, setSearch] = useState('');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('newest');

  const providers = useMemo(() => {
    return [...new Set(certificates.map((c) => c.provider))];
  }, [certificates]);

  const filtered = useMemo(() => {
    let list = certificates.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.issuer.toLowerCase().includes(search.toLowerCase());
      const matchProvider = !activeProvider || c.provider === activeProvider;
      return matchSearch && matchProvider;
    });

    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sort === 'name') list = [...list].sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [certificates, search, activeProvider, sort]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Certificates</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {certificates.length} certificates · {filtered.length} shown
        </p>
      </div>

      {/* Controls */}
      <div className="glass mb-8 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search certificates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Provider filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveProvider(null)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeProvider === null
              ? 'bg-blue-600 text-white'
              : 'glass text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
          }`}
        >
          All
        </button>
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => setActiveProvider(provider === activeProvider ? null : provider)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeProvider === provider
                ? 'bg-blue-600 text-white'
                : 'glass text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
            }`}
          >
            {providerLabel(provider)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-gray-500 dark:text-gray-400">No certificates match your filters.</p>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((certificate, i) => (
            <CertificateCard key={certificate.id} certificate={certificate} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit code 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CertificatesPage.tsx
git commit -m "feat: add CertificatesPage search/filter/sort component"
```

---

### Task 6: `/certificates` route with ISR

**Files:**
- Create: `src/app/certificates/page.tsx`

**Interfaces:**
- Consumes: `getCredlyBadges` from `@/lib/credly` (Task 2), `getPlatziDiplomas` from `@/lib/platzi` (Task 3), `manualCertificates` from `@/data/certificates` (Task 1), `CertificatesPage` from `@/components/CertificatesPage` (Task 5).

- [ ] **Step 1: Write the route**

```tsx
// src/app/certificates/page.tsx
import { getCredlyBadges } from '@/lib/credly';
import { getPlatziDiplomas } from '@/lib/platzi';
import { manualCertificates } from '@/data/certificates';
import CertificatesPage from '@/components/CertificatesPage';

export const revalidate = 3600;

export default async function Page() {
  const [credly, platzi] = await Promise.all([
    getCredlyBadges('andres-lopez.e11df47d'),
    getPlatziDiplomas('ing.ratosocial'),
  ]);

  const certificates = [...credly, ...platzi, ...manualCertificates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return <CertificatesPage certificates={certificates} />;
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit code 0 with no errors.

- [ ] **Step 3: Start the dev server and verify server-rendered data**

Run: `npm run dev &` then wait a few seconds for it to boot, then:

```bash
curl -s http://localhost:3000/certificates -o /tmp/certificates-page.html
grep -c "glass" /tmp/certificates-page.html
grep -o 'Ver certificado' /tmp/certificates-page.html | head -1
grep -o 'Platzi' /tmp/certificates-page.html | head -1
```

Expected: the `glass` grep count is greater than 0, `Ver certificado` appears at least once, and `Platzi` appears at least once — confirming the server component actually fetched real data and rendered certificate cards (not an empty state).

Stop the dev server afterward: `kill %1` (or find and kill the `next dev` process).

- [ ] **Step 4: Commit**

```bash
git add src/app/certificates/page.tsx
git commit -m "feat: add /certificates route with hourly ISR"
```

---

### Task 7: Navbar link

**Files:**
- Modify: `src/components/Navbar.tsx:9-13`

**Interfaces:**
- None — this task only adds a nav entry to an existing array; no new exports.

- [ ] **Step 1: Add the nav item**

In `src/components/Navbar.tsx`, change:

```tsx
const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/#projects' },
  { name: 'Repositories', href: '/repositories' },
];
```

to:

```tsx
const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/#projects' },
  { name: 'Repositories', href: '/repositories' },
  { name: 'Certificates', href: '/certificates' },
];
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit code 0 with no errors.

- [ ] **Step 3: Verify the link renders on the home page**

Run: `npm run dev &`, wait for boot, then:

```bash
curl -s http://localhost:3000/ -o /tmp/home-page.html
grep -o 'href="/certificates"' /tmp/home-page.html
grep -o '>Certificates<' /tmp/home-page.html
```

Expected: both greps return a match.

Stop the dev server afterward: `kill %1`.

- [ ] **Step 4: Full build check**

Run: `npm run build`
Expected: build completes successfully (exit code 0), with `/certificates` listed in the route output.

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add Certificates link to Navbar"
```

---

## Final Manual QA (do this after Task 7, in a real browser)

1. `npm run dev`, open `http://localhost:3000/`.
2. Click "Certificates" in the navbar — confirm it navigates to `/certificates`.
3. Confirm real Credly badge(s) and real Platzi diploma(s) render as cards with images, titles, issuers, dates, and working "Ver certificado" links (open in a new tab, land on the actual provider page).
4. Type into the search box — confirm the grid filters live by title/issuer.
5. Click a provider pill — confirm the grid filters to only that provider, and click it again to confirm it toggles back to "All".
6. Change the sort dropdown between Newest/Oldest/Name — confirm the order changes accordingly.
7. Toggle dark mode (if applicable via `ModeToggle`) — confirm the certificates page looks correct in both themes.
