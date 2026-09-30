import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, catchError, map, merge, of, switchMap, timer } from 'rxjs';

export interface SpotifyNowPlaying {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
  /** Client clock when this was fetched, to advance progress locally between polls. */
  fetchedAt?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly nowPlaying = signal<SpotifyNowPlaying>({ isPlaying: false });

  private readonly refresh$ = new Subject<void>();

  constructor() {
    // Only run in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      // Poll every 30s; a manual refresh (e.g. the song just ended) restarts the clock
      merge(this.refresh$, of(undefined))
        .pipe(
          switchMap(() => timer(0, 30000)),
          switchMap(() => this.fetchNowPlaying()),
          map((data) => ({ ...data, fetchedAt: Date.now() })),
          catchError(() => of({ isPlaying: false }))
        )
        .subscribe((data) => this.nowPlaying.set(data));
    }
  }

  /** Fetch again now instead of waiting for the next poll. */
  refresh() {
    this.refresh$.next();
  }

  private fetchNowPlaying() {
    return this.http.get<SpotifyNowPlaying>('/api/spotify/now-playing').pipe(
      catchError((err) => {
        console.error('Spotify fetch error:', err);
        return of({ isPlaying: false });
      })
    );
  }
}