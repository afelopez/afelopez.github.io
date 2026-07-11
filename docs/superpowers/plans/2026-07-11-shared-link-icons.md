# Shared Link Icons & Card Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the icon-button pattern from `/projects` into a shared `LinkIcon` component, apply icon-only buttons to `CertificateCard.tsx` and `RepositoryCard.tsx`, and add a defensive `flex-wrap` to both cards' bottom row.

**Architecture:** One new presentational component (`LinkIcon`) holds the 4 SVGs, decoupled from `src/data/projects.ts`'s `LinkType`. `ProjectsPage.tsx` is refactored first to consume it (pure refactor, no visual change — proves the extraction didn't break anything already shipped). Then the same icon-only button pattern is applied to the two remaining cards, which is new visual behavior for them.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion. No new dependencies.

## Global Constraints

- Icon button treatment (verbatim, already shipped on `/projects`): `flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20`.
- Every icon-only button carries both `title` and `aria-label` matching its previous visible label text (accessibility — the visible label is gone, the accessible name must not be).
- `LinkIcon`'s prop is `icon: IconName` where `IconName = 'github' | 'external-link' | 'lightning' | 'hexagon'` — generic names, no dependency on `src/data/projects.ts`.
- No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>` (the unscoped `npm run lint` has ~12,733 pre-existing, unrelated problems confirmed in prior work on this repo — do not use it as a gate), `npm run build`, and `curl`/`grep` checks against server-rendered HTML.
- Out of scope (confirmed via responsive review in the spec): no changes to `CertificatesPage.tsx` or `RepositoriesPage.tsx` — their controls/grid/pagination are already responsive.

---

### Task 1: Shared `LinkIcon` component + `ProjectsPage.tsx` refactor

**Files:**
- Create: `src/components/LinkIcon.tsx`
- Modify: `src/components/ProjectsPage.tsx`

**Interfaces:**
- Produces: default export `LinkIcon({ icon }: { icon: IconName })`, and the exported type `IconName = 'github' | 'external-link' | 'lightning' | 'hexagon'`, both from `src/components/LinkIcon.tsx`.

- [ ] **Step 1: Create the shared icon component**

```tsx
// src/components/LinkIcon.tsx
export type IconName = 'github' | 'external-link' | 'lightning' | 'hexagon';

export default function LinkIcon({ icon }: { icon: IconName }) {
  switch (icon) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
        </svg>
      );
    case 'external-link':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44a1 1 0 0 1-.98 0l-7.9-4.44a1 1 0 0 1-.53-.88v-9a1 1 0 0 1 .53-.88l7.9-4.44a1 1 0 0 1 .98 0l7.9 4.44c.32.17.53.5.53.88Z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}
```

- [ ] **Step 2: Refactor `ProjectsPage.tsx` to use the shared component**

In `src/components/ProjectsPage.tsx`, replace the top of the file (the imports plus the entire local `LinkIcon` function) — everything from `'use client';` down to the closing `}` of the local `LinkIcon` function — with:

```tsx
'use client';
import { motion } from 'framer-motion';
import { Project, LinkType } from '@/data/projects';
import LinkIcon, { IconName } from '@/components/LinkIcon';

const TYPE_TO_ICON: Record<LinkType, IconName> = {
  github: 'github',
  frontend: 'external-link',
  swagger: 'lightning',
  api: 'hexagon',
};
```

Then, further down in the same file, find:
```tsx
                        <LinkIcon type={link.type} />
```
and change it to:
```tsx
                        <LinkIcon icon={TYPE_TO_ICON[link.type]} />
```

Nothing else in `ProjectsPage.tsx` changes — this is a pure refactor, the rendered output is byte-identical to before.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/LinkIcon.tsx src/components/ProjectsPage.tsx`
Expected: no output, exit code 0.

