'use client';
import { motion } from 'framer-motion';
import { Project, LinkType } from '@/data/projects';

function LinkIcon({ type }: { type: LinkType }) {
  switch (type) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
        </svg>
      );
    case 'frontend':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case 'swagger':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </svg>
      );
    case 'api':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44a1 1 0 0 1-.98 0l-7.9-4.44a1 1 0 0 1-.53-.88v-9a1 1 0 0 1 .53-.88l7.9-4.44a1 1 0 0 1 .98 0l7.9 4.44c.32.17.53.5.53.88Z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

export default function ProjectsPage({ projects }: { projects: Project[] }) {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Projects</h1>
      </div>

      {projects.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-8">
          {projects.map((project, index) => {
            const reversed = index % 2 === 1;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.05, 1) }}
                className={`glass flex flex-col overflow-hidden rounded-2xl sm:flex-row ${reversed ? 'sm:flex-row-reverse' : ''}`}
              >
                {project.logo && (
                  <div
                    className="flex w-full items-center justify-center p-10 sm:w-64 sm:flex-shrink-0 lg:w-72"
                    style={{ backgroundColor: project.brandColor ?? '#111827' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.logo}
                      alt={`${project.name} logo`}
                      className="max-h-36 w-auto object-contain drop-shadow-2xl"
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-6 sm:p-8">
                  <h3 className="text-2xl font-bold">{project.name}</h3>
                  <p className="leading-relaxed text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
                        title={link.label}
                        aria-label={link.label}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
                      >
                        <LinkIcon type={link.type} />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
