//=====================================================================
// Network Insight (NI) - JavaScript: Rack
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let rackId = null;
let point = null;

const RACK_SVG_NS = "http://www.w3.org/2000/svg";

function createRackSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(RACK_SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function getRackTooltipElement() {
  let tooltip = document.getElementById("rackHoverTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "rackHoverTooltip";
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

function positionRackTooltip(tooltip, event) {
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

function hideRackTooltip() {
  const tooltip = document.getElementById("rackHoverTooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function attachRackSlotHoverTip(targetEl, borderEl, text) {
  const originalStroke = borderEl.getAttribute("stroke");
  const originalStrokeWidth = borderEl.getAttribute("stroke-width");
  targetEl.style.cursor = "pointer";
  targetEl.style.pointerEvents = "all";
  targetEl.addEventListener("mouseenter", (event) => {
    event.stopPropagation();
    const tooltip = getRackTooltipElement();
    tooltip.textContent = text;
    tooltip.style.display = "block";
    positionRackTooltip(tooltip, event);
    borderEl.setAttribute("stroke", "#38bdf8");
    borderEl.setAttribute(
      "stroke-width",
      String(Math.max(1.8, Number(originalStrokeWidth || 1) + 0.8))
    );
  });
  targetEl.addEventListener("mousemove", (event) => {
    event.stopPropagation();
    const tooltip = getRackTooltipElement();
    if (tooltip.style.display === "block") {
      positionRackTooltip(tooltip, event);
    }
  });
  targetEl.addEventListener("mouseleave", () => {
    hideRackTooltip();
    if (originalStroke != null) {
      borderEl.setAttribute("stroke", originalStroke);
    }
    if (originalStrokeWidth != null) {
      borderEl.setAttribute("stroke-width", originalStrokeWidth);
    }
  });
}

function rackDimensionToMm(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  switch (String(unit || "mm").toLowerCase()) {
    case "mm":
      return n;
    case "cm":
      return n * 10;
    case "m":
      return n * 1000;
    case "km":
      return n * 1000000;
    case "inch":
      return n * 25.4;
    case "feet":
      return n * 304.8;
    default:
      return n;
  }
}

function getRackSlotStyle(usage, source) {
  const stroke = source === "predicted" ? "#ffff00" : "#ffffff";
  switch (usage) {
    case "free":
      return { fill: "#008000", stroke, led: "#4ade80" };
    case "used":
      return { fill: "#000000", stroke, led: "#38bdf8" };
    case "reserved":
      return { fill: "#808080", stroke, led: "#fde047" };
    case "faulty":
      return { fill: "#ff0000", stroke, led: "#fca5a5" };
    default:
      return { fill: "#1e293b", stroke, led: "#94a3b8" };
  }
}

function drawRack3D(container, data, source, selectedCountry) {
  hideRackTooltip();
  const rackSlots = Math.max(1, toInteger(data.slots));
  const rawSlots = Array.isArray(data.slotUsage) ? data.slotUsage : [];
  const slotUsage = rawSlots.slice().reverse();
  const isPredicted = source === "predicted";

  // Physical dimensions from data.dimensions (scaled proportionally into crisp 3D cabinet geometry)
  const dims = data.dimensions || {};
  const dimUnit = dims.unit || "mm";
  const heightMm = rackDimensionToMm(dims.height, dimUnit) || rackSlots * 44.45;
  const widthMm = rackDimensionToMm(dims.width, dimUnit) || 600;
  const depthMm = rackDimensionToMm(dims.depth, dimUnit) || 1000;

  // Base U-slot pitch adjusted by slot count and physical height-to-U ratio
  const baseSlotPitch =
    rackSlots <= 10
      ? 26
      : rackSlots <= 18
        ? 22
        : rackSlots <= 28
          ? 18
          : rackSlots <= 44
            ? 15
            : 13;
  const nominalHeightMm = rackSlots * 44.45;
  const heightScale = Math.min(
    1.25,
    Math.max(0.85, heightMm / Math.max(1, nominalHeightMm))
  );
  const slotH = Math.max(12, Math.round(baseSlotPitch * heightScale));

  // Front cabinet width scaled from physical width (600mm -> ~250px, 800mm -> ~285px, 1200mm -> ~345px)
  const frontW = Math.round(
    Math.min(360, Math.max(240, 250 + ((widthMm - 600) / 600) * 95))
  );

  // 3D oblique extrusion depth scaled from physical depth (600mm -> ~84px, 1000mm -> ~116px, 1200mm -> ~132px)
  const depthPx = Math.round(
    Math.min(148, Math.max(56, 36 + (depthMm / 1200) * 96))
  );
  const dx = Math.round(depthPx * 0.78);
  const dy = -Math.round(depthPx * 0.42);

  const capH = 28;
  const baseH = 22;
  const railW = 26;
  const innerPadY = 6;
  const bayH = rackSlots * slotH + innerPadY * 2;
  const frontH = capH + bayH + baseH;

  // Margins around the 3D cabinet for dimension callouts & feet
  const marginLeft = 58;
  const marginRight = 40;
  const marginTop = Math.abs(dy) + 26;
  const marginBottom = 46;

  const fx = marginLeft;
  const fy = marginTop;
  const svgW = marginLeft + frontW + dx + marginRight;
  const svgH = marginTop + frontH + marginBottom;

  const svg = createRackSvgElement("svg", {
    viewBox: "0 0 " + svgW + " " + svgH,
    role: "img",
    "aria-label":
      "3D Data Centre Rack " +
      (data.reference || "") +
      " (" +
      rackSlots +
      "U, H " +
      (dims.height ?? "-") +
      " / W " +
      (dims.width ?? "-") +
      " / D " +
      (dims.depth ?? "-") +
      " " +
      dimUnit +
      ")",
    class: "rack-3d-svg",
  });
  svg.style.width = "100%";
  svg.style.maxWidth = Math.min(580, svgW) + "px";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.margin = "0 auto";
  svg.addEventListener("mouseleave", hideRackTooltip);

  // Gradients for realistic metallic 3D data centre enclosure
  const defs = createRackSvgElement("defs");

  const roofGrad = createRackSvgElement("linearGradient", {
    id: "rackRoofGrad",
    x1: "0%",
    y1: "100%",
    x2: "100%",
    y2: "0%",
  });
  roofGrad.appendChild(
    createRackSvgElement("stop", { offset: "0%", "stop-color": "#3b475a" })
  );
  roofGrad.appendChild(
    createRackSvgElement("stop", { offset: "100%", "stop-color": "#1e293b" })
  );
  defs.appendChild(roofGrad);

  const sideGrad = createRackSvgElement("linearGradient", {
    id: "rackSideGrad",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%",
  });
  sideGrad.appendChild(
    createRackSvgElement("stop", { offset: "0%", "stop-color": "#263244" })
  );
  sideGrad.appendChild(
    createRackSvgElement("stop", { offset: "100%", "stop-color": "#0f172a" })
  );
  defs.appendChild(sideGrad);

  const frameGrad = createRackSvgElement("linearGradient", {
    id: "rackFrameGrad",
    x1: "0%",
    y1: "0%",
    x2: "0%",
    y2: "100%",
  });
  frameGrad.appendChild(
    createRackSvgElement("stop", { offset: "0%", "stop-color": "#334155" })
  );
  frameGrad.appendChild(
    createRackSvgElement("stop", { offset: "100%", "stop-color": "#1e293b" })
  );
  defs.appendChild(frameGrad);

  svg.appendChild(defs);

  // Corner coordinates of 3D cabinet box
  const ftl = { x: fx, y: fy };
  const ftr = { x: fx + frontW, y: fy };
  const fbl = { x: fx, y: fy + frontH };
  const fbr = { x: fx + frontW, y: fy + frontH };
  const btl = { x: fx + dx, y: fy + dy };
  const btr = { x: fx + frontW + dx, y: fy + dy };
  const bbr = { x: fx + frontW + dx, y: fy + frontH + dy };

  // Ground shadow beneath the 3D rack footprint
  svg.appendChild(
    createRackSvgElement("polygon", {
      points: [
        fbl.x - 4 + "," + (fbl.y + 10),
        fbr.x + 4 + "," + (fbr.y + 10),
        bbr.x + 8 + "," + (bbr.y + 10),
        btl.x + "," + (bbr.y + 10),
      ].join(" "),
      fill: "rgba(0, 0, 0, 0.35)",
    })
  );

  // Leveling feet / casters at base corners
  const drawFoot = (cx, topY) => {
    svg.appendChild(
      createRackSvgElement("rect", {
        x: cx - 7,
        y: topY,
        width: 14,
        height: 5,
        rx: 1.5,
        fill: "#475569",
        stroke: "#0f172a",
        "stroke-width": 1,
      })
    );
    svg.appendChild(
      createRackSvgElement("rect", {
        x: cx - 10,
        y: topY + 5,
        width: 20,
        height: 4,
        rx: 2,
        fill: "#1e293b",
        stroke: "#64748b",
        "stroke-width": 0.8,
      })
    );
  };
  drawFoot(fbl.x + 18, fbl.y);
  drawFoot(fbr.x - 18, fbr.y);
  drawFoot(bbr.x - 14, bbr.y);

  // 3D Top Roof Panel
  svg.appendChild(
    createRackSvgElement("polygon", {
      points: [
        ftl.x + "," + ftl.y,
        btl.x + "," + btl.y,
        btr.x + "," + btr.y,
        ftr.x + "," + ftr.y,
      ].join(" "),
      fill: "url(#rackRoofGrad)",
      stroke: isPredicted ? "#ffff00" : "#64748b",
      "stroke-width": 1.5,
    })
  );

  // Roof cable-entry grommets & top exhaust vent detail
  const roofInsetX = frontW * 0.14;
  const roofV1 = {
    x: ftl.x + roofInsetX + dx * 0.28,
    y: ftl.y + dy * 0.28,
  };
  const roofV2 = {
    x: ftr.x - roofInsetX + dx * 0.28,
    y: ftr.y + dy * 0.28,
  };
  const roofV3 = {
    x: ftr.x - roofInsetX + dx * 0.72,
    y: ftr.y + dy * 0.72,
  };
  const roofV4 = {
    x: ftl.x + roofInsetX + dx * 0.72,
    y: ftl.y + dy * 0.72,
  };
  svg.appendChild(
    createRackSvgElement("polygon", {
      points: [
        roofV1.x.toFixed(1) + "," + roofV1.y.toFixed(1),
        roofV4.x.toFixed(1) + "," + roofV4.y.toFixed(1),
        roofV3.x.toFixed(1) + "," + roofV3.y.toFixed(1),
        roofV2.x.toFixed(1) + "," + roofV2.y.toFixed(1),
      ].join(" "),
      fill: "#0f172a",
      stroke: "#475569",
      "stroke-width": 1,
    })
  );
  // Roof vent slats
  for (let s = 1; s <= 4; s++) {
    const t = s / 5;
    const lx = roofV1.x + (roofV2.x - roofV1.x) * t;
    const ly = roofV1.y;
    const rx = roofV4.x + (roofV3.x - roofV4.x) * t;
    const ry = roofV4.y;
    svg.appendChild(
      createRackSvgElement("line", {
        x1: lx.toFixed(1),
        y1: ly.toFixed(1),
        x2: rx.toFixed(1),
        y2: ry.toFixed(1),
        stroke: "#334155",
        "stroke-width": 1,
      })
    );
  }

  // 3D Right Side Panel
  svg.appendChild(
    createRackSvgElement("polygon", {
      points: [
        ftr.x + "," + ftr.y,
        btr.x + "," + btr.y,
        bbr.x + "," + bbr.y,
        fbr.x + "," + fbr.y,
      ].join(" "),
      fill: "url(#rackSideGrad)",
      stroke: isPredicted ? "#ffff00" : "#64748b",
      "stroke-width": 1.5,
    })
  );

  // Recessed side-panel door seam & ventilation louver bands
  const sideInset = 0.12;
  const spTL = {
    x: ftr.x + dx * sideInset,
    y: ftr.y + dy * sideInset + 14,
  };
  const spTR = {
    x: ftr.x + dx * (1 - sideInset),
    y: ftr.y + dy * (1 - sideInset) + 14,
  };
  const spBR = {
    x: fbr.x + dx * (1 - sideInset),
    y: fbr.y + dy * (1 - sideInset) - 14,
  };
  const spBL = {
    x: fbr.x + dx * sideInset,
    y: fbr.y + dy * sideInset - 14,
  };
  svg.appendChild(
    createRackSvgElement("polygon", {
      points: [
        spTL.x.toFixed(1) + "," + spTL.y.toFixed(1),
        spTR.x.toFixed(1) + "," + spTR.y.toFixed(1),
        spBR.x.toFixed(1) + "," + spBR.y.toFixed(1),
        spBL.x.toFixed(1) + "," + spBL.y.toFixed(1),
      ].join(" "),
      fill: "none",
      stroke: "#334155",
      "stroke-width": 1,
    })
  );
  // Side panel louvers near top and bottom
  const louverOffsets = [0.08, 0.11, 0.14, 0.86, 0.89, 0.92];
  for (const frac of louverOffsets) {
    const yOff = frac * (frontH - 28);
    svg.appendChild(
      createRackSvgElement("line", {
        x1: (ftr.x + dx * 0.24).toFixed(1),
        y1: (ftr.y + dy * 0.24 + 14 + yOff).toFixed(1),
        x2: (ftr.x + dx * 0.76).toFixed(1),
        y2: (ftr.y + dy * 0.76 + 14 + yOff).toFixed(1),
        stroke: "#475569",
        "stroke-width": 1.2,
      })
    );
  }
  // Side door handle / key latch
  svg.appendChild(
    createRackSvgElement("rect", {
      x: (ftr.x + dx * 0.5 - 2).toFixed(1),
      y: (ftr.y + dy * 0.5 + frontH * 0.48 - 7).toFixed(1),
      width: 4,
      height: 14,
      rx: 1.5,
      fill: "#64748b",
      stroke: "#0f172a",
      "stroke-width": 0.8,
    })
  );

  // Front Cabinet Frame
  svg.appendChild(
    createRackSvgElement("rect", {
      x: fx,
      y: fy,
      width: frontW,
      height: frontH,
      rx: 2,
      fill: "url(#rackFrameGrad)",
      stroke: isPredicted ? "#ffff00" : "#94a3b8",
      "stroke-width": isPredicted ? 2.2 : 1.8,
    })
  );

  // Top Header Bezel on front of rack
  svg.appendChild(
    createRackSvgElement("rect", {
      x: fx + 4,
      y: fy + 4,
      width: frontW - 8,
      height: capH - 6,
      rx: 1.5,
      fill: "#0f172a",
      stroke: "#475569",
      "stroke-width": 1,
    })
  );
  const headerRef = createRackSvgElement("text", {
    x: fx + 12,
    y: fy + capH / 2 + 1,
    fill: "#f8fafc",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "11",
    "font-weight": "bold",
    "dominant-baseline": "central",
  });
  headerRef.textContent = data.reference || "RACK";
  svg.appendChild(headerRef);

  const headerSlots = createRackSvgElement("text", {
    x: fx + frontW - 12,
    y: fy + capH / 2 + 1,
    fill: isPredicted ? "#ffff00" : "#38bdf8",
    "font-family": "'Courier New', Courier, monospace",
    "font-size": "11",
    "font-weight": "bold",
    "text-anchor": "end",
    "dominant-baseline": "central",
  });
  headerSlots.textContent = rackSlots + "U";
  svg.appendChild(headerSlots);

  // Recessed interior bay behind U slots
  const bayX = fx + 6;
  const bayY = fy + capH;
  const bayW = frontW - 12;
  svg.appendChild(
    createRackSvgElement("rect", {
      x: bayX,
      y: bayY,
      width: bayW,
      height: bayH,
      fill: "#090d16",
      stroke: "#475569",
      "stroke-width": 1,
    })
  );

  // Left & Right 19-inch vertical mounting rails
  const leftRailX = bayX;
  const rightRailX = bayX + bayW - railW;
  const slotX = leftRailX + railW + 2;
  const slotW = bayW - railW * 2 - 4;

  svg.appendChild(
    createRackSvgElement("rect", {
      x: leftRailX,
      y: bayY,
      width: railW,
      height: bayH,
      fill: "#1e293b",
      stroke: "#475569",
      "stroke-width": 0.8,
    })
  );
  svg.appendChild(
    createRackSvgElement("rect", {
      x: rightRailX,
      y: bayY,
      width: railW,
      height: bayH,
      fill: "#1e293b",
      stroke: "#475569",
      "stroke-width": 0.8,
    })
  );

  // Render U Slots top-down (rackSlots down to 1) preserving existing usage, numbering & NE links
  const counts = { used: 0, free: 0, reserved: 0, faulty: 0 };
  const totalRows = Math.max(rackSlots, slotUsage.length);
  const rootUrl = localStorage.getItem("ni.rootUrl") || "";

  for (let j = 0; j < totalRows; j++) {
    const entry = slotUsage[j] || {
      slot: rackSlots - j,
      usage: "free",
      neId: null,
      host: null,
    };
    const slotNum = entry.slot != null ? toInteger(entry.slot) : rackSlots - j;
    const usage = entry.usage || "free";
    if (usage === "free") counts.free += 1;
    else if (usage === "used") counts.used += 1;
    else if (usage === "reserved") counts.reserved += 1;
    else if (usage === "faulty") counts.faulty += 1;

    const sy = bayY + innerPadY + j * slotH;
    const style = getRackSlotStyle(usage, source);
    const tipText =
      slotNum +
      "U: " +
      usage +
      (usage === "used" && entry.host ? " — " + entry.host : "") +
      (isPredicted ? " (predicted)" : "");

    // U-number on left mounting rail + cage-nut screw holes on right rail
    const railFontSize = slotH >= 18 ? 9 : 8;
    const railNum = createRackSvgElement("text", {
      x: leftRailX + railW / 2,
      y: (sy + slotH / 2).toFixed(1),
      fill: "#94a3b8",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": railFontSize,
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    railNum.textContent = String(slotNum);
    svg.appendChild(railNum);

    // Square cage-nut mounting holes on right rail
    const holeSize = slotH >= 18 ? 3.2 : 2.4;
    svg.appendChild(
      createRackSvgElement("rect", {
        x: (rightRailX + railW / 2 - holeSize / 2).toFixed(1),
        y: (sy + slotH * 0.28 - holeSize / 2).toFixed(1),
        width: holeSize,
        height: holeSize,
        fill: "#0f172a",
        stroke: "#64748b",
        "stroke-width": 0.5,
      })
    );
    svg.appendChild(
      createRackSvgElement("rect", {
        x: (rightRailX + railW / 2 - holeSize / 2).toFixed(1),
        y: (sy + slotH * 0.72 - holeSize / 2).toFixed(1),
        width: holeSize,
        height: holeSize,
        fill: "#0f172a",
        stroke: "#64748b",
        "stroke-width": 0.5,
      })
    );

    // Slot faceplate container (wrapped in clickable SVG <a> when used with an neId)
    let slotParent = svg;
    if (usage === "used" && entry.neId != null) {
      const link = createRackSvgElement("a", {
        href:
          rootUrl +
          "/ne/" +
          entry.neId +
          "?country=" +
          selectedCountry,
        target: "_self",
      });
      svg.appendChild(link);
      slotParent = link;
    }

    const slotGroup = createRackSvgElement("g", { id: "slot" + slotNum });
    const titleEl = createRackSvgElement("title");
    titleEl.textContent = tipText;
    slotGroup.appendChild(titleEl);

    const slotRect = createRackSvgElement("rect", {
      x: slotX,
      y: (sy + 0.8).toFixed(1),
      width: slotW,
      height: Math.max(8, slotH - 1.6).toFixed(1),
      rx: 1.5,
      fill: style.fill,
      stroke: style.stroke,
      "stroke-width": 1,
    });
    slotGroup.appendChild(slotRect);

    // Subtle 3D chassis-blade detail on occupied/used slots (bezel accent + mini LED)
    if (usage === "used") {
      slotGroup.appendChild(
        createRackSvgElement("line", {
          x1: slotX + 2,
          y1: (sy + 2.2).toFixed(1),
          x2: slotX + slotW - 2,
          y2: (sy + 2.2).toFixed(1),
          stroke: "rgba(255,255,255,0.16)",
          "stroke-width": 1,
          "pointer-events": "none",
        })
      );
      slotGroup.appendChild(
        createRackSvgElement("circle", {
          cx: slotX + slotW - 7,
          cy: (sy + slotH / 2).toFixed(1),
          r: Math.min(2.4, slotH * 0.16).toFixed(1),
          fill: style.led,
          "pointer-events": "none",
        })
      );
    }

    // Slot text: slot number + NE host (when used with neId) or slot number
    const labelText =
      usage === "used" && entry.host
        ? slotNum + "  " + entry.host
        : String(slotNum);
    const slotFontSize = slotH >= 20 ? 10 : slotH >= 15 ? 8.5 : 7.5;
    const textEl = createRackSvgElement("text", {
      x: (slotX + slotW / 2).toFixed(1),
      y: (sy + slotH / 2 + 0.4).toFixed(1),
      fill: "#ffffff",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": slotFontSize,
      "font-weight": usage === "used" ? "bold" : "normal",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "text-decoration": usage === "used" && entry.neId != null ? "underline" : "none",
      "pointer-events": "none",
    });
    textEl.textContent = labelText;
    slotGroup.appendChild(textEl);

    attachRackSlotHoverTip(slotGroup, slotRect, tipText);
    slotParent.appendChild(slotGroup);
  }

  // Bottom Plinth / Lower Air-Intake Grille
  const plinthY = bayY + bayH + 3;
  svg.appendChild(
    createRackSvgElement("rect", {
      x: fx + 6,
      y: plinthY,
      width: frontW - 12,
      height: baseH - 7,
      rx: 1.5,
      fill: "#0f172a",
      stroke: "#475569",
      "stroke-width": 0.9,
    })
  );
  const ventCols = 16;
  const ventStep = (frontW - 28) / ventCols;
  for (let v = 0; v < ventCols; v++) {
    svg.appendChild(
      createRackSvgElement("rect", {
        x: (fx + 14 + v * ventStep).toFixed(1),
        y: (plinthY + 4).toFixed(1),
        width: Math.max(3, ventStep * 0.52).toFixed(1),
        height: Math.max(4, baseH - 15).toFixed(1),
        rx: 1,
        fill: "#334155",
      })
    );
  }

  // CAD-style physical dimension callout annotations (Height, Width, Depth)
  const dimStroke = "#94a3b8";
  const drawDimLine = (x1, y1, x2, y2, label, lx, ly, rotate = null) => {
    svg.appendChild(
      createRackSvgElement("line", {
        x1: x1.toFixed(1),
        y1: y1.toFixed(1),
        x2: x2.toFixed(1),
        y2: y2.toFixed(1),
        stroke: dimStroke,
        "stroke-width": 1,
        "stroke-dasharray": "3 2",
      })
    );
    svg.appendChild(
      createRackSvgElement("circle", {
        cx: x1.toFixed(1),
        cy: y1.toFixed(1),
        r: 2,
        fill: dimStroke,
      })
    );
    svg.appendChild(
      createRackSvgElement("circle", {
        cx: x2.toFixed(1),
        cy: y2.toFixed(1),
        r: 2,
        fill: dimStroke,
      })
    );
    const tAttrs = {
      x: lx.toFixed(1),
      y: ly.toFixed(1),
      fill: "#cbd5e1",
      "font-family": "'Courier New', Courier, monospace",
      "font-size": "10",
      "text-anchor": "middle",
      "dominant-baseline": "central",
    };
    if (rotate != null) {
      tAttrs.transform = "rotate(" + rotate + " " + lx.toFixed(1) + " " + ly.toFixed(1) + ")";
    }
    const t = createRackSvgElement("text", tAttrs);
    t.textContent = label;
    svg.appendChild(t);
  };

  if (dims.height != null) {
    const hx = fx - 18;
    drawDimLine(
      hx,
      fy,
      hx,
      fy + frontH,
      "H: " + dims.height + dimUnit,
      hx - 14,
      fy + frontH / 2,
      -90
    );
  }
  if (dims.width != null) {
    const wy = fy + frontH + 22;
    drawDimLine(
      fx,
      wy,
      fx + frontW,
      wy,
      "W: " + dims.width + dimUnit,
      fx + frontW / 2,
      wy + 13
    );
  }
  if (dims.depth != null) {
    const dOffX = 12;
    const dOffY = 14;
    const dx1 = fbr.x + dOffX;
    const dy1 = fbr.y + dOffY;
    const dx2 = bbr.x + dOffX;
    const dy2 = bbr.y + dOffY;
    const angleDeg = (Math.atan2(dy2 - dy1, dx2 - dx1) * 180) / Math.PI;
    drawDimLine(
      dx1,
      dy1,
      dx2,
      dy2,
      "D: " + dims.depth + dimUnit,
      (dx1 + dx2) / 2 + 8,
      (dy1 + dy2) / 2 + 12,
      angleDeg.toFixed(1)
    );
  }

  container.appendChild(svg);
  return counts;
}

function fetchListRack() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/rack?country=" + selectedCountry,
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
      let suppliedRackId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/rack/",
        ""
      );
      let rackIds =
        "<option disabled value='-1' selected='selected'> -- select a rack -- </option>";
      if (suppliedRackId != null) {
        rackIds = "<option disabled value='-1'> -- select a rack -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedRackId == data[i]) {
          rackIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          rackIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("rackId").innerHTML = rackIds;
      if (suppliedRackId != null) {
        fetchRackPoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchRack() {
  let r = document.getElementById("rackId");
  rackId = r.options[r.selectedIndex].value;
  let p = document.getElementById("rackPoint");
  point = p.options[p.selectedIndex].value;
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/rack/" +
      rackId +
      "?point=" +
      point,
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
      if (data == null) {
        return;
      }
      let source = "historical";
      if (data.source != null) {
        source = data.source;
      }

      const counts = drawRack3D(grid, data, source, selectedCountry);
      let slotUsed = counts.used;
      let slotFree = counts.free;
      let slotReserved = counts.reserved;
      let slotFaulty = counts.faulty;

      if (data?.decommissioned == undefined) {
        data.decommissioned = "";
      }
      const rootUrl = localStorage.getItem("ni.rootUrl") || "";
      let metadata =
        '<div class="meta-section"><div class="meta-grid">' +
        '<span class="meta-label">Commissioned:</span><span class="meta-value">' +
        data.commissioned +
        "</span>" +
        '<span class="meta-label">Decommissioned:</span><span class="meta-value">' +
        data.decommissioned +
        "</span>" +
        '<span class="meta-label">Source:</span><span class="meta-value">' +
        source +
        "</span>" +
        "</div></div>" +
        '<div class="meta-section"><div class="meta-heading">Dimensions:</div><div class="meta-grid">' +
        '<span class="meta-label">H / W / D:</span><span class="meta-value">' +
        data.dimensions.height +
        " / " +
        data.dimensions.width +
        " / " +
        data.dimensions.depth +
        " " +
        data.dimensions.unit +
        "</span>" +
        '<span class="meta-label">Slots:</span><span class="meta-value">' +
        data.slots +
        "U</span>" +
        "</div></div>" +
        '<div class="meta-section"><div class="meta-heading">Location:</div><div class="meta-grid">' +
        '<span class="meta-label">Site:</span><span class="meta-value"><a href="' +
        rootUrl +
        "/site/" +
        data.siteId +
        "?country=" +
        selectedCountry +
        '" target="_self">' +
        data.siteId +
        "</a></span>" +
        '<span class="meta-label">X, Y, Z:</span><span class="meta-value">' +
        data.coordinate.x +
        ", " +
        data.coordinate.y +
        ", " +
        data.coordinate.z +
        "</span>" +
        '<span class="meta-label">Area:</span><span class="meta-value">' +
        (data.area != null ? data.area : "") +
        "</span>" +
        '<span class="meta-label">Floor:</span><span class="meta-value">' +
        (data.floor != null ? data.floor : "") +
        "</span>" +
        '<span class="meta-label">Row:</span><span class="meta-value">' +
        (data.row != null ? data.row : "") +
        "</span>" +
        "</div></div>" +
        '<div class="meta-section"><div class="meta-heading">Usage Summary:</div>' +
        '<div class="stateusage-key">' +
        '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
        slotFaulty +
        "</div>" +
        '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
        slotReserved +
        "</div>" +
        '<div id="stateusage-used" class="stateusage">Used: ' +
        slotUsed +
        "</div>" +
        '<div id="stateusage-free" class="stateusage">Free: ' +
        slotFree +
        "</div></div></div>";
      const metadataPanel = document.getElementById("metadataPanel");
      metadataPanel.innerHTML = metadata;
      requestAnimationFrame(() => fitRackMetadataPanel(metadataPanel));
    })
    .catch((e) => {
      console.error(e);
    });
}
let rackMetadataResizeObserver = null;
function fitRackMetadataPanel(panel) {
  if (!panel || !panel.innerHTML) {
    return;
  }
  const container =
    document.getElementById("right-rack-metadata") || panel.parentElement;
  if (
    container &&
    !rackMetadataResizeObserver &&
    typeof ResizeObserver !== "undefined"
  ) {
    rackMetadataResizeObserver = new ResizeObserver(() => {
      fitRackMetadataPanel(document.getElementById("metadataPanel"));
    });
    rackMetadataResizeObserver.observe(container);
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
function fetchRackPoints() {
  let r = document.getElementById("rackId");
  rackId = r.options[r.selectedIndex].value;
  if (rackId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/rack/timeline/" + rackId, {
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
        let rackPoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            rackPoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            rackPoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
        }
        document.getElementById("rackPoint").innerHTML = rackPoints;
        fetchRack();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
try {
  countryListPopulate(fetchListRack);
} catch (e) {
  console.error(e);
}
