# GitHub-Driven Skills & Home Redesign
**Date:** 2026-07-11
**Status:** Approved (Revision 2 — supersedes the byte-weighted/relative-score approach shipped in commits `637ba64`..`5a2d36d` on this same branch, not yet merged)
**Approach:** Replace the home page's ad-hoc skill lists (repo-count language ranking, hardcoded secondary skills) with a composite score blending real GitHub activity (own private+public repos) with the user's own self-assessed skill level, and reorganize `Profile.tsx` into a fixed sidebar + hierarchical content layout (validated via visual mockups — option "C").

---

## 1. Goal

Make "Primary Skills" reflect an honest picture of real competency — not just how many bytes of a language happen to sit in a repo (much of which may be AI-assisted or copied from a tutorial) — while still being grounded in real, verifiable GitHub signals (project count, recency, industry popularity). Make "Secondary Skills" reflect frameworks/tools detected from manifests plus markup/infra languages that don't belong in a "primary competency" ranking. Give the home page a more professional, better-spaced layout.

## 2. Why Revision 2: what changed and why

Revision 1 (already implemented on this branch) ranked languages by category-weighted byte volume, relative to each other (top language = 100%, others scaled down from that). After implementation and full review, real usage surfaced two problems:

1. **Relative scoring compresses real differences.** Measuring every language against the top scorer made Python and TypeScript look artificially insignificant next to Ruby, even though the user considers them real, independent skills — not "20% as good as Ruby." Fix: every language is now scored **independently against absolute yardsticks** (time and quantity), never against another language's score.
2. **Byte volume is a poor proxy for actual knowledge in the AI-assisted-coding era.** Much of the code behind these byte counts was AI-written or AI-recommended, not written from the user's own understanding. Concretely: JavaScript has more repo bytes than Ruby, but the user rates their real JavaScript knowledge at ~30%, well below their Ruby knowledge. Fix: byte volume is dropped entirely as a factor. In its place, a manually-maintained **self-perception score** — set and updated by the user directly — becomes the dominant factor.

Two research questions were resolved before finalizing the formula:
- **"Does code complexity/design-pattern usage predict seniority?"** — Rejected as a factor. It would require AST parsing or LLM-based code review, a different order of engineering effort than the metadata-only GitHub API calls used everywhere else in this feature. It's also an unreliable signal in the literature: pattern *overuse* correlates with junior/mid-level over-engineering, not seniority.
- **"What's a stable, defensible language-popularity source?"** — RedMonk was chosen over TIOBE/PYPL. TIOBE/PYPL are derived from search-engine query volume: they update monthly (volatile) and are widely criticized for underrepresenting languages with strong official documentation (searched less because the docs already answer the question) — TypeScript is a commonly-cited example. RedMonk blends real GitHub + Stack Overflow activity and only updates twice a year, making it a more stable signal for a portfolio that shouldn't need reshuffling every month.

## 3. Primary Skills — four independent, absolute factors

**Scope change:** Primary Skills now only ever contains **category-1 languages** — real application/base languages. **Category-2** languages (markup, styling, infra/config file types — same set previously used for down-weighting) are excluded entirely from Primary Skills and instead surface as plain tags in Secondary Skills (§4). This replaces down-weighting with exclusion: a category-2 language no longer competes for a Primary Skills slot at a reduced weight, it simply isn't a "primary competency."

```ts
// src/lib/skills.ts

// Category-2: markup, styling, and infra/config file types. These never
// compete for a Primary Skills slot, regardless of byte volume — CSS next
// to Ruby as a "primary skill" misrepresents a backend developer's actual
// competency profile. They still surface, as plain tags, in Secondary
// Skills (§4). Not an allowlist: any language NOT in this set defaults to
// category-1, so a language never seen in this account yet (Rust, Kotlin,
// ...) is still routed correctly the first time it shows up.
const CATEGORY_2_LANGUAGES = new Set([
  'CSS', 'HTML', 'SCSS', 'Less', 'Dockerfile', 'Shell', 'Makefile', 'YAML',
  'Haml', 'Slim', 'ERB', 'MATLAB', 'Jupyter Notebook', 'TOML', 'XML',
  'Vim Script', 'Batchfile', 'PowerShell',
]);
```

### 3.1 Formula

Each category-1 language gets a score in `[0, 1]`, computed independently — never relative to another language:

```
score = selfPerception × 0.45
      + projectScore    × 0.25
      + recencyScore     × 0.15
      + popularityScore  × 0.15
```

- **`selfPerception` (45%)** — the user's own 0-100 rating of their real knowledge of the language, `/100`. Manually maintained, not derived from GitHub. This is the dominant factor by design: it's the one input immune to "I have a lot of AI-generated code in this language" distorting the result.
- **`projectScore` (25%)** — `min(projectCount / 5, 1)`, where `projectCount` is the number of the user's own (non-fork) repos containing that language. Caps at 5 repos = full score; more than 5 doesn't add anything further.
- **`recencyScore` (15%)** — `max(0, 1 - daysSinceLastPush / 730)`, where `daysSinceLastPush` is measured from the most recent `pushed_at` among the user's own (non-fork) repos containing that language, to today. Linear decay to 0 over 2 years (730 days). A language with zero repos scores 0 here (nothing to be recent about).
- **`popularityScore` (15%)** — `max(0, 1 - (redmonkRank - 1) / 20)`, using the language's RedMonk Q1 2026 rank. Rank 1 → 1.0, rank 21+ (or untracked) → 0.

