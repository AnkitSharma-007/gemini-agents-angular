import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiKeyService } from './core/auth/api-key.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly apiKeys = inject(ApiKeyService);
  private readonly themeService = inject(ThemeService);

  protected readonly hasKey = this.apiKeys.hasKey;
  protected readonly maskedKey = this.apiKeys.maskedKey;
  protected readonly mode = this.apiKeys.mode;
  protected readonly isDark = this.themeService.isDark;

  protected readonly modeLabel = computed(() =>
    this.mode() === 'fast' ? 'Fast' : 'Quality',
  );

  protected async openKeyDialog(): Promise<void> {
    const { ApiKeyDialog } = await import('./core/auth/api-key.dialog');
    this.dialog.open(ApiKeyDialog, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      panelClass: 'dea-dialog-panel',
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }
}
