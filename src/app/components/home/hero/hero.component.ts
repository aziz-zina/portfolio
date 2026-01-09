import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { SocialSidebar } from '../../../shared/components/social-sidebar/social-sidebar';
import { HeroScene } from './hero-scene';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollIndicatorComponent } from '../../../shared/components/scroll-indicator/scroll-indicator';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [HlmButtonImports, HlmIconImports, SocialSidebar, ScrollIndicatorComponent],
  templateUrl: './hero.html',
  providers: [
    provideIcons({
      lucideArrowUpRight,
    }),
  ],
  host: {
    class: 'block w-full h-screen overflow-hidden',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  
  private heroScene: HeroScene | null = null;


  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Start animations immediately for LCP
      this.initAnimations();

      // Dynamic import Three.js in background
      const THREE = await import('three');
      this.heroScene = new HeroScene(this.canvasContainer.nativeElement, this.ngZone, THREE);

    }
  }

  ngOnDestroy() {
    this.heroScene?.dispose();
  }

  private initAnimations() {
    gsap.to('.hero-text-reveal', {
      y: 0,
      opacity: 1,
      duration: 1.5,
      stagger: 0.2,
      ease: 'power4.out',
    });
    
    gsap.to(this.canvasContainer.nativeElement, {
        scale: 1,
        opacity: 1,
        duration: 2,
        ease: 'power2.out'
    });
  }
}
