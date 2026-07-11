# Projects Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home-page project carousel with a dedicated `/projects` page — a static, alternating "mirror" catalog with compact icon-based link buttons.

**Architecture:** One new presentational component (`ProjectsPage`) renders `projects[]` as a vertical stack of full-width rows, alternating logo-left/content-right and logo-right/content-left by index, with a small inline-SVG `LinkIcon` switch replacing the old unicode-glyph link buttons. A thin route wires it in; the old carousel and its home-page/nav wiring are removed in the same task, since nothing can safely reference the old component and the new one simultaneously.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion. No new dependencies.

## Global Constraints

- Palette (from the dark-palette rebrand, already merged to `main`): accent = teal (`teal-500/600/400`), matching `RepositoryCard.tsx`/`CertificateCard.tsx`'s existing button treatment exactly.
- Icons are hand-written inline SVG, `fill="currentColor"` (or `stroke="currentColor"` for line-style icons) so they inherit the button's teal color automatically — no icon library dependency.
- `src/data/projects.ts` (the `Project`/`ProjectLink`/`LinkType` types and the `projects` array) is **not modified** by this plan — reused exactly as-is.
- No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>` (the unscoped `npm run lint` has ~12,733 pre-existing, unrelated problems confirmed in prior work on this repo — do not use it as a gate), `npm run build`, and `curl`/`grep` checks against server-rendered HTML.
- Follow existing component conventions: `'use client'` + `motion.div` entrance animation (`initial`/`animate`/`transition`) matching `RepositoryCard.tsx`/`CertificateCard.tsx`; `dark:`-prefixed Tailwind classes paired with their light-mode equivalent throughout, even though `.dark` is now permanently applied — this is the established pattern across the whole codebase post-rebrand.

---

### Task 1: `ProjectsPage` component — alternating catalog + icon link buttons

**Files:**
- Create: `src/components/ProjectsPage.tsx`

**Interfaces:**
- Consumes: `Project`, `LinkType` types from `@/data/projects` (unchanged — `Project` has `id`, `name`, `description`, `tech: string[]`, `links: ProjectLink[]`, `logo?`, `brandColor?`; `ProjectLink` has `label`, `url`, `type: LinkType`; `LinkType` is `'frontend' | 'swagger' | 'api' | 'github'`).
- Produces: default export `ProjectsPage({ projects }: { projects: Project[] })`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/ProjectsPage.tsx
'use client';
import { motion } from 'framer-motion';
import { Project, LinkType } from '@/data/projects';

function LinkIcon({ type }: { type: LinkType }) {
  switch (type) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
        </svg>
      );
    case 'frontend':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case 'swagger':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </svg>
      );
    case 'api':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44a1 1 0 0 1-.98 0l-7.9-4.44a1 1 0 0 1-.53-.88v-9a1 1 0 0 1 .53-.88l7.9-4.44a1 1 0 0 1 .98 0l7.9 4.44c.32.17.53.5.53.88Z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

export default function ProjectsPage({ projects }: { projects: Project[] }) {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Projects</h1>
      </div>

      {projects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No projects listed yet.</p>
          <p className="mt-1 text-sm">
            Edit{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-800">
              src/data/projects.ts
            </code>{' '}
            to add your deployed projects.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {projects.map((project, index) => {
            const reversed = index % 2 === 1;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.05, 1) }}
                className={`glass flex flex-col overflow-hidden rounded-2xl sm:flex-row ${reversed ? 'sm:flex-row-reverse' : ''}`}
              >
                {project.logo && (
                  <div
                    className="flex w-full items-center justify-center p-10 sm:w-64 sm:flex-shrink-0 lg:w-72"
                    style={{ backgroundColor: project.brandColor ?? '#111827' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.logo}
                      alt={`${project.name} logo`}
                      className="max-h-36 w-auto object-contain drop-shadow-2xl"
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-6 sm:p-8">
                  <h3 className="text-2xl font-bold">{project.name}</h3>
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
                        <LinkIcon type={link.type} />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/ProjectsPage.tsx`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectsPage.tsx
git commit -m "feat: add ProjectsPage catalog component with icon link buttons"
```

---

### Task 2: Wire the route, remove the carousel, update the Navbar

**Files:**
- Create: `src/app/projects/page.tsx`
- Delete: `src/components/FeaturedProjects.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `ProjectsPage` default export from `@/components/ProjectsPage` (Task 1); `projects` array from `@/data/projects` (unchanged, pre-existing).

