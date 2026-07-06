# Profolio Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all existing bugs, migrate to Tailwind v4 config style, add a 5-preset theme switcher, add a featured-projects section, and wire up a GitHub Actions deploy to `afelopez.github.io`.

**Architecture:** Incremental patch — fix bugs first, then layer the theme system (CSS variables + React context), then the FeaturedProjects component, then the deploy workflow. No new dependencies beyond what is already installed.

**Tech Stack:** Next.js 16 (static export), Tailwind v4, TypeScript, Framer Motion, GitHub Actions + `peaceiris/actions-gh-pages@v4`

## Global Constraints

- Project root: `/home/afelopez/Projects/portfolio`
- All file paths below are relative to that root
- `npm run build` must pass with zero TypeScript errors and zero ESLint errors after every task
- Do not add any new npm dependencies
- Static export mode must remain (`output: 'export'` in `next.config.ts`)
- Do not touch `public/`, `package-lock.json`, `.env.local`, or `tsconfig.json` unless a task explicitly says to

---

### Task 1: Bug Fixes + Tailwind v4 Migration

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/repositories/page.tsx`
- Modify: `src/components/Profile.tsx`
- Delete: `tailwind.config.js`

**Interfaces:**
- Produces: clean build baseline all subsequent tasks depend on

---

- [ ] **Step 1: Fix `globals.css` — remove font conflict and migrate animations to Tailwind v4 `@theme`**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

/* ============================================================
   Tailwind v4 Theme Extensions (replaces tailwind.config.js)
   ============================================================ */
@theme {
  --animate-gradient-move: gradient-move 15s ease-in-out infinite alternate;
  --animate-gradient-fade: gradient-fade 12s ease-in-out infinite;
}

@keyframes gradient-move {
  0%   { transform: translate(0, 0); }
  100% { transform: translate(-50%, -50%); }
}

@keyframes gradient-fade {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.5; }
}

/* ============================================================
   Base — font is applied by Inter via next/font, not here
   ============================================================ */
body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 2: Fix `layout.tsx` — add `pt-20` to `<main>` so content is not hidden under the fixed navbar**

Replace the entire contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AL Portfolio",
  description: "A portfolio of my GitHub projects.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-transparent text-gray-900 dark:text-gray-100`}>
        <AnimatedGradientBackground />
        <Navbar />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Fix `repositories/page.tsx` — replace nested `<main>` with `<div>`**

Replace the entire contents of `src/app/repositories/page.tsx` with:

```tsx
import { getRepositories } from '@/lib/github';
import RepositoryCard from '@/components/RepositoryCard';

export default async function RepositoriesPage() {
  const repos = await getRepositories('afelopez');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">My GitHub Repositories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {repos.map((repo, i) => (
          <RepositoryCard key={repo.id} repo={repo} index={i} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Fix `Profile.tsx` — normalize indentation in the Languages section**

In `src/components/Profile.tsx`, find this block (around line 70–80):

```tsx
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
```

Replace it with:

```tsx
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
```

- [ ] **Step 5: Delete `tailwind.config.js`**

```bash
rm /home/afelopez/Projects/portfolio/tailwind.config.js
```

- [ ] **Step 6: Verify the build passes**

```bash
cd /home/afelopez/Projects/portfolio && npm run build
```

Expected: Build completes with no TypeScript errors and no ESLint errors. The `out/` directory is regenerated.

- [ ] **Step 7: Commit**

```bash
cd /home/afelopez/Projects/portfolio
git add src/app/globals.css src/app/layout.tsx src/app/repositories/page.tsx src/components/Profile.tsx
git rm tailwind.config.js
git commit -m "fix: bug fixes and Tailwind v4 migration

- Remove font conflict (Arial/Geist vars); Inter via next/font is sole font
- Add pt-20 to <main> so content clears fixed navbar
- Replace nested <main> in repositories page with <div>
- Normalize indentation in Profile.tsx Languages section
- Migrate custom animations from tailwind.config.js to globals.css @theme
- Delete tailwind.config.js (not needed in Tailwind v4)"
```

---

### Task 2: Theme CSS Variables + AnimatedGradientBackground

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/AnimatedGradientBackground.tsx`

