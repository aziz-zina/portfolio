import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<Theme>('light');

  constructor() {
    this.initializeTheme();
  }

  /**
   * Toggles between light and dark.
   * With a click position and View Transitions support, the new theme is
   * revealed as a circle growing from the click; otherwise colours cross-fade.
   */
  toggleTheme(event?: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduceMotion) {
      this.setTheme(next);
      return;
    }

    if (!this.document.startViewTransition || !event) {
      this.crossFade(() => this.setTheme(next));
      return;
    }

    // Keyboard "clicks" report 0,0 — start the circle from the button instead
    let { clientX: x, clientY: y } = event;
    if (x === 0 && y === 0 && event.currentTarget instanceof Element) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    this.circularReveal(x, y, () => this.setTheme(next));
  }

  /** New theme grows as a circle from (x, y) over the old one. */
  private circularReveal(x: number, y: number, apply: () => void) {
    const root = this.document.documentElement;
    // Farthest corner, so the circle ends up covering the whole viewport
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    // Scopes the pseudo-element CSS in styles.css to this transition only,
    // so it doesn't affect other view transitions (e.g. the router's)
    root.classList.add('theme-transition');

    const transition = this.document.startViewTransition(apply);

    transition.ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });

    transition.finished.finally(() => root.classList.remove('theme-transition'));
  }

  /** Fallback for browsers without View Transitions. */
  private crossFade(apply: () => void) {
    const root = this.document.documentElement;
    root.classList.add('theme-fade');
    apply();
    setTimeout(() => root.classList.remove('theme-fade'), 320);
  }

  /**
   * The inline script in index.html has already applied the right class before
   * first paint — read it from there so the service and the page always agree.
   */
  private initializeTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = this.document.documentElement;
    this.theme.set(root.classList.contains('dark') ? 'dark' : 'light');

    // Follow the OS setting until the visitor makes an explicit choice
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (this.readSaved()) return;
        this.crossFade(() => this.applyTheme(e.matches ? 'dark' : 'light'));
      });
  }

  /** Explicit choice: apply and remember it. */
  private setTheme(theme: Theme): void {
    this.applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit
    }
  }

  private applyTheme(theme: Theme): void {
    this.theme.set(theme);
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private readSaved(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
