//=====================================================================
// Network Insight (NI) - JavaScript: NE
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let neId = null;
let neRawPoints = [];
let point = null;
var cveKnown = 0;
var cveImpacting = 0;

const NE_SVG_NS = "http://www.w3.org/2000/svg";

function createNeSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(NE_SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function getNeTooltipElement() {
  let tooltip = document.getElementById("neHoverTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "neHoverTooltip";
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
      padding: "5px 9px",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "12px",
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
    });
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function positionNeTooltip(tooltip, event) {
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

function hideNeTooltip() {
  const tooltip = document.getElementById("neHoverTooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function attachNeHoverTip(targetEl, borderEl, text) {
  const originalStroke = borderEl.getAttribute("stroke");
  const originalStrokeWidth = borderEl.getAttribute("stroke-width");
  targetEl.style.cursor = "pointer";
  targetEl.style.pointerEvents = "all";
  targetEl.addEventListener("mouseenter", (event) => {
    event.stopPropagation();
    const tooltip = getNeTooltipElement();
    tooltip.textContent = text;
    tooltip.style.display = "block";
    positionNeTooltip(tooltip, event);
    borderEl.setAttribute("stroke", "#38bdf8");
    borderEl.setAttribute(
      "stroke-width",
      String(Math.max(2, Number(originalStrokeWidth || 1) + 1))
    );
  });
  targetEl.addEventListener("mousemove", (event) => {
    event.stopPropagation();
    const tooltip = getNeTooltipElement();
    if (tooltip.style.display === "block") {
      positionNeTooltip(tooltip, event);
    }
  });
  targetEl.addEventListener("mouseleave", () => {
    hideNeTooltip();
    if (originalStroke != null) {
      borderEl.setAttribute("stroke", originalStroke);
    }
    if (originalStrokeWidth != null) {
      borderEl.setAttribute("stroke-width", originalStrokeWidth);
    }
  });
}

function parseNeRackUnits(slotPosition) {
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

function getNePortStyle(state, source) {
  const stroke = source === "predicted" ? "#ffff00" : "#cbd5e1";
  switch (state) {
    case "free":
      return { fill: "#008000", stroke, led: "#22c55e" };
    case "used":
      return { fill: "#000000", stroke, led: "#38bdf8" };
    case "reserved":
      return { fill: "#808080", stroke, led: "#eab308" };
    case "faulty":
      return { fill: "#ff0000", stroke, led: "#ef4444" };
    default:
      return { fill: "#1e293b", stroke, led: "#94a3b8" };
  }
}

function formatPortTooltip(port, idx, source) {
  const parts = [];
  const name = port.name || "Port " + (idx + 1);
  parts.push(name);
  if (port.technology) {
    parts.push("[" + port.technology + "]");
  }
  parts.push("state: " + (port.state || "unknown"));
  if (port.configuration?.rate != null && port.configuration?.unit != null) {
    parts.push(port.configuration.rate + port.configuration.unit);
  } else if (port.configuration?.channels != null) {
    parts.push(port.configuration.channels + " ch");
  }
  const errCount = toInteger(port.errorCount);
  parts.push("errors: " + errCount);
  if (port.macAddress) {
    parts.push("MAC: " + port.macAddress);
  }
  if (source === "predicted") {
    parts.push("(predicted)");
  }
  return parts.join(" · ");
}

function drawNeChassis(container, data, source) {
  hideNeTooltip();
  const ports = Array.isArray(data.ports) ? data.ports : [];
  const rackUnits = parseNeRackUnits(data.slotPosition);
  const isPredicted = source === "predicted";

  // Count states & errors
  const counts = { used: 0, free: 0, reserved: 0, faulty: 0, errors: 0 };
  for (let i = 0; i < ports.length; i++) {
    const p = ports[i];
    const errs = toInteger(p.errorCount);
    counts.errors += errs;
    if (p.state === "free") counts.free += 1;
    else if (p.state === "used") counts.used += 1;
    else if (p.state === "reserved") counts.reserved += 1;
    else if (p.state === "faulty") counts.faulty += 1;
  }

  // Juniper MX240-inspired 19" rack chassis dimensions, vertically scaled by rack U count (1U = 1 slot)
  const chassisWidth = 640;
  const earWidth = 26;
  const bodyX = earWidth;
  const bodyWidth = chassisWidth - earWidth * 2;
  const headerHeight = 42;
  const ventHeight = rackUnits >= 2 ? 18 : 10;
  const unitHeight = 68;
  const baseChassisHeight = Math.max(106, rackUnits * unitHeight);

  // Determine modular line-card bays (MX240 horizontal MPC/FPC card stack below top craft bezel)
  const totalPorts = ports.length;
  const maxColsPerRow = totalPorts <= 8 ? Math.max(4, totalPorts) : totalPorts <= 16 ? 8 : totalPorts <= 24 ? 12 : 16;
  const cardCount =
    rackUnits === 1
      ? 1
      : Math.min(rackUnits, Math.max(2, Math.ceil(totalPorts / Math.max(8, maxColsPerRow))));
  const portsPerCard = cardCount > 0 ? Math.ceil(totalPorts / cardCount) : 0;
  const rowsPerCard = portsPerCard > maxColsPerRow ? Math.ceil(portsPerCard / maxColsPerRow) : 1;
  const minCardHeight = rowsPerCard * 34 + 18;
  const cardGap = 6;
  const bayPaddingTop = 8;
  const bayPaddingBottom = 8;
  const neededBayHeight = cardCount * minCardHeight + (cardCount - 1) * cardGap + bayPaddingTop + bayPaddingBottom;

  const chassisHeight = Math.max(baseChassisHeight, headerHeight + neededBayHeight + ventHeight + 6);
  const bayTop = headerHeight + bayPaddingTop;
  const bayHeight = chassisHeight - headerHeight - ventHeight - bayPaddingTop - bayPaddingBottom;
  const cardHeight = (bayHeight - (cardCount - 1) * cardGap) / cardCount;

  const svg = createNeSvgElement("svg", {
    viewBox: "0 0 " + chassisWidth + " " + chassisHeight,
    role: "img",
    "aria-label":
      (data.vendor || "Network Equipment") +
      " " +
      (data.model || "") +
      " (" +
      rackUnits +
      "U, " +
      totalPorts +
      " ports)",
    class: "ne-chassis-svg",
  });
  svg.style.width = "100%";
  svg.style.maxWidth = "660px";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.margin = "0 auto";
  svg.addEventListener("mouseleave", hideNeTooltip);

  // Left & Right rack-mount ears with mounting holes scaled per U
  const drawRackEar = (x) => {
    svg.appendChild(
      createNeSvgElement("rect", {
        x,
        y: 2,
        width: earWidth,
        height: chassisHeight - 4,
        rx: 3,
        fill: "#334155",
        stroke: "#64748b",
        "stroke-width": 1.5,
      })
    );
    const slotSpan = (chassisHeight - 16) / rackUnits;
    for (let u = 0; u < rackUnits; u++) {
      const uTop = 8 + u * slotSpan;
      const holeOffsets = [uTop + slotSpan * 0.25, uTop + slotSpan * 0.75];
      for (const hy of holeOffsets) {
        svg.appendChild(
          createNeSvgElement("rect", {
            x: x + 6,
            y: (hy - 3.5).toFixed(1),
            width: earWidth - 12,
            height: 7,
            rx: 3.5,
            fill: "#0f172a",
            stroke: "#94a3b8",
            "stroke-width": 1,
          })
        );
      }
      if (u > 0) {
        svg.appendChild(
          createNeSvgElement("line", {
            x1: x + 2,
            y1: uTop.toFixed(1),
            x2: x + earWidth - 2,
            y2: uTop.toFixed(1),
            stroke: "#475569",
            "stroke-width": 0.8,
            "stroke-dasharray": "2 2",
          })
        );
      }
    }
  };
  drawRackEar(0);
  drawRackEar(chassisWidth - earWidth);

  // Main chassis enclosure
  svg.appendChild(
    createNeSvgElement("rect", {
      x: bodyX,
      y: 2,
      width: bodyWidth,
      height: chassisHeight - 4,
      rx: 4,
      fill: "#1e293b",
      stroke: isPredicted ? "#ffff00" : "#94a3b8",
      "stroke-width": isPredicted ? 2.5 : 2,
    })
  );

  // Top Craft Interface / Branding Header (MX240-style upper panel)
  svg.appendChild(
    createNeSvgElement("rect", {
      x: bodyX + 4,
      y: 6,
      width: bodyWidth - 8,
      height: headerHeight - 8,
      rx: 2,
      fill: "#0f172a",
      stroke: "#334155",
      "stroke-width": 1,
    })
  );

  // Accent stripe along top-left bezel (Juniper MX-series craft bar visual cue)
  svg.appendChild(
    createNeSvgElement("rect", {
      x: bodyX + 4,
      y: 6,
      width: 5,
      height: headerHeight - 8,
      rx: 1,
      fill: isPredicted ? "#ffff00" : "#25b09b",
    })
  );

  // Model label on top-left and centered NE host label in the device header
  const modelLabel = data.model || "SWITCH";
  const modelText = createNeSvgElement("text", {
    x: bodyX + 16,
    y: 23,
    fill: "#38bdf8",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "12",
    "font-weight": "bold",
    "dominant-baseline": "central",
  });
  modelText.textContent = modelLabel;
  svg.appendChild(modelText);

  if (data.host != null && String(data.host).trim().length > 0) {
    const hostText = createNeSvgElement("text", {
      x: bodyX + bodyWidth / 2,
      y: 23,
      fill: "#f8fafc",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "12",
      "font-weight": "bold",
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    hostText.textContent = String(data.host);
    svg.appendChild(hostText);
  }

  // Rack U height badge on top-right
  const uBadgeX = bodyX + bodyWidth - 54;
  svg.appendChild(
    createNeSvgElement("rect", {
      x: uBadgeX,
      y: 13,
      width: 42,
      height: 19,
      rx: 3,
      fill: "#1e293b",
      stroke: "#475569",
      "stroke-width": 1,
    })
  );
  const uBadgeText = createNeSvgElement("text", {
    x: uBadgeX + 21,
    y: 23,
    fill: "#cbd5e1",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "10",
    "font-weight": "bold",
    "text-anchor": "middle",
    "dominant-baseline": "central",
  });
  uBadgeText.textContent = rackUnits + "U";
  svg.appendChild(uBadgeText);

  // Render modular line-card / switch port bay(s) underneath top header
  let portCursor = 0;
  const cardX = bodyX + 8;
  const cardWidth = bodyWidth - 16;

  for (let cIdx = 0; cIdx < cardCount; cIdx++) {
    const cy = bayTop + cIdx * (cardHeight + cardGap);
    const cardPorts = ports.slice(portCursor, portCursor + portsPerCard);
    const startPortIndex = portCursor;
    portCursor += cardPorts.length;

    // Modular line card faceplate (MX240 MPC / FPC bay)
    svg.appendChild(
      createNeSvgElement("rect", {
        x: cardX,
        y: cy.toFixed(1),
        width: cardWidth,
        height: cardHeight.toFixed(1),
        rx: 2,
        fill: "#141d2e",
        stroke: "#475569",
        "stroke-width": 1.2,
      })
    );

    // MX240 captive thumbscrews / ejector handles on left & right of each card slot
    for (const sx of [cardX + 9, cardX + cardWidth - 9]) {
      svg.appendChild(
        createNeSvgElement("circle", {
          cx: sx,
          cy: (cy + cardHeight / 2).toFixed(1),
          r: 4,
          fill: "#64748b",
          stroke: "#0f172a",
          "stroke-width": 1,
        })
      );
      svg.appendChild(
        createNeSvgElement("line", {
          x1: sx - 2.2,
          y1: (cy + cardHeight / 2).toFixed(1),
          x2: sx + 2.2,
          y2: (cy + cardHeight / 2).toFixed(1),
          stroke: "#1e293b",
          "stroke-width": 1,
        })
      );
    }

    // Slot label on left edge of line card (FPC 0, FPC 1, ... for multi-U)
    const innerLeft = cardX + (cardCount > 1 ? 38 : 22);
    const innerRight = cardX + cardWidth - 22;
    const innerWidth = innerRight - innerLeft;

    if (cardCount > 1) {
      const fpcText = createNeSvgElement("text", {
        x: cardX + 20,
        y: (cy + cardHeight / 2).toFixed(1),
        fill: "#64748b",
        "font-family": "'Courier New', Courier, monospace",
        "font-size": "8.5",
        "font-weight": "bold",
        "dominant-baseline": "central",
      });
      fpcText.textContent = "S" + cIdx;
      svg.appendChild(fpcText);
    }

    if (cardPorts.length === 0) {
      // Blank filler plate when slot has no assigned ports
      const blankText = createNeSvgElement("text", {
        x: (innerLeft + innerWidth / 2).toFixed(1),
        y: (cy + cardHeight / 2).toFixed(1),
        fill: "#475569",
        "font-family": "'Courier New', Courier, monospace",
        "font-size": "9",
        "text-anchor": "middle",
        "dominant-baseline": "central",
      });
      blankText.textContent = "EXPANSION BAY";
      svg.appendChild(blankText);
      continue;
    }

    // Arrange ports in realistic switch rows inside this line card (groups of 4 with slight bank gap)
    const rowsInCard = cardPorts.length > maxColsPerRow ? Math.ceil(cardPorts.length / maxColsPerRow) : 1;
    const colsInCard = Math.ceil(cardPorts.length / rowsInCard);
    const groupSize = 4;
    const bankGap = colsInCard > groupSize ? 8 : 0;
    const numBanks = Math.ceil(colsInCard / groupSize);
    const totalBankGaps = Math.max(0, numBanks - 1) * bankGap;
    const portGapX = colsInCard > 12 ? 4 : 6;
    const portGapY = 6;
    const padY = 6;

    const availW = innerWidth - totalBankGaps - Math.max(0, colsInCard - 1) * portGapX;
    const availH = cardHeight - padY * 2 - Math.max(0, rowsInCard - 1) * portGapY;
    const portW = Math.min(36, Math.max(16, availW / colsInCard));
    const portH = Math.min(28, Math.max(16, availH / rowsInCard));

    // Center the port block inside the card bay
    const totalPortsW = colsInCard * portW + Math.max(0, colsInCard - 1) * portGapX + totalBankGaps;
    const totalPortsH = rowsInCard * portH + Math.max(0, rowsInCard - 1) * portGapY;
    const startX = innerLeft + Math.max(0, (innerWidth - totalPortsW) / 2);
    const startY = cy + Math.max(padY, (cardHeight - totalPortsH) / 2);

    for (let pIdx = 0; pIdx < cardPorts.length; pIdx++) {
      const port = cardPorts[pIdx];
      const globalIdx = startPortIndex + pIdx;
      const row = Math.floor(pIdx / colsInCard);
      const col = pIdx % colsInCard;
      const bankIdx = Math.floor(col / groupSize);
      const px = startX + col * (portW + portGapX) + bankIdx * bankGap;
      const py = startY + row * (portH + portGapY);

      const style = getNePortStyle(port.state, source);
      const errCount = toInteger(port.errorCount);
      const tipText = formatPortTooltip(port, globalIdx, source);

      const portGroup = createNeSvgElement("g", { id: "port" + globalIdx });
      const titleEl = createNeSvgElement("title");
      titleEl.textContent = tipText;
      portGroup.appendChild(titleEl);

      // Port housing / cage
      const housing = createNeSvgElement("rect", {
        x: px.toFixed(1),
        y: py.toFixed(1),
        width: portW.toFixed(1),
        height: portH.toFixed(1),
        rx: 2.5,
        fill: style.fill,
        stroke: style.stroke,
        "stroke-width": 1.3,
      });
      portGroup.appendChild(housing);

      // Technology-specific connector detail
      const tech = (port.technology || "ethernet").toLowerCase();
      if (tech === "coax") {
        portGroup.appendChild(
          createNeSvgElement("circle", {
            cx: (px + portW / 2).toFixed(1),
            cy: (py + portH / 2 + 1).toFixed(1),
            r: (Math.min(portW, portH) * 0.28).toFixed(1),
            fill: "none",
            stroke: "rgba(255,255,255,0.45)",
            "stroke-width": 1,
            "pointer-events": "none",
          })
        );
      } else if (tech === "singlefiber" || tech === "multifiber") {
        // SFP / LC duplex optical ports hint
        const sfpY = py + 3;
        const sfpH = Math.max(4, portH * 0.22);
        portGroup.appendChild(
          createNeSvgElement("rect", {
            x: (px + 3).toFixed(1),
            y: sfpY.toFixed(1),
            width: Math.max(4, portW / 2 - 4).toFixed(1),
            height: sfpH.toFixed(1),
            rx: 0.8,
            fill: "rgba(255,255,255,0.22)",
            "pointer-events": "none",
          })
        );
        portGroup.appendChild(
          createNeSvgElement("rect", {
            x: (px + portW / 2 + 1).toFixed(1),
            y: sfpY.toFixed(1),
            width: Math.max(4, portW / 2 - 4).toFixed(1),
            height: sfpH.toFixed(1),
            rx: 0.8,
            fill: "rgba(255,255,255,0.22)",
            "pointer-events": "none",
          })
        );
      } else if (tech !== "loopback") {
        // RJ45 stepped locking tab silhouette at top center
        const tabW = Math.max(5, portW * 0.34);
        portGroup.appendChild(
          createNeSvgElement("rect", {
            x: (px + (portW - tabW) / 2).toFixed(1),
            y: (py + 1.5).toFixed(1),
            width: tabW.toFixed(1),
            height: 3.2,
            fill: "rgba(255,255,255,0.35)",
            "pointer-events": "none",
          })
        );
      }

      // Error / health LED in top-right corner of the port
      const errLedColor =
        errCount >= 100 ? "#ef4444" : errCount > 0 ? "#f59e0b" : "#22c55e";
      portGroup.appendChild(
        createNeSvgElement("circle", {
          cx: (px + portW - 3.5).toFixed(1),
          cy: (py + 3.5).toFixed(1),
          r: 2,
          fill: errLedColor,
          "pointer-events": "none",
        })
      );

      // Port index number centered in the lower half of the port
      const portLabel = createNeSvgElement("text", {
        x: (px + portW / 2).toFixed(1),
        y: (py + portH * 0.62).toFixed(1),
        fill: "#ffffff",
        "font-family": "'Courier New', Courier, monospace",
        "font-size": portW >= 24 ? "9.5" : "8",
        "font-weight": "bold",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "pointer-events": "none",
      });
      portLabel.textContent = String(globalIdx + 1);
      portGroup.appendChild(portLabel);

      // Error symbol overlay if errors exist
      if (errCount > 0) {
        const errMark = createNeSvgElement("text", {
          x: (px + 4.5).toFixed(1),
          y: (py + 5).toFixed(1),
          fill: errCount >= 100 ? "#fca5a5" : "#fde047",
          "font-family": "'Courier New', Courier, monospace",
          "font-size": "8",
          "font-weight": "bold",
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "pointer-events": "none",
        });
        errMark.textContent = errCount >= 100 ? "×" : "!";
        portGroup.appendChild(errMark);
      }

      attachNeHoverTip(portGroup, housing, tipText);
      svg.appendChild(portGroup);
    }
  }

  // Bottom MX240 air-intake / fan-tray vent strip
  const ventY = chassisHeight - ventHeight - 3;
  svg.appendChild(
    createNeSvgElement("rect", {
      x: bodyX + 6,
      y: ventY,
      width: bodyWidth - 12,
      height: ventHeight - 2,
      rx: 1.5,
      fill: "#0f172a",
      stroke: "#334155",
      "stroke-width": 0.8,
    })
  );
  if (ventHeight >= 14) {
    const slotCount = 28;
    const ventInnerW = bodyWidth - 36;
    const slotSpacing = ventInnerW / slotCount;
    for (let v = 0; v < slotCount; v++) {
      svg.appendChild(
        createNeSvgElement("rect", {
          x: (bodyX + 18 + v * slotSpacing).toFixed(1),
          y: (ventY + 4).toFixed(1),
          width: Math.max(4, slotSpacing * 0.55).toFixed(1),
          height: (ventHeight - 10).toFixed(1),
          rx: 1,
          fill: "#1e293b",
        })
      );
    }
  }

  container.appendChild(svg);
  return counts;
}

function fetchCveNe(neId = null) {
  cveKnown = 0;
  cveImpacting = 0;
  if (neId == null) {
    let r = document.getElementById("neId");
    neId = r.options[r.selectedIndex].value;
  }
  fetch(localStorage.getItem("ni.gatewayUrl") + "/cve/ne/" + neId, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (response.ok && response.status == 200) {
        return response.json();
      }
    })
    .then((data) => {
      if (data != null) {
        if (data.known != null) {
          cveKnown = data.known.length;
        }
        if (data.impacting != null) {
          cveImpacting = data.impacting.length;
        }
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchListNe() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/ne?country=" + selectedCountry,
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
      let suppliedNeId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/ne/",
        ""
      );
      let neIds =
        "<option disabled value='-1' selected='selected'> -- select a ne -- </option>";
      if (suppliedNeId != null) {
        neIds = "<option disabled value='-1'> -- select a ne -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedNeId == data[i]) {
          neIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          neIds += "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("neId").innerHTML = neIds;
      if (suppliedNeId != null) {
        fetchNePoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchNe(neId, point = null) {
  if (neId == null) {
    let r = document.getElementById("neId");
    neId = r.options[r.selectedIndex].value;
  }
  if (point == null) {
    let p = document.getElementById("nePoint");
    point = p.options[p.selectedIndex].value;
  }
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/ne/" + neId + "?point=" + point,
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
      if (data?.ports != null) {
        let c = document.getElementById("country");
        let selectedCountry = c.options[c.selectedIndex].value;
        let source = "historical";
        if (data.source != null) {
          source = data.source;
        }

        const counts = drawNeChassis(grid, data, source);
        let portUsed = counts.used;
        let portFree = counts.free;
        let portReserved = counts.reserved;
        let portFaulty = counts.faulty;
        let portErrorCount = counts.errors;

        if (data?.decommissioned == undefined) {
          data.decommissioned = "";
        }
        let metadata =
          "<b>Host</b>:&emsp;" +
          data.host +
          "<br>" +
          "<center>( " +
          neId +
          " )</center><br>" +
          "<br>Commissioned:&emsp;&emsp;" +
          data.commissioned +
          "<br>" +
          "Decommissioned:&emsp;" +
          data.decommissioned +
          "<br>" +
          "Source:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" +
          source +
          "<br>" +
          "<br><b>Details</b>:<br>" +
          "IP:&emsp;&emsp;" +
          data.mgmtIP +
          "<br>" +
          "Vendor:&emsp;" +
          data.vendor +
          "<br>" +
          "Model:&emsp;" +
          data.model +
          "<br>" +
          "Image:&emsp;" +
          data.image +
          "<br>" +
          "Version:&emsp;" +
          data.version +
          "<br>" +
          "<br><b>Location</b>:<br>" +
          'Site:&emsp;<a href="' +
          localStorage.getItem("ni.rootUrl") +
          "/site/" +
          data.siteId +
          "?country=" +
          selectedCountry +
          '" target="_self">' +
          data.siteId +
          "</a>" +
          '<br>Rack:&emsp;<a href="' +
          localStorage.getItem("ni.rootUrl") +
          "/rack/" +
          data.rackId +
          "?country=" +
          selectedCountry +
          '" target="_self">' +
          data.rackId +
          "</a>" +
          "<br>" +
          "Slot(s):&emsp;" +
          data.slotPosition +
          " (" +
          parseNeRackUnits(data.slotPosition) +
          "U)" +
          "<br>" +
          "<br><b>Usage Summary:</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
          portFaulty +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
          portReserved +
          "</div>" +
          '<div id="stateusage-used" class="stateusage">Used: ' +
          portUsed +
          "</div>" +
          '<div id="stateusage-free" class="stateusage">Free: ' +
          portFree +
          "</div>" +
          '<div id="stateusage-error" class="stateusage">Errors: ' +
          portErrorCount +
          "</div>" +
          "</div><br>" +
          "<br><b>Common vulnerabilities and Exposures (CVE):</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Impacting: ' +
          cveImpacting +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Known: ' +
          cveKnown +
          "</div>" +
          "</div>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchNePoints() {
  let r = document.getElementById("neId");
  neId = r.options[r.selectedIndex].value;
  if (neId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/ne/timeline/" + neId, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    })
      .then((response) => {
        if (response.ok && response.status == 200) {
          return response.json();
        }
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          return;
        }
        neRawPoints = [];
        let nePoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            nePoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            nePoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
          neRawPoints.push(data[i].point);
        }
        document.getElementById("nePoint").innerHTML = nePoints;
        fetchNe();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
try {
  countryListPopulate(fetchListNe);
} catch (e) {
  console.error(e);
}
