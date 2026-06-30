const palette = [
  "#C4A7FF",
  "#7DB7FF",
  "#7EF5B5",
  "#FF9AD5",
  "#FFC46B",
  "#D8B16D",
  "#FF7A7A",
  "#75E6FF",
  "#A6B4FF",
  "#6BF2DC",
  "#B8C4D8",
  "#FF8AA6",
  "#D59BFF",
  "#9FF0C8"
];

const fallbackAtlas = {
  schemaVersion: "0.1.0",
  generatedAt: new Date().toISOString(),
  counts: { capabilities: 3, categories: 14, packs: 1, warnings: 0, scannedRoots: 1 },
  categories: [
    { id: "routing-orchestration", label: "Routing & Orchestration", description: "Route previews.", count: 1 },
    { id: "quality-review", label: "Quality & Review", description: "Review and verification.", count: 1 },
    { id: "business-strategy", label: "Business Strategy", description: "Launch and commercial packaging.", count: 1 }
  ],
  capabilities: [
    {
      id: "demo-code-review",
      name: "Code Review",
      description: "Review source changes for risk, regressions, and missing validation.",
      kind: "skill",
      source: { type: "demo", rootName: "demo-skills" },
      category: "quality-review",
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
      description: "帮中文用户把复杂任务分流到合适的 agent skill、插件或本地工作流。",
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

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  atlas: fallbackAtlas,
  data: null,
  focusCategory: "",
  q: "",
  routeQ: "",
  pointer: { x: 0.5, y: 0.5 },
  hover: null,
  selected: null,
  networkFrame: 0,
  networkStarted: false
};

const el = {};

init();

async function init() {
  cacheElements();
  state.atlas = await loadAtlas();
  state.data = normalizeAtlas(state.atlas);
  renderAll();
  shaderInit(el.shader);
  startNetwork();
  wireEvents();
}

function cacheElements() {
  el.shader = document.getElementById("shader");
  el.network = document.getElementById("network");
  el.q = document.getElementById("q");
  el.cat = document.getElementById("cat");
  el.routeQ = document.getElementById("routeQ");
  el.routeResults = document.getElementById("routeResults");
  el.categoryPanel = document.getElementById("categoryPanel");
  el.detail = document.getElementById("detail");
  el.modeLabel = document.getElementById("modeLabel");
  el.resetFocus = document.getElementById("resetFocus");
  el.motionCards = document.getElementById("motionCards");
  el.countSkills = document.getElementById("countSkills");
  el.countPacks = document.getElementById("countPacks");
  el.countChildren = document.getElementById("countChildren");
}

async function loadAtlas() {
  try {
    const response = await fetch("./atlas.json", { cache: "no-store" });
    if (response.ok) return response.json();
  } catch {
    return fallbackAtlas;
  }
  return fallbackAtlas;
}

function normalizeAtlas(atlas) {
  const categories = (atlas.categories || []).map((category, index) => ({
    id: category.id,
    label: category.label || category.id,
    short: shortLabel(category.label || category.id),
    color: palette[index % palette.length],
    purpose: category.description || "本地 metadata 分类。",
    partition: "local atlas taxonomy",
    trigger: (category.keywords || []).slice(0, 8).join("、"),
    local_count: category.count || 0,
    pack_count: 0,
    route_terms: [category.id, category.label, category.description, ...(category.keywords || [])].filter(Boolean),
    use_when: ["任务描述明显匹配该分类的关键词或用途。"],
    do_not_use_when: ["不确定时只作为候选，不执行任何 skill。"],
    primary_routes: [],
    support_routes: [],
    exit_rule: "只读候选展示；执行前仍需由用户确认真实任务。"
  }));

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const skills = (atlas.capabilities || []).map((capability) => ({
    ...capability,
    display: capability.name,
    note: capability.description,
    route_status: routeStatusLabel(capability.routeStatus),
    relationship: capability.kind,
    sourceLabel: `${capability.source?.type || "local"} / ${capability.source?.rootName || "skills"}`,
    path: capability.relativePath,
    when_to_use: capability.description,
    when_not_to_use: (capability.warnings || []).length ? `需要先处理 warning：${capability.warnings.join("、")}` : "如果任务不匹配 description，不要强行调用。",
    trigger_terms: [
      capability.id,
      capability.name,
      capability.description,
      capability.category,
      capability.relativePath,
      ...(capability.tags || [])
    ].filter(Boolean)
  }));

  const packs = (atlas.packs || []).map((pack) => {
    const category = categoryForPack(pack, skills, categories);
    const categoryInfo = categoryMap.get(category);
    if (categoryInfo) categoryInfo.pack_count += 1;
    return {
      ...pack,
      id: pack.id || `pack:${slug(pack.name)}`,
      name: pack.name || "Skill Pack",
      type: pack.kind || "pack",
      category,
      status: pack.summaryOnly ? "摘要" : "可展开",
      purpose: pack.summaryOnly ? "插件/大包摘要，不平铺包内全部子项。" : "本地技能根或能力包摘要。",
      when_to_use: pack.summaryOnly ? "需要了解大包存在与边界，但暂不扫描全部子项。" : "需要从该能力包中选择候选 skill。",
      when_not_to_use: "不要把大包内所有子项一次性展开成路由候选。",
      child_count: pack.capabilityCount ?? null,
      total_child_tokens: null,
      representative_children: [],
      scores: { fit: 7, quality: 7, overlap: 3, token_risk: pack.summaryOnly ? 8 : 4, routing: 7, boundary: 5, overall: 6.4 },
      trigger_terms: [pack.id, pack.name, pack.kind, category].filter(Boolean)
    };
  });

  return { categories, skills, packs };
}

function categoryForPack(pack, skills, categories) {
  if (pack.category) return pack.category;
  const rootName = pack.source?.rootName || pack.name || "";
  const matches = skills.filter((skill) => skill.source?.rootName === rootName);
  if (!matches.length) return categories[0]?.id || "uncategorized";
  const counts = new Map();
  for (const skill of matches) counts.set(skill.category, (counts.get(skill.category) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function wireEvents() {
  window.addEventListener("pointermove", (event) => {
    state.pointer = { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight };
  });

  el.network.addEventListener("pointermove", (event) => {
    const rect = el.network.getBoundingClientRect();
    state.pointer = {
      x: (event.clientX - rect.left) / Math.max(1, rect.width),
      y: (event.clientY - rect.top) / Math.max(1, rect.height)
    };
  });

  el.network.addEventListener("click", () => handleNode(state.hover));
  el.q.addEventListener("input", (event) => {
    state.q = event.target.value;
    renderCategoryConsole();
  });
  el.routeQ.addEventListener("input", (event) => {
    state.routeQ = event.target.value;
    renderRoutePreview();
  });
  el.cat.addEventListener("change", (event) => setFocus(event.target.value));
  el.resetFocus.addEventListener("click", () => setFocus(""));
  window.addEventListener("resize", () => drawNetworkFrame());
}

function renderAll() {
  el.countSkills.textContent = state.atlas.counts?.capabilities ?? state.data.skills.length;
  el.countPacks.textContent = state.atlas.counts?.packs ?? state.data.packs.length;
  el.countChildren.textContent = `${state.data.categories.length}/${state.atlas.counts?.warnings ?? 0}`;
  renderCategorySelect();
  renderCategoryConsole();
  renderRoutePreview();
  renderMotionCards();
  detail({ id: "center", type: "center", name: "Agent Skill Atlas", color: "#edd18b", note: "总览模式：选择一个能力星系进入分类控制台。数据来自本地 atlas.json，不上传。" });
}

function renderCategorySelect() {
  el.cat.innerHTML = `<option value="">全部星系</option>${state.data.categories
    .map((category) => `<option value="${esc(category.id)}">${esc(category.label)}</option>`)
    .join("")}`;
}

function renderCategoryConsole() {
  const focus = categoryById(state.focusCategory);
  el.modeLabel.textContent = focus ? `${focus.short || focus.label}模式` : "总览模式";
  if (!focus) {
    const cats = state.data.categories.filter(matchQuery);
    el.categoryPanel.innerHTML = `
      <div class="console-head"><div><h3>主分类星系</h3><small>${cats.length} 个分类 · 点击进入控制台</small></div></div>
      <div class="category-grid">${cats
        .map(
          (category) => `
          <button class="category-btn${state.focusCategory === category.id ? " active" : ""}" style="--cat-color:${esc(category.color)}" data-cat-id="${esc(category.id)}">
            <b>${esc(category.label)}</b>
            <div class="item-note">${esc(category.purpose)} · ${category.local_count || 0} skill / ${category.pack_count || 0} 大包</div>
          </button>`
        )
        .join("")}</div>`;
    el.categoryPanel.querySelectorAll("[data-cat-id]").forEach((button) => {
      button.addEventListener("click", () => setFocus(button.dataset.catId));
    });
    return;
  }

  const skills = independentSkills(focus.id).filter(matchQuery);
  const packs = packSkills(focus.id).filter(matchQuery);
  const rec = recommendedForCategory(focus.id);
  el.categoryPanel.innerHTML = `
    <div class="console-head">
      <div><h3>${esc(focus.label)}</h3><small>${esc(focus.purpose)}</small></div>
      <span class="pill gold">${skills.length} skill</span>
    </div>
    <h4>推荐组合</h4>
    <div class="route-results">${[...rec.skills.map((skill) => ({ n: skill.display || skill.name, t: skill.route_status || "skill" })), ...rec.packs.map((pack) => ({ n: pack.name, t: "大包" }))]
      .slice(0, 5)
      .map((item) => `<div class="route-row"><b>${esc(item.n)}</b><span>${esc(item.t)}</span></div>`)
      .join("") || '<div class="route-row"><b>暂无推荐组合</b><span>当前分类没有足够数据</span></div>'}</div>
    <h4>独立技能</h4>
    <div class="item-list">${skills
      .slice(0, 24)
      .map(
        (skill) => `
        <button class="item-card" data-node-id="${esc(skill.id)}">
          <div class="item-title"><b>${esc(skill.display || skill.name)}</b><span class="pill">${esc(skill.route_status || "未标注")}</span></div>
          <div class="item-note">${esc(shortText(skill.note || skill.description, 120))}</div>
        </button>`
      )
      .join("") || '<div class="route-row"><b>无匹配技能</b><span>换一个关键词或返回总览。</span></div>'}</div>
    <h4>大包 / 插件包</h4>
    <div class="item-list">${packs
      .slice(0, 12)
      .map(
        (pack) => `
        <button class="item-card pack" data-node-id="${esc(pack.id)}">
          <div class="item-title"><b>${esc(pack.name)}</b><span class="pill gold">${esc(pack.status || "摘要")}</span></div>
          <div class="item-note">${esc(pack.purpose || "summary only")} · ${pack.child_count ?? "?"} child</div>
        </button>`
      )
      .join("") || '<div class="route-row"><b>无大包</b><span>该分类没有 pack 摘要。</span></div>'}</div>
    <h4>误用边界</h4>
    <div class="route-row"><b>只读候选</b><span>不会真实调用 skill、插件、账号或外部写入。</span></div>`;

  el.categoryPanel.querySelectorAll("[data-node-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const node = nodeById(button.dataset.nodeId);
      if (node) detail(node);
    });
  });
}

function renderRoutePreview() {
  const q = norm(state.routeQ);
  if (!q) {
    el.routeResults.innerHTML = '<div class="route-row"><b>等待输入</b><span>这里只做本地候选预览，不会真实调用 skill、插件、账号或外部写入。</span></div>';
    return;
  }
  const rows = selectRoute(q);
  el.routeResults.innerHTML = rows.length
    ? rows
        .map(
          (row) => `
          <div class="route-row" data-preview-id="${esc(row.id)}">
            <b>${esc(row.kind)} · ${esc(row.name)} · ${Math.round(row.score * 100)}%</b>
            <span>${esc(shortText(row.note, 90))}</span>
          </div>`
        )
        .join("")
    : '<div class="route-row"><b>没有明显匹配</b><span>换一种说法，或从主分类星系进入。</span></div>';

  el.routeResults.querySelectorAll("[data-preview-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const node = nodeById(row.dataset.previewId);
      if (!node) return;
      if (node.type === "category") setFocus(node.id);
      else {
        if (node.category) setFocus(node.category);
        detail(node);
      }
    });
  });
}

