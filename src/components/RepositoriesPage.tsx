'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';
import RepositoryCard from './RepositoryCard';
import SearchInput from './SearchInput';
import { LANG_COLORS } from '@/lib/languageColors';

type SortKey = 'stars' | 'name' | 'updated';

export default function RepositoriesPage({ repos }: { repos: Repo[] }) {
  const [search, setSearch] = useState('');
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('stars');

  // Collect unique languages from all repos
  const languages = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of repos) {
      if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([lang]) => lang);
  }, [repos]);

  const filtered = useMemo(() => {
    let list = repos.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchLang = !activeLang || r.language === activeLang;
      return matchSearch && matchLang;
    });

    if (sort === 'stars') list = [...list].sort((a, b) => b.stargazers_count - a.stargazers_count);
    if (sort === 'name')  list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'updated') list = [...list].sort(
      (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
    );

    return list;
  }, [repos, search, activeLang, sort]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Repositories</h1>
      </div>

      {/* Controls */}
      <div className="glass mb-8 rounded-2xl p-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <SearchInput value={search} onChange={setSearch} placeholder="Search repos…" />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-100"
        >
          <option value="stars">Sort: Stars</option>
          <option value="name">Sort: Name</option>
          <option value="updated">Sort: Recently updated</option>
        </select>
      </div>

      {/* Language filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveLang(null)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeLang === null
              ? 'bg-teal-600 text-white'
              : 'glass text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
          }`}
        >
          All
        </button>
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang === activeLang ? null : lang)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeLang === lang
                ? 'bg-teal-600 text-white'
                : 'glass text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
            {lang}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-20">No repos match your filters.</p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((repo, i) => (
            <RepositoryCard key={repo.id} repo={repo} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
