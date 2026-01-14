import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCode2,
  lucideExternalLink,
  lucideGithub,
  lucideLayers,
  lucideLayoutTemplate,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { SectionTitle } from '../../../shared/components/section-title/section-title';
import { ProjectCard } from './components/project-card/project-card';
import { PROJECTS_DATA } from '../../../shared/data/projects.data';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HlmButtonImports,
    HlmBadgeImports,
    HlmIconImports,
    SectionTitle,
    ProjectCard,
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideExternalLink,
      lucideGithub,
      lucideLayers,
      lucideLayoutTemplate,
      lucideCode2,
    }),
  ],
  templateUrl: './project.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Projects implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);
  private ctx: gsap.Context | null = null;

  projects = signal(PROJECTS_DATA);

  // Display only first 4 projects on home page
  displayedProjects = computed(() => this.projects().slice(0, 4));

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
