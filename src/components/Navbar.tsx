'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Repositories', href: '/repositories' },
];

const Navbar = () => {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 80);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
      animate={{ y: visible ? 0 : -96, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="glass flex h-14 items-center gap-1 rounded-full px-4 sm:px-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
              pathname === item.href
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {item.href === pathname && (
              <motion.span
                layoutId="underline"
                className="absolute inset-0 -z-10 rounded-full bg-white/60 dark:bg-gray-800/60"
              />
            )}
            {item.name}
          </Link>
        ))}
        <ThemeToggle />
      </div>
    </motion.nav>
  );
};

export default Navbar;
