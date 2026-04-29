import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { shareReplay } from 'rxjs';

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
      .get<{stars: number, commits: number, prs: number, issues: number, error?: string}>('/api/github/stats')
      .pipe(shareReplay(1));
  }
}
