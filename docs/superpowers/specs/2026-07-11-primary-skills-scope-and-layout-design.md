# Primary Skills Scope Fix & Two-Column Responsive Layout
**Date:** 2026-07-11
**Status:** Approved
**Approach:** Make `SELF_PERCEIVED_SKILL` the single source of truth for what counts as a "primary" language (fixing PLpgSQL/CoffeeScript leaking into Primary Skills), generalize the existing category-2-to-Secondary-tag rule to cover any non-primary language, and split Primary/Secondary Skills into an asymmetric two-column grid at a wider breakpoint than the sidebar's, validated via visual mockups.

## 1. Goal

Two independent but related fixes to the home page's skills section, shipped together since both touch the same files:
1. **Correctness**: `getPrimarySkills` currently returns every category-1 language detected in the user's repos, not just the ones the user has actually rated — real account data surfaced `PLpgSQL` and `CoffeeScript` in Primary Skills, both using the anonymous `SELF_PERCEIVED_DEFAULT` fallback (50), which the user does not consider a real primary skill.
2. **Layout**: Primary Skills (6-8 short bars) and Secondary Skills (~20 tags today) are stacked full-width on desktop despite neither needing the full content-column width — a senior-frontend/UX pass on the responsive behavior across mobile/tablet/desktop, informed by visual mockups.

## 2. Primary Skills scope — `SELF_PERCEIVED_SKILL` becomes the allowlist, not just a score source

Root cause: `getPrimarySkills` currently unions every category-1 language found in repos with the keys of `SELF_PERCEIVED_SKILL` (`src/lib/skills.ts:86-89`). A language the user never rated (PLpgSQL from a `.sql` migration file, CoffeeScript from an old repo) still enters this union and gets scored with `SELF_PERCEIVED_DEFAULT = 50`. This contradicts the entire premise of Revision 2 (self-perception as the deliberate, curated signal) — an unrated language slipping in defeats the "only my real distinguishing languages" intent.

**Fix**: `getPrimarySkills` iterates *only* over `Object.keys(SELF_PERCEIVED_SKILL)`. A language is a Primary Skill if and only if the user has explicitly rated it. `projectScore`/`recencyScore` still come from real repo data (0 if the language has no repos, exactly as today for Java/Go) — only the *candidate set* changes, not how each candidate is scored.

```ts
// src/lib/skills.ts — getPrimarySkills, full replacement
export function getPrimarySkills(repos: Repo[], limit = 8): PrimarySkill[] {
  const perLanguage: Record<string, { projects: number; mostRecentPush: string | null }> = {};

  for (const repo of repos) {
    if (repo.fork || !repo.languages) continue;
    for (const lang of Object.keys(repo.languages)) {
      if (CATEGORY_2_LANGUAGES.has(lang)) continue; // safety net: even if a category-2
      // language were ever added to SELF_PERCEIVED_SKILL by mistake, it still can't
      // accumulate project/recency stats here — see §2 rationale below.
      const entry = perLanguage[lang] ?? { projects: 0, mostRecentPush: null };
      entry.projects += 1;
      if (!entry.mostRecentPush || repo.pushed_at > entry.mostRecentPush) {
        entry.mostRecentPush = repo.pushed_at;
      }
      perLanguage[lang] = entry;
    }
  }

  const scored = Object.keys(SELF_PERCEIVED_SKILL).map((name) => {
    const stats = perLanguage[name] ?? { projects: 0, mostRecentPush: null };
    const selfPerception = SELF_PERCEIVED_SKILL[name] / 100;
    const score =
      selfPerception * 0.45 +
      projectScore(stats.projects) * 0.25 +
      recencyScore(stats.mostRecentPush) * 0.15 +
      popularityScore(name) * 0.15;
    return { name, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
```

`SELF_PERCEIVED_DEFAULT` (`src/lib/skills.ts:33`) becomes dead code under this change — every value read from `SELF_PERCEIVED_SKILL` is now always an explicit entry (the map is only ever indexed by its own keys) — and must be deleted, not left unused.

**Why keep the `CATEGORY_2_LANGUAGES` skip inside the `perLanguage` loop** even though the final candidate set no longer includes auto-detected languages: it's a defense-in-depth guard. If a category-2 language (CSS, HTML, ...) were ever accidentally added to `SELF_PERCEIVED_SKILL` in the future, this guard still stops it from accumulating real project/recency stats — its score would fall back to `projects: 0`/no-recency, keeping it structurally weak even if someone forgets the "primary languages only" rule when editing that table by hand.

## 3. Secondary Skills — generalize "not primary → tag" beyond just category-2

Today, only `CATEGORY_2_LANGUAGES` membership routes a detected language into Secondary Skills (`src/lib/skills.ts:158-163`); a category-1 language that isn't in `SELF_PERCEIVED_SKILL` (PLpgSQL, CoffeeScript) previously became a Primary Skill by the old union logic, so this case never needed handling. Now that §2 makes such languages disappear from Primary, they must not simply vanish — the existing site behavior (and this session's established preference from the Revision-2 brainstorm: "lo que no sea primario, va a secundario") is that anything real gets *shown somewhere*, just recategorized.

**Fix**: replace the `CATEGORY_2_LANGUAGES.has(lang)` check with the more general `!(lang in SELF_PERCEIVED_SKILL)` — this single condition now covers both category-2 languages (CSS, HTML, ...) and any category-1 language the user hasn't rated (PLpgSQL, CoffeeScript, or whatever shows up next), unifying two previously-separate rules into one: *"not a rated primary language → plain tag in Secondary."*

