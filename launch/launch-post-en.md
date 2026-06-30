# Launch Draft: Agent Skill Atlas

I built Agent Skill Atlas: a local-first visual atlas for AI agent skills.

If you have many Codex, Claude, Cursor, or custom agent skills, it becomes hard
to remember what exists, how skills are categorized, and which one should route
to a task. Agent Skill Atlas scans local metadata and generates a private
searchable atlas with categories, route previews, pack summaries, and detail
panels.

Privacy is the core boundary:

- local-first;
- metadata-only by default;
- no full `SKILL.md` body export;
- no upload;
- relative paths only.

Quick start:

```bash
npm install -g .
agent-skill-atlas scan --root ~/.codex/skills --out atlas.json
agent-skill-atlas open --data atlas.json
```

The goal is not to publish anyone's private skills. The goal is to help agent
power users understand and manage their own local skill systems.

