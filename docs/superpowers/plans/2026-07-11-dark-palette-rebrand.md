# Dark Palette Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the portfolio to a single, always-on dark theme built from a 4-color brand palette, removing all theme-switching code and fixing card-vs-background contrast.

**Architecture:** Delete the light/dark toggle and the already-dead 5-preset theme system; hardcode `.dark` on `<html>`; collapse `globals.css`'s `:root`/`.dark` CSS-variable pair into a single `:root` block holding the new palette; mechanically swap the `blue-*` Tailwind accent utility classes to `teal-*` (an exact hex match for the new aqua accent) across the 4 files that use them.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (class-based dark mode via `@custom-variant`), TypeScript.

## Global Constraints

- Palette (verbatim from spec): Azul medianoche `#0F2942` (page background) · Verde azulado (Aqua) `#0D9488` (accent — exact match to Tailwind `teal-600`) · Gris carbón (Charcoal) `#334155` (card/`.glass` background — exact match to Tailwind `slate-700`) · Blanco nieve (Snow) `#F8FAFC` (primary text).
- Single always-on dark theme. No toggle UI, no `localStorage`, no `prefers-color-scheme` check anywhere.
- `@custom-variant dark (&:is(.dark *));` in `globals.css` **must stay** — every existing `dark:*` Tailwind utility across the codebase depends on it to resolve now that `.dark` is permanently applied.
- No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>` (the unscoped `npm run lint` has ~12,733 pre-existing, unrelated problems confirmed in prior work on this repo — do not use it as a gate), `npm run build`, and `curl`/`grep` checks against server-rendered HTML and compiled CSS.
- Out of scope: sweeping neutral `gray-*` utility classes to `slate-*`; any change to `NodeBackground.tsx`'s color palette (deferred to a separate sub-project).
- **Correction to the spec:** the design spec's §4.5 table lists `Navbar.tsx` as needing an accent-color swap ("active nav-link underline/text color"). This is inaccurate — `Navbar.tsx`'s current active-link styling (`text-gray-900 dark:text-white` text, `bg-white/60 dark:bg-gray-800/60` underline pill) contains no blue/accent color at all, confirmed by reading the file. **No accent-color change is needed in `Navbar.tsx`.** Task 3 below covers only the 4 files that actually contain `blue-*` classes.

---

### Task 1: Delete dead/obsolete theme-switching code

**Files:**
- Delete: `src/context/ThemeContext.tsx`
- Delete: `src/components/ThemeToggle.tsx`
- Delete: `src/components/AnimatedGradientBackground.tsx`
- Delete: `src/components/ModeToggle.tsx`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Produces: nothing new. Removes the `ModeToggle` default export from the module graph entirely.

- [ ] **Step 1: Confirm the 4 files have no other consumers before deleting**

Run: `grep -rn "ThemeContext\|ThemeToggle\|AnimatedGradientBackground\|ModeToggle" /home/afelopez/Projects/portfolio/src --include="*.tsx" --include="*.ts"`

Expected output (exactly these 5 lines — the files' own definitions, plus `Navbar.tsx`'s import/usage of `ModeToggle`, which Step 3 removes):
```
src/components/ThemeToggle.tsx:13:export default function ThemeToggle() {
src/context/ThemeContext.tsx:20:export function ThemeProvider({ children }: { children: ReactNode }) {
src/context/ThemeContext.tsx:52:  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
src/components/AnimatedGradientBackground.tsx:3:const AnimatedGradientBackground = () => {
src/components/AnimatedGradientBackground.tsx:24:export default AnimatedGradientBackground;
src/components/ModeToggle.tsx:4:export default function ModeToggle() {
src/components/Navbar.tsx:7:import ModeToggle from './ModeToggle';
src/components/Navbar.tsx:59:          <ModeToggle />
```
If any other file shows up, STOP — something depends on this code that the spec didn't account for. Report BLOCKED rather than deleting.

- [ ] **Step 2: Delete the 4 files**

```bash
rm src/context/ThemeContext.tsx
rm src/components/ThemeToggle.tsx
rm src/components/AnimatedGradientBackground.tsx
rm src/components/ModeToggle.tsx
```

- [ ] **Step 3: Remove the `ModeToggle` import and usage from Navbar.tsx**

In `src/components/Navbar.tsx`, remove this import line:
```tsx
import ModeToggle from './ModeToggle';
```

And remove this block (currently right before the closing `</div>` of the nav pill):
```tsx
        <div className="ml-2">
          <ModeToggle />
        </div>
```

The file's return statement should end up as:
```tsx
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
    </motion.nav>
  );
};

export default Navbar;
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0 (confirms nothing else imports the deleted files).

Run: `npx eslint src/components/Navbar.tsx`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove theme-switching code (single dark theme going forward)"
```

---

### Task 2: Force permanent dark mode and apply the new palette

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing from Task 1 directly, but must run after Task 1 (Navbar no longer references the deleted toggle, so there's no JS left that un-sets `.dark`).
- Produces: `<html>` permanently carries the `dark` class; `--background`, `--foreground`, `--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-highlight`, `--muted`, `--subtle` CSS variables hold the new palette values, read by every component that already uses `var(--background)` / `.glass`.

- [ ] **Step 1: Hardcode dark mode in layout.tsx**

In `src/app/layout.tsx`, change:
```tsx
    <html lang="en">
```
to:
```tsx
    <html lang="en" className="dark">
```

- [ ] **Step 2: Replace the CSS variable blocks in globals.css**

In `src/app/globals.css`, replace this entire section:
```css
:root {
  --background: #f2f2f4;
  --foreground: #0f0f0f;

  /* Glass card */
  --glass-bg: rgba(235, 235, 240, 0.92);
  --glass-border: rgba(255, 255, 255, 0.98);
  --glass-shadow: rgba(0, 0, 0, 0.09);
  --glass-highlight: rgba(255, 255, 255, 1);

  /* Text */
  --muted: #525a6a;
  --subtle: #8891a0;
}

.dark {
  --background: #0b0b10;
  --foreground: #eeeeee;

  --glass-bg: rgba(16, 16, 24, 0.92);
  --glass-border: rgba(255, 255, 255, 0.09);
  --glass-shadow: rgba(0, 0, 0, 0.65);
  --glass-highlight: rgba(255, 255, 255, 0.06);

  --muted: #a8b2c2;
  --subtle: #6e7a8a;
}
```
with this single block:
```css
:root {
  /* Azul medianoche */
  --background: #0F2942;
  /* Blanco nieve */
  --foreground: #F8FAFC;

  /* Glass card — Gris carbón, distinct from the midnight-blue background */
  --glass-bg: rgba(51, 65, 85, 0.92);
  --glass-border: rgba(248, 250, 252, 0.10);
  --glass-shadow: rgba(0, 0, 0, 0.55);
  --glass-highlight: rgba(248, 250, 252, 0.06);

  --muted: #a8b2c2;
  --subtle: #6e7a8a;
}
```

Every other rule in `globals.css` (`@import "tailwindcss";`, `@custom-variant dark (&:is(.dark *));`, `html { scroll-behavior: smooth; }`, the `body` rule, the `.glass` rule) stays exactly as-is — they already read from these variables by name.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npm run build`
Expected: exit code 0, `/`, `/repositories`, `/certificates` all listed in the route output.

- [ ] **Step 4: Confirm the new palette actually compiled in**

Run: `grep -ro "0f2942" .next/static/css/*.css | head -1`
Expected: one match (the new background color, lowercased by the CSS minifier).

Run: `grep -ro "f2f2f4" .next/static/css/*.css | head -1`
Expected: no output (the old light background color must be gone).

- [ ] **Step 5: Confirm the html tag carries the dark class in server-rendered output**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/ | grep -o '<html[^>]*class="dark"[^>]*>'
```
Expected: one match showing `class="dark"` on the `<html>` tag.

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: force permanent dark mode with new brand palette"
```

---

### Task 3: Accent color swap — blue to teal

**Files:**
- Modify: `src/components/RepositoryCard.tsx`
- Modify: `src/components/CertificateCard.tsx`
- Modify: `src/components/CertificatesPage.tsx`
- Modify: `src/components/RepositoriesPage.tsx`

**Interfaces:**
- No signature/type changes anywhere in this task — purely Tailwind class-name string edits. Nothing produced for later tasks; nothing consumed from Tasks 1-2 beyond "the app still builds."

- [ ] **Step 1: `src/components/RepositoryCard.tsx` — repo name hover color**

Change:
```tsx
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{repo.name}</h3>
```
to:
```tsx
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{repo.name}</h3>
```

- [ ] **Step 2: `src/components/RepositoryCard.tsx` — button colors (2 identical occurrences)**

This exact class string appears twice in the file (the "Github" button and the "Live Demo" button). Replace **both** occurrences of:
```
"inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 px-5 py-2 text-sm font-semibold text-blue-600 backdrop-blur-sm transition-colors hover:bg-blue-600/25 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
```
with:
```
"inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-5 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
```

- [ ] **Step 3: `src/components/CertificateCard.tsx` — "Ver certificado" button color**

Change:
```tsx
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 px-4 py-2 text-sm font-semibold text-blue-600 backdrop-blur-sm transition-colors hover:bg-blue-600/25 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
```
to:
```tsx
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/15 px-4 py-2 text-sm font-semibold text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
```

- [ ] **Step 4: `src/components/CertificatesPage.tsx` — focus rings (2 occurrences)**

Replace **both** occurrences of `focus:ring-blue-500` with `focus:ring-teal-500` (one on the search `<input>`, one on the sort `<select>`).

- [ ] **Step 5: `src/components/CertificatesPage.tsx` — active pill/page background (3 occurrences)**

This exact string appears three times (the "All" provider pill, the active-provider pill, and the active pagination-page button). Replace **all three** occurrences of:
```
'bg-blue-600 text-white'
```
with:
```
'bg-teal-600 text-white'
```

- [ ] **Step 6: `src/components/RepositoriesPage.tsx` — focus rings (2 occurrences)**

Replace **both** occurrences of `focus:ring-blue-500` with `focus:ring-teal-500` (search `<input>` and sort `<select>`).

- [ ] **Step 7: `src/components/RepositoriesPage.tsx` — active language pill (2 occurrences)**

Replace **both** occurrences of:
```
'bg-blue-600 text-white'
```
with:
```
'bg-teal-600 text-white'
```

- [ ] **Step 8: Verify no `blue-` classes remain in these 4 files**

Run:
```bash
grep -n "blue-" src/components/RepositoryCard.tsx src/components/CertificateCard.tsx src/components/CertificatesPage.tsx src/components/RepositoriesPage.tsx
```
Expected: no output (exit code 1 — no matches).

- [ ] **Step 9: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npx eslint src/components/RepositoryCard.tsx src/components/CertificateCard.tsx src/components/CertificatesPage.tsx src/components/RepositoriesPage.tsx`
Expected: no output, exit code 0.

- [ ] **Step 10: Full build check**

Run: `npm run build`
Expected: exit code 0, all 4 routes (`/`, `/_not-found`, `/certificates`, `/repositories`) listed in the output, matching what Task 2 already confirmed.

- [ ] **Step 11: Live render check**

Run: `npm run dev &`, wait ~6 seconds, then:
```bash
curl -s http://localhost:3000/repositories | grep -c "teal-600"
curl -s http://localhost:3000/certificates | grep -c "teal-600"
```
Expected: both greps return a count greater than 0 (the active/default pill and focus-ring classes render server-side even before any interaction, since they're static class strings in the initial HTML).

Stop the dev server afterward (find and kill the `next dev` process).

- [ ] **Step 12: Commit**

```bash
git add src/components/RepositoryCard.tsx src/components/CertificateCard.tsx src/components/CertificatesPage.tsx src/components/RepositoriesPage.tsx
git commit -m "feat: swap accent color from blue to teal (brand aqua #0D9488)"
```

---

## Final Manual QA (after Task 3, in a real browser)

1. `npm run dev`, open `http://localhost:3000/`.
2. Confirm the page background reads as midnight blue (`#0F2942`), not the old near-black.
3. Confirm every `.glass` card (profile card, project cards, nav pill) visibly stands out from the page background — this was the original contrast complaint.
4. Visit `/repositories` and `/certificates` — confirm search focus rings, active filter pills, and buttons ("Github", "Live Demo", "Ver certificado") are teal, not blue.
5. Confirm there is no light/dark toggle anywhere in the Navbar.
6. Reload the page a few times — confirm there's never a flash of the old light theme before dark applies (there shouldn't be, since it's now hardcoded server-side with no JS/localStorage involved).
