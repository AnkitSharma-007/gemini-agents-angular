import type { Type } from '@angular/core';
import { SpecialistId } from '../../core/types/agent.types';

type WidgetLoader = () => Promise<Type<unknown>>;

const widgetLoaders: Record<SpecialistId, WidgetLoader> = {
  budget: () => import('../widgets/budget-widget').then((m) => m.BudgetWidget),
  schedule: () => import('../widgets/schedule-widget').then((m) => m.ScheduleWidget),
  venue: () => import('../widgets/venue-widget').then((m) => m.VenueWidget),
};

const cache = new Map<SpecialistId, Promise<Type<unknown>>>();

/**
 * Lazy-load a specialist widget bundle. Each slot fetches its chunk once on
 * first mount; subsequent updates resolve synchronously from the cache.
 */
export function loadWidget(id: SpecialistId): Promise<Type<unknown>> {
  let p = cache.get(id);
  if (!p) {
    p = widgetLoaders[id]();
    cache.set(id, p);
  }
  return p;
}
