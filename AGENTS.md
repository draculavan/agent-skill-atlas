# AGENTS.md - Agent Skill Atlas

## Scope

This repository contains a local-first Node CLI and static UI for scanning AI
agent skill metadata into a private visual atlas.

## Safety Boundaries

- Do not commit real user `.codex`, `.agents`, memory, auth, logs, sessions,
  SQLite files, tokens, private environment files, or generated real atlas data.
- The scanner must remain metadata-only by default. Do not export complete
  `SKILL.md` bodies unless a future design explicitly adds an opt-in export.
- GitHub publishing, remote creation, package publishing, and public release
  require explicit user confirmation.

## Development

- Keep runtime dependencies minimal and prefer Node built-ins.
- Use `node --test` for unit tests.
- Verify privacy-sensitive changes with fixture scans that check for absolute
  private paths and leaked body text.
- UI must work as static files served with a local `atlas.json`.

