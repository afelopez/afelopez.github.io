# GitHub-Driven Skills & Home Redesign (Revision 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the relative, byte-volume-based Primary Skills scoring (shipped earlier on this same branch) with an absolute 4-factor formula — self-perception, project count, recency, RedMonk popularity — that excludes markup/infra languages from Primary Skills entirely, and extend skill computation to include the user's private repos without ever exposing private repo details on the public site.

**Architecture:** `src/lib/github.ts` gains a second, authenticated repo-fetching function (`getRepositoriesForSkills`) used only for scoring; `src/lib/skills.ts` is rewritten with the new formula, a manually-maintained self-perception table, and a RedMonk popularity table; `src/app/page.tsx` is the only call site that wires the two data sources together, and is the file responsible for keeping private-repo data out of any Client Component prop.

**Tech Stack:** Next.js 16 App Router (Server Components), TypeScript, GitHub REST API v3, `tsx` for standalone verification scripts (no test framework in this repo).

**Branch:** `feature/github-skills-home-redesign` (already exists, has Revision 1 commits `2fc7d67`..`5a2d36d` plus the Revision 2 spec commit `b14f4f8`). Continue on this branch — do not create a new one.

## Global Constraints

- Formula: `score = selfPerception×0.45 + projectScore×0.25 + recencyScore×0.15 + popularityScore×0.15`, every language scored independently (never relative to another language's score).
- `projectScore = min(projectCount / 5, 1)` — `projectCount` = number of the user's own (non-fork) repos containing that language.
- `recencyScore = max(0, 1 - daysSinceLastPush / 730)` — `daysSinceLastPush` from the most recent `pushed_at` among the user's own (non-fork) repos containing that language; `0` if no such repo exists.
- `popularityScore = max(0, 1 - (redmonkRank - 1) / 20)`; unranked languages use rank `21` (score `0`).
- `SELF_PERCEIVED_SKILL` exact values: `Ruby: 85, JavaScript: 30, TypeScript: 10, Python: 65, Java: 40, Go: 40`. Default for an unlisted category-1 language: `50`.
- `REDMONK_RANK` exact values (RedMonk Q1 2026, published 2026-04-14): `JavaScript: 1, Python: 2, Java: 3, PHP: 4, 'C#': 4, TypeScript: 6, CSS: 7, 'C++': 7, Ruby: 9, C: 10, Swift: 11, Go: 12, R: 13, Shell: 14, Kotlin: 14, Scala: 14, PowerShell: 17, Dart: 18, 'Objective-C': 18, Rust: 20`.
- `CATEGORY_2_LANGUAGES` exact set (markup/styling/infra — excluded from Primary Skills, added to Secondary Skills instead): `CSS, HTML, SCSS, Less, Dockerfile, Shell, Makefile, YAML, Haml, Slim, ERB, MATLAB, Jupyter Notebook, TOML, XML, Vim Script, Batchfile, PowerShell`.
- `getPrimarySkills` default `limit`: `8`.
- Fork exclusion (`repo.fork === true`) applies to both `getPrimarySkills` and `getSecondarySkills`, unchanged from Revision 1.
- **Privacy boundary (hard constraint):** the private-inclusive repo array returned by `getRepositoriesForSkills` must never be passed as a prop to a Client Component (anything with `'use client'`, e.g. `Profile.tsx`). Only the derived, anonymized outputs (`PrimarySkill[]`, `string[]`) may cross that boundary. `/repositories` (`src/app/repositories/page.tsx`) must keep using the public-only `getRepositories` — do not touch that file.
- No test framework exists in this repo. Verification uses `npx tsc --noEmit`, scoped `npx eslint <files>`, `npm run build`, and standalone `tsx` scripts (some hitting the real GitHub API, one running fully offline against fixture data) — consistent with `scripts/verify-credly.ts` / `scripts/verify-platzi.ts` / `scripts/verify-skills.ts` already in this repo.

---

### Task 1: Private-repo data source in `src/lib/github.ts`

**Files:**
- Modify: `src/lib/github.ts` (full file, currently 40 lines)

**Interfaces:**
- Produces: `Repo.pushed_at: string` (new required field on the existing `Repo` interface); `getRepositoriesForSkills(username: string): Promise<Repo[]>` (new export, public+private repos owned by the authenticated user, falls back to `getRepositories` if no token).
- Consumes: nothing new — same `fetch` + `GITHUB_ACCESS_TOKEN` pattern the file already uses.

- [ ] **Step 1: Write the temporary verification script**

Create `scripts/_verify-task1-repos-for-skills.ts`:

```ts
import { getRepositories, getRepositoriesForSkills } from '../src/lib/github';

const username = 'afelopez';

Promise.all([getRepositories(username), getRepositoriesForSkills(username)]).then(([pub, all]) => {
  console.log(`Public repos: ${pub.length}`);
  console.log(`Public+private repos (skills): ${all.length}`);
  const missingPushedAt = all.filter((r) => !r.pushed_at);
  console.log(`Repos missing pushed_at: ${missingPushedAt.length}`);
  if (missingPushedAt.length > 0) {
    console.error('FAIL: some repos are missing pushed_at');
    process.exit(1);
  }
  if (all.length < pub.length) {
    console.error('FAIL: getRepositoriesForSkills returned fewer repos than getRepositories');
    process.exit(1);
  }
  console.log('PASS');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx --env-file=.env.local scripts/_verify-task1-repos-for-skills.ts`
Expected: TypeScript compile error — `Module '"../src/lib/github"' has no exported member 'getRepositoriesForSkills'`.

- [ ] **Step 3: Implement the full rewrite of `src/lib/github.ts`**

```ts
// src/lib/github.ts
export interface Repo {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  html_url: string;
  language: string;
  languages_url: string;
  languages?: Record<string, number>;
  updated_at?: string;
  pushed_at: string;
  has_pages: boolean;
  fork: boolean;
}

async function attachLanguages(repos: Repo[], headers: HeadersInit): Promise<Repo[]> {
  return Promise.all(
    repos.map(async (repo) => {
      const langRes = await fetch(repo.languages_url, { headers });
      if (langRes.ok) {
        repo.languages = await langRes.json();
      }
      return repo;
    })
  );
}

export async function getRepositories(username: string): Promise<Repo[]> {
  const headers: HeadersInit = {};
  if (process.env.GITHUB_ACCESS_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_ACCESS_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch repositories: ${res.statusText}`);
  }
  const repos: Repo[] = await res.json();

  return attachLanguages(repos, headers);
}

