//=====================================================================
// Network Insight (NI) - JavaScript: Service
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let serviceId = null;
let serviceRawPoints = [];
let point = null;
let serviceMetadataResizeObserver = null;

const SERVICE_SVG_NS = "http://www.w3.org/2000/svg";
const LAG_MEMBER_PALETTE = [
  "#38bdf8", // Member 1 - cyan
  "#22c55e", // Member 2 - green
  "#c084fc", // Member 3 - purple
  "#fb7185", // Member 4 - rose
  "#facc15", // Member 5 - yellow
  "#2dd4bf", // Member 6 - teal
  "#fb923c", // Member 7 - orange
  "#818cf8", // Member 8 - indigo
];

function createServiceSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SERVICE_SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function truncateSvgText(str, maxChars) {
  if (str == null) {
    return "";
  }
  const s = String(str);
  if (s.length <= maxChars) {
    return s;
  }
  return s.slice(0, Math.max(1, maxChars - 1)) + "…";
}

function getLagMemberColor(memberNum, fallbackColor = "#38bdf8") {
  const idx = toInteger(memberNum);
  if (idx <= 0) {
    return fallbackColor;
  }
  return LAG_MEMBER_PALETTE[(idx - 1) % LAG_MEMBER_PALETTE.length];
}

function getServiceTooltipElement() {
  let tooltip = document.getElementById("serviceHoverTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "serviceHoverTooltip";
    tooltip.setAttribute("role", "tooltip");
    Object.assign(tooltip.style, {
      position: "fixed",
      display: "none",
      pointerEvents: "none",
      zIndex: "9999",
      backgroundColor: "#0f172a",
      color: "#ffffff",
      border: "1px solid #94a3b8",
      borderRadius: "4px",
      padding: "6px 10px",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "12px",
      lineHeight: "1.35",
      whiteSpace: "pre-line",
      maxWidth: "420px",
      wordBreak: "break-word",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
    });
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function positionServiceTooltip(tooltip, event) {
  const offset = 12;
  let left = event.clientX + offset;
  let top = event.clientY + offset;
  const rect = tooltip.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - 8) {
    left = Math.max(8, event.clientX - rect.width - offset);
  }
  if (top + rect.height > window.innerHeight - 8) {
    top = Math.max(8, event.clientY - rect.height - offset);
  }
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function hideServiceTooltip() {
  const tooltip = document.getElementById("serviceHoverTooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function attachServiceHoverTip(targetEl, highlightEl, text, highlightColor = "#38bdf8") {
  const originalStroke = highlightEl ? highlightEl.getAttribute("stroke") : null;
  const originalStrokeWidth = highlightEl
    ? highlightEl.getAttribute("stroke-width")
    : null;
  targetEl.style.cursor = "pointer";
  targetEl.style.pointerEvents = "all";
  targetEl.addEventListener("mouseenter", (event) => {
    event.stopPropagation();
    const tooltip = getServiceTooltipElement();
    tooltip.textContent = text;
    tooltip.style.display = "block";
    positionServiceTooltip(tooltip, event);
    if (highlightEl) {
      highlightEl.setAttribute("stroke", highlightColor);
      highlightEl.setAttribute(
        "stroke-width",
        String(Math.max(2, Number(originalStrokeWidth || 1) + 0.9))
      );
    }
  });
  targetEl.addEventListener("mousemove", (event) => {
    event.stopPropagation();
    const tooltip = getServiceTooltipElement();
    if (tooltip.style.display === "block") {
      positionServiceTooltip(tooltip, event);
    }
  });
  targetEl.addEventListener("mouseleave", () => {
    hideServiceTooltip();
    if (highlightEl) {
      if (originalStroke != null) {
        highlightEl.setAttribute("stroke", originalStroke);
      }
      if (originalStrokeWidth != null) {
        highlightEl.setAttribute("stroke-width", originalStrokeWidth);
      }
    }
  });
}

function parseServiceNeRackUnits(slotPosition) {
  if (slotPosition == null) {
    return 1;
  }
  const slots = String(slotPosition)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (slots.length === 0) {
    return 1;
  }
  return Math.max(1, new Set(slots).size);
}

function getServicePortStyle(state, source, role) {
  const isPredicted = source === "predicted";
  let stroke = isPredicted ? "#ffff00" : "#cbd5e1";
  if (role === "ingress") {
    stroke = isPredicted ? "#ffff00" : "#38bdf8";
  } else if (role === "egress") {
    stroke = isPredicted ? "#ffff00" : "#f59e0b";
  } else if (role === "both") {
    stroke = isPredicted ? "#ffff00" : "#c084fc";
  }
  switch (state) {
    case "free":
      return { fill: "#008000", stroke };
    case "used":
      return { fill: "#000000", stroke };
    case "reserved":
      return { fill: "#808080", stroke };
    case "faulty":
      return { fill: "#ff0000", stroke };
    default:
      return { fill: "#1e293b", stroke };
  }
}

function resolveServiceType(data, neMap) {
  if (data.type != null && String(data.type).trim().length > 0) {
    return String(data.type);
  }
  const ingressLinks = Array.isArray(data.link?.ingress) ? data.link.ingress : [];
  const egressLinks = Array.isArray(data.link?.egress) ? data.link.egress : [];
  const techs = new Set();
  for (const link of ingressLinks.concat(egressLinks)) {
    const ne = neMap.get(link.neId);
    if (ne && Array.isArray(ne.ports)) {
      const matched = ne.ports.find(
        (p) =>
          p.name &&
          link.port &&
          p.name.toLowerCase() === link.port.toLowerCase()
      );
      if (matched?.technology) {
        techs.add(matched.technology);
      }
    }
  }
  if (techs.has("xdsl")) return "broadband (xDSL)";
  if (techs.has("coax")) return "coax / cable";
  if (techs.has("singleFiber") || techs.has("multiFiber") || techs.has("fiber")) {
    return "optical / fiber";
  }
  if (techs.has("ethernet")) {
    return data.lag && toInteger(data.lag.members) > 1 ? "ethernet (LAG)" : "ethernet";
  }
  return "unclassified";
}

function formatServiceDate(val) {
  if (val == null || String(val).trim() === "") {
    return "—";
  }
  const s = String(val).trim();
  if (/^\d{8}$/.test(s)) {
    return s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8);
  }
  return s;
}

function formatLinkVlanTag(link) {
  const parts = [];
  if (link.sVlanId != null && toInteger(link.sVlanId) > 0) {
    parts.push("S:" + toInteger(link.sVlanId));
  }
  if (link.cVlanId != null && toInteger(link.cVlanId) > 0) {
    parts.push("C:" + toInteger(link.cVlanId));
  }
  if (link.member != null && toInteger(link.member) > 0) {
    parts.push("M" + toInteger(link.member));
  }
  return parts.join(" ");
}

/**
 * Builds QinQ VLAN hierarchy: maps each outer sVlanId -> array of nested inner cVlanIds
 * (supporting multiple cVlanIds inside a single sVlanId, as well as standalone cVlanIds).
 */
function buildVlanHierarchy(ingressLinks, egressLinks) {
  const allLinks = ingressLinks.concat(egressLinks);
  const sVlanMap = new Map(); // sVlanId (number) -> { sVlanId, cVlans: Set<number>, ports: Set<string> }
  const allCVlans = new Set();

  for (const link of allLinks) {
    const cV = link.cVlanId != null ? toInteger(link.cVlanId) : 0;
    const sV = link.sVlanId != null ? toInteger(link.sVlanId) : 0;
    if (cV > 0) {
      allCVlans.add(cV);
    }
    if (sV > 0) {
      if (!sVlanMap.has(sV)) {
        sVlanMap.set(sV, { sVlanId: sV, cVlans: new Set(), ports: new Set() });
      }
      const bucket = sVlanMap.get(sV);
      if (link.port) bucket.ports.add(link.port);
      if (cV > 0) bucket.cVlans.add(cV);
    }
  }

  // If ingress carries cVlanIds and egress carries sVlanIds (typical QinQ push, e.g. service-GBR-1.json),
  // nest all ingress cVlanIds inside each outer sVlanId tunnel.
  const ingressCVlans = [
    ...new Set(
      ingressLinks
        .map((l) => (l.cVlanId != null ? toInteger(l.cVlanId) : 0))
        .filter((v) => v > 0)
    ),
  ].sort((a, b) => a - b);

  if (sVlanMap.size > 0 && ingressCVlans.length > 0) {
    for (const bucket of sVlanMap.values()) {
      if (bucket.cVlans.size === 0) {
        for (const cv of ingressCVlans) {
          bucket.cVlans.add(cv);
        }
      }
    }
  }

  const sVlans = Array.from(sVlanMap.values())
    .sort((a, b) => a.sVlanId - b.sVlanId)
    .map((b) => ({
      sVlanId: b.sVlanId,
      cVlans: Array.from(b.cVlans).sort((x, y) => x - y),
      ports: Array.from(b.ports),
    }));

  const orphanCVlans = Array.from(allCVlans)
    .filter((cv) => !sVlans.some((s) => s.cVlans.includes(cv)))
    .sort((a, b) => a - b);

  return { sVlans, orphanCVlans, allCVlans: Array.from(allCVlans).sort((a, b) => a - b) };
}

/**
 * Matches ingress and egress links per LAG group & member.
 * Returns structured member connection pairs so each LAG member connection can be rendered individually.
 */
function buildLagConnections(data, ingressLinks, egressLinks) {
  const hasLag =
    data.lag != null ||
    ingressLinks.some((l) => toInteger(l.member) > 0) ||
    egressLinks.some((l) => toInteger(l.member) > 0);
  const groupName = data.lag?.group || (hasLag ? "LAG" : null);
  const declaredMembers = data.lag?.members != null ? toInteger(data.lag.members) : 0;

  if (!hasLag) {
    return { hasLag: false, groupName: null, declaredMembers: 0, pairs: [] };
  }

  const pairs = [];
  const egressByMember = new Map();
  for (let ei = 0; ei < egressLinks.length; ei++) {
    const m = toInteger(egressLinks[ei].member) || 1;
    if (!egressByMember.has(m)) egressByMember.set(m, []);
    egressByMember.get(m).push({ index: ei, link: egressLinks[ei] });
  }

  const usedEgressIndices = new Set();

  for (let ii = 0; ii < ingressLinks.length; ii++) {
    const inLink = ingressLinks[ii];
    const inMember = toInteger(inLink.member) || 1;
    const exactMatches = egressByMember.get(inMember) || [];
    if (exactMatches.length > 0) {
      // Pair ingress member k with egress member k (1-to-1 when parallel, or all matching egress ports)
      const matched = exactMatches[ii % exactMatches.length];
      usedEgressIndices.add(matched.index);
      pairs.push({
        group: groupName,
        member: inMember,
        exactMemberMatch: true,
        ingressIndex: ii,
        ingress: inLink,
        egressIndex: matched.index,
        egress: matched.link,
      });
    } else if (egressLinks.length > 0) {
      // Ingress member hashed onto available LAG egress link (e.g. ingress M2 -> egress M1 in service-GBR-1.json)
      const fallbackIdx = ii % egressLinks.length;
      usedEgressIndices.add(fallbackIdx);
      pairs.push({
        group: groupName,
        member: inMember,
        exactMemberMatch: false,
        ingressIndex: ii,
        ingress: inLink,
        egressIndex: fallbackIdx,
        egress: egressLinks[fallbackIdx],
      });
    }
  }

  // Ensure any remaining egress links that weren't paired yet also get a visible member connection
  for (let ei = 0; ei < egressLinks.length; ei++) {
    if (!usedEgressIndices.has(ei) && ingressLinks.length > 0) {
      const outLink = egressLinks[ei];
      const outMember = toInteger(outLink.member) || 1;
      const inIdx = ei % ingressLinks.length;
      pairs.push({
        group: groupName,
        member: outMember,
        exactMemberMatch: toInteger(ingressLinks[inIdx].member) === outMember,
        ingressIndex: inIdx,
        ingress: ingressLinks[inIdx],
        egressIndex: ei,
        egress: outLink,
      });
    }
  }

  return {
    hasLag: true,
    groupName,
    declaredMembers: Math.max(
      declaredMembers,
      ...ingressLinks.map((l) => toInteger(l.member)),
      ...egressLinks.map((l) => toInteger(l.member))
    ),
    pairs,
  };
}

function findMatchedNePort(ne, portName) {
  if (!ne || !Array.isArray(ne.ports) || !portName) {
    return null;
  }
  const needle = String(portName).toLowerCase();
  return (
    ne.ports.find((p) => p.name && p.name.toLowerCase() === needle) || null
  );
}

function buildNeDeviceTooltip(neId, ne, site, fallbackCountry, roleLabel, source) {
  const lines = [];
  const host = ne?.host || neId;
  lines.push("NE: " + host + (roleLabel ? " (" + roleLabel + ")" : ""));
  if (ne?.vendor || ne?.model) {
    lines.push("Hardware: " + [ne.vendor, ne.model].filter(Boolean).join(" "));
  }
  if (ne?.mgmtIP) {
    lines.push("Mgmt IP: " + ne.mgmtIP);
  }
  const country = ne?.country || site?.country || fallbackCountry || "—";
  lines.push("Country: " + country);
  if (site?.reference || ne?.siteId) {
    lines.push("Site: " + (site?.reference || ne.siteId));
  }
  if (ne?.slotPosition) {
    lines.push(
      "Rack Slot(s): " +
        ne.slotPosition +
        " (" +
        parseServiceNeRackUnits(ne.slotPosition) +
        "U)"
    );
  }
  if (Array.isArray(ne?.ports)) {
    lines.push("Total Ports: " + ne.ports.length);
  }
  if (source === "predicted") {
    lines.push("Source: predicted");
  }
  lines.push("Click to open NE view");
  return lines.join("\n");
}

function buildPortTooltip(portObj, linkMeta, role, lagGroup, serviceRateStr, source) {
  const lines = [];
  const name = portObj?.name || linkMeta?.port || "Port";
  lines.push("Port: " + name + (role ? " (" + role.toUpperCase() + ")" : ""));
  if (portObj?.technology) {
    lines.push("Technology: " + portObj.technology);
  }
  if (portObj?.state) {
    lines.push("State: " + portObj.state);
  }
  if (portObj?.configuration?.rate != null && portObj?.configuration?.unit) {
    lines.push(
      "Port Rate: " + portObj.configuration.rate + " " + portObj.configuration.unit
    );
  }
  if (serviceRateStr) {
    lines.push("Service Rate: " + serviceRateStr);
  }
  if (portObj?.errorCount != null) {
    lines.push("Errors: " + toInteger(portObj.errorCount));
  }
  if (linkMeta?.sVlanId != null && toInteger(linkMeta.sVlanId) > 0) {
    lines.push("Outer S-VLAN: " + toInteger(linkMeta.sVlanId));
  }
  if (linkMeta?.cVlanId != null && toInteger(linkMeta.cVlanId) > 0) {
    lines.push("Inner C-VLAN: " + toInteger(linkMeta.cVlanId));
  }
  if (linkMeta?.member != null && toInteger(linkMeta.member) > 0) {
    lines.push(
      "LAG: " + (lagGroup || "LAG") + " · Member " + toInteger(linkMeta.member)
    );
  }
  if (portObj?.macAddress) {
    lines.push("MAC: " + portObj.macAddress);
  }
  if (source === "predicted") {
    lines.push("Source: predicted");
  }
  return lines.join("\n");
}

/**
 * Draws an outer S-VLAN container visually encapsulating one or more inner C-VLAN badges (IEEE 802.1ad QinQ).
 */
function drawNestedVlanBadge(svg, x, y, sVlanId, cVlanIds, opts = {}) {
  const {
    rateStr = "",
    compact = false,
    tooltip = "",
  } = opts;
  const g = createServiceSvgElement("g");
  const titleEl = createServiceSvgElement("title");
  titleEl.textContent = tooltip;
  g.appendChild(titleEl);

  const innerList = Array.isArray(cVlanIds) ? cVlanIds : [];
  const cPillW = compact ? 36 : 56;
  const cPillH = compact ? 13 : 16;
  const cGap = 4;
  const innerRowW =
    innerList.length > 0
      ? innerList.length * cPillW + (innerList.length - 1) * cGap
      : 48;
  const headerStr =
    sVlanId != null
      ? (compact ? "S:" + sVlanId : "S-VLAN " + sVlanId + (rateStr ? " · " + rateStr : ""))
      : "C-VLAN";
  const minHeaderW = headerStr.length * (compact ? 5.6 : 6.1) + 14;
  const boxW = Math.max(minHeaderW, innerRowW + 14);
  const boxH = compact ? 32 : 42;

  // Outer S-VLAN encapsulation box
  const outerRect = createServiceSvgElement("rect", {
    x: x.toFixed(1),
    y: y.toFixed(1),
    width: boxW.toFixed(1),
    height: boxH.toFixed(1),
    rx: 5,
    fill: sVlanId != null ? "rgba(245, 158, 11, 0.14)" : "rgba(56, 189, 248, 0.12)",
    stroke: sVlanId != null ? "#f59e0b" : "#38bdf8",
    "stroke-width": 1.4,
  });
  g.appendChild(outerRect);

  const headerText = createServiceSvgElement("text", {
    x: (x + boxW / 2).toFixed(1),
    y: (y + (compact ? 8.5 : 11)).toFixed(1),
    fill: sVlanId != null ? "#fcd34d" : "#7dd3fc",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": compact ? "8" : "9.5",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  headerText.textContent = headerStr;
  g.appendChild(headerText);

  // Inner nested C-VLAN pill(s) drawn INSIDE the outer S-VLAN container
  if (innerList.length > 0) {
    const startX = x + (boxW - innerRowW) / 2;
    const innerY = y + (compact ? 16 : 21);
    for (let i = 0; i < innerList.length; i++) {
      const cv = innerList[i];
      const cx = startX + i * (cPillW + cGap);
      const cGroup = createServiceSvgElement("g");
      const cTip =
        (sVlanId != null ? "S-VLAN " + sVlanId + " ⊃ " : "") +
        "C-VLAN " +
        cv +
        (rateStr ? "\nService Rate: " + rateStr : "");
      const cTitle = createServiceSvgElement("title");
      cTitle.textContent = cTip;
      cGroup.appendChild(cTitle);

      const cRect = createServiceSvgElement("rect", {
        x: cx.toFixed(1),
        y: innerY.toFixed(1),
        width: cPillW,
        height: cPillH,
        rx: 3,
        fill: "#0c4a6e",
        stroke: "#38bdf8",
        "stroke-width": 1,
      });
      cGroup.appendChild(cRect);

      const cText = createServiceSvgElement("text", {
        x: (cx + cPillW / 2).toFixed(1),
        y: (innerY + cPillH / 2).toFixed(1),
        fill: "#e0f2fe",
        "font-family": "'Courier New', Courier, monospace",
        "font-size": compact ? "7.5" : "8.5",
        "font-weight": "bold",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "pointer-events": "none",
      });
      cText.textContent = compact ? "C:" + cv : "C-VLAN " + cv;
      cGroup.appendChild(cText);

      attachServiceHoverTip(cGroup, cRect, cTip, "#7dd3fc");
      g.appendChild(cGroup);
    }
  } else if (sVlanId != null) {
    const emptyText = createServiceSvgElement("text", {
      x: (x + boxW / 2).toFixed(1),
      y: (y + (compact ? 22 : 28)).toFixed(1),
      fill: "#94a3b8",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "8",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "pointer-events": "none",
    });
    emptyText.textContent = "(untagged inner)";
    g.appendChild(emptyText);
  }

  attachServiceHoverTip(outerRect, outerRect, tooltip || headerStr, "#fcd34d");
  svg.appendChild(g);
  return { x, y, width: boxW, height: boxH };
}

/**
 * Draws a compact Juniper MX240-inspired NE switch chassis (matching ni-ne.js)
 * inside the service topology SVG, highlighting active ingress & egress ports.
 */
function drawMiniNeChassis(svg, opts) {
  const {
    x,
    y,
    width,
    neId,
    ne,
    site,
    fallbackCountry,
    roleLabel,
    ingressPorts,
    egressPorts,
    lagGroup,
    serviceRateStr,
    source,
    rootUrl,
  } = opts;

  const isPredicted = source === "predicted";
  const rackUnits = parseServiceNeRackUnits(ne?.slotPosition);
  const neCountry = ne?.country || site?.country || fallbackCountry || "";
  const earW = 12;
  const bodyX = x + earW;
  const bodyW = width - earW * 2;
  const headerH = 26;
  const ventH = 8;

  const ingressByName = new Map();
  for (const l of ingressPorts) {
    if (l.port) ingressByName.set(l.port.toLowerCase(), l);
  }
  const egressByName = new Map();
  for (const l of egressPorts) {
    if (l.port) egressByName.set(l.port.toLowerCase(), l);
  }

  let displayPorts = [];
  if (ne && Array.isArray(ne.ports) && ne.ports.length > 0) {
    displayPorts = ne.ports.map((p, idx) => ({
      index: idx + 1,
      port: p,
      name: p.name || "Port " + (idx + 1),
    }));
  } else {
    const seen = new Set();
    const allLinks = ingressPorts.concat(egressPorts);
    let idx = 1;
    for (const l of allLinks) {
      const key = (l.port || "port-" + idx).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        displayPorts.push({
          index: idx++,
          port: { name: l.port, state: "used", technology: "ethernet", errorCount: 0 },
          name: l.port,
        });
      }
    }
  }

  const maxCols = Math.min(8, Math.max(4, displayPorts.length));
  const rows = Math.max(1, Math.ceil(displayPorts.length / maxCols));
  const portCellH = 20;
  const portGapY = 4;
  const bayPadY = 6;
  const minBayH = rows * portCellH + Math.max(0, rows - 1) * portGapY + bayPadY * 2;
  const uScaledH = Math.max(78, rackUnits * 42);
  const height = Math.max(uScaledH, headerH + minBayH + ventH + 8);
  const bayTop = y + headerH + 3;
  const bayH = height - headerH - ventH - 6;

  const linkEl = createServiceSvgElement("a", {
    href:
      rootUrl +
      "/ne/" +
      neId +
      (neCountry ? "?country=" + neCountry : ""),
    target: "_self",
  });
  const neGroup = createServiceSvgElement("g", { class: "service-ne-node" });
  const neTip = buildNeDeviceTooltip(neId, ne, site, fallbackCountry, roleLabel, source);
  const neTitle = createServiceSvgElement("title");
  neTitle.textContent = neTip;
  neGroup.appendChild(neTitle);

  // Left & Right 19" rack-mount ears scaled by rackUnits
  for (const ex of [x, x + width - earW]) {
    neGroup.appendChild(
      createServiceSvgElement("rect", {
        x: ex.toFixed(1),
        y: (y + 1).toFixed(1),
        width: earW,
        height: (height - 2).toFixed(1),
        rx: 2,
        fill: "#334155",
        stroke: "#64748b",
        "stroke-width": 1,
      })
    );
    const uSpan = (height - 10) / rackUnits;
    for (let u = 0; u < rackUnits; u++) {
      const uy = y + 5 + u * uSpan;
      for (const hy of [uy + uSpan * 0.28, uy + uSpan * 0.72]) {
        neGroup.appendChild(
          createServiceSvgElement("rect", {
            x: (ex + 3).toFixed(1),
            y: (hy - 2).toFixed(1),
            width: earW - 6,
            height: 4,
            rx: 2,
            fill: "#0f172a",
            stroke: "#94a3b8",
            "stroke-width": 0.6,
          })
        );
      }
    }
  }

  // Main NE enclosure
  const chassisRect = createServiceSvgElement("rect", {
    x: bodyX.toFixed(1),
    y: (y + 1).toFixed(1),
    width: bodyW.toFixed(1),
    height: (height - 2).toFixed(1),
    rx: 3,
    fill: "#1e293b",
    stroke: isPredicted ? "#ffff00" : "#94a3b8",
    "stroke-width": isPredicted ? 2 : 1.5,
  });
  neGroup.appendChild(chassisRect);

  // Header bezel (matching ni-ne.js: model left, centered host, NU badge right)
  neGroup.appendChild(
    createServiceSvgElement("rect", {
      x: (bodyX + 3).toFixed(1),
      y: (y + 4).toFixed(1),
      width: (bodyW - 6).toFixed(1),
      height: (headerH - 4).toFixed(1),
      rx: 1.5,
      fill: "#0f172a",
      stroke: "#334155",
      "stroke-width": 0.8,
    })
  );
  neGroup.appendChild(
    createServiceSvgElement("rect", {
      x: (bodyX + 3).toFixed(1),
      y: (y + 4).toFixed(1),
      width: 4,
      height: (headerH - 4).toFixed(1),
      rx: 1,
      fill: isPredicted ? "#ffff00" : "#25b09b",
    })
  );

  const modelText = createServiceSvgElement("text", {
    x: (bodyX + 10).toFixed(1),
    y: (y + 4 + (headerH - 4) / 2).toFixed(1),
    fill: "#38bdf8",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8.5",
    "font-weight": "bold",
    "dominant-baseline": "central",
  });
  modelText.textContent = truncateSvgText(ne?.model || "NE", 10);
  neGroup.appendChild(modelText);

  const hostText = createServiceSvgElement("text", {
    x: (bodyX + bodyW / 2 + 8).toFixed(1),
    y: (y + 4 + (headerH - 4) / 2).toFixed(1),
    fill: "#f8fafc",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "9",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
  });
  hostText.textContent = truncateSvgText(ne?.host || neId, 15);
  neGroup.appendChild(hostText);

  // NU badge top-right
  const uBadgeW = 24;
  const uBadgeX = bodyX + bodyW - uBadgeW - 6;
  neGroup.appendChild(
    createServiceSvgElement("rect", {
      x: uBadgeX.toFixed(1),
      y: (y + 8).toFixed(1),
      width: uBadgeW,
      height: 14,
      rx: 2,
      fill: "#1e293b",
      stroke: "#475569",
      "stroke-width": 0.8,
    })
  );
  const uBadgeText = createServiceSvgElement("text", {
    x: (uBadgeX + uBadgeW / 2).toFixed(1),
    y: (y + 15).toFixed(1),
    fill: "#cbd5e1",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
  });
  uBadgeText.textContent = rackUnits + "U";
  neGroup.appendChild(uBadgeText);

  // Recessed port bay faceplate
  neGroup.appendChild(
    createServiceSvgElement("rect", {
      x: (bodyX + 5).toFixed(1),
      y: bayTop.toFixed(1),
      width: (bodyW - 10).toFixed(1),
      height: bayH.toFixed(1),
      rx: 1.5,
      fill: "#141d2e",
      stroke: "#475569",
      "stroke-width": 0.9,
    })
  );

  const portAnchors = new Map();
  const innerLeft = bodyX + 12;
  const innerW = bodyW - 24;
  const cols = Math.ceil(displayPorts.length / rows);
  const portGapX = cols > 6 ? 3 : 5;
  const portW = Math.min(26, Math.max(14, (innerW - Math.max(0, cols - 1) * portGapX) / cols));
  const portH = Math.min(20, Math.max(14, (bayH - bayPadY * 2 - Math.max(0, rows - 1) * portGapY) / rows));
  const totalW = cols * portW + Math.max(0, cols - 1) * portGapX;
  const totalH = rows * portH + Math.max(0, rows - 1) * portGapY;
  const startX = innerLeft + Math.max(0, (innerW - totalW) / 2);
  const startY = bayTop + Math.max(bayPadY, (bayH - totalH) / 2);

  for (let i = 0; i < displayPorts.length; i++) {
    const item = displayPorts[i];
    const key = item.name.toLowerCase();
    const inMeta = ingressByName.get(key);
    const outMeta = egressByName.get(key);
    const role =
      inMeta && outMeta ? "both" : inMeta ? "ingress" : outMeta ? "egress" : null;

    const rIdx = Math.floor(i / cols);
    const cIdx = i % cols;
    const px = startX + cIdx * (portW + portGapX);
    const py = startY + rIdx * (portH + portGapY);

    portAnchors.set(key, {
      left: { x: x, y: py + portH / 2 },
      right: { x: x + width, y: py + portH / 2 },
      top: { x: px + portW / 2, y: py },
      bottom: { x: px + portW / 2, y: py + portH },
      center: { x: px + portW / 2, y: py + portH / 2 },
    });

    const pStyle = getServicePortStyle(item.port.state, source, role);
    const pGroup = createServiceSvgElement("g");
    const pTip = buildPortTooltip(
      item.port,
      inMeta || outMeta || null,
      role,
      lagGroup,
      serviceRateStr,
      source
    );
    const pTitle = createServiceSvgElement("title");
    pTitle.textContent = pTip;
    pGroup.appendChild(pTitle);

    const pRect = createServiceSvgElement("rect", {
      x: px.toFixed(1),
      y: py.toFixed(1),
      width: portW.toFixed(1),
      height: portH.toFixed(1),
      rx: 2,
      fill: pStyle.fill,
      stroke: pStyle.stroke,
      "stroke-width": role ? 2 : 0.9,
      opacity: role ? "1" : "0.5",
    });
    pGroup.appendChild(pRect);

    const tabW = Math.max(4, portW * 0.34);
    pGroup.appendChild(
      createServiceSvgElement("rect", {
        x: (px + (portW - tabW) / 2).toFixed(1),
        y: (py + 1.2).toFixed(1),
        width: tabW.toFixed(1),
        height: 2.4,
        fill: "rgba(255,255,255,0.3)",
        "pointer-events": "none",
      })
    );

    const pLabel = createServiceSvgElement("text", {
      x: (px + portW / 2).toFixed(1),
      y: (py + portH * 0.62).toFixed(1),
      fill: "#ffffff",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": portW >= 20 ? "8.5" : "7.5",
      "font-weight": role ? "bold" : "normal",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "pointer-events": "none",
    });
    pLabel.textContent = String(item.index);
    pGroup.appendChild(pLabel);

    attachServiceHoverTip(pGroup, pRect, pTip, "#38bdf8");
    neGroup.appendChild(pGroup);
  }

  // Bottom vent strip
  neGroup.appendChild(
    createServiceSvgElement("rect", {
      x: (bodyX + 5).toFixed(1),
      y: (y + height - ventH - 2).toFixed(1),
      width: (bodyW - 10).toFixed(1),
      height: (ventH - 1).toFixed(1),
      rx: 1,
      fill: "#0f172a",
      stroke: "#334155",
      "stroke-width": 0.6,
    })
  );

  attachServiceHoverTip(chassisRect, chassisRect, neTip, "#38bdf8");
  linkEl.appendChild(neGroup);
  svg.appendChild(linkEl);

  return {
    x,
    y,
    width,
    height,
    leftAnchor: { x, y: y + height / 2 },
    rightAnchor: { x: x + width, y: y + height / 2 },
    portAnchors,
  };
}

function drawCurvedLink(svg, x1, y1, x2, y2, opts = {}) {
  const {
    color = "#94a3b8",
    strokeWidth = 2,
    dashed = false,
    label = null,
    tooltip = "",
    highlightColor = "#38bdf8",
    curveOffsetY = 0,
  } = opts;
  const dx = Math.max(22, Math.abs(x2 - x1) * 0.45);
  const pathD =
    "M " +
    x1.toFixed(1) +
    " " +
    y1.toFixed(1) +
    " C " +
    (x1 + dx).toFixed(1) +
    " " +
    (y1 + curveOffsetY).toFixed(1) +
    ", " +
    (x2 - dx).toFixed(1) +
    " " +
    (y2 + curveOffsetY).toFixed(1) +
    ", " +
    x2.toFixed(1) +
    " " +
    y2.toFixed(1);

  const g = createServiceSvgElement("g");
  if (tooltip) {
    const titleEl = createServiceSvgElement("title");
    titleEl.textContent = tooltip;
    g.appendChild(titleEl);
  }

  const hitPath = createServiceSvgElement("path", {
    d: pathD,
    fill: "none",
    stroke: "transparent",
    "stroke-width": 12,
  });
  const visPath = createServiceSvgElement("path", {
    d: pathD,
    fill: "none",
    stroke: color,
    "stroke-width": strokeWidth,
    "stroke-linecap": "round",
    "stroke-dasharray": dashed ? "5 4" : "none",
  });
  g.appendChild(visPath);
  g.appendChild(hitPath);

  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + curveOffsetY * 0.72 - 7;
    const shortLbl = truncateSvgText(label, 14);
    const lblW = Math.max(32, shortLbl.length * 5.6 + 8);
    g.appendChild(
      createServiceSvgElement("rect", {
        x: (mx - lblW / 2).toFixed(1),
        y: (my - 6.5).toFixed(1),
        width: lblW.toFixed(1),
        height: 13,
        rx: 3,
        fill: "#0f172a",
        stroke: color,
        "stroke-width": 0.8,
        "pointer-events": "none",
      })
    );
    const t = createServiceSvgElement("text", {
      x: mx.toFixed(1),
      y: my.toFixed(1),
      fill: "#e2e8f0",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "8",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "pointer-events": "none",
    });
    t.textContent = shortLbl;
    g.appendChild(t);
  }

  if (tooltip) {
    attachServiceHoverTip(g, visPath, tooltip, highlightColor);
  }
  svg.appendChild(g);
}

/**
 * Draws the standard telecom LAG oval bundle indicator wrapping a set of parallel member links.
 */
function drawLagBundleRing(svg, cx, topY, bottomY, groupName, memberCount, rateStr, tooltip) {
  const rx = 9;
  const ry = Math.max(18, (bottomY - topY) / 2 + 12);
  const cy = (topY + bottomY) / 2;
  const g = createServiceSvgElement("g");
  const titleEl = createServiceSvgElement("title");
  titleEl.textContent = tooltip;
  g.appendChild(titleEl);

  const ring = createServiceSvgElement("ellipse", {
    cx: cx.toFixed(1),
    cy: cy.toFixed(1),
    rx: rx.toFixed(1),
    ry: ry.toFixed(1),
    fill: "rgba(167, 139, 250, 0.08)",
    stroke: "#a78bfa",
    "stroke-width": 1.6,
    "stroke-dasharray": "4 2",
  });
  g.appendChild(ring);

  const tagStr = truncateSvgText(groupName + " (" + memberCount + "x)", 12);
  const tagW = tagStr.length * 5.6 + 10;
  const tagY = cy - ry - 11;
  g.appendChild(
    createServiceSvgElement("rect", {
      x: (cx - tagW / 2).toFixed(1),
      y: (tagY - 6.5).toFixed(1),
      width: tagW.toFixed(1),
      height: 13,
      rx: 3,
      fill: "#1e1b4b",
      stroke: "#a78bfa",
      "stroke-width": 0.9,
      "pointer-events": "none",
    })
  );
  const tagText = createServiceSvgElement("text", {
    x: cx.toFixed(1),
    y: tagY.toFixed(1),
    fill: "#e9d5ff",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  tagText.textContent = tagStr;
  g.appendChild(tagText);

  attachServiceHoverTip(g, ring, tooltip, "#c4b5fd");
  svg.appendChild(g);
}

function drawServiceTopology(container, data, neMap, siteMap, source) {
  hideServiceTooltip();
  const isPredicted = source === "predicted";
  const rootUrl = localStorage.getItem("ni.rootUrl") || "";
  const ingressLinks = Array.isArray(data.link?.ingress) ? data.link.ingress : [];
  const egressLinks = Array.isArray(data.link?.egress) ? data.link.egress : [];
  const serviceType = resolveServiceType(data, neMap);
  const serviceRateStr =
    (data.rate != null ? data.rate : 0) + " " + (data.unit || "Gbps");

  const vlanHierarchy = buildVlanHierarchy(ingressLinks, egressLinks);
  const lagInfo = buildLagConnections(data, ingressLinks, egressLinks);

  // Collect unique NEs by role
  const ingressNeIds = [...new Set(ingressLinks.map((l) => l.neId).filter(Boolean))];
  const egressNeIds = [...new Set(egressLinks.map((l) => l.neId).filter(Boolean))];
  const sharedNeSet = new Set(ingressNeIds.filter((id) => egressNeIds.includes(id)));
  const isSingleStage =
    ingressNeIds.length > 0 &&
    egressNeIds.length > 0 &&
    ingressNeIds.length === egressNeIds.length &&
    ingressNeIds.every((id) => sharedNeSet.has(id));

  const getNeCountry = (id) => {
    const ne = neMap.get(id);
    const site = ne?.siteId ? siteMap.get(ne.siteId) : null;
    return ne?.country || site?.country || data.country || "N/A";
  };

  // Layout geometry
  const bannerH = 58;
  const hasVlanPanel =
    vlanHierarchy.sVlans.length > 0 || vlanHierarchy.orphanCVlans.length > 0;
  const vlanStripH = hasVlanPanel ? 68 : 0;
  const padX = 16;
  const neWidth = isSingleStage ? 250 : 216;
  const customerW = 122;
  const portNodeW = 122;
  const nextHopW = 122;

  const maxPortsCol = Math.max(1, ingressLinks.length, egressLinks.length);
  const maxNeCol = Math.max(1, ingressNeIds.length, egressNeIds.length);
  const pillH = 36;
  const pillGap = 12;
  const contentH = Math.max(
    260,
    maxPortsCol * (pillH + pillGap) + 86,
    maxNeCol * 130 + 90
  );
  const svgW = isSingleStage ? 920 : 980;
  const svgH = bannerH + contentH + vlanStripH + 28;

  const svg = createServiceSvgElement("svg", {
    viewBox: "0 0 " + svgW + " " + svgH,
    role: "img",
    "aria-label":
      "Service Topology " + (data.reference || data.serviceId || ""),
    class: "service-topology-svg",
  });
  svg.style.width = "100%";
  svg.style.maxWidth = svgW + "px";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.margin = "0 auto";
  svg.addEventListener("mouseleave", hideServiceTooltip);

  // Outer canvas background
  svg.appendChild(
    createServiceSvgElement("rect", {
      x: 2,
      y: 2,
      width: svgW - 4,
      height: svgH - 4,
      rx: 8,
      fill: "#0f172a",
      stroke: isPredicted ? "#ffff00" : "#334155",
      "stroke-width": isPredicted ? 2 : 1.5,
    })
  );

  // Top Service Banner (Reference, Service Type, Rate/Unit, LAG, Commissioned/Decommissioned)
  const bannerRect = createServiceSvgElement("rect", {
    x: 8,
    y: 8,
    width: svgW - 16,
    height: bannerH - 8,
    rx: 5,
    fill: "#1e293b",
    stroke: "#475569",
    "stroke-width": 1,
  });
  svg.appendChild(bannerRect);

  svg.appendChild(
    createServiceSvgElement("rect", {
      x: 8,
      y: 8,
      width: 5,
      height: bannerH - 8,
      rx: 2,
      fill: isPredicted ? "#ffff00" : "#25b09b",
    })
  );

  const fullRef = data.reference || data.serviceId || "Service";
  const refTitle = createServiceSvgElement("text", {
    x: 22,
    y: 24,
    fill: "#f8fafc",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "13",
    "font-weight": "bold",
    "dominant-baseline": "central",
  });
  refTitle.textContent = truncateSvgText(fullRef, 42);
  svg.appendChild(refTitle);

  const subMetaFull =
    "Type: " +
    serviceType +
    "  |  Rate: " +
    serviceRateStr +
    (lagInfo.hasLag
      ? "  |  " + lagInfo.groupName + " (" + lagInfo.declaredMembers + " members)"
      : "");
  const subMeta = createServiceSvgElement("text", {
    x: 22,
    y: 43,
    fill: "#94a3b8",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "10",
    "dominant-baseline": "central",
  });
  subMeta.textContent = truncateSvgText(subMetaFull, 66);
  svg.appendChild(subMeta);

  const isDecommissioned =
    data.decommissioned != null && String(data.decommissioned).trim() !== "";
  const statusLabel = isDecommissioned
    ? "DECOMMISSIONED"
    : isPredicted
      ? "PREDICTED"
      : "ACTIVE";
  const statusFill = isDecommissioned
    ? "#991b1b"
    : isPredicted
      ? "#854d0e"
      : "#166534";
  const statusStroke = isDecommissioned
    ? "#f87171"
    : isPredicted
      ? "#ffff00"
      : "#4ade80";

  const statusW = isDecommissioned ? 112 : 76;
  const statusX = svgW - statusW - 18;
  svg.appendChild(
    createServiceSvgElement("rect", {
      x: statusX,
      y: 14,
      width: statusW,
      height: 18,
      rx: 3,
      fill: statusFill,
      stroke: statusStroke,
      "stroke-width": 1,
    })
  );
  const statusText = createServiceSvgElement("text", {
    x: statusX + statusW / 2,
    y: 23,
    fill: "#ffffff",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "9.5",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
  });
  statusText.textContent = statusLabel;
  svg.appendChild(statusText);

  const datesText = createServiceSvgElement("text", {
    x: svgW - 18,
    y: 44,
    fill: "#cbd5e1",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "9.5",
    "text-anchor": "end",
    "dominant-baseline": "central",
  });
  datesText.textContent =
    "Comm: " +
    formatServiceDate(data.commissioned) +
    (isDecommissioned
      ? "  |  Decomm: " + formatServiceDate(data.decommissioned)
      : "");
  svg.appendChild(datesText);

  const bannerTip = [
    "Service Reference: " + fullRef,
    "Service ID: " + (data.serviceId || "—"),
    "Service Type: " + serviceType,
    "Rate: " + serviceRateStr,
    lagInfo.hasLag
      ? "LAG: " + lagInfo.groupName + " (" + lagInfo.declaredMembers + " members)"
      : null,
    "Country: " + (data.country || "—"),
    "Commissioned: " + formatServiceDate(data.commissioned),
    "Decommissioned: " + formatServiceDate(data.decommissioned),
    "Source: " + source,
  ]
    .filter(Boolean)
    .join("\n");
  attachServiceHoverTip(bannerRect, bannerRect, bannerTip, "#38bdf8");

  const bodyTop = bannerH + 14;
  const bodyCenterY = bodyTop + contentH / 2;

  // Dashed Country Boundary helper
  const drawCountryBoundary = (bx, by, bw, bh, countryCode, sites, accentColor) => {
    const g = createServiceSvgElement("g");
    const tipLines = [
      "Country Boundary: " + countryCode,
      sites.length > 0 ? "Sites: " + sites.join(", ") : "Service Country Zone",
    ];
    const titleEl = createServiceSvgElement("title");
    titleEl.textContent = tipLines.join("\n");
    g.appendChild(titleEl);

    const rect = createServiceSvgElement("rect", {
      x: bx.toFixed(1),
      y: by.toFixed(1),
      width: bw.toFixed(1),
      height: bh.toFixed(1),
      rx: 8,
      fill:
        accentColor === "#f59e0b"
          ? "rgba(245, 158, 11, 0.05)"
          : "rgba(56, 189, 248, 0.05)",
      stroke: accentColor,
      "stroke-width": 1.6,
      "stroke-dasharray": "8 5",
    });
    g.appendChild(rect);

    const badgeLabel = "COUNTRY: " + countryCode;
    const badgeW = badgeLabel.length * 6.4 + 14;
    const badgeRect = createServiceSvgElement("rect", {
      x: (bx + 10).toFixed(1),
      y: (by - 9).toFixed(1),
      width: badgeW.toFixed(1),
      height: 18,
      rx: 4,
      fill: "#0f172a",
      stroke: accentColor,
      "stroke-width": 1.2,
    });
    g.appendChild(badgeRect);
    const badgeText = createServiceSvgElement("text", {
      x: (bx + 10 + badgeW / 2).toFixed(1),
      y: by.toFixed(1),
      fill: accentColor,
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "9.5",
      "font-weight": "bold",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "pointer-events": "none",
    });
    badgeText.textContent = badgeLabel;
    g.appendChild(badgeText);

    attachServiceHoverTip(badgeRect, rect, tipLines.join("\n"), accentColor);
    svg.appendChild(g);
  };

  // Customer Card (Left)
  const custX = padX;
  const custH = 78;
  const custY = bodyCenterY - custH / 2;
  const custGroup = createServiceSvgElement("g");
  const custName = data.customer?.name || "Customer";
  const custRef = data.customer?.reference || "";
  const custTip = [
    "Customer: " + custName,
    custRef ? "Customer Ref: " + custRef : null,
    "Service Ref: " + fullRef,
    "Service Type: " + serviceType,
    "Rate: " + serviceRateStr,
    "Country: " + (data.country || "—"),
  ]
    .filter(Boolean)
    .join("\n");
  const custTitle = createServiceSvgElement("title");
  custTitle.textContent = custTip;
  custGroup.appendChild(custTitle);

  const custRect = createServiceSvgElement("rect", {
    x: custX,
    y: custY.toFixed(1),
    width: customerW,
    height: custH,
    rx: 6,
    fill: "#1d4ed8",
    stroke: isPredicted ? "#ffff00" : "#93c5fd",
    "stroke-width": 1.8,
  });
  custGroup.appendChild(custRect);

  const custTag = createServiceSvgElement("text", {
    x: custX + customerW / 2,
    y: (custY + 17).toFixed(1),
    fill: "#bfdbfe",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8.5",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  custTag.textContent = "CUSTOMER";
  custGroup.appendChild(custTag);

  const custNameText = createServiceSvgElement("text", {
    x: custX + customerW / 2,
    y: (custY + 38).toFixed(1),
    fill: "#ffffff",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "11.5",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  custNameText.textContent = truncateSvgText(custName, 14);
  custGroup.appendChild(custNameText);

  const custSubText = createServiceSvgElement("text", {
    x: custX + customerW / 2,
    y: (custY + 58).toFixed(1),
    fill: "#dbeafe",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8.5",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  custSubText.textContent = truncateSvgText(custRef || serviceRateStr, 16);
  custGroup.appendChild(custSubText);

  attachServiceHoverTip(custGroup, custRect, custTip, "#60a5fa");
  svg.appendChild(custGroup);

  const custRight = { x: custX + customerW, y: bodyCenterY };

  // Port Termination Pill (with LAG member badge + C-VLAN / nested S-VLAN⊃C-VLAN pill + truncation tooltip)
  const drawPortTerminationPill = (px, py, pw, ph, link, role, ne) => {
    const matchedPort = findMatchedNePort(ne, link.port);
    const portState = matchedPort?.state || "used";
    const memberNum = toInteger(link.member);
    const baseAccent = role === "ingress" ? "#38bdf8" : "#f59e0b";
    const accent = memberNum > 0 ? getLagMemberColor(memberNum, baseAccent) : baseAccent;
    const tip = buildPortTooltip(
      matchedPort || { name: link.port, state: portState },
      link,
      role,
      lagInfo.groupName,
      serviceRateStr,
      source
    );

    const g = createServiceSvgElement("g");
    const tEl = createServiceSvgElement("title");
    tEl.textContent = tip;
    g.appendChild(tEl);

    const rect = createServiceSvgElement("rect", {
      x: px.toFixed(1),
      y: py.toFixed(1),
      width: pw,
      height: ph,
      rx: 4,
      fill: "#1e293b",
      stroke: isPredicted ? "#ffff00" : accent,
      "stroke-width": 1.4,
    });
    g.appendChild(rect);

    // Role / LAG member stripe on left edge of pill
    g.appendChild(
      createServiceSvgElement("rect", {
        x: px.toFixed(1),
        y: py.toFixed(1),
        width: 4,
        height: ph,
        rx: 1.5,
        fill: accent,
        "pointer-events": "none",
      })
    );

    // Port name (truncated cleanly if too long; full name in hover tip)
    const nameText = createServiceSvgElement("text", {
      x: (px + 9).toFixed(1),
      y: (py + 12).toFixed(1),
      fill: "#f8fafc",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "8.5",
      "font-weight": "bold",
      "dominant-baseline": "central",
      "pointer-events": "none",
    });
    nameText.textContent = truncateSvgText(link.port || "port", 16);
    g.appendChild(nameText);

    // Second line: VLAN tag(s) + LAG member badge
    const subParts = [];
    const sV = link.sVlanId != null ? toInteger(link.sVlanId) : 0;
    const cV = link.cVlanId != null ? toInteger(link.cVlanId) : 0;
    if (sV > 0 && cV > 0) {
      subParts.push("S:" + sV + "[C:" + cV + "]");
    } else if (sV > 0) {
      const nested = vlanHierarchy.sVlans.find((s) => s.sVlanId === sV);
      if (nested && nested.cVlans.length > 0) {
        subParts.push("S:" + sV + "[" + nested.cVlans.map((v) => "C:" + v).join(",") + "]");
      } else {
        subParts.push("S:" + sV);
      }
    } else if (cV > 0) {
      subParts.push("C:" + cV);
    }
    if (memberNum > 0) {
      subParts.push("M" + memberNum);
    }
    const subStr = subParts.length > 0 ? subParts.join(" · ") : role.toUpperCase();

    const subText = createServiceSvgElement("text", {
      x: (px + 9).toFixed(1),
      y: (py + 25).toFixed(1),
      fill: accent,
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "8",
      "dominant-baseline": "central",
      "pointer-events": "none",
    });
    subText.textContent = truncateSvgText(subStr, 19);
    g.appendChild(subText);

    attachServiceHoverTip(g, rect, tip, accent);
    svg.appendChild(g);
    return {
      left: { x: px, y: py + ph / 2 },
      right: { x: px + pw, y: py + ph / 2 },
      color: accent,
    };
  };

  // Next Hop / Egress Hand-Off Card (Right)
  const nextHopX = svgW - nextHopW - padX;
  const nextHopH = 78;
  const nextHopY = bodyCenterY - nextHopH / 2;
  const nextHopGroup = createServiceSvgElement("g");
  const nextHopTip = [
    "Network Hand-Off / Next Hop",
    "Egress Links: " + egressLinks.length,
    "Service Rate: " + serviceRateStr,
    lagInfo.hasLag
      ? "LAG: " + lagInfo.groupName + " (" + lagInfo.declaredMembers + " members)"
      : null,
    vlanHierarchy.sVlans.length > 0
      ? "S-VLANs: " +
        vlanHierarchy.sVlans
          .map(
            (s) =>
              s.sVlanId +
              (s.cVlans.length > 0 ? " (C-VLANs: " + s.cVlans.join(", ") + ")" : "")
          )
          .join("; ")
      : null,
  ]
    .filter(Boolean)
    .join("\n");
  const nextHopTitle = createServiceSvgElement("title");
  nextHopTitle.textContent = nextHopTip;
  nextHopGroup.appendChild(nextHopTitle);

  const nextHopRect = createServiceSvgElement("rect", {
    x: nextHopX,
    y: nextHopY.toFixed(1),
    width: nextHopW,
    height: nextHopH,
    rx: 6,
    fill: "#1e293b",
    stroke: isPredicted ? "#ffff00" : "#f59e0b",
    "stroke-width": 1.6,
  });
  nextHopGroup.appendChild(nextHopRect);

  const nhTag = createServiceSvgElement("text", {
    x: nextHopX + nextHopW / 2,
    y: (nextHopY + 18).toFixed(1),
    fill: "#fcd34d",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8.5",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  nhTag.textContent = "NEXT HOP";
  nextHopGroup.appendChild(nhTag);

  const nhSub = createServiceSvgElement("text", {
    x: nextHopX + nextHopW / 2,
    y: (nextHopY + 39).toFixed(1),
    fill: "#ffffff",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "11",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  nhSub.textContent = truncateSvgText(serviceRateStr, 14);
  nextHopGroup.appendChild(nhSub);

  const nhFoot = createServiceSvgElement("text", {
    x: nextHopX + nextHopW / 2,
    y: (nextHopY + 59).toFixed(1),
    fill: "#94a3b8",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "8.5",
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "pointer-events": "none",
  });
  nhFoot.textContent = truncateSvgText(
    lagInfo.hasLag
      ? lagInfo.groupName + " · " + egressLinks.length + " egress"
      : egressLinks.length + " egress",
    16
  );
  nextHopGroup.appendChild(nhFoot);
  attachServiceHoverTip(nextHopGroup, nextHopRect, nextHopTip, "#f59e0b");
  svg.appendChild(nextHopGroup);

  const nextHopLeft = { x: nextHopX, y: bodyCenterY };

  if (isSingleStage) {
    // Single-NE / shared-NE topology
    const boundaryX = custX + customerW + 24;
    const boundaryW = nextHopX - boundaryX - 24;
    const boundaryY = bodyTop + 12;
    const boundaryH = contentH - 20;
    const neId0 = ingressNeIds[0];
    const countryCode = getNeCountry(neId0);
    const siteNames = [
      ...new Set(
        ingressNeIds
          .map((id) => {
            const ne = neMap.get(id);
            const site = ne?.siteId ? siteMap.get(ne.siteId) : null;
            return site?.reference || ne?.siteId || null;
          })
          .filter(Boolean)
      ),
    ];
    drawCountryBoundary(
      boundaryX,
      boundaryY,
      boundaryW,
      boundaryH,
      countryCode,
      siteNames,
      "#38bdf8"
    );

    const ingressPillX = boundaryX + 16;
    const egressPillX = boundaryX + boundaryW - portNodeW - 16;
    const neX =
      ingressPillX +
      portNodeW +
      (egressPillX - (ingressPillX + portNodeW) - neWidth) / 2;

    // Column labels for INGRESS and EGRESS
    const drawColHeader = (cx, text, color) => {
      const lbl = createServiceSvgElement("text", {
        x: cx.toFixed(1),
        y: (boundaryY + 18).toFixed(1),
        fill: color,
        "font-family": "'Courier New', Courier, monospace",
        "font-size": "9",
        "font-weight": "bold",
        "text-anchor": "middle",
        "dominant-baseline": "central",
      });
      lbl.textContent = text;
      svg.appendChild(lbl);
    };
    drawColHeader(ingressPillX + portNodeW / 2, "INGRESS", "#38bdf8");
    drawColHeader(egressPillX + portNodeW / 2, "EGRESS", "#f59e0b");

    // Draw NE(s)
    const neBoxes = new Map();
    const totalNeH =
      ingressNeIds.length * 100 + Math.max(0, ingressNeIds.length - 1) * 18;
    let curNeY = bodyCenterY - totalNeH / 2;
    for (const id of ingressNeIds) {
      const ne = neMap.get(id) || null;
      const site = ne?.siteId ? siteMap.get(ne.siteId) : null;
      const box = drawMiniNeChassis(svg, {
        x: neX,
        y: curNeY,
        width: neWidth,
        neId: id,
        ne,
        site,
        fallbackCountry: data.country,
        roleLabel: "Ingress / Egress",
        ingressPorts: ingressLinks.filter((l) => l.neId === id),
        egressPorts: egressLinks.filter((l) => l.neId === id),
        lagGroup: lagInfo.groupName,
        serviceRateStr,
        source,
        rootUrl,
      });
      neBoxes.set(id, box);
      curNeY += box.height + 18;
    }

    // Draw Ingress pills & per-LAG-member links
    const inTotalH =
      ingressLinks.length * pillH + Math.max(0, ingressLinks.length - 1) * pillGap;
    const inStartY = bodyCenterY - inTotalH / 2 + 6;
    const inPills = [];
    for (let i = 0; i < ingressLinks.length; i++) {
      const link = ingressLinks[i];
      const py = inStartY + i * (pillH + pillGap);
      const ne = neMap.get(link.neId) || null;
      const pill = drawPortTerminationPill(
        ingressPillX,
        py,
        portNodeW,
        pillH,
        link,
        "ingress",
        ne
      );
      inPills.push(pill);

      const neBox = neBoxes.get(link.neId);
      const anchor =
        neBox?.portAnchors.get((link.port || "").toLowerCase())?.left ||
        neBox?.leftAnchor || { x: neX, y: bodyCenterY };
      const memberNum = toInteger(link.member);
      const linkColor = memberNum > 0 ? getLagMemberColor(memberNum, "#38bdf8") : "#38bdf8";
      const linkTip = [
        "Ingress Link #" + (i + 1),
        "Port: " + link.port,
        "Rate: " + serviceRateStr,
        link.cVlanId ? "Inner C-VLAN: " + link.cVlanId : null,
        link.sVlanId ? "Outer S-VLAN: " + link.sVlanId : null,
        memberNum > 0
          ? "LAG: " + lagInfo.groupName + " · Member " + memberNum
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      drawCurvedLink(svg, custRight.x, custRight.y, pill.left.x, pill.left.y, {
        color: linkColor,
        strokeWidth: 1.9,
        tooltip: linkTip,
        highlightColor: "#7dd3fc",
      });
      drawCurvedLink(svg, pill.right.x, pill.right.y, anchor.x, anchor.y, {
        color: linkColor,
        strokeWidth: 2.1,
        label: memberNum > 0 ? "M" + memberNum : null,
        tooltip: linkTip,
        highlightColor: "#7dd3fc",
      });
    }

    // Draw LAG bundle oval around parallel ingress links if LAG exists
    if (lagInfo.hasLag && inPills.length > 1) {
      const inLagTip = [
        "Ingress LAG Bundle: " + lagInfo.groupName,
        "Declared Members: " + lagInfo.declaredMembers,
        "Rate: " + serviceRateStr,
        "Ingress Ports: " +
          ingressLinks
            .map((l) => l.port + (l.member ? " (M" + l.member + ")" : ""))
            .join(", "),
      ].join("\n");
      drawLagBundleRing(
        svg,
        (custRight.x + ingressPillX) / 2,
        inPills[0].left.y,
        inPills[inPills.length - 1].left.y,
        lagInfo.groupName,
        lagInfo.declaredMembers,
        serviceRateStr,
        inLagTip
      );
    }

    // Draw Egress pills & per-LAG-member links
    const outTotalH =
      egressLinks.length * pillH + Math.max(0, egressLinks.length - 1) * pillGap;
    const outStartY = bodyCenterY - outTotalH / 2 + 6;
    const outPills = [];
    for (let i = 0; i < egressLinks.length; i++) {
      const link = egressLinks[i];
      const py = outStartY + i * (pillH + pillGap);
      const ne = neMap.get(link.neId) || null;
      const pill = drawPortTerminationPill(
        egressPillX,
        py,
        portNodeW,
        pillH,
        link,
        "egress",
        ne
      );
      outPills.push(pill);

      const neBox = neBoxes.get(link.neId);
      const anchor =
        neBox?.portAnchors.get((link.port || "").toLowerCase())?.right ||
        neBox?.rightAnchor || { x: neX + neWidth, y: bodyCenterY };
      const memberNum = toInteger(link.member);
      const linkColor = memberNum > 0 ? getLagMemberColor(memberNum, "#f59e0b") : "#f59e0b";
      const linkTip = [
        "Egress Link #" + (i + 1),
        "Port: " + link.port,
        "Rate: " + serviceRateStr,
        link.sVlanId ? "Outer S-VLAN: " + link.sVlanId : null,
        link.cVlanId ? "Inner C-VLAN: " + link.cVlanId : null,
        memberNum > 0
          ? "LAG: " + lagInfo.groupName + " · Member " + memberNum
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      drawCurvedLink(svg, anchor.x, anchor.y, pill.left.x, pill.left.y, {
        color: linkColor,
        strokeWidth: 2.1,
        label: memberNum > 0 ? "M" + memberNum : null,
        tooltip: linkTip,
        highlightColor: "#fcd34d",
      });
      drawCurvedLink(svg, pill.right.x, pill.right.y, nextHopLeft.x, nextHopLeft.y, {
        color: linkColor,
        strokeWidth: 1.9,
        tooltip: linkTip,
        highlightColor: "#fcd34d",
      });
    }

    // Draw LAG bundle oval around parallel egress links if LAG exists
    if (lagInfo.hasLag && outPills.length > 1) {
      const outLagTip = [
        "Egress LAG Bundle: " + lagInfo.groupName,
        "Declared Members: " + lagInfo.declaredMembers,
        "Rate: " + serviceRateStr,
        "Egress Ports: " +
          egressLinks
            .map((l) => l.port + (l.member ? " (M" + l.member + ")" : ""))
            .join(", "),
      ].join("\n");
      drawLagBundleRing(
        svg,
        (egressPillX + portNodeW + nextHopLeft.x) / 2,
        outPills[0].right.y,
        outPills[outPills.length - 1].right.y,
        lagInfo.groupName,
        lagInfo.declaredMembers,
        serviceRateStr,
        outLagTip
      );
    }

    // Draw per-LAG-member switching arcs underneath the NE showing matching Ingress <-> Egress member paths
    if (lagInfo.hasLag && lagInfo.pairs.length > 0) {
      const neBox0 = neBoxes.get(neId0);
      if (neBox0) {
        const arcBaseY = neBox0.y + neBox0.height + 10;
        for (let pIdx = 0; pIdx < lagInfo.pairs.length; pIdx++) {
          const pair = lagInfo.pairs[pIdx];
          const inA = neBox0.portAnchors.get((pair.ingress.port || "").toLowerCase());
          const outA = neBox0.portAnchors.get((pair.egress.port || "").toLowerCase());
          if (inA && outA) {
            const mColor = getLagMemberColor(pair.member, "#a78bfa");
            const dropY = arcBaseY + pIdx * 10;
            const pathD =
              "M " +
              inA.bottom.x.toFixed(1) +
              " " +
              inA.bottom.y.toFixed(1) +
              " L " +
              inA.bottom.x.toFixed(1) +
              " " +
              dropY.toFixed(1) +
              " L " +
              outA.bottom.x.toFixed(1) +
              " " +
              dropY.toFixed(1) +
              " L " +
              outA.bottom.x.toFixed(1) +
              " " +
              outA.bottom.y.toFixed(1);
            const xTip = [
              "LAG Cross-Connect: " + pair.group + " · Member " + pair.member,
              "Ingress: " +
                pair.ingress.port +
                (pair.ingress.cVlanId ? " (C-VLAN " + pair.ingress.cVlanId + ")" : ""),
              "Egress: " +
                pair.egress.port +
                (pair.egress.sVlanId ? " (S-VLAN " + pair.egress.sVlanId + ")" : ""),
              "Rate: " + serviceRateStr,
              pair.exactMemberMatch
                ? "Matched Member " + pair.member + " ↔ Member " + pair.member
                : "Hashed LAG Member " +
                  pair.member +
                  " → Egress Member " +
                  (toInteger(pair.egress.member) || 1),
            ].join("\n");
            const xg = createServiceSvgElement("g");
            const xt = createServiceSvgElement("title");
            xt.textContent = xTip;
            xg.appendChild(xt);
            const xVis = createServiceSvgElement("path", {
              d: pathD,
              fill: "none",
              stroke: mColor,
              "stroke-width": 1.6,
              "stroke-dasharray": pair.exactMemberMatch ? "none" : "4 3",
              "stroke-linejoin": "round",
            });
            const xHit = createServiceSvgElement("path", {
              d: pathD,
              fill: "none",
              stroke: "transparent",
              "stroke-width": 8,
            });
            xg.appendChild(xVis);
            xg.appendChild(xHit);
            attachServiceHoverTip(xg, xVis, xTip, "#ffffff");
            svg.appendChild(xg);
          }
        }
      }
    }
  } else {
    // Multi-NE / End-to-End topology (supports cross-country boundaries + per-LAG-member backbone links!)
    const leftCountry =
      ingressNeIds.length > 0 ? getNeCountry(ingressNeIds[0]) : data.country || "N/A";
    const rightCountry =
      egressNeIds.length > 0 ? getNeCountry(egressNeIds[0]) : data.country || "N/A";
    const isCrossBorder = leftCountry !== rightCountry;

    const zoneStartX = custX + customerW + 30;
    const zoneEndX = nextHopX - 30;
    const totalZoneW = zoneEndX - zoneStartX;
    const zoneY = bodyTop + 12;
    const zoneH = contentH - 20;

    const leftSites = [
      ...new Set(
        ingressNeIds
          .map((id) => {
            const ne = neMap.get(id);
            return (ne?.siteId && siteMap.get(ne.siteId)?.reference) || ne?.siteId;
          })
          .filter(Boolean)
      ),
    ];
    const rightSites = [
      ...new Set(
        egressNeIds
          .map((id) => {
            const ne = neMap.get(id);
            return (ne?.siteId && siteMap.get(ne.siteId)?.reference) || ne?.siteId;
          })
          .filter(Boolean)
      ),
    ];

    const midX = zoneStartX + totalZoneW / 2;
    if (isCrossBorder) {
      const halfW = totalZoneW / 2 - 22;
      drawCountryBoundary(zoneStartX, zoneY, halfW, zoneH, leftCountry, leftSites, "#38bdf8");
      drawCountryBoundary(midX + 22, zoneY, halfW, zoneH, rightCountry, rightSites, "#f59e0b");

      svg.appendChild(
        createServiceSvgElement("line", {
          x1: midX.toFixed(1),
          y1: (zoneY + 6).toFixed(1),
          x2: midX.toFixed(1),
          y2: (zoneY + zoneH - 6).toFixed(1),
          stroke: "#e2e8f0",
          "stroke-width": 1.2,
          "stroke-dasharray": "4 4",
        })
      );
      const borderLabel = leftCountry + " ⇄ " + rightCountry;
      const bW = borderLabel.length * 6.2 + 12;
      svg.appendChild(
        createServiceSvgElement("rect", {
          x: (midX - bW / 2).toFixed(1),
          y: (zoneY + zoneH - 12).toFixed(1),
          width: bW.toFixed(1),
          height: 16,
          rx: 3,
          fill: "#0f172a",
          stroke: "#e2e8f0",
          "stroke-width": 0.9,
        })
      );
      const bText = createServiceSvgElement("text", {
        x: midX.toFixed(1),
        y: (zoneY + zoneH - 4).toFixed(1),
        fill: "#f8fafc",
        "font-family": "'Courier New', Courier, monospace",
        "font-size": "8.5",
        "font-weight": "bold",
        "text-anchor": "middle",
        "dominant-baseline": "central",
      });
      bText.textContent = borderLabel;
      svg.appendChild(bText);
    } else {
      drawCountryBoundary(
        zoneStartX,
        zoneY,
        totalZoneW,
        zoneH,
        leftCountry,
        [...new Set(leftSites.concat(rightSites))],
        "#38bdf8"
      );
    }

    const leftNeX = zoneStartX + 18;
    const rightNeX = zoneEndX - neWidth - 18;

    // Ingress & Egress headers
    const inHdr = createServiceSvgElement("text", {
      x: (leftNeX + neWidth / 2).toFixed(1),
      y: (zoneY + 18).toFixed(1),
      fill: "#38bdf8",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "9",
      "font-weight": "bold",
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    inHdr.textContent = "INGRESS NE";
    svg.appendChild(inHdr);

    const outHdr = createServiceSvgElement("text", {
      x: (rightNeX + neWidth / 2).toFixed(1),
      y: (zoneY + 18).toFixed(1),
      fill: "#f59e0b",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "9",
      "font-weight": "bold",
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    outHdr.textContent = "EGRESS NE";
    svg.appendChild(outHdr);

    // Draw Ingress NE(s)
    const inNeBoxes = [];
    let curInY =
      bodyCenterY -
      (ingressNeIds.length * 100 + Math.max(0, ingressNeIds.length - 1) * 18) / 2;
    for (const id of ingressNeIds) {
      const ne = neMap.get(id) || null;
      const site = ne?.siteId ? siteMap.get(ne.siteId) : null;
      const box = drawMiniNeChassis(svg, {
        x: leftNeX,
        y: curInY,
        width: neWidth,
        neId: id,
        ne,
        site,
        fallbackCountry: data.country,
        roleLabel: "Ingress NE",
        ingressPorts: ingressLinks.filter((l) => l.neId === id),
        egressPorts: [],
        lagGroup: lagInfo.groupName,
        serviceRateStr,
        source,
        rootUrl,
      });
      inNeBoxes.push({ id, box });
      curInY += box.height + 18;
    }

    // Draw Egress NE(s)
    const outNeBoxes = [];
    let curOutY =
      bodyCenterY -
      (egressNeIds.length * 100 + Math.max(0, egressNeIds.length - 1) * 18) / 2;
    for (const id of egressNeIds) {
      const ne = neMap.get(id) || null;
      const site = ne?.siteId ? siteMap.get(ne.siteId) : null;
      const box = drawMiniNeChassis(svg, {
        x: rightNeX,
        y: curOutY,
        width: neWidth,
        neId: id,
        ne,
        site,
        fallbackCountry: data.country,
        roleLabel: "Egress NE",
        ingressPorts: [],
        egressPorts: egressLinks.filter((l) => l.neId === id),
        lagGroup: lagInfo.groupName,
        serviceRateStr,
        source,
        rootUrl,
      });
      outNeBoxes.push({ id, box });
      curOutY += box.height + 18;
    }

    // Connect Customer -> Ingress NE ports
    for (let i = 0; i < ingressLinks.length; i++) {
      const link = ingressLinks[i];
      const target = inNeBoxes.find((b) => b.id === link.neId);
      const anchor =
        target?.box.portAnchors.get((link.port || "").toLowerCase())?.left ||
        target?.box.leftAnchor;
      if (anchor) {
        const mNum = toInteger(link.member);
        const col = mNum > 0 ? getLagMemberColor(mNum, "#38bdf8") : "#38bdf8";
        drawCurvedLink(svg, custRight.x, custRight.y, anchor.x, anchor.y, {
          color: col,
          strokeWidth: 1.8,
          label: formatLinkVlanTag(link) || link.port,
          tooltip: [
            "Ingress: " + link.port,
            "Rate: " + serviceRateStr,
            link.cVlanId ? "Inner C-VLAN: " + link.cVlanId : null,
            mNum > 0 ? "LAG: " + lagInfo.groupName + " · Member " + mNum : null,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      }
    }

    // Connect Ingress NE(s) -> Egress NE(s): per LAG member pair when LAG exists!
    if (lagInfo.hasLag && lagInfo.pairs.length > 0) {
      const totalPairs = lagInfo.pairs.length;
      const ys = [];
      for (let pIdx = 0; pIdx < totalPairs; pIdx++) {
        const pair = lagInfo.pairs[pIdx];
        const inItem = inNeBoxes.find((b) => b.id === pair.ingress.neId) || inNeBoxes[0];
        const outItem = outNeBoxes.find((b) => b.id === pair.egress.neId) || outNeBoxes[0];
        if (!inItem || !outItem) continue;
        const offset = (pIdx - (totalPairs - 1) / 2) * 18;
        const y1 = inItem.box.rightAnchor.y + offset * 0.6;
        const y2 = outItem.box.leftAnchor.y + offset * 0.6;
        ys.push((y1 + y2) / 2);
        const mCol = getLagMemberColor(pair.member, "#25b09b");
        drawCurvedLink(svg, inItem.box.rightAnchor.x, y1, outItem.box.leftAnchor.x, y2, {
          color: mCol,
          strokeWidth: 2.2,
          dashed: isPredicted || !pair.exactMemberMatch,
          label: pair.group + " M" + pair.member,
          curveOffsetY: offset * 0.35,
          tooltip: [
            "LAG Member Transport: " + pair.group + " · Member " + pair.member,
            "Ingress: " +
              pair.ingress.port +
              (pair.ingress.cVlanId ? " (C-VLAN " + pair.ingress.cVlanId + ")" : ""),
            "Egress: " +
              pair.egress.port +
              (pair.egress.sVlanId ? " (S-VLAN " + pair.egress.sVlanId + ")" : ""),
            "Rate: " + serviceRateStr,
            isCrossBorder
              ? "Cross-Border: " + leftCountry + " → " + rightCountry
              : "Country: " + leftCountry,
          ].join("\n"),
        });
      }
      if (ys.length > 1) {
        drawLagBundleRing(
          svg,
          midX,
          Math.min(...ys),
          Math.max(...ys),
          lagInfo.groupName,
          lagInfo.declaredMembers,
          serviceRateStr,
          "Backbone LAG Bundle: " +
            lagInfo.groupName +
            " (" +
            lagInfo.declaredMembers +
            " members, " +
            serviceRateStr +
            ")"
        );
      }
    } else {
      for (const inItem of inNeBoxes) {
        for (const outItem of outNeBoxes) {
          drawCurvedLink(
            svg,
            inItem.box.rightAnchor.x,
            inItem.box.rightAnchor.y,
            outItem.box.leftAnchor.x,
            outItem.box.leftAnchor.y,
            {
              color: isCrossBorder ? "#a78bfa" : "#25b09b",
              strokeWidth: 2.6,
              dashed: isPredicted,
              label: serviceRateStr,
              tooltip: [
                "Service Transport Path",
                "Service: " + fullRef,
                "Type: " + serviceType,
                "Rate: " + serviceRateStr,
                isCrossBorder
                  ? "Cross-Border: " + leftCountry + " → " + rightCountry
                  : "Country: " + leftCountry,
              ].join("\n"),
            }
          );
        }
      }
    }

    // Connect Egress NE ports -> Next Hop
    for (let i = 0; i < egressLinks.length; i++) {
      const link = egressLinks[i];
      const src = outNeBoxes.find((b) => b.id === link.neId);
      const anchor =
        src?.box.portAnchors.get((link.port || "").toLowerCase())?.right ||
        src?.box.rightAnchor;
      if (anchor) {
        const mNum = toInteger(link.member);
        const col = mNum > 0 ? getLagMemberColor(mNum, "#f59e0b") : "#f59e0b";
        drawCurvedLink(svg, anchor.x, anchor.y, nextHopLeft.x, nextHopLeft.y, {
          color: col,
          strokeWidth: 1.8,
          label: formatLinkVlanTag(link) || link.port,
          tooltip: [
            "Egress: " + link.port,
            "Rate: " + serviceRateStr,
            link.sVlanId ? "Outer S-VLAN: " + link.sVlanId : null,
            link.cVlanId ? "Inner C-VLAN: " + link.cVlanId : null,
            mNum > 0 ? "LAG: " + lagInfo.groupName + " · Member " + mNum : null,
          ]
            .filter(Boolean)
            .join("\n"),
          highlightColor: "#fcd34d",
        });
      }
    }
  }

  // Bottom QinQ VLAN Encapsulation Bar: Visually shows inner C-VLAN(s) nested INSIDE each outer S-VLAN!
  if (hasVlanPanel) {
    const stripY = bodyTop + contentH + 4;
    const stripH = vlanStripH - 6;
    svg.appendChild(
      createServiceSvgElement("rect", {
        x: 12,
        y: stripY,
        width: svgW - 24,
        height: stripH,
        rx: 5,
        fill: "#111827",
        stroke: "#334155",
        "stroke-width": 1,
      })
    );
    const stripLbl = createServiceSvgElement("text", {
      x: 24,
      y: stripY + stripH / 2,
      fill: "#94a3b8",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "9.5",
      "font-weight": "bold",
      "dominant-baseline": "central",
    });
    stripLbl.textContent = "VLAN ENCAPSULATION (QinQ):";
    svg.appendChild(stripLbl);

    let cursorX = 200;
    const badgeY = stripY + (stripH - 42) / 2;

    for (const sEntry of vlanHierarchy.sVlans) {
      const sTip = [
        "Outer S-VLAN: " + sEntry.sVlanId,
        "Encapsulated C-VLAN(s): " +
          (sEntry.cVlans.length > 0 ? sEntry.cVlans.join(", ") : "none"),
        sEntry.ports.length > 0 ? "Ports: " + sEntry.ports.join(", ") : null,
        "Rate: " + serviceRateStr,
      ]
        .filter(Boolean)
        .join("\n");
      const drawn = drawNestedVlanBadge(
        svg,
        cursorX,
        badgeY,
        sEntry.sVlanId,
        sEntry.cVlans,
        {
          rateStr: serviceRateStr,
          compact: false,
          tooltip: sTip,
        }
      );
      cursorX += drawn.width + 12;
    }

    if (vlanHierarchy.orphanCVlans.length > 0) {
      const cTip = [
        "Customer C-VLAN(s): " + vlanHierarchy.orphanCVlans.join(", "),
        "Outer S-VLAN: none",
        "Rate: " + serviceRateStr,
      ].join("\n");
      drawNestedVlanBadge(
        svg,
        cursorX,
        badgeY,
        null,
        vlanHierarchy.orphanCVlans,
        {
          rateStr: serviceRateStr,
          compact: false,
          tooltip: cTip,
        }
      );
    }
  }

  container.appendChild(svg);
  return {
    serviceType,
    serviceRateStr,
    vlanHierarchy,
    lagInfo,
    ingressCount: ingressLinks.length,
    egressCount: egressLinks.length,
    neCount: new Set(ingressNeIds.concat(egressNeIds)).size,
    countries: [
      ...new Set(
        ingressNeIds
          .concat(egressNeIds)
          .map(getNeCountry)
          .concat(data.country ? [data.country] : [])
          .filter(Boolean)
      ),
    ],
  };
}

function fitServiceMetadataPanel(panel) {
  if (!panel || !panel.innerHTML) {
    return;
  }
  const container =
    document.getElementById("right-service-metadata") || panel.parentElement;
  if (
    container &&
    !serviceMetadataResizeObserver &&
    typeof ResizeObserver !== "undefined"
  ) {
    serviceMetadataResizeObserver = new ResizeObserver(() => {
      fitServiceMetadataPanel(document.getElementById("metadataPanel"));
    });
    serviceMetadataResizeObserver.observe(container);
  }
  const maxFontPx = 15;
  const minFontPx = 10;
  let size = maxFontPx;
  panel.style.fontSize = size + "px";
  while (
    size > minFontPx &&
    (panel.scrollHeight > panel.clientHeight + 1 ||
      panel.scrollWidth > panel.clientWidth + 1)
  ) {
    size -= 0.5;
    panel.style.fontSize = size + "px";
  }
}

async function fetchJsonSafe(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    });
    if (response.ok && response.status === 200) {
      return await response.json();
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

function fetchListService() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/service?country=" +
      selectedCountry,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    }
  )
    .then((response) => {
      if (response.ok && response.status == 200) {
        return response.json();
      }
    })
    .then((data) => {
      let suppliedServiceId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/service/",
        ""
      );
      if (
        suppliedServiceId === window.location.pathname ||
        suppliedServiceId === ""
      ) {
        suppliedServiceId = null;
      }
      let serviceIds =
        "<option disabled value='-1' selected='selected'> -- select a service -- </option>";
      if (suppliedServiceId != null) {
        serviceIds =
          "<option disabled value='-1'> -- select a service -- </option>";
      }
      if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          if (suppliedServiceId == data[i]) {
            serviceIds +=
              "<option value='" +
              data[i] +
              "' selected='selected'>" +
              data[i] +
              "</option>";
          } else {
            serviceIds +=
              "<option value='" + data[i] + "' >" + data[i] + "</option>";
          }
        }
      }
      document.getElementById("serviceId").innerHTML = serviceIds;
      if (suppliedServiceId != null) {
        fetchServicePoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

function fetchServicePoints() {
  let r = document.getElementById("serviceId");
  serviceId = r.options[r.selectedIndex].value;
  if (serviceId != "-1") {
    fetch(
      localStorage.getItem("ni.gatewayUrl") +
        "/service/timeline/" +
        serviceId,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        keepalive: true,
      }
    )
      .then((response) => {
        if (response.ok && response.status == 200) {
          return response.json();
        }
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          return;
        }
        serviceRawPoints = [];
        let servicePoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            servicePoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            servicePoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
          serviceRawPoints.push(data[i].point);
        }
        document.getElementById("servicePoint").innerHTML = servicePoints;
        fetchService();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}

async function fetchService(overrideServiceId = null, overridePoint = null) {
  if (overrideServiceId != null) {
    serviceId = overrideServiceId;
  } else {
    let r = document.getElementById("serviceId");
    serviceId = r.options[r.selectedIndex].value;
  }
  if (overridePoint != null) {
    point = overridePoint;
  } else {
    let p = document.getElementById("servicePoint");
    point = p.options[p.selectedIndex].value;
  }
  if (serviceId == "-1" || point == "-1") {
    return;
  }

  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  const gatewayUrl = localStorage.getItem("ni.gatewayUrl");
  const rootUrl = localStorage.getItem("ni.rootUrl") || "";
  const c = document.getElementById("country");
  const selectedCountry = c.options[c.selectedIndex].value;

  const data = await fetchJsonSafe(
    gatewayUrl + "/service/" + serviceId + "?point=" + point
  );
  if (data == null) {
    return;
  }

  let source = data.source != null ? data.source : "historical";

  // Fetch all referenced NEs (GET /ne/{neId}) in parallel
  const ingressLinks = Array.isArray(data.link?.ingress) ? data.link.ingress : [];
  const egressLinks = Array.isArray(data.link?.egress) ? data.link.egress : [];
  const uniqueNeIds = [
    ...new Set(
      ingressLinks
        .concat(egressLinks)
        .map((l) => l.neId)
        .filter(Boolean)
    ),
  ];

  const neMap = new Map();
  const neResults = await Promise.all(
    uniqueNeIds.map(async (id) => ({
      id,
      ne: await fetchJsonSafe(gatewayUrl + "/ne/" + id),
    }))
  );
  for (const item of neResults) {
    if (item.ne != null) {
      neMap.set(item.id, item.ne);
    }
  }

  // Fetch referenced Sites (GET /site/{siteId}) for country & site metadata
  const uniqueSiteIds = [
    ...new Set(
      Array.from(neMap.values())
        .map((ne) => ne.siteId)
        .filter(Boolean)
    ),
  ];
  const siteMap = new Map();
  const siteResults = await Promise.all(
    uniqueSiteIds.map(async (id) => ({
      id,
      site: await fetchJsonSafe(gatewayUrl + "/site/" + id),
    }))
  );
  for (const item of siteResults) {
    if (item.site != null) {
      siteMap.set(item.id, item.site);
    }
  }

  const summary = drawServiceTopology(grid, data, neMap, siteMap, source);

  const renderLinkRows = (links) => {
    if (links.length === 0) {
      return '<span class="meta-value">—</span>';
    }
    return links
      .map((l) => {
        const ne = neMap.get(l.neId);
        const neHost = ne?.host || l.neId;
        const neCountry = ne?.country || data.country || selectedCountry;
        const vlanTag = formatLinkVlanTag(l);
        return (
          '<div><a href="' +
          rootUrl +
          "/ne/" +
          l.neId +
          "?country=" +
          neCountry +
          '" target="_self">' +
          neHost +
          "</a> : " +
          (l.port || "") +
          (vlanTag ? " [" + vlanTag + "]" : "") +
          " (" +
          neCountry +
          ")</div>"
        );
      })
      .join("");
  };

  let metadata =
    '<div class="meta-section"><div class="meta-grid">' +
    '<span class="meta-label">Reference:</span><span class="meta-value">' +
    (data.reference != null ? data.reference + " " : "") +
    "(" +
    serviceId +
    ")</span>" +
    '<span class="meta-label">Service Type:</span><span class="meta-value">' +
    summary.serviceType +
    "</span>" +
    '<span class="meta-label">Commissioned:</span><span class="meta-value">' +
    formatServiceDate(data.commissioned) +
    "</span>" +
    '<span class="meta-label">Decommissioned:</span><span class="meta-value">' +
    formatServiceDate(data.decommissioned) +
    "</span>" +
    '<span class="meta-label">Source:</span><span class="meta-value">' +
    source +
    "</span>" +
    '<span class="meta-label">Country:</span><span class="meta-value">' +
    (data.country || "—") +
    "</span>" +
    '<span class="meta-label">Rate:</span><span class="meta-value">' +
    summary.serviceRateStr +
    "</span>";
  if (data.cost != null) {
    metadata +=
      '<span class="meta-label">Cost:</span><span class="meta-value">' +
      data.cost +
      "</span>";
  }
  metadata += "</div></div>";

  if (data.customer != null) {
    metadata +=
      '<div class="meta-section"><div class="meta-heading">Customer:</div><div class="meta-grid">' +
      '<span class="meta-label">Name:</span><span class="meta-value">' +
      (data.customer.name || "—") +
      "</span>" +
      '<span class="meta-label">Reference:</span><span class="meta-value">' +
      (data.customer.reference || "—") +
      "</span>" +
      "</div></div>";
  }

  if (summary.vlanHierarchy.sVlans.length > 0 || summary.vlanHierarchy.orphanCVlans.length > 0) {
    metadata +=
      '<div class="meta-section"><div class="meta-heading">VLANs (QinQ):</div><div class="meta-list">';
    for (const sEntry of summary.vlanHierarchy.sVlans) {
      metadata +=
        "<div>S-VLAN " +
        sEntry.sVlanId +
        (sEntry.cVlans.length > 0
          ? " ⊃ C-VLAN " + sEntry.cVlans.join(", ")
          : "") +
        "</div>";
    }
    if (summary.vlanHierarchy.orphanCVlans.length > 0) {
      metadata +=
        "<div>C-VLAN " + summary.vlanHierarchy.orphanCVlans.join(", ") + "</div>";
    }
    metadata += "</div></div>";
  }

  if (summary.lagInfo.hasLag) {
    metadata +=
      '<div class="meta-section"><div class="meta-heading">LAG:</div><div class="meta-grid">' +
      '<span class="meta-label">Group:</span><span class="meta-value">' +
      summary.lagInfo.groupName +
      "</span>" +
      '<span class="meta-label">Members:</span><span class="meta-value">' +
      summary.lagInfo.declaredMembers +
      "</span>" +
      "</div></div>";
  }

  metadata +=
    '<div class="meta-section"><div class="meta-heading">Ingress:</div><div class="meta-list">' +
    renderLinkRows(ingressLinks) +
    "</div></div>" +
    '<div class="meta-section"><div class="meta-heading">Egress:</div><div class="meta-list">' +
    renderLinkRows(egressLinks) +
    "</div></div>" +
    '<div class="meta-section"><div class="meta-heading">Topology Summary:</div>' +
    '<div class="stateusage-key">' +
    '<div id="stateusage-used" class="stateusage">NEs: ' +
    summary.neCount +
    "</div>" +
    '<div id="stateusage-free" class="stateusage">Ingress: ' +
    summary.ingressCount +
    "</div>" +
    '<div id="stateusage-reserved" class="stateusage">Egress: ' +
    summary.egressCount +
    "</div>" +
    '<div id="stateusage-error" class="stateusage">Countries: ' +
    summary.countries.join("/") +
    "</div>" +
    "</div></div>";

  const metadataPanel = document.getElementById("metadataPanel");
  metadataPanel.innerHTML = metadata;
  requestAnimationFrame(() => fitServiceMetadataPanel(metadataPanel));
}

try {
  countryListPopulate(fetchListService);
} catch (e) {
  console.error(e);
}
