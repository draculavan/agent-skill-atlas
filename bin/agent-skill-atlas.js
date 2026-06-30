#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanAtlas } from "../src/scanner.js";
import { assertAtlasShape } from "../src/schema.js";
import { checkDemo, startAtlasServer } from "../src/server.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

async function main() {
  const [command, ...argv] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "scan") {
    const args = parseArgs(argv);
    const atlas = await scanAtlas({
      roots: args.root || [],
      configPath: args.config?.[0],
      includePlugins: args.includePlugins,
      cwd: process.cwd()
    });
    assertAtlasShape(atlas);
    const outPath = path.resolve(process.cwd(), args.out?.[0] || "atlas.json");
    const json = args.pretty ? JSON.stringify(atlas, null, 2) : JSON.stringify(atlas);
    await fs.writeFile(outPath, `${json}\n`, "utf8");
    console.log(`Wrote ${outPath}`);
    console.log(`Capabilities: ${atlas.counts.capabilities}; warnings: ${atlas.counts.warnings}`);
    return;
  }

  if (command === "open") {
    const args = parseArgs(argv);
    const dataPath = args.data?.[0] ? path.resolve(process.cwd(), args.data[0]) : path.resolve(process.cwd(), "atlas.json");
    const port = Number(args.port?.[0] || 8787);
    const { url } = await startAtlasServer({
      dataPath,
      port,
      openBrowser: !args.noOpen
    });
    console.log(`Agent Skill Atlas is running at ${url}`);
    console.log("Press Ctrl+C to stop.");
    return;
  }

  if (command === "demo") {
    const args = parseArgs(argv);
    const dataPath = path.join(packageRoot, "examples", "demo-atlas.json");
    if (args.check) {
      await checkDemo(dataPath);
      console.log("Demo atlas and UI assets are valid.");
      return;
    }
    const { url } = await startAtlasServer({
      dataPath,
      port: Number(args.port?.[0] || 8787),
      openBrowser: !args.noOpen
    });
    console.log(`Agent Skill Atlas demo is running at ${url}`);
    console.log("Press Ctrl+C to stop.");
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseArgs(argv) {
  const args = {
    root: [],
    out: [],
    data: [],
    config: [],
    port: [],
    includePlugins: false,
    pretty: false,
    noOpen: false,
    check: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") args.root.push(requireValue(argv, ++i, "--root"));
    else if (arg === "--out") args.out.push(requireValue(argv, ++i, "--out"));
    else if (arg === "--data") args.data.push(requireValue(argv, ++i, "--data"));
    else if (arg === "--config") args.config.push(requireValue(argv, ++i, "--config"));
    else if (arg === "--port") args.port.push(requireValue(argv, ++i, "--port"));
    else if (arg === "--include-plugins") args.includePlugins = true;
    else if (arg === "--pretty") args.pretty = true;
    else if (arg === "--no-open") args.noOpen = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`Agent Skill Atlas

Usage:
  agent-skill-atlas scan [--root <path>] [--out atlas.json] [--config atlas.config.json] [--include-plugins] [--pretty]
  agent-skill-atlas open [--data atlas.json] [--port 8787] [--no-open]
  agent-skill-atlas demo [--port 8787] [--no-open] [--check]

Examples:
  agent-skill-atlas scan --root ~/.codex/skills --out atlas.json --pretty
  agent-skill-atlas open --data atlas.json
  agent-skill-atlas demo
`);
}
