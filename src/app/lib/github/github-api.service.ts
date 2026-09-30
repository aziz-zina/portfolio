import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { shareReplay } from 'rxjs';

export interface ContributionDay {
  date: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  count: number;
  /** 0–4, GitHub's quartile buckets */
  level: number;
}

export interface GithubCustomStats {
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  contributions?: { total: number; weeks: ContributionDay[][] };
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GithubApiService {
  private readonly http = inject(HttpClient);

  getInfo() {
    return this.http
      .get('https://api.github.com/users/aziz-zina')
      .pipe(shareReplay(1));
  }

  getCustomStats() {
    return this.http
      .get<GithubCustomStats>('/api/github/stats')
      .pipe(shareReplay(1));
  }
}
