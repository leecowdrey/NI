//=====================================================================
// Network Insight (NI) - JavaScript: Cable
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let cableId = null;
let cableRawPoints = [];
let point = null;

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function getCableStateStyle(state, source) {
  const stroke = source === "predicted" ? "#ffff00" : "#ffffff";
  switch (state) {
    case "free":
      return { fill: "#008000", stroke, text: "#ffffff" };
    case "used":
      return { fill: "#000000", stroke, text: "#ffffff" };
    case "reserved":
      return { fill: "#808080", stroke, text: "#ffffff" };
    case "faulty":
      return { fill: "#ff0000", stroke, text: "#ffffff" };
    default:
      return { fill: "#333333", stroke, text: "#ffffff" };
  }
}

function packCirclesInCircle(count, containerRadius, gap = 2) {
  if (count <= 0 || containerRadius <= 0) {
    return { radius: 0, positions: [] };
  }
  if (count === 1) {
    return {
      radius: Math.max(1, containerRadius - gap),
      positions: [{ x: 0, y: 0 }],
    };
  }
  if (count === 2) {
    const r = Math.max(1, (containerRadius - gap * 1.5) / 2);
    const d = r + gap / 2;
    return {
      radius: r,
      positions: [
        { x: -d, y: 0 },
        { x: d, y: 0 },
      ],
    };
  }

  function buildRings(r, innerCount) {
    const step = 2 * r + gap;
    const rings = [];
    let ringRadius = 0;
    if (innerCount === 1) {
      if (r + gap > containerRadius) {
        return null;
      }
      rings.push({ radius: 0, capacity: 1 });
      ringRadius = step;
    } else {
      const sinVal = Math.sin(Math.PI / innerCount);
      ringRadius = (r + gap / 2) / sinVal;
      if (ringRadius + r + gap > containerRadius) {
        return null;
      }
      rings.push({ radius: ringRadius, capacity: innerCount });
      ringRadius += step;
    }
    let total = innerCount;
    while (ringRadius + r + gap <= containerRadius && total < count) {
      const ratio = (r + gap / 2) / ringRadius;
      if (ratio >= 1) {
        break;
      }
      const cap = Math.floor(Math.PI / Math.asin(ratio));
      if (cap < 1) {
        break;
      }
      rings.push({ radius: ringRadius, capacity: cap });
      total += cap;
      ringRadius += step;
    }
    return total >= count ? rings : null;
  }

  function findBestRings(r) {
    for (let inner = 1; inner <= Math.min(6, count); inner++) {
      const rings = buildRings(r, inner);
      if (rings) {
        return rings;
      }
    }
    return null;
  }

  let low = 0.5;
  let high = containerRadius / 2;
  let bestR = low;
  let bestRings = null;
  for (let iter = 0; iter < 32; iter++) {
    const mid = (low + high) / 2;
    const rings = findBestRings(mid);
    if (rings) {
      bestR = mid;
      bestRings = rings;
      low = mid;
    } else {
      high = mid;
    }
  }

  const positions = [];
  if (!bestRings) {
    return { radius: bestR, positions };
  }
  let remaining = count;
  for (let i = 0; i < bestRings.length && remaining > 0; i++) {
    const ring = bestRings[i];
    const take = Math.min(remaining, ring.capacity);
    if (ring.radius === 0) {
      positions.push({ x: 0, y: 0 });
    } else {
      for (let k = 0; k < take; k++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * k) / take;
        positions.push({
          x: ring.radius * Math.cos(angle),
          y: ring.radius * Math.sin(angle),
        });
      }
    }
    remaining -= take;
  }
  return { radius: bestR, positions };
}

