/** Frontmatter shapes that can describe one or more hero / carousel slides. */
export type HeroSlideSource = {
  image?: string;
  images?: (string | { url?: string })[];
  /** @deprecated Prefer image2 — kept for older saves */
  image_2?: string;
  image_3?: string;
  image_4?: string;
  image2?: string;
  image3?: string;
  image4?: string;
};

function normalizeImageList(
  entries?: (string | { url?: string })[],
): string[] {
  if (!entries?.length) return [];

  return entries.flatMap((entry) => {
    if (typeof entry === "string") return entry ? [entry] : [];
    if (entry?.url) return [entry.url];
    return [];
  });
}

/** Build slide list — main image first, then extras (2+ slides → carousel). */
export function resolveHeroImages(source: HeroSlideSource = {}): string[] {
  const {
    image,
    images,
    image_2,
    image_3,
    image_4,
    image2,
    image3,
    image4,
  } = source;

  const combined = [
    image,
    image2 ?? image_2,
    image3 ?? image_3,
    image4 ?? image_4,
    ...normalizeImageList(images),
  ].filter((slide): slide is string => Boolean(slide));

  return [...new Set(combined)];
}
