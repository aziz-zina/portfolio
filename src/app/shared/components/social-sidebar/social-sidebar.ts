import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideGithub,
  lucideLinkedin,
  lucideMessageCircle,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-social-sidebar',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      lucideMessageCircle,
      lucideLinkedin,
      lucideGithub,
    }),
  ],
  template: `
    <div class="flex flex-col gap-6">
      <a
        href="https://wa.me/21693505147"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact me on WhatsApp"
        class="group p-2 -m-2 rounded-full text-gray-600 hover:text-black hover:scale-110 transition-all duration-300 ease-out"
      >
        <ng-icon
          name="lucideMessageCircle"
          size="1.25rem"
          class="transition-transform duration-300 group-hover:-translate-y-0.5"
        />
      </a>
      <a
        href="https://www.linkedin.com/in/aziz-zina/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Connect with me on LinkedIn"
        class="group p-2 -m-2 rounded-full text-gray-600 hover:text-black hover:scale-110 transition-all duration-300 ease-out"
      >
        <ng-icon
          name="lucideLinkedin"
          size="1.25rem"
          class="transition-transform duration-300 group-hover:-translate-y-0.5"
        />
      </a>
      <a
        href="https://github.com/aziz-zina"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View my GitHub profile"
        class="group p-2 -m-2 rounded-full text-gray-600 hover:text-black hover:scale-110 transition-all duration-300 ease-out"
      >
        <ng-icon
          name="lucideGithub"
          size="1.25rem"
          class="transition-transform duration-300 group-hover:-translate-y-0.5"
        />
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSidebar {}
