# Primary Skills Scope Fix & Two-Column Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict Primary Skills to exactly the languages the user has rated in `SELF_PERCEIVED_SKILL` (fixing PLpgSQL/CoffeeScript leaking in via auto-detection), route any non-primary language to Secondary Skills as a plain tag, and split the Primary/Secondary Skills section into an asymmetric two-column grid on desktop with a capped animation stagger.

**Architecture:** `src/lib/skills.ts`'s `getPrimarySkills` changes its candidate set from "every detected category-1 language ∪ self-perceived languages" to "self-perceived languages only"; `getSecondarySkills`'s language-tag detection generalizes from a category-2-only check to "any language not in the self-perception allowlist." `src/components/Profile.tsx` wraps the existing Primary/Secondary blocks in a responsive grid and adjusts one `transition` prop — no data-flow changes, `Profile`'s prop interface is untouched.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion. No test framework in this repo — verification via `tsc --noEmit`, scoped `eslint`, `npm run build`, the existing offline fixture script (`scripts/verify-skills-formula.ts`), and manual multi-width browser checks.

**Branch:** create `feature/primary-skills-scope-and-layout` off `main` (the previous feature branch was already merged and deleted).

## Global Constraints

- `getPrimarySkills` must iterate `Object.keys(SELF_PERCEIVED_SKILL)` only — no auto-detected language may enter the candidate set, regardless of repo activity.
- `SELF_PERCEIVED_DEFAULT` must be deleted from `src/lib/skills.ts` — it becomes dead code once `getPrimarySkills` no longer needs a fallback for unrated languages.
- `getSecondarySkills`'s language-tag loop must use `!(lang in SELF_PERCEIVED_SKILL)` (the `in` operator, not truthiness — a future self-perception value of literally `0` must still count as "primary, rated low," not fall through to secondary).
- The `CATEGORY_2_LANGUAGES` guard inside `getPrimarySkills`'s `perLanguage`-building loop stays — it's a defense-in-depth safety net, not dead code, even though the final candidate set no longer needs it for filtering purposes.
- Layout: Primary/Secondary split into a 12-column grid at `lg:` (1024px) — `grid-cols-1 lg:grid-cols-12 lg:items-start lg:gap-8`, Primary at `lg:col-span-5`, Secondary at `lg:col-span-7`. Below `lg:`, both stay stacked full-width exactly as today (including the `md:` sidebar split, unaffected).
- Secondary Skills' per-tag animation delay must be `Math.min(0.03 * i, 0.5)` — total stagger spread capped at 0.5s regardless of tag count. Primary Skills' animation (`delay: 0.1 * i`) is unchanged (bounded by `limit = 8`).
- No changes to `src/app/page.tsx`, `src/lib/github.ts`, `/repositories`, or any route other than the home page's `Profile` rendering.

---

### Task 1: Restrict Primary Skills to the self-perception allowlist

**Files:**
- Modify: `src/lib/skills.ts` (full file, currently 199 lines)
- Modify: `scripts/verify-skills-formula.ts` (full file — existing offline fixture regression test)

**Interfaces:**
- Consumes: `Repo` from `./github` (`fork`, `languages`, `pushed_at`) — unchanged from before this task.
- Produces: `getPrimarySkills(repos: Repo[], limit = 8): PrimarySkill[]` and `getSecondarySkills(username: string, repos: Repo[]): Promise<string[]>` — same signatures as before this task, only their internal candidate-selection logic changes. `PrimarySkill { name: string; score: number }` interface unchanged.

- [ ] **Step 1: Write the failing fixture test**

Replace the full contents of `scripts/verify-skills-formula.ts`:

