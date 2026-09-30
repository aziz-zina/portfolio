import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { playThemeSound } from '../../../lib/theme/theme-sound';
import { ThemeService } from '../../../lib/theme/theme.service';

/**
 * Sun/moon button. The icon swap is driven by the `dark:` variant rather than
 * the signal, so the prerendered HTML already shows the right icon before
 * Angular hydrates.
 */
@Component({
  selector: 'app-theme-toggler',
  imports: [NgIcon],
  providers: [provideIcons({ lucideSun, lucideMoon })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle($event)"
      [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="isDark()"
      [title]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      class="group/theme relative grid place-items-center overflow-hidden rounded-full cursor-pointer transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2"
      [class]="
        tone() === 'inverse'
          ? 'size-12 border-2 border-white text-white hover:bg-zinc-800 focus-visible:outline-white'
          : 'size-10 border border-border text-foreground hover:bg-muted focus-visible:outline-foreground'
      "
    >
      <!-- Sun: shown in light mode, spins down and away in dark mode -->
      <ng-icon
        name="lucideSun"
        size="1.15rem"
        class="[grid-area:1/1] transition-[rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/theme:rotate-45 dark:-rotate-90 dark:scale-0 dark:opacity-0"
      />
      <!-- Moon: waits rotated and scaled out, swings in for dark mode -->
      <ng-icon
        name="lucideMoon"
        size="1.1rem"
        class="[grid-area:1/1] rotate-90 scale-0 opacity-0 transition-[rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:rotate-0 dark:scale-100 dark:opacity-100 dark:group-hover/theme:-rotate-12"
      />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);

  /** `inverse` for dark surfaces that stay dark in both themes (the menu overlay). */
  readonly tone = input<'default' | 'inverse'>('default');

  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  protected toggle(event: MouseEvent) {
    playThemeSound(this.isDark() ? 'light' : 'dark');
    this.themeService.toggleTheme(event);
  }
}
