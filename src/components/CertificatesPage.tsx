'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
import CertificateCard from './CertificateCard';

type SortKey = 'newest' | 'oldest' | 'name';

const PAGE_SIZE = 10;

export default function CertificatesPage({ certificates }: { certificates: Certificate[] }) {
  const [search, setSearch] = useState('');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const providers = useMemo(() => {
    return [...new Set(certificates.map((c) => c.provider))];
  }, [certificates]);

  const filtered = useMemo(() => {
    let list = certificates.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.issuer.toLowerCase().includes(search.toLowerCase());
      const matchProvider = !activeProvider || c.provider === activeProvider;
      return matchSearch && matchProvider;
    });

    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sort === 'name') list = [...list].sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [certificates, search, activeProvider, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleProviderChange = (provider: string | null) => {
    setActiveProvider(provider);
    setPage(1);
  };

  const handleSortChange = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Certificates</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {certificates.length} certificates
          {filtered.length !== certificates.length && ` · ${filtered.length} shown`}
        </p>
      </div>

      {/* Controls */}
      <div className="glass mb-8 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search certificates…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        />
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Provider filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => handleProviderChange(null)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeProvider === null
              ? 'bg-blue-600 text-white'
              : 'glass text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
          }`}
        >
          All
        </button>
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => handleProviderChange(provider === activeProvider ? null : provider)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeProvider === provider
                ? 'bg-blue-600 text-white'
                : 'glass text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
            }`}
          >
            {providerLabel(provider)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-gray-500 dark:text-gray-400">No certificates match your filters.</p>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((certificate, i) => (
              <CertificateCard key={certificate.id} certificate={certificate} index={i} />
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'glass text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
