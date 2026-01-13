import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  signal,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
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
  @ViewChildren('projectContent') projectContents!: QueryList<ElementRef>;
  @ViewChildren('projectImage') projectImages!: QueryList<ElementRef>;
  
  @ViewChild('section') section!: ElementRef;
  @ViewChild('container') container!: ElementRef;
  @ViewChild('previewWrapper') previewWrapper!: ElementRef;
  @ViewChild('preview') preview!: ElementRef;
  @ViewChild('leftColumn') leftColumn!: ElementRef;

  private ctx: gsap.Context | undefined;
  
  activeProjectName = signal('');

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

  constructor(private el: ElementRef) {
    gsap.registerPlugin(ScrollTrigger);
  }

  ngAfterViewInit() {
    requestAnimationFrame(() => {
      this.initScrollAnimations();
    });
  }

  private initScrollAnimations() {
    this.ctx = gsap.context(() => {
      const container = this.container?.nativeElement;
      const previewWrapper = this.previewWrapper?.nativeElement;
      const preview = this.preview?.nativeElement;
      const leftColumn = this.leftColumn?.nativeElement;

      if (!container || !leftColumn) return;

      const contents = this.el.nativeElement.querySelectorAll('.project-content');
      const images = this.el.nativeElement.querySelectorAll('.project-image');

      if (!contents.length || !images.length) return;

      // Set initial state for images
      gsap.set(images, { opacity: 0, scale: 1.05 });
      gsap.set(images[0], { opacity: 1, scale: 1 });
      this.activeProjectName.set(this.projects()[0].name);

      const mm = gsap.matchMedia();

      // Desktop: Split-screen with delayed pinning
      mm.add("(min-width: 1024px)", () => {
        if (!preview || !previewWrapper) return;

        // The preview wrapper is absolutely positioned at top:0
        // We pin the inner preview container which creates the "delayed" effect
        // Pin starts when the container top hits the viewport top
        ScrollTrigger.create({
          trigger: container,
          start: "top top",
          endTrigger: leftColumn,
          end: "bottom bottom",
          pin: preview,
          pinSpacing: false,
          // markers: true, // Uncomment for debugging
        });

        // Text & Image transitions based on scroll position
        contents.forEach((content: HTMLElement, i: number) => {
          ScrollTrigger.create({
            trigger: content,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => this.updateActive(i, contents, images),
            onEnterBack: () => this.updateActive(i, contents, images),
          });
        });

        // Initialize first item as active
        this.updateActive(0, contents, images);

        return () => {};
      });

      // Mobile: No pinning
      mm.add("(max-width: 1023px)", () => {
        contents.forEach((content: HTMLElement) => {
          gsap.set(content, { opacity: 1 });
        });

        return () => {};
      });

    }, this.el);
  }

  updateActive(index: number, contents: NodeListOf<HTMLElement>, images: NodeListOf<HTMLElement>) {
    this.activeProjectName.set(this.projects()[index].name);

    // Animate Texts
    contents.forEach((content, i) => {
      gsap.to(content, {
        opacity: i === index ? 1 : 0.3,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    // Animate Images
    images.forEach((img, i) => {
      if (i === index) {
        gsap.to(img, {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      } else {
        gsap.to(img, {
          opacity: 0,
          scale: 1.05,
          duration: 0.7,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    });
  }

  ngOnDestroy() {
    this.ctx?.revert();
  }
}