**Interfaces:**
- Produces:
  - CSS custom properties `--gradient-start`, `--gradient-mid`, `--gradient-end` on `[data-theme="<name>"]` selectors
  - `AnimatedGradientBackground` reads those vars via inline `style` prop
- Consumes: `globals.css` from Task 1

---

- [ ] **Step 1: Add 5 theme variable sets to `globals.css`**

Append the following block to the **end** of `src/app/globals.css` (after the existing `body` rule):

```css
/* ============================================================
   Theme Variables — applied via data-theme on <html>
   ============================================================ */
:root,
[data-theme="sunset"] {
  --gradient-start: #f97316;
  --gradient-mid: #ec4899;
  --gradient-end: #8b5cf6;
}

[data-theme="ocean"] {
  --gradient-start: #06b6d4;
  --gradient-mid: #3b82f6;
  --gradient-end: #6366f1;
}

[data-theme="forest"] {
  --gradient-start: #10b981;
  --gradient-mid: #14b8a6;
  --gradient-end: #84cc16;
}

[data-theme="midnight"] {
  --gradient-start: #1e1b4b;
  --gradient-mid: #4c1d95;
  --gradient-end: #7c3aed;
}

[data-theme="mono"] {
  --gradient-start: #9ca3af;
  --gradient-mid: #6b7280;
  --gradient-end: #71717a;
}
```

- [ ] **Step 2: Update `AnimatedGradientBackground.tsx` to read theme CSS variables**

Replace the entire contents of `src/components/AnimatedGradientBackground.tsx` with:

```tsx
'use client';

const AnimatedGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] animate-gradient-move">
        <div
          className="absolute inset-0 -z-10 opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle 500px at 50% 30%, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%)',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedGradientBackground;
```

- [ ] **Step 3: Verify the build passes**

```bash
cd /home/afelopez/Projects/portfolio && npm run build
```

Expected: Build completes successfully.

- [ ] **Step 4: Commit**

```bash
cd /home/afelopez/Projects/portfolio
git add src/app/globals.css src/components/AnimatedGradientBackground.tsx
git commit -m "feat: add 5-theme CSS variable system

Define --gradient-start/mid/end per theme on [data-theme] selectors.
AnimatedGradientBackground reads vars via inline style instead of
hardcoded Tailwind arbitrary-value colors."
```

---

### Task 3: ThemeContext + ThemeToggle + Navbar + Layout

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `[data-theme]` CSS vars from Task 2
- Produces:
  - `ThemeProvider({ children })` — wraps app, sets `data-theme` on `<html>`, persists to `localStorage`
  - `useTheme()` → `{ theme: Theme, setTheme(t: Theme): void, cycleTheme(): void }`
  - `THEMES: Theme[]` — `['sunset', 'ocean', 'forest', 'midnight', 'mono']`
  - `ThemeToggle` — color-dot button in navbar that opens a 5-dot + random picker

---

- [ ] **Step 1: Create `src/context/ThemeContext.tsx`**

```tsx
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'sunset' | 'ocean' | 'forest' | 'midnight' | 'mono';
export const THEMES: Theme[] = ['sunset', 'ocean', 'forest', 'midnight', 'mono'];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sunset');

  useEffect(() => {
    const stored = localStorage.getItem('portfolio-theme') as Theme | null;
    const initial =
      stored && THEMES.includes(stored)
        ? stored
        : THEMES[Math.floor(Math.random() * THEMES.length)];
    applyTheme(initial);
    setThemeState(initial);
  }, []);

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('portfolio-theme', t);
  }

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Create `src/components/ThemeToggle.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useTheme, THEMES, type Theme } from '@/context/ThemeContext';