```ts
// src/lib/skills.ts (continued)

// Manually maintained — reflects how well *you* actually know a language,
// deliberately independent of GitHub byte volume (a lot of repo code is
// AI-assisted/AI-recommended and doesn't reflect real depth). Edit this
// directly whenever your own sense of a language changes; nothing else
// in this file needs to change. Scale: 0-100.
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
      if (CATEGORY_2_LANGUAGES.has(lang)) continue; // category-2 never enters Primary
      const entry = perLanguage[lang] ?? { projects: 0, mostRecentPush: null };
      entry.projects += 1;
      if (!entry.mostRecentPush || repo.pushed_at > entry.mostRecentPush) {
        entry.mostRecentPush = repo.pushed_at;
      }
      perLanguage[lang] = entry;
    }
  }

  // Union: every category-1 language found in repos, PLUS every language
  // given an explicit self-perception score — even with zero repos (e.g.
  // Java, Go). Self-perception is allowed to introduce a language GitHub
  // has no repo evidence for yet; projectScore/recencyScore simply floor
  // at 0 for it.
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
```

### 3.2 Verification against real data (computed 2026-07-11)

| Lenguaje | Autopercepción | Proyectos | Recencia | Popularidad (RedMonk) | **Score final** |
|---|---|---|---|---|---|
| Ruby | 85% | 4/5 (0.80) | 99% (push hace 5 días) | 60% (#9) | **82%** |
| JavaScript | 30% | 5/5 (1.00) | 99% (push hace 4 días) | 100% (#1) | **68%** |
| Python | 65% | 2/5 (0.40) | 37% (push hace ~15 meses) | 95% (#2) | **59%** |
| TypeScript | 10% | 1/5 (0.20) | 99% (push hace 5 días) | 75% (#6) | **36%** |
| Java | 40% | 0/5 (0.00) | 0% (sin repos) | 90% (#3) | **31.5%** |
| Go | 40% | 0/5 (0.00) | 0% (sin repos) | 45% (#12) | **24.75%** |

Order: Ruby > JavaScript > Python > TypeScript > Java > Go — matches the user's own sense of their skill profile (Ruby leads on real self-assessed depth; Python outranks TypeScript despite fewer repos, because self-perception dominates the formula; JavaScript stays mid-high on activity/popularity despite low self-rated depth).

## 4. Secondary Skills — manifest-detected frameworks + category-2 languages + supplementary infra list

Three sources feed one deduplicated list, unchanged in mechanism from Revision 1 except for the added category-2 languages:

1. **Manifest-detected frameworks** (unchanged from Revision 1): `package.json`/`Gemfile`/`requirements.txt` parsed via the Contents API, cross-referenced against `KNOWN_FRAMEWORKS`.
2. **Category-2 languages actually present in the user's own repos** (new in Revision 2): since these no longer appear in Primary Skills, they're added here as plain tags so the underlying skill (e.g. "CSS", "Dockerfile") isn't lost, just re-categorized.
3. **`SUPPLEMENTARY_SKILLS`** (unchanged from Revision 1): a short manually-curated list for infra/cloud/observability tools that structurally can't appear in a manifest (AWS, Heroku, Datadog, New Relic, ...).

```ts
// src/lib/skills.ts (continued) — KNOWN_FRAMEWORKS, SUPPLEMENTARY_SKILLS,
// extractDependencyNames unchanged from Revision 1 (see git history at
// commit 637ba64 for the untouched code).

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

## 5. Private repos for skills only — data source and privacy mechanism

The account has repos that are private, currently invisible to this feature since `getRepositories` calls the public-only endpoint `GET /users/{username}/repos`. The user's real skill profile should include those. Requirement: private repo data must inform the skills computation, but must **never** be exposed on the public site — not repo names, not descriptions, not URLs, not counts attributable to a specific private repo.

**New function, `src/lib/github.ts`:**

```ts
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
      if (langRes.ok) repo.languages = await langRes.json();
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
  if (!res.ok) throw new Error(`Failed to fetch repositories: ${res.statusText}`);
  const repos: Repo[] = await res.json();
  return attachLanguages(repos, headers);
}

/**
 * Public + private repos owned by the authenticated user (requires
 * GITHUB_ACCESS_TOKEN with `repo` scope). Used ONLY for skills computation
 * (§3, §4) — never for any page that lists or links to individual repos.
 * Falls back to public-only data if no token is configured.
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
  if (!res.ok) throw new Error(`Failed to fetch repositories for skills: ${res.statusText}`);
  const repos: Repo[] = await res.json();
  return attachLanguages(repos, headers);
}
```

`affiliation=owner` restricts results to repos the user actually owns (excludes org repos where they're only a collaborator) — matching the same "these are my own repos" scope `getRepositories` already has for public ones. `visibility=all` is explicit for clarity (it's already the default).

**Privacy mechanism — where the boundary actually is:**

```tsx
// src/app/page.tsx
export default async function Home() {
  const repos = await getRepositories('afelopez');               // public only — for display
  const skillsRepos = await getRepositoriesForSkills('afelopez'); // public+private — for scoring only

  const primarySkills = getPrimarySkills(skillsRepos);
  const secondarySkills = await getSecondarySkills('afelopez', skillsRepos);

  return <Profile repos={repos} primarySkills={primarySkills} secondarySkills={secondarySkills} />;
}
```

- `page.tsx` is a Server Component (no `'use client'`) — the token and every fetch using it stay server-side, never bundled to the browser.
- `skillsRepos` (the private-inclusive array) is a local variable inside `Home()`. It is passed into `getPrimarySkills`/`getSecondarySkills` and nowhere else — never as a prop to `Profile` (a Client Component, `'use client'`) or any other client boundary. Next.js serializes every prop passed into a Client Component into the page payload; passing `skillsRepos` there would leak private repo names/URLs/descriptions to any visitor's browser. This is the actual privacy boundary, and it must hold for any future change to this file: only `PrimarySkill[]` (`{name, score}`) and `string[]` (framework/language names) — both already fully anonymized, no repo-level detail — are allowed to cross into `Profile`.
- `repos` (public-only, existing behavior) is what continues to feed the "Public Repos" stat and is passed to `Profile` exactly as before — unchanged.
- `/repositories` (`src/app/repositories/page.tsx`) is untouched — still calls only `getRepositories` (public-only).
- `getSecondarySkills`'s manifest-fetching Contents API calls already send the token when present, so they transparently work against private repos too — no change needed there beyond receiving `skillsRepos` instead of `repos`.

## 6. Home Layout — Option C (validated via visual mockup, unchanged from Revision 1)

- **Structure:** fixed-width sidebar (left) — photo, name, title, contact links, CV buttons — next to a wider content column (right) with a clear top-to-bottom hierarchy: Primary Skills → Secondary Skills → Stats.
- **Primary Skills visual:** horizontal proportional bars (bar width = `PrimarySkill.score` × 100%). Bar width now reflects each language's independent absolute score, not a score relative to the top language — visually, this means two languages can both have long bars if they're both genuinely strong, instead of one always being forced short just for not being #1.
- **Secondary Skills visual:** plain pill chips, matching the existing `rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium` tag style already used on `/projects`, `/certificates`, `/repositories`.
- **Stats:** kept as large highlighted numbers (existing `text-3xl font-bold` treatment).

`Profile.tsx`'s rendering code for both sections is unaffected by this revision — `PrimarySkill { name, score }` and `string[]` remain the exact interface it consumes; only how `skills.ts` computes those values changed.

## 7. Files Changed / Created

| File | Action |
|---|---|
| `src/lib/github.ts` | Modify — add `pushed_at` to `Repo`, extract shared `attachLanguages` helper, add `getRepositoriesForSkills` |
| `src/lib/skills.ts` | Modify — replace byte-weighted relative scoring with the 4-factor absolute formula; add `SELF_PERCEIVED_SKILL`, `REDMONK_RANK`, `CATEGORY_2_LANGUAGES` (renamed from `DOWNWEIGHTED_LANGUAGES`, now an exclusion filter not a weight); `getSecondarySkills` gains category-2 language tags |
| `src/app/page.tsx` | Modify — fetch `skillsRepos` via `getRepositoriesForSkills` separately from the public `repos`, feed only `skillsRepos` into the skill functions |
| `scripts/verify-skills.ts` | Modify — call `getRepositoriesForSkills` (not `getRepositories`) so the verification script matches production data flow |
| `src/components/Profile.tsx` | No change — existing prop interface and rendering already match |

## 8. Out of Scope

- Any change to `/projects`, `/certificates`, `/repositories`, or the Navbar.
- Additional manifest ecosystems beyond `package.json`/`Gemfile`/`requirements.txt` (`go.mod`, `pom.xml`, etc.) — Java and Go currently have zero repos; add manifest parsing for them if/when a real repo exists.
- Any UI for editing `SELF_PERCEIVED_SKILL` from the browser — it's a source file, edited directly and deployed like any other code change, consistent with how `SUPPLEMENTARY_SKILLS`/`KNOWN_FRAMEWORKS` already work in this codebase.
- Dynamic "Years of Experience" (still a manual figure in `Profile.tsx` — not requested, not touched).

## 9. Testing / Verification

No test framework in this repo. `getPrimarySkills` is a pure function once given repo data — verify with `scripts/verify-skills.ts` (updated to call `getRepositoriesForSkills`) against the real `afelopez` account, printing the ranked list and each factor's sub-score for manual sanity-check against §3.2's table. `getSecondarySkills` verified the same way, confirming category-2 languages (CSS, HTML, etc.) now appear there instead of in the primary list. Beyond that: `tsc --noEmit`, scoped `eslint`, `npm run build`, and a manual check that `/repositories` (curl + grep the rendered HTML) shows no new repos and no private-repo names appear anywhere in the home page's rendered HTML or page source.
