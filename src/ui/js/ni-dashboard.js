//=====================================================================
// Network Insight (NI) - JavaScript: Dashboard
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let ready = null;
let retryMs = 5000;
let refreshMs = 300000;

const SVG_NS = "http://www.w3.org/2000/svg";
const PIE_RADIUS = 42;
const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

const DASHBOARD_RESOURCES = [
  {
    key: "cables",
    costKey: "cable",
    label: "Cables",
    shortLabel: "Cables",
    icon: "fa-plug",
    route: "cable",
  },
  {
    key: "ducts",
    costKey: "duct",
    label: "Ducts",
    shortLabel: "Ducts",
    icon: "fa-superpowers",
    route: "duct",
  },
  {
    key: "poles",
    costKey: "pole",
    label: "Poles",
    shortLabel: "Poles",
    icon: "fa-arrows-v",
    route: "pole",
  },
  {
    key: "nes",
    costKey: "ne",
    label: "Network Equipment",
    shortLabel: "NE",
    icon: "fa-server",
    route: "ne",
  },
  {
    key: "racks",
    costKey: "rack",
    label: "Racks",
    shortLabel: "Racks",
    icon: "fa-list-ol",
    route: "rack",
  },
  {
    key: "sites",
    costKey: "site",
    label: "Sites",
    shortLabel: "Sites",
    icon: "fa-building-o",
    route: "site",
  },
  {
    key: "services",
    costKey: "service",
    label: "Services",
    shortLabel: "Services",
    icon: "fa-tty",
    route: "service",
  },
  {
    key: "trenches",
    costKey: "trench",
    label: "Trenches",
    shortLabel: "Trenches",
    icon: "fa-arrows-h",
    route: "trench",
  },
];

const resourceState = new Map();
const resourceCardRefs = new Map();
const costTileRefs = new Map();

function toPercent(n, t) {
  try {
    if (t > 0) {
      return Math.round((n / t) * 100);
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

function toExactPercent(n, t) {
  if (!t || t <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (n / t) * 100));
}

function toInteger(s) {
  const parsed = Number.parseInt(s, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toDecimal(n, p = 2) {
  const parsed = Number.parseFloat(n);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return 0;
  }
  return Number(parsed.toFixed(p));
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat(undefined).format(toInteger(n));
  } catch (e) {
    return String(toInteger(n));
  }
}

function formatDistance(distance, unit) {
  const val = toDecimal(distance, 2);
  let numStr;
  try {
    numStr = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  } catch (e) {
    numStr = String(val);
  }
  const cleanUnit = unit && String(unit).trim() ? String(unit).trim() : "m";
  return numStr + " " + cleanUnit;
}

function getCurrencyConfig() {
  const clean = (val) => {
    if (val == null) return "";
    const s = String(val).trim();
    if (!s || s === "null" || s === "undefined") return "";
    return s;
  };
  return {
    name: clean(localStorage.getItem("ni.currencyName")),
    isoCode: clean(localStorage.getItem("ni.currencyIsoCode")),
    symbol: clean(localStorage.getItem("ni.currencySymbol")),
  };
}

function formatCurrency(amount, currency) {
  const val = toDecimal(amount, 2);
  const cfg = currency || getCurrencyConfig();
  if (cfg.symbol) {
    try {
      const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
      return cfg.symbol + formatted;
    } catch (e) {
      return cfg.symbol + val.toFixed(2);
    }
  }
  if (cfg.isoCode && /^[A-Za-z]{3}$/.test(cfg.isoCode)) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cfg.isoCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    } catch (e) {
      // Fallback below
    }
  }
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  } catch (e) {
    return val.toFixed(2);
  }
}

function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

function showDashTooltip(text, event) {
  const tip = document.getElementById("dashTooltip");
  if (!tip || !text) return;
  tip.textContent = text;
  tip.style.display = "block";
  positionDashTooltip(event);
}

