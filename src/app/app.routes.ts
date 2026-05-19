import { inject } from '@angular/core';
import { CanActivateFn, Router, type Routes } from '@angular/router';

const VISITED_KEY = 'maestro.visitedGuide';

const firstVisitGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (typeof localStorage === 'undefined') return true;
  const seen = localStorage.getItem(VISITED_KEY);
  if (seen) return true;
  return router.parseUrl('/guide');
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [firstVisitGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'guide',
    loadComponent: () => import('./pages/guide/guide.page').then((m) => m.GuidePage),
  },
  { path: '**', redirectTo: '' },
];

export const GUIDE_VISITED_KEY = VISITED_KEY;
