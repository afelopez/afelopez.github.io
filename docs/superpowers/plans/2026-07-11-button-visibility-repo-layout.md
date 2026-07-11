# Button Visibility & Repository Card Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump the shared icon-button contrast everywhere it's used, and restructure `RepositoryCard.tsx`'s bottom row into a fixed-height two-column layout so language tags can wrap up to 2 lines without ever displacing the action buttons or changing card height.

**Architecture:** Task 1 does the mechanical, identical contrast-class swap across all 4 button instances in 3 files. Task 2 builds on Task 1's already-bumped button classes to restructure only `RepositoryCard.tsx`'s bottom row — sequencing this way means Task 2 never re-touches lines Task 1 already changed.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion. No new dependencies.

## Global Constraints

- The old and new button className strings are IDENTICAL across all 4 occurrences (`ProjectsPage.tsx`, `CertificateCard.tsx`, `RepositoryCard.tsx` ×2) — same find/replace everywhere:
  - Old: `border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20`
  - New: `border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30`
- `RepositoryCard.tsx`'s tags column is a fixed `h-14` (space for exactly 2 pill lines) with `overflow-hidden` and `content-start` — every card reserves identical row height regardless of tag count (an explicit choice: uniform grid over content-hugging height).
- The 3-tag cap (`topLanguages.slice(0, 3)`, already in the codebase) is unchanged.
- No new UI test framework — this repo has none; verification uses `tsc --noEmit`, scoped `eslint`, `npm run build`, and `curl`/`grep` checks.
- A dev server the user started in their own terminal is already running on port 3000 for this branch — verification curls against it; never start/stop a `next dev`/`next-server` process.

---

### Task 1: Button contrast bump (3 files, 4 button instances)

**Files:**
- Modify: `src/components/ProjectsPage.tsx`
- Modify: `src/components/CertificateCard.tsx`
- Modify: `src/components/RepositoryCard.tsx`

**Interfaces:**
- None — pure Tailwind class-string edits, no signature or behavior changes.

- [ ] **Step 1: `ProjectsPage.tsx` — bump the link button contrast**

Change:
```
"flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
```
to:
```
"flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
```

- [ ] **Step 2: `CertificateCard.tsx` — bump the "Ver certificado" button contrast**

Change:
```
"flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
```
to:
```
"flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
```

- [ ] **Step 3: `RepositoryCard.tsx` — bump both button instances' contrast**

This exact string appears twice (GitHub button and Live Demo button). Replace **both** occurrences of:
```
"flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
```
with:
```
"flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
```

- [ ] **Step 4: Verify the old subtle values are gone and the new ones are present**

Run:
```bash
grep -c "bg-teal-600/15" src/components/ProjectsPage.tsx src/components/CertificateCard.tsx src/components/RepositoryCard.tsx
grep -c "bg-teal-600/25" src/components/ProjectsPage.tsx src/components/CertificateCard.tsx src/components/RepositoryCard.tsx
```
Expected: the first command's counts are all `0` (old value gone from every file). The second command's counts are `1` (`ProjectsPage.tsx`), `1` (`CertificateCard.tsx`), `2` (`RepositoryCard.tsx`).

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/ProjectsPage.tsx src/components/CertificateCard.tsx src/components/RepositoryCard.tsx`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectsPage.tsx src/components/CertificateCard.tsx src/components/RepositoryCard.tsx
git commit -m "fix: increase icon-button contrast across Projects, Certificates, and Repositories"
```

---

### Task 2: `RepositoryCard.tsx` — fixed-height two-column bottom row

**Files:**
- Modify: `src/components/RepositoryCard.tsx`

**Interfaces:**
- Consumes: the already-bumped button className strings from Task 1 (this task's "old" code block below already reflects Task 1's output — don't re-bump contrast here, it's already done).

- [ ] **Step 1: Restructure the bottom row**

Change:
```tsx
      <div className="flex flex-wrap justify-between items-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap gap-2">
          {topLanguages.map(lang => (
            <span key={lang} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
              {lang}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
            >
              <LinkIcon icon="github" />
            </a>
          {pagesUrl && (
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Live Demo"
              aria-label="Live Demo"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
            >
              <LinkIcon icon="external-link" />
            </a>
          )}
          <span>⭐ {repo.stargazers_count}</span>
        </div>
      </div>
```
to:
```tsx
      <div className="mt-6 flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex h-14 flex-1 flex-wrap content-start gap-2 overflow-hidden">
          {topLanguages.map(lang => (
            <span key={lang} className="flex h-fit items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
              {lang}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
            >
              <LinkIcon icon="github" />
            </a>
          {pagesUrl && (
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Live Demo"
              aria-label="Live Demo"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
            >
              <LinkIcon icon="external-link" />
            </a>
          )}
          <span>⭐ {repo.stargazers_count}</span>
        </div>
      </div>
```

Note what changed structurally: `flex-wrap` removed from the outer row (it can no longer wrap as a whole); the tags `<div>` gained `h-14 overflow-hidden content-start` (was just `flex flex-wrap gap-2`) and each tag's `<span>` gained `h-fit` so it doesn't stretch to fill the taller container; the actions `<div>` changed `gap-3` → `gap-2` (matching the tags column's gap for visual consistency) and `items-center` → kept, plus gained `shrink-0` so it can never be compressed or pushed to a new line.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/RepositoryCard.tsx`
Expected: no output, exit code 0.

- [ ] **Step 3: Full build check**

Run: `npm run build`
Expected: exit code 0, same route table as before.

- [ ] **Step 4: Live render check**

Run: `curl -s http://localhost:3000/repositories -o /tmp/repos-layout-check.html` (the dev server is already running — do not start/stop one).
```bash
grep -o 'h-14 flex-1 flex-wrap content-start gap-2 overflow-hidden' /tmp/repos-layout-check.html | head -1
grep -o 'flex shrink-0 items-center gap-2' /tmp/repos-layout-check.html | head -1
```
Expected: both classes found in the rendered HTML, confirming the new layout compiled and rendered.

- [ ] **Step 5: Commit**

```bash
git add src/components/RepositoryCard.tsx
git commit -m "feat: fixed-height two-column layout for RepositoryCard bottom row"
```

---

## Final Manual QA (after Task 2, in a real browser)

1. Refresh `http://localhost:3000/repositories`, `/certificates`, and `/projects` — confirm all icon buttons are visibly more prominent (stronger fill + border) than before, in both light and dark mode.
2. On `/repositories`, find a repo with 3 languages with longer names (or narrow the browser window) — confirm the tags wrap to a 2nd line while the GitHub/Live Demo buttons and star count stay pinned to the right, vertically centered, never dropping to their own line.
3. Compare card heights across the `/repositories` grid — confirm every card's bottom-row area looks the same height regardless of how many language tags each repo has.
