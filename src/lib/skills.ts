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
