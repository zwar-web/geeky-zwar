import { getCollection } from "astro:content";
import { createSchemaEndpoint } from "@jdevalk/astro-seo-graph";
import { buildWebPage, buildArticle } from "@jdevalk/seo-graph-core";
import { SITE_URL, ids } from "@/lib/seoGraph";

export const GET = createSchemaEndpoint({
  entries: () =>
    getCollection("posts", ({ id, data }) => !data.draft && !id.startsWith("-")),
  mapper: (post) => {
    const url = `${SITE_URL}/posts/${post.id}`;
    const title = post.data.meta_title ?? post.data.title ?? post.id;
    const description = post.data.meta_description ?? post.data.description ?? "";
    const publishDate = post.data.date ?? new Date();

    return [
      buildWebPage(
        {
          url,
          name: title,
          isPartOf: { "@id": ids.website },
          breadcrumb: { "@id": ids.breadcrumb(url) },
          description,
        },
        ids,
      ),
      buildArticle(
        {
          url,
          headline: title,
          description,
          isPartOf: { "@id": ids.webPage(url) },
          author: { "@id": ids.person },
          publisher: { "@id": ids.person },
          datePublished: publishDate,
          ...(post.data.categories?.[0] && {
            articleSection: post.data.categories[0],
          }),
        },
        ids,
        "BlogPosting",
      ),
    ];
  },
});
