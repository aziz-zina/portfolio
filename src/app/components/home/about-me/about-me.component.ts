import { isPlatformBrowser } from '@angular/common';
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
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowUpRight,
  lucideDumbbell,
  lucideFolders,
  lucideTrendingUp,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GithubApiService } from '../../../lib/github/github-api.service';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';
import { LinkButton } from '../../../shared/components/link-button/link-button';

gsap.registerPlugin(ScrollTrigger);

interface TechStack {
  name: string;
  icon: string;
  title: string;
}

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
  selector: 'app-about-me',
  imports: [HlmCardImports, HlmIconImports, HlmButtonImports, ScrollAnimationDirective, LinkButton],
  providers: [
    provideIcons({
      lucideUsers,
      lucideFolders,
      lucideTrendingUp,
      lucideDumbbell,
      lucideArrowUpRight,
    }),
  ],
  templateUrl: './about-me.html',
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

  @ViewChild('separator') separator!: ElementRef<HTMLElement>;
  @ViewChild('experienceArrow') experienceArrow!: ElementRef<HTMLElement>;
  
  private arrowTween: gsap.core.Tween | null = null;

  readonly publicRepos = signal(0);
  readonly followers = signal(0);
  
  readonly bioTitle = "I'm Aziz – a Full Stack Developer crafting fast, scalable, and immersive digital experiences that merge creativity with engineering precision.";
  readonly bioDescription = "I specialize in developing SaaS platforms, AI-driven products, and interactive 3D web experiences using technologies like Next.js, Node.js, and Three.js.";

  get splitBioTitle() {
    return this.bioTitle.split(' ');
  }

  get splitBioDescription() {
    return this.bioDescription.split(' ');
  }

  readonly yearsExperience = signal(2);
  readonly usersServed = signal(1000);
  readonly projectsCompleted = signal(4);

  protected readonly techStack = signal<TechStack[]>([
    {
      name: 'TypeScript',
      icon: 'https://img.icons8.com/?size=48&id=uJM6fQYqDaZK&format=png',
      title: 'TypeScript - Typed JavaScript superset',
    },
    {
      name: 'Angular',
      icon: 'https://img.icons8.com/?size=48&id=6SWtW8hxZWSo&format=png',
      title: 'Angular - TypeScript-based web framework',
    },
    {
      name: 'React',
      icon: 'https://img.icons8.com/?size=100&id=asWSSTBrDlTW&format=png&color=000000',
      title: 'React - JavaScript library for building UIs',
    },
    {
      name: 'Tailwind CSS',
      icon: 'https://img.icons8.com/?size=48&id=CIAZz2CYc6Kc&format=png',
      title: 'Tailwind CSS - Utility-first CSS framework',
    },
    {
      name: 'Java',
      icon: 'https://img.icons8.com/?size=100&id=GPfHz0SM85FX&format=png&color=000000',
      title: 'Java - Programming language',
    },
    {
      name: 'Spring Boot',
      icon: 'https://img.icons8.com/?size=48&id=90519&format=png',
      title: 'Spring Boot - Java enterprise framework',
    },
    {
      name: 'Node.js',
      icon: 'https://img.icons8.com/?size=48&id=hsPbhkOH4FMe&format=png',
      title: 'Node.js - JavaScript runtime environment',
    },
    {
      name: 'Python',
      icon: 'https://img.icons8.com/?size=100&id=13441&format=png&color=000000',
      title: 'Python - Programming language',
    },
    {
      name: 'PostgreSQL',
      icon: 'https://img.icons8.com/?size=48&id=38561&format=png',
      title: 'PostgreSQL - Advanced relational database',
    },
    {
      name: 'MongoDB',
      icon: 'https://img.icons8.com/?size=48&id=8rKdRqZFLurS&format=png',
      title: 'MongoDB - NoSQL document database',
    },
    {
      name: 'Docker',
      icon: 'https://img.icons8.com/?size=48&id=cdYUlRaag9G9&format=png',
      title: 'Docker - Containerization platform',
    },
    {
      name: 'Git',
      icon: 'https://img.icons8.com/?size=48&id=20906&format=png',
      title: 'Git - Version control system',
    },
    {
      name: 'AWS',
      icon: 'https://img.icons8.com/?size=100&id=G0CnLqqcRBXl&format=png&color=000000',
      title: 'AWS - Amazon Web Services cloud platform',
    },
    {
      name: 'Apache Kafka',
      icon: 'https://img.icons8.com/?size=48&id=fOhLNqGJsUbJ&format=png',
      title: 'Apache Kafka - Distributed streaming platform',
    },
    {
      name: 'RabbitMQ',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg',
      title: 'RabbitMQ - Message broker',
    },
    {
      name: 'Prometheus',
      icon: 'https://img.icons8.com/?size=48&id=lOqoeP2Zy02f&format=png',
      title: 'Prometheus - Monitoring and alerting toolkit',
    },
    {
      name: 'Grafana',
      icon: 'https://img.icons8.com/?size=48&id=9uVrNMu3Zx1K&format=png',
      title: 'Grafana - Analytics and monitoring platform',
    },
    {
      name: 'Keycloak',
      icon: 'https://img.icons8.com/fluency/48/key-cloak.png',
      title: 'Keycloak - Identity and access management',
    },
    {
      name: 'IntelliJ IDEA',
      icon: 'https://img.icons8.com/?size=100&id=61466&format=png&color=000000',
      title: 'IntelliJ IDEA - Integrated development environment',
    },
    {
      name: 'VS Code',
      icon: 'https://img.icons8.com/?size=100&id=9OGIyU8hrxW5&format=png&color=000000',
      title: 'VS Code - Source-code editor',
    },
  ]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.gitApi.getInfo().subscribe((data: any) => {
        console.log('GitHub profile data:', data);
        this.followers.set(data.followers);
        this.publicRepos.set(data.public_repos);
      });
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
    if (this.separator) {
      gsap.fromTo(
        this.separator.nativeElement,
        {
          yPercent: -30,
        },
        {
          yPercent: -100,
          ease: 'none',
          scrollTrigger: {
            trigger: this.separator.nativeElement,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        }
      );
    }
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
        ease: 'power2.out',
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
        ease: 'power2.out',
      });
    }
  }
}
