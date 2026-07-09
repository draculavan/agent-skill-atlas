# Contributing

Thanks for helping improve Agent Skill Atlas.

The most useful early contributions are compatibility reports from real local
agent setups. Sanitized folder shapes are enough; private skill bodies are not
needed.

## Good First Contributions

- Share a sanitized skill folder layout.
- Report scanner warnings on a demo or redacted fixture.
- Suggest taxonomy preset improvements.
- Review privacy and redaction behavior.
- Improve docs or install instructions.

## Local Development

```bash
npm test
npm run build
npm run scan:demo
npm run demo
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd test
npm.cmd run build
```

## Privacy Rules

Do not include:

- private `SKILL.md` bodies;
- tokens, credentials, or secrets;
- full home-directory paths;
- private repo names unless they are already public;
- generated atlas files from your real workspace unless you have inspected and
  sanitized them.

Prefer redacted examples:

```text
skills/
  example-skill/
    SKILL.md
```

```yaml
---
name: Example Skill
description: Short public-safe description.
---
```

For a fuller copy/paste format, start with
[examples/sanitized-layout-report.md](examples/sanitized-layout-report.md).

## Pull Requests

Keep pull requests focused. Include:

- what changed;
- why it matters;
- how you validated it;
- any privacy impact.
