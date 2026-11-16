import { ContentFile, injectContentFiles } from '@analogjs/content';
import { ContentMetadata } from '../content-metadata/content-metadata';

/**
 * Whether a post can be shown. Drafts are visible in `pnpm dev` and on Vercel
 * preview deployments, and hidden in production (see `__SHOW_DRAFTS__` in
 * `vite.config.ts`).
 */
export function isVisiblePost(file: ContentFile<ContentMetadata>): boolean {
  return __SHOW_DRAFTS__ || !file.attributes.draft;
}

/**
 * Blog posts only: markdown files directly under `src/content`, without the
 * project write-ups in `src/content/projects`. Newest first.
 */
export function injectBlogPosts() {
  return injectContentFiles<ContentMetadata>(
    (file) => !file.filename.includes('/projects/')
  )
    .filter(isVisiblePost)
    .sort(
      (a, b) =>
        new Date(b.attributes.date).getTime() -
        new Date(a.attributes.date).getTime()
    );
}
