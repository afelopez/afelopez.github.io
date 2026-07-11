# List Pages Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish `/projects`, `/certificates`, `/repositories`, and the home `Profile` card — declutter headers, compact the search/sort controls via a shared `SearchInput`, color-code repository language tags, tighten the Projects layout, cap repository description length, and fix two coherence gaps found in `Profile.tsx` during design review.

**Architecture:** Two new shared primitives (`languageColors.ts`, `SearchInput.tsx`) land first since three later tasks depend on them. Then each page/component gets its own task so a reviewer can independently approve or reject each — they're different kinds of edits (layout restructure, color/spacing fixes, control compacting), not repetitions of the same mechanical change.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion. No new dependencies.

## Global Constraints

- Search input padding is exactly half the original: `py-2` → `py-1` (confirmed explicitly by the user as a literal 50%, not a "half but not below comfortable touch target" compromise this plan's spec initially proposed).
- Sort `<select>` padding matches the new compact search input: `px-4 py-2` → `px-3 py-1`, on both `/certificates` and `/repositories`.
- Controls `.glass` wrapper: `p-4` → `p-3` on both list pages.
- Count subtitles ("N certificates", "N public repos") are removed entirely from `/certificates` and `/repositories` headers — not just the conditional "shown" part, the whole `<p>`.
- Page header block margin standardized to `mb-8` across `/projects`, `/certificates`, `/repositories` (was `mb-10` on all three).
- `LANG_COLORS` (language brand-color map) moves from `RepositoriesPage.tsx` to a new shared `src/lib/languageColors.ts` — values unchanged, these are per-language brand colors (e.g. TypeScript's actual blue), not the site's teal UI accent, and are intentionally untouched.
- No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>` (the unscoped `npm run lint` has ~12,733 pre-existing, unrelated problems confirmed in prior work on this repo — do not use it as a gate), `npm run build`, and `curl`/`grep` checks against server-rendered HTML.
- Out of scope: `NodeBackground.tsx`'s color palette, the pagination controls on `/certificates`, `Navbar.tsx` (all reviewed during design, no gaps found there).

---

### Task 1: Shared primitives — `languageColors.ts` + `SearchInput.tsx`

**Files:**
- Create: `src/lib/languageColors.ts`
- Create: `src/components/SearchInput.tsx`

**Interfaces:**
- Produces: `LANG_COLORS: Record<string, string>` from `src/lib/languageColors.ts`.
- Produces: default export `SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string })` from `src/components/SearchInput.tsx`.

- [ ] **Step 1: Create the shared language color map**

```ts
// src/lib/languageColors.ts
export const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python:     'bg-green-500',
  Ruby:       'bg-red-500',
  Go:         'bg-cyan-500',
  Rust:       'bg-orange-600',
  Java:       'bg-orange-400',
  CSS:        'bg-purple-500',
  HTML:       'bg-orange-500',
  Shell:      'bg-gray-500',
};
```

- [ ] **Step 2: Create the shared search input**

```tsx
// src/components/SearchInput.tsx
'use client';

export default function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white/60 py-1 pl-9 pr-3 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/lib/languageColors.ts src/components/SearchInput.tsx`
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/lib/languageColors.ts src/components/SearchInput.tsx
git commit -m "feat: add shared languageColors map and SearchInput component"
```

---

### Task 2: `RepositoriesPage.tsx` + `RepositoryCard.tsx`

**Files:**
- Modify: `src/components/RepositoriesPage.tsx`
- Modify: `src/components/RepositoryCard.tsx`

**Interfaces:**
- Consumes: `LANG_COLORS` from `@/lib/languageColors`, `SearchInput` default export from `./SearchInput` (Task 1).

- [ ] **Step 1: `RepositoriesPage.tsx` — swap local `LANG_COLORS` for the shared one, add `SearchInput` import**

Change:
```tsx
'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import RepositoryCard from './RepositoryCard';

type SortKey = 'stars' | 'name' | 'updated';

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python:     'bg-green-500',
  Ruby:       'bg-red-500',
  Go:         'bg-cyan-500',
  Rust:       'bg-orange-600',
  Java:       'bg-orange-400',
  CSS:        'bg-purple-500',
  HTML:       'bg-orange-500',
  Shell:      'bg-gray-500',
};
```
to:
```tsx
'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import RepositoryCard from './RepositoryCard';
import SearchInput from './SearchInput';
import { LANG_COLORS } from '@/lib/languageColors';

type SortKey = 'stars' | 'name' | 'updated';
```

