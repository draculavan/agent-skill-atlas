export function parseSkillMarkdown(content) {
  const text = String(content || "").replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) {
    return {
      metadata: {},
      warnings: ["missingFrontmatter"],
      hasFrontmatter: false
    };
  }

  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    return {
      metadata: {},
      warnings: ["invalidFrontmatter"],
      hasFrontmatter: true
    };
  }

  const raw = text.slice(4, end).trimEnd();
  const parsed = parseYamlLite(raw);
  return {
    metadata: parsed.metadata,
    warnings: parsed.warnings,
    hasFrontmatter: true
  };
}

export function normalizeSkillMetadata(parsed, fallbackName) {
  const metadata = parsed.metadata || {};
  const name = firstString(metadata.name, metadata.title, fallbackName);
  const description = firstString(
    metadata.description,
    metadata.summary,
    metadata.short_description,
    metadata.shortDescription,
    ""
  );
  const tags = normalizeTags(metadata.tags);

  const warnings = [...(parsed.warnings || [])];
  if (!name) warnings.push("missingName");
  if (!description) warnings.push("missingDescription");

  return {
    name: name || fallbackName || "Untitled Skill",
    description,
    tags,
    warnings
  };
}

function parseYamlLite(raw) {
  const metadata = {};
  const warnings = [];
  const lines = raw.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      warnings.push(`invalidFrontmatterLine:${index + 1}`);
      index += 1;
      continue;
    }

    const key = match[1];
    const value = match[2] || "";

    if (isBlockMarker(value)) {
      const block = [];
      index += 1;
      while (index < lines.length) {
        const next = lines[index];
        if (next.trim() && !/^\s+/.test(next)) break;
        block.push(next.replace(/^\s{1,4}/, ""));
        index += 1;
      }
      metadata[key] = value.startsWith(">") ? block.map((item) => item.trim()).filter(Boolean).join(" ") : block.join("\n").trim();
      continue;
    }

    if (!value) {
      const list = [];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const next = lines[cursor];
        const listMatch = next.match(/^\s*-\s+(.+)$/);
        if (!listMatch) break;
        list.push(parseScalar(listMatch[1]));
        cursor += 1;
      }
      if (list.length) {
        metadata[key] = list;
        index = cursor;
        continue;
      }
    }

    metadata[key] = parseScalar(value);
    if (looksUnbalanced(value)) warnings.push(`invalidFrontmatterValue:${key}`);
    index += 1;
  }

  return { metadata, warnings };
}

function isBlockMarker(value) {
  return [">", ">-", ">|", "|", "|-"].includes(value.trim());
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => parseScalar(item))
      .filter(Boolean);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function looksUnbalanced(value) {
  const trimmed = String(value || "").trim();
  return (trimmed.startsWith("[") && !trimmed.endsWith("]")) || (trimmed.startsWith("{") && !trimmed.endsWith("}"));
}