function positionDashTooltip(event) {
  const tip = document.getElementById("dashTooltip");
  if (!tip || tip.style.display !== "block" || !event) return;
  const pad = 14;
  const rect = tip.getBoundingClientRect();
  let left = event.clientX + pad;
  let top = event.clientY + pad;
  if (left + rect.width > window.innerWidth - 8) {
    left = Math.max(8, event.clientX - rect.width - pad);
  }
  if (top + rect.height > window.innerHeight - 8) {
    top = Math.max(8, event.clientY - rect.height - pad);
  }
  tip.style.left = left + "px";
  tip.style.top = top + "px";
}

function hideDashTooltip() {
  const tip = document.getElementById("dashTooltip");
  if (tip) {
    tip.style.display = "none";
  }
}

function attachHoverTooltip(el, getTooltipText) {
  el.addEventListener("mouseenter", (e) => {
    const text =
      typeof getTooltipText === "function" ? getTooltipText() : getTooltipText;
    showDashTooltip(text, e);
  });
  el.addEventListener("mousemove", (e) => {
    positionDashTooltip(e);
  });
  el.addEventListener("mouseleave", () => {
    hideDashTooltip();
  });
}

function setLoadingState(status) {
  const dot = document.getElementById("dashStatusDot");
  const btn = document.getElementById("dashRefreshBtn");
  if (dot) {
    dot.classList.remove("is-loading", "is-error");
    if (status === "loading") dot.classList.add("is-loading");
    if (status === "error") dot.classList.add("is-error");
  }
  if (btn) {
    btn.classList.toggle("is-spinning", status === "loading");
  }
}

function navigateToResource(route) {
  if (typeof menuJump === "function") {
    menuJump(route);
  }
}

