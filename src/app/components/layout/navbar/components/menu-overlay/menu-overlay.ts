import { isPlatformBrowser } from '@angular/common';
import { 
  ChangeDetectionStrategy, 
  Component, 
  effect, 
  ElementRef, 
  inject, 
  input, 
  NgZone, 
  OnDestroy, 
  output, 
  PLATFORM_ID,
  signal,
  ViewChild 
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { gsap } from 'gsap';
import { RobotScene } from './robot-scene';

interface MenuItem {
  label: string;
  link: string;
}

@Component({
  selector: 'app-menu-overlay',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ lucideArrowUpRight })],
  templateUrl: './menu-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuOverlay implements OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  
  isOpen = input.required<boolean>();
  menuItems = input.required<MenuItem[]>();
  close = output<void>();

  isLoading = signal(true);

  @ViewChild('overlayContainer') overlayContainer!: ElementRef<HTMLElement>;
  @ViewChild('robotContainer') robotContainer!: ElementRef<HTMLDivElement>;

  private robotScene: RobotScene | null = null;
  private threeLoaded = false;

  constructor(public elementRef: ElementRef<HTMLElement>) {
    // Watch for menu open/close to init/dispose 3D scene
    effect(() => {
      const open = this.isOpen();
      if (isPlatformBrowser(this.platform)) {
        if (open) {
          this.isLoading.set(true);
          // Delay to ensure menu open animation completes (0.7s) before loading heavy 3D assets
          setTimeout(() => this.initRobotScene(), 1000);
        } else {
          this.disposeRobotScene();
        }
      }
    });
  }

  private async initRobotScene() {
    if (!this.robotContainer?.nativeElement || this.robotScene) return;

    try {
      // Dynamic import to avoid SSR issues
      const [THREE, { GLTFLoader }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js')
      ]);
      this.threeLoaded = true;
      
      this.robotScene = new RobotScene(
        this.robotContainer.nativeElement,
        this.ngZone,
        THREE,
        GLTFLoader,
        () => this.onRobotLoaded()
      );
    } catch (error) {
      console.error('Failed to initialize robot scene:', error);
    }
  }

  private onRobotLoaded() {
    this.isLoading.set(false);
  }

  private disposeRobotScene() {
    if (this.robotScene) {
      this.robotScene.dispose();
      this.robotScene = null;
    }
  }

  ngOnDestroy() {
    this.disposeRobotScene();
  }

  onMenuItemEnter(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const underline = target.querySelector('.menu-underline');
    if (underline) {
      gsap.to(underline, {
        scaleX: 1,
        duration: 0.4,
        ease: 'power3.out',
        transformOrigin: 'left center'
      });
    }
  }

  onMenuItemLeave(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const underline = target.querySelector('.menu-underline');
    if (underline) {
      gsap.to(underline, {
        scaleX: 0,
        duration: 0.3,
        ease: 'power3.in',
        transformOrigin: 'right center'
      });
    }
  }
}
