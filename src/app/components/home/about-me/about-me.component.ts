import { isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  WritableSignal,
  computed,
  inject,
  signal,
} from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowDown,
  lucideArrowUpRight,
  lucideCircleDot,
  lucideFolders,
  lucideGitCommit,
  lucideGitPullRequest,
  lucideStar,
  lucideUsers,
} from "@ng-icons/lucide";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ContributionDay,
  GithubApiService,
} from "../../../lib/github/github-api.service";
import { LinkButton } from "../../../shared/components/link-button/link-button";
import { SectionTitle } from "../../../shared/components/section-title/section-title";
import { ScrollAnimationDirective } from "../../../shared/directives/scroll-animation.directive";
import { SkillsShowcase } from "./skills-showcase/skills-showcase";

gsap.registerPlugin(ScrollTrigger);

/** Heatmap tint per GitHub quartile — empty days stay neutral, active days use the accent green. */
const LEVEL_CLASSES = [
  "bg-foreground/[0.07]",
  "bg-[#0AE448]/30",
  "bg-[#0AE448]/55",
  "bg-[#0AE448]/80",
  "bg-[#0AE448]",
];

/** Empty year shown while the real calendar loads (or if it can't). */
/** Terms in the bio that get the green marker underline. */
const BIO_HIGHLIGHTS = ["Aziz Zina", "Angular", "Spring Boot", "FastAPI"];

/** Marker underline; GSAP draws it in, hover fills the whole word. */
const MARK_CLASS =
  "font-medium text-foreground box-decoration-clone bg-no-repeat bg-[position:0_100%] bg-[length:100%_0.3em] bg-[linear-gradient(rgb(10_228_72/0.45),rgb(10_228_72/0.45))] transition-[background-size] duration-300 ease-out hover:bg-[length:100%_100%]";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PLACEHOLDER_WEEKS: ContributionDay[][] = Array.from({ length: 53 }, () =>
  Array.from({ length: 7 }, (_, weekday) => ({
    date: "",
    weekday,
    count: 0,
    level: 0,
  })),
);

