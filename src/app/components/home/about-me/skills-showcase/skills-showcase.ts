import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideCloud,
  lucideCode,
  lucideDatabase,
  lucideLayout,
  lucideServer,
  lucideShield,
} from "@ng-icons/lucide";
import { SectionTitle } from "../../../../shared/components/section-title/section-title";
import { techCategoriesData, TechCategory } from "../data";

@Component({
  selector: "app-skills-showcase",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, SectionTitle],
  providers: [
    provideIcons({
      lucideLayout,
      lucideServer,
      lucideDatabase,
      lucideCloud,
      lucideShield,
      lucideCode,
    }),
  ],
  styles: [
    `
      @keyframes marquee-left {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
      @keyframes marquee-right {
        0% {
          transform: translateX(-50%);
        }
        100% {
          transform: translateX(0);
        }
      }
      .marquee-track-left {
        display: flex;
        width: max-content;
        animation: marquee-left 30s linear infinite;
      }
      .marquee-track-right {
        display: flex;
        width: max-content;
        animation: marquee-right 30s linear infinite;
      }
      .marquee-track-left:hover,
      .marquee-track-right:hover {
        animation-play-state: paused;
      }
      .skill-pill {
        transition:
          transform 0.25s ease,
          box-shadow 0.25s ease;
      }
      .skill-pill:hover {
        transform: translateY(-4px) scale(1.05);
      }
      .tab-btn.active {
        background: oklch(0.3 0.05 250 / 0.15);
      }
      :host-context(.dark) .tab-btn.active {
        background: oklch(0.7 0.1 250 / 0.12);
      }
    `,
  ],
  template: `
    <div class="w-full">
      <!-- Section header -->
      <div class="text-center mb-12">
        <app-section-title title="Technical Arsenal" />
        <h2
          class="text-3xl md:text-4xl font-thin tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Skills &amp; Technologies
        </h2>
        <p
          class="mt-4 text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto text-sm"
        >
          A curated set of tools and frameworks I use to build fast, scalable,
          and beautiful products.
        </p>
      </div>

      <!-- Category filter tabs -->
      <div class="flex flex-wrap justify-center gap-2 mb-10 px-4">
        <button
          [class]="
            'tab-btn flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ' +
            (activeCategory() === null
              ? 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 shadow-sm shadow-blue-500/10'
              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300')
          "
          (click)="setCategory(null)"
        >
          All
        </button>
        @for (cat of categories(); track cat.title) {
          <button
            [class]="
              'tab-btn flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ' +
              (activeCategory() === cat.title
                ? 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 shadow-sm shadow-blue-500/10'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300')
            "
            (click)="setCategory(cat.title)"
          >
            <ng-icon [name]="cat.categoryIcon" size="0.85rem" />
            {{ cat.title }}
          </button>
        }
      </div>

      <!-- Filtered grid view -->
      @if (activeCategory() !== null) {
        <div class="max-w-4xl mx-auto px-4">
          <div class="flex flex-wrap justify-center gap-3">
            @for (skill of filteredSkills(); track skill.name; let i = $index) {
              <div
                class="skill-pill group flex items-center gap-3 px-4 py-3 rounded-2xl
                       bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm
                       border border-zinc-200/80 dark:border-zinc-800/60
                       shadow-sm hover:shadow-lg hover:shadow-blue-500/10
                       hover:border-blue-400/40 dark:hover:border-blue-500/30
                       cursor-default"
                [style.animation-delay]="i * 0.04 + 's'"
              >
                <div
                  class="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform duration-300"
                >
                  <img
                    [src]="skill.icon"
                    [alt]="skill.name"
                    class="w-5 h-5 object-contain"
                  />
                </div>
                <span
                  class="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >{{ skill.name }}</span
                >
              </div>
            }
          </div>
        </div>
      }

      <!-- Marquee rows (shown when "All" selected) -->
      @if (activeCategory() === null) {
        <div class="w-full relative">
          <!-- Fade masks on left & right -->
          <div
            class="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-background to-transparent z-10 pointer-events-none"
          ></div>
          <div
            class="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-background to-transparent z-10 pointer-events-none"
          ></div>

          <div class="flex flex-col gap-2">
            @for (row of marqueeRows(); track $index) {
              <div class="overflow-x-hidden overflow-y-visible py-3">
                <div
                  [class]="
                    $index % 2 === 0
                      ? 'marquee-track-left'
                      : 'marquee-track-right'
                  "
                >
                  <!-- Doubled items for seamless loop -->
                  @for (skill of row; track skill.name + "_a_" + $index) {
                    <div
                      class="skill-pill flex items-center gap-3 mx-2 px-5 py-3 rounded-2xl
                           bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm
                           border border-zinc-200/70 dark:border-zinc-800/60
                           shadow-sm hover:shadow-lg hover:shadow-blue-500/10
                           hover:border-blue-400/40 dark:hover:border-blue-500/30
                           cursor-default shrink-0"
                    >
                      <div
                        class="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform duration-300"
                      >
                        <img
                          [src]="skill.icon"
                          [alt]="skill.name"
                          class="w-5 h-5 object-contain"
                        />
                      </div>
                      <span
                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                        >{{ skill.name }}</span
                      >
                    </div>
                  }
                  @for (skill of row; track skill.name + "_b_" + $index) {
                    <div
                      class="skill-pill flex items-center gap-3 mx-2 px-5 py-3 rounded-2xl
                           bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm
                           border border-zinc-200/70 dark:border-zinc-800/60
                           shadow-sm hover:shadow-lg hover:shadow-blue-500/10
                           hover:border-blue-400/40 dark:hover:border-blue-500/30
                           cursor-default shrink-0"
                    >
                      <div
                        class="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700"
                      >
                        <img
                          [src]="skill.icon"
                          [alt]="skill.name"
                          class="w-5 h-5 object-contain"
                        />
                      </div>
                      <span
                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                        >{{ skill.name }}</span
                      >
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SkillsShowcase {
  readonly categories = signal<TechCategory[]>(techCategoriesData);
  readonly activeCategory = signal<string | null>(null);

  readonly allSkills = computed(() =>
    this.categories().flatMap((c) => c.skills),
  );

  readonly totalSkills = computed(() => this.allSkills().length);

  readonly filteredSkills = computed(() => {
    const active = this.activeCategory();
    if (!active) return this.allSkills();
    return this.categories().find((c) => c.title === active)?.skills ?? [];
  });

  /** Split all skills into N rows for the marquee */
  readonly marqueeRows = computed(() => {
    const skills = this.allSkills();
    const rowCount = 3;
    const rows: (typeof skills)[] = [[], [], []];
    skills.forEach((s, i) => rows[i % rowCount].push(s));
    return rows;
  });

  setCategory(cat: string | null) {
    this.activeCategory.set(cat);
  }
}
