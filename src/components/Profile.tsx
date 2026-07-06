'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Repo } from '@/lib/github';
import Stars from './Stars';

interface ProfileProps {
  repos: Repo[];
}

const Profile = ({ repos }: ProfileProps) => {
  const languageStats = repos
    ? repos.reduce<Record<string, number>>((acc, repo) => {
        if (repo.language) {
          acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
      }, {})
    : {};

  const sortedLanguages = Object.entries(languageStats).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedLanguages.length > 0 ? sortedLanguages[0][1] : 0;

  const topSkills = sortedLanguages.slice(0, 7);

  const getStarCount = (count: number) => {
    if (maxCount === 0) return 0;
    return Math.ceil((count / maxCount) * 5);
  };

  const secondarySkills = [
    'Ruby on Rails', 'FastAPI', 'PostgreSQL', 'MySQL', 'AWS RDS', 'Redis', 
    'Docker', 'GitHub Actions', 'AWS (Lambda, S3)', 'Heroku', 'Datadog', 'New Relic'
  ];
  const spokenLanguages = [
    { lang: 'Spanish', level: 'Native' },
    { lang: 'English', level: 'B2' }
  ];

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="my-12 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
    >
      <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40 dark:border-gray-700/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-1 flex flex-col items-center text-center">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
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
              <p><a href="mailto:dev.andres.lopez@gmail.com" className="hover:text-blue-500">dev.andres.lopez@gmail.com</a></p>
              <p><a href="https://linkedin.com/in/afelopez" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">linkedin.com/in/afelopez</a></p>
              <p>(+34) 644 980 908</p>
            </div>
            <div className="flex gap-4 mt-6">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="/cv_en.pdf" download className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors shadow-md text-xs">
                CV (EN)
              </motion.a>
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="/cv_es.pdf" download className="bg-green-600 text-white font-bold py-2 px-4 rounded-full hover:bg-green-700 transition-colors shadow-md text-xs">
                CV (ES)
              </motion.a>
            </div>
          </div>

          {/* Right Column: Skills & Stats */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Primary Skills</h2>
                <div className="space-y-3">
                  {topSkills.map(([lang, count], i) => (
                    <motion.div key={lang} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 * i }} className="flex items-center justify-between">
                      <span className="font-medium">{lang}</span>
                      <Stars count={getStarCount(count)} />
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Secondary Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {secondarySkills.map((skill, i) => (
                    <motion.span key={skill} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * i }} className="bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Languages</h2>
                <div className="space-y-2">
                  {spokenLanguages.map((lang, i) => (
                    <motion.div key={lang.lang} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} className="flex items-center">
                      <span className="font-medium w-24">{lang.lang}</span>
                      <span className="text-gray-500 dark:text-gray-400">{lang.level}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Statistics</h2>
                <div className="flex gap-8">
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
      </div>
    </motion.section>
  );
};

export default Profile;
