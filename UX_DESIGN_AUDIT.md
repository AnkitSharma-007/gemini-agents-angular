# Maestro — UI/UX & Visual Design Audit

**Date:** 2026-07-03
**Reviewer:** Product design / UX critique — evaluated as a production-ready commercial SaaS product, not a demo.
**Method:** Static review of the actual design system — global tokens (`src/styles.scss`), mixins (`src/_mixins.scss`), and every page/component template + SCSS. This is a code-level design review (no live screenshots or automated contrast tooling), so contrast/perf claims are flagged where they should be verified in-browser.
**Bias note:** The brief was explicit — *do not assume the design is good; be direct and critical.* I've held to that. Where the work is genuinely strong I say so, but the focus is on what's holding it back from world-class.

---

## 1. TL;DR verdict

Maestro is a **high-craft, design-system-driven dark UI** that looks like it was built by someone who cares. The token architecture, glassmorphism, motion, empty/loading/error states, and responsive coverage are well above typical hobby-project quality. **But it is not yet a world-class commercial product**, and the gap is not "add more polish" — it's a handful of specific, fixable problems:

1. The **"wow moment" (live multi-agent orchestration) is gated behind a BYOK key** and a static marketing page. First-time visitors experience *none* of the product's differentiator.
2. The aesthetic leans hard on **glassmorphism + aurora gradients** — a 2021–2022 trend — and repeats the same brand gradient on nearly every surface, which **flattens hierarchy** and reads as slightly dated/derivative.
3. **Accessibility has real, shippable-blocker gaps**: sub-minimum touch targets, low-contrast small text, white-on-gradient buttons that likely fail WCAG AA (especially in light mode), gradient *text*, no landmarks/skip link, and no custom focus-visible treatment.
4. **Consistency is strong at the token layer but leaky at the usage layer**: ad-hoc type scale (half-pixel sizes), inconsistent corner radii, and 3–4 competing "primary button" treatments.
5. A **factual branding bug** — the marketing page says "Angular 21" while the app ships on Angular 22 — is exactly the kind of tell that makes a product feel unfinished.

### Scorecard

| Dimension | Score | One-line justification |
|---|---|---|
| **Visual Design** | **8.0 / 10** | Cohesive, modern, confident — but derivative (glass/aurora) and over-gradiented. |
| **User Experience** | **6.5 / 10** | Excellent in-app flows/states; undermined by BYOK gating, a static hero, and small targets. |
| **Consistency** | **7.0 / 10** | Great tokens; inconsistent radii/type-scale and multiple primary-button styles. |
| **Accessibility** | **5.0 / 10** | Multiple concrete WCAG risks: contrast, touch targets, focus, landmarks. |
| **Overall Product Polish** | **7.0 / 10** | Premium craft with a few "MVP tells" that break the illusion. |
| **Weighted overall** | **~6.7 / 10** | A strong, polished MVP / demo — not yet a shippable commercial SaaS for a general audience. |

**Is it production-ready?** For a **developer-facing demo / conference showpiece: yes.** For a **general-audience commercial product: no — not until the accessibility gaps and the onboarding/first-impression problems are fixed.**

---

## 2. First impression & the "wow" test

**Does it create a wow moment? Partially — and for the wrong audience.**

- The **workspace** (five agents streaming a dashboard into existence, with a live Control Tower, telemetry, confidence badges, and self-healing) is genuinely impressive. That *is* a wow moment.
- **The problem: almost nobody sees it.** The landing page is a conventional dark-gradient SaaS marketing page (eyebrow → gradient headline → static diagram → pillars → feature grid → stack → CTA). It's competent but **template-shaped** — it looks like every Linear/Vercel-clone starter. Worse, the hero's centerpiece is a **static CSS diagram** of the agent flow (`home.page.html`), not a live or animated preview. For a product whose entire thesis is "watch agents collaborate in real time," showing a *static* box-and-arrow diagram is a missed opportunity that undersells the one thing that's special.
- Then the actual product is **locked behind BYOK**: no key → an empty state and a "Connect a Gemini key to start" wall. A first-time visitor cannot feel the magic without going to Google AI Studio, creating a key, and pasting it. **The wow moment is behind a paywall of effort.**

