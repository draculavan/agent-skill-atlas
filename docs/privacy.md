# Privacy

Agent Skill Atlas is local-first. It is designed for users who have private
agent workflows and need visibility without exposing their actual instruction
assets.

## What The Scanner Reads

The scanner looks for skill entry files such as `SKILL.md` under configured
roots. It reads enough text to extract lightweight metadata:

- name;
- description;
- optional tags;
- file location relative to the scanned root;
- derived category and route status.

## What The Scanner Does Not Export

The generated `atlas.json` does not include full `SKILL.md` bodies. It also
does not include absolute local paths by default.

The default ignore rules skip common sensitive folders and files:

- auth and credentials;
- tokens and secrets;
- memory and memories;
- logs and sessions;
- SQLite and database files;
- private environment files;
- cache folders.

## Network Behavior

The CLI does not upload scan results. The `open` and `demo` commands start a
local HTTP server on `127.0.0.1` so the static UI can read `atlas.json`.

## Sharing Guidance

Before sharing an atlas file, inspect it as you would inspect any generated
artifact. Metadata can still reveal private project names, internal taxonomy,
or workflow structure.

Recommended public artifact:

```bash
agent-skill-atlas scan --root examples/demo-skills --out examples/demo-atlas.json
```

Recommended private artifact:

```bash
agent-skill-atlas scan --root ~/.codex/skills --out private-atlas.json
```

`private-atlas.json` is ignored by the default `.gitignore`.

