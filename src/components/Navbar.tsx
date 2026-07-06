'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Repositories', href: '/repositories' },
];

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <div className="glass flex h-14 items-center gap-1 rounded-full px-4 sm:px-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`relative rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            {item.href === pathname && (
              <motion.span
                layoutId="underline"
                className="absolute inset-0 -z-10 rounded-full bg-white/50 dark:bg-gray-800/50"
              />
            )}
            {item.name}
          </Link>
        ))}
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