**Net:** the craft is there, but the product front-loads friction and a generic first impression, and hides its best asset. First impressions decide trust and conversion; right now the first impression is "another polished dark SaaS template," not "holy cow, watch this."

---

## 3. What's genuinely strong (keep it)

Being critical doesn't mean pretending the good parts aren't good:

- **Token architecture.** A real, coherent design-token layer (color, elevation, radius, shadow, transition, gradients) with full light/dark overrides in `src/styles.scss`. This is professional-grade.
- **State coverage is excellent.** Ghost/shimmer loading, inline "Update failed" banners with retry, stale banners, per-agent error shells, empty states, and colour-coded snackbars. Most products ship with half of these.
- **Motion is tasteful and reduced-motion is respected globally** (`@media (prefers-reduced-motion: reduce)` in `styles.scss`). Hover lifts, shimmer, pulse, `shellEnter` — restrained and purposeful.
- **Responsive down to ~380px** with a proper breakpoint mixin ladder (`_mixins.scss`). Real effort went into small screens.
- **Iconography is consistent** (Material Symbols Rounded, subsetted for performance).
- **Micro-details**: tabular-nums for numbers, monospace for keys/telemetry, dashed dividers, gradient wordmark. These signal care.

---

## 4. Issues, ordered by impact

Each issue: **what it is → why it matters (UX/product) → recommended fix.** Effort tagged as **[Quick win]** or **[Larger overhaul]**.

### 4.1 — CRITICAL: The product's differentiator is gated and never previewed
- **What:** The workspace is fully locked behind a BYOK Gemini key; with no key the user sees only an empty state. The landing hero shows a *static* diagram, not the live pipeline.
- **Why it matters:** This is the single biggest product/UX problem. Conversion and "wow" both die at the door. Users judge in seconds; you're spending those seconds on a generic marketing page and then a key wall. The best AI demos let you *feel* the product before asking for anything.
- **Recommended fix:**
  - Add a **read-only, canned demo run** ("Watch a sample" / autoplay a recorded orchestration) that plays the streaming/Control-Tower/widget experience with mock data — no key required. This turns the hero into the wow.
  - Consider a **"try with our rate-limited key"** or a scripted sandbox for the first run.
  - Replace the static hero diagram with an **animated or looping preview** of the real UI.
- **Effort:** [Larger overhaul]

### 4.2 — HIGH (Accessibility): White text on the brand gradient likely fails WCAG AA
- **What:** Primary actions use `brand-pill` (white `#fff` text on the violet→cyan→pink gradient). In **light mode** the gradient runs `#6b3df5 → #11a8b5 → #cf3aa1`; white on the teal/pink stops is roughly **~2.5–3:1**, well under the 4.5:1 AA threshold for normal text. Gradient *text* (`.brand-gradient`, used for the wordmark and headline spans) has the same problem — cyan/pink on a light background is hard to read.
- **Why it matters:** These are the *primary CTAs and the brand name* — the highest-traffic, highest-stakes text. Failing contrast on your main buttons is both an accessibility violation and a legibility problem for everyone in bright environments.
- **Recommended fix:** Verify every gradient button/text with a contrast tool. For buttons, either (a) darken the gradient stops used behind white text, (b) add a subtle text shadow / overlay scrim, or (c) use the solid accent (`brand-solid`) for primary actions and reserve the gradient for decoration. For gradient *text*, ensure the fallback/anchor colour meets contrast, or restrict gradient text to large display sizes only.
- **Effort:** [Quick win] for buttons (adjust stops), [Quick win] for restricting gradient text.