- [ ] **Step 2: `RepositoriesPage.tsx` — remove count subtitle, compact controls**

Change:
```tsx
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Repositories</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {repos.length} public repos
          {filtered.length !== repos.length && ` · ${filtered.length} shown`}
        </p>
      </div>

      {/* Controls */}
      <div className="glass mb-8 rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search repos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-100 placeholder-gray-400"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-100"
        >
          <option value="stars">Sort: Stars</option>
          <option value="name">Sort: Name</option>
          <option value="updated">Sort: Recently updated</option>
        </select>
      </div>
```
to:
```tsx
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Repositories</h1>
      </div>

      {/* Controls */}
      <div className="glass mb-8 rounded-2xl p-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <SearchInput value={search} onChange={setSearch} placeholder="Search repos…" />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-100"
        >
          <option value="stars">Sort: Stars</option>
          <option value="name">Sort: Name</option>
          <option value="updated">Sort: Recently updated</option>
        </select>
      </div>
```

- [ ] **Step 3: `RepositoryCard.tsx` — import `LANG_COLORS`, add `truncateWords` helper**

Change:
```tsx
'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import LinkIcon from '@/components/LinkIcon';
```
to:
```tsx
'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import LinkIcon from '@/components/LinkIcon';
import { LANG_COLORS } from '@/lib/languageColors';

function truncateWords(text: string, maxWords: number): string {
  if (!text) return text;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}
```

- [ ] **Step 4: `RepositoryCard.tsx` — cap the description at 15 words**

Change:
```tsx
        <p className="text-gray-600 dark:text-gray-400 mt-2">{repo.description}</p>
```
to:
```tsx
        <p className="text-gray-600 dark:text-gray-400 mt-2">{truncateWords(repo.description, 15)}</p>
```

- [ ] **Step 5: `RepositoryCard.tsx` — colored dots on language tags**

Change:
```tsx
        <div className="flex flex-wrap gap-2">
          {topLanguages.map(lang => (
            <span key={lang} className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
              {lang}
            </span>
          ))}
        </div>
```
to:
```tsx
        <div className="flex flex-wrap gap-2">
          {topLanguages.map(lang => (
            <span key={lang} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
              {lang}
            </span>
          ))}
        </div>
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/RepositoriesPage.tsx src/components/RepositoryCard.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 7: Live render check**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/repositories -o /tmp/repos-check.html
grep -o '<circle cx="11" cy="11" r="8" />' /tmp/repos-check.html | head -1
grep -c "public repos" /tmp/repos-check.html
```
Expected: the search-icon `<circle>` markup is found (confirms `SearchInput` rendered); `public repos` count is `0` (confirms the count subtitle is gone).

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 8: Commit**

```bash
git add src/components/RepositoriesPage.tsx src/components/RepositoryCard.tsx
git commit -m "feat: polish Repositories page and card (compact controls, colored tags, capped description)"
```

---

### Task 3: `CertificatesPage.tsx`

**Files:**
- Modify: `src/components/CertificatesPage.tsx`

**Interfaces:**
- Consumes: `SearchInput` default export from `./SearchInput` (Task 1).

- [ ] **Step 1: Import `SearchInput`**

Change:
```tsx
'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
import CertificateCard from './CertificateCard';
```
to:
```tsx
'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
import CertificateCard from './CertificateCard';
import SearchInput from './SearchInput';
```

- [ ] **Step 2: Remove count subtitle, compact controls**

Change:
```tsx
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Certificates</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {certificates.length} certificates
          {filtered.length !== certificates.length && ` · ${filtered.length} shown`}
        </p>
      </div>

      {/* Controls */}
      <div className="glass mb-8 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search certificates…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        />
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>
```
to:
```tsx
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Certificates</h1>
      </div>

      {/* Controls */}
      <div className="glass mb-8 flex flex-col gap-4 rounded-2xl p-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Search certificates…" />
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 bg-white/60 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/CertificatesPage.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 4: Live render check**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/certificates -o /tmp/certs-check.html
grep -o '<circle cx="11" cy="11" r="8" />' /tmp/certs-check.html | head -1
grep -c "certificates ·" /tmp/certs-check.html
```
Expected: the search-icon `<circle>` markup is found; the old `"certificates ·"` count-fragment is `0` (confirms the count subtitle is gone — note the plain word "Certificates" from the `<h1>` will still appear elsewhere on the page, this grep specifically targets the removed count phrase).

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 5: Commit**