/**
 * Public + private repos owned by the authenticated user (requires
 * GITHUB_ACCESS_TOKEN with `repo` scope). Used ONLY for skills computation
 * — never for any page that lists or links to individual repos. Falls back
 * to public-only data if no token is configured.
 */
export async function getRepositoriesForSkills(username: string): Promise<Repo[]> {
  if (!process.env.GITHUB_ACCESS_TOKEN) {
    return getRepositories(username);
  }

  const headers: HeadersInit = { Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}` };
  const res = await fetch(
    'https://api.github.com/user/repos?affiliation=owner&visibility=all&sort=updated',
    { headers }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch repositories for skills: ${res.statusText}`);
  }
  const repos: Repo[] = await res.json();

  return attachLanguages(repos, headers);
}
```

- [ ] **Step 4: Run the verification script again to verify it passes**

Run: `npx tsx --env-file=.env.local scripts/_verify-task1-repos-for-skills.ts`
Expected: Two counts printed, `Repos missing pushed_at: 0`, then `PASS`. (If `Public+private repos (skills)` equals `Public repos`, that's expected when the account has no private repos or the token lacks `repo` scope — not a failure, just report the real numbers in your report file.)

- [ ] **Step 5: Type-check, lint, delete the temp script, commit**

```bash
npx tsc --noEmit
npx eslint src/lib/github.ts
rm scripts/_verify-task1-repos-for-skills.ts
git add src/lib/github.ts
git commit -m "feat: add getRepositoriesForSkills for private-inclusive skill scoring"
```

---

### Task 2: Rewrite `src/lib/skills.ts` with the 4-factor absolute formula

**Files:**
- Modify: `src/lib/skills.ts` (full file rewrite)
- Create: `scripts/verify-skills-formula.ts` (permanent, offline fixture-based regression check — no network/token needed)
- Modify: `package.json` (add `verify:skills-formula` script)

**Interfaces:**
- Consumes: `Repo` from `../lib/github` — specifically `repo.fork: boolean`, `repo.languages?: Record<string, number>`, `repo.pushed_at: string` (all present after Task 1).
- Produces: `export interface PrimarySkill { name: string; score: number }`; `export function getPrimarySkills(repos: Repo[], limit = 8): PrimarySkill[]`; `export async function getSecondarySkills(username: string, repos: Repo[]): Promise<string[]>`; `export const SELF_PERCEIVED_SKILL: Record<string, number>`.

- [ ] **Step 1: Write the failing fixture test**

Create `scripts/verify-skills-formula.ts`:

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
  if (skill.name === 'CSS' || skill.name === 'Rust') {
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
Expected: FAIL — against the current (Revision 1) `getPrimarySkills`, scores are relative-to-max percentages, not the new absolute formula, and `CSS` still appears in the output (Revision 1 down-weights it but doesn't exclude it). You should see multiple `FAIL:` lines and a non-zero exit code.

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
export const SELF_PERCEIVED_SKILL: Record<string, number> = {
  Ruby: 85,
  JavaScript: 30,
  TypeScript: 10,
  Python: 65,
  Java: 40,
  Go: 40,
};
// Any category-1 language found in repos but not listed above (a new
// language you start using before updating this file) falls back to this
// neutral default rather than being silently excluded.
const SELF_PERCEIVED_DEFAULT = 50;

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

  const allLanguages = new Set([
    ...Object.keys(perLanguage),
    ...Object.keys(SELF_PERCEIVED_SKILL),
  ]);

  const scored = [...allLanguages].map((name) => {
    const stats = perLanguage[name] ?? { projects: 0, mostRecentPush: null };
    const selfPerception = (SELF_PERCEIVED_SKILL[name] ?? SELF_PERCEIVED_DEFAULT) / 100;
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
      if (CATEGORY_2_LANGUAGES.has(lang)) detected.add(lang);
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
Expected: the JSON printout shows exactly `Ruby, JavaScript, Python, TypeScript, Java, Go` in that order, no `CSS`/`Rust`, then `PASS`.

- [ ] **Step 5: Add the npm script**

In `package.json`, add to `"scripts"` (alongside the existing `verify:*` entries):

```json
"verify:skills-formula": "tsx scripts/verify-skills-formula.ts"
```

- [ ] **Step 6: Live sanity check against the real account**

Run: `npm run verify:skills`
Expected: succeeds (this still calls `getRepositories`, unchanged signature-wise, so it runs against public repos only at this point in the plan — that's expected and corrected in Task 3). Confirm the printed order is `Ruby, JavaScript, Python/TypeScript/...` per the language mix your public repos actually have, and that no category-2 language (CSS, HTML, etc.) appears in the primary list — check the secondary list instead, where it should now appear as a plain tag.

- [ ] **Step 7: Type-check, lint, commit**

```bash
npx tsc --noEmit
npx eslint src/lib/skills.ts scripts/verify-skills-formula.ts
git add src/lib/skills.ts scripts/verify-skills-formula.ts package.json
git commit -m "feat: replace relative byte-volume scoring with absolute 4-factor formula"
```

---

### Task 3: Wire private-inclusive skill scoring into the home page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `scripts/verify-skills.ts`

**Interfaces:**
- Consumes: `getRepositories`, `getRepositoriesForSkills` (from Task 1); `getPrimarySkills`, `getSecondarySkills` (from Task 2).
- Produces: nothing new — this is the final wiring task.

- [ ] **Step 1: Update `scripts/verify-skills.ts` to exercise the real data flow**

Replace the full contents of `scripts/verify-skills.ts`:

```ts
import { getRepositories, getRepositoriesForSkills } from '../src/lib/github';
import { getPrimarySkills, getSecondarySkills } from '../src/lib/skills';

