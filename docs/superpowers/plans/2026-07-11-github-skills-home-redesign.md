# GitHub-Driven Skills & Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's repo-count language ranking and hardcoded secondary-skills array with real GitHub-derived data (byte-weighted primary skills, manifest-detected secondary skills), and restructure `Profile.tsx` into the sidebar + hierarchical layout validated via visual mockups.

**Architecture:** A new pure/async data module (`src/lib/skills.ts`) computes both skill lists from data `getRepositories` already fetches (plus new manifest-fetch calls for secondary skills). `page.tsx` (Server Component) computes both server-side and passes plain props down. `Profile.tsx` becomes purely presentational for this data, restructured into the approved sidebar layout.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion. No new dependencies.

## Global Constraints

- **Correction to the spec:** §3's `DOWNWEIGHT_FACTOR` is `0.2` in the design doc. Computing it against this account's real byte totals (Ruby 170,805 · CSS 157,224 · JavaScript 104,966 · TypeScript 17,887 · Python 9,783 · HTML 12,103 · MATLAB 5,597 · Haml 4,073 · Dockerfile 3,047 · Shell 1,044 · CoffeeScript 916) shows `0.2` still leaves CSS (157,224 × 0.2 = 31,444.8) ranked #3, ahead of TypeScript (17,887) — not enough to satisfy "more weight to base languages." **Use `0.1` instead.** At `0.1`: Ruby (170,805) > JavaScript (104,966) > TypeScript (17,887) > Python (9,783) > HTML (1,210.3) > MATLAB (559.7) > Haml (407.3) — four real application languages lead before any markup language appears. This is the value to use in Task 1's code, not the spec's `0.2`.
- No recency weighting (explicitly ruled out).
- Manifest parsing is per-format: `package.json` via `JSON.parse`, `Gemfile` via a `gem 'name'` regex, `requirements.txt` via line-splitting and version-specifier stripping — not a generic substring search.
- Both `getPrimarySkills` and `getSecondarySkills` must never throw on a single bad repo/manifest — same resilience pattern already used by `getCredlyBadges`/`getPlatziDiplomas` in this codebase (catch per-item, skip, don't fail the whole batch).
- Secondary Skills = manifest-detected names ∪ a short hardcoded `SUPPLEMENTARY_SKILLS` list (infra/tooling that can't appear in a manifest) — both are real, deliberate parts of the design, not a fallback for one or the other.
- Home layout: fixed-width sidebar (photo, name, title, contact, spoken languages, CV buttons) + wide content column (Primary Skills bars → Secondary Skills pills → Statistics), per the approved visual-companion mockup.
- No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>`, `npm run build`, a live-data verification script (matching the `scripts/verify-credly.ts` precedent), and `curl`/`grep` checks against server-rendered HTML.

---

### Task 1: `src/lib/skills.ts` — primary/secondary skill computation

**Files:**
- Create: `src/lib/skills.ts`
- Create: `scripts/verify-skills.ts`
- Modify: `package.json` (add `verify:skills` script)

**Interfaces:**
- Consumes: `Repo` type from `./github` (`id`, `name`, `language`, `languages?: Record<string, number>`, ...).
- Produces: `PrimarySkill` interface (`{ name: string; score: number }`), `getPrimarySkills(repos: Repo[], limit?: number): PrimarySkill[]`, `getSecondarySkills(username: string, repos: Repo[]): Promise<string[]>`.

- [ ] **Step 1: Write `src/lib/skills.ts`**

```ts
// src/lib/skills.ts
import { Repo } from './github';

// Markup, styling, and infra/config file types — down-weighted so they never
// crowd out real application languages in the Primary Skills ranking, even
// when they account for a large share of raw bytes (e.g. CSS in a small
// frontend project). Everything NOT in this list defaults to full weight —
// this is a downweight list, not an allowlist, so a language never seen in
// this account yet (Go, Java, Rust, ...) is still weighted correctly the
// first time it shows up. MATLAB is included deliberately: for this
// backend-developer portfolio, a coursework language shouldn't compete with
// Ruby/Python/JS in the ranking.
const DOWNWEIGHTED_LANGUAGES = new Set([
  'CSS', 'HTML', 'SCSS', 'Less', 'Dockerfile', 'Shell', 'Makefile', 'YAML',
  'Haml', 'Slim', 'ERB', 'MATLAB', 'Jupyter Notebook', 'TOML', 'XML',
  'Vim Script', 'Batchfile', 'PowerShell',
]);
const DOWNWEIGHT_FACTOR = 0.1;

export interface PrimarySkill {
  name: string;
  /** 0-1, normalized relative to the top-scoring skill — use directly as a bar width percentage. */
  score: number;
}

export function getPrimarySkills(repos: Repo[], limit = 7): PrimarySkill[] {
  const totals: Record<string, number> = {};
  for (const repo of repos) {
    if (!repo.languages) continue;
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      const weight = DOWNWEIGHTED_LANGUAGES.has(lang) ? DOWNWEIGHT_FACTOR : 1;
      totals[lang] = (totals[lang] ?? 0) + bytes * weight;
    }
  }

  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = ranked.length > 0 ? ranked[0][1] : 0;

  return ranked.map(([name, weightedBytes]) => ({
    name,
    score: max > 0 ? weightedBytes / max : 0,
  }));
}

// dependency/gem/package name → display name. Only names in this map are
// ever surfaced — everything else in a manifest (@types/*, eslint, rubocop,
// etc.) is intentionally ignored as noise.
const KNOWN_FRAMEWORKS: Record<string, string> = {
  // npm (package.json dependencies + devDependencies)
  react: 'React', next: 'Next.js', vue: 'Vue.js', express: 'Express',
  tailwindcss: 'Tailwind CSS', vite: 'Vite', redux: 'Redux',
  '@nestjs/core': 'NestJS',
  // RubyGems (Gemfile)
  rails: 'Ruby on Rails', sinatra: 'Sinatra', pg: 'PostgreSQL',
  mysql2: 'MySQL', redis: 'Redis', sidekiq: 'Sidekiq', devise: 'Devise',
  rspec: 'RSpec',
  // pip (requirements.txt)
  fastapi: 'FastAPI', django: 'Django', flask: 'Flask',
  sqlalchemy: 'SQLAlchemy', psycopg2: 'PostgreSQL', celery: 'Celery',
};

// Infra/cloud/tooling skills that are real but structurally invisible to
// manifest parsing (no repo's package.json lists "AWS" as a dependency).
// Keep this list short — it's the one piece of this feature that isn't
// auto-verified, so every entry should be something the user actually uses.
const SUPPLEMENTARY_SKILLS = [
  'Docker', 'GitHub Actions', 'AWS (Lambda, S3, RDS)', 'Heroku', 'Datadog', 'New Relic',
];

/** Extracts dependency names from a manifest's raw text, per file format. */
function extractDependencyNames(path: string, text: string): string[] {
  if (path === 'package.json') {
    try {
      const pkg = JSON.parse(text);
      return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    } catch {
      return [];
    }
  }
  if (path === 'Gemfile') {
    const names: string[] = [];
    const gemLine = /^\s*gem\s+['"]([\w-]+)['"]/gm;
    let match: RegExpExecArray | null;
    while ((match = gemLine.exec(text)) !== null) names.push(match[1]);
    return names;
  }
  if (path === 'requirements.txt') {
    return text
      .split('\n')
      .map((line) => line.split('#')[0].trim()) // strip comments
      .filter(Boolean)
      .map((line) => line.split(/[=<>~!]/)[0].trim()) // strip version specifiers
      .filter(Boolean);
  }
  return [];
}

export async function getSecondarySkills(username: string, repos: Repo[]): Promise<string[]> {
  const detected = new Set<string>();
  const headers: HeadersInit = {};
  if (process.env.GITHUB_ACCESS_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_ACCESS_TOKEN}`;
  }

  await Promise.all(
    repos.map(async (repo) => {
      const langs = repo.languages ? Object.keys(repo.languages) : [];
      const manifestPaths: string[] = [];
      if (langs.includes('JavaScript') || langs.includes('TypeScript')) manifestPaths.push('package.json');
      if (langs.includes('Ruby')) manifestPaths.push('Gemfile');
      if (langs.includes('Python')) manifestPaths.push('requirements.txt');

      for (const path of manifestPaths) {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/contents/${path}`,
            { headers }
          );
          if (!res.ok) continue; // 404 is expected/common — not every repo has every manifest
          const { content } = await res.json();
          const text = Buffer.from(content, 'base64').toString('utf-8');
          for (const depName of extractDependencyNames(path, text)) {
            const displayName = KNOWN_FRAMEWORKS[depName];
            if (displayName) detected.add(displayName);
          }
        } catch {
          // network/parse error on one repo's manifest — skip it, don't fail the whole build
        }
      }
    })
  );

  return [...detected, ...SUPPLEMENTARY_SKILLS];
}
```

- [ ] **Step 2: Write the verification script**

```ts
// scripts/verify-skills.ts
import { getRepositories } from '../src/lib/github';
import { getPrimarySkills, getSecondarySkills } from '../src/lib/skills';

