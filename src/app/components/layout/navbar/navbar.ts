import { isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { bind } from "cuelume";
import { gsap } from "gsap";
import { LinkButton } from "../../../shared/components/link-button/link-button";
import { CursorService } from "../../../shared/services/cursor.service";
import { NowPlaying } from "../now-playing/now-playing";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { HamburgerButton } from "./components/hamburger-button/hamburger-button";
import { MenuOverlay } from "./components/menu-overlay/menu-overlay";

const LOGO_NAME = "Aziz";
const GLYPHS = "01{}[]<>/#$%&*+=?;_";
const DECODE_MS = 420;

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [
    RouterLink,
    LinkButton,
    HamburgerButton,
    MenuOverlay,
    NowPlaying,
    ThemeToggle,
  ],
  templateUrl: "./navbar.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  private readonly cursorService = inject(CursorService);

  @ViewChild("menuOverlay") menuOverlay!: MenuOverlay;
  @ViewChild("hamburgerBtn") hamburgerBtn!: HamburgerButton;

  /** The name in the `<Aziz />` wordmark; briefly scrambled while it "decodes" on hover. */
  readonly logoName = signal(LOGO_NAME);
  private decodeFrame = 0;

  isScrolled = signal(false);
  isMenuOpen = signal(false);

  private scrollHandler: (() => void) | null = null;
  private menuTimeline: gsap.core.Timeline | null = null;

  ngOnInit() {
    bind();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      this.scrollHandler = () => this.handleScroll();
      window.addEventListener("scroll", this.scrollHandler, { passive: true });
      this.handleScroll();
    }
  }

  ngOnDestroy() {
    if (this.decodeFrame) cancelAnimationFrame(this.decodeFrame);
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
    if (this.menuTimeline) {
      this.menuTimeline.kill();
    }
  }

  /**
   * Letters flicker through code glyphs and lock in left to right, like a
   * terminal resolving a string. Runs once per hover; skipped with reduced motion.
   */
  decodeLogo() {
    if (!isPlatformBrowser(this.platform) || this.decodeFrame) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DECODE_MS);
      const locked = Math.floor(progress * (LOGO_NAME.length + 1));
      this.logoName.set(
        [...LOGO_NAME]
          .map((char, i) =>
            i < locked ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
      if (progress < 1) {
        this.decodeFrame = requestAnimationFrame(tick);
      } else {
        this.logoName.set(LOGO_NAME);
        this.decodeFrame = 0;
      }
    };
    this.decodeFrame = requestAnimationFrame(tick);
  }

  private handleScroll() {
    const scrollY = window.scrollY;
    this.isScrolled.set(scrollY > 100);
  }

  toggleMenu() {
    if (this.isMenuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isMenuOpen.set(true);
    this.cursorService.setMenuOpen(true);
    document.body.style.overflow = "hidden";

    if (this.menuTimeline) this.menuTimeline.kill();

    const btn = this.hamburgerBtn.buttonElement.nativeElement;
    const rect = btn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const maxDistance = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
    );

    this.menuTimeline = gsap.timeline();

    gsap.set(this.menuOverlay.overlayContainer.nativeElement, {
      visibility: "visible",
      clipPath: `circle(0px at ${originX}px ${originY}px)`,
    });

    this.menuTimeline.to(this.menuOverlay.overlayContainer.nativeElement, {
      clipPath: `circle(${maxDistance}px at ${originX}px ${originY}px)`,
      duration: 0.7,
      ease: "power3.inOut",
    });

    this.menuTimeline.fromTo(
      ".menu-item",
      { opacity: 0, y: 60, rotateX: -15 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      },
      "-=0.3",
    );

    this.menuTimeline.fromTo(
      ".menu-right-content",
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
      "-=0.5",
    );

    this.menuTimeline.fromTo(
      ".menu-close-btn",
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
      "-=0.4",
    );
  }

  closeMenu() {
    if (this.menuTimeline) this.menuTimeline.kill();

    const btn = this.hamburgerBtn.buttonElement.nativeElement;
    const rect = btn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const maxDistance = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
    );

    this.menuTimeline = gsap.timeline({
      onComplete: () => {
        this.isMenuOpen.set(false);
        this.cursorService.setMenuOpen(false);
        document.body.style.overflow = "";
        gsap.set(this.menuOverlay.overlayContainer.nativeElement, {
          visibility: "hidden",
        });
      },
    });

    this.menuTimeline.to(".menu-item", {
      opacity: 0,
      y: -20,
      duration: 0.25,
      stagger: 0.03,
      ease: "power2.in",
    });

    this.menuTimeline.to(
      ".menu-right-content",
      {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      },
      "-=0.15",
    );

    this.menuTimeline.to(
      ".menu-close-btn",
      {
        opacity: 0,
        scale: 0,
        duration: 0.2,
        ease: "power2.in",
      },
      "-=0.15",
    );

    this.menuTimeline.to(
      this.menuOverlay.overlayContainer.nativeElement,
      {
        clipPath: `circle(0px at ${originX}px ${originY}px)`,
        duration: 0.5,
        ease: "power3.inOut",
      },
      "-=0.1",
    );
  }

  readonly menuItems = [
    { label: "Home", link: "/" },
    { label: "About", link: "#about" },
    { label: "Experience", link: "#experience" },
    { label: "Projects", link: "#projects" },
    { label: "Contact Me", link: "#contact" },
  ];

  scrollToSection(event: MouseEvent, sectionId: string) {
    event.preventDefault();
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
