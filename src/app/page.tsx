import Profile from '@/components/Profile';
import FeaturedProjects from '@/components/FeaturedProjects';
import { getRepositories } from '@/lib/github';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  return (
    <>
      <Profile repos={repos} />
      <FeaturedProjects />
    </>
  );
}
