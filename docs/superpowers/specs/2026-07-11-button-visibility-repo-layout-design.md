# Button Visibility & Repository Card Layout Design
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Second round of polish on the same `feature/list-pages-polish` branch — increase the shared icon-button contrast across all three list-page components, and give `RepositoryCard.tsx`'s bottom row a fixed-height two-column layout so language tags can wrap to 2 lines without ever growing the card or displacing the action buttons.

---

## 1. Goal

Two issues found after using the polished pages: the shared teal icon buttons read as "almost invisible" against the `.glass` card background, and `RepositoryCard.tsx`'s bottom row lets the button group drop to its own line when tags don't fit, instead of staying pinned to the right.

## 2. Button Visibility — applies everywhere the shared style is used

The icon-button treatment is currently identical in 4 call sites across 3 files:
- `ProjectsPage.tsx` (1 button per project link)
- `CertificateCard.tsx` (1 "Ver certificado" button)
- `RepositoryCard.tsx` (GitHub button + conditional Live Demo button)

All 4 change from:
```
border-teal-500/40 bg-teal-600/15 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/25 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20
```
to:
```
border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30
```
Background opacity roughly doubles (light: 15→25, dark: 10→20), border opacity increases (light: 40→60, dark: 30→50), and hover states shift up proportionally (light: 25→35, dark: 20→30). Same teal family throughout — no new color introduced, no size/shape change. `h-10 w-10` icon-button dimensions and everything else about the button stay as-is.

## 3. Repository Card — fixed-height two-column bottom row

Current structure lets the whole button+star group wrap to a second line if the row doesn't fit (`flex flex-wrap justify-between items-center gap-2`, both the tags div and the buttons div as flex children of that wrapping row). New structure:

- **Outer row** drops `flex-wrap` — it's now a plain `flex items-center justify-between gap-2` row that never itself wraps.
- **Tags column** (left, `flex-1`): fixed `h-14` (space for exactly 2 pill lines + gap) with `overflow-hidden`, keeps its own internal `flex flex-wrap gap-2`, and gets `content-start` so a single line of tags sits at the top of the reserved space rather than floating centered in it.
- **Actions column** (right, `shrink-0`): unchanged content (GitHub button, conditional Live Demo button, star count), but now a fixed-width block that can never be pushed to a new line — it's always vertically centered against the 2-line-tall tags column beside it.

Language tags stay capped at 3 (existing `topLanguages.slice(0, 3)` in `github.ts`-derived logic — unchanged), so in practice most cards will show tags on a single line within the reserved 2-line space; the 2nd line only actually renders when 3 tags (or long language names) don't fit on one line at a given card width. Either way, **every card in the grid reserves the identical row height** — this was an explicit choice (over a content-hugging height) so the grid reads as visually uniform regardless of how many/how long a given repo's language tags are.

```tsx
<div className="mt-6 flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
  <div className="flex h-14 flex-1 flex-wrap content-start gap-2 overflow-hidden">
    {topLanguages.map(lang => (
      <span key={lang} className="flex h-fit items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-medium">
        <span className={`h-2 w-2 rounded-full ${LANG_COLORS[lang] ?? 'bg-gray-400'}`} />
        {lang}
      </span>
    ))}
  </div>
  <div className="flex shrink-0 items-center gap-2">
    {/* GitHub button, conditional Live Demo button, star count — unchanged content */}
  </div>
</div>
```

## 4. Files Changed

| File | Action |
|---|---|
| `src/components/ProjectsPage.tsx` | Modify — button contrast only |
| `src/components/CertificateCard.tsx` | Modify — button contrast only |
| `src/components/RepositoryCard.tsx` | Modify — button contrast + bottom-row layout restructure |

## 5. Out of Scope

- `CertificatesPage.tsx`/`RepositoriesPage.tsx` list-level layout — untouched, this round only touches the individual card/button components.
- Changing the 3-tag cap or adding a "+N more" indicator for overflow tags — not requested, and unlikely to matter in practice given the 3-tag cap already in place.

## 6. Testing / Verification

No test framework in this repo. Verification is `npx tsc --noEmit`, scoped `npx eslint <files>`, `npm run build`, and `curl`/`grep` checks against server-rendered HTML. A dev server the user started in their own terminal is already running on port 3000 for this branch — verification should curl against it rather than starting/stopping a server.
