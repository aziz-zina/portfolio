import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { injectBlogPosts } from '../../../lib/blog/blog-posts';
import { SectionTitle } from '../../../shared/components/section-title/section-title';
import { FeaturedBlogPreview } from '../featured-blog-preview/featured-blog-preview';

@Component({
  selector: 'app-featured-blogs',
  imports: [FeaturedBlogPreview, SectionTitle, RouterLink, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative w-full bg-background z-10 py-24" id="blogs">
      <div class="max-w-7xl mx-auto px-6 pb-16 relative z-10">
        <app-section-title title="Blogs" />
      </div>

      <div class="max-w-7xl mx-auto px-6 relative z-10">
        @if (articles.length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (article of articles; track article.slug) {
              <app-featured-blog-preview [article]="article" />
            }
          </div>

          <div class="flex justify-center mt-16">
            <a hlmBtn variant="outline" routerLink="/blog"> View All Posts </a>
          </div>
        } @else {
          <p class="text-center font-mono text-sm text-muted-foreground">
            First post coming soon.
          </p>
        }
      </div>
    </section>
  `,
})
export class FeaturedBlogs {
  readonly articles = injectBlogPosts().slice(0, 3);
}