const username = process.argv[2] ?? 'afelopez';

Promise.all([getRepositories(username), getRepositoriesForSkills(username)]).then(
  async ([publicRepos, skillsRepos]) => {
    console.log(`Public repos: ${publicRepos.length}`);
    console.log(`Public+private repos used for skills: ${skillsRepos.length}`);

    const primary = getPrimarySkills(skillsRepos);
    console.log(`\nPrimary Skills for "${username}":`);
    console.log(JSON.stringify(primary, null, 2));

    const secondary = await getSecondarySkills(username, skillsRepos);
    console.log(`\nSecondary Skills for "${username}":`);
    console.log(JSON.stringify(secondary, null, 2));

    if (primary.length === 0) {
      console.error('No primary skills returned — check the language weighting logic.');
      process.exit(1);
    }
  }
);
```

- [ ] **Step 2: Run it against the real account**

Run: `npm run verify:skills`
Expected: prints both repo counts, then the ranked Primary Skills list (Ruby leading per the formula), then Secondary Skills including any category-2 languages your repos actually contain. Note the real counts and top few scores in your report file.

- [ ] **Step 3: Update `src/app/page.tsx`**

Replace the full contents of `src/app/page.tsx`:

```tsx
import Profile from '@/components/Profile';
import { getRepositories, getRepositoriesForSkills } from '@/lib/github';
import { getPrimarySkills, getSecondarySkills } from '@/lib/skills';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  const skillsRepos = await getRepositoriesForSkills('afelopez');

  const primarySkills = getPrimarySkills(skillsRepos);
  const secondarySkills = await getSecondarySkills('afelopez', skillsRepos);

  return <Profile repos={repos} primarySkills={primarySkills} secondarySkills={secondarySkills} />;
}
```

Note the constraint from the plan header: `skillsRepos` must not be passed to `Profile` or any other Client Component — only `primarySkills` and `secondarySkills` (both already anonymized) are.

- [ ] **Step 4: Type-check, lint, build**

```bash
npx tsc --noEmit
npx eslint src/app/page.tsx scripts/verify-skills.ts
npm run build
```

Expected: all three succeed with no errors.

- [ ] **Step 5: Manual privacy check against the rendered home page**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000 | grep -o 'href="[^"]*"' | sort -u
kill %1
```