### 4.3 — HIGH (Accessibility): Touch targets below the 44–48px minimum
- **What:** Many interactive controls are 26–36px tall: `.nav-link` 36px, `.key-chip` 34–38px, `.intake-chip`/`.sample-chip` 34px, `.heal-toggle` 32px, `.reaudit-btn`/`.apply-btn`/`.stale-update-btn`/`.dismiss-btn` 32px, and the Control-Tower `.retry-btn` at **26px min-height**.
- **Why it matters:** Apple HIG recommends 44px, Material 48px, WCAG 2.5.5 targets 44px. Sub-32px controls (the 26px retry, 32px dismiss/apply) are hard to hit on touch devices and for users with motor impairments — and this is a workspace where those actions matter (retry a failed agent, apply a fix).
- **Recommended fix:** Raise interactive min-height to ≥40px (ideally 44px) on touch viewports; at minimum expand hit areas with padding/`::before` even if the visual pill stays small. The 26px retry button should be the first to grow.
- **Effort:** [Quick win]

### 4.4 — HIGH (Consistency + Trust): "Angular 21" copy while shipping Angular 22
- **What:** The marketing page states "Pure Angular 21 zoneless SPA," "Angular 21 zoneless," etc. (`home.page.html`), but the app is on Angular **22** (`package.json`, README, and the production-readiness review all say 22).
- **Why it matters:** For a developer audience this is an immediate credibility hit — it signals the copy isn't maintained. Trust in the *product* erodes when the *marketing* is factually wrong about the stack it's bragging about.
- **Recommended fix:** Update all version references; ideally source the framework version from a single constant so it can't drift again.
- **Effort:** [Quick win]

### 4.5 — HIGH (Accessibility): No landmarks, skip link, or custom focus-visible
- **What:** No `<main>` landmark or skip-to-content link (`app.html` renders `<router-outlet>` bare). No global `:focus-visible` treatment is defined in `styles.scss`; the app relies entirely on Material/browser defaults, which are weak against the busy translucent background. Also, the active nav link is *hidden* (`.nav-link.route-current { display: none }` in `app.scss`) rather than shown-as-current, which is disorienting for keyboard/AT users and removes a wayfinding cue.
- **Why it matters:** Keyboard and screen-reader users can't skip the header, can't reliably see where focus is, and lose the "you are here" signal. These are baseline expectations for a commercial product.
- **Recommended fix:** Wrap routed content in `<main id="main">`, add a visually-hidden skip link, define a high-contrast `:focus-visible` outline token (a 2px accent ring with offset) applied to all interactive elements, and render the current route as a disabled/marked state instead of hiding it.
- **Effort:** [Quick win] (skip link + focus token) / [Quick win] (landmark).

