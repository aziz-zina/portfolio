import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { gsap } from 'gsap';

@Component({
  selector: 'app-scroll-indicator',
  standalone: true,
  imports: [HlmIconImports],
  providers: [provideIcons({ lucideChevronDown })],
  template: `
    <div #indicator class="flex flex-col items-center gap-2">
      <span class="text-sm text-gray-500">scroll down</span>
      <div class="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center animate-bounce">
        <ng-icon name="lucideChevronDown" size="1.25rem" class="text-gray-600" />
      </div>
    </div>
  `,
  host: {
    class: 'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollIndicatorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('indicator') indicator!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private scrollHandler: (() => void) | null = null;
  private isVisible = true;
  private tween: gsap.core.Tween | null = null;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      gsap.fromTo(
        this.indicator.nativeElement,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1.5, ease: 'power4.out' }
      );

      this.scrollHandler = () => this.handleScroll();
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.tween) {
      this.tween.kill();
    }
  }

  private handleScroll() {
    const scrollY = window.scrollY;
    const threshold = 50;

    if (scrollY > threshold && this.isVisible) {
      this.isVisible = false;
      if (this.tween) this.tween.kill();
      this.tween = gsap.to(this.indicator.nativeElement, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else if (scrollY <= threshold && !this.isVisible) {
      this.isVisible = true;
      if (this.tween) this.tween.kill();
      this.tween = gsap.to(this.indicator.nativeElement, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }
}
