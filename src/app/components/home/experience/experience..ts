import { CommonModule, isPlatformBrowser } from '@angular/common';
import { 
  AfterViewInit, 
  ChangeDetectionStrategy, 
  Component, 
  ElementRef, 
  OnDestroy, 
  PLATFORM_ID, 
  QueryList,
  ViewChild, 
  ViewChildren,
  inject, 
  signal 
} from '@angular/core';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { SectionTitle } from '../../../shared/components/section-title/section-title';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, HlmBadgeImports, SectionTitle],
  templateUrl: './experience.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  
  @ViewChild('experienceSection') experienceSection!: ElementRef<HTMLElement>;
  @ViewChild('horizontalContainer') horizontalContainer!: ElementRef<HTMLElement>;
  @ViewChild('horizontalTrack') horizontalTrack!: ElementRef<HTMLElement>;
  @ViewChild('progressBar') progressBar!: ElementRef<HTMLElement>;
  
  @ViewChild('endSpacer') endSpacer!: ElementRef<HTMLElement>;
  @ViewChildren('experienceCard') experienceCards!: QueryList<ElementRef<HTMLElement>>;
  
  private scrollTrigger: ScrollTrigger | null = null;
  private gsapContext: gsap.Context | null = null;

  experience = signal([
    {
      title: 'Software Developer',
      date: 'Jan 2024 — Present',
      company: 'Inspark',
      logo: 'companies/inspark.png',
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
      title: 'Advanced Internship Trainee',
      date: 'Jan 2022 — Feb 2022',
      company: 'BNA - Banque Nationale Agricole',
      logo: 'companies/bna.png',
      current: false,
      gotBulletPoints: true,
      description: [
        'Designed and developed a full-stack expense management module for the bank’s litigation management system.',
        'Implemented backend services and user interfaces to streamline expense tracking and validation workflows.',
      ],
      skills: ['Spring Boot', 'Angular', 'Oracle Database', 'Full Stack Development'],
    },
    {
      title: 'Introductory Internship Trainee',
      date: 'Jul 2021 — Aug 2021',
      company: 'QNB - Qatar National Bank',
      logo: 'companies/qnb.png',
      current: false,
      gotBulletPoints: true,
      description: [
        'Performed hardware and software maintenance within the computer systems department.',
        'Provided technical support for workstations, operating systems, and internal IT infrastructure.',
      ],
      skills: ['IT Support', 'Hardware Maintenance', 'Software Maintenance', 'Computer Systems'],
    },

  ]);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => this.initHorizontalScroll(), 100);
    }
  }

  ngOnDestroy() {
    if (this.gsapContext) {
      this.gsapContext.revert();
    }
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
    const endSpacer = this.endSpacer?.nativeElement;
    const cards = this.experienceCards.toArray().map(card => card.nativeElement);
    
    // Calculate how far we need to scroll horizontally
    const scrollWidth = track.scrollWidth - container.offsetWidth;
    
    // Create GSAP context for proper cleanup
    this.gsapContext = gsap.context(() => {
      // Set initial state for cards (skip the first one - it's visible by default)
      const animatedCards = cards.slice(1);
      gsap.set(animatedCards, {
        opacity: 0,
        y: 80,
        scale: 0.9,
        rotateX: 15,
      });
      
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

          // Animate cards based on their position in the scroll (skip first card)
          const totalAnimatedCards = animatedCards.length;
          animatedCards.forEach((card, index) => {
            // Calculate when each card should animate (staggered based on position)
            const cardStart = (index + 1) / (totalAnimatedCards + 2);
            const cardEnd = cardStart + (1 / (totalAnimatedCards + 2));
            
            // Calculate card's individual progress
            const cardProgress = Math.min(
              1,
              Math.max(0, (self.progress - cardStart) / (cardEnd - cardStart))
            );
            
            // Apply eased animation
            const easedProgress = this.easeOutCubic(cardProgress);
            
            gsap.set(card, {
              opacity: easedProgress,
              y: 80 * (1 - easedProgress),
              scale: 0.9 + (0.1 * easedProgress),
              rotateX: 15 * (1 - easedProgress),
            });
          });

          // Animate End Spacer (reveal near the end)
          if (endSpacer) {
            const buffer = 0.9; // Start animating when 90% through
            const remappedProgress = Math.max(0, (self.progress - buffer) * (1 / (1 - buffer)));
            
            gsap.set(endSpacer, {
              opacity: remappedProgress,
              scale: 0.5 + (0.5 * remappedProgress),
              rotate: 10 * (1 - remappedProgress)
            });
          }
        },
      });
    });
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
