import { SPECIALIST_META, type SpecialistId } from '../types/agent.types';
import type { DynamicComponentConfig } from '../types/widget.types';

const RIPPLE_DEPENDENCIES: Record<
  SpecialistId,
  readonly SpecialistId[]
> = {
  venue: ['budget'],
  schedule: ['budget'],
  budget: [],
};

const DOWNSTREAM_FOCUS: Record<SpecialistId, string> = {
  budget:
    'Reconcile line items and totalBudget with the updated upstream context (venue cost/capacity, schedule day count, etc.).',
  schedule: '',
  venue: '',
};

export function directDependentsOf(id: SpecialistId): readonly SpecialistId[] {
  return RIPPLE_DEPENDENCIES[id];
}

export function upstreamsOf(id: SpecialistId): SpecialistId[] {
  return (Object.keys(RIPPLE_DEPENDENCIES) as SpecialistId[]).filter((u) =>
    RIPPLE_DEPENDENCIES[u].includes(id),
  );
}

/** Brief for auto-cascade after an Auditor fix-it (single upstream). */
export function buildRipplePrompt(
  changed: SpecialistId,
  changedPayload: DynamicComponentConfig,
  downstream: SpecialistId,
): string {
  const focus = DOWNSTREAM_FOCUS[downstream] || 'Align with the upstream change.';
  return [
    `The ${SPECIALIST_META[changed].label} widget was just updated by the critic. Refresh your ${SPECIALIST_META[downstream].label} output so it stays consistent.`,
    focus,
    '',
    `Updated ${SPECIALIST_META[changed].label} JSON:`,
    '```json',
    JSON.stringify(changedPayload, null, 2),
    '```',
    '',
    'Return the FULL revised object as strict JSON. Preserve fields that remain valid; change only what the upstream update requires.',
  ].join('\n');
}

/** Brief for user-triggered Update when one or more upstreams may have changed. */
export function buildMultiRipplePrompt(
  downstream: SpecialistId,
  upstreams: { id: SpecialistId; payload: DynamicComponentConfig }[],
): string {
  const focus = DOWNSTREAM_FOCUS[downstream] || 'Align with all upstream changes.';
  const blocks = upstreams.map(
    (u) =>
      `### ${SPECIALIST_META[u.id].label}\n\`\`\`json\n${JSON.stringify(u.payload, null, 2)}\n\`\`\``,
  );
  return [
    `One or more upstream widgets changed. Refresh your ${SPECIALIST_META[downstream].label} output for consistency.`,
    focus,
    '',
    'Current upstream payloads:',
    ...blocks,
    '',
    'Return the FULL revised object as strict JSON. Preserve fields that remain valid; change only what upstream updates require.',
  ].join('\n');
}
