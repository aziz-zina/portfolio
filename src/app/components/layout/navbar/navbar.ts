import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { gsap } from 'gsap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    HlmIconImports,
  ],
  templateUrl: './navbar.html',
  providers: [
    provideIcons({
      lucideArrowUpRight,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements AfterViewInit {
  @ViewChild('contactBtn') contactBtn!: ElementRef<HTMLButtonElement>;
  
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.contactBtn) {
      this.setupHoverAnimation();
    }
  }

  private setupHoverAnimation() {
    const btn = this.contactBtn.nativeElement;
    
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        backgroundColor: '#d4ff00',
        color: '#000000',
        scale: 1.05,
        boxShadow: '0 10px 40px rgba(212, 255, 0, 0.3)',
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        backgroundColor: '#000000',
        color: '#ffffff',
        scale: 1,
        boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
        duration: 0.3,
        ease: 'power2.inOut',
      });
    });
  }
}
