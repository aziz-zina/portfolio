import {
  ChangeDetectionStrategy,
  Component,
  signal,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideGithub,
  lucideLinkedin,
  lucideMail,
  lucideChevronDown,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [HlmButtonImports, HlmIconImports],
  templateUrl: './hero.html',
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideGithub,
      lucideLinkedin,
      lucideChevronDown,
      lucideMail,
    }),
  ],
  host: {
    class: 'block min-h-screen text-zinc-900 dark:text-zinc-50',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  private platformId = inject(PLATFORM_ID);
  isAtTop = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const handleScroll = () => {
          this.isAtTop.set(window.scrollY < 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
      });
    }
  }
}
