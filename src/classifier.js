import { DEFAULT_TAXONOMY, UNCATEGORIZED } from "./defaults.js";
import { slugify } from "./paths.js";

export function mergeTaxonomy(customTaxonomy = []) {
  const defaultsById = new Map(DEFAULT_TAXONOMY.map((category) => [category.id, { ...category }]));
  const custom = [];
  for (const category of customTaxonomy || []) {
    if (!category || !category.id) continue;
    const existing = defaultsById.get(category.id) || {};
    custom.push({
      ...existing,
      ...category,
      keywords: Array.isArray(category.keywords) ? category.keywords : existing.keywords || [],
      priority: 1000
    });
  }
  const customIds = new Set(custom.map((category) => category.id));
  const remainingDefaults = DEFAULT_TAXONOMY.filter((category) => !customIds.has(category.id));
  return [...custom, ...remainingDefaults];
}

export function applyClassification(capability, taxonomy, overrides = {}) {
  const override = findOverride(capability, overrides);
  const tags = uniqueTags([...(capability.tags || []), ...normalizeOverrideTags(override)]);
  const category = override?.category || classify(capability, taxonomy);
  return {
    ...capability,
    tags,
    category
  };
}

export function buildCategories(taxonomy, capabilities) {
  const counts = new Map();
  for (const capability of capabilities) {
    counts.set(capability.category, (counts.get(capability.category) || 0) + 1);
  }
  return [...taxonomy, UNCATEGORIZED].map((category) => ({
    id: category.id,
    label: category.label,
    description: category.description,
    keywords: category.keywords || [],
    count: counts.get(category.id) || 0
  }));
}

function classify(capability, taxonomy) {
  const text = [
    capability.name,
    capability.description,
    capability.relativePath,
    ...(capability.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  let best = { id: UNCATEGORIZED.id, score: 0 };
  for (const category of taxonomy) {
    let score = 0;
    for (const keyword of category.keywords || []) {
      if (text.includes(String(keyword).toLowerCase())) score += 1;
    }
    if (score > 0) score += category.priority || 0;
    if (score > best.score) best = { id: category.id, score };
  }
  return best.score > 0 ? best.id : UNCATEGORIZED.id;
}

function findOverride(capability, overrides) {
  for (const [rawKey, value] of Object.entries(overrides || {})) {
    const key = String(rawKey).toLowerCase();
    const candidates = [
      capability.id,
      capability.name,
      slugify(capability.name),
      capability.relativePath,
      capability.folderName
    ].map((item) => String(item || "").toLowerCase());
    if (candidates.some((candidate) => candidate === key || candidate.includes(key))) {
      return value || {};
    }
  }
  return null;
}

function normalizeOverrideTags(override) {
  if (!override || !override.tags) return [];
  if (Array.isArray(override.tags)) return override.tags;
  if (typeof override.tags === "string") return override.tags.split(",");
  return [];
}

function uniqueTags(tags) {
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
}