const THEME_CONFIG: Record<Theme, { label: string; color: string }> = {
  sunset:   { label: 'Sunset',   color: '#f97316' },
  ocean:    { label: 'Ocean',    color: '#3b82f6' },
  forest:   { label: 'Forest',   color: '#10b981' },
  midnight: { label: 'Midnight', color: '#4c1d95' },
  mono:     { label: 'Mono',     color: '#6b7280' },
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const pickRandom = () => {
    const others = THEMES.filter((t) => t !== theme);
    setTheme(others[Math.floor(Math.random() * others.length)]);
    setOpen(false);
  };

  return (
    <div className="relative ml-4">
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Theme: ${THEME_CONFIG[theme].label} — click to change`}
        className="w-8 h-8 rounded-full border-2 border-white/60 dark:border-gray-600/60 shadow-md transition-transform hover:scale-110"
        style={{ backgroundColor: THEME_CONFIG[theme].color }}
      />

      {open && (
        <>
          {/* Backdrop — closes popover on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-10 z-50 flex items-center gap-2 rounded-2xl border border-white/40 bg-white/80 p-2 shadow-2xl backdrop-blur-xl dark:border-gray-700/40 dark:bg-gray-900/80">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpen(false); }}
                title={THEME_CONFIG[t].label}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  theme === t
                    ? 'scale-110 border-gray-800 dark:border-white'
                    : 'border-white/50 dark:border-gray-600/50'
                }`}
                style={{ backgroundColor: THEME_CONFIG[t].color }}
              />
            ))}

            {/* Random button */}
            <button
              onClick={pickRandom}
              title="Random theme"
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/50 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-xs font-bold text-white transition-transform hover:scale-110 dark:border-gray-600/50"
            >
              ?
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/Navbar.tsx` — import and add `ThemeToggle`**

Replace the entire contents of `src/components/Navbar.tsx` with:

```tsx
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
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-full shadow-2xl border border-white/40 dark:border-gray-700/40 px-4 sm:px-6">
        <div className="flex items-center h-14 gap-1">
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
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

- [ ] **Step 4: Update `src/app/layout.tsx` — wrap body content with `ThemeProvider`**

Replace the entire contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AL Portfolio",
  description: "A portfolio of my GitHub projects.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-transparent text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <AnimatedGradientBackground />
          <Navbar />
          <main className="pt-20">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify the build passes**

```bash
cd /home/afelopez/Projects/portfolio && npm run build
```

Expected: Build completes with no errors. TypeScript must resolve `ThemeContext` and `ThemeToggle` imports without issues.

- [ ] **Step 6: Commit**

```bash
cd /home/afelopez/Projects/portfolio
git add src/context/ThemeContext.tsx src/components/ThemeToggle.tsx src/components/Navbar.tsx src/app/layout.tsx
git commit -m "feat: add 5-preset theme switcher

ThemeProvider sets data-theme on <html> and persists to localStorage.
First visit picks a random theme. ThemeToggle in Navbar shows a
color-dot picker + random button."
```

---

### Task 4: Featured Projects Section

**Files:**
- Create: `src/components/FeaturedProjects.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `repos: Repo[]` from `getRepositories()` (already fetched in `page.tsx`)
- Produces: `FeaturedProjects({ repos: Repo[] })` — renders top 5 by `stargazers_count`

---

- [ ] **Step 1: Create `src/components/FeaturedProjects.tsx`**

```tsx
'use client';
import { motion } from 'framer-motion';
import { Repo } from '@/lib/github';

interface FeaturedProjectsProps {
  repos: Repo[];
}

