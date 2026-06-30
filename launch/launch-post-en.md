# Launch Post: Agent Skill Atlas

I open-sourced **Agent Skill Atlas**: a local-first visual atlas for AI agent skills.

If you keep adding Codex, Claude, Cursor, or custom agent skills, the system gets powerful fast, but it also gets hard to see:

- what skills you already have;
- how they are categorized;
- which ones are ready to route;
- which large plugin packs should stay summarized;
- what is safe to share without leaking private instructions.

Agent Skill Atlas scans local skill metadata and generates a private searchable atlas with:

- a neural-style visual map;
- category controls;
- read-only route preview;
- skill detail panels;
- pack summaries;
- configurable taxonomy and ignore rules.

Privacy is the main boundary:

- local-first;
- metadata-only by default;
- no full `SKILL.md` body export;
- no upload;
- relative paths only;
- sensitive path and token-shaped text redaction.

Quick start:

```bash
npm install -g github:draculavan/agent-skill-atlas
agent-skill-atlas demo
agent-skill-atlas scan --root ~/.codex/skills --out atlas.json
agent-skill-atlas open --data atlas.json
```

The goal is not to publish anyone's private skills. The goal is to help agent power users understand and manage their own local skill systems.

Repo: https://github.com/draculavan/agent-skill-atlas
