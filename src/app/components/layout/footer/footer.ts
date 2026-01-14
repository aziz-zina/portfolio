import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

interface NavLink {
  label: string;
  url: string;
}

interface SocialLink {
  label: string;
  url: string;
}

@Component({
  selector: 'app-footer',
  imports: [HlmButtonImports],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly navLinks = signal<NavLink[]>([
    { label: 'Home', url: '#' },
    { label: 'About', url: '#about' },
    { label: 'Experience', url: '#experience' },
    { label: 'Projects', url: '#projects' },
    { label: 'Contact', url: '#contact' },
  ]);

  readonly socials = signal<SocialLink[]>([
    { label: 'GitHub', url: 'https://github.com/aziz-zina' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/aziz-zina/' },
    { label: 'Twitter', url: 'https://x.com/Spike_2002' },
  ]);

  readonly currentYear = signal(new Date().getFullYear());
}