```ts
import { getPrimarySkills } from '../src/lib/skills';
import { Repo } from '../src/lib/github';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function makeRepo(name: string, languages: Record<string, number>, pushedAt: string, fork = false): Repo {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    name,
    description: '',
    stargazers_count: 0,
    html_url: '',
    language: Object.keys(languages)[0] ?? '',
    languages_url: '',
    languages,
    pushed_at: pushedAt,
    has_pages: false,
    fork,
  };
}

const repos: Repo[] = [
  makeRepo('ruby-1', { Ruby: 50000 }, daysAgo(5)),
  makeRepo('ruby-2', { Ruby: 40000 }, daysAgo(30)),
  makeRepo('ruby-3', { Ruby: 30000 }, daysAgo(60)),
  makeRepo('ruby-4', { Ruby: 20000, CSS: 5000 }, daysAgo(90)),
  makeRepo('js-1', { JavaScript: 20000 }, daysAgo(4)),
  makeRepo('js-2', { JavaScript: 20000 }, daysAgo(10)),
  makeRepo('js-3', { JavaScript: 20000 }, daysAgo(20)),
  makeRepo('js-4', { JavaScript: 20000 }, daysAgo(30)),
  makeRepo('js-5', { JavaScript: 20000 }, daysAgo(40)),
  makeRepo('ts-1', { TypeScript: 15000 }, daysAgo(5)),
  makeRepo('py-1', { Python: 5000 }, daysAgo(459)),
  makeRepo('py-2', { Python: 4000 }, daysAgo(500)),
  makeRepo('fork-1', { Rust: 999999 }, daysAgo(1), true),
  makeRepo('sql-1', { PLpgSQL: 8000 }, daysAgo(2)),
];

const REDMONK_RANK: Record<string, number> = {
  JavaScript: 1, Python: 2, Java: 3, TypeScript: 6, Ruby: 9, Go: 12,
};
const SELF_PERCEIVED: Record<string, number> = {
  Ruby: 85, JavaScript: 30, TypeScript: 10, Python: 65, Java: 40, Go: 40,
};

function expectedScore(lang: string, projectCount: number, mostRecentDaysAgo: number | null): number {
  const popularity = Math.max(0, 1 - (REDMONK_RANK[lang] - 1) / 20);
  const recency = mostRecentDaysAgo === null ? 0 : Math.max(0, 1 - mostRecentDaysAgo / 730);
  const project = Math.min(projectCount / 5, 1);
  const self = SELF_PERCEIVED[lang] / 100;
  return self * 0.45 + project * 0.25 + recency * 0.15 + popularity * 0.15;
}

const expected: Record<string, number> = {
  Ruby: expectedScore('Ruby', 4, 5),
  JavaScript: expectedScore('JavaScript', 5, 4),
  TypeScript: expectedScore('TypeScript', 1, 5),
  Python: expectedScore('Python', 2, 459),
  Java: expectedScore('Java', 0, null),
  Go: expectedScore('Go', 0, null),
};

const primary = getPrimarySkills(repos);
console.log(JSON.stringify(primary, null, 2));

let failed = false;

for (const skill of primary) {
  if (skill.name === 'CSS' || skill.name === 'Rust' || skill.name === 'PLpgSQL') {
    console.error(`FAIL: "${skill.name}" must not appear in Primary Skills`);
    failed = true;
  }
}

for (const [name, exp] of Object.entries(expected)) {
  const actual = primary.find((s) => s.name === name)?.score;
  if (actual === undefined) {
    console.error(`FAIL: expected "${name}" in Primary Skills, not found`);
    failed = true;
    continue;
  }
  if (Math.abs(actual - exp) > 0.005) {
    console.error(`FAIL: ${name} expected ${exp.toFixed(4)}, got ${actual.toFixed(4)}`);
    failed = true;
  }
}

if (primary.length !== 6) {
  console.error(
    `FAIL: expected exactly 6 primary skills (the SELF_PERCEIVED_SKILL entries), got ${primary.length}: ${primary.map((s) => s.name).join(', ')}`
  );
  failed = true;
}

const order = primary.map((s) => s.name);
const expectedOrder = ['Ruby', 'JavaScript', 'Python', 'TypeScript', 'Java', 'Go'];
if (JSON.stringify(order) !== JSON.stringify(expectedOrder)) {
  console.error(`FAIL: expected order ${expectedOrder.join(', ')}, got ${order.join(', ')}`);
  failed = true;
}

if (failed) {
  console.error('FAIL');
  process.exit(1);
}
console.log('PASS');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx scripts/verify-skills-formula.ts`
Expected: FAIL — against the current `getPrimarySkills`, `PLpgSQL` is auto-detected (not markup/infra, not a fork) and enters the union with `SELF_PERCEIVED_DEFAULT = 50`, so it appears in the output and `primary.length` is 7, not 6. You should see `FAIL: "PLpgSQL" must not appear in Primary Skills` and the length-mismatch error.

