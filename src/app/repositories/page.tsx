import { getRepositories } from '@/lib/github';
import RepositoriesPage from '@/components/RepositoriesPage';

export default async function Page() {
  const repos = await getRepositories('afelopez');
  return <RepositoriesPage repos={repos} />;
}