```ts
// src/lib/skills.ts — inside getSecondarySkills, replacing the existing language-tag loop
for (const repo of repos) {
  if (repo.fork || !repo.languages) continue;
  for (const lang of Object.keys(repo.languages)) {
    if (!(lang in SELF_PERCEIVED_SKILL)) detected.add(lang);
  }
}
```

(Uses the `in` operator, not truthiness, so a future self-perception score of literally `0` for a rated language still correctly counts as "primary, just rated low" rather than being miscategorized as secondary.)

`CATEGORY_2_LANGUAGES` remains defined and documented in the file (still used by §2's safety-net guard) — it just has one fewer call site.

## 4. Layout — asymmetric two-column grid, split at `lg:` not `md:`

Validated via visual mockups in this session (two rounds, both approved):

- **Breakpoint**: the sidebar already switches from stacked to side-by-side at `md:` (768px, `Profile.tsx`'s existing `md:flex-row`). Splitting Primary/Secondary into columns at that same breakpoint was tested and rejected — tablet widths (768-1024px) would have the sidebar *and* two skill columns competing for space simultaneously, cramping both. The skills split instead activates at `lg:` (1024px) — between `md:` and `lg:`, the sidebar is already side-by-side but Primary/Secondary stay stacked full-width, exactly matching current (already-shipped) behavior in that range.
- **Proportion**: not 50/50. Secondary Skills has ~20 tags today (vs. Primary's 6-8 bars) — an even split was mocked up and visibly left Secondary roughly 3x taller than Primary with significant dead space beside Primary's shorter column. The approved proportion is a 12-column grid with Primary at `lg:col-span-5` (~42%) and Secondary at `lg:col-span-7` (~58%), giving Secondary's tag-wrapping more room per row and narrowing (not eliminating) the height gap.
- **Vertical alignment**: `lg:items-start` on the grid row — neither column stretches to match the other's height. Some height difference between the two columns is expected and fine; the point of §4's proportion choice is to reduce it, not force equality.

```tsx
{/* src/components/Profile.tsx — replaces the two standalone Primary/Secondary <div>s */}
<div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
  <div className="lg:col-span-5">
    <h2 className="text-2xl font-bold mb-4">Primary Skills</h2>
    <div className="space-y-3">
      {/* unchanged primarySkills.map(...) */}
    </div>
  </div>

  <div className="lg:col-span-7">
    <h2 className="text-2xl font-bold mb-4">Secondary Skills</h2>
    <div className="flex flex-wrap gap-2">
      {/* secondarySkills.map(...) — see §5 for the one change inside this loop */}
    </div>
  </div>
</div>
```

This grid replaces the two standalone `<div>` blocks currently inside the `space-y-10` content column; the `<div className="flex-1 min-w-0 space-y-10">` wrapper and the Statistics block below stay exactly as they are — Statistics remains full-width, below the skills grid, unaffected by this change.

## 5. Secondary Skills animation — cap the stagger delay

With Secondary Skills now realistically at ~20 items (and growing over time as more frameworks/languages accumulate), the existing per-item stagger (`transition={{ duration: 0.5, delay: 0.1 * i }}`, `Profile.tsx:112`) has no upper bound — at 20 items the last tag doesn't start animating until 1.9s in, finishing around 2.4s total. That reads as sluggish for a portfolio's first impression. Primary Skills' stagger is unaffected (bounded by `limit = 8`, worst case 0.7s+duration — acceptable, not changed here).

```tsx
{/* src/components/Profile.tsx — inside the secondarySkills.map(...), transition prop only */}
transition={{ duration: 0.5, delay: Math.min(0.03 * i, 0.5) }}
```

Caps total stagger spread at 0.5s regardless of tag count — the first ~17 tags still stagger individually (`0.03 * i` stays below `0.5` through `i = 16`), everything after that enters together at the 0.5s mark instead of drifting further out.

## 6. Files Changed

| File | Action |
|---|---|
| `src/lib/skills.ts` | Modify — `getPrimarySkills` iterates `Object.keys(SELF_PERCEIVED_SKILL)` only (§2); delete unused `SELF_PERCEIVED_DEFAULT`; `getSecondarySkills`'s language-tag loop generalizes to `!(lang in SELF_PERCEIVED_SKILL)` (§3) |
| `src/components/Profile.tsx` | Modify — wrap Primary/Secondary in a `grid-cols-1 lg:grid-cols-12` row with `lg:col-span-5`/`lg:col-span-7` (§4); cap Secondary Skills' animation delay (§5) |

No changes to `src/app/page.tsx`, `src/lib/github.ts`, `/repositories`, or any other route — this is scoped entirely to the skills-scoring logic and the Profile component's skills section.

## 7. Out of Scope

- Any further change to the scoring formula itself (weights, factors) — unchanged from the prior Revision 2 spec.
- Mobile-specific spacing/padding tuning beyond what §4 already covers — the existing `space-y-10` rhythm and sidebar stacking behavior below `md:` are untouched and already validated.
- A cap or "show more" affordance for Secondary Skills' tag count — out of scope until the list grows large enough to be a real problem; not requested.

## 8. Testing / Verification

No test framework in this repo. `scripts/verify-skills-formula.ts` (the existing offline fixture test from Revision 2) must be updated: its fixture includes a category-1 language with no `SELF_PERCEIVED_SKILL` entry (matching the real PLpgSQL/CoffeeScript case) and asserts it does NOT appear in `getPrimarySkills`'s output. Beyond that: `npx tsc --noEmit`, scoped `npx eslint`, `npm run build`, then a manual browser check (`npm run dev`) at three widths — mobile (~375px, everything stacked), tablet (~800px, sidebar side-by-side but skills still stacked), desktop (~1280px, skills in the 5/7 column split) — confirming the layout and animation timing match this spec.
