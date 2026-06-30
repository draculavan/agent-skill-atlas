# Customization

Agent Skill Atlas is intentionally configurable because every user's skill
system is different.

## Config File

Create `atlas.config.json` in the project directory or pass a path with
`--config`.

```json
{
  "roots": ["~/.codex/skills", "~/.agents/skills"],
  "taxonomy": [
    {
      "id": "custom-ops",
      "label": "Custom Ops",
      "description": "Team-specific operating workflows.",
      "keywords": ["handoff", "runbook", "ops", "workflow"]
    }
  ],
  "overrides": {
    "launch-planner": {
      "category": "business",
      "tags": ["launch", "go-to-market"]
    }
  },
  "hidden": ["private/**", "**/scratch/**"],
  "includePlugins": false,
  "pluginSummaryMode": "summary"
}
```

## Roots

`roots` tells the scanner where to look for `SKILL.md` files. CLI `--root`
values take priority over config roots.

## Taxonomy

The built-in taxonomy is a starting point. Add or override categories when your
system has different language.

Each category supports:

- `id`: stable machine name;
- `label`: UI label;
- `description`: short explanation;
- `keywords`: words used by the lightweight classifier.

## Overrides

Use `overrides` for important skills that should always land in a specific
category or carry specific tags.

Override keys can match a capability id, folder name, skill name, or relative
path fragment.

## Hidden Paths

Use `.atlasignore` or config `hidden` patterns to hide sensitive paths. The
default rules already exclude auth, credentials, logs, memory, sessions, cache,
SQLite, and private environment files.

## Plugin Handling

Large plugin bundles are summarized by default. Add `--include-plugins` when
you want plugin skill metadata included in the atlas. Even then, the scanner
exports metadata only.

