'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/projects' },
  { name: 'Repositories', href: '/repositories' },
  { name: 'Certificates', href: '/certificates' },
];

const Navbar = () => {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  // Close the mobile drawer on route change. Adjusted during render (rather
  // than in a useEffect) per React's guidance on resetting state when a
  // value changes — avoids the cascading-render setState-in-effect issue.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (mobileOpen) return;
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 80);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  return (
    <motion.nav
      ref={navRef}
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
      animate={{ y: visible || mobileOpen ? 0 : -96, opacity: visible || mobileOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ pointerEvents: visible || mobileOpen ? 'auto' : 'none' }}
    >
      {/* sm:+ — unchanged full pill */}
      <div className="glass hidden h-14 items-center gap-1 rounded-full px-4 sm:flex sm:px-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
              !item.href.includes('#') && pathname === item.href
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {!item.href.includes('#') && item.href === pathname && (
              <motion.span
                layoutId="underline"
                className="absolute inset-0 -z-10 rounded-full bg-white/60 dark:bg-gray-800/60"
              />
            )}
            {item.name}
          </Link>
        ))}
      </div>

      {/* below sm: — collapsed toggle + drawer */}
      <div className="relative inline-block sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="glass flex h-14 w-14 items-center justify-center rounded-full text-gray-700 dark:text-gray-200"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass absolute top-16 left-1/2 flex w-48 -translate-x-1/2 flex-col gap-1 rounded-2xl p-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-colors ${
                    !item.href.includes('#') && pathname === item.href
                      ? 'bg-white/60 text-gray-900 dark:bg-gray-800/60 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
