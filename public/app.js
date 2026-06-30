const fallbackAtlas = {
  schemaVersion: "0.1.0",
  generatedAt: new Date().toISOString(),
  counts: { capabilities: 3, categories: 13, packs: 1, warnings: 0, scannedRoots: 1 },
  categories: [
    { id: "software-engineering", label: "Software Engineering", description: "Coding and review.", keywords: [], count: 1 },
    { id: "business-strategy", label: "Business Strategy", description: "Launch and packaging.", keywords: [], count: 1 },
    { id: "routing-orchestration", label: "Routing & Orchestration", description: "Route previews.", keywords: [], count: 1 }
  ],
  capabilities: [
    {
      id: "demo-code-review",
      name: "Code Review",
      description: "Review source changes for risk, regressions, and missing validation.",
      kind: "skill",
      source: { type: "demo", rootName: "demo-skills" },
      category: "software-engineering",
      relativePath: "code-review/SKILL.md",
      tags: ["review", "quality"],
      routeStatus: "ready",
      warnings: []
    },
    {
      id: "demo-launch-planner",
      name: "Launch Planner",
      description: "Package a developer tool launch with positioning, README structure, and community channels.",
      kind: "skill",
      source: { type: "demo", rootName: "demo-skills" },
      category: "business-strategy",
      relativePath: "launch-planner/SKILL.md",
      tags: ["launch", "gtm"],
      routeStatus: "ready",
      warnings: []
    },
    {
      id: "demo-zh-routing",
      name: "Chinese Routing Advisor",
      description: "Help Chinese-first users choose the right skill route for a task.",
      kind: "skill",
      source: { type: "demo", rootName: "demo-skills" },
      category: "routing-orchestration",
      relativePath: "zh-routing/SKILL.md",
      tags: ["routing"],
      routeStatus: "ready",
      warnings: []
    }
  ],
  packs: [
    {
      id: "demo-pack",
      name: "demo-skills",
      kind: "skill-root",
      source: { type: "demo", rootName: "demo-skills" },
      capabilityCount: 3,
      summaryOnly: false,
      warnings: []
    }
  ],
  diagnostics: { metadataOnly: true, absolutePathsExported: false, roots: [], warnings: [], skipped: [] }
};

const state = {
  atlas: fallbackAtlas,
  query: "",
  routeQuery: "",
  category: "all",
  selectedId: null,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  frame: 0
};

const elements = {
  search: document.querySelector("#search"),
  routeQuery: document.querySelector("#route-query"),
  categoryList: document.querySelector("#category-list"),
  routeResults: document.querySelector("#route-results"),
  packList: document.querySelector("#pack-list"),
  capabilityList: document.querySelector("#capability-list"),
  detail: document.querySelector("#detail-panel"),
  resultCount: document.querySelector("#result-count"),
  clearFilters: document.querySelector("#clear-filters"),
  canvas: document.querySelector("#atlas-canvas"),
  stats: {
    capabilities: document.querySelector("#stat-capabilities"),
    categories: document.querySelector("#stat-categories"),
    packs: document.querySelector("#stat-packs"),
    warnings: document.querySelector("#stat-warnings")
  }
};

init();

async function init() {
  try {
    const response = await fetch("./atlas.json", { cache: "no-store" });
    if (response.ok) state.atlas = await response.json();
  } catch {
    state.atlas = fallbackAtlas;
  }
  wireEvents();
  render();
  drawLoop();
}

function wireEvents() {
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });
  elements.routeQuery.addEventListener("input", (event) => {
    state.routeQuery = event.target.value.trim().toLowerCase();
    renderRoutePreview();
  });
  elements.clearFilters.addEventListener("click", () => {
    state.query = "";
    state.category = "all";
    state.selectedId = null;
    elements.search.value = "";
    render();
  });
  window.addEventListener("resize", () => drawNetwork(filteredCapabilities()));
}

function render() {
  renderStats();
  renderCategories();
  renderPacks();
  renderCapabilities();
  renderDetail();
  renderRoutePreview();
  drawNetwork(filteredCapabilities());
}

function renderStats() {
  elements.stats.capabilities.textContent = state.atlas.counts?.capabilities ?? state.atlas.capabilities.length;
  elements.stats.categories.textContent = state.atlas.counts?.categories ?? state.atlas.categories.length;
  elements.stats.packs.textContent = state.atlas.counts?.packs ?? state.atlas.packs.length;
  elements.stats.warnings.textContent = state.atlas.counts?.warnings ?? 0;
}

function renderCategories() {
  const categories = [{ id: "all", label: "All", count: state.atlas.capabilities.length }, ...state.atlas.categories];
  elements.categoryList.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.className = `category-button${state.category === category.id ? " active" : ""}`;
      button.type = "button";
      button.innerHTML = `<span>${escapeHtml(category.label || category.id)}</span><small>${category.count || 0}</small>`;
      button.addEventListener("click", () => {
        state.category = category.id;
        render();
      });
      return button;
    })
  );
}

function renderPacks() {
  const packs = state.atlas.packs || [];
  elements.packList.replaceChildren(
    ...packs.slice(0, 12).map((pack) => {
      const item = document.createElement("div");
      item.className = "pack-item";
      const count = pack.summaryOnly ? "summary only" : `${pack.capabilityCount ?? 0} capabilities`;
      item.innerHTML = `<strong>${escapeHtml(pack.name)}</strong><small>${escapeHtml(pack.kind)} · ${escapeHtml(count)}</small>`;
      return item;
    })
  );
}

