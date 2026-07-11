# Projects Catalog Design
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Replace the home-page carousel with a dedicated `/projects` page — a static, alternating "mirror" catalog list, no carousel machinery. Built using the already-approved dark palette / teal accent from the rebrand.

---

## 1. Goal

Give Projects its own page, matching the existing `/certificates` and `/repositories` pattern, and replace the auto-advancing carousel with a static, always-fully-visible catalog where each project's logo and content alternate sides row by row.

## 2. Current State Being Replaced

- `src/components/FeaturedProjects.tsx` — client component rendered on the home page inside a `<section id="projects">`, reached via the Navbar's `/#projects` anchor link. Auto-advances every 5s, has prev/next arrows and dots, shows one project at a time in a 3-zone desktop layout (number column | content | logo column).
- `src/app/page.tsx` renders `<Profile />` then `<FeaturedProjects />`.
- `src/components/Navbar.tsx`'s `navItems` has `{ name: 'Projects', href: '/#projects' }`.
- `src/data/projects.ts` — `Project` type (`id`, `name`, `description`, `tech[]`, `links[]`, `logo?`, `brandColor?`) and the 4 current entries. **Unchanged by this spec** — the catalog reuses this data as-is.
- `FeaturedProjects.tsx` also contains a `LINK_STYLES` constant that is defined but never referenced anywhere in the file's render — dead code, confirmed by reading the whole file. Not carried over into the new component. `LINK_ICONS` (a `Record<LinkType, string>` of unicode glyphs) **is** used today, but per §3.7 it's superseded by a real inline-SVG icon per type, not carried over as-is.

## 3. What Changes

### 3.1 New route
- `src/app/projects/page.tsx` — thin server component: `import { projects } from '@/data/projects'; export default function Page() { return <ProjectsPage projects={projects} />; }`. No async/data-fetching needed — `projects` is a static local array, unlike the Credly/Platzi/GitHub data sources on the other two pages.
- `src/components/ProjectsPage.tsx` — the catalog itself.

### 3.2 Delete
- `src/components/FeaturedProjects.tsx`

### 3.3 `src/app/page.tsx`
Remove the `FeaturedProjects` import and its usage. The home page becomes just:
```tsx
import Profile from '@/components/Profile';
import { getRepositories } from '@/lib/github';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  return <Profile repos={repos} />;
}
```

### 3.4 `src/components/Navbar.tsx`
`{ name: 'Projects', href: '/#projects' }` → `{ name: 'Projects', href: '/projects' }`.

### 3.5 Catalog layout — "escalonado en espejo"
Each project renders as one full-width `.glass rounded-2xl overflow-hidden` row, stacked vertically, one per project, in `projects[]` order. No carousel state, no `setInterval`, no dots, no arrows.

Each row has exactly two halves:
- **Logo panel**: background = `project.brandColor` (falls back to `#111827`, same default as today), centered `project.logo` image, same `max-h-36 w-auto object-contain drop-shadow-2xl` treatment as the current carousel's desktop logo column. If a project has no `logo`, this half is simply omitted and the content panel spans the full row (mirrors today's `{project.logo && (...)}` guard).
- **Content panel**: `project.name` as heading, `project.description`, `project.tech` pills, `project.links` rendered as compact icon buttons (§3.7) — same underlying content as today's center column, restyled with the teal accent (§3.6) and real icons instead of text pills (§3.7).

**Alternation:** even-indexed projects (0, 2, 4, ...) render logo-left/content-right (`flex-row`). Odd-indexed projects (1, 3, 5, ...) render mirrored, logo-right/content-left (`flex-row-reverse`).

**Responsive:** below the `sm:` breakpoint, every row stacks logo-on-top, content-below, regardless of index — alternation is desktop-only, the same mobile-vs-desktop split the current carousel already does.

