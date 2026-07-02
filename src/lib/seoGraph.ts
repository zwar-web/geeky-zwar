/**
 * Shared JSON-LD graph helpers for geeky-zwar.
 *
 * Builds site-level entities (IDs, WebSite, Person) once and exports
 * helper functions for per-page pieces (WebPage, BlogPosting,
 * BreadcrumbList, ImageObject).
 */
import {
  makeIds,
  buildWebSite,
  buildWebPage,
  buildArticle,
  buildBreadcrumbList,
  buildImageObject,
  assembleGraph,
  type GraphEntity,
} from "@jdevalk/seo-graph-core";
import { breadcrumbsFromUrl } from "@jdevalk/astro-seo-graph";
import config from "@/config/config.json";

export const SITE_URL = config.site.base_url.replace(/\/$/, "");
export const SITE_NAME = config.site.title;

export const ids = makeIds({
  siteUrl: SITE_URL,
  personUrl: `${SITE_URL}/about/`,
});

export const siteWebsite = buildWebSite(
  {
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    publisher: { "@id": ids.person },
  },
  ids,
);

export const sitePerson = {
  "@type": "Person" as const,
  "@id": ids.person,
  name: config.metadata.meta_author,
  url: `${SITE_URL}/about/`,
  image: { "@id": ids.personImage },
};

/** Build the assembled JSON-LD graph for a generic (non-article) page. */
export function buildPageGraph(opts: {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  pageType?: "WebPage" | "ProfilePage" | "CollectionPage";
}) {
  const { url, title, description, imageUrl, pageType = "WebPage" } = opts;

  const pieces: GraphEntity[] = [siteWebsite as GraphEntity, sitePerson as unknown as GraphEntity];

  const breadcrumbItems = breadcrumbsFromUrl({
    url,
    siteUrl: SITE_URL,
    pageName: title,
  });
  const breadcrumb = buildBreadcrumbList({ url, items: breadcrumbItems }, ids);

  const imagePiece = imageUrl
    ? buildImageObject({ pageUrl: url, url: imageUrl, caption: title, width: 1200, height: 675 }, ids)
    : undefined;

  const page = buildWebPage(
    {
      url,
      name: title,
      isPartOf: { "@id": ids.website },
      breadcrumb: { "@id": ids.breadcrumb(url) },
      ...(description && { description }),
      ...(imagePiece && { primaryImage: { "@id": ids.primaryImage(url) } }),
    },
    ids,
    pageType,
  );

  pieces.push(breadcrumb as GraphEntity, page as GraphEntity);
  if (imagePiece) pieces.push(imagePiece as GraphEntity);

  return assembleGraph(pieces);
}

/** Build the assembled JSON-LD graph for a blog post. */
export function buildPostGraph(opts: {
  url: string;
  title: string;
  description: string;
  publishDate: Date;
  modifiedDate?: Date;
  categories?: string[];
  imageUrl?: string;
}) {
  const { url, title, description, publishDate, modifiedDate, categories, imageUrl } = opts;

  const pieces: GraphEntity[] = [siteWebsite as GraphEntity, sitePerson as unknown as GraphEntity];

  const breadcrumbItems = breadcrumbsFromUrl({
    url,
    siteUrl: SITE_URL,
    pageName: title,
    names: { posts: "Posts" },
  });
  const breadcrumb = buildBreadcrumbList({ url, items: breadcrumbItems }, ids);

  const imagePiece = imageUrl
    ? buildImageObject({ pageUrl: url, url: imageUrl, caption: title, width: 1200, height: 675 }, ids)
    : undefined;

  const page = buildWebPage(
    {
      url,
      name: title,
      isPartOf: { "@id": ids.website },
      breadcrumb: { "@id": ids.breadcrumb(url) },
      description,
      ...(imagePiece && { primaryImage: { "@id": ids.primaryImage(url) } }),
    },
    ids,
  );

  const article = buildArticle(
    {
      url,
      headline: title,
      description,
      isPartOf: { "@id": ids.webPage(url) },
      author: { "@id": ids.person },
      publisher: { "@id": ids.person },
      datePublished: publishDate,
      ...(modifiedDate && { dateModified: modifiedDate }),
      ...(categories?.[0] && { articleSection: categories[0] }),
      ...(imagePiece && { image: { "@id": ids.primaryImage(url) } }),
    },
    ids,
    "BlogPosting",
  );

  pieces.push(breadcrumb as GraphEntity, page as GraphEntity, article as GraphEntity);
  if (imagePiece) pieces.push(imagePiece as GraphEntity);

  return assembleGraph(pieces);
}
