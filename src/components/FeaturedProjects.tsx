'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '@/data/projects';

const LINK_STYLES: Record<string, string> = {
  frontend: 'bg-blue-600 hover:bg-blue-700 text-white',
  swagger:  'bg-green-600 hover:bg-green-700 text-white',
  api:      'bg-purple-600 hover:bg-purple-700 text-white',
  github:   'bg-gray-700  hover:bg-gray-800  text-white dark:bg-gray-600 dark:hover:bg-gray-500',
};

const LINK_ICONS: Record<string, string> = {
  frontend: '↗',
  swagger:  '⚡',
  api:      '⬡',
  github:   '⌥',
};

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 140 : -140, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -140 : 140, opacity: 0 }),
};

export default function FeaturedProjects() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  if (projects.length === 0) {
    return (
      <section className="mx-auto mb-16 max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-3xl font-bold">Production Projects</h2>
        <div className="glass rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No projects listed yet.</p>
          <p className="mt-1 text-sm">Edit <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">src/data/projects.ts</code> to add your deployed projects.</p>
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

  return (
    <section className="mx-auto mb-16 max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-center text-3xl font-bold">Production Projects</h2>

      <div className="relative">
        <div className="glass overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={project.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.26, ease: 'easeInOut' }}
              className="flex flex-col gap-6 p-8 sm:flex-row sm:items-start"
            >
              {/* Counter */}
              <div className="flex-shrink-0 self-start sm:pt-1">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10 text-xl font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  {String(current + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold">{project.name}</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{project.description}</p>

                {/* Tech tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${LINK_STYLES[link.type] ?? LINK_STYLES.github}`}
                    >
                      <span>{LINK_ICONS[link.type]}</span>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {projects.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous project"
              className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full glass text-lg text-gray-600 dark:text-gray-300 transition-opacity hover:opacity-70 shadow-md"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next project"
              className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full glass text-lg text-gray-600 dark:text-gray-300 transition-opacity hover:opacity-70 shadow-md"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {projects.length > 1 && (
        <div className="mt-5 flex justify-center gap-2">
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
      )}
    </section>
  );
}