**Entrance animation:** each row fades/slides in on mount using the same pattern already established on `/repositories` and `/certificates`: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.5, delay: Math.min(index * 0.05, 1) }}` — the same capped-delay formula from the earlier animation-scaling fix, so it holds up regardless of how many projects get added later.

### 3.6 Palette — apply the rebrand here too
This is new code being written after the dark-palette rebrand landed, so it's built with the final palette from the start, not migrated after the fact:
- Row container: `.glass` (already themed via the `--glass-bg`/`--glass-border` CSS variables set in the rebrand — Gris carbón against the Azul medianoche page background).
- Link buttons: same teal treatment already applied to `RepositoryCard.tsx`/`CertificateCard.tsx`: `border-teal-500/40 bg-teal-600/15 ... text-teal-600 ... hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20`.
- Tech pills: `bg-gray-100 dark:bg-gray-800` text `text-gray-700 dark:text-gray-300` — unchanged from today (neutral, not accent-colored; consistent with the rebrand's decision not to sweep neutral grays).
- `dark:`-prefixed classes are kept throughout (paired with their light-mode equivalent), matching the convention already established across the rest of the codebase post-rebrand — `.dark` is hardcoded on `<html>` so only the `dark:` variant ever actually applies, but the codebase's existing files all still write both classes, and this component follows that same pattern rather than inventing a new one.

### 3.7 Link buttons — real icons, compact (icon-only)

Today's link buttons are `↗ Live App` / `⌥ GitHub` style pills — a unicode glyph plus visible label text, wide. Replace with **icon-only square buttons**, ~40×40px, no visible label text (label moves to `title`/`aria-label` for accessibility), so a row with 2 links takes a fraction of the horizontal space it does today.

**Icon source:** hand-written inline SVG components, not a new npm icon library — this repo has added zero runtime dependencies all session (only `tsx` as a devDependency, for verification scripts), and the existing codebase's icon precedent (the now-deleted `ModeToggle.tsx`'s sun/moon icons) was already hand-rolled inline SVG. Consistent with that.

One SVG icon per `LinkType`:
- `github` → the GitHub mark (octocat logo path), replacing the current `⌥` placeholder — this was never a real GitHub logo, just an unrelated "option key" glyph.
- `frontend` (used for "Live App"/"Live Demo") → an external-link icon (arrow out of a box), replacing `↗`.
- `swagger` → a lightning-bolt icon, replacing `⚡` (kept conceptually the same, now a real SVG instead of an emoji glyph).
- `api` → a hexagon/plug icon, replacing `⬡`.

Only `frontend` and `github` are exercised by the 4 projects currently in `projects.ts`, but all 4 `LinkType` values get an icon for completeness, matching how `LINK_ICONS` already covered all 4 today.

**Button markup:**
```tsx
<a
  href={link.url}
  target="_blank"
  rel="noopener noreferrer"
  title={link.label}
  aria-label={link.label}
  className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
>
  <LinkIcon type={link.type} />
</a>
```
`LinkIcon` is a small non-exported component defined directly in `src/components/ProjectsPage.tsx` (not its own file — it's four tiny SVGs used only here) that switches on `type: LinkType` and returns the matching inline `<svg>` (fixed `h-5 w-5`, `fill="currentColor"` so it inherits the button's teal text color for free, no separate color prop needed).

## 4. Files Changed / Created

| File | Action |
|---|---|
| `src/app/projects/page.tsx` | Create |
| `src/components/ProjectsPage.tsx` | Create |
| `src/components/FeaturedProjects.tsx` | Delete |
| `src/app/page.tsx` | Modify — remove `FeaturedProjects` |
| `src/components/Navbar.tsx` | Modify — `Projects` href → `/projects` |

## 5. Out of Scope

- Any change to `src/data/projects.ts` (data model or content) — reused as-is, per your choice of "logo on brand-color panel" over adding a new screenshot field.
- Any teaser/preview of Projects on the home page — it disappears from home entirely, matching how `/certificates` and `/repositories` already behave.
- A numeral/index badge (the old carousel's "01", "02"...) — the approved description was strictly "image on one side, title on the other," so the catalog is exactly those two zones per row, nothing added beyond what was asked.

## 6. Testing / Verification

No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>`, `npm run build`, and `curl`/`grep` checks against server-rendered HTML for both the new `/projects` route and the now-simplified home page — consistent with how every other feature in this repo has been verified.
