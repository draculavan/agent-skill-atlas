# Architecture

Agent Skill Atlas has two parts:

1. A Node.js CLI that scans skill metadata and writes `atlas.json`.
2. A static UI that reads `atlas.json` and renders search, category, route, and
   detail views.

## Scanner Flow

```text
roots/config -> ignore rules -> find SKILL.md -> parse metadata -> classify
-> sanitize paths -> validate shape -> write atlas.json
```

## UI Flow

```text
local HTTP server -> public/index.html -> public/app.js -> /atlas.json
-> searchable atlas
```

## Design Principle

The scanner is conservative. It prefers partial metadata plus warnings over
copying private bodies or guessing too aggressively.