- [ ] **Step 3: Implement the full rewrite of `src/lib/skills.ts`**

```ts
// src/lib/skills.ts
import { Repo } from './github';

// Category-2: markup, styling, and infra/config file types. These never
// compete for a Primary Skills slot, regardless of byte volume — CSS next
// to Ruby as a "primary skill" misrepresents a backend developer's actual
// competency profile. They still surface, as plain tags, in Secondary
// Skills. Not an allowlist: any language NOT in this set defaults to
// category-1, so a language never seen in this account yet is still
// routed correctly the first time it shows up.
const CATEGORY_2_LANGUAGES = new Set([
  'CSS', 'HTML', 'SCSS', 'Less', 'Dockerfile', 'Shell', 'Makefile', 'YAML',
  'Haml', 'Slim', 'ERB', 'MATLAB', 'Jupyter Notebook', 'TOML', 'XML',
  'Vim Script', 'Batchfile', 'PowerShell',
]);

// Manually maintained — reflects how well *you* actually know a language,
// deliberately independent of GitHub byte volume (a lot of repo code is
// AI-assisted/AI-recommended and doesn't reflect real depth). Edit this
// directly whenever your own sense of a language changes; nothing else in
// this file needs to change. Scale: 0-100.
//
// This is also the ALLOWLIST for Primary Skills: only languages listed
// here can ever appear there, regardless of how much repo activity a
// language has. A category-1 language detected in your repos but not
// listed here (e.g. a one-off PLpgSQL migration or an old CoffeeScript
// repo) is not a "primary" skill — it still shows up, just as a plain tag
// in Secondary Skills (see getSecondarySkills below).
export const SELF_PERCEIVED_SKILL: Record<string, number> = {
  Ruby: 85,
  JavaScript: 30,
  TypeScript: 10,
  Python: 65,
  Java: 40,
  Go: 40,
};

// RedMonk Programming Language Rankings, Q1 2026 (published 2026-04-14):
// https://redmonk.com/sogrady/2026/04/14/language-rankings-1-26/
// Chosen over TIOBE/PYPL: those are search-query-based (volatile month to
// month, and documented to underrate languages with strong official docs,
// e.g. TypeScript). RedMonk blends real GitHub + Stack Overflow activity
// and only updates twice a year — a more stable signal for this use case.
const REDMONK_RANK: Record<string, number> = {
  JavaScript: 1, Python: 2, Java: 3, PHP: 4, 'C#': 4, TypeScript: 6,
  CSS: 7, 'C++': 7, Ruby: 9, C: 10, Swift: 11, Go: 12, R: 13,
  Shell: 14, Kotlin: 14, Scala: 14, PowerShell: 17, Dart: 18,
  'Objective-C': 18, Rust: 20,
};
const UNRANKED_REDMONK_RANK = 21; // beyond RedMonk's tracked top 20 → popularityScore 0

function popularityScore(lang: string): number {
  const rank = REDMONK_RANK[lang] ?? UNRANKED_REDMONK_RANK;
  return Math.max(0, 1 - (rank - 1) / 20);
}

function recencyScore(mostRecentPushedAt: string | null): number {
  if (!mostRecentPushedAt) return 0;
  const days = (Date.now() - new Date(mostRecentPushedAt).getTime()) / 86_400_000;
  return Math.max(0, 1 - days / 730);
}

function projectScore(count: number): number {
  return Math.min(count / 5, 1);
}

export interface PrimarySkill {
  name: string;
  /** 0-1 absolute weighted score — use directly as a bar width percentage. */
  score: number;
}

export function getPrimarySkills(repos: Repo[], limit = 8): PrimarySkill[] {
  const perLanguage: Record<string, { projects: number; mostRecentPush: string | null }> = {};

  for (const repo of repos) {
    if (repo.fork || !repo.languages) continue;
    for (const lang of Object.keys(repo.languages)) {
      if (CATEGORY_2_LANGUAGES.has(lang)) continue;
      const entry = perLanguage[lang] ?? { projects: 0, mostRecentPush: null };
      entry.projects += 1;
      if (!entry.mostRecentPush || repo.pushed_at > entry.mostRecentPush) {
        entry.mostRecentPush = repo.pushed_at;
      }
      perLanguage[lang] = entry;
    }
  }

  const scored = Object.keys(SELF_PERCEIVED_SKILL).map((name) => {
    const stats = perLanguage[name] ?? { projects: 0, mostRecentPush: null };
    const selfPerception = SELF_PERCEIVED_SKILL[name] / 100;
    const score =
      selfPerception * 0.45 +
      projectScore(stats.projects) * 0.25 +
      recencyScore(stats.mostRecentPush) * 0.15 +
      popularityScore(name) * 0.15;
    return { name, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// dependency/gem/package name → display name. Only names in this map are
// ever surfaced — everything else in a manifest (@types/*, eslint, rubocop,
// etc.) is intentionally ignored as noise.
const KNOWN_FRAMEWORKS: Record<string, string> = {
  react: 'React', next: 'Next.js', vue: 'Vue.js', express: 'Express',
  tailwindcss: 'Tailwind CSS', vite: 'Vite', redux: 'Redux',
  '@nestjs/core': 'NestJS',
  rails: 'Ruby on Rails', sinatra: 'Sinatra', pg: 'PostgreSQL',
  mysql2: 'MySQL', redis: 'Redis', sidekiq: 'Sidekiq', devise: 'Devise',
  rspec: 'RSpec',
  fastapi: 'FastAPI', django: 'Django', flask: 'Flask',
  sqlalchemy: 'SQLAlchemy', psycopg2: 'PostgreSQL', celery: 'Celery',
};

// Infra/cloud/tooling skills that are real but structurally invisible to
// manifest parsing (no repo's package.json lists "AWS" as a dependency).
// Keep this list short — every entry should be something the user
// actually uses.
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
      .map((line) => line.split('#')[0].trim())
      .filter(Boolean)
      .map((line) => line.split(/[=<>~!]/)[0].trim())
      .filter(Boolean);
  }
  return [];
}

export async function getSecondarySkills(username: string, repos: Repo[]): Promise<string[]> {
  const detected = new Set<string>();

  for (const repo of repos) {
    if (repo.fork || !repo.languages) continue;
    for (const lang of Object.keys(repo.languages)) {
      if (!(lang in SELF_PERCEIVED_SKILL)) detected.add(lang);
    }
  }

  const headers: HeadersInit = {};
  if (process.env.GITHUB_ACCESS_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_ACCESS_TOKEN}`;
  }

  await Promise.all(
    repos.filter((repo) => !repo.fork).map(async (repo) => {
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
          if (!res.ok) continue;
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

- [ ] **Step 4: Run the fixture verification again to verify it passes**

Run: `npx tsx scripts/verify-skills-formula.ts`
Expected: the JSON printout shows exactly the 6 `SELF_PERCEIVED_SKILL` languages, in order `Ruby, JavaScript, Python, TypeScript, Java, Go`, no `CSS`/`Rust`/`PLpgSQL`, then `PASS`.

- [ ] **Step 5: Live sanity check against the real account**

Run: `npm run verify:skills`
Expected: succeeds. Primary Skills output contains only the 6 rated languages. If the real `afelopez` account still has a repo containing `PLpgSQL` or `CoffeeScript` (per this branch's prior session data), confirm they now appear in the **Secondary Skills** list instead of Primary — note the real output in your report file.

- [ ] **Step 6: Type-check, lint, commit**

```bash
npx tsc --noEmit
npx eslint src/lib/skills.ts scripts/verify-skills-formula.ts
git add src/lib/skills.ts scripts/verify-skills-formula.ts
git commit -m "fix: restrict Primary Skills to the self-perception allowlist"
```

---

### Task 2: Two-column responsive grid + capped Secondary Skills animation

**Files:**
- Modify: `src/components/Profile.tsx` (full file, currently 141 lines)

**Interfaces:**
- Consumes: `PrimarySkill[]` (`{ name, score }`) and `string[]` props — unchanged, same as this component already receives today. No changes to `ProfileProps` or any prop type.
- Produces: nothing new — this is a presentational-only change, no exports change.

This is a UI layout change with no unit-testable logic (no test framework in this repo, and JSX layout isn't something `tsx`-script verification can check). Verification is `tsc`/`eslint`/`build` plus a manual multi-width browser check, per this repo's established pattern for UI-only changes.

- [ ] **Step 1: Implement the full rewrite of `src/components/Profile.tsx`**

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

          {/* Content: Primary+Secondary Skills grid -> Statistics */}
          <div className="flex-1 min-w-0 space-y-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
              <div className="lg:col-span-5">
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

              <div className="lg:col-span-7">
                <h2 className="text-2xl font-bold mb-4">Secondary Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {secondarySkills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(0.03 * i, 0.5) }}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
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

- [ ] **Step 2: Type-check, lint, build**

```bash
npx tsc --noEmit
npx eslint src/components/Profile.tsx
npm run build
```

Expected: all three succeed with no errors.

- [ ] **Step 3: Manual multi-width browser check**

```bash
npm run dev &
sleep 3
```

Open `http://localhost:3000` in a browser and use devtools responsive mode to check three widths:

- **~375px (mobile):** sidebar stacked above content; Primary Skills stacked above Secondary Skills, both full-width; Statistics below.
- **~800px (tablet):** sidebar now side-by-side with content (`md:flex-row` already active); Primary and Secondary Skills still stacked full-width (grid is still `grid-cols-1` — `lg:` hasn't kicked in yet).
- **~1280px (desktop):** Primary Skills occupies the left ~42% of the content column, Secondary Skills the right ~58%, side by side; neither column stretches to match the other's height; Statistics remains full-width below the grid.

Also confirm: Secondary Skills tags finish animating in well under 1 second (the capped stagger), and Primary Skills bars still animate individually as before.

```bash
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Profile.tsx
git commit -m "feat: split Primary/Secondary Skills into a two-column grid at lg:, cap tag stagger delay"
```

---

## Self-Review Notes

- **Spec coverage:** §2 (Primary Skills allowlist) → Task 1. §3 (Secondary Skills generalization) → Task 1 (same file, same rewrite). §4 (two-column grid, breakpoint, proportions) → Task 2. §5 (animation cap) → Task 2. §6 file table → both tasks together cover exactly `src/lib/skills.ts` and `src/components/Profile.tsx`, nothing else. §8 (verification) → Task 1's fixture assertions plus live check; Task 2's build + three-width manual browser check.
- **Placeholder scan:** none — every step has complete code or exact commands with expected output.
- **Type consistency:** `PrimarySkill { name: string; score: number }` and `ProfileProps` are unchanged across both tasks — Task 2 consumes exactly what Task 1 produces, no signature drift. `SELF_PERCEIVED_SKILL`'s type (`Record<string, number>`) and its six keys are identical in both the spec and this plan's Task 1 code.
