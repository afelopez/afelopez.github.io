import { getRepositories } from '@/lib/github';
import RepositoryCard from '@/components/RepositoryCard';

export default async function RepositoriesPage() {
  const repos = await getRepositories('afelopez');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">My GitHub Repositories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {repos.map((repo, i) => (
          <RepositoryCard key={repo.id} repo={repo} index={i} />
        ))}
      </div>
    </div>
  );
}
