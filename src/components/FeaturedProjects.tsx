'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';

interface FeaturedProjectsProps {
  repos: Repo[];
}

export default function FeaturedProjects({ repos }: FeaturedProjectsProps) {
  const featured = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto mb-12 max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-center text-3xl font-bold">Featured Projects</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((repo, i) => {
          const topLanguages = repo.languages
            ? Object.keys(repo.languages).slice(0, 3)
            : repo.language
            ? [repo.language]
            : [];

          return (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              whileHover={{ y: -5 }}
              className="glass flex flex-col justify-between rounded-2xl p-6"
            >
              <div>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {repo.name}
                  </h3>
                </a>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {repo.description || 'No description available.'}
                </p>
              </div>

              <div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium dark:bg-gray-700"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ⭐ {repo.stargazers_count}
                  </span>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
