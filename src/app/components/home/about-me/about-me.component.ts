import { isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowUpRight,
  lucideBug,
  lucideCloud,
  lucideCode,
  lucideDatabase,
  lucideDumbbell,
  lucideFolders,
  lucideGitCommit,
  lucideGitPullRequest,
  lucideLayout,
  lucideServer,
  lucideShield,
  lucideStar,
  lucideTrendingUp,
  lucideUsers,
} from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCardImports } from "@spartan-ng/helm/card";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GithubApiService } from "../../../lib/github/github-api.service";
import { LinkButton } from "../../../shared/components/link-button/link-button";
import { SectionTitle } from "../../../shared/components/section-title/section-title";
import { ScrollAnimationDirective } from "../../../shared/directives/scroll-animation.directive";
import { SkillsShowcase } from "./skills-showcase/skills-showcase";

gsap.registerPlugin(ScrollTrigger);

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
    HlmCardImports,
    HlmIconImports,
    HlmButtonImports,
    ScrollAnimationDirective,
    LinkButton,
    SectionTitle,
    SkillsShowcase,
  ],
  providers: [
    provideIcons({
      lucideUsers,
      lucideFolders,
      lucideTrendingUp,
      lucideDumbbell,
      lucideArrowUpRight,
      lucideLayout,
      lucideServer,
      lucideDatabase,
      lucideCloud,
      lucideShield,
      lucideCode,
      lucideStar,
      lucideGitCommit,
      lucideGitPullRequest,
      lucideBug,
    }),
  ],
  templateUrl: "./about-me.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
    `,
  ],
})
export class AboutMe implements OnInit, AfterViewInit {
  private readonly gitApi = inject(GithubApiService);
  private readonly platform = inject(PLATFORM_ID);

  @ViewChild("separator") separator!: ElementRef<HTMLElement>;
  @ViewChild("experienceArrow") experienceArrow!: ElementRef<HTMLElement>;
  @ViewChild("yearsCount") yearsCount!: ElementRef<HTMLElement>;
  @ViewChild("followersCount") followersCount!: ElementRef<HTMLElement>;
  @ViewChild("reposCount") reposCount!: ElementRef<HTMLElement>;

  private arrowTween: gsap.core.Tween | null = null;
  private remoteStatsAnimated = false;
  private isDataLoaded = false;

  // Final values (source of truth from API)
  readonly publicRepos = signal(0);
  readonly followers = signal(0);

  // Custom Stats
  readonly githubStars = signal(0);
  readonly githubCommits = signal(0);
  readonly githubPRs = signal(0);
  readonly githubIssues = signal(0);

  // Display values (animated)
  readonly yearsDisplay = signal(0);
  readonly followersDisplay = signal(0);
  readonly reposDisplay = signal(0);
  readonly githubStarsDisplay = signal(0);
  readonly githubCommitsDisplay = signal(0);
  readonly githubPRsDisplay = signal(0);
  readonly githubIssuesDisplay = signal(0);

  readonly bioTitle =
    "I'm Aziz - a Full Stack Developer crafting fast, scalable, and immersive digital experiences that merge creativity with engineering precision.";
  readonly bioDescription =
    "I'm Aziz Zina, a results-driven Fullstack Developer from Tunisia specializing in Angular, Spring Boot, and FastAPI. I build scalable, secure, and AI-powered web applications using clean architecture, modern frameworks, and intelligent integrations.";

  get splitBioTitle() {
    return this.bioTitle.split(" ");
  }

  get splitBioDescription() {
    return this.bioDescription.split(" ");
  }

  readonly yearsExperience = signal(3);
  readonly usersServed = signal(1000);
  readonly projectsCompleted = signal(4);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.gitApi.getInfo().subscribe({
        next: (data: any) => {
          // Store final values
          this.followers.set(data.followers);
          this.publicRepos.set(data.public_repos);
          this.isDataLoaded = true;
          this.initRemoteStatsAnimations();
        },
        error: (err) => {
          console.error("Error fetching Github info", err);
        },
      });

      this.gitApi.getCustomStats().subscribe({
        next: (data) => {
          if (!data.error) {
            this.githubStars.set(data.stars);
            this.githubCommits.set(data.commits);
            this.githubPRs.set(data.prs);
            this.githubIssues.set(data.issues);
            // Re-trigger animation logic if needed, or animate separately
            this.animateCustomStats();
          } else {
            console.error("Error in custom stats:", data.error);
          }
        },
        error: (err) => {
          console.error("Error fetching Custom Github stats", err);
        },
      });
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      this.initRemoteStatsAnimations();

      if (this.separator) {
        gsap.fromTo(
          this.separator.nativeElement,
          {
            yPercent: -30,
          },
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

      // Animate Years
      if (this.yearsCount) {
        const yearsObj = { val: 0 };
        // The target year is constant 2
        gsap.to(yearsObj, {
          val: 3,
          duration: 2,
          delay: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: this.yearsCount.nativeElement,
            start: "top 85%",
            once: true,
          },
          onUpdate: () => {
            this.yearsDisplay.set(Math.round(yearsObj.val));
          },
        });
      }
    }
  }

  private initRemoteStatsAnimations() {
    if (
      this.remoteStatsAnimated ||
      !this.isDataLoaded ||
      !this.followersCount ||
      !this.reposCount
    )
      return;

    this.remoteStatsAnimated = true;

    // Animate Followers
    const followersObj = { val: 0 };
    gsap.to(followersObj, {
      val: this.followers(),
      duration: 2,
      delay: 1.3,
      ease: "power2.out",
      scrollTrigger: {
        trigger: this.followersCount.nativeElement,
        start: "top 85%",
        once: true,
      },
      onUpdate: () => {
        this.followersDisplay.set(Math.round(followersObj.val));
      },
    });

    // Animate Repos
    const reposObj = { val: 0 };
    gsap.to(reposObj, {
      val: this.publicRepos(),
      duration: 2,
      delay: 1.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: this.reposCount.nativeElement,
        start: "top 85%",
        once: true,
      },
      onUpdate: () => {
        this.reposDisplay.set(Math.round(reposObj.val));
      },
    });
  }

  private animateCustomStats() {
    // Only animate if values are loaded
    const duration = 2.5;
    const ease = "power2.out";
    const delay = 0.5;

    // Stars
    if (this.githubStars() > 0) {
      const starsObj = { val: 0 };
      gsap.to(starsObj, {
        val: this.githubStars(),
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: "#custom-stats",
          start: "top 85%",
          once: true,
        },
        onUpdate: () => this.githubStarsDisplay.set(Math.round(starsObj.val)),
      });
    }

    // Commits
    if (this.githubCommits() > 0) {
      const commitsObj = { val: 0 };
      gsap.to(commitsObj, {
        val: this.githubCommits(),
        duration,
        delay: delay + 0.1,
        ease,
        scrollTrigger: {
          trigger: "#custom-stats",
          start: "top 85%",
          once: true,
        },
        onUpdate: () =>
          this.githubCommitsDisplay.set(Math.round(commitsObj.val)),
      });
    }

    // PRs
    if (this.githubPRs() > 0) {
      const prsObj = { val: 0 };
      gsap.to(prsObj, {
        val: this.githubPRs(),
        duration,
        delay: delay + 0.2,
        ease,
        scrollTrigger: {
          trigger: "#custom-stats",
          start: "top 85%",
          once: true,
        },
        onUpdate: () => this.githubPRsDisplay.set(Math.round(prsObj.val)),
      });
    }

    // Issues
    if (this.githubIssues() > 0) {
      const issuesObj = { val: 0 };
      gsap.to(issuesObj, {
        val: this.githubIssues(),
        duration,
        delay: delay + 0.3,
        ease,
        scrollTrigger: {
          trigger: "#custom-stats",
          start: "top 85%",
          once: true,
        },
        onUpdate: () => this.githubIssuesDisplay.set(Math.round(issuesObj.val)),
      });
    }
  }

  onExperienceHover() {
    if (this.experienceArrow && isPlatformBrowser(this.platform)) {
      if (this.arrowTween) this.arrowTween.kill();
      this.arrowTween = gsap.to(this.experienceArrow.nativeElement, {
        scale: 1.1,
        y: -15,
        opacity: 0.15,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }

  onExperienceLeave() {
    if (this.experienceArrow && isPlatformBrowser(this.platform)) {
      if (this.arrowTween) this.arrowTween.kill();
      this.arrowTween = gsap.to(this.experienceArrow.nativeElement, {
        scale: 1,
        y: 0,
        opacity: 0.05,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }
}
