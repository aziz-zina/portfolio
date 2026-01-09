import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { gsap } from 'gsap';

@Component({
  selector: 'app-link-button',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideArrowUpRight })],
  template: `
    <a
      #linkBtn
      [href]="link()"
      class="cursor-pointer group inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out hover:scale-105"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      {{ title() }}
      <span
        #iconBg
        class="w-6 h-6 rounded-full flex items-center justify-center"
        style="background-color: #000000"
      >
        <ng-icon
          #iconRef
          name="lucideArrowUpRight"
          size="0.9rem"
          style="color: #ffffff"
        />
      </span>
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkButton implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('iconRef', { read: ElementRef }) iconRef!: ElementRef<HTMLElement>;
  @ViewChild('iconBg', { read: ElementRef }) iconBg!: ElementRef<HTMLElement>;

  link = input.required<string>();
  title = input.required<string>();

  ngAfterViewInit() {
  }

  onMouseEnter() {
    if (!isPlatformBrowser(this.platformId)) return;

    gsap.to(this.iconBg.nativeElement, {
      backgroundColor: '#ffffff',
      duration: 0.3,
      ease: 'power2.out',
    });

    gsap.to(this.iconRef.nativeElement, {
      color: '#000000',
      duration: 0.3,
      ease: 'power2.out',
    });
  }

  onMouseLeave() {
    if (!isPlatformBrowser(this.platformId)) return;

    gsap.to(this.iconBg.nativeElement, {
      backgroundColor: '#000000',
      duration: 0.3,
      ease: 'power2.inOut',
    });

    gsap.to(this.iconRef.nativeElement, {
      color: '#ffffff',
      duration: 0.3,
      ease: 'power2.inOut',
    });
  }
}
