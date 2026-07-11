# Dark Palette Rebrand Design
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Collapse to a single, always-dark theme using a fixed 4-color brand palette. Remove all theme-switching machinery (some already dead code). This is sub-project A of a larger rebrand — sub-project B (single-page layout, always-visible navbar, smooth-scroll, new geometric animated background) is a separate design that builds on the palette defined here.

---

## 1. Goal

Replace the current ad-hoc color system (default Tailwind blue accent, a light/dark toggle, and an unused 5-preset theme system) with one deliberate, always-on dark theme built from four brand colors, fixing the low card-vs-background contrast along the way.

## 2. Palette

| Name | Hex | Role |
|---|---|---|
| Azul medianoche (Midnight Blue) | `#0F2942` | Page background |
| Verde azulado (Aqua) | `#0D9488` | Accent — buttons, active states, links, focus rings, nav underline |
| Gris carbón (Charcoal) | `#334155` | Card/`.glass` background base |
| Blanco nieve (Snow White) | `#F8FAFC` | Primary text |

Two of the four colors are exact matches to existing Tailwind v4 default tokens, which is why no new `@theme` color definitions are needed for the accent:
- `#0D9488` = Tailwind `teal-600`
- `#334155` = Tailwind `slate-700`
- `#F8FAFC` = Tailwind `slate-50` (referenced only conceptually — the actual text color is driven by the `--foreground` CSS variable, not a `slate-50` utility class)
- `#0F2942` has no exact Tailwind token; it's set directly as a CSS custom property value.

## 3. Current State Being Replaced

- `src/context/ThemeContext.tsx` + `src/components/ThemeToggle.tsx` (5-preset theme picker: sunset/ocean/forest/midnight/mono) — **already dead code**, not imported by `layout.tsx` or anywhere else. Confirmed via `grep -rn "ThemeProvider|ThemeToggle" src/`.
- `src/components/AnimatedGradientBackground.tsx` — **already dead code**, same reason.
- `src/components/ModeToggle.tsx` — currently **live**: a binary light/dark toggle rendered in `Navbar.tsx`, defaults to `prefers-color-scheme` on first visit, persists manual choice to `localStorage['portfolio-mode']`, toggles a `.dark` class on `<html>`.
- `src/app/globals.css` — has a `:root { }` block (light values) and a `.dark { }` override block for `--background`, `--foreground`, `--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-highlight`, `--muted`, `--subtle`.
- Accent color throughout `Navbar.tsx`, `RepositoryCard.tsx`, `CertificateCard.tsx`, `CertificatesPage.tsx`, `RepositoriesPage.tsx` is Tailwind's default `blue-400/500/600` on buttons, active filter pills, focus rings, and the nav active-link underline.

## 4. What Changes

### 4.1 Delete (dead or obsoleted code)
- `src/context/ThemeContext.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/AnimatedGradientBackground.tsx`
- `src/components/ModeToggle.tsx`

### 4.2 `src/components/Navbar.tsx`
Remove the `import ModeToggle from './ModeToggle';` line and the `<ModeToggle />` JSX usage. No toggle UI remains — dark is the only theme.

### 4.3 `src/app/layout.tsx`
`<html lang="en">` becomes `<html lang="en" className="dark">`. Hardcoded, permanent — no JS, no `localStorage`, no `prefers-color-scheme` check, no flash-of-wrong-theme on load.

The `@custom-variant dark (&:is(.dark *));` declaration in `globals.css` **stays** — it's what makes every existing `dark:*` Tailwind utility class across the codebase (e.g. `dark:text-white`, `dark:bg-gray-700`, `dark:border-gray-700`) key off the `.dark` class rather than the OS preference. Since `.dark` is now permanently present, all of those `dark:*` utilities apply permanently. This means most component files (`Profile.tsx`, `RepositoryCard.tsx`, `CertificateCard.tsx`, etc.) need **no changes** to their existing `dark:*` classes — removing the toggle is enough to make dark styling permanent everywhere those classes already exist.

### 4.4 `src/app/globals.css`
Collapse `:root { }` and `.dark { }` into a single `:root { }` block holding the new palette (the separate `.dark { }` override block is deleted — there is no second theme to override to):

```css
:root {
  --background: #0F2942;
  --foreground: #F8FAFC;

  /* Glass card — charcoal, distinct from the midnight-blue background */
  --glass-bg: rgba(51, 65, 85, 0.92);   /* #334155 at high opacity */
  --glass-border: rgba(248, 250, 252, 0.10);
  --glass-shadow: rgba(0, 0, 0, 0.55);
  --glass-highlight: rgba(248, 250, 252, 0.06);

  --muted: #a8b2c2;
  --subtle: #6e7a8a;
}
```

`--muted`/`--subtle` are carried over unchanged from the old `.dark` block (already tuned for readability against a dark background — no reason to touch values that already work).

This directly fixes the original contrast complaint: `#334155` (charcoal) against `#0F2942` (midnight blue) are two visually distinct hues, unlike the old light-mode pairing where `--glass-bg` (`rgba(235,235,240,0.92)`) was barely different from `--background` (`#f2f2f4`).

### 4.5 Accent color: blue → teal
Mechanical find-and-replace of the accent color class names, file by file, wherever `blue-400/500/600` is used for interactive/active elements — no logic changes, no new color tokens:

| File | What changes |
|---|---|
| `Navbar.tsx` | Active nav-link underline/text color |
| `RepositoryCard.tsx` | "Github"/"Live Demo" button colors |
| `CertificateCard.tsx` | "Ver certificado" button color |
| `CertificatesPage.tsx` | Search input focus ring, sort-select focus ring, active provider pill, active-page pagination pill |
| `RepositoriesPage.tsx` | Search input focus ring, sort-select focus ring, active language pill |

Each `blue-600` → `teal-600`, `blue-500` → `teal-500`, `blue-400` → `teal-400`, `border-blue-500/40` → `border-teal-500/40`, etc. — same shade numbers, same opacity modifiers, only the color family name changes.

### 4.6 Explicitly out of scope
- Sweeping neutral `gray-*` utility classes (badges, pill backgrounds, secondary text) to `slate-*`. They already read as "charcoal-ish" and are visually close enough to `#334155`; changing every occurrence across every component is a large mechanical diff for a marginal visual difference. Can be revisited after seeing the result live.
- Anything from sub-project B (single-page layout, always-visible navbar, smooth-scroll section navigation, new geometric/class-diagram-style animated background). `NodeBackground.tsx`'s current randomized rainbow palette (orange/purple, pink/violet, etc.) is untouched by this spec and will look mismatched against the new brand colors until sub-project B replaces it — expected and acceptable for this phase.

## 5. Testing / Verification

No test framework in this repo (confirmed in a prior spec). Verification is:
- `npx tsc --noEmit` and `npm run lint` (scoped per-file, given the repo's pre-existing unrelated lint debt noted in earlier work on this project).
- `npm run build` succeeds.
- Manual/`curl` check: dev server running, every route (`/`, `/repositories`, `/certificates`) renders with the new background/card/accent colors and no light-mode flash.
