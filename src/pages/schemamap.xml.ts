import { createSchemaMap } from "@jdevalk/astro-seo-graph";
import { SITE_URL } from "@/lib/seoGraph";

export const GET = createSchemaMap({
  siteUrl: SITE_URL,
  entries: [
    { path: "/schema/post.json", lastModified: new Date() },
  ],
});