function getCableTooltipElement() {
  let tooltip = document.getElementById("cableHoverTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "cableHoverTooltip";
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
      padding: "4px 8px",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "12px",
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
    });
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function positionCableTooltip(tooltip, event) {
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

function hideCableTooltip() {
  const tooltip = document.getElementById("cableHoverTooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function attachCableHoverTip(el, text, highlightColor = "#38bdf8") {
  const originalStroke = el.getAttribute("stroke");
  const originalStrokeWidth = el.getAttribute("stroke-width");
  el.style.cursor = "pointer";
  el.style.pointerEvents = "all";
  el.addEventListener("mouseenter", (event) => {
    event.stopPropagation();
    const tooltip = getCableTooltipElement();
    tooltip.textContent = text;
    tooltip.style.display = "block";
    positionCableTooltip(tooltip, event);
    el.setAttribute("stroke", highlightColor);
    el.setAttribute(
      "stroke-width",
      String(Math.max(2, Number(originalStrokeWidth || 1) + 0.8))
    );
  });
  el.addEventListener("mousemove", (event) => {
    event.stopPropagation();
    const tooltip = getCableTooltipElement();
    if (tooltip.style.display === "block") {
      positionCableTooltip(tooltip, event);
    }
  });
  el.addEventListener("mouseleave", () => {
    hideCableTooltip();
    if (originalStroke != null) {
      el.setAttribute("stroke", originalStroke);
    }
    if (originalStrokeWidth != null) {
      el.setAttribute("stroke-width", originalStrokeWidth);
    }
  });
}

function drawCableCrossSection(container, data, source) {
  hideCableTooltip();
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 188;
  const jacketInnerRadius = 170;
  const isPredicted = source === "predicted";
  const sourceSuffix = isPredicted ? " (predicted)" : "";

  const svg = createSvgElement("svg", {
    viewBox: "0 0 " + size + " " + size,
    role: "img",
    "aria-label": "Cable cross-section (" + data.technology + ")",
    class: "cable-cross-section",
  });
  svg.style.width = "100%";
  svg.style.maxWidth = "400px";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.margin = "0 auto";
  svg.addEventListener("mouseleave", hideCableTooltip);

  // Outer cable jacket / sheath
  svg.appendChild(
    createSvgElement("circle", {
      cx,
      cy,
      r: outerRadius,
      fill: "#262f40",
      stroke: isPredicted ? "#ffff00" : "#9aa7bd",
      "stroke-width": 4,
    })
  );

  // Inner insulation / core cavity
  svg.appendChild(
    createSvgElement("circle", {
      cx,
      cy,
      r: jacketInnerRadius,
      fill: "#111827",
      stroke: "#4b5563",
      "stroke-width": 2,
    })
  );

  const counts = { used: 0, free: 0, reserved: 0, faulty: 0 };
  const tally = (state) => {
    if (state === "free") counts.free += 1;
    else if (state === "used") counts.used += 1;
    else if (state === "reserved") counts.reserved += 1;
    else if (state === "faulty") counts.faulty += 1;
  };

  const drawCoreCircle = (parent, x, y, r, state, label, tooltip, strokeWidth = 1.5) => {
    const style = getCableStateStyle(state, source);
    const fullTip = tooltip + sourceSuffix;
    const g = createSvgElement("g");
    const title = createSvgElement("title");
    title.textContent = fullTip;
    g.appendChild(title);

    const circle = createSvgElement("circle", {
      cx: x.toFixed(2),
      cy: y.toFixed(2),
      r: Math.max(1, r).toFixed(2),
      fill: style.fill,
      stroke: style.stroke,
      "stroke-width": strokeWidth,
    });
    attachCableHoverTip(circle, fullTip);
    g.appendChild(circle);

    if (label != null) {
      const labelStr = String(label);
      const maxWidth = r * 1.7;
      const fontSize = Math.min(
        16,
        Math.max(2.5, Math.min(r * 0.95, maxWidth / (labelStr.length * 0.62)))
      );
      const text = createSvgElement("text", {
        x: x.toFixed(2),
        y: y.toFixed(2),
        fill: style.text,
        "font-family": "'Courier New', Courier, monospace",
        "font-size": fontSize.toFixed(1),
        "font-weight": "bold",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "pointer-events": "none",
      });
      text.textContent = labelStr;
      g.appendChild(text);
    }
    parent.appendChild(g);
  };

  switch (data.technology) {
    case "coax": {
      const state = data.configuration.state || "free";
      tally(state);
      // Braided outer shield & dielectric rings characteristic of coax cross-section
      svg.appendChild(
        createSvgElement("circle", {
          cx,
          cy,
          r: 148,
          fill: "#1f2937",
          stroke: "#cbd5e1",
          "stroke-width": 3,
          "stroke-dasharray": "6 4",
        })
      );
      svg.appendChild(
        createSvgElement("circle", {
          cx,
          cy,
          r: 120,
          fill: "#334155",
          stroke: "#64748b",
          "stroke-width": 1.5,
        })
      );
      drawCoreCircle(svg, cx, cy, 64, state, "1", "Coax Core: " + state, 2.5);
      break;
    }
    case "copper": {
      const state = data.configuration.state || "free";
      tally(state);
      const pairs = Math.max(1, toInteger(data.configuration.twistedPairs));
      // Inner shield ring
      svg.appendChild(
        createSvgElement("circle", {
          cx,
          cy,
          r: 152,
          fill: "#182132",
          stroke: "#b87333",
          "stroke-width": 2.5,
        })
      );
      const packed = packCirclesInCircle(pairs, 142, pairs > 12 ? 2 : 3);
      for (let j = 0; j < packed.positions.length; j++) {
        const pos = packed.positions[j];
        drawCoreCircle(
          svg,
          cx + pos.x,
          cy + pos.y,
          packed.radius,
          state,
          j + 1,
          "Pair " + (j + 1) + ": " + state,
          packed.radius > 10 ? 1.5 : 1
        );
      }
      break;
    }
    case "ethernet": {
      const state = data.configuration.state || "free";
      tally(state);
      svg.appendChild(
        createSvgElement("circle", {
          cx,
          cy,
          r: 148,
          fill: "#1f2937",
          stroke: "#64748b",
          "stroke-width": 2,
        })
      );
      drawCoreCircle(svg, cx, cy, 64, state, "1", "Ethernet Core: " + state, 2.5);
      break;
    }
    case "singleFiber": {
      const strands = Math.max(1, toInteger(data.configuration.strands));
      const statesArr = Array.isArray(data.configuration.states)
        ? data.configuration.states
        : [];
      const stateByStrand = new Map();
      for (let idx = 0; idx < statesArr.length; idx++) {
        if (statesArr[idx]?.strand != null) {
          stateByStrand.set(toInteger(statesArr[idx].strand), statesArr[idx].state);
        }
      }
      const gap = strands > 24 ? 2 : 3.5;
      const packed = packCirclesInCircle(strands, jacketInnerRadius - 6, gap);
      for (let j = 0; j < strands; j++) {
        const strandNum = j + 1;
        const st =
          stateByStrand.get(strandNum) ||
          statesArr[j]?.state ||
          "free";
        tally(st);
        const pos = packed.positions[j];
        drawCoreCircle(
          svg,
          cx + pos.x,
          cy + pos.y,
          packed.radius,
          st,
          strandNum,
          "Strand " + strandNum + ": " + st,
          packed.radius > 12 ? 1.8 : 1.2
        );
      }
      break;
    }
    case "multiFiber": {
      const ribbons = Math.max(1, toInteger(data.configuration.ribbons));
      const strands = Math.max(1, toInteger(data.configuration.strands));
      const statesArr = Array.isArray(data.configuration.states)
        ? data.configuration.states
        : [];
      const stateByKey = new Map();
      for (let idx = 0; idx < statesArr.length; idx++) {
        const entry = statesArr[idx];
        if (entry?.ribbon != null && entry?.strand != null) {
          stateByKey.set(
            toInteger(entry.ribbon) + ":" + toInteger(entry.strand),
            entry.state
          );
        }
      }
      const tubeGap = ribbons > 12 ? 2.5 : 4;
      const packedTubes = packCirclesInCircle(
        ribbons,
        jacketInnerRadius - 6,
        tubeGap
      );
      for (let o = 0; o < ribbons; o++) {
        const tubePos = packedTubes.positions[o];
        const tx = cx + tubePos.x;
        const ty = cy + tubePos.y;
        const tubeR = packedTubes.radius;

        // Buffer tube / ribbon bundle jacket
        const tubeGroup = createSvgElement("g");
        const tubeTip = "Ribbon " + (o + 1) + " (" + strands + " strands)" + sourceSuffix;
        const tubeTitle = createSvgElement("title");
        tubeTitle.textContent = tubeTip;
        tubeGroup.appendChild(tubeTitle);
        const tubeCircle = createSvgElement("circle", {
          cx: tx.toFixed(2),
          cy: ty.toFixed(2),
          r: Math.max(2, tubeR).toFixed(2),
          fill: "#1e293b",
          stroke: isPredicted ? "#ffff00" : "#94a3b8",
          "stroke-width": tubeR > 20 ? 1.8 : 1,
        });
        attachCableHoverTip(tubeCircle, tubeTip, "#e2e8f0");
        tubeGroup.appendChild(tubeCircle);

        const innerCavity = Math.max(1.5, tubeR - Math.max(1.5, tubeR * 0.08));
        const strandGap = Math.max(0.6, innerCavity * 0.04);
        const packedStrands = packCirclesInCircle(strands, innerCavity, strandGap);
        for (let j = 0; j < strands; j++) {
          const ribbonNum = o + 1;
          const strandNum = j + 1;
          const st =
            stateByKey.get(ribbonNum + ":" + strandNum) ||
            statesArr[o * strands + j]?.state ||
            "free";
          tally(st);
          const spos = packedStrands.positions[j];
          const label = ribbonNum + "." + strandNum;
          drawCoreCircle(
            tubeGroup,
            tx + spos.x,
            ty + spos.y,
            packedStrands.radius,
            st,
            label,
            "Ribbon " + ribbonNum + " · Strand " + strandNum + ": " + st,
            packedStrands.radius > 8 ? 1.2 : 0.7
          );
        }
        svg.appendChild(tubeGroup);
      }
      break;
    }
  }

  container.appendChild(svg);
  return counts;
}

function fetchListCable() {
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/cable?country=" +
      niSelectedCountry,
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
      let suppliedCableId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/cable/",
        ""
      );
      let cableIds =
        "<option disabled value='-1' selected='selected'> -- select a cable -- </option>";
      if (suppliedCableId != null) {
        cableIds =
          "<option disabled value='-1'> -- select a cable -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedCableId == data[i]) {
          cableIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          cableIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("cableId").innerHTML = cableIds;
      if (suppliedCableId != null) {
        fetchCablePoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchCable(cableId, point = null) {
  if (cableId == null) {
    let r = document.getElementById("cableId");
    cableId = r.options[r.selectedIndex].value;
  }
  if (point == null) {
    let p = document.getElementById("cablePoint");
    point = p.options[p.selectedIndex].value;
  }
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/cable/" +
      cableId +
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
      if (data?.configuration != null) {
        let c = document.getElementById("country");
        let selectedCountry = c.options[c.selectedIndex].value;
        let source = "historical";
        if (data.source != null) {
          source = data.source;
        }
        const counts = drawCableCrossSection(grid, data, source);
        let cableUsed = counts.used;
        let cableFree = counts.free;
        let cableReserved = counts.reserved;
        let cableFaulty = counts.faulty;

        let metadata =
          "<b>Reference:</b>&emsp;" +
          (data.reference != null ? data.reference : "") +
          "&emsp;( " +
          cableId +
          " )<br>&emsp;Source:&emsp;" +
          data.source +
          "<br>";
        switch (data.technology) {
          case "coax":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Coax<br>" +
              "&emsp;Frequency Range:&emsp;" +
              data.configuration.frequencyRange.low +
              data.configuration.unit +
              " to " +
              data.configuration.frequencyRange.high +
              data.configuration.unit +
              "<br>" +
              "&emsp;Channels:&emsp;" +
              data.configuration.channels +
              " of " +
              data.configuration.width +
              data.configuration.unit +
              "<br>";
            break;
          case "copper":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Copper<br>" +
              "&emsp;Twisted Pairs:&emsp;" +
              data.configuration.twistedPairs +
              "<br>";
            break;
          case "ethernet":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Ethernet<br>" +
              "&emsp;Category:&emsp;" +
              data.configuration.category +
              "<br>" +
              "&emsp;Transmission:&emsp;" +
              data.configuration.rate +
              data.configuration.unit +
              "<br>";
            break;
          case "singleFiber":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Single-Fiber<br>" +
              "&emsp;Strands:&emsp;" +
              data.configuration.strands +
              "<br>" +
              "&emsp;Mode:&emsp;" +
              data.configuration.mode +
              "<br>" +
              "&emsp;Transmission:&emsp;" +
              data.configuration.rate +
              data.configuration.unit +
              " per strand<br>";
            break;
          case "multiFiber":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Multi-Fiber<br>" +
              "&emsp;Ribbons.Strands:&emsp;" +
              data.configuration.ribbons +
              "." +
              data.configuration.strands +
              "<br>" +
              "&emsp;Mode:&emsp;" +
              data.configuration.mode +
              "<br>" +
              "&emsp;Transmission:&emsp;" +
              data.configuration.rate +
              data.configuration.unit +
              " per strand<br>";
            break;
        }
        metadata = metadata + "<br><b>Location</b>:<br>";
        if (data.ductId != null) {
          metadata =
            metadata +
            "&emsp;Duct:&emsp;" +
            '<a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/duct/" +
            data.ductId +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.ductId +
            "</a><br>";
        }
        if (data.poleId != null) {
          metadata =
            metadata +
            "&emsp;Pole:&emsp;" +
            '<a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/pole/" +
            data.poleId +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.poleId +
            "</a><br>";
        }
        metadata =
          metadata +
          "<br><b>Usage Summary:</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
          cableFaulty +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
          cableReserved +
          "</div>" +
          '<div id="stateusage-used" class="stateusage">Used: ' +
          cableUsed +
          "</div>" +
          '<div id="stateusage-free" class="stateusage">Free: ' +
          cableFree +
          "</div></div>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchCablePoints() {
  let r = document.getElementById("cableId");
  cableId = r.options[r.selectedIndex].value;
  if (cableId != "-1") {
    fetch(
      localStorage.getItem("ni.gatewayUrl") + "/cable/timeline/" + cableId,
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
        cableRawPoints = [];
        let cablePoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            cablePoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            cablePoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
          cableRawPoints.push(data[i].point);
        }
        document.getElementById("cablePoint").innerHTML = cablePoints;
        fetchCable();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
try {
  countryListPopulate(fetchListCable);
} catch (e) {
  console.error(e);
}
