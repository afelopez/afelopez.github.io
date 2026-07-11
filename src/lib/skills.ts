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
