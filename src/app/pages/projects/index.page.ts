import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideArrowLeft,
  lucideExternalLink,
  lucideGithub,
  lucideLayers,
  lucideLayoutTemplate,
  lucideCode2,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { ProjectCard } from '../../components/home/project/components/project-card/project-card';
import { PROJECTS_DATA } from '../../shared/data/projects.data';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HlmButtonImports,
    HlmBadgeImports,
    HlmIconImports,
    ProjectCard,
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideArrowLeft,
      lucideExternalLink,
      lucideGithub,
      lucideLayers,
      lucideLayoutTemplate,
      lucideCode2,
    }),
  ],
  template: `
    <section class="relative w-full min-h-screen bg-background dark:bg-black z-10 pt-32 pb-24">
      <!-- Ambient Background -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"
      ></div>

      <!-- Back Navigation -->
      <div class="max-w-7xl mx-auto px-6 mb-8 relative z-10">
        <a hlmBtn variant="ghost" routerLink="/">
          <ng-icon hlm name="lucideArrowLeft" size="sm" class="mr-2" />
          Back to Home
        </a>
      </div>

      <!-- Section Header -->
      <div class="max-w-7xl mx-auto px-6 pb-16 relative z-10">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 mb-4">
          All Projects
        </h1>
        <p class="text-lg text-gray-400 max-w-2xl">
          A complete showcase of my work, featuring web applications, open-source contributions, and innovative solutions.
        </p>
      </div>

      <!-- Projects Grid -->
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          @for (project of projects(); track $index) {
            <app-project-card 
              [project]="project" 
              [attr.data-index]="$index"
            />
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AllProjectsPage implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);
  private ctx: gsap.Context | null = null;

  projects = signal(PROJECTS_DATA);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      setTimeout(() => this.initCardAnimations(), 100);
    }
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }

  private initCardAnimations() {
    this.ctx = gsap.context(() => {
      const cards = this.el.nativeElement.querySelectorAll('.project-card');
      
      // Set initial state
      gsap.set(cards, {
        opacity: 0,
        y: 60,
      });

      // Animate each card when it comes into view
      cards.forEach((card: HTMLElement, index: number) => {
        gsap.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          delay: (index % 2) * 0.15, // Stagger between left and right columns
        });
      });
    }, this.el.nativeElement);
  }
}