function renderCapabilities() {
  const capabilities = filteredCapabilities();
  elements.resultCount.textContent = `${capabilities.length} capabilities`;
  elements.capabilityList.replaceChildren(
    ...capabilities.map((capability) => {
      const card = document.createElement("button");
      card.className = `capability-card${state.selectedId === capability.id ? " active" : ""}`;
      card.type = "button";
      card.innerHTML = `
        <div class="meta-row">
          <span class="pill ${capability.routeStatus === "ready" ? "ready" : "warn"}">${escapeHtml(capability.routeStatus)}</span>
          <span class="pill">${escapeHtml(capability.category)}</span>
        </div>
        <h3>${escapeHtml(capability.name)}</h3>
        <p>${escapeHtml(capability.description || "No description provided.")}</p>
        <div class="tag-row">${(capability.tags || []).slice(0, 4).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>
      `;
      card.addEventListener("click", () => {
        state.selectedId = capability.id;
        renderDetail();
        drawNetwork(filteredCapabilities());
      });
      return card;
    })
  );
}

function renderDetail() {
  const capability = state.atlas.capabilities.find((item) => item.id === state.selectedId);
  if (!capability) {
    elements.detail.innerHTML = '<div class="empty-state">Select a capability to inspect metadata.</div>';
    return;
  }
  elements.detail.innerHTML = `
    <h2>${escapeHtml(capability.name)}</h2>
    <p>${escapeHtml(capability.description || "No description provided.")}</p>
    <div class="tag-row">
      <span class="pill ${capability.routeStatus === "ready" ? "ready" : "warn"}">${escapeHtml(capability.routeStatus)}</span>
      <span class="pill">${escapeHtml(capability.kind)}</span>
      <span class="pill">${escapeHtml(capability.category)}</span>
    </div>
    <dl>
      <dt>Relative path</dt>
      <dd>${escapeHtml(capability.relativePath)}</dd>
      <dt>Source</dt>
      <dd>${escapeHtml(capability.source?.type || "local")} / ${escapeHtml(capability.source?.rootName || "skills")}</dd>
      <dt>Tags</dt>
      <dd>${escapeHtml((capability.tags || []).join(", ") || "None")}</dd>
      <dt>Warnings</dt>
      <dd>${escapeHtml((capability.warnings || []).join(", ") || "None")}</dd>
    </dl>
  `;
}

function renderRoutePreview() {
  const query = state.routeQuery;
  const ranked = rankCapabilities(query, state.atlas.capabilities).slice(0, 5);
  if (!query) {
    elements.routeResults.innerHTML = '<div class="route-item"><strong>No task entered</strong><small>Type a task to preview likely routes.</small></div>';
    return;
  }
  elements.routeResults.replaceChildren(
    ...ranked.map((item) => {
      const div = document.createElement("div");
      div.className = "route-item";
      div.innerHTML = `<strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · score ${item.score}</small>`;
      return div;
    })
  );
}

function filteredCapabilities() {
  return state.atlas.capabilities.filter((capability) => {
    const matchesCategory = state.category === "all" || capability.category === state.category;
    const text = [capability.name, capability.description, capability.category, capability.relativePath, ...(capability.tags || [])]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !state.query || text.includes(state.query);
    return matchesCategory && matchesQuery;
  });
}

function rankCapabilities(query, capabilities) {
  const terms = query.split(/\s+/).filter(Boolean);
  return capabilities
    .map((capability) => {
      const text = [capability.name, capability.description, capability.category, ...(capability.tags || [])].join(" ").toLowerCase();
      const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
      return { ...capability, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function drawLoop() {
  drawNetwork(filteredCapabilities());
  if (!state.reducedMotion) {
    state.frame += 1;
    window.requestAnimationFrame(drawLoop);
  }
}

function drawNetwork(capabilities) {
  const canvas = elements.canvas;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0c1014";
  ctx.fillRect(0, 0, width, height);

  const center = { x: width * 0.5, y: height * 0.5 };
  const categories = [...new Set(capabilities.map((item) => item.category))].slice(0, 12);
  const categoryNodes = categories.map((category, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(categories.length, 1) + state.frame * 0.002;
    return {
      id: category,
      x: center.x + Math.cos(angle) * Math.min(width, height) * 0.26,
      y: center.y + Math.sin(angle) * Math.min(width, height) * 0.26
    };
  });

  ctx.strokeStyle = "rgba(94, 234, 212, 0.18)";
  ctx.lineWidth = 1;
  for (const node of categoryNodes) {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(node.x, node.y);
    ctx.stroke();
  }

  ctx.fillStyle = "#5eead4";
  ctx.beginPath();
  ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
  ctx.fill();

  capabilities.slice(0, 80).forEach((capability, index) => {
    const category = categoryNodes.find((node) => node.id === capability.category) || center;
    const angle = (index * 2.399963229728653 + state.frame * 0.004) % (Math.PI * 2);
    const radius = 18 + (index % 7) * 9;
    const x = category.x + Math.cos(angle) * radius;
    const y = category.y + Math.sin(angle) * radius;
    const selected = capability.id === state.selectedId;
    ctx.strokeStyle = selected ? "rgba(245, 196, 81, 0.72)" : "rgba(138, 180, 255, 0.18)";
    ctx.beginPath();
    ctx.moveTo(category.x, category.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = selected ? "#f5c451" : capability.routeStatus === "ready" ? "#a3e635" : "#fb7185";
    ctx.beginPath();
    ctx.arc(x, y, selected ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(238, 244, 240, 0.72)";
  for (const node of categoryNodes) {
    const label = node.id.length > 18 ? `${node.id.slice(0, 16)}...` : node.id;
    const labelWidth = ctx.measureText(label).width;
    const x = Math.min(Math.max(8, node.x + 8), Math.max(8, width - labelWidth - 8));
    ctx.fillText(label, x, node.y + 4);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
