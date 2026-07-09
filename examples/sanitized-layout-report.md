# Sanitized Skill Layout Report

Use this as a copy/paste example when sharing a skill folder layout that Agent
Skill Atlas should support. Keep it descriptive enough to reproduce the shape,
but do not include private skill bodies, credentials, full local paths, or real
private project names.

```text
Agent or tool: Example local agent

Sanitized folder shape:
skills/
  launch-planner/
    SKILL.md
    assets/
      checklist-template.md
  code-review/
    SKILL.md
  zh-routing/
    SKILL.md

Entry file name(s): SKILL.md

Metadata style:
YAML frontmatter with name and description fields.

Safe metadata example:
---
name: Launch Planner
description: Plan a privacy-first launch checklist for a local tool.
---

Nested assets or packs:
assets folders can be counted as supporting files, but their file contents
should not be exported into atlas.json.

Expected atlas behavior:
The scanner should create one capability for each SKILL.md file, store only
relative paths, classify the skills by metadata, and avoid exporting full
instruction bodies.

Scanner warnings, if any:
None for this example.

Privacy concern, if any:
None. This report uses bundled demo-style names only.
```

Before posting a report, check that it does not include:

- private `SKILL.md` bodies;
- tokens, credentials, or secret-like strings;
- full home-directory paths;
- private repository or client names;
- generated atlas data from a real workspace unless you inspected and redacted
  it first.
