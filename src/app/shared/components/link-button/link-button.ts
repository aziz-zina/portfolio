import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';

/**
 * Pill link. Uses the theme's foreground/background pair, so it's a dark pill
 * in light mode and a light pill in dark mode. On hover the arrow's disc
 * inverts (was a GSAP tween between hardcoded #000/#fff, which broke in dark mode).
 */
@Component({
  selector: 'app-link-button',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideArrowUpRight })],
  template: `
    <a
      [href]="link()"
      class="cursor-pointer group inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out hover:scale-105"
      (click)="onClick($event)"
    >
      {{ title() }}
      <span
        class="w-6 h-6 rounded-full flex items-center justify-center bg-foreground text-background transition-colors duration-300 group-hover:bg-background group-hover:text-foreground"
      >
        <ng-icon
          name="lucideArrowUpRight"
          size="0.9rem"
          class="transition-transform duration-300 group-hover:rotate-45"
        />
      </span>
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkButton {
  private readonly platformId = inject(PLATFORM_ID);

  link = input.required<string>();
  title = input.required<string>();

  onClick(event: MouseEvent) {
    if (!isPlatformBrowser(this.platformId)) return;

    const href = this.link();
    // Handle anchor links with smooth scroll
    if (href.startsWith('#')) {
      event.preventDefault();
      document
        .getElementById(href.substring(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