function renderMotionCards() {
  const cards = [
    ["本地优先", "local-first", "扫描、预览和展示都在本机完成；默认不上传 atlas 数据。"],
    ["Metadata-only", "privacy boundary", "默认只导出 name、description、category、relativePath 等 metadata，不复制完整正文。"],
    ["分类控制台", "category console", "一个分类进入一个窗口，独立技能、大包、推荐组合和误用边界分开展示。"],
    ["只读路由预览", "local route preview", "输入需求只显示候选分类和能力，不执行真实 skill 调用。"],
    ["大包不平铺", "pack summary mode", "插件和大包默认摘要化，避免几千个子项压垮界面与 token 预算。"],
    ["深空神经视觉", "neural field", "WebGL 背景提供高级空间感，Canvas 节点层保证可读和可交互。"]
  ];
  el.motionCards.innerHTML = cards
    .map(([title, small, body]) => `<article class="card"><small>${esc(small)}</small><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`)
    .join("");
}

function setFocus(catId) {
  state.focusCategory = catId || "";
  el.cat.value = state.focusCategory;
  state.selected = null;
  renderCategoryConsole();
  const category = categoryById(state.focusCategory);
  detail(
    category
      ? { ...category, type: "category" }
      : { id: "center", type: "center", name: "Agent Skill Atlas", color: "#edd18b", note: "总览模式：选择一个能力星系进入分类控制台。" }
  );
}

