import {
  injectContent,
  injectContentFiles,
  MarkdownComponent,
} from "@analogjs/content";
import { RouteMeta } from "@analogjs/router";
import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router, RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowLeft,
  lucideChevronRight,
  lucideExternalLink,
  lucideGithub,
} from "@ng-icons/lucide";
import { HlmBadgeImports } from "@spartan-ng/helm/badge";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCarouselImports } from "@spartan-ng/helm/carousel";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton";
import { ReadingProgress } from "../../components/reading-progress/reading-progress";
import { ProjectMetadata } from "../../lib/project-metadata/project-metadata";
import {
  projectMetaResolver,
  projectTitleResolver,
} from "../../lib/resolvers/project-resolvers";
import { parseToc } from "../../util/toc.util";

export const routeMeta: RouteMeta = {
  title: projectTitleResolver,
  meta: projectMetaResolver,
  canActivate: [
    (route) => {
      const router = inject(Router);
      const slug = route.params["slug"];
      const fileExists = injectContentFiles<ProjectMetadata>((f) =>
        f.filename.includes("/projects/"),
      ).some(
        (contentFile) =>
          contentFile.slug === slug ||
          contentFile.filename.endsWith(`/${slug}.md`),
      );
      return fileExists || router.createUrlTree(["/not-found"]);
    },
  ],
};

