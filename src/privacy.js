import { slugify } from "./paths.js";

const SENSITIVE_PATTERNS = [
  /\btoken(s)?\b/gi,
  /\bauth(?:entication|orization|orize|orized)?\b/gi,
  /\bmemory\b/gi,
  /\bsqlite\b/gi,
  /\bsecret(s)?\b/gi,
  /\bcredential(s)?\b/gi,
  /\bapi[_-]?key\b/gi,
  /\bpassword(s)?\b/gi,
  /auth/gi,
  /token/gi,
  /sqlite/gi,
  /memory/gi,
  /\bghp_[A-Za-z0-9_]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g
];

export function sanitizeExportText(value) {
  let text = String(value ?? "");
  for (const pattern of SENSITIVE_PATTERNS) {
    text = text.replace(pattern, "[redacted]");
  }
  return text;
}

export function sanitizeExportArray(values) {
  return (values || []).map((value) => sanitizeExportText(value)).filter(Boolean);
}

export function sanitizeExportId(value, fallback = "item") {
  return slugify(sanitizeExportText(value).replace(/\[redacted\]/g, "redacted"), fallback);
}

export function sanitizeSource(source = {}) {
  return {
    ...source,
    rootName: sanitizeExportText(source.rootName || "skills")
  };
}
