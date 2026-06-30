import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("static UI includes required control surfaces without private paths", async () => {
  const files = await Promise.all([
    fs.readFile(path.join(root, "public", "index.html"), "utf8"),
    fs.readFile(path.join(root, "public", "app.js"), "utf8"),
    fs.readFile(path.join(root, "public", "styles.css"), "utf8")
  ]);
  const joined = files.join("\n");

  for (const required of [
    "Agent Skill Atlas",
    "shader",
    "network",
    "categoryPanel",
    "route-results",
    "detail",
    "motionCards",
    "prefers-reduced-motion"
  ]) {
    assert.ok(joined.includes(required), `missing UI marker ${required}`);
  }

  for (const forbidden of ["C:\\Users\\Administrator", ".codex/skills", "logs_2.sqlite", "Full private instruction body"]) {
    assert.equal(joined.includes(forbidden), false, `contains private marker ${forbidden}`);
  }
});