const username = process.argv[2] ?? 'afelopez';

getRepositories(username).then(async (repos) => {
  const primary = getPrimarySkills(repos);
  console.log(`Primary Skills for "${username}":`);
  console.log(JSON.stringify(primary, null, 2));

  const secondary = await getSecondarySkills(username, repos);
  console.log(`\nSecondary Skills for "${username}":`);
  console.log(JSON.stringify(secondary, null, 2));

  if (primary.length === 0) {
    console.error('No primary skills returned — check the language weighting logic.');
    process.exit(1);
  }
});
```

- [ ] **Step 3: Add the npm script**

In `package.json`, add to `"scripts"`:
```json
"verify:skills": "tsx scripts/verify-skills.ts"
```
(`tsx` is already a devDependency from the certificates feature — no new install needed.)

- [ ] **Step 4: Run it against the real account**

Run: `npm run verify:skills`
Expected: "Primary Skills" list where `"Ruby"` is first with `"score": 1`, `"JavaScript"` is second, and `"CSS"` does **not** appear ahead of `"TypeScript"` or `"Python"` in the list (confirms the `0.1` downweight factor, not the spec's original `0.2`, is what's actually in the code). "Secondary Skills" list includes at minimum `"React"` (from `ratopro`'s real `package.json`, already confirmed to list `react` as a dependency during design) plus the 6 `SUPPLEMENTARY_SKILLS` entries (`Docker`, `GitHub Actions`, `AWS (Lambda, S3, RDS)`, `Heroku`, `Datadog`, `New Relic`).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/skills.ts scripts/verify-skills.ts package.json
git commit -m "feat: add GitHub-derived primary/secondary skill computation"
```