- [ ] **Step 1: Create the route**

```tsx
// src/app/projects/page.tsx
import { projects } from '@/data/projects';
import ProjectsPage from '@/components/ProjectsPage';

export default function Page() {
  return <ProjectsPage projects={projects} />;
}
```

- [ ] **Step 2: Delete the old carousel**

```bash
rm src/components/FeaturedProjects.tsx
```

- [ ] **Step 3: Simplify the home page**

In `src/app/page.tsx`, replace the entire file with:

```tsx
import Profile from '@/components/Profile';
import { getRepositories } from '@/lib/github';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  return <Profile repos={repos} />;
}
```

- [ ] **Step 4: Point the Navbar at the new route**

In `src/components/Navbar.tsx`, change:
```tsx
  { name: 'Projects', href: '/#projects' },
```
to:
```tsx
  { name: 'Projects', href: '/projects' },
```

No other change is needed in `Navbar.tsx` — its active-link logic already does `!item.href.includes('#') && pathname === item.href`, which was written to specifically exclude hash-anchor links from ever being treated as "active." Since `/projects` has no `#`, it now participates in that check automatically and will correctly highlight when visiting `/projects`.

- [ ] **Step 5: Confirm nothing else references the deleted component**

Run: `grep -rn "FeaturedProjects" /home/afelopez/Projects/portfolio/src`
Expected: no output (exit code 1 — no matches anywhere).

- [ ] **Step 6: Type-check, lint, build**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/app/projects/page.tsx src/app/page.tsx src/components/Navbar.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0. Route table includes `/projects` and no longer needs anything project-related on `/`.

- [ ] **Step 7: Live render checks**

Run: `npm run dev &`, wait ~6 seconds, then:

```bash
curl -s http://localhost:3000/projects -o /tmp/projects-page.html
grep -c "glass" /tmp/projects-page.html
grep -o 'ExcelsiorVet' /tmp/projects-page.html | head -1
grep -o 'sm:flex-row-reverse' /tmp/projects-page.html | head -1
grep -o '<svg viewBox="0 0 24 24"' /tmp/projects-page.html | wc -l
```
Expected: `glass` count > 0; `ExcelsiorVet` (the first project's name) found; `sm:flex-row-reverse` found at least once (confirms the mirrored row exists — with 4 projects, indices 1 and 3 get it); the `<svg>` count is at least 4 (one per link across the current 4 projects' links — `vet-scheduler`, `ratopro`, `e-commerce-template`, and `cuentas-claras` have 1, 2, 2, and 1 links respectively, so 6 SVGs total today, but assert only `>= 4` to stay robust if `projects.ts` changes later).

```bash
curl -s http://localhost:3000/ -o /tmp/home-page.html
grep -c "ExcelsiorVet\|RatoPro\|FuncionArte\|Cuentas Claras" /tmp/home-page.html
```
Expected: `0` — none of the project names appear on the home page anymore.

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 8: Commit**

```bash
git add src/app/projects/page.tsx src/app/page.tsx src/components/Navbar.tsx
git commit -m "feat: move Projects to its own page, remove the carousel"
```

(The `rm` from Step 2 is captured by `git add -A` if any file is still unstaged — check `git status --short` before this commit and include `src/components/FeaturedProjects.tsx` explicitly with `git rm` if it still shows as deleted-but-unstaged.)

---

## Final Manual QA (after Task 2, in a real browser)

1. `npm run dev`, open `http://localhost:3000/`.
2. Confirm the home page shows only the profile card — no projects section at all.
3. Click "Projects" in the Navbar — confirm it navigates to `/projects` and the nav pill highlights as active.
4. Confirm the 4 projects render as a vertical stack, alternating: project 1 logo-left/content-right, project 2 mirrored (logo-right/content-left), project 3 back to logo-left, project 4 mirrored again.
5. Confirm each project's link buttons are compact icon-only squares (GitHub mark for GitHub links, external-link icon for Live Demo/Live App links) with a hover tooltip showing the label.
6. Resize to mobile width — confirm every row stacks logo-on-top/content-below regardless of alternation.
7. Confirm the row background, accent color, and animation match the established `/repositories`/`/certificates` look (teal accent, glass cards, capped stagger delay).
