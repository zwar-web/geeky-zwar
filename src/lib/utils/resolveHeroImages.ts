/** Frontmatter shapes that can describe one or more hero / carousel slides. */
export type HeroSlideSource = {
  image?: string;
  images?: string[];
  image_2?: string;
  image_3?: string;
  image_4?: string;
};

/** Build slide list from Sitepins media fields and/or a legacy images array. */
export function resolveHeroImages(source: HeroSlideSource = {}): string[] {
  const { image, images, image_2, image_3, image_4 } = source;

  if (images?.length) {
    return images.filter(Boolean);
  }

  const slides = [image, image_2, image_3, image_4].filter(
    (slide): slide is string => Boolean(slide),
  );

  return slides;
}
