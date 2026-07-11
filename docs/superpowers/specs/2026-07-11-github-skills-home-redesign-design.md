# GitHub-Driven Skills & Home Redesign
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Replace the home page's ad-hoc skill lists (repo-count language ranking, hardcoded secondary skills) with real GitHub-derived data, and reorganize `Profile.tsx` into a fixed sidebar + hierarchical content layout (validated via visual mockups — option "C").

---

## 1. Goal

Make "Primary Skills" and "Secondary Skills" on the home page reflect real GitHub activity instead of a repo-count heuristic and a hand-maintained array, and give the home page a more professional, better-spaced layout.

## 2. Research Findings (from live GitHub API calls against the real account)

- `topics` is empty on 16 of 17 repos, and the one populated repo's topics are unrelated to tech stack (`movies-rate`, `ratings-and-reviews`). **Not viable** as a Secondary Skills source.
- Fetching manifest files via the Contents API works: `GET /repos/afelopez/ratopro/contents/package.json` returned real dependencies (`react`, `react-dom`, `react-icons`, `tailwindcss`, `vite`, ...). A `Gemfile` also exists (200 OK) on a Ruby repo. **Manifest parsing is viable.**
- Real aggregate byte totals across all non-fork repos: Ruby 170,805 · CSS 157,224 · JavaScript 104,966 · TypeScript 17,887 · HTML 12,103 · Python 9,783 · MATLAB 5,597 · Haml 4,073 · Dockerfile 3,047 · Shell 1,044 · CoffeeScript 916. **CSS nearly ties Ruby by raw bytes** — a naive byte-weighted ranking would misrepresent a self-described "Backend Developer" by ranking CSS above JavaScript/TypeScript/Python. This is the concrete evidence behind the language-weighting requirement below.
- No Go or Java currently appear in any repo — the weighting mechanism must not hardcode assumptions about which languages exist, only about which *category* (base language vs. markup/infra) a language falls into if it does appear.

## 3. Primary Skills — byte-weighted, language-category-boosted

Replace `Profile.tsx`'s current logic (count of repos where a language is the single `.language` field) with a score computed from the already-fetched `.languages` byte breakdown (`Repo.languages`, populated by the existing `getRepositories`, currently unused for this purpose).

New file `src/lib/skills.ts`:

```ts
import { Repo } from './github';

// Markup, styling, and infra/config file types — down-weighted so they never
// crowd out real application languages in the Primary Skills ranking, even
// when they account for a large share of raw bytes (e.g. CSS in a small
// frontend project). Everything NOT in this list defaults to full weight —
// this is a downweight list, not an allowlist, so a language never seen in
// this account yet (Go, Java, Rust, ...) is still weighted correctly the
// first time it shows up.
const DOWNWEIGHTED_LANGUAGES = new Set([
  'CSS', 'HTML', 'SCSS', 'Less', 'Dockerfile', 'Shell', 'Makefile', 'YAML',
  'Haml', 'Slim', 'ERB', 'MATLAB', 'Jupyter Notebook', 'TOML', 'XML',
  'Vim Script', 'Batchfile', 'PowerShell',
]);
const DOWNWEIGHT_FACTOR = 0.2;

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
```