- [ ] **Step 4: Confirm `/projects` still renders identically (regression check)**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/projects -o /tmp/projects-page.html
grep -o 'ExcelsiorVet' /tmp/projects-page.html | head -1
grep -o '<svg viewBox="0 0 24 24"' /tmp/projects-page.html | wc -l
```
Expected: `ExcelsiorVet` found; the `<svg>` count is the same as before this refactor (at least 4 — this page's SVG count did not change, only where the code that generates them lives).

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 5: Commit**

```bash
git add src/components/LinkIcon.tsx src/components/ProjectsPage.tsx
git commit -m "refactor: extract LinkIcon into a shared component"
```

---

### Task 2: Icon-only buttons + `flex-wrap` on `CertificateCard.tsx` and `RepositoryCard.tsx`

**Files:**
- Modify: `src/components/CertificateCard.tsx`
- Modify: `src/components/RepositoryCard.tsx`

**Interfaces:**
- Consumes: `LinkIcon` default export and `IconName` type from `@/components/LinkIcon` (Task 1).

- [ ] **Step 1: `CertificateCard.tsx` — import the shared icon component**

Change:
```tsx
'use client';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
```
to:
```tsx
'use client';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
import LinkIcon from '@/components/LinkIcon';
```

- [ ] **Step 2: `CertificateCard.tsx` — icon-only button + `flex-wrap`**

Change:
```tsx
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-4 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
        >
          Ver certificado
        </a>
      </div>
```
to:
```tsx
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
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
          title="Ver certificado"
          aria-label="Ver certificado"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
        >
          <LinkIcon icon="external-link" />
        </a>
      </div>
```

- [ ] **Step 3: `RepositoryCard.tsx` — import the shared icon component**

Change:
```tsx
'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
```
to:
```tsx
'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import LinkIcon from '@/components/LinkIcon';
```

- [ ] **Step 4: `RepositoryCard.tsx` — `flex-wrap` on the bottom row**

Change:
```tsx
      <div className="flex justify-between items-center mt-6 text-sm text-gray-500 dark:text-gray-400">
```
to:
```tsx
      <div className="flex flex-wrap justify-between items-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400">
```

- [ ] **Step 5: `RepositoryCard.tsx` — GitHub button becomes icon-only**

Change:
```tsx
          <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
             Github
            </a>
```
to:
```tsx
          <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
              <LinkIcon icon="github" />
            </a>
```

- [ ] **Step 6: `RepositoryCard.tsx` — Live Demo button becomes icon-only**

Change:
```tsx
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
              Live Demo
            </a>
```
to:
```tsx
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Live Demo"
              aria-label="Live Demo"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
              <LinkIcon icon="external-link" />
            </a>
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/CertificateCard.tsx src/components/RepositoryCard.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0, same route table as before (`/`, `/certificates`, `/projects`, `/repositories`).

- [ ] **Step 8: Live render checks**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/certificates -o /tmp/certs-page.html
grep -c "external-link\|h-10 w-10" /tmp/certs-page.html
grep -o 'aria-label="Ver certificado"' /tmp/certs-page.html | head -1

curl -s http://localhost:3000/repositories -o /tmp/repos-page.html
grep -o 'aria-label="GitHub"' /tmp/repos-page.html | head -1
grep -c "flex-wrap" /tmp/repos-page.html
```
Expected: the `h-10 w-10` grep on the certificates page returns > 0 (icon buttons present); `aria-label="Ver certificado"` found; `aria-label="GitHub"` found on the repositories page; `flex-wrap` count > 0 on the repositories page (confirms the wrap class made it into the compiled className string).

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 9: Commit**

```bash
git add src/components/CertificateCard.tsx src/components/RepositoryCard.tsx
git commit -m "feat: icon-only link buttons + responsive flex-wrap on Certificate/Repository cards"
```

---

## Final Manual QA (after Task 2, in a real browser)

1. `npm run dev`, open `http://localhost:3000/projects` — confirm it looks exactly the same as before this branch (pure refactor in Task 1, no visual change expected).
2. Open `/certificates` — confirm the "Ver certificado" button is now a compact teal icon square, with a hover tooltip showing the label.
3. Open `/repositories` — confirm "GitHub" and "Live Demo" are now compact teal icon squares (GitHub mark and external-link icon respectively), each with a hover tooltip.
4. Resize the browser to a narrow mobile width (~360px) on `/repositories` for a repo with several language tags — confirm the bottom row wraps cleanly instead of cramming or overflowing.
5. Do the same narrow-width check on `/certificates`.
