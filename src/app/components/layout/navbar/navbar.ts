import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';

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
export class Navbar {}
