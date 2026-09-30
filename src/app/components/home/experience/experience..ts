import { isPlatformBrowser, NgOptimizedImage } from "@angular/common";
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
  signal,
} from "@angular/core";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionTitle } from "../../../shared/components/section-title/section-title";

gsap.registerPlugin(ScrollTrigger);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ExperienceItem {
  title: string;
  company: string;
  logo: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", or null while ongoing */
  end: string | null;
  current: boolean;
  description: string[];
  skills: string[];
}

@Component({
  selector: "app-experience",
  standalone: true,
  imports: [SectionTitle, NgOptimizedImage],
  templateUrl: "./experience.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);

  @ViewChild("horizontalContainer")
  horizontalContainer!: ElementRef<HTMLElement>;
  @ViewChild("horizontalTrack") horizontalTrack!: ElementRef<HTMLElement>;
  @ViewChild("progressBar") progressBar!: ElementRef<HTMLElement>;
  @ViewChildren("experienceCard") experienceCards!: QueryList<
    ElementRef<HTMLElement>
  >;

  private gsapContext: gsap.Context | null = null;

  readonly experience = signal<ExperienceItem[]>([
    {
      title: "Software Engineer",
      start: "2026-06",
      end: null,
      company: "Accent",
      logo: "companies/accent_logo.jfif",
      current: true,
      description: [
        "Developing and maintaining a comprehensive fleet management platform using Angular and Spring Boot.",
        "Implementing new features, resolving bugs, and improving system performance across both frontend and backend.",
        "Building modules for fleet, vehicle, mission, maintenance, driver, and expense management while ensuring scalability, security, and reliability.",
      ],
      skills: [
        "Angular",
        "Spring Boot",
        "Java",
        "TypeScript",
        "PostgreSQL",
        "REST APIs",
        "Git",
        "Fleet Management",
      ],
    },
    {
      title: "Software Developer",
      start: "2024-01",
      end: "2026-06",
      company: "Inspark",
      logo: "companies/inspark.png",
      current: false,
      description: [
        "Maintaining enterprise-grade Angular/Spring Boot apps with Keycloak SSO and modular component architecture.",
        "Refactored core services into reusable modules using domain-driven design, increasing maintainability by 30%.",
        "Integrated RabbitMQ and WebSocket for real-time messaging; deployed and monitored apps via AWS and Azure.",
      ],
      skills: [
        "Angular",
        "Spring Boot",
        "Keycloak",
        "RabbitMQ",
        "AWS",
        "Azure",
        "Docker",
        "PostgreSQL",
      ],
    },
    {
      title: "Advanced Internship Trainee",
      start: "2022-01",
      end: "2022-02",
      company: "BNA - Banque Nationale Agricole",
      logo: "companies/bna.png",
      current: false,
      description: [
        "Designed and developed a full-stack expense management module for the bank's litigation management system.",
        "Implemented backend services and user interfaces to streamline expense tracking and validation workflows.",
      ],
      skills: [
        "Spring Boot",
        "Angular",
        "Oracle Database",
        "Full Stack Development",
      ],
    },
    {
      title: "Introductory Internship Trainee",
      start: "2021-07",
      end: "2021-08",
      company: "QNB - Qatar National Bank",
      logo: "companies/qnb.png",
      current: false,
      description: [
        "Performed hardware and software maintenance within the computer systems department.",
        "Provided technical support for workstations, operating systems, and internal IT infrastructure.",
      ],
      skills: [
        "IT Support",
        "Hardware Maintenance",
        "Software Maintenance",
        "Computer Systems",
      ],
    },
  ]);

  /** "2024-01" → "Jan 2024". Fixed month names so SSR and browser render identically. */
  formatMonth(value: string): string {
    const [year, month] = value.split("-").map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  }

  /** Inclusive duration, LinkedIn-style: "2 yrs 6 mos", "2 mos". */
  duration(start: string, end: string | null): string {
    const [sy, sm] = start.split("-").map(Number);
    const now = new Date();
    const [ey, em] = end
      ? end.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
    const total = Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
    const years = Math.floor(total / 12);
    const months = total % 12;
    const parts: string[] = [];
    if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
    if (months) parts.push(`${months} mo${months > 1 ? "s" : ""}`);
    return parts.join(" ");
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      setTimeout(() => this.initHorizontalScroll(), 150);
    }
  }

  ngOnDestroy() {
    this.gsapContext?.revert();
  }

  private initHorizontalScroll() {
    const track = this.horizontalTrack.nativeElement;
    const container = this.horizontalContainer.nativeElement;
    const progressBar = this.progressBar.nativeElement;
    const cards = this.experienceCards.toArray().map((c) => c.nativeElement);

    // Cards beyond the first start hidden
    const laterCards = cards.slice(1);
    gsap.set(laterCards, { opacity: 0, y: 60, scale: 0.95 });

    this.gsapContext = gsap.context(() => {
      // Master timeline drives everything — ScrollTrigger scrubs it
      const tl = gsap.timeline({ paused: true });

      // 1. Slide the track left by its full overflow amount
      tl.to(
        track,
        {
          x: () => -(track.scrollWidth - container.offsetWidth),
          ease: "none",
          duration: 1,
        },
        0,
      );

      // 2. Progress bar fills from 0 → 100% in sync
      tl.to(
        progressBar,
        {
          width: "100%",
          ease: "none",
          duration: 1,
        },
        0,
      );

      // 3. Each later card animates in staggered across the timeline
      const n = laterCards.length;
      laterCards.forEach((card, i) => {
        // Spread entries evenly across 0.15 → 0.85 of the timeline
        const start = 0.15 + (i / n) * 0.55;
        const end = start + 0.3;

        tl.to(
          card,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "power3.out",
            duration: end - start,
          },
          start,
        );
      });

      // 4. ScrollTrigger scrubs the timeline
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        // Give enough scroll distance — 150% of viewport per card after the first
        end: () => `+=${(cards.length - 1) * window.innerHeight * 1.2}`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
        animation: tl,
      });
    });
  }
}
