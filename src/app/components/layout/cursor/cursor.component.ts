import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID, NgZone, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-cursor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #cursor class="fixed top-0 left-0 w-4 h-4 bg-black dark:bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference opacity-0 transition-opacity duration-300"></div>
    <div #follower class="fixed top-0 left-0 w-12 h-12 border border-black dark:border-white rounded-full pointer-events-none z-[9998] opacity-0 transition-opacity duration-300"></div>
  `,
  styles: [`
    :host {
      display: block;
      pointer-events: none;
    }
  `]
})
export class CursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cursor') cursor!: ElementRef<HTMLDivElement>;
  @ViewChild('follower') follower!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private renderer = inject(Renderer2);
  
  private cursorX: any;
  private cursorY: any;
  private followerX: any;
  private followerY: any;
  
  private mouseMoveListener: (() => void) | null = null;
  private hoverListeners: (() => void)[] = [];

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initCursor();
    }
  }

  ngOnDestroy() {
    if (this.mouseMoveListener) {
      this.mouseMoveListener();
    }
    this.hoverListeners.forEach(unlisten => unlisten());
  }

  private initCursor() {
    const cursorEl = this.cursor.nativeElement;
    const followerEl = this.follower.nativeElement;

    // Center the elements initially
    gsap.set(cursorEl, { xPercent: -50, yPercent: -50 });
    gsap.set(followerEl, { xPercent: -50, yPercent: -50 });

    // Create quickTo setters for performance
    this.cursorX = gsap.quickTo(cursorEl, "x", { duration: 0.1, ease: "power3" });
    this.cursorY = gsap.quickTo(cursorEl, "y", { duration: 0.1, ease: "power3" });
    
    this.followerX = gsap.quickTo(followerEl, "x", { duration: 0.6, ease: "power3" });
    this.followerY = gsap.quickTo(followerEl, "y", { duration: 0.6, ease: "power3" });

    // Mouse Move Listener
    this.ngZone.runOutsideAngular(() => {
      this.mouseMoveListener = this.renderer.listen('window', 'mousemove', (e: MouseEvent) => {
        // Show cursor on first move
        if (cursorEl.style.opacity !== '1') {
            cursorEl.style.opacity = '1';
            followerEl.style.opacity = '1';
        }

        this.cursorX(e.clientX);
        this.cursorY(e.clientY);
        this.followerX(e.clientX);
        this.followerY(e.clientY);
      });
    });

    // Add hover effects to interactive elements
    this.addHoverEffects();
    
    // Re-run hover effects on DOM changes (simple observer)
    const observer = new MutationObserver(() => {
        this.addHoverEffects();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private addHoverEffects() {
    // Clean up old listeners for this batch (simplified, ideally we track per element)
    // For now, we'll just re-query. In a real app, we might want a directive.
    
    const targets = document.querySelectorAll('a, button, .interactive');
    
    targets.forEach(el => {
        // Check if already attached to avoid duplicates (simple check)
        if ((el as any)._hasCursorHover) return;
        (el as any)._hasCursorHover = true;

        const enter = this.renderer.listen(el, 'mouseenter', () => {
            gsap.to(this.cursor.nativeElement, { scale: 0, duration: 0.3 });
            gsap.to(this.follower.nativeElement, { scale: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', duration: 0.3 });
        });
        
        const leave = this.renderer.listen(el, 'mouseleave', () => {
            gsap.to(this.cursor.nativeElement, { scale: 1, duration: 0.3 });
            gsap.to(this.follower.nativeElement, { scale: 1, backgroundColor: 'transparent', duration: 0.3 });
        });
        
        this.hoverListeners.push(enter, leave);
    });
  }
}