function buildResourceCards() {
  const grid = document.getElementById("resourcePieGrid");
  if (!grid || resourceCardRefs.size > 0) return;

  grid.textContent = "";

  for (const res of DASHBOARD_RESOURCES) {
    resourceState.set(res.key, { total: 0, active: 0, inactive: 0 });

    const card = document.createElement("article");
    card.className = "resource-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", res.label + " statistics");

    card.addEventListener("click", () => navigateToResource(res.route));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateToResource(res.route);
      }
    });

    // Header
    const head = document.createElement("div");
    head.className = "resource-card-head";

    const nameEl = document.createElement("div");
    nameEl.className = "resource-name";
    const iconEl = document.createElement("i");
    iconEl.className = "fa " + res.icon;
    iconEl.setAttribute("aria-hidden", "true");
    const titleSpan = document.createElement("span");
    titleSpan.textContent = res.label;
    nameEl.appendChild(iconEl);
    nameEl.appendChild(titleSpan);

    const totalBadge = document.createElement("span");
    totalBadge.className = "resource-total-badge";
    totalBadge.textContent = "0";

    head.appendChild(nameEl);
    head.appendChild(totalBadge);

    // Donut / Pie SVG
    const chartWrap = document.createElement("div");
    chartWrap.className = "resource-chart-wrap";

    const svg = createSvgEl("svg", {
      class: "resource-pie-svg",
      viewBox: "0 0 120 120",
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": res.label + " active vs inactive chart",
    });

    // Subtle track ring
    const trackRing = createSvgEl("circle", {
      cx: 60,
      cy: 60,
      r: PIE_RADIUS,
      fill: "none",
      stroke: "#1e293b",
      "stroke-width": 16,
    });
    svg.appendChild(trackRing);

    // Empty-state dashed ring
    const emptyRing = createSvgEl("circle", {
      cx: 60,
      cy: 60,
      r: PIE_RADIUS,
      fill: "none",
      stroke: "#334155",
      "stroke-width": 14,
      "stroke-dasharray": "5 4",
    });
    svg.appendChild(emptyRing);

    // Inactive slice (orange)
    const inactiveArc = createSvgEl("circle", {
      class: "pie-arc pie-arc-inactive",
      cx: 60,
      cy: 60,
      r: PIE_RADIUS,
      fill: "none",
      stroke: "#f97316",
      "stroke-width": 16,
      "stroke-dasharray": "0 " + PIE_CIRCUMFERENCE.toFixed(2),
      "stroke-dashoffset": "0",
      transform: "rotate(-90 60 60)",
    });
    inactiveArc.style.display = "none";
    svg.appendChild(inactiveArc);

    // Active slice (green)
    const activeArc = createSvgEl("circle", {
      class: "pie-arc pie-arc-active",
      cx: 60,
      cy: 60,
      r: PIE_RADIUS,
      fill: "none",
      stroke: "#10b981",
      "stroke-width": 16,
      "stroke-dasharray": "0 " + PIE_CIRCUMFERENCE.toFixed(2),
      "stroke-dashoffset": "0",
      transform: "rotate(-90 60 60)",
    });
    activeArc.style.display = "none";
    svg.appendChild(activeArc);

    // Inner backdrop circle for crisp center typography
    const innerCircle = createSvgEl("circle", {
      cx: 60,
      cy: 60,
      r: 31,
      fill: "rgba(15, 23, 42, 0.82)",
      stroke: "rgba(148, 163, 184, 0.12)",
      "stroke-width": 1,
    });
    svg.appendChild(innerCircle);

    // Center value text
    const centerVal = createSvgEl("text", {
      x: 60,
      y: 56,
      fill: "#f8fafc",
      "font-size": "18",
      "font-weight": "700",
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    centerVal.textContent = "0";
    svg.appendChild(centerVal);

    // Center subtitle text
    const centerSub = createSvgEl("text", {
      x: 60,
      y: 72,
      fill: "#94a3b8",
      "font-size": "8.5",
      "font-weight": "700",
      "letter-spacing": "0.8",
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    centerSub.textContent = "NO DATA";
    svg.appendChild(centerSub);

    chartWrap.appendChild(svg);

    // Footer breakdown
    const foot = document.createElement("div");
    foot.className = "resource-card-foot";

    const activeChip = document.createElement("span");
    activeChip.className = "stat-chip active";
    const activeDot = document.createElement("span");
    activeDot.className = "legend-swatch active";
    const activeLbl = document.createElement("span");
    activeLbl.className = "stat-chip-label";
    activeLbl.textContent = "Active";
    const activeVal = document.createElement("span");
    activeVal.className = "stat-chip-val";
    activeVal.textContent = "0";
    activeChip.appendChild(activeDot);
    activeChip.appendChild(activeLbl);
    activeChip.appendChild(activeVal);

    const inactiveChip = document.createElement("span");
    inactiveChip.className = "stat-chip inactive";
    const inactiveDot = document.createElement("span");
    inactiveDot.className = "legend-swatch inactive";
    const inactiveLbl = document.createElement("span");
    inactiveLbl.className = "stat-chip-label";
    inactiveLbl.textContent = "Inactive";
    const inactiveVal = document.createElement("span");
    inactiveVal.className = "stat-chip-val";
    inactiveVal.textContent = "0";
    inactiveChip.appendChild(inactiveDot);
    inactiveChip.appendChild(inactiveLbl);
    inactiveChip.appendChild(inactiveVal);

    foot.appendChild(activeChip);
    foot.appendChild(inactiveChip);

    card.appendChild(head);
    card.appendChild(chartWrap);
    card.appendChild(foot);
    grid.appendChild(card);

    const ref = {
      res,
      card,
      totalBadge,
      emptyRing,
      activeArc,
      inactiveArc,
      centerVal,
      centerSub,
      activeVal,
      inactiveVal,
    };
    resourceCardRefs.set(res.key, ref);

    // Interactive slice hover: update center readout & floating tooltip
    const setCenterSummary = (mode) => {
      const st = resourceState.get(res.key) || {
        total: 0,
        active: 0,
        inactive: 0,
      };
      if (st.total <= 0) {
        centerVal.textContent = "0";
        centerVal.setAttribute("fill", "#94a3b8");
        centerSub.textContent = "NO DATA";
        centerSub.setAttribute("fill", "#64748b");
        return;
      }
      if (mode === "inactive") {
        centerVal.textContent = toPercent(st.inactive, st.total) + "%";
        centerVal.setAttribute("fill", "#fb923c");
        centerSub.textContent = "INACTIVE";
        centerSub.setAttribute("fill", "#fdba74");
      } else {
        centerVal.textContent = toPercent(st.active, st.total) + "%";
        centerVal.setAttribute("fill", "#34d399");
        centerSub.textContent = "ACTIVE";
        centerSub.setAttribute("fill", "#94a3b8");
      }
    };

    activeArc.addEventListener("mouseenter", (e) => {
      const st = resourceState.get(res.key);
      if (!st || st.total <= 0) return;
      activeArc.setAttribute("stroke-width", "19");
      activeArc.setAttribute("stroke", "#34d399");
      activeArc.classList.add("is-hovered");
      setCenterSummary("active");
      const pct = toExactPercent(st.active, st.total).toFixed(1);
      showDashTooltip(
        res.label +
          " · Active\n" +
          formatNumber(st.active) +
          " of " +
          formatNumber(st.total) +
          " (" +
          pct +
          "%)\nClick card to open " +
          res.label,
        e
      );
    });
    activeArc.addEventListener("mousemove", positionDashTooltip);
    activeArc.addEventListener("mouseleave", () => {
      activeArc.setAttribute("stroke-width", "16");
      activeArc.setAttribute("stroke", "#10b981");
      activeArc.classList.remove("is-hovered");
      hideDashTooltip();
      setCenterSummary("active");
    });

    inactiveArc.addEventListener("mouseenter", (e) => {
      const st = resourceState.get(res.key);
      if (!st || st.total <= 0) return;
      inactiveArc.setAttribute("stroke-width", "19");
      inactiveArc.setAttribute("stroke", "#fb923c");
      inactiveArc.classList.add("is-hovered");
      setCenterSummary("inactive");
      const pct = toExactPercent(st.inactive, st.total).toFixed(1);
      showDashTooltip(
        res.label +
          " · Inactive\n" +
          formatNumber(st.inactive) +
          " of " +
          formatNumber(st.total) +
          " (" +
          pct +
          "%)\nClick card to open " +
          res.label,
        e
      );
    });
    inactiveArc.addEventListener("mousemove", positionDashTooltip);
    inactiveArc.addEventListener("mouseleave", () => {
      inactiveArc.setAttribute("stroke-width", "16");
      inactiveArc.setAttribute("stroke", "#f97316");
      inactiveArc.classList.remove("is-hovered");
      hideDashTooltip();
      setCenterSummary("active");
    });

    attachHoverTooltip(card, () => {
      const st = resourceState.get(res.key) || {
        total: 0,
        active: 0,
        inactive: 0,
      };
      if (st.total <= 0) {
        return res.label + "\nNo resources recorded yet\nClick to view";
      }
      return (
        res.label +
        "\nTotal: " +
        formatNumber(st.total) +
        "\nActive: " +
        formatNumber(st.active) +
        " (" +
        toExactPercent(st.active, st.total).toFixed(1) +
        "%)\nInactive: " +
        formatNumber(st.inactive) +
        " (" +
        toExactPercent(st.inactive, st.total).toFixed(1) +
        "%)"
      );
    });
  }
}

function updateResourceCard(key, total, active, inactive) {
  const safeTotal = Math.max(0, toInteger(total));
  const safeActive = Math.max(0, toInteger(active));
  const safeInactive = Math.max(0, toInteger(inactive));
  const denom = safeTotal > 0 ? safeTotal : safeActive + safeInactive;

  resourceState.set(key, {
    total: denom,
    active: safeActive,
    inactive: safeInactive,
  });

  const ref = resourceCardRefs.get(key);
  if (!ref) return;

  ref.totalBadge.textContent = formatNumber(denom);
  ref.activeVal.textContent = formatNumber(safeActive);
  ref.inactiveVal.textContent = formatNumber(safeInactive);

  if (denom <= 0) {
    ref.emptyRing.style.display = "";
    ref.activeArc.style.display = "none";
    ref.inactiveArc.style.display = "none";
    ref.activeArc.setAttribute(
      "stroke-dasharray",
      "0 " + PIE_CIRCUMFERENCE.toFixed(2)
    );
    ref.inactiveArc.setAttribute(
      "stroke-dasharray",
      "0 " + PIE_CIRCUMFERENCE.toFixed(2)
    );
    ref.centerVal.textContent = "0";
    ref.centerVal.setAttribute("fill", "#94a3b8");
    ref.centerSub.textContent = "NO DATA";
    ref.centerSub.setAttribute("fill", "#64748b");
    return;
  }

  ref.emptyRing.style.display = "none";
  ref.activeArc.style.display = safeActive > 0 ? "" : "none";
  ref.inactiveArc.style.display = safeInactive > 0 ? "" : "none";

  let activeRatio = Math.max(0, Math.min(1, safeActive / denom));
  let inactiveRatio = Math.max(0, Math.min(1, safeInactive / denom));

  const bothPresent = safeActive > 0 && safeInactive > 0;
  const gap = bothPresent ? 2.5 : 0;

  // Ensure very small non-zero slices remain visibly distinct
  if (bothPresent) {
    const minRatio = 0.025;
    if (activeRatio < minRatio) {
      activeRatio = minRatio;
      inactiveRatio = 1 - minRatio;
    } else if (inactiveRatio < minRatio) {
      inactiveRatio = minRatio;
      activeRatio = 1 - minRatio;
    }
  }

  const activeLen = Math.max(0, activeRatio * PIE_CIRCUMFERENCE - gap);
  const inactiveLen = Math.max(0, inactiveRatio * PIE_CIRCUMFERENCE - gap);

  ref.activeArc.setAttribute(
    "stroke-dasharray",
    activeLen.toFixed(2) + " " + PIE_CIRCUMFERENCE.toFixed(2)
  );
  ref.activeArc.setAttribute("stroke-dashoffset", "0");

  const inactiveOffset = -(activeRatio * PIE_CIRCUMFERENCE);
  ref.inactiveArc.setAttribute(
    "stroke-dasharray",
    inactiveLen.toFixed(2) + " " + PIE_CIRCUMFERENCE.toFixed(2)
  );
  ref.inactiveArc.setAttribute("stroke-dashoffset", inactiveOffset.toFixed(2));

  const activePct = toPercent(safeActive, denom);
  ref.centerVal.textContent = activePct + "%";
  ref.centerVal.setAttribute("fill", safeActive > 0 ? "#34d399" : "#fb923c");
  ref.centerSub.textContent = "ACTIVE";
  ref.centerSub.setAttribute("fill", "#94a3b8");
}

function buildCostTiles() {
  const grid = document.getElementById("costsGrid");
  if (!grid || costTileRefs.size > 0) return;

  grid.textContent = "";

  for (const res of DASHBOARD_RESOURCES) {
    const tile = document.createElement("div");
    tile.className = "cost-tile";
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    tile.addEventListener("click", () => navigateToResource(res.route));
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateToResource(res.route);
      }
    });

    const labelRow = document.createElement("div");
    labelRow.className = "cost-tile-label";
    const icon = document.createElement("i");
    icon.className = "fa " + res.icon;
    icon.setAttribute("aria-hidden", "true");
    const labelText = document.createElement("span");
    labelText.textContent = res.shortLabel;
    labelRow.appendChild(icon);
    labelRow.appendChild(labelText);

    const valEl = document.createElement("div");
    valEl.className = "cost-tile-val";
    valEl.textContent = "0.00";

    const barTrack = document.createElement("div");
    barTrack.className = "cost-tile-bar";
    const barFill = document.createElement("div");
    barFill.className = "cost-tile-bar-fill";
    barTrack.appendChild(barFill);

    tile.appendChild(labelRow);
    tile.appendChild(valEl);
    tile.appendChild(barTrack);
    grid.appendChild(tile);

    const ref = {
      res,
      tile,
      valEl,
      barFill,
      amount: 0,
      sharePct: 0,
      formatted: "0.00",
    };
    costTileRefs.set(res.costKey, ref);

    attachHoverTooltip(tile, () => {
      return (
        res.label +
        " Cost\n" +
        ref.formatted +
        " (" +
        ref.sharePct.toFixed(1) +
        "% of total)"
      );
    });
  }
}

