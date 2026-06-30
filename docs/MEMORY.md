# Agent Skill Atlas Memory

## Current Product Decision

Agent Skill Atlas is a local-first visualization and management layer for AI
agent skills. It scans metadata, not private skill bodies, and generates a
portable `atlas.json` plus a static UI.

## First Release Defaults

- License: Apache-2.0.
- Runtime: Node.js CLI plus bundled static HTML/CSS/JS UI.
- Privacy: metadata-only by default, ignore common credential/runtime paths,
  never submit scans to a server.
- Release path: local private repository first; public GitHub release only
  after explicit confirmation.

## Validation Priorities

- Scanner fixtures cover missing frontmatter, invalid frontmatter, Chinese
  descriptions, duplicate names, nested assets, hidden paths, and relative path
  normalization.
- UI smoke tests must ensure static assets do not contain private local paths.

