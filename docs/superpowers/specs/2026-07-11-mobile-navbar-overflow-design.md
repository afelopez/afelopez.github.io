# Mobile Navbar Overflow Fix — Hamburger Menu
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Below `sm:` (640px), replace the floating nav pill with a compact toggle button that opens a vertical dropdown drawer; at `sm:` and above, the existing pill renders completely unchanged.

## 1. Root Cause (confirmed via Playwright, not assumption)

`src/components/Navbar.tsx` renders all 4 nav items (`Home`, `Projects`, `Repositories`, `Certificates`) as a single horizontal row inside a `fixed`, viewport-centered pill (`fixed top-4 left-1/2 -translate-x-1/2`), with no responsive collapse mechanism. Measured live at a 375px viewport:

- Nav content width: **459.6px** — wider than the 375px viewport itself.
- Because the pill is horizontally centered via `-translate-x-1/2` with no max-width, the overflow splits evenly: **42.3px cut off past the left edge, 42.3px past the right edge.**
- Screenshot confirms this visually: "Home" is clipped to "ome", "Certificates" is clipped before its final "s".
- `document.documentElement.scrollWidth` still reports exactly 375px (no page-level horizontal scrollbar appears), because `position: fixed` removes the nav from normal document flow — the clipped portions aren't just off-screen, they're **unreachable**, since there's no page scroll to bring them into view.
- This is not a regression: `git log` on this file shows the pill has never had mobile-specific treatment since its introduction. No hamburger/drawer/responsive-nav pattern exists anywhere else in this codebase to reuse (confirmed via repo-wide grep).

## 2. Fix — hamburger toggle + dropdown drawer, `sm:`-gated

**Breakpoint choice:** `sm:` (640px), not `md:` (768px, used elsewhere in this app for the Profile sidebar split). Justification: the measured pill content width is 459.6px; 640px leaves a 180px safety margin, comfortably covering font-rendering variance across browsers/OSes. `md:` would work too but isn't motivated by anything specific to this component — `sm:` is the narrowest breakpoint that's actually justified by the real measurement, and using it means fewer visitors see the collapsed state.

**Behavior:**
- Below `sm:`: the full pill (`hidden sm:flex`) is replaced by a circular toggle button (`sm:hidden`, `h-14 w-14`, same `glass` styling) showing a hamburger icon (☰) that swaps to an X when open.
- Toggling reveals a `glass rounded-2xl` dropdown drawer, positioned below the button, listing the 4 links vertically. Each link gets `py-3` padding — combined with `text-sm font-semibold`'s line height, this clears the ~44px minimum touch-target size (Apple HIG / Material guidance).
- The drawer closes on: (a) clicking any link inside it, (b) any route change (`pathname` changing — covers browser back/forward too), (c) clicking anywhere outside the nav.
- **Scroll-hide interaction fix:** the existing hide-on-scroll-down behavior (`visible` state) is suppressed while the drawer is open — otherwise, a user scrolling while trying to tap a link would watch the whole nav (drawer included) slide away mid-interaction. The `animate`/`pointerEvents` props key off `visible || mobileOpen`, and the scroll handler itself early-returns while `mobileOpen` is true.
- No dark backdrop/scrim — a full-screen overlay is disproportionate for a 4-item dropdown and would break from the site's existing light "glass" aesthetic (no other overlay pattern exists in this codebase to match).
- Icon: hand-drawn inline SVG (hamburger ↔ X, `stroke="currentColor"`), following the exact convention already established in `src/components/LinkIcon.tsx` — no new icon library dependency.
- Accessibility: toggle button gets `aria-expanded={mobileOpen}` and `aria-label` ("Open menu" / "Close menu").

## 3. Implementation

Full replacement of `src/components/Navbar.tsx`:

```tsx
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
    setMobileOpen(false);
  }, [pathname]);

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
```

**Layout note on the `relative inline-block` wrapper:** the mobile toggle+drawer wrapper must be `inline-block` (not the default block-level `div`), so it shrink-wraps exactly to the 56px button rather than expanding to fill `nav`'s available width — this keeps `nav`'s own shrink-to-fit sizing (a `position: fixed` element with only `left` set, no `right`) unambiguous, which is what makes the drawer's `left-1/2 -translate-x-1/2` centering land correctly on the viewport's horizontal center rather than some other point.

## 4. Files Changed

| File | Action |
|---|---|
| `src/components/Navbar.tsx` | Modify (full rewrite) — add mobile toggle + drawer, `sm:`-gated against the existing pill, suppress scroll-hide while drawer is open |

No other files change. This is fully scoped to the one component.

## 5. Out of Scope

- A full-screen dark overlay/scrim behind the drawer (disproportionate for 4 items, no precedent in this codebase).
- Any icon library dependency (hand-rolled SVG matches existing `LinkIcon.tsx` convention).
- Changing the `sm:`+ desktop pill in any way — it is byte-for-byte the same markup as before, just wrapped in `hidden sm:flex` instead of the previous unconditional `flex`.
- Keyboard navigation (Escape-to-close, focus trapping) — not requested; can be added later if accessibility needs grow.

## 6. Testing / Verification

No test framework in this repo, and no browser-automation tooling was part of the project's own dependencies. Playwright (matching the version already cached on this machine, `1.61.1`) is installed in a scratch directory (`$CLAUDE_JOB_DIR/tmp/playwright-qa` — not added to the project's `package.json`, since it's an agent-side verification tool, not something the shipped site needs) and used for real, evidence-based verification rather than assumption:

- **Before/after comparison** at 320px (smallest common phone), 375px (the width that surfaced the bug), and 639px (just below the `sm:` cutoff) — confirm the pill is fully replaced by the toggle button, and `document.querySelector('nav').getBoundingClientRect()` never exceeds the viewport width.
- At 640px and 1024px+ — confirm the full pill renders exactly as it did before this change (regression check).
- **Interaction check:** click the toggle, confirm the drawer appears with all 4 links, each with a real screen-measured tap-target height ≥ 44px; click a link, confirm the drawer closes and the correct route navigates; reopen, click outside the nav, confirm it closes; reopen, scroll the page, confirm the nav (and drawer) stay visible instead of sliding away.
- `npx tsc --noEmit`, scoped `npx eslint src/components/Navbar.tsx`, `npm run build`.
