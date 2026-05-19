# Maestro

> **Five Gemini agents. One natural-language brief. A live, generative Angular dashboard, entirely in your browser.**

Maestro turns a single sentence into a fully structured event plan rendered as live Angular widgets, built on **multi-agent orchestration**, **generative UI**, and **bring-your-own-key** privacy. No backend. No telemetry. No frameworks-on-top-of-frameworks. Just Angular 21 (zoneless, signals), the `@google/genai` SDK, and a five-agent pipeline.

> _"Plan a 3-day, 1,200-attendee Agentic AI conference in Bengaluru in March 2026, INR ₹2.5 crore budget, with hands-on workshops on multi-agent orchestration and a closing fireside."_
>
> ↓ ~12 seconds later
>
> A live **Budget** widget · a multi-day **Schedule** widget with grounded speaker suggestions · a **Venue** card with real Google-Search citations · an **Auditor ribbon** that catches cross-widget inconsistencies and fixes them with one click.

---

## Contents

- [Why it's interesting](#why-its-interesting)
- [Architecture at a glance](#architecture-at-a-glance)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [The eight differentiators](#the-eight-differentiators)
- [Tech stack](#tech-stack)
- [Bundle, performance & security](#bundle-performance--security)
- [Testing](#testing)

---

## Why it's interesting

Most LLM demos are **chat windows talking to one model**. Maestro is the opposite:

1. **It's not a chatbot. It's a generative UI.** Outputs render as typed Angular components that you can edit widget-by-widget, not as a transcript.
2. **It's not one agent. It's five.** A Planner decomposes, three Specialists run in parallel, an Auditor cross-checks and offers one-click fixes.
3. **It's not a backend service. It's a static SPA.** No server holds your data or your key. Deployment is `dist/maestro/` on any static host.
4. **It's not a screenshot. It ships.** ~129 kB initial gzip transfer, lazy-loaded Gemini SDK, Material Symbols font subset to 35 glyphs, strict CSP, AbortController-guarded streams, 87 unit tests.

---

## Architecture at a glance

```
┌──────────────────── User brief ─────────────────────┐
│  "Plan a 3-day Agentic AI conference in Bengaluru…" │
└──────────────────────────┬──────────────────────────┘
                           ▼
                ┌────────────────────┐
                │   PlannerAgent     │  responseSchema → routing JSON
                │   (decomposition)  │  + per-specialist briefs
                └───┬─────┬─────┬────┘
                    ▼     ▼     ▼          Promise.allSettled
        ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
        │ BudgetAgent │ │ScheduleAgent │ │ VenueAgent   │
        │  (JSON)     │ │  + Search🔍  │ │  + Search🔍  │
        └──────┬──────┘ └──────┬───────┘ └──────┬───────┘
               │               │                │
               └───────┬───────┴────────────────┘
                       ▼
                ┌──────────────┐
                │ AuditorAgent │  cross-widget consistency JSON
                └──────┬───────┘
                       ▼
            ╔════════════════════════════╗
            ║   AgentStore (signals)     ║   id-keyed widgets,
            ║                            ║   per-agent state,
            ║                            ║   global status, telemetry
            ╚══════════════╤═════════════╝
                           │
       ┌───────────────────┼──────────────────────────┐
       ▼                   ▼                          ▼
  AuditRibbon         ControlTower               GenerativeRenderer
  (fix-it chips)      (timeline, telemetry,      (ghost → real → error
       │               per-agent retry)           shells via ViewContainerRef)
       │ apply fix                                    │
       └──────────────────► refine specialist  ───────┤
                                                      ▼
                                          Budget / Schedule / Venue widgets
                                          (+ Refine bars, Citation chips,
                                           Stale-state banners)
```

### Data flow in one paragraph

`CommandCenter.submit()` calls `AgentOrchestrator.run()` which spawns an `AbortController`. The orchestrator awaits `PlannerAgent.plan()` (typed JSON), then dispatches the three specialists with `Promise.allSettled`. Each agent streams its `usageMetadata` and JSON payload into `AgentStore`, which emits signals to `GenerativeRenderer` (instantiates the right Angular component via `ViewContainerRef.createComponent` looked up from `WIDGET_REGISTRY`, itself a lazy-import map). After settlement, `AuditorAgent.run()` reviews all widgets and emits `auditIssues`. Each issue can be applied via `applyFixIt(id)` which `refine()`s the owning specialist and re-audits.

### Resilience built into the pipeline

Each specialist runs inside `try/catch` under `Promise.allSettled`, so one agent's failure renders an `error-mode` widget shell rather than collapsing the dashboard. If the Planner errors, the orchestrator falls back to running all three specialists on the raw brief. Grounded outputs that wrap JSON in prose are recovered by a tolerant parser. Errors are classified (`auth | quota | network | other`) so the snackbar can be specific. Every orchestrator entry point gets a fresh `AbortController`, so switching keys, starting a new run, or unmounting cancels in-flight Gemini streams synchronously.

---

## Quick start

**Prerequisites:** Node 20+ · npm 10+ · a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) (free tier works).

```bash
npm install
npm start          # http://localhost:4200
```

First load lands on the **feature tour** at `/`. Take the tour, click any "Try this brief" card to jump into the workspace at `/architect` with the prompt pre-filled, connect your key in the dialog, hit **Architect Dashboard**.

### Other commands

```bash
npm run build              # production build (~129 kB gzip initial transfer)
npm test                   # vitest watch mode (87 tests across 10 files)
npm test -- --run          # one-shot test run
npm run watch              # dev-config build with watch (no serve)
```

### Deployment notes

This is a pure SPA: drop `dist/maestro/browser/` on any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, GitHub Pages…). Two things to configure:

1. **SPA fallback**: serve `index.html` for unknown paths so `/architect?try=…` deep-links don't 404.
2. **CSP**: the strict CSP in `index.html` already whitelists `https://generativelanguage.googleapis.com` for outbound calls and `https://fonts.googleapis.com` / `https://fonts.gstatic.com` for the Material Symbols font. If your host adds extra script origins, extend `script-src` accordingly.

---

## Project structure

```
src/
├── _mixins.scss                    Shared SCSS design-system mixins
├── styles.scss                     Global tokens, theme blocks, dialog overrides
├── index.html                      CSP, OG tags, subsetted Material Symbols font
└── app/
    ├── app.{ts,html,scss}          Shell: topbar (brand · contextual nav · theme · key) + footer + <router-outlet>
    ├── app.routes.ts               Lazy routes: `/` (tour) and `/architect` (workspace)
    ├── app.config.ts               provideZonelessChangeDetection, provideRouter, providers
    │
    ├── core/                       Pure logic, no DOM
    │   ├── ai/
    │   │   ├── agents/             planner · auditor · budget · schedule · venue · base
    │   │   ├── agent-orchestrator.service.ts   Run / refine / fix-it / ripple / re-audit / retry
    │   │   ├── gemini.schemas.ts   Structured-output JSON schemas per agent
    │   │   ├── gemini.prompts.ts   System prompts and brief templates
    │   │   ├── gemini-pricing.ts   USD list prices for cost estimates
    │   │   ├── genai-loader.ts     Lazy dynamic import of @google/genai SDK
    │   │   ├── ripple.ts           Cross-widget dependency prompts
    │   │   └── telemetry-format.ts Token / cost / duration formatting
    │   ├── auth/
    │   │   ├── api-key.service.ts  BYOK + validate() against models.list
    │   │   └── api-key.dialog.{ts,html,scss}   The connect-key modal
    │   ├── state/
    │   │   ├── agent.store.ts      Signal-based store: widgets, agent state, telemetry, audit, rationale
    │   │   └── prompt-draft.service.ts          Query-param → textarea hand-off
    │   ├── theme/
    │   │   └── theme.service.ts    Light/dark, persisted, prefers-color-scheme aware
    │   └── types/
    │       ├── agent.types.ts      Discriminated unions, error classes
    │       └── widget.types.ts     Widget config types + RENDER_TYPE_BY_ID
    │
    ├── features/                   UI building blocks
    │   ├── audit-ribbon/           Critic banner + fix-it chips + Re-audit button
    │   ├── command-center/         Prompt card + sample chips + no-key empty state
    │   ├── control-tower/          Live agent timeline + per-agent Retry + Telemetry
    │   ├── renderer/               WIDGET_REGISTRY (lazy) + WidgetSlot + GenerativeRenderer
    │   └── widgets/                widget-shell · refine-bar · citation-chips
    │                               · budget-widget · schedule-widget · venue-widget
    │
    └── pages/                      Route components (both lazy-loaded)
        ├── guide/                  Landing page (`/`): in-app feature tour with one-click "Try this brief" CTAs
        └── home/                   Workspace (`/architect`): Command Center + Control Tower + Audit ribbon + dashboard
```

Each agent gets its own file, each widget gets its own component, each page gets its own lazy chunk.

---

## The eight differentiators

1. **Multi-agent orchestration**: Planner + three Specialists in parallel + Auditor, coordinated by `AgentOrchestrator`. Each agent has its own typed `responseSchema`, its own system prompt, its own retry surface.
2. **Generative UI (slot-based)**: `WIDGET_REGISTRY` maps `SpecialistId` → lazy `import()`. `WidgetSlot` owns a `ViewContainerRef`, instantiates the matched component on demand, and updates it in place via `setInput()` as new payloads arrive.
3. **Cross-widget ripple updates**: when Schedule or Venue change, the Budget widget marks itself stale and shows a one-click **Update** banner. Auditor fix-its auto-cascade through dependent agents before re-auditing.
4. **Auditor fix-it chips**: the Auditor surfaces inconsistencies (capacity mismatches, schedule gaps, budget overruns) as one-tap chips that re-run the owning specialist and re-audit.
5. **Control Tower**: live agent timeline that ticks duration in real time (paused when the tab is hidden to save cycles) and supports **per-agent retry** on failure, so a single flaky call doesn't force you to rerun the whole pipeline.
6. **Token / cost / latency telemetry**: every agent row shows `usageMetadata` tokens and a USD estimate from `gemini-pricing.ts`. A run footer aggregates totals.
7. **Google-Search grounded specialists**: Schedule and Venue agents enable `googleSearchTool`, and the rendered widgets surface real `groundingMetadata` citations as **Source chips** with `rel="noopener noreferrer"`.
8. **BYOK**: Gemini key is validated against `models.list`, stored only in `localStorage` under `dea.geminiApiKey`, masked in the UI (`••••abcd`), and never reaches any server we operate.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Angular 21 zoneless** (`provideZonelessChangeDetection`) | Smallest reactive surface; signals everywhere; OnPush throughout. |
| State | **Signals + per-feature stores** | No `effect` indirection; computed views; native cancellation via `AbortController`. |
| LLM SDK | **`@google/genai` v2** (lazy-loaded) | Native structured outputs + streaming + Google Search grounding. ~100 kB removed from initial bundle by dynamic import. |
| UI kit | **Angular Material 21** | High-quality form controls (`mat-form-field`, `mat-button-toggle`, `mat-progress-bar`, `mat-snack-bar`) + theming with violet palette. |
| Styles | **SCSS + design-system mixins** (`src/_mixins.scss`) | `glass-surface`, `pill`, `tinted-pill`, `eyebrow`, `mono-tabular`, named breakpoints, all keeping source DRY without changing emitted CSS. |
| Routing | **Standalone routes + lazy loading** | Both pages (`/` tour, `/architect` workspace) lazy-loaded. API-key dialog lazy-loaded. Each widget lazy-loaded. |
| Tests | **Vitest 4** (`jsdom`) | Faster than Karma. 87 tests covering schemas, agents, store mutations, telemetry math, theme service. |
| Build | **Angular esbuild (`@angular/build`)** | ~2 s production builds. Per-component-style budget enforced at `14 kB` warn / `20 kB` error. |

---

## Bundle, performance & security

### Bundle

| Chunk | Raw | Gzip transfer | When loaded |
|---|---:|---:|---|
| **Initial total** | 516 kB | **129 kB** | First paint |
| `guide-page` (lazy) | 27.5 kB | 6.65 kB | Visit `/` (the landing/tour page) |
| `home-page` (lazy) | 70.9 kB | 15.6 kB | Visit `/architect` (the workspace) |
| `api-key-dialog` (lazy) | 43 kB | 9 kB | First dialog open |
| `@google/genai` (lazy) | 298 kB | 45 kB | First API call |
| `schedule-widget` (lazy) | 49.5 kB | 10.8 kB | First schedule render |
| `budget-widget` / `venue-widget` (lazy) | ~4.8 kB each | ~1.7 kB each | First respective render |

### Performance wins applied

- **Lazy `@google/genai`**: biggest single win (~100 kB off initial transfer).
- **Lazy `ApiKeyDialog`**: full Material dialog chunk deferred.
- **Lazy widgets**: each specialist widget is its own dynamic import behind `WIDGET_REGISTRY`.
- **Lazy pages**: `guide` (landing) and `home` (workspace) are both `loadComponent` routes. First paint serves the leaner tour chunk; the heavier workspace chunk loads only when someone clicks through.
- **Material Symbols font subsetted** to the 37 glyphs actually used in templates. The Google Fonts URL has an explicit `&icon_names=…` list in `index.html`.
- **Live duration ticker** runs at **500 ms** (was 250 ms) and **pauses when the tab is hidden** (`document.visibilityState !== 'visible'`).
- **`AbortController` on every Gemini stream**: switching keys, starting a new run, retrying, or reloading cancels all in-flight requests synchronously.

### Security hardening

- **Content-Security-Policy** in `index.html`:
  - `script-src 'self' 'unsafe-inline'`
  - `connect-src 'self' https://generativelanguage.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com`
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `frame-ancestors 'none'` · `object-src 'none'` · `base-uri 'self'` · `form-action 'none'`
- **`rel="noopener noreferrer"`** on every `target="_blank"` external link.
- **No analytics, no error reporting, no third-party scripts.** The static build is reproducible.
- **API key is never logged**, never sent anywhere except `generativelanguage.googleapis.com`, and is masked in the UI (`••••abcd`). Clearing the key wipes both the in-memory signal and the `localStorage` entry.

---

## Testing

```bash
npm test -- --run
```

```
 Test Files  10 passed (10)
      Tests  87 passed (87)
```

Specs cover the schema definitions, agent base streaming + tolerant JSON parsing, store mutations and audit lifecycle, error classification, BYOK validation, ripple prompt builders, pricing math, and telemetry formatting.
