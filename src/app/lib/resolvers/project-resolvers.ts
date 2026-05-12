import { injectContentFiles } from '@analogjs/content';
import { MetaTag } from '@analogjs/router';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { ProjectMetadata } from '../project-metadata/project-metadata';

const BASE_URL = 'https://azizzina.tn';
const DEFAULT_IMAGE = '/default-social.webp';

function injectActiveProjectMetadata(
  route: ActivatedRouteSnapshot
): ProjectMetadata {
  const slug = route.params['slug'];
  const file = injectContentFiles<ProjectMetadata>(
    (f) => f.filename.includes('/projects/')
  ).find((contentFile) => {
    return (
      contentFile.filename === `/src/content/projects/${slug}.md` ||
      contentFile.slug === slug
    );
  });

  return file!.attributes;
}

export const projectTitleResolver: ResolveFn<string> = (route) =>
  `${injectActiveProjectMetadata(route).title} — Aziz Zina`;

export const projectMetaResolver: ResolveFn<MetaTag[]> = (route) => {
  const meta = injectActiveProjectMetadata(route);

  const postUrl = `${BASE_URL}/projects/${meta.slug}`;
  const imageUrl = meta.coverImage
    ? `${BASE_URL}/${meta.coverImage}`
    : `${BASE_URL}${DEFAULT_IMAGE}`;

  return [
    { name: 'description', content: meta.description },
    { name: 'author', content: 'Aziz Zina' },

    // --- Open Graph ---
    { property: 'og:title', content: meta.title },
    { property: 'og:description', content: meta.description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: postUrl },
    { property: 'og:image', content: imageUrl },

    // --- Twitter / X ---
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: meta.title },
    { name: 'twitter:description', content: meta.description },
    { name: 'twitter:image', content: imageUrl },
  ];
};
