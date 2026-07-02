import { getCollection } from "astro:content";
import { createMarkdownEndpoint } from "@jdevalk/astro-seo-graph";
import { SITE_URL } from "@/lib/seoGraph";

export async function getStaticPaths() {
  const posts = await getCollection(
    "posts",
    ({ id, data }) => !data.draft && !id.startsWith("-"),
  );
  return posts.map((p) => ({ params: { slug: p.id } }));
}

export const GET = createMarkdownEndpoint({
  entries: () =>
    getCollection("posts", ({ id, data }) => !data.draft && !id.startsWith("-")),
  mapper: (post, slug) =>
    post.id !== slug
      ? null
      : {
          frontmatter: {
            title: post.data.meta_title ?? post.data.title ?? post.id,
            canonical: `${SITE_URL}/posts/${post.id}`,
            pubDate: post.data.date,
            description: post.data.description,
            categories: post.data.categories,
          },
          body: post.body ?? "",
        },
});
