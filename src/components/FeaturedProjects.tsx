'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repo } from '@/lib/github';

interface FeaturedProjectsProps {
  repos: Repo[];
}

export default function FeaturedProjects({ repos }: FeaturedProjectsProps) {
  const featured = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  if (featured.length === 0) return null;

  const go = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };
  const prev = () => go((current - 1 + featured.length) % featured.length);
  const next = () => go((current + 1) % featured.length);

  const repo = featured[current];
  const topLanguages = repo.languages
    ? Object.keys(repo.languages).slice(0, 4)
    : repo.language
    ? [repo.language]
    : [];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 120 : -120, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -120 : 120, opacity: 0 }),
  };

  return (
    <section className="mx-auto mb-16 max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-center text-3xl font-bold">Featured Projects</h2>

      <div className="relative">
        {/* Card */}
        <div className="glass overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={repo.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center"
            >
              {/* Index badge */}
              <div className="flex-shrink-0 self-start sm:self-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10 text-2xl font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  {String(current + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-block"
                >
                  <h3 className="text-2xl font-bold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {repo.name}
                  </h3>
                </a>
                <p className="mt-2 text-gray-500 dark:text-gray-400 line-clamp-2">
                  {repo.description || 'No description available.'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {topLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {lang}
                    </span>
                  ))}
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                    ⭐ {repo.stargazers_count}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 self-start rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:self-center"
              >
                View →
              </a>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          aria-label="Previous project"
          className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full glass text-gray-600 dark:text-gray-300 transition-opacity hover:opacity-80 shadow-md"
        >
          ‹
        </button>
        <button
          onClick={next}
          aria-label="Next project"
          className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full glass text-gray-600 dark:text-gray-300 transition-opacity hover:opacity-80 shadow-md"
        >
          ›
        </button>
      </div>

      {/* Dot indicators */}
      <div className="mt-5 flex justify-center gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to project ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 bg-blue-600 dark:bg-blue-400'
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
