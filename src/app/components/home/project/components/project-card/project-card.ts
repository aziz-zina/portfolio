import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowRight,
  lucideExternalLink,
  lucideGithub,
} from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCarouselImports } from "@spartan-ng/helm/carousel";
import { HlmIconImports } from "@spartan-ng/helm/icon";

export interface Project {
  name: string;
  slug?: string;
  type: string;
  image: string;
  images?: string[];
  description: string;
  techs: string[];
  website: string | null;
  highlights: string[];
  hasDetails: boolean;
}

@Component({
  selector: "app-project-card",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HlmButtonImports,
    HlmIconImports,
    HlmCarouselImports,
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideExternalLink,
      lucideGithub,
    }),
  ],
  templateUrl: "./project-card.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  project = input.required<Project>();

  isGithub = computed(
    () => this.project().website?.includes("github.com") ?? false,
  );

  allImages = computed(() => {
    const p = this.project();
    const extra = p.images ?? [];
    return extra.length > 0 ? [p.image, ...extra] : null;
  });
}
