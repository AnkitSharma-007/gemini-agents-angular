import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'architect',
    loadComponent: () =>
      import('./pages/workspace/workspace.page').then((m) => m.WorkspacePage),
  },
  { path: '**', redirectTo: '' },
];
