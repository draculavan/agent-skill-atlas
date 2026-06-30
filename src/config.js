import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DEFAULT_HIDDEN_PATTERNS } from "./defaults.js";
import { resolveTilde, uniqueByResolvedPath } from "./paths.js";

export async function loadConfig({ cwd = process.cwd(), configPath } = {}) {
  const resolved = configPath ? resolveTilde(configPath, cwd) : path.join(cwd, "atlas.config.json");
  try {
    const raw = await fs.readFile(resolved, "utf8");
    return {
      config: JSON.parse(raw),
      configPath: resolved
    };
  } catch (error) {
    if (error.code === "ENOENT" && !configPath) {
      return { config: {}, configPath: null };
    }
    throw new Error(`Unable to load config ${resolved}: ${error.message}`);
  }
}

export function defaultSkillRoots() {
  const roots = [];
  if (process.env.CODEX_HOME) roots.push(path.join(process.env.CODEX_HOME, "skills"));
  roots.push(path.join(os.homedir(), ".codex", "skills"));
  roots.push(path.join(os.homedir(), ".agents", "skills"));
  return uniqueByResolvedPath(roots);
}

export function defaultPluginRoots() {
  const roots = [];
  if (process.env.CODEX_HOME) roots.push(path.join(process.env.CODEX_HOME, "plugins", "cache"));
  roots.push(path.join(os.homedir(), ".codex", "plugins", "cache"));
  return uniqueByResolvedPath(roots);
}

export function resolveRoots({ cliRoots = [], config = {}, cwd = process.cwd() } = {}) {
  const rawRoots = cliRoots.length ? cliRoots : config.roots?.length ? config.roots : defaultSkillRoots();
  return uniqueByResolvedPath(rawRoots.map((root) => resolveTilde(root, cwd)));
}

export async function loadIgnorePatterns({ cwd = process.cwd(), roots = [], config = {} } = {}) {
  const patterns = [...DEFAULT_HIDDEN_PATTERNS];
  patterns.push(...normalizePatternList(config.hidden));

  for (const ignorePath of [path.join(cwd, ".atlasignore"), ...roots.map((root) => path.join(root, ".atlasignore"))]) {
    const filePatterns = await readIgnoreFile(ignorePath);
    patterns.push(...filePatterns);
  }

  return [...new Set(patterns.map((pattern) => String(pattern).trim()).filter(Boolean))];
}

async function readIgnoreFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function normalizePatternList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}
