#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const logEndpoint =
  "http://127.0.0.1:7632/ingest/bdfd55f9-3407-4cb7-9449-4c3f11b9cc2e";
const sessionId = "043891";
const runId = process.env.RUN_ID || "banner-fix";

function agentLog(hypothesisId, location, message, data, runId = "banner-fix") {
  const payload = {
    sessionId,
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch(logEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": sessionId,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
  console.log(JSON.stringify(payload));
}

const homepagePath = resolve(root, "src/content/homepage/-index.md");
const schemaPath = resolve(root, ".sitepins/schema/homepage.json");
const raw = readFileSync(homepagePath, "utf8");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const parts = raw.split(/^---\s*$/m);
const hasZwsp = /\u200b/.test(raw);
const fmText = parts[1] ?? "";
let fm;
let yamlError = null;
try {
  fm = yaml.load(fmText);
} catch (e) {
  yamlError = e.message;
  fm = null;
}

const schemaTop = schema.template.map((f) => f.name);
const fileTop = fm ? Object.keys(fm) : [];
const extraInFile = fileTop.filter((k) => !schemaTop.includes(k));
const missingInFile = schemaTop.filter((k) => !fileTop.includes(k));
const objectBadDefaults = schema.template
  .filter((f) => f.type === "Object" && f.defaultValue === "")
  .map((f) => f.name);

agentLog("A", "audit-sitepins-homepage.mjs:zwsp", "Zero-width char after frontmatter", {
  hasZwsp,
  tail: raw.slice(-8).split("").map((c) => c.charCodeAt(0)),
});

agentLog("B", "audit-sitepins-homepage.mjs:yaml", "YAML frontmatter parse", {
  yamlError,
  bannerTitle: fm?.banner?.title ?? null,
  metaTitle: fm?.meta_title ?? null,
  metaDescriptionLen: fm?.meta_description?.length ?? 0,
  contentUsesFoldedLines: /content:\s*"[^"]*\n\s+/m.test(fmText),
});

agentLog("C", "audit-sitepins-homepage.mjs:schema-size", "Schema vs file top-level keys", {
  schemaFieldCount: schemaTop.length,
  fileFieldCount: fileTop.length,
  schemaTop,
  fileTop,
  extraInFile,
  missingInFile,
});

agentLog("D", "audit-sitepins-homepage.mjs:object-defaults", "Object fields with empty-string defaultValue", {
  objectBadDefaults,
  count: objectBadDefaults.length,
});

const bannerSchema = schema.template.find((f) => f.name === "banner");
const bannerSchemaFields = bannerSchema?.template?.map((f) => f.name) ?? [];
const bannerFileKeys = fm?.banner ? Object.keys(fm.banner) : [];
const emptyMediaInBanner = ["image2", "image3", "image4"].filter(
  (k) => fm?.banner && k in fm.banner && fm.banner[k] === "",
);
const missingBannerSchemaFields = bannerSchemaFields.filter(
  (k) => !bannerFileKeys.includes(k),
);
const extraBannerFileFields = bannerFileKeys.filter(
  (k) => !bannerSchemaFields.includes(k),
);

agentLog(
  "F",
  "audit-sitepins-homepage.mjs:empty-media",
  "Empty-string media keys in banner frontmatter",
  {
    emptyMediaInBanner,
    image2Value: fm?.banner?.image2 ?? null,
    image3Value: fm?.banner?.image3 ?? null,
    image4Value: fm?.banner?.image4 ?? null,
  },
  runId,
);

agentLog(
  "G",
  "audit-sitepins-homepage.mjs:banner-schema-parity",
  "Banner schema fields vs file keys",
  {
    bannerSchemaFields,
    bannerFileKeys,
    missingBannerSchemaFields,
    extraBannerFileFields,
    matches7758e60Shape:
      extraBannerFileFields.length === 0 &&
      emptyMediaInBanner.length === 0 &&
      Boolean(fm?.banner?.title),
  },
  runId,
);

agentLog(
  "H",
  "audit-sitepins-homepage.mjs:seo-key",
  "SEO field key uses meta_description not legacy description",
  {
    hasMetaDescription: "meta_description" in (fm ?? {}),
    hasLegacyDescription: "description" in (fm ?? {}),
    schemaSeoField:
      schema.template.find((f) =>
        ["meta_description", "description"].includes(f.name),
      )?.name ?? null,
  },
  runId,
);

agentLog(
  "E",
  "audit-sitepins-homepage.mjs:banner-values",
  "Banner nested values present in file",
  {
    bannerKeys: fm?.banner ? Object.keys(fm.banner) : [],
    hasBannerTitle: Boolean(fm?.banner?.title),
    hasBannerImage: Boolean(fm?.banner?.image),
    buttonEnable: fm?.banner?.button?.enable ?? null,
  },
  runId,
);

if (yamlError || missingInFile.length || !fm?.banner?.title) {
  process.exitCode = 1;
}
