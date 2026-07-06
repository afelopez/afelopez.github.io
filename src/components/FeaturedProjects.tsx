'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '@/data/projects';

const LINK_STYLES: Record<string, string> = {
  frontend: 'bg-blue-600 hover:bg-blue-700 text-white',
  swagger:  'bg-green-600 hover:bg-green-700 text-white',
  api:      'bg-purple-600 hover:bg-purple-700 text-white',
  github:   'bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-600 dark:hover:bg-gray-500',
};

const LINK_ICONS: Record<string, string> = {
  frontend: '↗',
  swagger:  '⚡',
  api:      '⬡',
  github:   '⌥',
};

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 160 : -160, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -160 : 160, opacity: 0 }),
};

export default function FeaturedProjects() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-advance carousel every 5 seconds (resets on manual navigation)
  useEffect(() => {
    if (projects.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % projects.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [current]);

  if (projects.length === 0) {
    return (
      <section id="projects" className="mx-auto mb-16 max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-3xl font-bold">Projects</h2>
        <div className="glass rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No projects listed yet.</p>
          <p className="mt-1 text-sm">
            Edit{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-800">
              src/data/projects.ts
            </code>{' '}
            to add your deployed projects.
          </p>
        </div>
      </section>
    );
  }

  const go = (i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  };
  const prev = () => go((current - 1 + projects.length) % projects.length);
  const next = () => go((current + 1) % projects.length);

  const project = projects[current];
  const numLabel = String(current + 1).padStart(2, '0');

  return (
    <section id="projects" className="mx-auto mb-16 max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-center text-3xl font-bold">Projects</h2>

      {/* ── Card with integrated arrows ──────────────────────────── */}
      <div className="glass overflow-hidden rounded-2xl group relative">
        {projects.length > 1 && (
          <>
            {/* Left gradient overlay with arrow */}
            <button
              onClick={prev}
              aria-label="Previous project"
              className="hidden sm:flex absolute left-0 top-0 bottom-0 w-20 z-20 items-center justify-start pl-4 bg-gradient-to-r from-gray-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <span className="text-3xl text-white drop-shadow-lg">‹</span>
            </button>
            {/* Right gradient overlay with arrow */}
            <button
              onClick={next}
              aria-label="Next project"
              className="hidden sm:flex absolute right-0 top-0 bottom-0 w-20 z-20 items-center justify-end pr-4 bg-gradient-to-l from-gray-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <span className="text-3xl text-white drop-shadow-lg">›</span>
            </button>
          </>
        )}

        <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={project.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex flex-col sm:flex-row w-full sm:min-h-[280px]"
            >
              {/* ── MOBILE: logo panel stacked on top ──────────────── */}
              <div
                className="flex sm:hidden h-44 w-full items-center justify-between px-7"
                style={{ backgroundColor: project.logo ? (project.brandColor ?? '#111827') : undefined }}
              >
                <span className="text-5xl font-bold tracking-tight text-white/50 select-none">
                  {numLabel}
                </span>
                {project.logo && (
                  <img
                    src={project.logo}
                    alt={`${project.name} logo`}
                    className="max-h-20 w-auto object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                )}
              </div>

              {/* ── DESKTOP: number panel (left column) ────────────── */}
              <div className="hidden sm:flex w-24 flex-shrink-0 items-center justify-center border-r border-white/10 bg-blue-600/10 dark:bg-blue-400/10">
                <span className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {numLabel}
                </span>
              </div>

              {/* ── Center: content (always visible) ───────────────── */}
              <div className="flex flex-1 min-w-0 flex-col justify-center gap-4 p-6 sm:p-8">
                <h3 className="text-2xl font-bold">{project.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 px-5 py-2 text-sm font-semibold text-blue-600 backdrop-blur-sm transition-colors hover:bg-blue-600/25 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                    >
                      <span>{LINK_ICONS[link.type]}</span>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* ── DESKTOP: logo panel (right column) ─────────────── */}
              {project.logo && (
                <div
                  className="hidden sm:flex w-64 lg:w-72 flex-shrink-0 items-center justify-center p-10 border-l border-white/10"
                  style={{ backgroundColor: project.brandColor ?? '#111827' }}
                >
                  <img
                    src={project.logo}
                    alt={`${project.name} logo`}
                    className="max-h-36 w-auto object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
      </div>

      {/* ── Navigation dots + mobile arrows ───────────────────────── */}
      {projects.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {/* Prev arrow — mobile only */}
          <button
            onClick={prev}
            aria-label="Previous project"
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-full glass text-gray-600 dark:text-gray-300 text-lg transition-opacity hover:opacity-70"
          >
            ‹
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {projects.map((_, i) => (
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

          {/* Next arrow — mobile only */}
          <button
            onClick={next}
            aria-label="Next project"
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-full glass text-gray-600 dark:text-gray-300 text-lg transition-opacity hover:opacity-70"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
