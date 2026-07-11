# Shared Link Icons & Card Responsiveness Design
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Extract the icon-button pattern already built for `/projects` into a shared component, apply it to `/certificates` and `/repositories`, and add a defensive `flex-wrap` to both cards' bottom row.

---

## 1. Goal

Bring the compact icon-only link buttons already shipped on `/projects` to `CertificateCard.tsx` and `RepositoryCard.tsx`, sharing one icon component instead of duplicating SVGs, and fix a responsive gap found while reviewing both cards.

## 2. Current State

- `src/components/ProjectsPage.tsx` defines a local `LinkIcon({ type: LinkType })` function (4 inline SVG cases: `github`, `frontend`, `swagger`, `api`) and renders each `project.links[]` entry as a `h-10 w-10` icon-only button with teal styling, `title`/`aria-label` for accessibility.
- `CertificateCard.tsx`'s "Ver certificado" and `RepositoryCard.tsx`'s "Github"/"Live Demo" are still text-label pill buttons (`px-4 py-2` / `px-5 py-2`), same teal color tokens as the new icon buttons, just wider.
- Both cards' bottom row is `flex items-center justify-between ...` with **no** `flex-wrap` — on narrow viewports, `RepositoryCard`'s row (language tags + 2 buttons + star count) has no fallback if content doesn't fit on one line; `CertificateCard`'s row (provider pill + date + 1 button) has the same gap, lower risk with only one button.

## 3. What Changes

### 3.1 New shared component — `src/components/LinkIcon.tsx`
```tsx
export type IconName = 'github' | 'external-link' | 'lightning' | 'hexagon';

export default function LinkIcon({ icon }: { icon: IconName }) {
  switch (icon) {
    case 'github': /* GitHub mark, fill="currentColor" */
    case 'external-link': /* arrow-out-of-box, stroke="currentColor" */
    case 'lightning': /* bolt, fill="currentColor" */
    case 'hexagon': /* hex/plug outline, stroke="currentColor" */
  }
}
```
The 4 SVG bodies are moved verbatim from `ProjectsPage.tsx`'s current `LinkIcon` — no visual change to the icons themselves, only relocated and renamed from `LinkType` values (`'frontend'`, `'swagger'`, `'api'`) to generic icon names (`'external-link'`, `'lightning'`, `'hexagon'`) so this component has no dependency on `src/data/projects.ts`. `'github'` keeps its name since it's already generic.

### 3.2 `ProjectsPage.tsx`
- Remove the local `LinkIcon` function.
- Import the shared one: `import LinkIcon, { IconName } from '@/components/LinkIcon';`
- Add a small local map translating the data model's `LinkType` to the component's `IconName`:
  ```tsx
  const TYPE_TO_ICON: Record<LinkType, IconName> = {
    github: 'github',
    frontend: 'external-link',
    swagger: 'lightning',
    api: 'hexagon',
  };
  ```
- `<LinkIcon type={link.type} />` → `<LinkIcon icon={TYPE_TO_ICON[link.type]} />`. No other change — same button markup, same styling.

### 3.3 `CertificateCard.tsx`
Replace the "Ver certificado" text button:
```tsx
<a
  href={certificate.url}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-4 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
>
  Ver certificado
</a>
```
with an icon-only button matching `ProjectsPage.tsx`'s exact button treatment (`h-10 w-10`, same teal tokens), using the `external-link` icon, `title`/`aria-label="Ver certificado"` for accessibility since the visible label is gone.

Add `flex-wrap gap-2` to the bottom row (`mt-6 flex items-center justify-between ...` → `mt-6 flex flex-wrap items-center justify-between gap-2 ...`).

### 3.4 `RepositoryCard.tsx`
Replace both text buttons ("Github", "Live Demo") with icon-only buttons, same `h-10 w-10` treatment: `github` icon for the GitHub link, `external-link` icon for the Live Demo link. Each gets `title`/`aria-label` matching its current visible text ("GitHub" / "Live Demo").

Add `flex-wrap gap-2` to the bottom row (`flex justify-between items-center mt-6 ...` → `flex flex-wrap items-center justify-between gap-2 mt-6 ...`).

### 3.5 Responsive analysis (why `flex-wrap` and nothing more)
Reviewed both cards and the surrounding page layouts (`CertificatesPage.tsx`, `RepositoriesPage.tsx`) for responsive gaps:
- **Real gap found:** both cards' bottom row has no wrap fallback. `RepositoryCard`'s is the higher-risk one (language tags + 2 buttons + star count all fighting for one line) — shrinking the buttons to icon-only already frees significant width, and `flex-wrap gap-2` is added as a safety net for repos with several languages or long names.
- **No other gaps found:** the controls row on both list pages already stacks (`flex-col` → `sm:flex-row`), filter pills already wrap (`flex-wrap`), the card grid already steps down (`grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3`), and pagination already wraps. None of these need changes.

## 4. Files Changed / Created

| File | Action |
|---|---|
| `src/components/LinkIcon.tsx` | Create |
| `src/components/ProjectsPage.tsx` | Modify — use shared `LinkIcon`, remove local copy |
| `src/components/CertificateCard.tsx` | Modify — icon-only button, `flex-wrap` |
| `src/components/RepositoryCard.tsx` | Modify — icon-only buttons, `flex-wrap` |

## 5. Out of Scope

- Any change to `CertificatesPage.tsx` / `RepositoriesPage.tsx` — reviewed, no gaps found (§3.5).
- Any change to the icons' visual design — moved verbatim, not redrawn.

## 6. Testing / Verification

No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>`, `npm run build`, and `curl`/`grep` checks against server-rendered HTML for `/`, `/projects`, `/certificates`, `/repositories`, consistent with every prior feature in this repo.
