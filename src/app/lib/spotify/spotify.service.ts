import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';

export interface SpotifyNowPlaying {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly nowPlaying = signal<SpotifyNowPlaying>({ isPlaying: false });

  constructor() {
    // Only run in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      interval(30000)
        .pipe(
          startWith(0),
          switchMap(() => this.fetchNowPlaying()),
          catchError(() => of({ isPlaying: false }))
        )
        .subscribe((data) => this.nowPlaying.set(data));
    }
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