No recency weighting — explicitly ruled out by the user. `MATLAB` is included in the downweight list as a judgment call for this specific portfolio (a backend-developer brand where a coursework language shouldn't compete with Ruby/Python/JS) — called out here so it's an intentional, documented choice rather than a silent one, and easy to revisit.

## 4. Secondary Skills — manifest-detected, with a small supplementary list for what manifests can't see

Manifest parsing can only detect what's a literal package dependency (`package.json`, `Gemfile`, `requirements.txt`). It **cannot** detect infrastructure/cloud/observability tools the user actually uses professionally but that never appear as a code dependency in a public hobby repo (AWS, Docker, Heroku, GitHub Actions, Datadog, New Relic — all present in the *old* hardcoded list). Purely switching to auto-detection would silently drop real skills that just don't happen to leave a manifest trace.

**Design: hybrid.** Auto-detect from manifests (the majority, verifiably real, zero maintenance) + a short manually-curated supplementary list for the handful of infra/tooling skills manifests structurally cannot see. Both are deduplicated into one final list.

```ts
// Same file: src/lib/skills.ts

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

Errors are swallowed per-repo (consistent with `getCredlyBadges`/`getPlatziDiplomas`'s existing resilience pattern in this codebase) — a malformed manifest or a transient API error on one repo must not blank out the whole Secondary Skills section.

**Call budget:** adds up to 1 extra Contents API call per JS/Ruby/Python repo (~15-20 calls for the current 17 repos) on top of the existing ~18 calls (1 list + 17 languages). With `GITHUB_ACCESS_TOKEN` set (already supported/recommended by the existing code), the authenticated limit is 5,000 requests/hour — no practical concern.

## 5. Data Flow

`getPrimarySkills` is a pure function (no I/O) — could run client-side, but since `getSecondarySkills` *must* run server-side (network calls) and both are cheap to compute together, both move into `src/app/page.tsx` (the existing Server Component), computed once and passed down as plain props:

```tsx
// src/app/page.tsx
export default async function Home() {
  const repos = await getRepositories('afelopez');
  const primarySkills = getPrimarySkills(repos);
  const secondarySkills = await getSecondarySkills('afelopez', repos);
  return <Profile repos={repos} primarySkills={primarySkills} secondarySkills={secondarySkills} />;
}
```

`Profile.tsx` becomes purely presentational for this data — it no longer derives `languageStats`/`topSkills`/a hardcoded array itself, just renders the props it's given. This also means the `Stars` component (used only for the old 1-5 star rating) becomes unused and should be deleted if confirmed to have no other consumers.

## 6. Home Layout — Option C (validated via visual mockup)

Two mockup rounds were shown in the visual companion; the user selected:
- **Structure:** fixed-width sidebar (left) — photo, name, title, contact links, CV buttons — next to a wider content column (right) with a clear top-to-bottom hierarchy: Primary Skills → Secondary Skills → Stats.
- **Primary Skills visual:** horizontal proportional bars (bar width = `PrimarySkill.score` × 100%), not the current 1-5 star rating and not a 3-tier badge grouping.
- **Secondary Skills visual:** plain pill chips, matching the existing `rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium` tag style already used on `/projects`, `/certificates`, `/repositories` — chosen for site-wide visual consistency rather than inventing a new chip style.
- **Stats:** kept as large highlighted numbers (existing `text-3xl font-bold` treatment), just with more breathing room in the new layout, per the "professional, better use of space" ask.

## 7. Files Changed / Created

| File | Action |
|---|---|
| `src/lib/skills.ts` | Create — `PrimarySkill` type, `getPrimarySkills`, `getSecondarySkills`, weighting/framework/supplementary constants |
| `src/app/page.tsx` | Modify — compute and pass `primarySkills`/`secondarySkills` |
| `src/components/Profile.tsx` | Modify — accept new props, remove internal language-counting/hardcoded-array logic, restructure into the sidebar + hierarchical layout, render bars instead of stars |
| `src/components/Stars.tsx` | Delete, if confirmed unused after the above (verify with a repo-wide grep before removing) |

## 8. Out of Scope

- Recency weighting of any kind (explicitly ruled out).
- Dynamic "Years of Experience" (still a manual figure in `Profile.tsx` — not requested, not touched).
- Any change to `/projects`, `/certificates`, `/repositories`, or the Navbar.
- Additional manifest ecosystems beyond `package.json`/`Gemfile`/`requirements.txt` (`go.mod`, `pom.xml`, etc.) — none of the current repos would benefit from them; add later if/when a repo in one of those ecosystems exists.

## 9. Testing / Verification

No test framework in this repo. `getPrimarySkills` is a pure function — verify it directly with a small standalone script (similar precedent: `scripts/verify-credly.ts`/`scripts/verify-platzi.ts` from the certificates feature) against real repo data, printing the ranked list for manual sanity-check (Ruby should lead, CSS should not outrank JavaScript/TypeScript). `getSecondarySkills` gets the same kind of live-data verification script, run against the real `afelopez` account. Beyond that: `tsc --noEmit`, scoped `eslint`, `npm run build`, and `curl`/`grep` checks against the rendered home page.
