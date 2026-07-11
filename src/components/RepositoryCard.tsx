'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import LinkIcon from '@/components/LinkIcon';
import { LANG_COLORS } from '@/lib/languageColors';

function truncateWords(text: string, maxWords: number): string {
  if (!text) return text;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

export default function RepositoryCard({ repo, index }: { repo: Repo, index: number }) {
  const topLanguages = repo.languages ? Object.keys(repo.languages).slice(0, 3) : (repo.language ? [repo.language] : []);

  const pagesUrl = repo.has_pages
    ? (() => {
        const username = repo.html_url.split('/')[3];
        return repo.name === `${username}.github.io`
          ? `https://${username}.github.io`
          : `https://${username}.github.io/${repo.name}`;
      })()
    : null;

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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{repo.name}</h3>
        </a>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{truncateWords(repo.description, 15)}</p>
      </div>
      <div className="flex flex-wrap justify-between items-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap gap-2">
          {topLanguages.map(lang => (
            <span key={lang} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
              {lang}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
              <LinkIcon icon="github" />
            </a>
          {pagesUrl && (
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Live Demo"
              aria-label="Live Demo"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
              <LinkIcon icon="external-link" />
            </a>
          )}
          <span>⭐ {repo.stargazers_count}</span>
        </div>
      </div>
    </motion.div>
  );
}
