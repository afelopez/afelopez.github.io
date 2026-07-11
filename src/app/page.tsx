import Profile from '@/components/Profile';
import { getRepositories } from '@/lib/github';
import { getPrimarySkills, getSecondarySkills } from '@/lib/skills';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  const primarySkills = getPrimarySkills(repos);
  const secondarySkills = await getSecondarySkills('afelopez', repos);
  return <Profile repos={repos} primarySkills={primarySkills} secondarySkills={secondarySkills} />;
}
