import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideExternalLink, lucideGithub } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';

export interface Project {
  name: string;
  type: string;
  image: string;
  description: string;
  techs: string[];
  website: string | null;
  highlights: string[];
}

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, HlmIconImports],
  providers: [
    provideIcons({
      lucideExternalLink,
      lucideGithub,
    }),
  ],
  templateUrl: './project-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  project = input.required<Project>();
}
