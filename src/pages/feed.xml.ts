import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import config from "@/config/config.json";
import { render } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection(
    "posts",
    ({ id, data }) => !data.draft && !id.startsWith("-"),
  );

  const sortedPosts = posts.sort((a, b) => {
    const aDate = a.data.date ? new Date(a.data.date).getTime() : 0;
    const bDate = b.data.date ? new Date(b.data.date).getTime() : 0;
    return bDate - aDate;
  });

  const items = await Promise.all(
    sortedPosts.map(async (post) => {
      const { remarkPluginFrontmatter } = await render(post);
      const postUrl = new URL(`/posts/${post.id}`, context.site ?? config.site.base_url).toString();
      const imageUrl = post.data.image
        ? new URL(post.data.image, context.site ?? config.site.base_url).toString()
        : undefined;

      return {
        title: post.data.title ?? post.id,
        description: post.data.description ?? "",
        pubDate: post.data.date ?? new Date(),
        link: postUrl,
        ...(imageUrl && {
          customData: `<enclosure url="${imageUrl}" type="image/png" length="0"/>`,
        }),
      };
    })
  );

  return rss({
    title: config.site.title,
    description: config.metadata.meta_description,
    site: context.site ?? config.site.base_url,
    items,
    customData: `<language>en-us</language>`,
  });
}
