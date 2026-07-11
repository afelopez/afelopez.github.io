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
