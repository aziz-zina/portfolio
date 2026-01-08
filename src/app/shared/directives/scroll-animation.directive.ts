import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Directive({
  selector: '[appScrollAnimation]',
  standalone: true
})
export class ScrollAnimationDirective implements AfterViewInit, OnDestroy {
  @Input('appScrollAnimation') animationType: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-in-right' | 'slide-in-left' | 'word-reveal' = 'fade-up';
  @Input() delay = 0;
  @Input() duration = 1;
  @Input() stagger = 0;

  private element = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private scrollTrigger: ScrollTrigger | undefined;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAnimation();
    }
  }

  ngOnDestroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }

  private initAnimation() {
    const el = this.element.nativeElement;
    
    let fromVars: any = {
      opacity: 0,
      duration: this.duration,
      delay: this.delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%', // Trigger when top of element hits 85% of viewport height
        toggleActions: 'play none none reverse', // Play on enter, reverse on leave back up
      }
    };

    let target: any = el;
    
    // If stagger is provided, target children instead of the element itself
    if (this.stagger > 0) {
      target = el.children;
      fromVars.stagger = this.stagger;
    }

    switch (this.animationType) {
      case 'fade-up':
        fromVars.y = 50;
        break;
      case 'fade-in':
        // Just opacity
        break;
      case 'scale-up':
        fromVars.scale = 0.8;
        break;
      case 'slide-in-right':
        fromVars.x = 100;
        break;
      case 'slide-in-left':
        fromVars.x = -100;
        break;
      case 'word-reveal':
        // Writing effect: words appear one by one
        fromVars.opacity = 0;
        fromVars.y = 0; // No movement, just appearance
        fromVars.scale = 1;
        fromVars.rotation = 0;
        fromVars.ease = "power1.out";
        
        // Fast duration for "typing" feel
        if (this.duration === 1) fromVars.duration = 0.3; 
        if (this.stagger === 0) fromVars.stagger = 0.05; 
        break;
    }

    gsap.from(target, fromVars);
  }
}
