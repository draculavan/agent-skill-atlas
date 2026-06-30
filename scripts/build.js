import fs from "node:fs/promises";
import path from "node:path";
import { assertAtlasShape } from "../src/schema.js";

const root = path.resolve(import.meta.dirname, "..");

const requiredFiles = [
  "bin/agent-skill-atlas.js",
  "src/scanner.js",
  "src/server.js",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "README.md",
  "docs/privacy.md",
  "docs/customization.md",
  "LICENSE"
];

for (const file of requiredFiles) {
  await fs.access(path.join(root, file));
}

const demoAtlasPath = path.join(root, "examples", "demo-atlas.json");
const demoAtlas = JSON.parse(await fs.readFile(demoAtlasPath, "utf8"));
assertAtlasShape(demoAtlas);

const serialized = JSON.stringify(demoAtlas);
for (const forbidden of ["C:\\\\Users\\\\Administrator", "token", "auth", "sqlite", "memory", "Full private instruction body"]) {
  if (serialized.includes(forbidden)) {
    throw new Error(`Demo atlas contains forbidden string: ${forbidden}`);
  }
}

console.log("Build validation passed.");
