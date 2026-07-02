/** Normalize single `image` or optional `images` array into slide paths. */
export function resolveHeroImages(
  image?: string,
  images?: string[],
): string[] {
  if (images?.length) {
    return images.filter(Boolean);
  }
  if (image) {
    return [image];
  }
  return [];
}
