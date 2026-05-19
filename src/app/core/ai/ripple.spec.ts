import { describe, expect, it } from 'vitest';
import type { DynamicComponentConfig } from '../types/widget.types';
import {
  buildMultiRipplePrompt,
  buildRipplePrompt,
  directDependentsOf,
  upstreamsOf,
} from './ripple';

describe('ripple dependency graph', () => {
  it('marks budget as the dependent of venue and schedule', () => {
    expect(directDependentsOf('venue')).toEqual(['budget']);
    expect(directDependentsOf('schedule')).toEqual(['budget']);
  });

  it('returns no dependents for budget (the bottom of the graph)', () => {
    expect(directDependentsOf('budget')).toEqual([]);
  });

  it('lists venue and schedule as upstreams of budget', () => {
    const ups = upstreamsOf('budget');
    expect(ups).toContain('venue');
    expect(ups).toContain('schedule');
    expect(ups).toHaveLength(2);
  });

  it('returns no upstreams for venue or schedule', () => {
    expect(upstreamsOf('venue')).toEqual([]);
    expect(upstreamsOf('schedule')).toEqual([]);
  });
});

const venuePayload: DynamicComponentConfig = {
  type: 'render_venue',
  title: 'Recommended Venue',
  config: {
    name: 'Acme Hall',
    city: 'Bengaluru',
    capacity: 1500,
    amenities: ['Wi-Fi'],
    estimatedCost: 2000000,
    currency: 'INR',
    rationale: 'Right-sized.',
  },
};

describe('buildRipplePrompt', () => {
  it('mentions both upstream and downstream widget names', () => {
    const prompt = buildRipplePrompt('venue', venuePayload, 'budget');
    expect(prompt).toContain('Venue');
    expect(prompt).toContain('Budget');
  });

  it('embeds the upstream payload as a fenced JSON block', () => {
    const prompt = buildRipplePrompt('venue', venuePayload, 'budget');
    expect(prompt).toContain('```json');
    expect(prompt).toContain('"name": "Acme Hall"');
    expect(prompt).toContain('"currency": "INR"');
  });

  it('asks the agent to return the full revised object as strict JSON', () => {
    const prompt = buildRipplePrompt('venue', venuePayload, 'budget');
    expect(prompt).toMatch(/strict JSON/i);
    expect(prompt).toMatch(/full revised object/i);
  });

  it('includes budget-specific reconciliation guidance for the budget downstream', () => {
    const prompt = buildRipplePrompt('venue', venuePayload, 'budget');
    expect(prompt).toMatch(/totalBudget/);
  });
});

describe('buildMultiRipplePrompt', () => {
  it('renders one fenced section per upstream payload', () => {
    const prompt = buildMultiRipplePrompt('budget', [
      { id: 'venue', payload: venuePayload },
      { id: 'schedule', payload: venuePayload },
    ]);
    const sectionMatches = prompt.match(/### \w+/g) ?? [];
    expect(sectionMatches).toEqual(['### Venue', '### Schedule']);
  });

  it('still requires a full strict-JSON response', () => {
    const prompt = buildMultiRipplePrompt('budget', [
      { id: 'venue', payload: venuePayload },
    ]);
    expect(prompt).toMatch(/strict JSON/i);
  });

  it('handles a single-upstream case without crashing', () => {
    const prompt = buildMultiRipplePrompt('budget', [
      { id: 'venue', payload: venuePayload },
    ]);
    expect(prompt).toContain('### Venue');
    expect(prompt).not.toContain('### Schedule');
  });
});