Expected: the only `href`s present are the known public ones (`mailto:`, `linkedin.com/in/afelopez`, `/cv_en.pdf`, `/cv_es.pdf`, nav links, and any framework/Next.js internal asset paths) — no `github.com/afelopez/<repo>` links and no repo names appear anywhere in the output. `Profile.tsx` doesn't render individual repos, so this should hold structurally; this step confirms it wasn't accidentally broken by this task.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx scripts/verify-skills.ts
git commit -m "feat: use private-inclusive repo data for home page skill scoring"
```

---

## Self-Review Notes

- **Spec coverage:** §3 (formula + category exclusion) → Task 2. §4 (secondary skills incl. category-2 tags) → Task 2. §5 (private repos + privacy mechanism) → Tasks 1 & 3. §6 (layout) → no task, unchanged from Revision 1, already implemented and merged into this branch's earlier commits (`189f03a`), nothing left to do. §7 file table → covered across all three tasks. §9 (verification) → the fixture script (Task 2) plus the live `verify:skills` script (Task 3) plus the manual curl check (Task 3) together cover it.
- **Placeholder scan:** none found — every step has complete code or an exact command with expected output.
- **Type consistency:** `Repo.pushed_at: string` (Task 1) is consumed by `getPrimarySkills` (Task 2) and by the fixture builder in `scripts/verify-skills-formula.ts` (Task 2) — same field name and type throughout. `getPrimarySkills(repos: Repo[], limit = 8): PrimarySkill[]` and `getSecondarySkills(username: string, repos: Repo[]): Promise<string[]>` signatures are unchanged from Revision 1, so Task 3's call sites need no signature updates beyond swapping which `Repo[]` is passed in.
