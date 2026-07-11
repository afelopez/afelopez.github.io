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
