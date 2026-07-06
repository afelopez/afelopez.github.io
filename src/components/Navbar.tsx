'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Repositories', href: '/repositories' },
];

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-full shadow-2xl border border-white/40 dark:border-gray-700/40 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-14">
          <div className="flex items-baseline space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.href === pathname && (
                  <motion.span
                    layoutId="underline"
                    className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-full -z-10"
                  />
                )}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