function detail(node) {
  if (!node) return;
  state.selected = node;
  const color = node.color || categoryById(node.category)?.color || "#78efff";
  let html = `<h3>${esc(node.display || node.name || node.label || node.id)}</h3><p>${esc(node.note || node.description || node.purpose || "")}</p>`;

  if (node.type === "center") {
    html += `
      <div class="info-grid">
        <div class="info-cell"><b>${state.data.categories.length}</b><span>主分类</span></div>
        <div class="info-cell"><b>${state.data.skills.length}</b><span>metadata 能力</span></div>
        <div class="info-cell"><b>${state.data.packs.length}</b><span>大包摘要</span></div>
        <div class="info-cell"><b>${state.atlas.counts?.warnings ?? 0}</b><span>扫描 warning</span></div>
      </div>
      <div class="section-label">隐私边界</div>
      <ul><li>数据来自本地 atlas.json。</li><li>默认 metadata-only，不导出完整 SKILL.md 正文。</li><li>路由预览只显示候选，不执行调用。</li></ul>`;
  } else if (node.type === "category" || categoryById(node.id)) {
    const skills = independentSkills(node.id);
    const packs = packSkills(node.id);
    html += `
      <div class="info-grid">
        <div class="info-cell"><b>${skills.length}</b><span>独立技能</span></div>
        <div class="info-cell"><b>${packs.length}</b><span>大包</span></div>
        <div class="info-cell"><b>${esc(node.short || node.label)}</b><span>星系短名</span></div>
        <div class="info-cell"><b>${esc(node.partition || "local")}</b><span>来源</span></div>
      </div>
      <div class="section-label">使用建议</div>
      <ul>${(node.use_when || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <div class="section-label">不要用于</div>
      <ul>${(node.do_not_use_when || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  } else if (node.type === "pack" || String(node.id).startsWith("pack")) {
    html += `
      <p><b>类型：</b>${esc(node.type || node.kind || "pack")}</p>
      <p><b>状态：</b>${esc(node.status || "摘要")}</p>
      <p><b>所属分类：</b>${esc(categoryById(node.category)?.label || node.category || "未分类")}</p>
      <p><b>子项：</b>${esc(node.child_count ?? "未知")}</p>
      <div class="section-label">大包策略</div>
      <ul><li>默认 brief-first，不把包内所有子项平铺进主路由。</li><li>需要深扫时由用户显式开启。</li></ul>
      ${scoreGrid(node.scores)}`;
  } else {
    html += `
      <p><b>类型：</b>${esc(node.kind || "skill")}</p>
      <p><b>路由状态：</b>${esc(node.route_status || node.routeStatus || "未标注")}</p>
      <p><b>来源：</b>${esc(node.sourceLabel || "")}</p>
      <p><b>路径：</b><code>${esc(node.path || node.relativePath || "")}</code></p>
      <p><b>标签：</b>${esc((node.tags || []).join("、") || "无")}</p>
      <div class="section-label">推荐下一步</div>
      <ul><li>${node.routeStatus === "ready" ? "自然语言任务匹配时可作为候选。" : "执行前需要人工确认 metadata 或 warning。"}</li><li>打开完整 SKILL.md 前先确认任务确实匹配。</li></ul>`;
  }
  el.detail.innerHTML = html;
  el.detail.style.borderColor = colorMix(color, 0.42);
  renderCategoryConsole();
}

function scoreGrid(scores = {}) {
  const rows = [
    ["fit", "匹配"],
    ["quality", "质量"],
    ["token_risk", "Token 风险"],
    ["routing", "路由清晰度"],
    ["boundary", "边界风险"]
  ];
  return `<div class="section-label">评分摘要</div>${rows
    .map((row) => {
      const value = Number(scores[row[0]] || 0);
      return `<p><b>${row[1]}：</b>${value}/10</p><div class="scorebar"><i style="width:${Math.max(6, Math.min(100, value * 10))}%"></i></div>`;
    })
    .join("")}`;
}

function startNetwork() {
  if (state.networkStarted) return;
  state.networkStarted = true;
  drawNetworkFrame();
}

function drawNetworkFrame() {
  const canvas = el.network;
  if (!canvas) return;
  const { w, h } = resize(canvas);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const { nodes, links } = buildNodes(w, h);
  const map = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const t = reduced ? 0 : state.networkFrame * 0.012;
  const shiftX = (state.pointer.x - 0.5) * 16;
  const shiftY = (state.pointer.y - 0.5) * 12;
  const px = state.pointer.x * w - shiftX;
  const py = state.pointer.y * h - shiftY;
  let hover = null;

  ctx.save();
  ctx.translate(shiftX, shiftY);

  for (const link of links) {
    const a = map[link.a];
    const b = map[link.b];
    if (!a || !b) continue;
    const active = state.selected && (state.selected.id === a.id || state.selected.id === b.id);
    const alpha = link.type === "ghost" ? 0.035 : active ? 0.46 : matchQuery(a) && matchQuery(b) ? 0.2 : 0.052;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo((a.x + b.x) / 2 + Math.sin(t + a.x * 0.01) * 14, (a.y + b.y) / 2 + Math.cos(t + b.y * 0.01) * 14, b.x, b.y);
    ctx.strokeStyle = link.type === "pack" ? color(b.color, 0.3) : `rgba(205,230,255,${alpha})`;
    ctx.lineWidth = active ? 2 : link.type === "category" ? 1.25 : 0.75;
    ctx.setLineDash(link.type === "pack" ? [5, 8] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const node of nodes) {
    const isMini = node.type === "category-mini";
    const active = state.selected && state.selected.id === node.id;
    const bob = reduced ? 0 : Math.sin(t + node.x * 0.01 + node.y * 0.01) * 4;
    const x = node.x;
    const y = node.y + bob;
    const r = node.size;
    if (Math.hypot(px - x, py - y) < Math.max(20, r + 12)) hover = node;

    ctx.save();
    ctx.globalAlpha = matchQuery(node) ? (isMini ? 0.42 : 1) : 0.16;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * (active ? 8 : 6));
    glow.addColorStop(0, color(node.color, active ? 0.56 : 0.34));
    glow.addColorStop(0.34, color(node.color, active ? 0.2 : 0.1));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * (active ? 7 : 5.4), 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = node.color;
    ctx.shadowBlur = active ? 34 : node.type === "center" || node.focused ? 30 : 17;
    ctx.fillStyle = node.type === "center" || node.focused ? "#edd18b" : "rgba(3,9,22,.88)";
    ctx.strokeStyle = color(node.color, 0.95);
    ctx.lineWidth = active ? 2.6 : node.type === "category" || node.focused ? 1.8 : 1;
    if (node.type === "pack") {
      drawHex(ctx, x, y, r * 1.25, t * 0.25);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (active) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = color(node.color, 0.6);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    const label = node.type === "center" || node.type === "category" || node.focused || node.type === "pack" || isMini || active || Math.hypot(px - x, py - y) < 70;
    if (label) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = node.type === "pack" ? "#ffe4a9" : "#eef8ff";
      ctx.font = node.type === "center" || node.focused ? "30px Georgia" : node.type === "category" ? "13px Microsoft YaHei" : "11px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.fillText(shortText(node.label || node.name || node.id, 20), x, y + r + (node.type === "center" || node.focused ? 34 : 17));
    }
    ctx.restore();
  }

  state.hover = hover;
  canvas.style.cursor = hover ? "pointer" : "crosshair";
  ctx.restore();
  state.networkFrame += 1;
  if (!reduced) window.requestAnimationFrame(drawNetworkFrame);
}

function buildNodes(w, h) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const min = Math.min(w, h);
  const focus = categoryById(state.focusCategory);
  const nodes = [];
  const links = [];

  if (!focus) {
    nodes.push({ id: "center", type: "center", label: "Agent", name: "Agent Skill Atlas", x: cx, y: cy, size: 52, color: "#edd18b", note: "总览模式：点击主分类进入能力控制台。" });
    ringPlace(state.data.categories, cx, cy, min * 0.31).forEach(({ item, x, y, a }) => {
      nodes.push({ ...item, type: "category", x, y, a, size: 18 + Math.min(18, (item.local_count || 0) * 0.55), label: item.short || item.label, color: item.color });
      links.push({ a: "center", b: item.id, type: "category" });
    });
    state.data.packs.forEach((pack, index) => {
      const category = categoryById(pack.category);
      if (!category) return;
      const categoryIndex = Math.max(0, state.data.categories.findIndex((item) => item.id === pack.category));
      const base = -Math.PI / 2 + (categoryIndex * Math.PI * 2) / Math.max(1, state.data.categories.length);
      const angle = base + ((index % 5) - 2) * 0.075;
      const radius = min * (0.43 + (index % 2) * 0.035);
      nodes.push({ ...pack, type: "pack", x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, size: 8 + Math.min(15, (pack.child_count || 0) / 15), color: category.color, label: pack.name });
      links.push({ a: pack.category, b: pack.id, type: "pack" });
    });
    return { nodes, links };
  }

  nodes.push({ ...focus, type: "category", focused: true, x: cx, y: cy, size: 52, label: focus.short || focus.label, color: focus.color });
  state.data.categories.forEach((category, index) => {
    if (category.id === focus.id) return;
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(1, state.data.categories.length);
    nodes.push({ ...category, type: "category-mini", x: cx + Math.cos(angle) * min * 0.465, y: cy + Math.sin(angle) * min * 0.465, a: angle, size: 7, label: category.short || category.label, color: category.color });
    links.push({ a: focus.id, b: category.id, type: "ghost" });
  });

  const skills = independentSkills(focus.id).filter(matchQuery);
  const packs = packSkills(focus.id).filter(matchQuery);
  const rings = Math.max(1, Math.ceil(skills.length / 24));
  for (let ring = 0; ring < rings; ring += 1) {
    const slice = skills.slice(ring * 24, (ring + 1) * 24);
    ringPlace(slice, cx, cy, min * (0.25 + ring * 0.08), -Math.PI / 2 + ring * 0.12).forEach(({ item, x, y }) => {
      nodes.push({ ...item, type: "skill", x, y, size: 5.4, color: focus.color, label: item.display || item.name });
      links.push({ a: focus.id, b: item.id, type: "skill" });
    });
  }
  ringPlace(packs, cx, cy, min * 0.42, -Math.PI / 2 + 0.16).forEach(({ item, x, y }) => {
    nodes.push({ ...item, type: "pack", x, y, size: 12 + Math.min(16, (item.child_count || 0) / 14), color: focus.color, label: item.name });
    links.push({ a: focus.id, b: item.id, type: "pack" });
  });
  return { nodes, links };
}

function shaderInit(canvas) {
  const gl = canvas.getContext("webgl");
  if (!gl) return false;
  const vert = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const frag = `precision highp float;uniform vec2 r;uniform float t;uniform vec2 m;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.48;}return v;}
