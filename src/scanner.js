import fs from "node:fs/promises";
import path from "node:path";
import { applyClassification, buildCategories, mergeTaxonomy } from "./classifier.js";
import { defaultPluginRoots, loadConfig, loadIgnorePatterns, resolveRoots } from "./config.js";
import { SCHEMA_VERSION } from "./defaults.js";
import { parseSkillMarkdown, normalizeSkillMetadata } from "./frontmatter.js";
import { safeRelative, shortHash, slugify, toPosixPath } from "./paths.js";
import { sanitizeExportArray, sanitizeExportId, sanitizeExportText, sanitizeSource } from "./privacy.js";

export async function scanAtlas(options = {}) {
  const cwd = options.cwd || process.cwd();
  const { config } = await loadConfig({ cwd, configPath: options.configPath });
  const taxonomy = mergeTaxonomy(config.taxonomy || []);
  const roots = resolveRoots({ cliRoots: options.roots || [], config, cwd });
  const includePlugins = Boolean(options.includePlugins ?? config.includePlugins);
  const ignorePatterns = await loadIgnorePatterns({ cwd, roots, config });

  const diagnostics = {
    metadataOnly: true,
    absolutePathsExported: false,
    roots: [],
    warnings: [],
    skipped: []
  };
  const capabilities = [];
  const rootEntries = roots.map((root) => ({ root, sourceType: "local", rootName: sanitizeExportText(path.basename(root) || "skills") }));

  if (includePlugins) {
    for (const root of defaultPluginRoots()) {
      rootEntries.push({ root, sourceType: "plugin", rootName: "plugin-cache" });
    }
  }

  for (const entry of rootEntries) {
    const rootResult = await scanRoot(entry, { ignorePatterns, diagnostics });
    capabilities.push(...rootResult.capabilities);
  }

  const packs = buildPacks(capabilities);
  const usingExplicitRoots = Boolean(options.roots?.length);
  if (!includePlugins && !usingExplicitRoots && config.pluginSummaryMode !== "off") {
    packs.push(...(await summarizePluginPacks(defaultPluginRoots(), diagnostics)));
  }

  addDuplicateNameWarnings(capabilities);

  const classified = capabilities.map((capability) => {
    const withCategory = applyClassification(capability, taxonomy, config.overrides || {});
    const { folderName, ...publicCapability } = withCategory;
    return {
      ...publicCapability,
      routeStatus: getRouteStatus(withCategory)
    };
  });

  const categories = buildCategories(taxonomy, classified);
  const warningCount =
    diagnostics.warnings.length + classified.reduce((total, capability) => total + capability.warnings.length, 0);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    counts: {
      capabilities: classified.length,
      categories: categories.length,
      packs: packs.length,
      warnings: warningCount,
      scannedRoots: diagnostics.roots.filter((root) => root.status === "scanned").length
    },
    categories,
    capabilities: classified.sort((a, b) => a.name.localeCompare(b.name)),
    packs: packs.sort((a, b) => a.name.localeCompare(b.name)),
    diagnostics
  };
}

async function scanRoot(entry, context) {
  const { root, sourceType, rootName } = entry;
  const diagnosticsRoot = {
    rootName,
    type: sourceType,
    status: "pending",
    skillFiles: 0
  };
  context.diagnostics.roots.push(diagnosticsRoot);

  try {
    const stat = await fs.stat(root);
    if (!stat.isDirectory()) {
      diagnosticsRoot.status = "not-directory";
      context.diagnostics.warnings.push(`Root is not a directory: ${rootName}`);
      return { capabilities: [] };
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      diagnosticsRoot.status = "missing";
      return { capabilities: [] };
    }
    throw error;
  }

  const skillFiles = [];
  await walk(root, "", skillFiles, context);
  diagnosticsRoot.status = "scanned";
  diagnosticsRoot.skillFiles = skillFiles.length;

  const capabilities = [];
  const seenIds = new Set();
  for (const skillFile of skillFiles) {
    const rel = safeRelative(root, skillFile);
    const exportRel = sanitizeExportText(rel);
    const folderName = path.basename(path.dirname(skillFile));
    const raw = await fs.readFile(skillFile, "utf8");
    const parsed = parseSkillMarkdown(raw);
    const metadata = normalizeSkillMetadata(parsed, folderName);
    const id = makeUniqueId(rootName, rel, metadata.name, seenIds);
    const kind = sourceType === "plugin" ? "plugin-skill" : rel.includes(".system/") ? "system-skill" : "skill";
    const capability = {
      id: sanitizeExportId(id, "skill"),
      name: sanitizeExportText(metadata.name),
      description: sanitizeExportText(metadata.description),
      kind,
      source: sanitizeSource({
        type: sourceType,
        rootName
      }),
      category: "uncategorized",
      relativePath: exportRel,
      tags: sanitizeExportArray(metadata.tags),
      routeStatus: "needs-review",
      warnings: metadata.warnings,
      folderName
    };
    capabilities.push(capability);
  }

  return { capabilities };
}

