import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'dea-no-key-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './no-key-empty-state.html',
  styleUrl: './no-key-empty-state.scss',
})
export class NoKeyEmptyState {
  private readonly dialog = inject(MatDialog);

  protected async open(): Promise<void> {
    const { ApiKeyDialog } = await import('../../core/auth/api-key.dialog');
    this.dialog.open(ApiKeyDialog, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      panelClass: 'dea-dialog-panel',
    });
  }
}
