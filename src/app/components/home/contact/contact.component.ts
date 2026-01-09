import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCopy, lucideCheck, lucideMail, lucideArrowRight, lucideGithub, lucideLinkedin, lucideTwitter } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, HlmIconImports, ScrollAnimationDirective],
  providers: [
    provideIcons({
      lucideCopy,
      lucideCheck,
      lucideMail,
      lucideArrowRight,
      lucideGithub,
      lucideLinkedin,
      lucideTwitter
    }),
  ],
  templateUrl: './contact.html',
})
export class Contact {
  copied = false;
  email = 'aziz.zina2001@gmail.com';

  copyEmail() {
    navigator.clipboard.writeText(this.email);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }
}