async function walk(root, rel, skillFiles, context) {
  const abs = path.join(root, rel);
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch (error) {
    context.diagnostics.warnings.push(`Unable to read ${toPosixPath(rel || ".")}: ${error.message}`);
    return;
  }

  for (const entry of entries) {
    const entryRel = rel ? path.join(rel, entry.name) : entry.name;
    const posixRel = toPosixPath(entryRel);
    if (shouldIgnore(posixRel, context.ignorePatterns)) {
      context.diagnostics.skipped.push(sanitizeExportText(posixRel));
      continue;
    }
    if (entry.isDirectory()) {
      await walk(root, entryRel, skillFiles, context);
    } else if (entry.isFile() && entry.name.toLowerCase() === "skill.md") {
      skillFiles.push(path.join(root, entryRel));
    }
  }
}

function shouldIgnore(relPath, patterns) {
  const lower = relPath.toLowerCase();
  const parts = lower.split("/");
  for (const pattern of patterns) {
    const raw = String(pattern || "").replace(/\\/g, "/").toLowerCase().replace(/^\/+/, "");
    if (!raw) continue;
    if (raw.includes("*")) {
      const regex = new RegExp(`^${escapeRegex(raw).replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")}$`);
      if (regex.test(lower)) return true;
      continue;
    }
    if (lower === raw || lower.startsWith(`${raw}/`) || parts.includes(raw)) return true;
  }
  return false;
}

function makeUniqueId(rootName, rel, name, seenIds) {
  const dirname = path.posix.dirname(toPosixPath(rel));
  const base = slugify(`${rootName}-${dirname === "." ? name : dirname}`, "skill");
  if (!seenIds.has(base)) {
    seenIds.add(base);
    return base;
  }
  const id = `${base}-${shortHash(rel)}`;
  seenIds.add(id);
  return id;
}

function addDuplicateNameWarnings(capabilities) {
  const byName = new Map();
  for (const capability of capabilities) {
    const key = capability.name.toLowerCase();
    byName.set(key, [...(byName.get(key) || []), capability]);
  }
  for (const group of byName.values()) {
    if (group.length <= 1) continue;
    for (const capability of group) {
      if (!capability.warnings.includes("duplicateName")) capability.warnings.push("duplicateName");
    }
  }
}

function getRouteStatus(capability) {
  if (capability.warnings.some((warning) => warning.startsWith("invalidFrontmatter") || warning === "missingFrontmatter")) {
    return "needs-metadata";
  }
  if (capability.warnings.includes("missingDescription") || capability.warnings.includes("missingName")) {
    return "needs-metadata";
  }
  if (capability.warnings.includes("duplicateName") || capability.category === "uncategorized") {
    return "manual-review";
  }
  return "ready";
}

function buildPacks(capabilities) {
  const byRoot = new Map();
  for (const capability of capabilities) {
    const key = `${capability.source.type}:${capability.source.rootName}`;
    const existing =
      byRoot.get(key) ||
      {
        id: slugify(key, "pack"),
        name: capability.source.rootName,
        kind: capability.source.type === "plugin" ? "plugin-pack" : "skill-root",
        source: capability.source,
        capabilityCount: 0,
        summaryOnly: false,
        warnings: []
      };
    existing.capabilityCount += 1;
    byRoot.set(key, existing);
  }
  return [...byRoot.values()];
}

async function summarizePluginPacks(pluginRoots, diagnostics) {
  const packs = [];
  for (const root of pluginRoots) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      const dirs = entries.filter((entry) => entry.isDirectory()).slice(0, 50);
      for (const dir of dirs) {
        packs.push({
          id: sanitizeExportId(`plugin-summary-${dir.name}`, "pack"),
          name: sanitizeExportText(dir.name),
          kind: "plugin-pack",
          source: {
            type: "plugin-summary",
            rootName: "plugin-cache"
          },
          capabilityCount: null,
          summaryOnly: true,
          warnings: ["summaryOnly"]
        });
      }
      diagnostics.warnings.push("Plugin cache summarized only; use --include-plugins for metadata scan.");
    } catch (error) {
      if (error.code !== "ENOENT") diagnostics.warnings.push(`Unable to summarize plugin cache: ${error.message}`);
    }
  }
  return packs;
}

function escapeRegex(input) {
  return input.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}
