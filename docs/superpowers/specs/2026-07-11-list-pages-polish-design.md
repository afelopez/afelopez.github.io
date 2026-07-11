# List Pages Polish Design
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Cross-cutting polish pass on `/projects`, `/certificates`, `/repositories`, and the home `Profile` card — declutter headers, compact the search/sort controls with a shared `SearchInput`, color-code repository language tags, tighten the Projects layout, cap repository description length for consistent card height, and fix two coherence gaps found while reviewing the home page.

---

## 1. Goal

Polish pass across the three list pages plus a coherence check on the home page, aiming for a consistent, professional spacing/color system rather than isolated one-off fixes.

## 2. Changes by File

### 2.1 `src/components/CertificatesPage.tsx`
- **Remove the count subtitle entirely.** Delete:
  ```tsx
  <p className="mt-2 text-gray-500 dark:text-gray-400">
    {certificates.length} certificates
    {filtered.length !== certificates.length && ` · ${filtered.length} shown`}
  </p>
  ```
  The header becomes just the `<h1>`.
- Header block: `mb-10` → `mb-8` (tighter now that it's a single line; also standardizes with Repositories/Projects, see §2.6).
- Replace the raw `<input>` search field with the new shared `<SearchInput>` (§2.3).
- Sort `<select>`: `px-4 py-2` → `px-3 py-1` (exactly half the vertical padding, matching the compact search input so the two controls stay visually paired at the same height).
- Controls wrapper: `p-4` → `p-3` (the `.glass` container around search+sort shouldn't look oversized once its contents are shorter).

### 2.2 `src/components/RepositoriesPage.tsx`
- Same four changes as §2.1 (remove count subtitle, `mb-10`→`mb-8`, `SearchInput`, sort `px-4 py-2`→`px-3 py-1`, controls wrapper `p-4`→`p-3`).
- **`LANG_COLORS` moves out** to `src/lib/languageColors.ts` (§2.5) — this file now imports it instead of defining it locally, since `RepositoryCard.tsx` needs the same map.

### 2.3 New: `src/components/SearchInput.tsx`
A shared, controlled search input with a magnifying-glass icon, used identically by both list pages (previously each hand-rolled its own `<input>`):
```tsx
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
`py-1` is exactly half of the original `py-2` — the user confirmed 50% explicitly, overriding the "half but not below a comfortable touch target" default this spec initially proposed. `pl-9` makes room for the icon (`left-3` + `h-4 w-4` icon ≈ 28px reserved), `pr-3` keeps the right side balanced now that `px-4` uniform padding is gone.

Each page calls it as `<SearchInput value={search} onChange={handleSearchChange} placeholder="Search certificates…" />` (Certificates) / `placeholder="Search repos…"` (Repositories), replacing their local `search`/`setSearch`(or `handleSearchChange`) wiring — the state itself stays in the page component, `SearchInput` is purely presentational/controlled.

### 2.4 `src/components/RepositoryCard.tsx`
- **Colored language tags.** Import `LANG_COLORS` from `src/lib/languageColors.ts` (§2.5) and add the same colored dot already used on the filter pills to each tag:
  ```tsx
  {topLanguages.map(lang => (
    <span key={lang} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
      {lang}
    </span>
  ))}
  ```
- **Description capped at 15 words** for consistent card height. Add a local helper and use it in place of the raw description:
  ```tsx
  function truncateWords(text: string, maxWords: number): string {
    if (!text) return text;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '…';
  }
  ```
  ```tsx
  <p className="text-gray-600 dark:text-gray-400 mt-2">{truncateWords(repo.description, 15)}</p>
  ```

### 2.5 New: `src/lib/languageColors.ts`
```ts
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
Moved verbatim from `RepositoriesPage.tsx` — values unchanged (these are per-language brand colors, e.g. TypeScript's actual brand blue, intentionally untouched by the teal-accent rebrand since they identify a language, not the site's UI accent).

### 2.6 `src/components/ProjectsPage.tsx`
- **Tech tags and link buttons share one row.** Replace the two stacked `flex flex-wrap gap-2` blocks with one `flex flex-wrap items-center justify-between gap-2` wrapper containing both (tags left, buttons right); each keeps its own inner `flex flex-wrap gap-2` for its own wrapping behavior if the row gets too narrow.
- **Description width capped on desktop only.** Add `sm:max-w-[70%]` to the description `<p>` (mobile stays full-width, per your confirmation — constraining an already-stacked mobile column would look cramped for no benefit).
- Header block: `mb-10` → `mb-8`, matching §2.1/§2.2 for cross-page consistency.

### 2.7 `src/components/Profile.tsx` (coherence fixes found during this review)
- **Leftover blue buttons.** The two CV download buttons still use `border-blue-500/40 bg-blue-600/15 ... text-blue-600 ... dark:text-blue-400 ...` — this file was missed by the earlier dark-palette rebrand (it wasn't in that plan's file list). Swap to the same `teal-*` tokens already used everywhere else (`RepositoryCard.tsx`, `CertificateCard.tsx`, `ProjectsPage.tsx`).
- **Spacing pattern.** `my-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8` → `py-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8`. Every list page applies its top/bottom rhythm via `py-12` on the container; `Profile.tsx` was the one outlier using `my-12` (margin) instead. Same visual spacing, consistent mechanism.

## 3. Out of Scope

- No other components were found with leftover blue accents or spacing outliers — `Navbar.tsx`, `RepositoryCard.tsx`, `CertificateCard.tsx`, `CertificatesPage.tsx`, `RepositoriesPage.tsx`, `ProjectsPage.tsx` were already fully on the teal/`py-12` pattern from prior work.
- No change to the pagination controls on `/certificates` (already reviewed, no gaps).
- No change to `NodeBackground.tsx`'s color palette (explicitly deferred to a future "sub-project B" rebrand phase, unrelated to this polish pass).

## 4. Testing / Verification

No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>`, `npm run build`, and `curl`/`grep` checks against server-rendered HTML for `/`, `/projects`, `/certificates`, `/repositories`.
