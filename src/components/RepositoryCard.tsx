'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';

export default function RepositoryCard({ repo, index }: { repo: Repo, index: number }) {
  const topLanguages = repo.languages ? Object.keys(repo.languages).slice(0, 3) : (repo.language ? [repo.language] : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
      className="glass rounded-xl p-6 flex flex-col justify-between"
    >
      <div>
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="group">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{repo.name}</h3>
        </a>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{repo.description}</p>
      </div>
      <div className="flex justify-between items-center mt-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap gap-2">
          {topLanguages.map(lang => (
            <span key={lang} className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
              {lang}
            </span>
          ))}
        </div>
        <span>⭐ {repo.stargazers_count}</span>
      </div>
    </motion.div>
  );
}