export default function FeaturedProjects({ repos }: FeaturedProjectsProps) {
  const featured = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 mb-12">
      <h2 className="text-3xl font-bold mb-6 text-center">Featured Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.map((repo, i) => {
          const topLanguages = repo.languages
            ? Object.keys(repo.languages).slice(0, 3)
            : repo.language
            ? [repo.language]
            : [];

          return (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              whileHover={{ y: -5 }}
              className="flex flex-col justify-between rounded-2xl border border-white/40 bg-white/30 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/40 dark:bg-gray-900/30"
            >
              <div>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {repo.name}
                  </h3>
                </a>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {repo.description || 'No description available.'}
                </p>
              </div>

              <div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium dark:bg-gray-700"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ⭐ {repo.stargazers_count}
                  </span>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx` to render `FeaturedProjects` below the profile**

Replace the entire contents of `src/app/page.tsx` with:

```tsx
import Profile from '@/components/Profile';
import FeaturedProjects from '@/components/FeaturedProjects';
import { getRepositories } from '@/lib/github';

export default async function Home() {
  const repos = await getRepositories('afelopez');
  return (
    <>
      <Profile repos={repos} />
      <FeaturedProjects repos={repos} />
    </>
  );
}
```

- [ ] **Step 3: Verify the build passes**

```bash
cd /home/afelopez/Projects/portfolio && npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/afelopez/Projects/portfolio
git add src/components/FeaturedProjects.tsx src/app/page.tsx
git commit -m "feat: add featured projects section

Shows top 5 repos by star count on the home page below the profile card.
Reuses the already-fetched repos array — no extra API calls."
```

---

### Task 5: GitHub Actions Deploy Workflow + Publish

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run deploy` script from `package.json` (runs `next build && touch out/.nojekyll`)
- Produces: auto-deploy to `gh-pages` branch of `afelopez/afelopez.github.io` on every push to `main`

---

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        run: npm run deploy
        env:
          GITHUB_ACCESS_TOKEN: ${{ secrets.GITHUB_ACCESS_TOKEN }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

- [ ] **Step 2: Commit the workflow**

```bash
cd /home/afelopez/Projects/portfolio
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy to GitHub Pages

On push to main: install → next build (static export) → deploy out/
to gh-pages branch via peaceiris/actions-gh-pages.
Requires GITHUB_ACCESS_TOKEN repo secret for the GitHub API fetch."
```

- [ ] **Step 3: Create the `afelopez.github.io` GitHub repository**

Using the GitHub MCP tool or `gh` CLI:

```bash
gh repo create afelopez/afelopez.github.io --public --description "Personal portfolio — afelopez.github.io"
```

- [ ] **Step 4: Add the remote and push**

```bash
cd /home/afelopez/Projects/portfolio
git remote add origin https://github.com/afelopez/afelopez.github.io.git
# If a remote already exists, update it:
# git remote set-url origin https://github.com/afelopez/afelopez.github.io.git
git push -u origin main
```

- [ ] **Step 5: Set the `GITHUB_ACCESS_TOKEN` repo secret**

In the GitHub repo settings → Secrets and variables → Actions, add:
- Name: `GITHUB_ACCESS_TOKEN`
- Value: a GitHub personal access token with `public_repo` scope (the same token used in `.env.local`)

- [ ] **Step 6: Enable GitHub Pages in repo settings**

Go to: `https://github.com/afelopez/afelopez.github.io/settings/pages`
- Source: **Deploy from a branch**
- Branch: `gh-pages` / `/ (root)`
- Save

- [ ] **Step 7: Verify deployment**

After the Actions workflow completes (~2 min), visit `https://afelopez.github.io`.
Expected: Portfolio loads with the animated gradient background, glassmorphism navbar with theme toggle, profile section, and featured projects section.

---

## Self-Review

**Spec coverage check:**
- ✅ Bug fixes (font, navbar padding, nested main, Tailwind animations, indentation) — Task 1
- ✅ Tailwind v4 migration — Task 1 + Task 2
- ✅ 5-theme switcher with random picker — Task 2 + Task 3
- ✅ Theme persists to localStorage — Task 3 (ThemeProvider useEffect)
- ✅ Featured projects (top 5 by stars, no extra API calls) — Task 4
- ✅ GitHub Actions deploy to `afelopez.github.io` — Task 5

**Placeholder scan:** No TBDs, TODOs, or vague steps. Every code block is complete and runnable.

**Type consistency:**
- `Theme` type defined in Task 3, consumed correctly in `ThemeToggle` (Task 3) and `AnimatedGradientBackground` (Task 2 reads CSS vars — no TS dependency)
- `Repo` type from `@/lib/github` used consistently in `FeaturedProjects` (Task 4)
- `repos: Repo[]` prop flows from `page.tsx` → `Profile` and `FeaturedProjects` — both components accept the same prop name and type

**No gaps found.**