@Component({
  imports: [
    RouterLink,
    ReadingProgress,
    MarkdownComponent,
    HlmButtonImports,
    HlmIconImports,
    HlmBadgeImports,
    HlmSkeletonImports,
    HlmCarouselImports,
  ],
  host: {
    class: "block",
  },
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideExternalLink,
      lucideGithub,
      lucideChevronRight,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-reading-progress />

    <!-- Hero Banner -->
    <div class="relative w-full bg-background dark:bg-black overflow-hidden">
      <!-- Ambient glow -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"
      ></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <!-- Breadcrumb -->
        <nav
          class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-8"
        >
          <a routerLink="/" class="hover:text-blue-400 transition-colors"
            >Home</a
          >
          <ng-icon hlm name="lucideChevronRight" size="xs" />
          <a
            routerLink="/projects"
            class="hover:text-blue-400 transition-colors"
            >Projects</a
          >
          @if (project(); as p) {
            <ng-icon hlm name="lucideChevronRight" size="xs" />
            <span class="text-zinc-900 dark:text-zinc-100 font-medium">{{
              p.attributes.title
            }}</span>
          }
        </nav>

        @if (project(); as p) {
          <!-- Project header -->
          <div class="mb-10">
            <span
              class="inline-block text-xs font-mono font-semibold tracking-widest uppercase text-blue-400 mb-4 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10"
            >
              {{ p.attributes.type }}
            </span>
            <h1
              class="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-6"
            >
              {{ p.attributes.title }}
            </h1>
            <p
              class="text-lg text-zinc-500 dark:text-zinc-400 w-full leading-relaxed"
            >
              {{ p.attributes.description }}
            </p>

            <!-- Tech badges -->
            <div class="flex flex-wrap gap-2 mt-6">
              @for (tech of p.attributes.techs; track tech) {
                <span hlmBadge variant="outline" class="text-xs font-medium">{{
                  tech
                }}</span>
              }
            </div>

            <!-- Action links -->
            <div class="flex flex-wrap items-center gap-3 mt-8">
              @if (p.attributes.website) {
                <a
                  [href]="p.attributes.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  hlmBtn
                  class="gap-2 rounded-full"
                >
                  <ng-icon hlm name="lucideExternalLink" size="sm" />
                  Live Demo
                </a>
              }
              @if (p.attributes.github) {
                <a
                  [href]="p.attributes.github"
                  target="_blank"
                  rel="noopener noreferrer"
                  hlmBtn
                  variant="outline"
                  class="gap-2 rounded-full"
                >
                  <ng-icon hlm name="lucideGithub" size="sm" />
                  Source Code
                </a>
              }
              <a
                hlmBtn
                variant="ghost"
                routerLink="/projects"
                class="gap-2 rounded-full ml-auto"
              >
                <ng-icon hlm name="lucideArrowLeft" size="sm" />
                All Projects
              </a>
            </div>
          </div>

          <!-- Cover image — Mac-style browser frame -->
          @if (p.attributes.coverImage) {
            <div
              class="w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-[#1e1e1e] mb-4"
            >
              <!-- Mac window chrome -->
              <div
                class="h-9 bg-[#2a2a2a] border-b border-zinc-800 flex items-center px-4 gap-1.5 relative"
              >
                <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                <div
                  class="absolute inset-0 flex items-center justify-center text-xs font-mono text-zinc-400 pointer-events-none"
                >
                  {{ p.attributes.website ?? p.attributes.title }}
                </div>
              </div>
              @if (p.attributes.images.length > 0) {
                <!-- Carousel when extra images are present -->
                <hlm-carousel class="w-full">
                  <hlm-carousel-content>
                    @for (
                      img of [p.attributes.coverImage, ...p.attributes.images];
                      track $index
                    ) {
                      <div hlmCarouselItem>
                        <img
                          class="w-full"
                          [src]="img"
                          [alt]="
                            p.attributes.title + ' screenshot ' + ($index + 1)
                          "
                          loading="eager"
                        />
                      </div>
                    }
                  </hlm-carousel-content>
                  <button hlm-carousel-previous class="-left-4"></button>
                  <button hlm-carousel-next class="-right-4"></button>
                  <hlm-carousel-slide-display
                    class="absolute bottom-3 right-4"
                  />
                </hlm-carousel>
              } @else {
                <!-- Single cover image -->
                <img
                  class="w-full"
                  [src]="p.attributes.coverImage"
                  [alt]="p.attributes.title"
                  width="1200"
                  height="700"
                  loading="eager"
                />
              }
            </div>
          }
        } @else {
          <!-- Loading skeleton for header -->
          <div class="flex flex-col gap-5 mb-10">
            <hlm-skeleton class="h-5 w-24 rounded-full" />
            <hlm-skeleton class="h-14 w-3/4" />
            <hlm-skeleton class="h-6 w-1/2" />
            <div class="flex gap-2 mt-2">
              <hlm-skeleton class="h-7 w-20 rounded-full" />
              <hlm-skeleton class="h-7 w-20 rounded-full" />
              <hlm-skeleton class="h-7 w-20 rounded-full" />
            </div>
          </div>
          <hlm-skeleton class="w-full h-[420px] rounded-2xl" />
        }
      </div>
    </div>

    <!-- Main content + sidebar -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      @if (project(); as p) {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <!-- Article body -->
          <article class="lg:col-span-8 xl:col-span-9 m-0">
            <analog-markdown
              class="prose prose-lg dark:prose-invert max-w-none
                     prose-headings:font-bold
                     prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-zinc-200 prose-h2:dark:border-zinc-800
                     prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                     prose-p:text-zinc-600 prose-p:dark:text-zinc-400 prose-p:leading-relaxed
                     prose-li:text-zinc-600 prose-li:dark:text-zinc-400
                     prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
                     prose-code:text-blue-400 prose-code:bg-zinc-100 prose-code:dark:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                     prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl
                     prose-blockquote:border-blue-500 prose-blockquote:text-zinc-500
                     prose-table:border-collapse prose-th:bg-zinc-100 prose-th:dark:bg-zinc-900
                     prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-zinc-200 prose-img:dark:border-zinc-800"
              [content]="p.content"
            />
          </article>

          <!-- Sticky sidebar -->
          <aside class="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div class="sticky top-24 flex flex-col gap-6">
              <!-- Project highlights -->
              @if (p.attributes.highlights?.length) {
                <div
                  class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5"
                >
                  <h3
                    class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-widest"
                  >
                    Highlights
                  </h3>
                  <ul class="space-y-3">
                    @for (
                      highlight of p.attributes.highlights;
                      track highlight
                    ) {
                      <li
                        class="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <span
                          class="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"
                        ></span>
                        {{ highlight }}
                      </li>
                    }
                  </ul>
                </div>
              }

              <!-- Table of contents -->
              @if (toc().length > 0) {
                <div
                  class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
                >
                  <h3
                    class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-widest"
                  >
                    On this page
                  </h3>
                  <nav class="flex flex-col gap-2">
                    @for (item of toc(); track item.id) {
                      <a
                        (click)="scrollTo(item.id); $event.preventDefault()"
                        [href]="'#' + item.id"
                        class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-blue-400 transition-colors leading-relaxed"
                        [class.pl-3]="item.level === 3"
                        [class.font-semibold]="item.level === 2"
                        [class.text-zinc-700]="item.level === 2"
                        [class.dark:text-zinc-300]="item.level === 2"
                      >
                        {{ item.text }}
                      </a>
                    }
                  </nav>
                </div>
              }

              <!-- Tech stack -->
              @if (p.attributes.techs?.length) {
                <div
                  class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
                >
                  <h3
                    class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-widest"
                  >
                    Tech Stack
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    @for (tech of p.attributes.techs; track tech) {
                      <span hlmBadge variant="secondary" class="text-xs">{{
                        tech
                      }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Links -->
              <div class="flex flex-col gap-3">
                @if (p.attributes.website) {
                  <a
                    [href]="p.attributes.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    hlmBtn
                    class="w-full gap-2 justify-center"
                  >
                    <ng-icon hlm name="lucideExternalLink" size="sm" />
                    Live Demo
                  </a>
                }
                @if (p.attributes.github) {
                  <a
                    [href]="p.attributes.github"
                    target="_blank"
                    rel="noopener noreferrer"
                    hlmBtn
                    variant="outline"
                    class="w-full gap-2 justify-center"
                  >
                    <ng-icon hlm name="lucideGithub" size="sm" />
                    Source Code
                  </a>
                }
              </div>
            </div>
          </aside>
        </div>

        <!-- Bottom navigation -->
        <div class="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <a
            hlmBtn
            variant="outline"
            routerLink="/projects"
            class="gap-2 rounded-full"
          >
            <ng-icon hlm name="lucideArrowLeft" size="sm" />
            Back to All Projects
          </a>
        </div>
      } @else {
        <!-- Loading skeleton for content -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div class="lg:col-span-9 flex flex-col gap-6">
            <hlm-skeleton class="h-8 w-1/3" />
            <hlm-skeleton class="h-4 w-full" />
            <hlm-skeleton class="h-4 w-5/6" />
            <hlm-skeleton class="h-4 w-4/5" />
            <hlm-skeleton class="h-8 w-1/4 mt-4" />
            <hlm-skeleton class="h-4 w-full" />
            <hlm-skeleton class="h-4 w-3/4" />
          </div>
        </div>
      }
    </div>
  `,
})
export default class ProjectDetailPage {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly project = toSignal(
    injectContent<ProjectMetadata>({
      param: "slug",
      subdirectory: "projects",
    }),
  );

  readonly toc = computed(() => {
    const p = this.project();
    return p ? parseToc(p.content) : [];
  });

  scrollTo(id: string) {
    if (isPlatformBrowser(this.platformId)) {
      const element = this.document.getElementById(id);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }
  }
}
