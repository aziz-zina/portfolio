import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { 
  lucideArrowRight, 
  lucideTerminal, 
  lucideGithub, 
  lucideLinkedin, 
  lucideCopy,
  lucideLayoutGrid,
  lucideServer,
  lucideDatabase,
  lucideLayers
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
      lucideTerminal, 
      lucideGithub, 
      lucideLinkedin,
      lucideCopy,
      lucideLayoutGrid,
      lucideServer,
      lucideDatabase,
      lucideLayers
    })
  ],
  host: {
    class: 'block bg-zinc-950 min-h-screen selection:bg-indigo-500/30 text-zinc-50',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {}