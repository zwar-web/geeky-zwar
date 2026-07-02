import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "astro-auto-import";
import { defineConfig, fontProviders, sharpImageService } from "astro/config";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
import { gitLastmod } from "@jdevalk/astro-seo-graph";
import config from "./src/config/config.json";
import theme from "./src/config/theme.json";
import path from "node:path";

// Helper to parse font string format: "FontName:wght@400;500;600;700"
function parseFontString(fontStr) {
  const [name, weightPart] = fontStr.split(":");
  let weights = [400]; // default weight

  if (weightPart) {
    // Extract weights from wght@400;500;600 format
    const weightMatch = weightPart.match(/wght@?([\d;]+)/);
    if (weightMatch) {
      weights = weightMatch[1].split(";").map((w) => parseInt(w, 10));
    }
  }

  // remove + from font name and add space
  const cleanName = name.replace(/\+/g, " ");
  return { name: cleanName, weights };
}

// Build fonts configuration from theme.json
const fontsConfig = Object.entries(theme.fonts.font_family)
  .filter(([key]) => !key.includes("_type")) // Filter out type entries
  .map(([key, fontStr]) => {
    const { name, weights } = parseFontString(fontStr);
    const typeKey = `${key}_type`;
    const fallback = theme.fonts.font_family[typeKey] || "sans-serif";

    return {
      name,
      cssVariable: `--font-${key}`,
      provider: fontProviders.google(),
      weights,
      display: "swap",
      fallbacks: [fallback],
    };
  });

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "http://examplesite.com",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",

  image: { service: sharpImageService() },
  vite: { plugins: [tailwindcss()] },
  fonts: fontsConfig,
  integrations: [
    react(),
    sitemap({
      entryLimit: 1000,
      chunks: {
        posts: (item) => {
          if (/\/posts\/[^/]+/.test(new URL(item.url).pathname)) return item;
        },
        categories: (item) => {
          if (/\/categories\/[^/]+/.test(new URL(item.url).pathname)) return item;
        },
      },
      serialize: async (item) => {
        // Derive the content file path from the URL for git lastmod
        const urlPath = new URL(item.url).pathname.replace(/\/$/, "");
        const segments = urlPath.split("/").filter(Boolean);
        let filePath = null;

        if (segments[0] === "posts" && segments[1]) {
          filePath = path.join("src/content/posts", `${segments[1]}.md`);
        } else if (!segments.length) {
          filePath = "src/content/homepage/-index.md";
        }

        if (filePath) {
          const lastmod = gitLastmod(filePath);
          if (lastmod) return { ...item, lastmod: lastmod.toISOString() };
        }
        return item;
      },
    }),
    seoGraph({
      markdownAlternate: true,
      llmsTxt: {
        title: config.site.title,
        siteUrl: config.site.base_url,
        summary: config.metadata.meta_description,
      },
      validateMetadataLength: {
        title: { min: 10, max: 65 },
        description: { max: 200 },
      },
      validateInternalLinks: {
        skip: (href) =>
          href.startsWith("/api/") || href === "/search" || href.startsWith("/feed"),
      },
    }),
    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
});
