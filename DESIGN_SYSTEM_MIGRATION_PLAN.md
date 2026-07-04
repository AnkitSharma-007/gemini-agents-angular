# Maestro — Design System Migration Plan

**Date:** 2026-07-03
**Status:** **Migration complete & closed** — decisions locked (§10); **Phases 0–8 complete and committed**; ruleset locked at error severity. **Phase 9 (optional aesthetic modernization) was spiked on 2026-07-04 and declined** — glassmorphism/aurora retained (§10.6). Remaining follow-ups are both minor: a manual **on-device performance measurement** (§6 Phase 8), and a documented **touch-target exception** where a few dense inline utilities sit below the 40px `--target-min` baseline by design (still ≥ WCAG AA's 24px, §11). A post-migration polish log is in §13.
**Owner:** _TBD_
**Related docs:** `UX_DESIGN_AUDIT.md` (§4.6 gradient overload, §4.8 type/spacing, §4.9 radii, §4.7 performance), `PRODUCTION_READINESS_REVIEW.md`.

> **Framing.** Maestro already ships ~60% of a design system: a real token layer in `src/styles.scss` and reusable primitives in `src/_mixins.scss`. This is **not** a greenfield "adopt a design system" effort — it is a **mature-and-enforce** effort. The goal is to (1) fill the missing scales (type, spacing, radius steps, motion, z-index, a11y), (2) refactor components to consume tokens instead of magic numbers, (3) make drift impossible with automated enforcement, and (4) keep it a **lightweight, in-repo** system — no separate package, no Storybook productization, no CI (per prior maintainer decision).

---

## 1. Goals & non-goals

### Goals
1. **Single source of truth** for spacing, typography, radius, elevation, motion, z-index, and semantic color — consumed everywhere.
2. **Eliminate magic numbers** — no half-pixel font sizes, no ad-hoc radii, no raw px spacing in components.
3. **Enforce it** so the consistency can't rot (stylelint + documented conventions).
4. **Fix the audit issues this system can actually fix**: type/spacing scale (fully), gradient budget (make it enforceable), and provide the single lever for the performance pass.
5. **Non-breaking, incremental adoption** — each phase is independently shippable and reversible.
6. **Improve accessibility via tokens** where possible (contrast-safe palette, min touch-target token, focus-ring token, on-accent text color).

### Non-goals (explicitly out of scope)
- No standalone component library / npm package / Storybook.
- No CI pipeline (per prior maintainer decision) — verification stays local.
- No Figma/Style-Dictionary token pipeline.
- No wholesale visual redesign. This is **systematization**, not a re-skin. (The gradient-budget phase adjusts *usage*, not the brand identity.)
- Does **not** fix non-system issues from the audit: BYOK first-run experience, landmarks/skip-link markup, or the derivative aesthetic. (Focus-visible and touch targets are partially addressed via tokens; the markup changes are tracked separately.)

### Guiding principles
- **Additive first, refactor second.** Introduce tokens without touching components, then migrate consumers file-by-file.
- **Snap to scale, verify visually.** Migrating magic numbers to the nearest scale step causes small (≤2px) visual shifts. We accept these behind a per-phase visual QA gate (see §8).
- **One concern per phase, one PR per phase.** Small, reviewable, revertible.
- **Lean on Material's own token API** rather than fighting it with `::ng-deep`.

---

## 2. Current-state assessment

**What exists (`src/styles.scss`, `src/_mixins.scss`):**
- Color tokens (`--dea-fg/-muted/-subtle`, `--dea-bg*`, `--dea-accent*`, `--dea-success/warn/error`, `--dea-border/-strong`) with **full light/dark overrides**. ✅ Strong.
- Radius tokens: `--dea-radius-md/lg/xl` (14/20/28). ⚠️ Incomplete (no xs/sm; small radii hardcoded).
- Shadow tokens (`--dea-shadow-1/2`), one motion token (`--dea-transition`), gradient tokens, background-image tokens. ✅
- Mixins: `glass-surface`, `pill`, `brand-pill`, `brand-solid`, `tinted-pill`, `eyebrow`, `mono-tabular`, `brand-text-gradient`, `sized-icon`, `progress-thin`, breakpoint ladder. ✅ Good primitives.

**What's missing / leaking:**
| Gap | Evidence | Impact |
|---|---|---|
| **No type scale** | Font sizes span 9.5→22px incl. half-pixels (10.5/12.5/13.5/15.5) hardcoded per component | Inconsistent rendering, unmaintainable |
| **No spacing scale** | Raw px gaps/padding: 2,3,6,8,10,12,14,16,18,20,22,24,28,32,36,48,56,80 | No rhythm, drift-prone |
| **Radius leakage** | Hardcoded 4,6,8,10,11,12,13,16,18,22 despite tokens existing | Shape language inconsistent |
| **No weight/line-height tokens** | 400/500/600/700 and 1.08–1.6 line-heights hardcoded | Minor drift |
| **No z-index scale** | `z-index: 30` (topbar), scattered `-1`/`1` | Stacking bugs risk |
| **No a11y tokens** | No focus-ring, no min-target, `#fff` on gradient, `--dea-fg-subtle` low-contrast at 10px | WCAG risks (audit §4.2/4.3/4.12) |
| **No enforcement** | Only prettier + eslint; no stylelint | Nothing prevents re-drift |
| **`::ng-deep` overrides** | schedule tabs, quality toggle, form fields | Brittle across Material upgrades |
| **Gradient overload** | Same brand gradient on ~10 surface types | Flattened hierarchy (audit §4.6) |
| **Perf** | `glass-surface` blur everywhere + `background-attachment: fixed` + animated gradients | Scroll jank risk (audit §4.7) |

---

## 3. Target token architecture

Proposed additions to `src/styles.scss` (values are **proposals** pending §10 sign-off). All are additive; nothing is removed until consumers are migrated.

### 3.1 Spacing (4px base)
```scss
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-9: 36px;
--space-12: 48px;
--space-14: 56px;
--space-20: 80px;
/* Decision §10.1 = PURE 4px scale: no half-step tokens.
   Off-grid values snap to nearest step (6→8, 10→12, 14→16, 18→20, 22→24). */
```

### 3.2 Typography scale
```scss
--text-2xs: 11px;   /* micro labels / eyebrows */
--text-xs: 12px;
--text-sm: 13px;
--text-md: 14px;    /* body base */
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 20px;
--text-3xl: 24px;
--text-4xl: 32px;
/* Display sizes keep clamp() for fluid hero/section titles */
--text-display-sm: clamp(1.5rem, 2.6vw, 2rem);
--text-display-md: clamp(1.5rem, 3vw, 2.2rem);
--text-display-lg: clamp(2rem, 4.4vw, 3.2rem);

--leading-none: 1.1;     /* Phase 2: hero/display titles (1.08) */
--leading-tight: 1.2;    /* refined during pilot: covers 1.15–1.25 */
--leading-snug: 1.35;    /* refined during pilot: covers 1.3–1.4 */
--leading-normal: 1.5;   /* covers 1.45–1.55 */
--leading-relaxed: 1.6;

--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* Consolidate letter-spacing (currently 0.02–0.14em ad hoc) */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.06em;   /* eyebrows */
--tracking-wider: 0.1em;
--tracking-widest: 0.14em;
```

### 3.3 Radius (extend existing)
```scss
--dea-radius-2xs: 4px;
--dea-radius-xs: 8px;
--dea-radius-sm: 12px;
/* existing: --dea-radius-md:14  --dea-radius-lg:20  --dea-radius-xl:28 */
--dea-radius-pill: 999px;
--dea-radius-round: 50%;
```

### 3.4 Motion
```scss
--duration-fast: 120ms;
--duration-base: 220ms;   /* matches current --dea-transition */
--duration-slow: 360ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized: cubic-bezier(0.2, 0.7, 0.3, 1.05); /* shellEnter */
/* keep --dea-transition as an alias of base+standard for back-compat */
```

### 3.5 Z-index
```scss
--z-base: 0;
--z-raised: 10;
--z-sticky: 30;     /* topbar */
--z-overlay: 1000;  /* CDK dialog/backdrop live above app chrome */
--z-toast: 1100;
```

### 3.6 Accessibility tokens
```scss
--target-min: 40px;               /* §10.4: baseline min interactive height */
--target-min-primary: 44px;       /* §10.4: primary actions (WCAG AAA / HIG) */
--focus-ring: 0 0 0 2px var(--dea-bg), 0 0 0 4px var(--dea-accent);
--color-on-accent: #fff;          /* audited to pass on the *adjusted* gradient/solid */
/* Contrast-corrected values for small/subtle text (replace or augment --dea-fg-subtle) */
```

---

## 4. Enforcement (guardrails)

Add **stylelint** (separate from the existing eslint) so tokens are mandatory, not optional.

- Packages: `stylelint`, `stylelint-config-standard-scss`, `stylelint-declaration-strict-value` (or a custom rule).
- Rules: require variables for `font-size`, `line-height`, `color`/`background-color`, `border-radius`, and (ideally) `padding`/`margin`/`gap`; disallow raw px in those properties except in the token definition file.
- Script: `"lint:styles": "stylelint \"src/**/*.scss\""`.
- **Adoption ramp:** start with the rules at **warning** severity (Phase 0) so the baseline is visible without blocking, then flip to **error** once components are migrated (Phase 8).
- Documentation: **this plan is the single reference.** The "use these tokens, not magic numbers" conventions live in §1/§3/§4/§10 alongside the enforced `stylelint` rules and the annotated token block in `styles.scss` (no separate contributor doc — deliberately, to avoid two files drifting out of sync).

---

## 5. Phased roadmap (overview)

| Phase | Objective | Breaking? | Effort | Depends on |
|---|---|---|---|---|
| **0** | Foundation & guardrails (docs, stylelint baseline as warnings, token file scaffolding) | No | S | — |
| **1** | Primitive tokens: spacing, radius steps, z-index | No (additive) | S | 0 |
| **2** | Typography scale + migrate all type usages (kill half-px) | Low (≤0.5px shifts) | M | 1 |
| **3** | Spacing + radius consumer migration (snap to scale) | Low (≤2px shifts) | M–L | 1 |
| **4** | Component consolidation: unified button + surface + pill primitives | Low | M | 2,3 |
| **5** | Semantic color + a11y tokens (contrast, focus-ring, touch-target) | Low–Med | M | 1 |
| **6** | Gradient budget (encode + apply the usage rule) | Med (visual) | M | 4,5 |
| **7** | Material token alignment / reduce `::ng-deep` | Low | M–L | 4 |
| **8** | Performance pass (blur/fixed-bg mitigation) + flip stylelint to error | Low | M | 1–7 |
| **9** *(optional, post-migration)* | Aesthetic modernization: move off full glassmorphism toward flatter, higher-contrast surfaces | Med–High (visual) | M | 1–8 |

**Pilot vertical slice (`widget-shell.scss`, 2026-07-03):** ✅ Done as the evidence gate before rolling type/spacing/radius wide. Added the typography token block (§3.2) and migrated the component onto type + leading + weight + radius + spacing + motion tokens. Result: component violations `20 → 1` (only the deferred `#fff` icon color remains for Phase 5); total baseline `229 → 210`; build clean. **Findings that shaped the plan:** (1) line-height scale refined to `1.2/1.35/1.5/1.6` (the original 1.15/1.3 mismatched the common 1.25/1.4/1.55); (2) pure-4px snapping produces the expected small padding shifts (e.g. `18→20`, `3→4`, `5→4`, `2→4`, `10→12`) — awaiting visual sign-off before wide rollout; (3) `letter-spacing: 0.08em` uppercase micro-labels (`.agent-label`, `.status-pill`) are eyebrow-shaped but don't use the `eyebrow` mixin and fall between tracking steps — flagged for Phase 4 consolidation; (4) `#fff`-on-gradient needs `--color-on-accent` (Phase 5).

**Recommended execution order & rationale:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Phases 1–3 are the highest-ROI, lowest-risk core (they fully solve audit §4.8/§4.9). Phase 5 (a11y) can run in parallel with 3/4 if capacity allows. Phase 6 (gradient budget) and 8 (perf) are the "taste + rendering" phases and are intentionally last because they benefit from the consolidated primitives. **Phase 9 is a separate, optional aesthetic track** that is deliberately decoupled from the systematization work (see §6 Phase 9 and §10.6) — it should only start once the token system is in place, because that is what makes a re-skin cheap and safe.

---

## 6. Phase details

### Phase 0 — Foundation & guardrails
- **Objective:** Set up the system's scaffolding and visibility without changing any pixels.
- **Scope (in):** Add stylelint config + `lint:styles` script (rules at **warning**); add a commented `// === TOKENS ===` structure to `styles.scss`; run a baseline audit report of violations.
- **Scope (out):** No component edits, no token values consumed yet.
- **Files:** `package.json`, `stylelint.config.js` (new), `src/styles.scss` (comments only).
- **Acceptance:** `npm run lint:styles` runs and prints the violation baseline; build/tests unaffected; docs merged.
- **Baseline captured (2026-07-03):** `229 warnings, 0 errors`. Design-token violations = **218**, split by property: **font-size 113**, **border-radius 49**, **line-height 40**, **color 15**, **stroke 1**. Remaining ~11 are minor hygiene nits (redundant shorthands, one hex-length, one deprecated keyword, one empty comment). Burn-down targets: Phase 2 clears font-size + line-height (153); Phase 3 clears border-radius (49); Phase 5 clears color + stroke (16).
- **Status:** ✅ Done — `stylelint.config.js` + `lint:styles`/`lint:styles:fix` scripts added; `styles.scss` token sections annotated (comments only); production build verified (styles 19.59 kB, unchanged). _(A separate `DESIGN_SYSTEM.md` was authored here and later removed — this plan is the single reference instead.)_
- **Risk/mitigation:** None material. Warnings-only avoids blocking.
- **Rollback:** Delete config + script.
- **Effort:** S.

### Phase 1 — Primitive tokens (additive)
- **Objective:** Define spacing, radius steps, motion, and z-index tokens.
- **Scope (in):** Add §3.1/3.3/3.4/3.5 tokens to `styles.scss` (both themes where relevant — most are theme-agnostic). Keep `--dea-transition` as an alias.
- **Scope (out):** Do not migrate consumers yet.
- **Files:** `src/styles.scss`.
- **Acceptance:** Tokens resolve in devtools; zero visual change (nothing consumes them yet); build clean.
- **Status:** ✅ Done — added to `styles.scss` (theme-agnostic): spacing `--space-0…20` (pure 4px scale), radius steps `--dea-radius-2xs/xs/sm/pill/round`, motion scale `--duration-*`/`--ease-*` (with `--dea-transition` recomposed as an alias, identical resolved value), and z-index `--z-*`. `lint:styles` unchanged (229 warnings, 0 errors); build clean.
- **Risk/mitigation:** Trivial. Additive only.
- **Rollback:** Remove token block.
- **Effort:** S.

### Phase 2 — Typography scale + migration
- **Objective:** Replace all hardcoded font-sizes/line-heights/weights/letter-spacing with tokens; **eliminate half-pixel sizes**.
- **Scope (in):** Add §3.2 tokens; migrate every component `.scss` + the `eyebrow`/`mono-tabular` mixins to consume them; map half-px to the nearest step (see §7.2).
- **Files:** `_mixins.scss` + all component `.scss` with font declarations (~15 files).
- **Acceptance:** stylelint `font-size` rule passes; no `\d+\.\d+px` font sizes remain; visual QA (§8) shows only intended micro-shifts; both themes checked.
- **Status:** ✅ Done (2026-07-03) — added `--leading-none` (1.1) for hero/display titles, then applied §3.2 tokens across `_mixins.scss` (`eyebrow`/`mono-tabular`/`pill` defaults) + **all 14 component `.scss`**. Migrated every `font-size`, `line-height`, `font-weight`, and the exact-match `letter-spacing` values (`-0.02` / `0.06` / `0.1` / `0.14em`); the three display clamps folded into `--text-display-lg/sm/md`. `citation-chips` icon `font-size`/`width`/`height` triples consolidated into the `sized-icon` mixin. **Result: total baseline `210 → 74` warnings; zero `font-size`/`line-height`/`font-weight`/`letter-spacing` violations remain** except **5 intentional non-scale cases**: the `sized-icon` mixin's dynamic icon-glyph px (now `stylelint-disable`d with a rationale) and 4 px/reset line-heights used purely for vertical centering (`audit-ribbon` `32px` ×2, `control-tower` `26px`, `api-key.dialog` `line-height: 1`) — deferred to the Phase 4 component refactor. Build clean. The remaining 74 warnings are all out-of-scope for Phase 2: `border-radius` (Phase 3), `#fff` colors (Phase 5), and a few shorthand-style nits.
- **Visual-QA note (for the per-phase gate, §8):** intended non-half-px grows to verify — `15→16`, `17→18`, `19→20`, and the locked `22→24` (§10.5) hero numbers; all half-px values rounded up `+0.5`. Off-scale `letter-spacing` (`0.02`/`0.04`/`0.07`/`0.08`/`0.12em` and `-0.005`/`-0.01`/`-0.015em`) intentionally left as literals — they fall between tracking steps and are earmarked for Phase 4 eyebrow consolidation. Mobile textarea/CTA sizes that were `13.5px` now match desktop at `14px` (`--text-md`).
- **Risk/mitigation:** Eyebrow labels at 9.5–10.5 snap to 11 (slightly larger) — mitigate with tracking tokens; verify hero/section clamps unchanged.
- **Rollback:** Revert the phase PR (self-contained).
- **Effort:** M.

### Phase 3 — Spacing + radius consumer migration
- **Objective:** Replace raw px padding/margin/gap and hardcoded radii with tokens (snap to scale).
- **Scope (in):** Migrate component `.scss` to `--space-*` and `--dea-radius-*`; normalize the radius grab-bag (§7.3).
- **Files:** all component/page `.scss` (~15 files).
- **Acceptance:** stylelint spacing/radius rules pass; visual QA confirms ≤2px shifts are acceptable; responsive breakpoints spot-checked.
- **Risk/mitigation:** Layout shift from snapping to the pure 4px scale (§10.1) — do it component-by-component with a visual check each; densest layouts (Control Tower, widgets) are the highest-risk and get extra scrutiny.
- **Rollback:** Per-file or per-phase revert.
- **Effort:** M–L (largest mechanical phase).
- **Status:** ✅ Done (2026-07-03). **Radius** (§7.3) migrated across all 16 `.scss` — the grab-bag `4/6/8/10/11/12/13/14/16/18/20/22px`, `999px`, `50%` folded onto `--dea-radius-2xs…xl` + `pill`/`round`. **Spacing** migrated onto the pure 4px scale (§10.1): every `padding`/`margin`/`gap` (shorthand + longhands + `padding-inline`/`row-gap`/`column-gap`), snapping off-grid values (`2/3/5→4`, `6/9→8`, `10/11/13→12`, `15→16`, `18→20`, `22→24`, `44→48`). Enforcement extended in `stylelint.config.js` to `/^padding/`, `/^margin/`, `/gap$/`; `1px` added to `ignoreValues` as a documented sub-scale hairline (inline `code`, dense chip insets). **Result: total baseline `74 → 32` warnings; zero `border-radius`/`padding`/`margin`/`gap` token violations remain.** The 32 residuals are all out-of-Phase-3 scope: **16 `#fff` color/stroke** (Phase 5), **4 non-scale `line-height`** (Phase 2 vertical-centering exceptions), and hygiene nits (`sized-icon` glyph px `disable`, one `column-gap`+`row-gap`→`gap` redundant-longhand suggestion). Build clean (styles 20.83 kB).
- **Visual-QA note (for the §8 gate):** notable snaps to verify — **radius:** `22→28` (no-key badge), `16/18→20` (workspace nested cards, mobile badge), `10/11/13→12`; **spacing:** `44→48` (no-key CTA bottom pad), `22→24` (hero/card paddings), and the small `2/3/5→4` growths across dense chips. `1px` hairlines on inline `code` (`styles.scss`) and the schedule `.track` chip intentionally preserved.

### Phase 4 — Component primitive consolidation
- **Objective:** One button system, one surface recipe, unified pills — remove the 3–4 competing primary-button treatments (audit §4.10).
- **Scope (in):** Introduce `button-primary`/`button-secondary`/`button-ghost` mixins (standard + large sizes) built on tokens; refactor `.cta-primary`, `.dispatch-btn`, `.feature-try`, `.connect-cta`, `.save-btn`, `.apply-btn` onto them; primary = **solid violet** in-app, gradient reserved for the hero CTA only (§10.3); primary actions honor `--target-min-primary` (44px, §10.4); consolidate `glass-surface` usages.
- **Files:** `_mixins.scss`, home/workspace/command-center/control-tower/widget/dialog/audit `.scss`.
- **Acceptance:** All primary CTAs share one height/fill/hover; visual QA; no regressions in disabled/hover/focus states.
- **Risk/mitigation:** Button height changes are visible — QA each screen; keep contextual "large" variant for hero.
- **Rollback:** Phase PR revert.
- **Effort:** M.
- **Status:** ✅ Done (2026-07-03). Added a **4-role button system** to `_mixins.scss` — `button-base` (shared height/pad/radius/font/transition/disabled) + `button-hero` (single brand-gradient), `button-primary` (solid violet), `button-secondary` (outlined), `button-ghost` (tertiary). Brought forward the two dimensional a11y tokens `--target-min` (40px) / `--target-min-primary` (44px) so the mixins are token-based (full §3.6 a11y/color block still lands in Phase 5). **Gradient budget for buttons (§10.3):** kept on the landing `.cta-primary` (hero + bottom section CTA, per sign-off) only; **all other primaries → solid** — `.feature-try`, `.connect-cta`, `.save-btn`, `.dispatch-btn`, `.apply-btn`, widget `.stale-update-btn`/`.ue-retry-btn`, and the header `.key-cta` chip. Stroked utilities (`.reaudit-btn`, both `.retry-btn`) → `button-secondary`; text utilities (`.clear-btn`, `.cancel-btn`) → `button-ghost`. `base` uses `min-height` (not fixed `height`) so per-breakpoint overrides and label-wrap can't be clamped; the no-key mobile height became `min-height`. `glass-surface` was already fully consolidated (every card surface uses the mixin; the `.topbar` stays a distinct sticky-blur by design). Removed the Phase-2-deferred non-scale `line-height` centering values on `.apply-btn`/`.retry-btn` (now sized via `min-height`). Build clean (styles 20.88 kB); `lint:styles` exit 0 with **no new** token violations.
- **Role map (for QA / future edits):** **hero (gradient):** home `.cta-primary`. **primary (solid violet):** `.feature-try`, `.connect-cta` (48px), `.dispatch-btn` (44px), `.save-btn` (40px), `.apply-btn` (32px), `.stale-update-btn`/`.ue-retry-btn` (32px), header `.key-cta`. **secondary (outlined):** home `.cta-secondary` (48px), `.reaudit-btn`/control-tower `.retry-btn` (small), widget error `.retry-btn` (36px). **ghost:** `.clear-btn`, `.cancel-btn`. Icon-only `.dismiss-btn` left outside the text-button system.
- **Visual-QA note (for the §8 gate):** the biggest intended visual changes — **feature-card "Try", empty-state "Connect Gemini key", dialog "Save", and header key chip go from gradient → solid violet** (this is the point of §10.3; verify the hero is now the only gradient CTA per view). Button label weight normalized to semibold (ghosts → medium) and the subtle `0.02em` button tracking dropped to `--tracking-normal`. Small inline utilities (26/32px) intentionally stay below `--target-min` to preserve dense layouts — earmarked for Phase 5 hit-area padding. Check disabled/hover/focus on each screen and both themes.

### Phase 5 — Semantic color + accessibility tokens
- **Objective:** Add contrast-safe roles, focus-ring, and min-target tokens; fix the WCAG risks that are tokenizable.
- **Scope (in):** Add §3.6 tokens; introduce a global `:focus-visible` rule using `--focus-ring`; apply `--target-min` to control mixins; correct `--dea-fg-subtle` contrast and the on-accent/gradient-button contrast (adjust gradient stops or add scrim); restrict gradient *text* to large sizes.
- **Files:** `styles.scss`, `_mixins.scss`, button/pill consumers.
- **Acceptance:** Contrast tool confirms AA on primary CTAs + subtle text; visible focus ring on all interactive elements in both themes; touch targets ≥ `--target-min`. (Markup-level a11y — `<main>`, skip link, shown-as-current nav — tracked separately, not in this plan.)
- **Risk/mitigation:** Adjusting gradient stops changes brand feel slightly — get sign-off (§10.3); focus ring must clear the busy background (use two-layer ring).
- **Rollback:** Phase PR revert.
- **Effort:** M.
- **Status:** ✅ Done (2026-07-04). Added the §3.6 a11y token block to `styles.scss`: `--color-on-accent` (#fff, theme-agnostic) and `--focus-ring` (outline shorthand keyed to `--dea-accent`), alongside the `--target-min`/`--target-min-primary` brought forward in Phase 4. Introduced a **global `:focus-visible`** rule (`outline: var(--focus-ring); outline-offset: 2px`) so every interactive element gets one keyboard-focus indicator in both themes — implemented via `outline` rather than the box-shadow two-layer originally sketched, because `outline` never conflicts with a control's own shadow and is never clipped by `overflow: hidden` glass surfaces (the offset gap gives ring separation on busy backgrounds). Tokenized **every** `#fff`/`stroke: #fff` foreground to `var(--color-on-accent)` (both brand mixins + 8 consumer files), clearing all `color`/`fill`/`stroke` strict-value violations. **Subtle-text contrast:** lightened dark `--dea-fg-subtle` `#6a7088 → #7c8498` and darkened light `#7a8198 → #626981` to reach WCAG AA (~4.7–5:1 computed) on surfaces. **Gradient contrast (§10.3, signed off):** added `--dea-gradient-brand-strong` (violet→magenta, no light cyan; both themes) and routed the only two white-on-gradient interactive elements — `button-hero` (hero + section CTA) and the header `.mode-pill` chip — onto it so white passes AA (~4.7–5.5:1); the decorative rainbow `--dea-gradient-brand` is untouched for background washes. Gradient *text* (`.brand-gradient`) is already only on large display headings, satisfying the "large sizes only" item. **Result:** `lint:styles` **35 → 13** warnings, **0** color/fill/stroke violations; the 13 residuals are pre-existing hygiene nits + 3 intentional non-scale `line-height` centering exceptions (deferred to Phase 7). Build clean; bumped the `anyComponentStyle` **warning** budget 14 → 16 kB to absorb token verbosity (20 kB error ceiling unchanged).
- **Visual-QA note (for the §8 gate):** verify both themes — (1) a visible violet focus ring appears on every button/link/input when tabbing; (2) the hero + bottom section CTA and the header mode chip now read **violet→magenta** (not rainbow) with crisp white text; (3) subtle/meta text (timestamps, hints, char-count) reads slightly stronger. **Known residual (outside the signed-off scope):** the hero *diagram* `.node-planner` node and the feature-card icon still use the decorative rainbow with white foreground — decorative illustration; can be moved to the strong gradient later if desired.

### Phase 6 — Gradient budget ✅ Done
- **Objective:** Restore hierarchy with the **strict** rule (§10.2): **max one** full-gradient emphasis element per view (audit §4.6).
- **Scope (in):** Define the rule here (§10.2); introduce a single `surface-accent` primitive; downgrade **all** secondary gradient washes (feature-card top bar, widget wash, ribbon rail, tower blob, auroras, badges, pills) to flat tinted surfaces or a hairline accent; keep the full gradient on the **hero only** (in-app primary CTAs are now solid per §10.3).
- **Files:** home/command-center/control-tower/widget-shell/audit/empty-state/dialog `.scss`.
- **Acceptance:** Each view has **exactly ≤1** full-gradient emphasis element; visual QA confirms improved focal hierarchy; both themes.
- **Risk/mitigation:** This is a **taste decision** — align on the rule before executing (§10.2). Do it view-by-view; easy to over- or under-correct.
- **Rollback:** Phase PR revert (self-contained per view).
- **Effort:** M.
- **Done (2026-07-04):** Chosen approach **"de-rainbow, keep the glow"** (§10.2 strict). The full brand rainbow now survives in exactly two sanctioned roles — the **hero / bottom-section CTA** (`button-hero` → `--dea-gradient-brand-strong`, the one emphasis element per view) and **large brand gradient _text_** (`brand-text-gradient`; audit §4.2 keeps this to display sizes). Everything else was downgraded:
  - **Ambient glows/auroras/blobs → flat single-accent (`--dea-accent`)** at unchanged opacity/blur (soft violet glow, no longer rainbow): home hero glow + CTA-card glow, command-center aurora, control-tower blob, widget-card wash, empty-state aurora, dialog aurora, workspace empty-state glow.
  - **Icon badges / logos → solid accent (`--dea-accent-solid`)** so white glyphs still pass AA: header logo, dialog title-badge, dialog selected toggle, workspace empty-illu, command-center title-glow, home pillar-icon, empty-state badge, widget badge chip, and the hero-diagram **Planner** node (Phase-5 residual folded in per sign-off).
  - **Crisp repeated bars → flat accent hairline:** home feature-card top bar, audit-ribbon default rail.
  - **Header mode-pill → tinted pill** (`tint(--dea-accent, 16%)` bg + `--dea-accent` text), dropping the gradient + glow shadow.
  - **Semantic status rails kept:** audit-ribbon `state-clean` (green) / `state-issues` (amber) are meaning-bearing, not brand overload, so untouched. `--dea-gradient-brand-soft` is now unused by consumers (definition retained).
- **Verify:** `npm run lint:styles` → 13 warnings / 0 errors (unchanged pre-existing hygiene); `npm run build` clean, no budget warnings.
- **Visual-QA note (for the §8 gate):** both themes — (1) each screen has **≤1** rainbow-gradient element (the hero/section CTA); (2) glows/auroras now read as a **single soft violet** wash, not a multicolor smear; (3) icon badges/logo are **solid violet** with legible white glyphs; (4) the header mode chip is a subtle violet **tinted** pill; (5) audit-ribbon clean/issues rails remain green/amber.

### Phase 7 — Material token alignment / reduce `::ng-deep` ✅ Done
- **Objective:** Replace brittle `::ng-deep` Material overrides with Material's token/theming API where feasible.
- **Scope (in):** Migrate schedule tabs, quality toggle, form-field overrides to Material system tokens / documented style hooks; keep `::ng-deep` only where unavoidable, documented.
- **Files:** schedule-widget, api-key.dialog, command-center, refine-bar `.scss`.
- **Acceptance:** Fewer `::ng-deep` blocks; visual parity; upgrade-resilience improved; unit tests unaffected.
- **Risk/mitigation:** Material token coverage varies by component — spike each before committing; leave a documented `::ng-deep` fallback if the API can't reach it.
- **Rollback:** Per-component revert.
- **Effort:** M–L.
- **Done (2026-07-04):** `::ng-deep` selectors reduced **13 → 6** (all remaining are documented, token-less layout fallbacks). Approach: because the repo runs Material 3 (`mat.theme`) and CSS custom properties cascade through emulated encapsulation, component tokens are set on the component wrapper — no `::ng-deep` required. Exact v22 token names were verified against `node_modules/@angular/material` before use.
  - **Fully migrated to tokens (0 `::ng-deep`):**
    - **schedule-widget tabs** → `--mat-tab-divider-color/-height`, `--mat-tab-{inactive,active}-{,hover-,focus-}label-text-color`.
    - **command-center `.prompt-field`** + **dialog `.key-field`** (both `appearance="outline"`) → `--mat-form-field-outlined-container-shape`; hint size → `--mat-form-field-subscript-text-size`.
    - **dialog save-btn spinner** → `--mat-progress-spinner-active-indicator-color` (replaces `::ng-deep circle { stroke }`).
  - **Partially migrated (colors/typography/height/state → tokens; documented `::ng-deep` kept for token-less internals):**
    - **dialog `.quality-toggle`** → `--mat-button-toggle-{background-color,text-color,divider-color,height,label-text-size/-weight/-tracking/-line-height,selected-state-background-color,selected-state-text-color,state-layer-color}`. Remaining `::ng-deep`: equal-width flex, compact label padding/gap, icon size, selected inset hairline. (Also dropped the chained `:not()` hover rule — hover is now the token state layer — which cleared 2 stylelint warnings, 13 → 11.)
  - **No token exists — documented `::ng-deep` fallback retained:** refine-bar subscript `display:none` (visibility), venue-widget `.mdc-evolution-chip-set__chips { gap }` (chip-set flex gap).
  - **Note:** the existing **global** `.mat-mdc-dialog-*` overrides in `styles.scss` are unscoped (not `::ng-deep`) and were left as-is.
- **Verify:** `npm run lint:styles` → 11 warnings / 0 errors; `npm run build` clean, no budget warnings.
- **Visual-QA note (for the §8 gate):** both themes — (1) schedule day-tabs: inactive labels muted, active label full-strength, 1px bottom divider; (2) API-key + prompt fields keep the rounded outline and small hint text; (3) **quality toggle** (highest-risk item): equal-width segments, compact height, selected segment solid violet with white label+icon and inset hairline, hover shows a subtle accent state layer; (4) save-btn spinner is white on the violet button; (5) venue amenity chips keep their gap; (6) refine-bar field stays single-row (no subscript).

### Phase 8 — Performance pass + enforcement hardening ✅ Done (enforcement + structural perf; device-measurement deferred)
- **Objective:** Mitigate blur/fixed-bg cost; lock the system by flipping stylelint to error.
- **Scope (in):** Measure scroll/paint on a mid-tier device; drop/limit `background-attachment: fixed` on mobile; cap concurrent `backdrop-filter` layers; add `@supports` fallbacks so glass degrades to solid; flip stylelint rules from warning → **error**.
- **Files:** `styles.scss`, `_mixins.scss` (glass-surface), page backgrounds; `package.json`/stylelint config.
- **Acceptance:** No measurable scroll jank on the target device; glass has an opaque fallback where blur is unsupported; `npm run lint:styles` passes at error severity; build within budgets.
- **Risk/mitigation:** Reducing blur changes look — keep it subtle and behind measurement; perf work is empirical, timebox it.
- **Rollback:** Revert mitigations; keep stylelint at warning if needed.
- **Effort:** M.
- **Done (2026-07-04):** Enforcement hardened and the structural (look-neutral) perf mitigations landed; empirical on-device blur tuning is deferred to a manual session (see follow-up).
  - **Enforcement locked:** `stylelint.config.js` flipped `defaultSeverity` **warning → error** and the `scale-unlimited/declaration-strict-value` design-token rule to **error**. Before flipping, the full baseline was burned to **zero** — the last design-token violation (audit-ribbon `.dismiss-btn` `line-height: 32px`, a `mat-icon-button` that Material already centers) was removed, and the 10 remaining standard-scss hygiene warnings were cleared (redundant-value insets, `#ffffff`→`#fff`, `optimizeLegibility` case, redundant `word-break: break-word` dropped where `overflow-wrap: anywhere` already applies, chained `:not()`→list notation, `row/column-gap`→`gap` shorthand). `npm run lint:styles` now passes at **error, 0 problems**.
  - **Glass robustness (look-neutral):** `glass-surface` gained an `@supports not (backdrop-filter…)` **opaque fallback** (`--dea-bg-solid-1`) so the translucent surfaces don't let the busy page background bleed through where blur is unsupported. Verified present in built CSS.
  - **Mobile perf (conservative):** on `(hover: none), (pointer: coarse)` the page `background-attachment` drops **fixed → scroll** (fixed forces a full-viewport repaint per scroll frame) and glass blur is **capped to 10px** via an inherited `--glass-blur-max` consumed by `glass-surface` as `blur(min($blur, var(--glass-blur-max, $blur)))`. **Desktop is byte-for-byte unchanged** (the var is unset, so `min($blur,$blur)=$blur`). Verified `blur(min(18px,var(--glass-blur-max, 18px)))` + `background-attachment:scroll` in built CSS.
  - **Deferred (manual):** actual scroll/paint **measurement on a mid-tier device**, and any further blur-radius / concurrent-layer reduction driven by those numbers. This is empirical and can't be measured in the build environment; the plumbing (`--glass-blur-max`) is in place so tuning is a one-line change.
- **Verify:** `npm run lint:styles` → **0 problems at error severity**; `npm run build` clean, no budget warnings; min()-blur, `@supports` fallback, and mobile `background-attachment:scroll` all confirmed in `dist`.
- **Visual-QA note (for the §8 gate):** desktop look unchanged (regression check across both themes); on a touch device the page background scrolls with content (no parallax) and glass panels are slightly less blurred — verify text-on-glass contrast still holds.

### Phase 9 — Aesthetic modernization (optional) — ⛔ DECLINED (spiked 2026-07-04)
- **Decision (2026-07-04):** Spiked on the workspace screen (opaque elevated surfaces, `backdrop-filter` removed, auroras dialed back), then rolled out globally for an A/B review in **both themes**. The flatter direction was judged to weaken this product's identity, so it was **declined**; the entire change set was **reverted and never committed** — glassmorphism/aurora is retained. This phase is closed. Because the re-skin was purely a token-value + `glass-surface` change, it can be revisited later as a self-contained edit if the direction is reconsidered. The original plan for the phase is preserved below for reference.
- **Objective:** Act on the audit's aesthetic recommendation (§4.6, §7.4): move away from full glassmorphism/aurora toward flatter, higher-contrast, "quiet luxury" surfaces with accent used surgically — *without* re-touching every file.
- **Why it's separated:** This is a **subjective, direction-setting redesign**, not systematization. Coupling it with Phases 0–8 would (a) balloon scope, (b) break the per-phase visual-QA gate (you can't distinguish an intended re-skin shift from a migration regression when both happen at once), and (c) require its own design sign-off. Phases 0–8 keep the look constant on purpose. Once the token system exists, this becomes a small, centralized change instead of a cross-file overhaul.
- **Prerequisite:** Phases 1–8 complete. Because surface/elevation/gradient are now tokens, the re-skin is primarily a **token-value change** (surface recipes, elevation, gradient stops) plus the `glass-surface` mixin — not edits scattered across ~15 components.
- **Scope (in):** Redefine surface/elevation tokens toward opaque, higher-contrast surfaces; reduce/replace `backdrop-filter` glass with solid elevated tokens; dial back auroras; make accent colour an emphasis tool, not a background. Ship behind a spike + explicit before/after sign-off.
- **Scope (out):** Layout/IA changes, new components, marketing-page restructure (tracked separately).
- **Files:** primarily `styles.scss` (tokens) + `_mixins.scss` (`glass-surface`), with targeted component touch-ups.
- **Acceptance:** Agreed new visual direction applied consistently in both themes; contrast improves or holds; no perf regression; full visual QA (§8).
- **Risk/mitigation:** Highest *visual* risk of any phase and the most subjective — gate it behind a design spike and explicit sign-off; it is fully optional and can be declined without affecting Phases 0–8.
- **Rollback:** Revert the token-value change (self-contained by design).
- **Effort:** M (cheap *because* the migration was done first; would be L–XL without it).

---

## 7. Migration mechanics

### 7.1 Non-breaking method
- Tokens land **additively** (Phases 0–1) before any consumer changes.
- Migrate **one component `.scss` at a time**; each file is a small diff with a visual check.
- Keep back-compat aliases (`--dea-transition`) so nothing breaks mid-migration.

### 7.2 Type mapping (✅ applied in Phase 2)
| Current px | → Token | Note |
|---|---|---|
| 9.5, 10, 10.5, 11 | `--text-2xs` (11) | Eyebrows/micro labels grow ≤1.5px — compensate with tracking |
| 11.5, 12 | `--text-xs` (12) | |
| 12.5, 13 | `--text-sm` (13) | |
| 13.5, 14 | `--text-md` (14) | Body base |
| 15, 15.5, 16 | `--text-lg` (16) | |
| 17, 18 | `--text-xl` (18) | |
| 19, 20 | `--text-2xl` (20) | |
| 22 | `--text-3xl` (24) | §10.5: widget hero numbers read clearly larger |
| clamp() titles | `--text-display-*` | Unchanged behavior |

### 7.3 Radius mapping (✅ applied in Phase 3)
| Current px | → Token |
|---|---|
| 4 | `--dea-radius-2xs` |
| 6, 8 | `--dea-radius-xs` (8) |
| 10, 11, 12, 13 | `--dea-radius-sm` (12) |
| 14 | `--dea-radius-md` |
| 16, 18, 20 | `--dea-radius-lg` (20) |
| 22, 28 | `--dea-radius-xl` (28) |
| 999 | `--dea-radius-pill` |
| 50% | `--dea-radius-round` |

---

## 8. Verification & QA strategy (per phase)

Because there is **no CI and no automated visual-regression tooling today**, verification is deliberate and manual:

1. **`npm run build`** — must succeed within existing budgets (watch the initial-bundle/style-budget warning; no new errors).
2. **`npm run lint` + `npm run lint:styles`** — clean (styles at warning until Phase 8).
3. **`npm test`** — 142 specs still green (styling changes shouldn't affect logic).
4. **Manual visual QA** — walk the UI/UX section of `PRODUCTION_READINESS_REVIEW.md` (§QA.22 UX, §QA.19 theme) in **both light and dark**, at **desktop / tablet / mobile (375px)** breakpoints, before/after each phase. Focus on the surfaces the phase touched.
5. **Accessibility checks (Phase 5)** — run a contrast checker on primary CTAs, subtle text, and gradient text; keyboard-tab the app to confirm focus visibility; verify target sizes.
6. **Performance checks (Phase 8)** — DevTools performance profile on scroll on a mid-tier device/emulation.

**Optional (deferred, not required):** a local Playwright screenshot-diff harness for per-phase visual regression. Recommended if the migration surface grows, but explicitly *not* wired into CI.

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Visual drift from snapping magic numbers to the pure 4px scale (§10.1) | High | Low–Med | Per-file visual QA gate; extra scrutiny on densest layouts (Control Tower, widgets) in Phase 3 |
| Scope creep (turning it into a component library) | Med | High (time) | Non-goals in §1; timebox; one PR per phase |
| Bikeshedding on scale values | Med | Med | Lock §10 decisions before Phase 1 |
| Material `::ng-deep` migration hits API gaps | Med | Med | Spike per component; keep documented fallback |
| Gradient-budget over/under-correction | Med | Med | Align on the rule (§10.2); view-by-view |
| Perf changes alter the look | Med | Low | Subtle mitigations behind measurement |
| Accessibility gradient-stop change dilutes brand | Low | Med | Sign-off (§10.3); minimal viable adjustment |
| Half-pixel removal shifts dense layouts | Low | Low | Visual QA on Control Tower / widgets (densest) |

---

## 10. Decision record — LOCKED 2026-07-03

All six decisions are resolved. Values below are authoritative for the token layer and phases.

1. **Spacing model:** ✅ **Pure 4px scale.** No half-step tokens. Off-grid values snap to nearest step (6→8, 10→12, 14→16, 18→20, 22→24), accepted behind the per-file visual-QA gate (§8). _Densest layouts get extra scrutiny in Phase 3._
2. **Gradient budget rule:** ✅ **Strict — max one full brand-gradient emphasis element per view;** everything else flat-tinted or a hairline accent (Phase 6).
3. **Primary button identity:** ✅ **Solid violet (`brand-solid`) for in-app primary actions; gradient (`brand-pill`) reserved for the hero CTA only** (Phase 4).
4. **Touch-target strictness:** ✅ **40px baseline (`--target-min`), 44px on primary actions (`--target-min-primary`).** (40px comfortably clears WCAG AA's 24px minimum.)
5. **Type ceiling:** ✅ **Fold 22px → 24px (`--text-3xl`)** for widget hero numbers.
6. **Aesthetic direction:** ✅ **Keep glassmorphism through Phases 0–8;** the move off full glass is the separate, optional **Phase 9** (see §6). Rationale: the token system must exist first so the re-skin is a centralized token change rather than a cross-file overhaul, and so each systematization phase stays visually verifiable. **Update (2026-07-04): Phase 9 was spiked in both themes and declined — glassmorphism/aurora is retained.** See §6 Phase 9.

---

## 11. Success metrics

- **0** half-pixel font sizes; **0** raw-px font-size/radius declarations outside the token file.
- Interactive controls meet the touch-target policy (§10.4): primary actions ≥ `--target-min-primary` (44px); most controls ≥ `--target-min` (40px). **Known accepted exception (2026-07-04):** a few dense inline utilities (widget `apply`/`refine`/`retry` ≈ 32–36px, header `nav-link` 36px / `key-chip` 38px) sit below the 40px baseline to preserve dense layouts — all still clear WCAG AA's 24px minimum. Adding hit-area padding to lift them to 40px is an open, optional follow-up.
- Primary CTAs and subtle text **pass WCAG AA** contrast (both themes).
- **≤1** full-gradient emphasis element per view.
- `npm run lint:styles` passes at **error** severity (end state).
- No scroll-jank regression on the target device.
- Net **reduction** in `::ng-deep` blocks.
- A maintained token/conventions reference (this plan + the annotated `styles.scss` token block) that a contributor can follow.

---

## 12. Suggested sequencing summary

**Milestone A (core, highest ROI):** Phases 0 → 1 → 2 → 3. Delivers the type/spacing/radius system + enforcement baseline. Fixes audit §4.8/§4.9 outright.
**Milestone B (consistency + a11y):** Phases 4 → 5. Unified components + accessibility tokens.
**Milestone C (polish + hardening):** Phases 6 → 7 → 8. Gradient budget, Material alignment, performance, enforcement lock.
**Milestone D (optional, post-migration):** Phase 9. Aesthetic modernization off full glassmorphism — a separate, subjective re-skin that the token system makes cheap. Can be declined entirely without affecting A–C. **Status: declined (2026-07-04)** after a spike in both themes — glass retained.

Each phase = one small, reviewable, revertible PR. Nothing here blocks ongoing product work; the migration can pause between any two phases with the app in a fully consistent state.

---

## 13. Post-migration polish log (2026-07-04)

Small, non-phase touch-ups made after the core migration, recorded for traceability. These are polish, not a phase; `lint:styles` still passes at **error, 0 problems**.

- **Topbar tracking tokenized.** Closed the Phase-2/4 "off-scale `letter-spacing` left as literals" residual for the header: `.brand-text h1` `-0.01em → --tracking-tight`, `.nav-link` + `.key-chip` `0.02em → --tracking-normal`, `.masked` `0.04em → --tracking-wide`, `.mode-pill` `0.08em → --tracking-wider`. All sub-pixel visual changes; the entire topbar now sits on the tracking scale (§3.2). The icon (solid `--dea-accent-solid`) and wordmark (`brand-text-gradient`) were audited as already compliant.
- **Favicon aligned to the gradient budget.** `public/favicon.svg` moved off the retired violet→cyan→pink rainbow to the sanctioned strong gradient (`--dea-gradient-brand-strong`, violet→magenta); `index.html` `mask-icon` colour matched (`#6d4aff`). Keeps the browser-tab mark consistent with the de-rainbowed in-app logo (§6/§10.2).
- **Home copy/markup nits (non-system, tracked here for completeness):** feature-card CTA labels shortened + `text-wrap: balance` safety net so long labels never orphan a word; the "modern stack" section reworded for the zoneless/signals reality ("OnPush by default" → "Signal-based change detection") and literal template backticks replaced with `<code>` tags.
