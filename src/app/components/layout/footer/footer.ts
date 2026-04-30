import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CursorService } from '../../../shared/services/cursor.service';

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
  private readonly cursorService = inject(CursorService);
  private readonly el = inject(ElementRef);

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
  ]);

  readonly currentYear = signal(new Date().getFullYear());

  onFooterEnter() {
    this.cursorService.setMenuOpen(true);
  }

  onFooterLeave() {
    this.cursorService.setMenuOpen(false);
  }

  onNavClick(event: MouseEvent, url: string) {
    if (url.startsWith('#')) {
      event.preventDefault();
      const targetId = url.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}
