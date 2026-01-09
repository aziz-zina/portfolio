import { CommonModule, isPlatformBrowser } from '@angular/common';
import { 
  AfterViewInit, 
  ChangeDetectionStrategy, 
  Component, 
  ElementRef, 
  OnDestroy, 
  PLATFORM_ID, 
  ViewChild, 
  inject, 
  signal 
} from '@angular/core';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, HlmBadgeImports, ScrollAnimationDirective],
  templateUrl: './experience.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  
  @ViewChild('experienceSection') experienceSection!: ElementRef<HTMLElement>;
  @ViewChild('horizontalContainer') horizontalContainer!: ElementRef<HTMLElement>;
  @ViewChild('horizontalTrack') horizontalTrack!: ElementRef<HTMLElement>;
  @ViewChild('progressBar') progressBar!: ElementRef<HTMLElement>;
  
  private scrollTrigger: ScrollTrigger | null = null;

  experience = signal([
    {
      title: 'Software Developer',
      date: 'Jan 2024 — Present',
      company: 'Inspark',
      current: true,
      gotBulletPoints: true,
      description: [
        'Maintaining enterprise-grade Angular/Spring Boot apps with Keycloak SSO and modular component architecture.',
        'Refactored core services into reusable modules using domain-driven design, increasing maintainability by 30%.',
        'Integrated RabbitMQ and WebSocket for real-time messaging; deployed and monitored apps via AWS and Azure.',
      ],
      skills: [
        'Angular',
        'Spring Boot',
        'Keycloak',
        'RabbitMQ',
        'AWS',
        'Azure',
        'Docker',
        'PostgreSQL',
      ],
    },
    {
      title: 'Internship Trainee',
      date: 'Jan 2023 — Feb 2023',
      company: "Centre National de l'Informatique",
      current: false,
      gotBulletPoints: true,
      description: [
        'Developed internal task management platform adopted by 3 departments; improved tracking efficiency by 50%.',
        'Configured role-based access via Spring Security; optimized PostgreSQL queries to reduce API latency by 35%.',
      ],
      skills: ['Spring Boot', 'Spring Security', 'PostgreSQL', 'Angular'],
    },
    {
      title: 'Internship Trainee',
      date: 'Jan 2023 — Feb 2023',
      company: "Centre National de l'Informatique",
      current: false,
      gotBulletPoints: true,
      description: [
        'Developed internal task management platform adopted by 3 departments; improved tracking efficiency by 50%.',
        'Configured role-based access via Spring Security; optimized PostgreSQL queries to reduce API latency by 35%.',
      ],
      skills: ['Spring Boot', 'Spring Security', 'PostgreSQL', 'Angular'],
    },
    {
      title: 'Internship Trainee',
      date: 'Jan 2023 — Feb 2023',
      company: "Centre National de l'Informatique",
      current: false,
      gotBulletPoints: true,
      description: [
        'Developed internal task management platform adopted by 3 departments; improved tracking efficiency by 50%.',
        'Configured role-based access via Spring Security; optimized PostgreSQL queries to reduce API latency by 35%.',
      ],
      skills: ['Spring Boot', 'Spring Security', 'PostgreSQL', 'Angular'],
    },
  ]);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => this.initHorizontalScroll(), 100);
    }
  }

  ngOnDestroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
    ScrollTrigger.getAll().forEach(st => {
      if (st.vars.trigger === this.horizontalContainer?.nativeElement) {
        st.kill();
      }
    });
  }

  private initHorizontalScroll() {
    const track = this.horizontalTrack.nativeElement;
    const container = this.horizontalContainer.nativeElement;
    const progressBar = this.progressBar.nativeElement;
    
    // Calculate how far we need to scroll horizontally
    const scrollWidth = track.scrollWidth - container.offsetWidth;
    
    // Create the horizontal scroll animation
    this.scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: () => `+=${scrollWidth}`,
      pin: true,
      anticipatePin: 1,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Move the track horizontally based on scroll progress
        gsap.set(track, {
          x: -scrollWidth * self.progress,
        });
        // Update progress bar
        gsap.set(progressBar, {
          width: `${self.progress * 100}%`,
        });
      },
    });
  }
}
