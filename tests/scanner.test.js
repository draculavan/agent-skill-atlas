import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { scanAtlas } from "../src/scanner.js";
import { assertAtlasShape } from "../src/schema.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "tests", "fixtures", "skills");

test("scanner exports metadata only with relative paths and predictable warnings", async () => {
  const atlas = await scanAtlas({ roots: [fixtureRoot], cwd: root });
  assertAtlasShape(atlas);

  assert.equal(atlas.counts.capabilities, 7);
  assert.equal(atlas.counts.scannedRoots, 1);
  assert.ok(atlas.capabilities.every((capability) => !path.isAbsolute(capability.relativePath)));
  assert.ok(atlas.capabilities.every((capability) => capability.relativePath.includes("/")));
  assert.ok(atlas.capabilities.every((capability) => !("body" in capability)));
  assert.ok(atlas.capabilities.every((capability) => capability.source.rootName === "skills"));

  const serialized = JSON.stringify(atlas);
  assert.equal(serialized.includes("C:\\Users\\Administrator"), false);
  assert.equal(serialized.includes("Full private instruction body"), false);
  assert.equal(serialized.includes("private-note"), false);
  assert.equal(serialized.includes("Hidden Secret Skill"), false);
  assert.equal(serialized.includes("auth"), false);
  assert.equal(serialized.includes("sqlite"), false);
  assert.equal(serialized.includes("memory"), false);

  const missing = atlas.capabilities.find((capability) => capability.relativePath === "missing-frontmatter/SKILL.md");
  assert.ok(missing);
  assert.equal(missing.routeStatus, "needs-metadata");
  assert.ok(missing.warnings.includes("missingFrontmatter"));

  const invalid = atlas.capabilities.find((capability) => capability.relativePath === "invalid-yaml/SKILL.md");
  assert.ok(invalid);
  assert.ok(invalid.warnings.includes("invalidFrontmatterValue:name"));

  const duplicates = atlas.capabilities.filter((capability) => capability.name === "Duplicate Skill");
  assert.equal(duplicates.length, 2);
  assert.ok(duplicates.every((capability) => capability.warnings.includes("duplicateName")));

  const chinese = atlas.capabilities.find((capability) => capability.name === "中文研究助手");
  assert.ok(chinese);
  assert.equal(chinese.category, "research-knowledge");
});

test("config overrides can change category and tags", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "asa-config-"));
  const configPath = path.join(temp, "atlas.config.json");
  await fs.writeFile(
    configPath,
    JSON.stringify({
      overrides: {
        "duplicate-a": {
          category: "business-strategy",
          tags: ["launch"]
        }
      }
    }),
    "utf8"
  );

  const atlas = await scanAtlas({ roots: [fixtureRoot], cwd: root, configPath });
  const duplicateA = atlas.capabilities.find((capability) => capability.relativePath === "duplicate-a/SKILL.md");
  assert.ok(duplicateA);
  assert.equal(duplicateA.category, "business-strategy");
  assert.ok(duplicateA.tags.includes("launch"));
});

test("custom taxonomy categories are included and classified by keywords", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "asa-taxonomy-"));
  const configPath = path.join(temp, "atlas.config.json");
  await fs.writeFile(
    configPath,
    JSON.stringify({
      taxonomy: [
        {
          id: "fixture-special",
          label: "Fixture Special",
          description: "Fixture-specific category.",
          keywords: ["nested"]
        }
      ]
    }),
    "utf8"
  );

  const atlas = await scanAtlas({ roots: [fixtureRoot], cwd: root, configPath });
  const nested = atlas.capabilities.find((capability) => capability.relativePath === "nested-assets/SKILL.md");
  assert.ok(nested);
  assert.equal(nested.category, "fixture-special");
  assert.ok(atlas.categories.some((category) => category.id === "fixture-special"));
});