export interface GithubProfile {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  html_url: string;
  name: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: "app-about-me",
  imports: [
    HlmIconImports,
    ScrollAnimationDirective,
    LinkButton,
    SectionTitle,
    SkillsShowcase,
  ],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUpRight,
      lucideCircleDot,
      lucideFolders,
      lucideGitCommit,
      lucideGitPullRequest,
      lucideStar,
      lucideUsers,
    }),
  ],
  templateUrl: "./about-me.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMe implements AfterViewInit, OnDestroy {
  private readonly gitApi = inject(GithubApiService);
  private readonly platform = inject(PLATFORM_ID);

  @ViewChild("separator") separator?: ElementRef<HTMLElement>;
  @ViewChild("headline") headline!: ElementRef<HTMLElement>;
  @ViewChild("intro") intro!: ElementRef<HTMLElement>;
  @ViewChild("statsPanel") statsPanel!: ElementRef<HTMLElement>;
  @ViewChild("heatmap") heatmap!: ElementRef<HTMLElement>;
  @ViewChild("tooltip") tooltip!: ElementRef<HTMLElement>;

  private gsapContext: gsap.Context | null = null;
  private reduceMotion = false;

  /** Final value of each counter, so hover can replay the roll-up. */
  private readonly finals = new Map<WritableSignal<number | null>, number>();

  private hoveredDay: HTMLElement | null = null;
  private tooltipVisible = false;
  private tooltipX?: gsap.QuickToFunc;
  private tooltipY?: gsap.QuickToFunc;

  readonly levelClasses = LEVEL_CLASSES;

  // Display values — null until the data arrives, then animated up from 0
  readonly yearsDisplay = signal<number | null>(null);
  readonly followersDisplay = signal<number | null>(null);
  readonly reposDisplay = signal<number | null>(null);
  readonly starsDisplay = signal<number | null>(null);
  readonly commitsDisplay = signal<number | null>(null);
  readonly prsDisplay = signal<number | null>(null);
  readonly issuesDisplay = signal<number | null>(null);
  readonly contributionTotalDisplay = signal<number | null>(null);

  readonly stats = [
    { label: "Followers", icon: "lucideUsers", value: this.followersDisplay },
    { label: "Repositories", icon: "lucideFolders", value: this.reposDisplay },
    { label: "Stars", icon: "lucideStar", value: this.starsDisplay },
    { label: "Commits", icon: "lucideGitCommit", value: this.commitsDisplay },
    {
      label: "Pull requests",
      icon: "lucideGitPullRequest",
      value: this.prsDisplay,
    },
    { label: "Issues", icon: "lucideCircleDot", value: this.issuesDisplay },
  ];

  private readonly contributionWeeks = signal<ContributionDay[][]>([]);
  readonly heatmapWeeks = computed(() => {
    const weeks = this.contributionWeeks();
    return weeks.length ? weeks : PLACEHOLDER_WEEKS;
  });

  readonly bioTitle =
    "I’m Aziz — a Full Stack Developer crafting fast, scalable, and immersive digital experiences that merge creativity with engineering precision.";
  readonly bioDescription =
    "I’m Aziz Zina, a results-driven Fullstack Developer from Tunisia specializing in Angular, Spring Boot, and FastAPI. I build scalable, secure, and AI-powered web applications using clean architecture, modern frameworks, and intelligent integrations.";

  get splitBioTitle() {
    return this.bioTitle.split(" ");
  }

  readonly markClass = MARK_CLASS;

  /** Bio split into plain runs and highlighted terms. */
  readonly bioSegments = this.bioDescription
    .split(new RegExp(`(${BIO_HIGHLIGHTS.join("|")})`))
    .filter(Boolean)
    .map((text) => ({ text, highlight: BIO_HIGHLIGHTS.includes(text) }));

  readonly facts = [
    { label: "Name", value: "Aziz Zina" },
    { label: "Role", value: "Full Stack Developer" },
    { label: "Based in", value: "Tunisia" },
    { label: "Core stack", value: "Angular · Spring Boot · FastAPI" },
  ];

  scrollToExperience(event: MouseEvent) {
    event.preventDefault();
    document
      .getElementById("experience")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  readonly yearsExperience = signal(3);

  format(value: number | null): string {
    return value === null ? "—" : value.toLocaleString("en-US");
  }

  /** "4 contributions · Mar 12, 2026" (fixed month names so SSR and browser agree). */
  dayLabel(day: ContributionDay): string | null {
    if (!day.date) return null;
    const [y, m, d] = day.date.split("-").map(Number);
    const noun = day.count === 1 ? "contribution" : "contributions";
    return `${day.count || "No"} ${noun} · ${MONTHS[m - 1]} ${d}, ${y}`;
  }

  // ── Hover interactions ────────────────────────────────────────────

  /** Delegated from the heatmap: grow the hovered day and float the tooltip above it. */
  onDayOver(event: PointerEvent) {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-day]",
    );
    if (!cell || cell === this.hoveredDay) return;

    this.releaseDay();
    const label = cell.dataset["label"];
    if (!label) {
      this.hideTooltip();
      return;
    }

    this.hoveredDay = cell;
    if (!this.reduceMotion) {
      gsap.to(cell, {
        scale: 1.6,
        duration: 0.25,
        ease: "back.out(3)",
        overwrite: "auto",
      });
    }

    // Set text first so the width used for clamping is the real one
    const tip = this.tooltip.nativeElement;
    tip.textContent = label;
    const box = this.heatmap.nativeElement.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const x = gsap.utils.clamp(
      half,
      box.width - half,
      rect.left - box.left + rect.width / 2,
    );
    const y = rect.top - box.top - 8;

    if (!this.tooltipVisible || this.reduceMotion) {
      gsap.set(tip, { x, y });
      gsap.to(tip, {
        autoAlpha: 1,
        scale: 1,
        duration: this.reduceMotion ? 0 : 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
      this.tooltipVisible = true;
    } else {
      // Already showing — glide to the next cell instead of popping
      this.tooltipX?.(x, gsap.getProperty(tip, "x") as number);
      this.tooltipY?.(y, gsap.getProperty(tip, "y") as number);
    }
  }

  onHeatmapLeave() {
    this.releaseDay();
    this.hideTooltip();
  }

  /** Icon does a little spin-pop, and the number quickly rolls up to its value again. */
  onStatEnter(event: MouseEvent, value: WritableSignal<number | null>) {
    if (this.reduceMotion) return;

    const icon = (event.currentTarget as HTMLElement).querySelector(
      "[data-icon]",
    );
    if (icon) {
      gsap.fromTo(
        icon,
        { rotate: -30, scale: 0.6 },
        { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(3)", overwrite: true },
      );
    }

    const final = this.finals.get(value);
    // Skip while the first count-up (or a previous roll) is still running
    if (final === undefined || final < 2 || value() !== final) return;
    const counter = { val: Math.floor(final * 0.6) };
    gsap.to(counter, {
      val: final,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => value.set(Math.round(counter.val)),
    });
  }

  private releaseDay() {
    if (!this.hoveredDay) return;
    gsap.to(this.hoveredDay, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
    this.hoveredDay = null;
  }

  private hideTooltip() {
    if (!this.tooltipVisible) return;
    this.tooltipVisible = false;
    gsap.to(this.tooltip.nativeElement, {
      autoAlpha: 0,
      scale: 0.9,
      duration: 0.15,
      ease: "power2.in",
      overwrite: "auto",
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platform)) return;

    this.reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.gsapContext = gsap.context(() => {
      if (this.separator) {
        gsap.fromTo(
          this.separator.nativeElement,
          { yPercent: -30 },
          {
            yPercent: -100,
            ease: "none",
            scrollTrigger: {
              trigger: this.separator.nativeElement,
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          },
        );
      }

      if (!this.reduceMotion) {
        this.revealIntro();
        this.revealPanel();
      }
    });

    const tip = this.tooltip.nativeElement;
    gsap.set(tip, { xPercent: -50, yPercent: -100, autoAlpha: 0, scale: 0.9 });
    this.tooltipX = gsap.quickTo(tip, "x", { duration: 0.25, ease: "power3.out" });
    this.tooltipY = gsap.quickTo(tip, "y", { duration: 0.25, ease: "power3.out" });

    this.countUp(this.yearsDisplay, this.yearsExperience(), 0.3);
    this.loadStats();
  }

  ngOnDestroy() {
    this.gsapContext?.revert();
  }

  private loadStats() {
    this.gitApi.getInfo().subscribe({
      next: (data: any) => {
        this.countUp(this.followersDisplay, data.followers, 0.5);
        this.countUp(this.reposDisplay, data.public_repos, 0.55);
      },
      error: (err) => console.error("Error fetching Github info", err),
    });

    this.gitApi.getCustomStats().subscribe({
      next: (data) => {
        if (data.error) {
          console.error("Error in custom stats:", data.error);
          return;
        }
        this.countUp(this.starsDisplay, data.stars, 0.6);
        this.countUp(this.commitsDisplay, data.commits, 0.65);
        this.countUp(this.prsDisplay, data.prs, 0.7);
        this.countUp(this.issuesDisplay, data.issues, 0.75);

        if (data.contributions?.weeks.length) {
          this.contributionWeeks.set(data.contributions.weeks);
          this.countUp(
            this.contributionTotalDisplay,
            data.contributions.total,
            0.3,
          );
        }
      },
      error: (err) => console.error("Error fetching Custom Github stats", err),
    });
  }

  /**
   * Headline "reads itself" as you scroll: each word goes from dim to full ink,
   * scrubbed to the scroll position. Then the bio + facts rise in and the
   * marker underlines draw across the key terms.
   */
  private revealIntro() {
    const headline = this.headline.nativeElement;
    gsap.fromTo(
      headline.querySelectorAll("[data-word]"),
      { opacity: 0.15 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: {
          trigger: headline,
          start: "top 85%",
          end: "bottom 45%",
          scrub: 0.6,
        },
      },
    );

    const intro = this.intro.nativeElement;
    gsap
      .timeline({
        scrollTrigger: { trigger: intro, start: "top 80%", once: true },
        defaults: { ease: "power3.out" },
      })
      .from(intro.querySelectorAll("[data-reveal]"), {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        clearProps: "opacity,transform",
      })
      .from(
        intro.querySelectorAll("[data-mark]"),
        {
          backgroundSize: "0% 0.3em",
          duration: 0.6,
          stagger: 0.18,
          ease: "power2.inOut",
          // Hand background-size back to CSS so the hover fill works
          clearProps: "backgroundSize",
        },
        0.5,
      );
  }

  /** Panel slides up, the heatmap sweeps in column by column, then the stat cells follow. */
  private revealPanel() {
    const panel = this.statsPanel.nativeElement;
    const days = this.heatmap.nativeElement.querySelectorAll("[data-day]");
    const statCells = panel.querySelectorAll("[data-stat]");

    gsap
      .timeline({
        scrollTrigger: { trigger: panel, start: "top 80%", once: true },
        defaults: { ease: "power3.out" },
      })
      .from(panel, { y: 32, opacity: 0, duration: 0.8 })
      .from(
        days,
        {
          scale: 0,
          opacity: 0,
          duration: 0.4,
          ease: "back.out(2)",
          // DOM order is week by week, so this sweeps left → right
          stagger: { amount: 1.1 },
          // Hand opacity back to CSS so the hover dimming works afterwards
          clearProps: "opacity,transform",
        },
        0.25,
      )
      .from(
        statCells,
        {
          y: 16,
          opacity: 0,
          duration: 0.6,
          stagger: 0.06,
          clearProps: "opacity,transform",
        },
        0.45,
      );
  }

  /** Counts a stat up from 0 once the panel is on screen (immediately if it already is). */
  private countUp(
    target: WritableSignal<number | null>,
    value: number,
    delay: number,
  ) {
    this.finals.set(target, value);
    if (this.reduceMotion || !this.gsapContext) {
      target.set(value);
      return;
    }

    const counter = { val: 0 };
    target.set(0);
    this.gsapContext.add(() => {
      gsap.to(counter, {
        val: value,
        duration: 1.8,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: this.statsPanel.nativeElement,
          start: "top 80%",
          once: true,
        },
        onUpdate: () => target.set(Math.round(counter.val)),
      });
    });
  }
}
