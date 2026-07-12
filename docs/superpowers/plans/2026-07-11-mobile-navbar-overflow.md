# Mobile Navbar Overflow Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the floating nav pill with a hamburger toggle + dropdown drawer below `sm:` (640px), fixing a confirmed overflow where the pill's 459.6px content width clips past both edges of every mobile viewport.

**Architecture:** Single-component change — `src/components/Navbar.tsx` gains a `mobileOpen` state, a `sm:hidden` toggle button, and a `sm:hidden` `AnimatePresence` drawer, while the existing `sm:+` pill markup is preserved unchanged (just gated behind `hidden sm:flex` instead of an unconditional `flex`).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion (`AnimatePresence` — new import, already a project dependency). Verification uses real Playwright browser automation (v1.61.1, matching the browser binary already cached on this machine) run from a scratch directory outside the project — **not** added to `package.json`, since it's an agent-side QA tool, not something the shipped site needs.

## Global Constraints

- Breakpoint is `sm:` (640px) — not `md:`. Justified by the measured 459.6px pill content width plus a 180px safety margin.
- The `sm:+` pill's markup, classes, and behavior must be byte-for-byte unchanged from before this task — only its wrapper gains `hidden sm:flex` (replacing the previous unconditional `flex`).
- Mobile toggle button: `h-14 w-14`, `glass` styling, `aria-expanded={mobileOpen}`, `aria-label` toggling between "Open menu"/"Close menu".
- Drawer: `glass rounded-2xl`, each link `py-3` (≥44px measured tap-target height), closes on link click, route change (`pathname` change), and click-outside — no dark backdrop/scrim.
- While `mobileOpen` is true, the existing scroll-hide behavior must be suppressed — the nav (and drawer) must stay visible even if the user scrolls down.
- Toggle icon is a hand-drawn inline SVG (hamburger ↔ X via `stroke="currentColor"`), matching the convention in `src/components/LinkIcon.tsx` — no icon library dependency.
- The mobile wrapper `div` must be `relative inline-block` (not default block) so it shrink-wraps to the button and gives the drawer's `left-1/2 -translate-x-1/2` centering an unambiguous 56px-wide containing block.
- No test framework in this repo. Verification here uses live Playwright browser automation (real screenshots and DOM measurements), run against `npm run dev`, from the scratch directory `$CLAUDE_JOB_DIR/tmp/playwright-qa` (already has `playwright@1.61.1` installed — confirmed working in this environment during root-cause investigation). If `$CLAUDE_JOB_DIR` isn't set in your environment, use any scratch directory outside the project and `npm install playwright@1.61.1` there first.

---

### Task 1: Hamburger toggle + drawer for mobile navbar

**Files:**
- Modify: `src/components/Navbar.tsx` (full file, currently 63 lines)

**Interfaces:**
- Consumes: nothing new — `Link`, `usePathname`, `motion` are already imported; this task adds `AnimatePresence` from the same `framer-motion` package (already a dependency).
- Produces: nothing new — `Navbar` remains a default-exported component with no props, used exactly as it already is wherever it's rendered (verify with `grep -rn "import Navbar" src/` if unsure — no other file needs to change).

This is a UI-only change with no pure-function logic to unit test. Verification uses a real Playwright script that drives an actual browser against the running dev server and asserts on real measurements (bounding boxes, computed styles, visible link counts) — not just reading Tailwind class names.

- [ ] **Step 1: Write the failing verification script**

Create `$CLAUDE_JOB_DIR/tmp/playwright-qa/verify-navbar.js` (scratch directory — do not create this inside the project repo):

