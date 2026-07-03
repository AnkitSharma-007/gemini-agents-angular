// Stylelint config — Design System guardrail (see DESIGN_SYSTEM_MIGRATION_PLAN.md).
//
// Phase 0 (current): everything runs at WARNING severity so nothing blocks the
// build/commit. The point right now is to surface the baseline of design-token
// violations (magic numbers) that the migration will burn down phase by phase.
//
// Adoption ramp: as each phase completes, its design-token rule is flipped from
// warning -> error to lock the consistency in (see the migration plan §4/§8).
module.exports = {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['dist/**', '.angular/**', 'coverage/**', 'node_modules/**'],

  // Non-breaking: keep the whole suite advisory until the migration locks rules per phase.
  defaultSeverity: 'warning',

  rules: {
    // === Design-token enforcement (the migration worklist) =====================
    // Require a token/var/function — not a raw literal — for these properties.
    // Flipped to error per phase: font-size/line-height (Phase 2), border-radius (Phase 3),
    // color (Phase 5). padding/margin/gap are added in Phase 3 (shorthands are noisy).
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'fill', 'stroke', 'font-size', 'line-height', 'border-radius'],
      {
        ignoreValues: [
          'transparent',
          'inherit',
          'currentColor',
          'unset',
          'initial',
          'none',
          'auto',
          'normal',
          '0',
        ],
        severity: 'warning',
      },
    ],

    // === Intentional in this codebase — silenced to keep the baseline signal high ===
    // Vendor prefixes are deliberate (backdrop-filter, background-clip, scrollbars, font-smoothing).
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'selector-no-vendor-prefix': null,
    'media-feature-name-no-vendor-prefix': null,
    'at-rule-no-vendor-prefix': null,

    // Legacy color notation is used throughout (rgba(), 0.42 alphas) — not part of this migration.
    'color-function-notation': null,
    'color-function-alias-notation': null,
    'alpha-value-notation': null,

    // Angular view-piercing selector is legitimate; don't flag it as an unknown pseudo-element.
    'selector-pseudo-element-no-unknown': [true, { ignorePseudoElements: ['ng-deep'] }],

    // Established naming that we are not renaming (camelCase keyframes, existing classes/custom props).
    'keyframes-name-pattern': null,
    'selector-class-pattern': null,
    'custom-property-pattern': null,

    // Formatting is owned by Prettier; range-notation is stylistic.
    'media-feature-range-notation': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'rule-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,

    // Specificity ordering fires broadly in scoped component styles; revisit later if useful.
    'no-descending-specificity': null,
  },
};