---

### Task 2: Wire into `page.tsx` and restructure `Profile.tsx`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Profile.tsx`
- Delete: `src/components/Stars.tsx` (if confirmed unused — see Step 1)

**Interfaces:**
- Consumes: `getPrimarySkills`, `getSecondarySkills`, `PrimarySkill` from `@/lib/skills` (Task 1).

- [ ] **Step 1: Confirm `Stars` has no other consumers before deleting it**

Run: `grep -rn "Stars" /home/afelopez/Projects/portfolio/src --include="*.tsx" --include="*.ts"`

Expected: only `src/components/Stars.tsx` itself (the component definition) and `src/components/Profile.tsx` (the current `import Stars from './Stars';` and its one usage) — both of which this task is about to remove. If any other file shows up, STOP and report BLOCKED rather than deleting.

- [ ] **Step 2: Delete `Stars.tsx`**

```bash
rm src/components/Stars.tsx
```

- [ ] **Step 3: Wire `page.tsx`**

Change:
```tsx
import Profile from '@/components/Profile';
import { getRepositories } from '@/lib/github';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  return <Profile repos={repos} />;
}
```
to:
```tsx
import Profile from '@/components/Profile';
import { getRepositories } from '@/lib/github';
import { getPrimarySkills, getSecondarySkills } from '@/lib/skills';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  const primarySkills = getPrimarySkills(repos);
  const secondarySkills = await getSecondarySkills('afelopez', repos);
  return <Profile repos={repos} primarySkills={primarySkills} secondarySkills={secondarySkills} />;
}
```

- [ ] **Step 4: Rewrite `Profile.tsx`**

Replace the entire file with:

```tsx
'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Repo } from '@/lib/github';
import { PrimarySkill } from '@/lib/skills';

interface ProfileProps {
  repos: Repo[];
  primarySkills: PrimarySkill[];
  secondarySkills: string[];
}

const spokenLanguages = [
  { lang: 'Spanish', level: 'Native' },
  { lang: 'English', level: 'B2' },
];

const Profile = ({ repos, primarySkills, secondarySkills }: ProfileProps) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="py-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
    >
      <div className="glass rounded-2xl p-8">
        <div className="flex flex-col gap-10 md:flex-row">
          {/* Sidebar: fixed-width profile panel */}
          <div className="flex flex-col items-center text-center md:w-64 md:flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Image
                src="/profile.png" // Placeholder
                alt="Profile Picture"
                width={150}
                height={150}
                className="rounded-full border-4 border-white dark:border-gray-800 shadow-xl"
                loading="eager"
              />
            </motion.div>
            <h1 className="text-3xl font-bold mt-4">Andres Lopez</h1>
            <p className="text-md text-gray-500 dark:text-gray-400 mt-2">
              Backend Developer
            </p>
            <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
              <p><a href="mailto:dev.andres.lopez@gmail.com" className="hover:text-teal-500">dev.andres.lopez@gmail.com</a></p>
              <p><a href="https://linkedin.com/in/afelopez" target="_blank" rel="noopener noreferrer" className="hover:text-teal-500">linkedin.com/in/afelopez</a></p>
              <p>(+34) 644 980 908</p>
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {spokenLanguages.map((lang) => (
                <p key={lang.lang}>
                  <span className="font-medium">{lang.lang}</span> — {lang.level}
                </p>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/cv_en.pdf"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/60 bg-teal-600/25 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
              >
                ↓ CV (EN)
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/cv_es.pdf"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/60 bg-teal-600/25 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
              >
                ↓ CV (ES)
              </motion.a>
            </div>
          </div>

          {/* Content: Primary Skills -> Secondary Skills -> Statistics */}
          <div className="flex-1 min-w-0 space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-4">Primary Skills</h2>
              <div className="space-y-3">
                {primarySkills.map((skill, i) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                  >
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-teal-600/15 dark:bg-teal-500/10">
                      <div
                        className="h-2.5 rounded-full bg-teal-600 dark:bg-teal-400"
                        style={{ width: `${Math.max(skill.score * 100, 4)}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Secondary Skills</h2>
              <div className="flex flex-wrap gap-2">
                {secondarySkills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Statistics</h2>
              <div className="flex gap-10">
                <div className="text-left">
                  <p className="text-3xl font-bold">{repos.length}</p>
                  <p className="text-gray-500 dark:text-gray-400">Public Repos</p>
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold">5+</p>
                  <p className="text-gray-500 dark:text-gray-400">Years of Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Profile;
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/app/page.tsx src/components/Profile.tsx`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0, same route table as before (`/`, `/certificates`, `/projects`, `/repositories`).

- [ ] **Step 6: Live render check**

A dev server may already be running in the user's own terminal on port 3000 (check `ps aux | grep "next dev"` first) — if so, `curl` against it directly and do not start/stop it. Otherwise, run `npm run dev &`, wait ~6 seconds.

```bash
curl -s http://localhost:3000/ -o /tmp/home-check.html
grep -o 'Primary Skills' /tmp/home-check.html | head -1
grep -o '>Ruby<' /tmp/home-check.html | head -1
grep -o 'Secondary Skills' /tmp/home-check.html | head -1
grep -c 'Statistics' /tmp/home-check.html
```
Expected: `Primary Skills` found, `Ruby` found (confirms it's actually rendering the real top skill, not an empty list), `Secondary Skills` found, `Statistics` count > 0.

If you started your own dev server for this check, stop it afterward (find and kill the `next dev` process). If it was already running before you started, leave it running.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/Profile.tsx src/components/Stars.tsx
git commit -m "feat: redesign home page with GitHub-driven skills (sidebar layout)"
```

(`git add` on `src/components/Stars.tsx` correctly stages its deletion, since Step 2 already removed it from disk with a plain `rm` — no need for `git rm` here.)

---

## Final Manual QA (after Task 2, in a real browser)

1. Open `http://localhost:3000/`.
2. Confirm the layout is now sidebar (photo/name/title/contact/languages/CV buttons) + wide content column, not the old 3-column grid.
3. Confirm Primary Skills renders as horizontal teal bars, Ruby's bar at full width, other languages proportionally shorter, no CSS/HTML crowding out real languages near the top.
4. Confirm Secondary Skills shows real detected frameworks (at least "React") plus the supplementary infra list (Docker, GitHub Actions, AWS, Heroku, Datadog, New Relic).
5. Confirm Statistics still shows the real repo count and "5+ Years of Experience".
6. Confirm spoken languages (Spanish/English) still appear, now in the sidebar under contact info.
7. Resize to mobile width — confirm the sidebar stacks above the content column cleanly.
