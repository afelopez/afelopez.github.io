'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Repo } from '@/lib/github';
import { PrimarySkill } from '@/lib/skills';

interface ProfileProps {
  repos: Repo[];
  primarySkills: PrimarySkill[];
  secondarySkills: string[];
}

const spokenLanguages = [
  { lang: 'Spanish', level: 'Native' },
  { lang: 'English', level: 'B2' },
];

const Profile = ({ repos, primarySkills, secondarySkills }: ProfileProps) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="py-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
    >
      <div className="glass rounded-2xl p-8">
        <div className="flex flex-col gap-10 md:flex-row">
          {/* Sidebar: fixed-width profile panel */}
          <div className="flex flex-col items-center text-center md:w-64 md:flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Image
                src="/profile.png" // Placeholder
                alt="Profile Picture"
                width={150}
                height={150}
                className="rounded-full border-4 border-white dark:border-gray-800 shadow-xl"
                loading="eager"
              />
            </motion.div>
            <h1 className="text-3xl font-bold mt-4">Andres Lopez</h1>
            <p className="text-md text-gray-500 dark:text-gray-400 mt-2">
              Backend Developer
            </p>
            <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
              <p><a href="mailto:dev.andres.lopez@gmail.com" className="hover:text-teal-500">dev.andres.lopez@gmail.com</a></p>
              <p><a href="https://linkedin.com/in/afelopez" target="_blank" rel="noopener noreferrer" className="hover:text-teal-500">linkedin.com/in/afelopez</a></p>
              <p>(+34) 644 980 908</p>
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {spokenLanguages.map((lang) => (
                <p key={lang.lang}>
                  <span className="font-medium">{lang.lang}</span> — {lang.level}
                </p>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/cv_en.pdf"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/60 bg-teal-600/25 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
              >
                ↓ CV (EN)
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/cv_es.pdf"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/60 bg-teal-600/25 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
              >
                ↓ CV (ES)
              </motion.a>
            </div>
          </div>

          {/* Content: Primary+Secondary Skills grid -> Statistics */}
          <div className="flex-1 min-w-0 space-y-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-bold mb-4">Primary Skills</h2>
                <div className="space-y-3">
                  {primarySkills.map((skill, i) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * i }}
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{skill.name}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-teal-600/15 dark:bg-teal-500/10">
                        <div
                          className="h-2.5 rounded-full bg-teal-600 dark:bg-teal-400"
                          style={{ width: `${Math.max(skill.score * 100, 4)}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7">
                <h2 className="text-2xl font-bold mb-4">Secondary Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {secondarySkills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(0.03 * i, 0.5) }}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Statistics</h2>
              <div className="flex gap-10">
                <div className="text-left">
                  <p className="text-3xl font-bold">{repos.length}</p>
                  <p className="text-gray-500 dark:text-gray-400">Public Repos</p>
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold">5+</p>
                  <p className="text-gray-500 dark:text-gray-400">Years of Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Profile;
