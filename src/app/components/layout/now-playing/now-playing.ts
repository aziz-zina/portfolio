import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { remixSpotifyFill, remixSpotifyLine } from '@ng-icons/remixicon';
import { SpotifyService } from '../../../lib/spotify/spotify.service';

/** 83000 → "1:23" */
function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Navbar pill for what's playing on Spotify: the cover spins like a record,
 * a thin line tracks the song's progress, and hovering (or tapping) opens a
 * card with the full details and a link to the track.
 */
@Component({
  selector: 'app-now-playing',
  imports: [NgOptimizedImage, NgIcon],
  providers: [
    provideIcons({ lucideArrowUpRight, remixSpotifyFill, remixSpotifyLine }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @keyframes equalizer {
        0% {
          transform: scaleY(0.25);
        }
        100% {
          transform: scaleY(1);
        }
      }

      .equalizer-bar {
        animation: equalizer ease-in-out infinite alternate;
      }

      @media (prefers-reduced-motion: reduce) {
        .equalizer-bar {
          animation: none;
          transform: scaleY(0.6);
        }
      }
    `,
  ],
  template: `
    @let np = nowPlaying();
    <div
      class="group/np relative"
      [attr.data-open]="open() ? '' : null"
      (focusout)="onFocusOut($event)"
      (keydown.escape)="open.set(false)"
    >
      @if (np.isPlaying) {
      <button
        type="button"
        class="relative flex h-11 cursor-pointer items-center gap-2.5 overflow-hidden rounded-full border border-border bg-background/70 pl-1.5 pr-3.5 backdrop-blur-md transition-colors duration-300 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        [attr.aria-label]="'Now playing on Spotify: ' + np.title + ' by ' + np.artist"
        [attr.aria-expanded]="open()"
        aria-controls="now-playing-card"
        (click)="toggle()"
      >
        <!-- Cover as a spinning record; pauses while you look at it -->
        <span
          class="relative size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/10 motion-safe:animate-[spin_8s_linear_infinite] group-hover/np:[animation-play-state:paused]"
        >
          @if (np.albumImageUrl) {
          <img
            [ngSrc]="np.albumImageUrl"
            alt=""
            width="32"
            height="32"
            class="size-full object-cover"
            priority
          />
          }
          <span
            class="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0_2px,rgb(0_0_0/0.12)_2px_3px)]"
            aria-hidden="true"
          ></span>
          <span
            class="absolute inset-0 m-auto size-2 rounded-full bg-background ring-1 ring-black/20"
            aria-hidden="true"
          ></span>
        </span>

        <span class="hidden min-w-0 max-w-36 flex-col gap-px pb-2.5 text-left leading-tight sm:flex">
          <span class="truncate text-xs font-semibold">{{ np.title }}</span>
          <span class="truncate text-[11px] text-muted-foreground">{{ np.artist }}</span>
        </span>

        <span class="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
          @for (bar of bars; track $index) {
          <span
            class="equalizer-bar h-full w-[3px] origin-bottom rounded-full bg-[#1DB954]"
            [style.animation-duration.s]="bar.duration"
            [style.animation-delay.s]="bar.delay"
          ></span>
          }
        </span>

        <!-- Song progress along the bottom edge -->
        <span
          class="absolute bottom-[3px] left-12 right-4 h-[2px] overflow-hidden rounded-full bg-foreground/10"
          aria-hidden="true"
        >
          <span
            class="block h-full origin-left bg-[#1DB954] transition-transform duration-1000 ease-linear"
            [style.transform]="'scaleX(' + progress() + ')'"
          ></span>
        </span>
      </button>

      <!-- Details card: hover on desktop, tap on touch. pt-3 keeps the hover bridge unbroken. -->
      <div
        id="now-playing-card"
        class="invisible absolute right-0 top-full z-50 w-72 origin-top-right translate-y-1 scale-[0.97] pt-3 opacity-0 transition-[opacity,translate,scale,visibility] duration-200 ease-out motion-reduce:transition-none group-hover/np:visible group-hover/np:translate-y-0 group-hover/np:scale-100 group-hover/np:opacity-100 group-data-[open]/np:visible group-data-[open]/np:translate-y-0 group-data-[open]/np:scale-100 group-data-[open]/np:opacity-100"
      >
        <div
          class="rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl shadow-black/10"
        >
          <p
            class="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
          >
            <ng-icon name="remixSpotifyFill" size="0.95rem" class="text-[#1DB954]" />
            Listening on Spotify
          </p>

          <div class="flex gap-3">
            @if (np.albumImageUrl) {
            <img
              [ngSrc]="np.albumImageUrl"
              [alt]="np.album + ' cover'"
              width="64"
              height="64"
              class="size-16 shrink-0 rounded-lg object-cover shadow-md ring-1 ring-black/5 dark:ring-white/10"
            />
            }
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <p class="truncate text-sm font-semibold" [title]="np.title">
                {{ np.title }}
              </p>
              <p class="truncate text-xs text-muted-foreground" [title]="np.artist">
                {{ np.artist }}
              </p>
              @if (np.album) {
              <p class="mt-0.5 truncate text-[11px] text-muted-foreground/70" [title]="np.album">
                {{ np.album }}
              </p>
              }
            </div>
          </div>

          @if (np.durationMs) {
          <div class="mt-4">
            <div class="h-1 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full origin-left rounded-full bg-[#1DB954] transition-transform duration-1000 ease-linear"
                [style.transform]="'scaleX(' + progress() + ')'"
              ></div>
            </div>
            <div
              class="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground"
            >
              <span>{{ elapsed() }}</span>
              <span>{{ total() }}</span>
            </div>
          </div>
          }

          <a
            [href]="np.songUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group/cta mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#1DB954] text-xs font-semibold text-black transition-[filter,scale] duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Listen on Spotify
            <ng-icon
              name="lucideArrowUpRight"
              size="0.85rem"
              class="transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
            />
          </a>
        </div>
      </div>
      } @else {
      <div
        class="flex h-11 items-center gap-2 rounded-full border border-border px-3.5 text-xs text-muted-foreground"
        title="Not listening to anything right now"
      >
        <ng-icon name="remixSpotifyLine" size="1rem" />
        <span class="hidden sm:inline">Not playing</span>
      </div>
      }
    </div>
  `,
})
export class NowPlaying {
  private readonly spotifyService = inject(SpotifyService);

  readonly nowPlaying = this.spotifyService.nowPlaying;
  readonly open = signal(false);

  /** Uneven speeds so the equaliser never looks like it's looping. */
  readonly bars = [
    { duration: 0.9, delay: 0 },
    { duration: 0.6, delay: 0.2 },
    { duration: 1.1, delay: 0.1 },
    { duration: 0.75, delay: 0.3 },
  ];

  /** Ticks every second while playing, so progress advances between polls. */
  private readonly now = signal(Date.now());
  private refreshedFor: number | undefined;

  private readonly positionMs = computed(() => {
    const np = this.nowPlaying();
    if (!np.isPlaying || !np.durationMs) return 0;
    const drift = this.now() - (np.fetchedAt ?? this.now());
    return Math.min(np.durationMs, (np.progressMs ?? 0) + Math.max(0, drift));
  });

  readonly progress = computed(() => {
    const duration = this.nowPlaying().durationMs;
    return duration ? this.positionMs() / duration : 0;
  });
  readonly elapsed = computed(() => clock(this.positionMs()));
  readonly total = computed(() => clock(this.nowPlaying().durationMs ?? 0));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const id = setInterval(() => {
        const np = this.nowPlaying();
        if (!np.isPlaying) return;
        this.now.set(Date.now());
        // Song just ended: fetch the next one now rather than on the next poll
        if (np.durationMs && this.progress() >= 1 && this.refreshedFor !== np.fetchedAt) {
          this.refreshedFor = np.fetchedAt;
          this.spotifyService.refresh();
        }
      }, 1000);
      destroyRef.onDestroy(() => clearInterval(id));
    });
  }

  toggle() {
    this.open.update((v) => !v);
  }

  /** Close the tapped-open card once focus leaves the widget. */
  onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) {
      this.open.set(false);
    }
  }
}
