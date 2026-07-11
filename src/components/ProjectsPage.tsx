'use client';
import { motion } from 'framer-motion';
import { Project, LinkType } from '@/data/projects';
import LinkIcon, { IconName } from '@/components/LinkIcon';

const TYPE_TO_ICON: Record<LinkType, IconName> = {
  github: 'github',
  frontend: 'external-link',
  swagger: 'lightning',
  api: 'hexagon',
};

export default function ProjectsPage({ projects }: { projects: Project[] }) {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
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
                  <p className="leading-relaxed text-gray-500 dark:text-gray-400 sm:max-w-[70%]">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2">
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
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
                        >
                          <LinkIcon icon={TYPE_TO_ICON[link.type]} />
                        </a>
                      ))}
                    </div>
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
