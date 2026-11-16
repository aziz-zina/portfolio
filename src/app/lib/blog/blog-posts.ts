import { injectContentFiles } from '@analogjs/content';
import { isDevMode } from '@angular/core';
import { ContentMetadata } from '../content-metadata/content-metadata';

/**
 * Blog posts only: markdown files directly under `src/content`, without the
 * project write-ups in `src/content/projects`. Drafts are listed in dev so
 * they can be previewed, and hidden in production. Newest first.
 */
export function injectBlogPosts() {
  return injectContentFiles<ContentMetadata>(
    (file) => !file.filename.includes('/projects/')
  )
    .filter((file) => isDevMode() || !file.attributes.draft)
    .sort(
      (a, b) =>
        new Date(b.attributes.date).getTime() -
        new Date(a.attributes.date).getTime()
    );
}
