import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const issueTemplateRoot = path.join(root, ".github", "ISSUE_TEMPLATE");

async function readTemplate(fileName) {
  return fs.readFile(path.join(issueTemplateRoot, fileName), "utf8");
}

test("GitHub issue templates include privacy-first feedback paths", async () => {
  const [skillLayout, privacyReview, featureRequest] = await Promise.all([
    readTemplate("skill_layout.md"),
    readTemplate("privacy_review.md"),
    readTemplate("feature_request.md")
  ]);

  for (const content of [skillLayout, privacyReview, featureRequest]) {
    assert.match(content, /Do not paste private skill bodies/i);
    assert.match(content, /full (home-directory|local) paths/i);
  }

  for (const required of [
    "Agent or tool",
    "Sanitized folder shape",
    "Metadata style",
    "What should the atlas detect?"
  ]) {
    assert.ok(skillLayout.includes(required), `missing layout field ${required}`);
  }

  for (const required of [
    "Privacy area reviewed",
    "What could leak?",
    "Suggested safer behavior",
    "Sanitized example"
  ]) {
    assert.ok(privacyReview.includes(required), `missing privacy review field ${required}`);
  }
});
