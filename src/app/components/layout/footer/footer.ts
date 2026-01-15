import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CursorService } from '../../../shared/services/cursor.service';
import gsap from 'gsap';

interface NavLink {
  label: string;
  url: string;
}

interface SocialLink {
  label: string;
  url: string;
}

@Component({
  selector: 'app-footer',
  imports: [HlmButtonImports],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements AfterViewInit, OnDestroy {
  private readonly cursorService = inject(CursorService);
  private readonly el = inject(ElementRef);
  private readonly platform = inject(PLATFORM_ID);
  private ctx: gsap.Context | null = null;

  readonly navLinks = signal<NavLink[]>([
    { label: 'Home', url: '#' },
    { label: 'About', url: '#about' },
    { label: 'Experience', url: '#experience' },
    { label: 'Projects', url: '#projects' },
    { label: 'Contact', url: '#contact' },
  ]);

  readonly socials = signal<SocialLink[]>([
    { label: 'GitHub', url: 'https://github.com/aziz-zina' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/aziz-zina/' },
  ]);

  readonly currentYear = signal(new Date().getFullYear());

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      this.initGradientAnimations();
    }
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }

  private initGradientAnimations() {
    this.ctx = gsap.context(() => {
      const gradients = this.el.nativeElement.querySelectorAll('.aurora-gradient');

      // Animate each gradient with different timing for organic feel
      gradients.forEach((gradient: HTMLElement, index: number) => {
        const duration = 8 + index * 2; // Different duration for each
        const xRange = 30 + index * 10;
        const yRange = 20 + index * 5;

        gsap.to(gradient, {
          x: `random(-${xRange}, ${xRange})`,
          y: `random(-${yRange}, ${yRange})`,
          scale: `random(0.9, 1.1)`,
          opacity: `random(0.3, 0.6)`,
          duration: duration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.5,
        });
      });
    }, this.el.nativeElement);
  }

  onFooterEnter() {
    this.cursorService.setMenuOpen(true);
  }

  onFooterLeave() {
    this.cursorService.setMenuOpen(false);
  }

  onNavClick(event: MouseEvent, url: string) {
    if (url.startsWith('#')) {
      event.preventDefault();
      const targetId = url.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}
