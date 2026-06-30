import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

export function resolveTilde(input, cwd = process.cwd()) {
  if (!input) return input;
  if (input === "~") return os.homedir();
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return path.resolve(cwd, input);
}

export function toPosixPath(input) {
  return input.replace(/\\/g, "/");
}

export function safeRelative(root, target) {
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    return path.basename(target);
  }
  return toPosixPath(rel);
}

export function slugify(input, fallback = "item") {
  const value = String(input || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (value) return value;
  return `${fallback}-${shortHash(String(input || fallback))}`;
}

export function shortHash(input, length = 8) {
  return crypto.createHash("sha256").update(String(input)).digest("hex").slice(0, length);
}

export function uniqueByResolvedPath(paths) {
  const seen = new Set();
  const out = [];
  for (const candidate of paths) {
    if (!candidate) continue;
    const resolved = path.resolve(candidate);
    const key = process.platform === "win32" ? resolved.toLowerCase() : resolved;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(resolved);
  }
  return out;
}
