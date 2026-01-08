import { isPlatformBrowser } from '@angular/common';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { BackToTop } from './components/layout/back-to-top/back-to-top';
import { Footer } from './components/layout/footer/footer';
import { Navbar } from './components/layout/navbar/navbar';
import { CursorComponent } from './components/layout/cursor/cursor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, BackToTop, CursorComponent],
  template: `
    <app-cursor />
    <app-navbar />
    <main class="min-h-screen">
      <router-outlet />
    </main>
    <app-footer />
    <app-back-to-top
      variant="glass"
      size="medium"
      position="bottom-right"
      [showAfter]="200"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly platform = inject(PLATFORM_ID);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (isPlatformBrowser(this.platform) && typeof gtag !== 'undefined') {
          gtag('config', 'G-42206BJGCL', {
            page_path: event.urlAfterRedirects,
          });
        }
      }
    });

    if (isPlatformBrowser(this.platform)) {
      this.initLenis();
    }
  }

  private initLenis() {
    const lenis = new Lenis({
      autoRaf: true,
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }
}