function updatePlatformPills(data) {
  const container = document.getElementById("dashPlatformPills");
  if (!container) return;
  container.textContent = "";

  const pills = [];

  if (data?.alerts) {
    const avail = toInteger(data.alerts.available);
    const activeAlerts =
      toInteger(data.alerts.active?.callbacks) +
      toInteger(data.alerts.active?.publish) +
      toInteger(data.alerts.active?.notify) +
      toInteger(data.alerts.active?.workflow);
    pills.push({
      icon: "fa-bullhorn",
      text: "Alerts: " + formatNumber(activeAlerts) + "/" + formatNumber(avail),
      tip:
        "Alerts\nAvailable: " +
        formatNumber(avail) +
        "\nCallbacks: " +
        formatNumber(data.alerts.active?.callbacks) +
        "\nPublish: " +
        formatNumber(data.alerts.active?.publish) +
        "\nNotify: " +
        formatNumber(data.alerts.active?.notify) +
        "\nWorkflow: " +
        formatNumber(data.alerts.active?.workflow),
    });
  }

  if (data?.providers) {
    const totalProviders =
      toInteger(data.providers.email) +
      toInteger(data.providers.kafka) +
      toInteger(data.providers.map) +
      toInteger(data.providers.workflow);
    pills.push({
      icon: "fa-handshake-o",
      text: "Providers: " + formatNumber(totalProviders),
      tip:
        "Configured Providers\nEmail: " +
        formatNumber(data.providers.email) +
        "\nKafka: " +
        formatNumber(data.providers.kafka) +
        "\nMap: " +
        formatNumber(data.providers.map) +
        "\nWorkflow: " +
        formatNumber(data.providers.workflow),
    });
  }

  if (data?.queues) {
    const queueNames = ["alert", "fetch", "predict", "replication"];
    let totalPending = 0;
    let totalCompleted = 0;
    const lines = ["Processing Queues"];
    for (const q of queueNames) {
      if (data.queues[q]) {
        const p = toInteger(data.queues[q].pending);
        const c = toInteger(data.queues[q].completed);
        totalPending += p;
        totalCompleted += c;
        lines.push(
          q.charAt(0).toUpperCase() +
            q.slice(1) +
            ": " +
            formatNumber(p) +
            " pending · " +
            formatNumber(c) +
            " done"
        );
      }
    }
    if (lines.length > 1) {
      pills.push({
        icon: "fa-tasks",
        text:
          "Queues: " +
          formatNumber(totalPending) +
          " pending · " +
          formatNumber(totalCompleted) +
          " done",
        tip: lines.join("\n"),
      });
    }
  }

  for (const item of pills) {
    const pill = document.createElement("span");
    pill.className = "platform-pill";
    const icon = document.createElement("i");
    icon.className = "fa " + item.icon;
    icon.setAttribute("aria-hidden", "true");
    const span = document.createElement("span");
    span.textContent = item.text;
    pill.appendChild(icon);
    pill.appendChild(span);
    attachHoverTooltip(pill, item.tip);
    container.appendChild(pill);
  }
}

