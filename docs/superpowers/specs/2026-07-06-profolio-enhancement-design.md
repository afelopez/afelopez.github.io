# Profolio Enhancement Design
**Date:** 2026-07-06  
**Status:** Approved  
**Approach:** Option A — Incremental patch on existing codebase

---

## 1. Bug Fixes

| Bug | Fix |
|---|---|
| Font conflict (`Inter` declared but `globals.css` sets `Arial` and references undefined Geist vars) | Remove `Arial` and Geist var references from `globals.css`; sole font source is `Inter` via `next/font` |
| Fixed navbar covers page content | Add `pt-20` to `<main>` in `layout.tsx` |
| `<main>` nested inside `<main>` in repositories page | Change `repositories/page.tsx` outer wrapper to `<section>` |
| Tailwind custom animations not working (v3 config with v4 runtime) | Migrate animations to `globals.css` `@theme` block; delete `tailwind.config.js` |
| Indentation inconsistency in `Profile.tsx` | Normalize indentation throughout |

---

## 2. Tailwind v4 Migration

Tailwind v4 is config-file-free. All customizations move to `globals.css`:

```css
@theme {
  --animate-gradient-move: gradient-move 15s ease-in-out infinite alternate;
  --animate-gradient-fade: gradient-fade 12s ease-in-out infinite;
}
@keyframes gradient-move { ... }
@keyframes gradient-fade { ... }
```

`tailwind.config.js` is deleted. `postcss.config.mjs` stays as-is (already uses `@tailwindcss/postcss`).

---

## 3. Theme Switcher (5 presets)

**Architecture:**
- `ThemeProvider` React context in `src/context/ThemeContext.tsx` wraps `<body>` and sets `data-theme` on `<html>`
- Persists selection to `localStorage` under key `portfolio-theme`
- On first load, randomly picks one of the 5 themes
- `ThemeToggle` component in the Navbar cycles through themes with a palette icon

**5 themes (CSS variable sets in `globals.css`):**

| Name | Background | Gradient colors |
|---|---|---|
| `sunset` | white / gray-950 | orange → pink → purple |
| `ocean` | white / slate-950 | cyan → blue → indigo |
| `forest` | white / gray-950 | emerald → teal → lime |
| `midnight` | #0a0a1a / #0a0a1a | deep navy → indigo → violet (dark only) |
| `mono` | white / gray-950 | gray → slate → zinc (no color) |

Each theme overrides the gradient colors via CSS custom properties read by `AnimatedGradientBackground`.

---

## 4. Featured Projects Section

**Component:** `src/components/FeaturedProjects.tsx`  
**Location:** Home page, below the profile card  
**Data source:** Reuses the `repos[]` array already fetched by `page.tsx` — zero extra API calls  
**Selection:** Top 5 by `stargazers_count` descending  

**Card contents:**
- Repo name (linked to GitHub)
- Description
- Top 3 languages as pill badges
- Star count
- "View on GitHub" CTA button

**Animation:** Framer Motion stagger — each card fades in with `delay: index * 0.1`

---

## 5. GitHub Pages Deploy

**Target repo:** `afelopez/afelopez.github.io`  
**Deployment:** Static export (`next build` → `out/`) via GitHub Actions  
**Trigger:** Push to `main`

**Workflow file:** `.github/workflows/deploy.yml`  
```
Install → npm run deploy (next build + .nojekyll) → peaceiris/actions-gh-pages → gh-pages branch
```

**Required GitHub secret:** `GITHUB_ACCESS_TOKEN` (already used in app; also needed for Actions to push to gh-pages branch — use `GITHUB_TOKEN` from Actions context instead, which is automatic).

**Environment variable:** `GITHUB_ACCESS_TOKEN` must be set as a repo secret for the GitHub API fetch at build time.

---

## Files Changed / Created

| File | Action |
|---|---|
| `src/app/globals.css` | Update — font fix, Tailwind v4 theme block with animations, 5 theme variable sets |
| `src/app/layout.tsx` | Update — add `pt-20` to main, wrap with ThemeProvider |
| `src/app/page.tsx` | Update — pass repos to FeaturedProjects |
| `src/app/repositories/page.tsx` | Update — replace outer `<main>` with `<section>` |
| `src/components/Navbar.tsx` | Update — add ThemeToggle button |
| `src/components/AnimatedGradientBackground.tsx` | Update — read theme CSS vars for gradient colors |
| `src/components/Profile.tsx` | Update — normalize indentation |
| `src/components/FeaturedProjects.tsx` | Create — new featured projects component |
| `src/components/ThemeToggle.tsx` | Create — theme switcher UI |
| `src/context/ThemeContext.tsx` | Create — ThemeProvider context |
| `tailwind.config.js` | Delete |
| `.github/workflows/deploy.yml` | Create — GitHub Actions deploy workflow |

---

## Out of Scope

- Contact form (requires backend/third-party service)
- About/Experience timeline
- Dark mode toggle (separate from theme switcher — themes include dark variants via CSS variables)
