import { isPlatformBrowser } from '@angular/common';
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
import { RouterLink } from '@angular/router';
import { LinkButton } from '../../../shared/components/link-button/link-button';
import { gsap } from 'gsap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, LinkButton],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  
  @ViewChild('menuOverlay') menuOverlay!: ElementRef<HTMLElement>;
  @ViewChild('menuContent') menuContent!: ElementRef<HTMLElement>;
  @ViewChild('hamburgerBtn') hamburgerBtn!: ElementRef<HTMLElement>;
  
  isScrolled = signal(false);
  isMenuOpen = signal(false);
  
  private scrollHandler: (() => void) | null = null;
  private menuTimeline: gsap.core.Timeline | null = null;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platform)) {
      this.scrollHandler = () => this.handleScroll();
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      this.handleScroll(); // Check initial scroll position
    }
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.menuTimeline) {
      this.menuTimeline.kill();
    }
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
    document.body.style.overflow = 'hidden';
    
    if (this.menuTimeline) this.menuTimeline.kill();
    
    // Get button position for the reveal origin
    const btn = this.hamburgerBtn.nativeElement;
    const rect = btn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    
    // Calculate the maximum distance to any corner to ensure full coverage
    const maxDistance = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY)
    );
    
    this.menuTimeline = gsap.timeline();
    
    // Set initial state
    gsap.set(this.menuOverlay.nativeElement, {
      visibility: 'visible',
      clipPath: `circle(0px at ${originX}px ${originY}px)`
    });
    
    // Animate overlay expanding from button
    this.menuTimeline.to(this.menuOverlay.nativeElement, {
      clipPath: `circle(${maxDistance}px at ${originX}px ${originY}px)`,
      duration: 0.7,
      ease: 'power3.inOut'
    });
    
    // Animate menu items with stagger
    this.menuTimeline.fromTo('.menu-item',
      { opacity: 0, y: 60, rotateX: -15 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
      '-=0.3'
    );
    
    // Animate right side content
    this.menuTimeline.fromTo('.menu-right-content',
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.5'
    );
    
    // Animate close button
    this.menuTimeline.fromTo('.menu-close-btn',
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' },
      '-=0.4'
    );
  }

  closeMenu() {
    if (this.menuTimeline) this.menuTimeline.kill();
    
    // Get button position for the reveal origin
    const btn = this.hamburgerBtn.nativeElement;
    const rect = btn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    
    const maxDistance = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY)
    );
    
    this.menuTimeline = gsap.timeline({
      onComplete: () => {
        this.isMenuOpen.set(false);
        document.body.style.overflow = '';
        gsap.set(this.menuOverlay.nativeElement, { visibility: 'hidden' });
      }
    });
    
    // Fade out content first
    this.menuTimeline.to('.menu-item', {
      opacity: 0,
      y: -20,
      duration: 0.25,
      stagger: 0.03,
      ease: 'power2.in'
    });
    
    this.menuTimeline.to('.menu-right-content', {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    }, '-=0.15');
    
    this.menuTimeline.to('.menu-close-btn', {
      opacity: 0,
      scale: 0,
      duration: 0.2,
      ease: 'power2.in'
    }, '-=0.15');
    
    // Animate overlay collapsing back to button
    this.menuTimeline.to(this.menuOverlay.nativeElement, {
      clipPath: `circle(0px at ${originX}px ${originY}px)`,
      duration: 0.5,
      ease: 'power3.inOut'
    }, '-=0.1');
  }

  readonly menuItems = [
    { label: 'Home', link: '/' },
    { label: 'About', link: '#about' },
    { label: 'Works', link: '#projects' },
    { label: 'Contact', link: '#contact' },
  ];
}