```bash
git add src/components/CertificatesPage.tsx
git commit -m "feat: polish Certificates page (compact controls, remove count subtitle)"
```

---

### Task 4: `ProjectsPage.tsx`

**Files:**
- Modify: `src/components/ProjectsPage.tsx`

**Interfaces:**
- None — internal layout change only, no new props or exports.

- [ ] **Step 1: Standardize header margin**

Change:
```tsx
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Projects</h1>
      </div>
```
to:
```tsx
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Projects</h1>
      </div>
```

- [ ] **Step 2: Cap description width on desktop, combine tech tags and link buttons into one row**

Change:
```tsx
                  <p className="leading-relaxed text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.label}
                        aria-label={link.label}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
                      >
                        <LinkIcon icon={TYPE_TO_ICON[link.type]} />
                      </a>
                    ))}
                  </div>
```
to:
```tsx
                  <p className="leading-relaxed text-gray-500 dark:text-gray-400 sm:max-w-[70%]">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.label}
                          aria-label={link.label}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
                        >
                          <LinkIcon icon={TYPE_TO_ICON[link.type]} />
                        </a>
                      ))}
                    </div>
                  </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/ProjectsPage.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 4: Live render check**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/projects -o /tmp/projects-check.html
grep -o 'sm:max-w-\[70%\]' /tmp/projects-check.html | head -1
```
Expected: one match (confirms the width-constraint class made it into the compiled className string).

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectsPage.tsx
git commit -m "feat: combine tech/link row and cap description width on Projects page"
```

---

### Task 5: `Profile.tsx` — coherence fixes

**Files:**
- Modify: `src/components/Profile.tsx`

**Interfaces:**
- None — styling-only changes.

- [ ] **Step 1: Standardize the section's vertical spacing mechanism**

Change:
```tsx
      className="my-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
```
to:
```tsx
      className="py-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
```

- [ ] **Step 2: Swap the CV download buttons from blue to teal (2 identical occurrences)**

This exact class string appears twice (CV EN and CV ES buttons). Replace **both** occurrences of:
```
"inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 px-5 py-2 text-sm font-semibold text-blue-600 backdrop-blur-sm transition-colors hover:bg-blue-600/25 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
```
with:
```
"inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
```

- [ ] **Step 3: Swap the email/LinkedIn hover color from blue to teal (2 identical occurrences)**

While fixing the CV buttons' leftover blue, this same pattern exists two lines above: the email and LinkedIn links both use `className="hover:text-blue-500"`. This wasn't itemized separately in the design spec but is the same category of leftover-blue coherence gap the spec was written to fix — replace **both** occurrences of:
```
hover:text-blue-500
```
with:
```
hover:text-teal-500
```

- [ ] **Step 4: Verify no `blue-` classes remain in this file**

Run:
```bash
grep -n "blue-" src/components/Profile.tsx
```
Expected: no output (exit code 1 — no matches).

- [ ] **Step 5: Type-check, lint, build**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/Profile.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/Profile.tsx
git commit -m "fix: standardize Profile spacing and fix leftover blue accents"
```

---

## Final Manual QA (after Task 5, in a real browser)

1. `npm run dev`, open `http://localhost:3000/`.
2. Confirm the CV (EN)/(ES) buttons and the email/LinkedIn hover color are teal, not blue.
3. Visit `/repositories` — confirm the search bar is visibly shorter (roughly half) with a magnifying-glass icon, the sort dropdown matches its height, there's no "N public repos" line under the heading, language tags on each card show a colored dot, and long descriptions are cut to ~15 words with an ellipsis.
4. Visit `/certificates` — confirm the same compact search bar + no count line.
5. Visit `/projects` — confirm each project's tech tags and link buttons now share one row (tags left, buttons right), and the description text doesn't stretch the full content-column width on desktop.
6. Resize to mobile width on `/projects` — confirm the description goes back to full width and the tech/links row wraps sensibly if needed.
