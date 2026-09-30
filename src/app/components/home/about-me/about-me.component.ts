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
  HlmContributionSkylineImports,
  type PaletteInput,
  type SkylineDay,
} from "@spartan-ng/helm/contribution-skyline";
import { GithubApiService } from "../../../lib/github/github-api.service";
import { LinkButton } from "../../../shared/components/link-button/link-button";
import { SectionTitle } from "../../../shared/components/section-title/section-title";
import { ScrollAnimationDirective } from "../../../shared/directives/scroll-animation.directive";
import { SkillsShowcase } from "./skills-showcase/skills-showcase";

gsap.registerPlugin(ScrollTrigger);

/** The site accent (#0AE448) at the old heatmap's 30/55/80/100% strengths, flattened onto each theme's card. */
const SKYLINE_PALETTE: PaletteInput = {
  light: ["#b6f7c8", "#78f09a", "#3be96d", "#0ae448"],
  dark: ["#0f4a22", "#0e8434", "#0cb840", "#0ae448"],
};

/** Terms in the bio that get the green marker underline. */
const BIO_HIGHLIGHTS = ["Aziz Zina", "Angular", "Spring Boot", "FastAPI"];

/** Marker underline; GSAP draws it in, hover fills the whole word. */
const MARK_CLASS =
  "font-medium text-foreground box-decoration-clone bg-no-repeat bg-[position:0_100%] bg-[length:100%_0.3em] bg-[linear-gradient(rgb(10_228_72/0.45),rgb(10_228_72/0.45))] transition-[background-size] duration-300 ease-out hover:bg-[length:100%_100%]";

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
    HlmContributionSkylineImports,
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

  private gsapContext: gsap.Context | null = null;
  private reduceMotion = false;

  /** Final value of each counter, so hover can replay the roll-up. */
  private readonly finals = new Map<WritableSignal<number | null>, number>();

  readonly skylinePalette = SKYLINE_PALETTE;

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

  /** Empty until the real calendar arrives — never the component's generated sample year. */
  readonly contributionDays = signal<SkylineDay[]>([]);

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
          this.contributionDays.set(
            data.contributions.weeks
              .flat()
              .map(({ date, count }) => ({ date, count })),
          );
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

  /** Panel slides up, then the stat cells follow (the skyline animates itself when it scrolls into view). */
  private revealPanel() {
    const panel = this.statsPanel.nativeElement;
    const statCells = panel.querySelectorAll("[data-stat]");

    gsap
      .timeline({
        scrollTrigger: { trigger: panel, start: "top 80%", once: true },
        defaults: { ease: "power3.out" },
      })
      .from(panel, { y: 32, opacity: 0, duration: 0.8 })
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