void main(){vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);uv+=(m-.5)*.18;float d=length(uv);float n=fbm(uv*3.0+vec2(t*.035,-t*.025));float arm=abs(sin(atan(uv.y,uv.x)*3.0+d*5.4-t*.16));float core=smoothstep(.62,.03,d);float fog=smoothstep(.98,.08,d)*(n*.72+arm*.22);vec3 col=vec3(.01,.022,.058);col+=vec3(.05,.46,.82)*fog*.52;col+=vec3(.48,.22,.96)*pow(max(0.,fog-.22),1.45);col+=vec3(.9,.78,.48)*core*.5;float vign=smoothstep(1.28,.18,d);col*=vign;gl_FragColor=vec4(col,1.);}`;
  function compile(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const ur = gl.getUniformLocation(program, "r");
  const ut = gl.getUniformLocation(program, "t");
  const um = gl.getUniformLocation(program, "m");
  const start = performance.now();

  function draw() {
    const { w, h } = resize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(ur, w * DPR, h * DPR);
    gl.uniform1f(ut, reduced ? 0 : (performance.now() - start) / 1000);
    gl.uniform2f(um, state.pointer.x, state.pointer.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduced) requestAnimationFrame(draw);
  }
  draw();
  return true;
}

function selectRoute(q) {
  const categories = state.data.categories
    .map((category) => ({ kind: "分类", id: category.id, name: category.label, note: category.purpose, score: scoreCandidate(q, category, 0.12) }))
    .filter((item) => item.score > 0);
  const skills = state.data.skills
    .map((skill) => ({ kind: "主 skill", id: skill.id, name: skill.display || skill.name, note: skill.note || skill.route_status || "", score: scoreCandidate(q, skill, skill.routeStatus === "ready" ? 0.05 : 0) }))
    .filter((item) => item.score > 0);
  const packs = state.data.packs
    .map((pack) => ({ kind: "大包", id: pack.id, name: pack.name, note: pack.purpose, score: scoreCandidate(q, pack, 0.02) }))
    .filter((item) => item.score > 0);
  return [...categories, ...skills, ...packs].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 5);
}

function scoreCandidate(q, node, bias = 0) {
  const terms = q.split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const hay = textOf(node);
  const hits = terms.reduce((total, term) => total + (hay.includes(term) ? 1 : 0), 0);
  return hits ? Math.min(0.99, hits / terms.length + bias) : 0;
}

function recommendedForCategory(catId) {
  const skills = independentSkills(catId)
    .slice()
    .sort((a, b) => (a.routeStatus === "ready" ? -1 : 1) - (b.routeStatus === "ready" ? -1 : 1))
    .slice(0, 4);
  const packs = packSkills(catId).slice(0, 2);
  return { skills, packs };
}

function handleNode(node) {
  if (!node) return;
  if (node.type === "category" || node.type === "category-mini" || categoryById(node.id)) {
    setFocus(node.id);
    return;
  }
  detail(node);
}

function independentSkills(catId) {
  return state.data.skills.filter((skill) => skill.category === catId);
}

function packSkills(catId) {
  return state.data.packs.filter((pack) => pack.category === catId);
}

function categoryById(id) {
  return state.data.categories.find((category) => category.id === id);
}

function nodeById(id) {
  const category = state.data.categories.find((item) => item.id === id);
  if (category) return { ...category, type: "category" };
  return state.data.skills.find((item) => item.id === id) || state.data.packs.find((item) => item.id === id) || null;
}

function matchQuery(node) {
  const q = norm(state.q);
  return !q || textOf(node).includes(q);
}

function textOf(node) {
  return norm([
    node.id,
    node.name,
    node.display,
    node.label,
    node.category,
    node.short,
    node.purpose,
    node.note,
    node.description,
    node.trigger,
    node.partition,
    node.route_status,
    node.relationship,
    node.when_to_use,
    node.when_not_to_use,
    ...(node.tags || []),
    ...(node.route_terms || []),
    ...(node.trigger_terms || []),
    ...(node.representative_children || [])
  ].join(" "));
}

function resize(canvas) {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * DPR));
  canvas.height = Math.max(1, Math.floor(rect.height * DPR));
  return { w: rect.width, h: rect.height };
}

function ringPlace(items, cx, cy, radius, start = -Math.PI / 2) {
  const total = Math.max(1, items.length);
  return items.map((item, index) => {
    const angle = start + (index * Math.PI * 2) / total;
    return { item, a: angle, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

function drawHex(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = rot + (i * Math.PI * 2) / 6;
    const xx = x + Math.cos(angle) * r;
    const yy = y + Math.sin(angle) * r;
    if (i) ctx.lineTo(xx, yy);
    else ctx.moveTo(xx, yy);
  }
  ctx.closePath();
}

function routeStatusLabel(status) {
  if (status === "ready") return "自动";
  if (status === "manual-review") return "半自动";
  if (status === "needs-metadata") return "需补 metadata";
  return status || "未标注";
}

function shortLabel(label) {
  const text = String(label || "");
  if (/[\u4e00-\u9fff]/.test(text)) return text.slice(0, 4);
  return text
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function shortText(value, length = 96) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function slug(value) {
  return String(value || "pack")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function color(hex, alpha = 1) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#78efff");
  if (!match) return `rgba(120,239,255,${alpha})`;
  return `rgba(${parseInt(match[1], 16)},${parseInt(match[2], 16)},${parseInt(match[3], 16)},${alpha})`;
}

function colorMix(hex, alpha) {
  return color(hex, alpha);
}

function norm(value) {
  return String(value || "").toLowerCase();
}

function esc(value) {
  return String(value || "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
