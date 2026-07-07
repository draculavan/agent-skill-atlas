# 发布说明：Agent Skill Atlas

我开源了一个本地优先的 AI Agent 技能星图工具：**Agent Skill Atlas**。

如果你已经积累了很多 Codex / Claude / Cursor / 自定义 Agent Skills，很快会遇到一个问题：技能越来越多，但你很难一眼看清自己到底有哪些能力、怎么分类、哪个技能适合处理哪类任务。

Agent Skill Atlas 做的事情很简单：扫描本地技能 metadata，生成一个私有的、可搜索、可分类、可预览路由的能力星图。

它包含：

- 深空神经网络风格的能力星图；
- 分类控制台；
- 只读路由预览；
- skill 详情面板；
- 大包 / 插件摘要；
- 可配置 taxonomy；
- `.atlasignore` 隐私忽略规则。

隐私边界是第一优先级：

- 本地运行；
- 默认只导出 metadata；
- 不导出完整 `SKILL.md` 正文；
- 不上传；
- 默认只保存相对路径；
- 忽略 auth、logs、memory、sessions、SQLite、env 等敏感路径；
- 对 token / key 形态文本做默认脱敏。

快速开始：

```bash
npm install -g github:draculavan/agent-skill-atlas
agent-skill-atlas demo
agent-skill-atlas scan --root ~/.codex/skills --out atlas.json
agent-skill-atlas open --data atlas.json
```

它不是让你公开自己的私有 skills，而是帮每个 agent power user 看懂并管理自己的本地能力系统。

Repo: https://github.com/draculavan/agent-skill-atlas

Feedback wanted: please share only sanitized skill layout reports. Do not paste private `SKILL.md` bodies, tokens, credentials, full local paths, or real private project names.

Copy/paste format:

```text
Agent/tool:
Skill root shape:
Entry file name(s):
Metadata style:
Nested assets or packs:
Expected atlas behavior:
Scanner warnings, if any:
```

README, privacy-boundary, and install-flow feedback is also welcome.