function updateMetricsAndCosts(data) {
  const currency = getCurrencyConfig();

  // Business metrics
  const premisesEl = document.getElementById("kpiPremisesPassed");
  if (premisesEl && data?.metrics?.premises != null) {
    premisesEl.textContent = formatNumber(data.metrics.premises.passed);
  }

  const trenchEl = document.getElementById("kpiTrenchCoverage");
  if (trenchEl && data?.metrics?.trench != null) {
    trenchEl.textContent = formatDistance(
      data.metrics.trench.distance,
      data.metrics.trench.unit
    );
  }

  const cableEl = document.getElementById("kpiCableCoverage");
  if (cableEl && data?.metrics?.cable != null) {
    cableEl.textContent = formatDistance(
      data.metrics.cable.distance,
      data.metrics.cable.unit
    );
  }

  // Currency badges
  const currencyLabel = [currency.name, currency.isoCode]
    .filter(Boolean)
    .join(" · ");
  const badgeEl = document.getElementById("costsCurrencyBadge");
  if (badgeEl) {
    badgeEl.textContent = currencyLabel || currency.symbol || "Default";
  }
  const subEl = document.getElementById("kpiCurrencySubtitle");
  if (subEl) {
    subEl.textContent = currencyLabel || "Configured currency";
  }

  // Costs breakdown
  const costObj = data?.metrics?.cost || {};
  let totalCost = 0;
  for (const res of DASHBOARD_RESOURCES) {
    totalCost += toDecimal(costObj[res.costKey], 2);
  }
  totalCost = toDecimal(totalCost, 2);

  const formattedTotal = formatCurrency(totalCost, currency);

  const kpiTotalEl = document.getElementById("kpiTotalCost");
  if (kpiTotalEl) {
    kpiTotalEl.textContent = formattedTotal;
  }

  const readoutEl = document.getElementById("costsTotalReadout");
  if (readoutEl) {
    readoutEl.textContent = "";
    readoutEl.appendChild(document.createTextNode("Total: "));
    const strong = document.createElement("strong");
    strong.textContent = formattedTotal;
    readoutEl.appendChild(strong);
  }

  for (const res of DASHBOARD_RESOURCES) {
    const ref = costTileRefs.get(res.costKey);
    if (!ref) continue;
    const val = toDecimal(costObj[res.costKey], 2);
    const share = totalCost > 0 ? (val / totalCost) * 100 : 0;
    const formatted = formatCurrency(val, currency);
    ref.amount = val;
    ref.sharePct = share;
    ref.formatted = formatted;
    ref.valEl.textContent = formatted;
    ref.barFill.style.width = Math.min(100, share).toFixed(1) + "%";
  }
}