```js
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
let failed = false;

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`OK: ${message}`);
  }
}

async function withPage(viewport, fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  try {
    await fn(page);
  } finally {
    await browser.close();
  }
}

async function countVisibleNavLinks(page) {
  const links = await page.$$('nav a');
  let count = 0;
  for (const link of links) {
    if (await link.isVisible()) count++;
  }
  return count;
}

async function getToggleButton(page) {
  return page.$('nav button[aria-label]');
}

async function main() {
  // Mobile widths: nav must fit the viewport, show a toggle, and start with the drawer closed
  for (const width of [320, 375, 639]) {
    await withPage({ width, height: 800 }, async (page) => {
      const nav = await page.$('nav');
      const box = await nav.boundingBox();
      check(
        box.x >= 0 && box.x + box.width <= width,
        `nav fits within ${width}px viewport (x=${box.x}, width=${box.width})`
      );

      const toggle = await getToggleButton(page);
      check(toggle !== null, `toggle button present at ${width}px`);

      const visibleLinks = await countVisibleNavLinks(page);
      check(visibleLinks === 0, `no nav links visible before opening drawer at ${width}px (found ${visibleLinks})`);
    });
  }

  // Interaction: open drawer -> 4 links, each a real tap target
  await withPage({ width: 375, height: 800 }, async (page) => {
    const toggle = await getToggleButton(page);
    await toggle.click();
    await page.waitForTimeout(300);

    const links = await page.$$('nav a');
    let visible = 0;
    let allTallEnough = true;
    for (const link of links) {
      if (await link.isVisible()) {
        visible++;
        const box = await link.boundingBox();
        if (!box || box.height < 44) allTallEnough = false;
      }
    }
    check(visible === 4, `drawer shows all 4 links when open (found ${visible})`);
    check(allTallEnough, 'every visible drawer link is >= 44px tall (touch target)');

    const projectsLink = await page.$('nav a[href="/projects"]');
    await projectsLink.click();
    await page.waitForTimeout(300);
    check(page.url().endsWith('/projects'), `clicking a link navigates to /projects (url: ${page.url()})`);

    const afterNavVisible = await countVisibleNavLinks(page);
    check(afterNavVisible === 0, `drawer auto-closes after route change (visible links: ${afterNavVisible})`);
  });

  // Click-outside closes the drawer
  await withPage({ width: 375, height: 800 }, async (page) => {
    const toggle = await getToggleButton(page);
    await toggle.click();
    await page.waitForTimeout(300);
    await page.mouse.click(10, 700);
    await page.waitForTimeout(300);
    const visible = await countVisibleNavLinks(page);
    check(visible === 0, `drawer closes on click-outside (visible links: ${visible})`);
  });

  // Scrolling while the drawer is open must not hide the nav
  await withPage({ width: 375, height: 1200 }, async (page) => {
    await page.evaluate(() => { document.body.style.minHeight = '3000px'; });
    const toggle = await getToggleButton(page);
    await toggle.click();
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    const nav = await page.$('nav');
    const opacity = await nav.evaluate((el) => window.getComputedStyle(el).opacity);
    check(parseFloat(opacity) > 0.5, `nav stays visible while scrolling with drawer open (opacity=${opacity})`);
  });

  // Desktop widths: full pill, no toggle, all 4 links inline
  for (const width of [640, 1024, 1280]) {
    await withPage({ width, height: 800 }, async (page) => {
      const toggle = await getToggleButton(page);
      check(toggle === null, `no toggle button at ${width}px`);

      const visible = await countVisibleNavLinks(page);
      check(visible === 4, `all 4 pill links visible inline at ${width}px (found ${visible})`);

      const nav = await page.$('nav');
      const box = await nav.boundingBox();
      check(
        box.x >= 0 && box.x + box.width <= width,
        `nav fits within ${width}px viewport (x=${box.x}, width=${box.width})`
      );
    });
  }

  if (failed) {
    console.error('\nFAIL');
    process.exit(1);
  }
  console.log('\nPASS');
}

main();
```

- [ ] **Step 2: Start the dev server and run the script to verify it fails**

```bash
cd /home/afelopez/Projects/portfolio
(npm run dev > /tmp/portfolio-dev.log 2>&1 &)
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
  if [ "$code" = "200" ]; then echo "ready after ${i}s"; break; fi
  sleep 1
done
cd $CLAUDE_JOB_DIR/tmp/playwright-qa   # or wherever you installed playwright per Global Constraints
node verify-navbar.js
```

Expected: FAIL. Against the current `Navbar.tsx`, at 320/375/639px there is no `button[aria-label]` (the toggle doesn't exist yet) and the nav's bounding box exceeds the viewport (the full pill is what's rendered, unconditionally). You should see multiple `FAIL:` lines and a non-zero exit code.

- [ ] **Step 3: Implement the full rewrite of `src/components/Navbar.tsx`**

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

- [ ] **Step 4: Run the verification script again to verify it passes**

```bash
cd $CLAUDE_JOB_DIR/tmp/playwright-qa
node verify-navbar.js
```

Expected: every line prefixed `OK:`, ending with `PASS`. If the dev server auto-reloaded stale, restart it (kill the background process from Step 2, re-run the start block) before re-testing.

- [ ] **Step 5: Type-check, lint, build**

```bash
cd /home/afelopez/Projects/portfolio
npx tsc --noEmit
npx eslint src/components/Navbar.tsx
npm run build
```

Expected: all three succeed with no errors.

- [ ] **Step 6: Stop the dev server and commit**

```bash
kill %1 2>/dev/null || pkill -f "next dev" || true
git add src/components/Navbar.tsx
git commit -m "fix: replace overflowing mobile nav pill with hamburger toggle + drawer"
```

---

## Self-Review Notes

- **Spec coverage:** §2's breakpoint choice, toggle/drawer behavior, scroll-hide suppression, click-outside/route-change closing, icon convention, and the `relative inline-block` layout note are all present verbatim in Task 1's Step 3 code. §6's verification approach (real Playwright, scratch directory, not a project dependency) is Task 1's Steps 1-4.
- **Placeholder scan:** none — every step has complete code or exact commands with expected output.
- **Type consistency:** `Navbar` remains a no-props default export, matching every existing call site (no other file needs changes). `mobileOpen`/`visible`/`navRef` are all local state, nothing crosses a component boundary.
