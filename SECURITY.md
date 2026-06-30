# Security Policy

Agent Skill Atlas is designed to be local-first and metadata-only by default.
Security and privacy reports are welcome.

## Reporting A Privacy Or Security Issue

Please open a GitHub issue if the report can be described with sanitized
examples. If the report requires private details, avoid posting secrets or
private skill bodies publicly.

Include:

- operating system;
- command used;
- expected privacy boundary;
- sanitized output snippet;
- whether full skill content, absolute paths, tokens, or credentials appeared.

## Privacy Boundaries

By default, the scanner should not export:

- complete `SKILL.md` bodies;
- token-shaped strings;
- credential files;
- SQLite/log/session/cache folders;
- absolute local paths.

Metadata can still reveal private project names or internal workflow structure.
Inspect generated `atlas.json` before sharing it publicly.

## Supported Versions

The public repository currently tracks early `0.x` releases. Security and
privacy fixes target the latest `main` branch first.