function renderDashboardData(data) {
  let grandTotal = 0;
  let grandActive = 0;

  if (data?.resources) {
    for (const res of DASHBOARD_RESOURCES) {
      const entry = data.resources[res.key];
      const total = toInteger(entry?.total);
      const active = toInteger(entry?.active);
      const inactive = toInteger(entry?.inactive);
      updateResourceCard(res.key, total, active, inactive);
      grandTotal += total > 0 ? total : active + inactive;
      grandActive += active;
    }
  }

  const fleetEl = document.getElementById("dashFleetSummary");
  if (fleetEl) {
    const fleetPct = toPercent(grandActive, grandTotal);
    fleetEl.textContent =
      "Assets: " +
      formatNumber(grandTotal) +
      " · " +
      fleetPct +
      "% Active";
  }

  updateMetricsAndCosts(data);
  updatePlatformPills(data);

  const updatedEl = document.getElementById("dashLastUpdated");
  if (updatedEl) {
    const now = new Date();
    updatedEl.textContent = "Updated " + now.toLocaleTimeString();
  }
}

function fetchStats() {
  if (ready != null) {
    clearTimeout(ready);
    ready = null;
  }

  buildResourceCards();
  buildCostTiles();
  setLoadingState("loading");

  const gatewayUrl = localStorage.getItem("ni.gatewayUrl") || "";

  fetch(gatewayUrl + "/ui/statistic", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      if (data) {
        renderDashboardData(data);
      }
      setLoadingState("ok");
      ready = setTimeout(fetchStats, refreshMs);
    })
    .catch((e) => {
      console.error(e);
      setLoadingState("error");
      const updatedEl = document.getElementById("dashLastUpdated");
      if (updatedEl) {
        updatedEl.textContent = "Sync failed · retrying…";
      }
      ready = setTimeout(fetchStats, retryMs);
    });
}

try {
  buildResourceCards();
  buildCostTiles();
  fetchStats();
} catch (e) {
  console.error(e);
}