### 4.6 — MEDIUM (Visual identity): Gradient overload flattens hierarchy and feels trend-locked
- **What:** The same brand gradient appears as: hero glow, command-center aurora, dialog aurora, empty-state auroras, tower blob, feature-card top bar, widget-card wash, audit-ribbon left rail, logo, badges, pills, CTAs, and gradient text. Combined with a fixed radial-gradient + grid **page background** and glass everywhere, the screen has *many* competing glows.
- **Why it matters:** When everything glows, nothing stands out — visual hierarchy depends on contrast and restraint. It also anchors the product to the **glassmorphism/aurora aesthetic of ~2021–2022**, which now reads as "of its moment" rather than timeless. Modern best-in-class SaaS (Linear, Vercel, Stripe) uses accent colour *sparingly* for emphasis.
- **Recommended fix:** Establish a gradient budget — reserve the full brand gradient for **one** primary element per view (the main CTA or the active/hero element) and downgrade the rest to flat tinted surfaces or a single hairline accent. Consider dialing back `background-attachment: fixed` gradients and the per-card gradient washes.
- **Effort:** [Larger overhaul] (it's a taste/system decision touching many files).

### 4.7 — MEDIUM (Performance/perceived quality): Backdrop-blur + fixed gradients everywhere
- **What:** `glass-surface` (backdrop-filter blur+saturate) is applied to the topbar, cards, tower, dialog, ribbon, and empty states — often stacked over an **animated** gradient (`heroFloat`, `auroraFloat`) and a `background-attachment: fixed` page background.
- **Why it matters:** Backdrop-filter is one of the most expensive CSS effects; stacking many blurred layers over animated/fixed backgrounds is a known source of scroll jank and battery drain, especially on mid-range mobile and Safari (where `background-attachment: fixed` is notoriously janky). "Perceived quality" collapses the instant scrolling stutters.
- **Recommended fix:** Test scroll performance on a mid-tier phone. If it janks: drop `background-attachment: fixed` on mobile, reduce the number of simultaneously-blurred layers, and/or swap some glass surfaces for solid elevated tokens. Cap concurrent blurs.
- **Effort:** [Quick win] to test/mitigate, [Larger overhaul] if it forces a glass rethink.

### 4.8 — MEDIUM (Consistency): No real type scale; half-pixel sizes everywhere
- **What:** Font sizes are hardcoded per component across a huge, unsystematic range — 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 15.5, 16, 17, 18, 19, 22px — including many **half-pixel** values. Letter-spacing is similarly ad hoc (0.02–0.14em). There are no `--font-size-*` / `--space-*` tokens.
- **Why it matters:** Half-pixel type renders inconsistently across browsers/zoom levels and is a maintainability liability. The lack of a modular scale means every new component reinvents sizing, which is how consistency rots over time. Spacing has the same problem (raw px, occasional odd values like 3px/13px).
- **Recommended fix:** Introduce a **type scale** (e.g., 12/14/16/18/20/24/32/40) and **spacing scale** (4-px base) as tokens, then refactor components to consume them. Kill half-pixel sizes.
- **Effort:** [Larger overhaul]

### 4.9 — MEDIUM (Consistency): Corner-radius language is inconsistent despite having tokens
- **What:** Tokens exist (`--dea-radius-md/lg/xl` = 14/20/28), but components freely hardcode 4, 6, 8, 10, 11, 12, 13, 16, 18, 22px radii (logo 12, hint 8, code 4, feature-icon 12, empty-badge 22, venue rationale 6, etc.).
- **Why it matters:** Corner radius is a core part of a brand's "shape language." A grab-bag of radii makes components feel like they came from different kits, subtly undermining the otherwise-cohesive system.
- **Recommended fix:** Add `--dea-radius-xs/sm` tokens and map every hardcoded radius onto the scale. Pick one radius for "small chip/icon tile," one for "control," one for "card."
- **Effort:** [Quick win]

### 4.10 — MEDIUM (Consistency): Competing "primary button" treatments
- **What:** Primary actions vary by screen in both **height** (40/42/44/48/50px) and **fill**: `brand-pill` (gradient) on hero/feature/empty/dialog vs `brand-solid` (flat violet) on the command-center dispatch and audit apply.
- **Why it matters:** The single most important element on each screen — the primary action — doesn't look like the same component across the app. Users subconsciously rely on a consistent "this is the main button" signal.
- **Recommended fix:** Define **one** primary button (one height per context: standard + large), one fill, one hover. Use `brand-solid` **or** `brand-pill` consistently; don't mix them for the same role.
- **Effort:** [Quick win]

### 4.11 — MEDIUM (Accessibility/semantics): Error colour reads as brand, not alarm
- **What:** `--dea-error` is a rose/pink `#ff6b8a` (dark) / `#c2335a` (light) — visually close to the pink stop of the brand gradient. Low-confidence widgets pulse in this pink (`.conf-low`).
- **Why it matters:** Pink errors don't carry the same "stop / danger" affordance as red, and because pink is already a *brand decoration* colour, error states risk reading as stylistic rather than urgent. Relying on colour + a small icon also leans on colour alone for some signals.
- **Recommended fix:** Shift error toward a less brand-adjacent red, or clearly differentiate error tint from the brand pink; ensure every error/severity state pairs colour with an icon **and** text (mostly done — audit the severity dot which is colour-only).
- **Effort:** [Quick win]

### 4.12 — LOW-MEDIUM (Accessibility): Low-contrast small text on translucent surfaces
- **What:** `--dea-fg-subtle` (`#6a7088` dark) is used for 10–10.5px text (char counter, telemetry note, footer separators). On the near-black background this is ~3.8:1 — under AA — and it often sits on **translucent** glass over an animated gradient, making effective contrast variable and sometimes worse.
- **Why it matters:** Small + low-contrast + translucent-over-gradient is a triple threat for readability. Telemetry and counters are informational, but "hard to read" still degrades perceived quality.
- **Recommended fix:** Raise `--dea-fg-subtle` contrast, avoid using it below 12px, and ensure any text over glass has a sufficiently opaque backing.
- **Effort:** [Quick win]

### 4.13 — LOW (Cross-browser): Scrollbar & blur fallbacks
- **What:** Custom scrollbars are `::-webkit-` only (no `scrollbar-color`/`scrollbar-width` for Firefox). Heavy reliance on `backdrop-filter` with no defined solid fallback for engines/GPUs that skip it.
- **Why it matters:** Inconsistent chrome across browsers and a potential "flat, borderless" look where blur is unsupported.
- **Recommended fix:** Add Firefox scrollbar properties; ensure `glass-surface` has an opaque-enough `background` so it degrades gracefully without blur.
- **Effort:** [Quick win]

### 4.14 — LOW (Layout): Dashboard grid can orphan the third widget
- **What:** The renderer grid is `repeat(auto-fit, minmax(340px, 1fr))`. With exactly three widgets, mid-width viewports show 2-up + 1 orphan, creating an unbalanced row.
- **Why it matters:** Asymmetry reads as unfinished on a showcase surface.
- **Recommended fix:** Consider a max of 3 columns with balanced breakpoints, or center/stretch the orphan intentionally.
- **Effort:** [Quick win]

### 4.15 — LOW (Maintainability→consistency risk): Heavy `::ng-deep`
- **What:** Material internals are overridden via deprecated `::ng-deep` (schedule tabs, quality toggle, form fields).
- **Why it matters:** Not user-visible today, but brittle across Material upgrades — a future version bump can silently break these styles and *introduce* visual inconsistency.
- **Recommended fix:** Migrate to Material's token/theming API or component style hooks where possible.
- **Effort:** [Larger overhaul]

---

## 5. Quick wins vs larger overhauls

**Quick wins (hours, high ROI):**
- Fix the "Angular 21" → 22 copy (4.4).
- Raise touch targets, especially the 26px retry (4.3).
- Add `<main>` + skip link + a `:focus-visible` ring (4.5).
- Fix white-on-gradient button contrast / restrict gradient text (4.2).
- Consolidate to one primary-button treatment (4.10).
- Add `--dea-radius-xs/sm` and normalise radii (4.9).
- Bump `--dea-fg-subtle` contrast; stop using <12px subtle text (4.12).
- Firefox scrollbar + blur fallback (4.13).

**Larger overhauls (design decisions, multi-file):**
- A **no-key demo / animated hero** so the wow is immediate (4.1) — highest product impact.
- A **gradient budget** to restore hierarchy and modernise the look (4.6).
- **Type + spacing scale tokens** and a refactor to consume them (4.8).
- **Performance pass** on backdrop-blur / fixed backgrounds (4.7).
- **`::ng-deep` migration** to Material theming (4.15).

---

## 6. Comparison to modern SaaS & production-readiness

Benchmarked against Linear, Stripe, Vercel, Raycast, Notion:

- **Token discipline & component craft:** competitive with the best. Genuinely.
- **Restraint & hierarchy:** *below* the bar. The top tier uses accent colour surgically; Maestro glows everywhere. Linear/Stripe would use maybe one gradient per view.
- **Accessibility:** *below* the bar. Those products (mostly) meet AA, have visible focus, real landmarks, and adequate targets. Maestro currently doesn't.
- **First-run experience:** *well below* the bar. Best-in-class AI products let you feel value before signup/keys (playgrounds, sample data, autoplay demos). Maestro gates everything behind BYOK.
- **Trend positioning:** the glass/aurora look is polished but reads ~2 years old versus the current flatter, higher-contrast, "quiet luxury" SaaS direction.

**Production-ready?** As a **conference demo / developer showcase — yes, comfortably.** As a **general-audience commercial SaaS — not yet.** The accessibility gaps alone (contrast on primary CTAs, touch targets, focus, landmarks) would fail a serious design/legal review, and the onboarding gating would tank real-world conversion.

---

## 7. Scores (with justification)

- **Visual Design — 8.0.** Confident, cohesive, modern-adjacent, strong motion and states. Docked for gradient overload, trend-lock (glass/aurora), and derivative marketing-page structure.
- **User Experience — 6.5.** In-app flows, feedback, and recovery are excellent. Heavily docked for BYOK gating of the core value, a static hero that hides the wow, and small/awkward touch targets.
- **Consistency — 7.0.** Excellent token foundation, but inconsistent radii, no type/spacing scale, half-pixel sizes, multiple primary-button treatments, and a version-copy bug.
- **Accessibility — 5.0.** Real, concrete WCAG risks: primary-CTA contrast, gradient text, sub-minimum targets, no focus-visible, no landmarks/skip link, some colour-only signals, hidden active-nav state.
- **Overall Product Polish — 7.0.** The craft says "premium"; the tells (copy bug, gating, static diagram, a11y gaps) say "MVP." Averages to "very polished MVP."

---

## 8. Candid assessment

**Would users trust this product based on its design?**
Mostly yes on *craft* — it looks competent and intentional, which builds trust. But trust leaks at specific points: a factually wrong "Angular 21" claim, primary buttons that are hard to read in light mode, and a key wall before any value. Developers (the target audience) will notice the version bug and the gating immediately.

**Does it feel premium or like an MVP?**
It **feels like an unusually well-dressed MVP.** The visual layer is premium; the product decisions around it (onboarding, first impression, accessibility) are MVP-grade. Premium products earn trust *before* asking for input and never ship failing-contrast primary CTAs.

**What would prevent this from being featured as a high-quality product?**
1. Accessibility failures on core elements (contrast, focus, targets, landmarks) — a disqualifier for most "best design" showcases.
2. The BYOK-gated, static-diagram first impression — reviewers can't experience the differentiator.
3. Trend-locked glass/aurora + gradient overload reading as "2022 template."
4. The Angular 21/22 copy bug — a small but fatal credibility tell.

**What specific changes would elevate it to world-class?**
1. **Make the wow instant:** a no-key, autoplaying/recorded demo run on the landing page (or a live animated hero). This is the highest-leverage change.
2. **Fix accessibility to AA:** contrast on all gradient buttons/text, 44px targets, a strong focus-visible ring, `<main>` + skip link, shown-as-current nav.
3. **Impose a gradient budget** and introduce type/spacing scales — restraint is what separates "polished" from "world-class."
4. **Modernise away from full glassmorphism** toward higher-contrast, flatter surfaces with accent used surgically.
5. **Kill the tells:** fix the version copy, unify the primary button, normalise radii.

**Bottom line:** This is top-decile *front-end craft* wrapped around MVP-grade *product and accessibility decisions*. Close the accessibility gaps and the first-run experience, dial back the gradients, and impose scale discipline — and it moves from "impressive demo" to "world-class product." Until then, it's a beautiful, trustworthy-looking MVP that isn't quite ready to be called production-grade for a general audience.

---

## 9. Design decision log

### 9.1 — BYOK & the first-run experience — *KEEP BYOK; add a keyless preview* (Deferred, revisit later)

**Decision (2026-07-03):** **Keep BYOK. Do not remove it.** The "first impression" critique in §4.1 is *not* a recommendation to drop BYOK — it's a recommendation to **decouple experiencing the wow from owning a key**. The remediation (a no-key demo run) is **deferred** and will be revisited later.

**Why BYOK stays (it's the correct architecture, not a flaw):**
- The app is intentionally a **zero-backend, client-only SPA**. BYOK is what makes that possible — the key and all data stay in the browser tab, which is a genuine trust asset and an advertised feature.
- **Removing BYOK inverts the product into a harder, riskier one:** it would require a backend/proxy, secret management, and infra where none exists today.
- **It would mean paying for everyone's inference** — every anonymous visitor running Planner + 3 specialists + Auditor (+ self-heal) on a hosted key is unbounded, metered cost, immediately forcing auth, rate limiting, and abuse/DDoS protection.
- **It would inherit security/privacy liability** the app currently avoids entirely.

**The real problem (unchanged from §4.1):** with no key, a first-time visitor experiences *none* of the differentiator — "seeing the wow" is coupled to "having a key."

**Planned remediation (deferred — revisit later):**
- Add a **no-key demo run**: a "Watch a sample run" button (or autoplaying hero) that replays the *real* workspace UI (Control Tower streaming, widgets materialising, confidence badges, an audit fix) driven by **canned/scripted data — no Gemini call, no backend, no cost**. Reuse the existing `AgentStore`/widgets so it looks identical to a real run.
- Reframe the key ask as earned: *"Loved it? Connect your key to run your own brief."*
- **Rejected option:** a rate-limited shared "trial key" via a serverless proxy — reintroduces backend + cost + abuse surface and contradicts the zero-backend/BYOK ethos. Not pursued for this project.

**Status:** Deferred. BYOK confirmed as a keeper; the keyless-preview enhancement is parked for a future milestone.

---

## 10. Post-migration status (2026-07-04)

The design-system migration (Phases 0–8 of `DESIGN_SYSTEM_MIGRATION_PLAN.md`) has since shipped, plus post-migration polish. This section reconciles the audit against the code as of 2026-07-04. **It does not edit the original findings above** — those remain the point-in-time review; this is the delta. Verified against the current source, not just the plan.

### 10.1 — Issue-by-issue status

| # | Issue | Status | Notes |
|---|---|---|---|
| 4.1 | Differentiator gated / static hero | ⛔ Pending (deferred, product) | Out of DS scope; see §9.1. No-key demo still parked. |
| 4.2 | White-on-gradient contrast / gradient text | ✅ Resolved | Phase 5 added `--dea-gradient-brand-strong` (violet→magenta) behind white on the hero CTA + mode-pill; decorative rainbow kept only for washes. Minor: verify the 18px topbar wordmark gradient (sits just under WCAG's large-text threshold). |
| 4.3 | Touch targets < 44–48px | ⚠️ Partial | Tokens `--target-min` (40) / `--target-min-primary` (44) exist and primaries honor 44 — **but the specific small controls the audit named are unchanged**: control-tower `.retry-btn` still **26px**, `.heal-toggle` 32px, nav/utility chips 32–38px. Logged as an accepted exception (all ≥ WCAG 24px), but the named remediation ("grow the 26px retry first") is **not done**. |
| 4.4 | "Angular 21" copy | ✅ Resolved | Version numbers removed (version-agnostic "Angular"); stack section reworded for the zoneless/signals reality. |
| 4.5 | Landmarks / skip link / focus-visible / hidden active nav | ⚠️ Partial | Global `:focus-visible` ring shipped (Phase 5). **Pending:** no `<main>` landmark, no skip link, and `.nav-link.route-current { display:none }` still *hides* the active route instead of marking it. |
| 4.6 | Gradient overload | ✅ Resolved | Phase 6 gradient budget (de-rainbow; ≤1 gradient emphasis per view). |
| 4.7 | Backdrop-blur + fixed-bg perf | ⚠️ Partial | Phase 8 structural: mobile `background-attachment: scroll`, `--glass-blur-max` blur cap, `@supports` opaque fallback. **Pending:** the actual on-device scroll/paint measurement. |
| 4.8 | No type scale / half-px | ✅ Resolved | Phase 2 type scale; zero half-px, enforced at error severity. |
| 4.9 | Inconsistent radii | ✅ Resolved | Phase 3 radius scale (added 2xs/xs/sm), all hardcoded radii mapped. |
| 4.10 | Competing primary buttons | ✅ Resolved | Phase 4 four-role button system (hero/primary/secondary/ghost). |
| 4.11 | Error colour reads as brand (pink) | ⛔ Pending | `--dea-error` unchanged (`#ff6b8a` dark / `#c2335a` light); colour-only severity dot not addressed. Not touched by the migration. |
| 4.12 | Low-contrast small subtle text | ✅ Mostly | Phase 5 raised `--dea-fg-subtle` to AA in both themes. Residual: subtle text is still used at 11px (guideline was ≥12px), but it now passes contrast. |
| 4.13 | Scrollbar & blur fallbacks | ⚠️ Partial | Blur `@supports` opaque fallback shipped (Phase 8). **Pending:** Firefox `scrollbar-color`/`scrollbar-width` (still `::-webkit-` only). |
| 4.14 | Grid orphans third widget | ⛔ Pending | Grid gained `minmax(min(100%,340px),1fr)` (a narrow-screen overflow fix) but the 2-up + 1-orphan balance is unaddressed. Out of DS scope. |
| 4.15 | Heavy `::ng-deep` | ✅ Resolved | Phase 7 reduced `::ng-deep` 13 → 6; the remainder is documented, token-less fallbacks. |

### 10.2 — What remains (grouped, in priority order)

**Accessibility (highest priority of what's left):**
- **4.3** Grow the sub-40px controls — start with the 26px control-tower retry, then heal-toggle (32px) and the utility chips — or expand hit areas via padding/`::before`.
- **4.5** Add `<main id="main">` + a visually-hidden skip link; stop hiding the active nav link (render it as current/disabled instead).
- **4.11** Move error colour off brand-pink toward an unambiguous red; pair the severity dot with an icon/text, not colour alone.

**Performance:**
- **4.7** Run the deferred on-device scroll/paint profile; if it janks, tune blur via the existing `--glass-blur-max` lever.

**Cross-browser / layout (low):**
- **4.13** Add Firefox scrollbar properties.
- **4.14** Balance the 3-widget dashboard row (cap columns / center the orphan).

**Product (out of DS scope, deferred):**
- **4.1 / §9.1** No-key demo run / animated hero — highest product impact, still parked.

### 10.3 — Revised dimension scores (post-migration, 2026-07-04)

The §Scorecard above is left as the historical baseline; these reflect the current build:

| Dimension | Was | Now | Why |
|---|---|---|---|
| Visual Design | 8.0 | 8.5 | Gradient budget restored hierarchy; still glass/aurora by deliberate choice (Phase 9 declined). |
| User Experience | 6.5 | 6.5 | Core UX blockers (BYOK gating, static hero, sub-40px targets) largely unchanged. |
| Consistency | 7.0 | 9.0 | Type/spacing/radius/button systems shipped and enforced at error severity. |
| Accessibility | 5.0 | 6.5 | CTA contrast, focus-visible, and subtle-text contrast fixed; landmarks/skip-link/small-targets/error-colour still open. |
| Overall Polish | 7.0 | 7.5 | Consistency + a11y gains, offset by the unresolved first-run and remaining a11y debt. |

**Bottom line:** the migration closed the **Consistency and Visual issues (4.6, 4.8, 4.9, 4.10, 4.15)** and the **key contrast items (4.2, 4.12)**, and partially the **perf/focus** items. The remaining audit debt is now concentrated in **accessibility markup + touch targets (4.3, 4.5, 4.11)**, a **deferred perf measurement (4.7)**, minor **cross-browser/layout (4.13, 4.14)**, and the **product-level first-run experience (4.1)** — none of which were in the design-system migration's scope, but which are now the clear next priorities.
