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
  has_pages: boolean;
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

  const reposWithLanguages = await Promise.all(
    repos.map(async (repo) => {
      const langRes = await fetch(repo.languages_url, { headers });
      if (langRes.ok) {
        const languages = await langRes.json();
        repo.languages = languages;
      }
      return repo;
    })
  );

  return reposWithLanguages;
}
