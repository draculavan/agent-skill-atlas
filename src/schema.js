import { SCHEMA_VERSION } from "./defaults.js";

export function createEmptyAtlas() {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    counts: {
      capabilities: 0,
      categories: 0,
      packs: 0,
      warnings: 0,
      scannedRoots: 0
    },
    categories: [],
    capabilities: [],
    packs: [],
    diagnostics: {
      metadataOnly: true,
      absolutePathsExported: false,
      roots: [],
      warnings: [],
      skipped: []
    }
  };
}

export function assertAtlasShape(atlas) {
  if (!atlas || typeof atlas !== "object") throw new Error("Atlas must be an object.");
  for (const key of ["schemaVersion", "generatedAt", "counts", "categories", "capabilities", "packs", "diagnostics"]) {
    if (!(key in atlas)) throw new Error(`Atlas missing required key: ${key}`);
  }
  if (!Array.isArray(atlas.categories)) throw new Error("Atlas categories must be an array.");
  if (!Array.isArray(atlas.capabilities)) throw new Error("Atlas capabilities must be an array.");
  if (!Array.isArray(atlas.packs)) throw new Error("Atlas packs must be an array.");
  for (const capability of atlas.capabilities) {
    for (const key of ["id", "name", "description", "kind", "source", "category", "relativePath", "tags", "routeStatus", "warnings"]) {
      if (!(key in capability)) throw new Error(`Capability ${capability.id || "<unknown>"} missing ${key}`);
    }
    if (typeof capability.relativePath !== "string") throw new Error(`Capability ${capability.id} relativePath must be a string.`);
    if (capability.body || capability.content || capability.fullText) {
      throw new Error(`Capability ${capability.id} includes a full body-like field.`);
    }
  }
  return true;
}
