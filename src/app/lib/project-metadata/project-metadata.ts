export type ProjectMetadata = {
  title: string;
  slug: string;
  type: string;
  description: string;
  coverImage: string;
  images: string[];
  techs: string[];
  website: string | null;
  github: string | null;
  highlights: string[];
  draft: boolean;
};
