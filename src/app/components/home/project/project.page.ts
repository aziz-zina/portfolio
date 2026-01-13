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
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonImports,
    HlmBadgeImports,
    HlmIconImports,
    SectionTitle,
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

  projects = signal([
    {
      name: 'Sabeel Platform',
      type: 'Social Impact',
      image:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop',
      description:
        'A comprehensive reintegration ecosystem for ex-prisoners. The platform bridges the gap between rehabilitation and society through tailored resource matching.',
      techs: ['Angular', 'Spring Boot', 'PostgreSQL', 'Keycloak', 'AWS'],
      website: null,
      highlights: [
        'Assisted 500+ individuals with reintegration',
        'Increased job placement rates by 40%',
        'Secure RBAC with Keycloak Identity',
      ],
    },
    {
      name: 'One Saha',
      type: 'Health Tech',
      image:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1600&auto=format&fit=crop',
      description:
        'Community-driven public health data aggregation platform. Uses ML to classify and serve relevant health news and statistics to the public.',
      techs: ['Spring Cloud', 'Python', 'ML', 'Docker', 'Prometheus'],
      website: 'https://onesaha.org/home',
      highlights: [
        'Microservices architecture (10+ services)',
        'ML-powered news classification engine',
        'Real-time data processing pipeline',
      ],
    },
    {
      name: 'Inspark Forge',
      type: 'AI Recruitment',
      image:
        'https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1600&auto=format&fit=crop',
      description:
        'Next-gen talent matching for the Tunisian market. Leverages GPT-4o to analyze CVs and match candidates with opportunities based on semantic compatibility.',
      techs: ['OpenAI API', 'Spring Boot', 'DDD', 'RabbitMQ', 'Angular'],
      website: 'https://talent.inspark.tn/',
      highlights: [
        'Integrated GPT-4o for semantic matching',
        'Domain-Driven Design implementation',
        'Asynchronous event-driven architecture',
      ],
    },
    {
      name: 'Ministry of Agriculture',
      type: 'Government',
      image:
        'https://images.unsplash.com/photo-1625246333195-58f214014a2b?q=80&w=1600&auto=format&fit=crop',
      description:
        'The official digital gateway for the Ministry. A high-traffic portal providing secure access to agricultural services, news, and regulatory data.',
      techs: ['Elasticsearch', 'Keycloak', 'Resilience4j', 'Tailwind'],
      website: 'https://staging-agri.agrinet.tn/home',
      highlights: [
        'Advanced search with Elasticsearch',
        'High-availability & Rate limiting',
        'WCAG Accessibility compliance',
      ],
    },
    {
      name: 'Konnect Boot Starter',
      type: 'Open Source',
      image:
        'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=1600&auto=format&fit=crop',
      description:
        'A developer-first Spring Boot starter for the Konnect Payment Gateway. Simplifies payment integration with auto-configuration and resilience patterns.',
      techs: ['Java', 'Maven Central', 'Spring Boot', 'Resilience4j'],
      website: 'https://github.com/Oussemasahbeni/konnect-spring-boot-starter',
      highlights: [
        'Published artifact on Maven Central',
        'Built-in webhook security validation',
        'Zero-config Spring auto-configuration',
      ],
    },
    {
      name: 'Keycloakify Custom Theme',
      type: 'Dev Tools',
      image:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1600&auto=format&fit=crop',
      description:
        'A modern, responsive React-based theme for Keycloak Identity Server. Replaces the legacy FreeMarker templates with a clean Tailwind CSS interface.',
      techs: ['React', 'TypeScript', 'Keycloakify', 'Tailwind'],
      website:
        'https://github.com/Oussemasahbeni/keycloak-react-custom-theme-keycloakify',
      highlights: [
        'React-based component architecture',
        'Full Dark Mode support',
        'Custom email template generation',
      ],
    },
  ]);

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
