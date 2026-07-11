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
