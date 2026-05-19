import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class ApiKeyDialogService {
  private readonly dialog = inject(MatDialog);

  async open() {
    const { ApiKeyDialog: dialogComponent } = await import('./api-key.dialog');
    return this.dialog.open(dialogComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      panelClass: 'dea-dialog-panel',
    });
  }
}
