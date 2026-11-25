//=====================================================================
// Network Insight (NI) - JavaScript: Duct
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let ductId = null;
let ductRawPoints = [];
let point = null;

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function getDuctStateStyle(state, source) {
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

function drawDuctCrossSection(container, data, source) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 188;
  const wallThickness = data.category === "subduct" ? 12 : 20;
  const innerRadius = outerRadius - wallThickness;
  const isPredicted = source === "predicted";
  const ways = Math.max(1, toInteger(data.configuration));
  const state = data.state || "free";

  const svg = createSvgElement("svg", {
    viewBox: "0 0 " + size + " " + size,
    role: "img",
    "aria-label":
      (data.category === "subduct" ? "Sub-duct" : "Duct") +
      " cross-section (" +
      ways +
      "-way)",
    class: "duct-cross-section",
  });
  svg.style.width = "100%";
  svg.style.maxWidth = "400px";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.margin = "0 auto";

  // Outer duct casing / pipe wall
  svg.appendChild(
    createSvgElement("circle", {
      cx,
      cy,
      r: outerRadius,
      fill: data.category === "subduct" ? "#334155" : "#475569",
      stroke: isPredicted ? "#ffff00" : "#cbd5e1",
      "stroke-width": 4,
    })
  );

  // Inner bore / conduit cavity
  svg.appendChild(
    createSvgElement("circle", {
      cx,
      cy,
      r: innerRadius,
      fill: "#111827",
      stroke: "#64748b",
      "stroke-width": 2,
    })
  );

  const counts = { used: 0, free: 0, reserved: 0, faulty: 0 };
  const style = getDuctStateStyle(state, source);
  const gap = ways > 24 ? 2.5 : 4;
  const packed = packCirclesInCircle(ways, innerRadius - 6, gap);

  for (let j = 0; j < ways; j++) {
    if (state === "free") counts.free += 1;
    else if (state === "used") counts.used += 1;
    else if (state === "reserved") counts.reserved += 1;
    else if (state === "faulty") counts.faulty += 1;

    const wayNum = j + 1;
    const pos = packed.positions[j];
    const x = cx + pos.x;
    const y = cy + pos.y;
    const r = packed.radius;

    const g = createSvgElement("g", { id: "duct0-" + j });
    const title = createSvgElement("title");
    title.textContent = "Way " + wayNum + ": " + state;
    g.appendChild(title);

    // Individual duct bore / sub-conduit wall
    g.appendChild(
      createSvgElement("circle", {
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: Math.max(1, r).toFixed(2),
        fill: style.fill,
        stroke: style.stroke,
        "stroke-width": r > 14 ? 2.2 : 1.4,
      })
    );

    // Inner bore accent ring when large enough to give authentic pipe depth
    if (r >= 18) {
      g.appendChild(
        createSvgElement("circle", {
          cx: x.toFixed(2),
          cy: y.toFixed(2),
          r: (r * 0.84).toFixed(2),
          fill: "none",
          stroke: "rgba(255,255,255,0.22)",
          "stroke-width": 1,
        })
      );
    }

    if (r >= 7) {
      const fontSize = Math.min(18, Math.max(7, r * 0.78));
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
      text.textContent = String(wayNum);
      g.appendChild(text);
    }
    svg.appendChild(g);
  }

  container.appendChild(svg);
  return counts;
}

function updateDuctPointFromSlider() {
  document.getElementById("ductPoint").value =
    ductRawPoints[
      ductRawPoints.length - document.getElementById("ductPointRange").value
    ];
  fetchDuct();
}
function fetchDuctPoints() {
  let r = document.getElementById("ductId");
  ductId = r.options[r.selectedIndex].value;
  if (ductId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/duct/timeline/" + ductId, {
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
        ductRawPoints = [];
        let ductPoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            ductPoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            ductPoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
          ductRawPoints.push(data[i].point);
        }
        document.getElementById("ductPoint").innerHTML = ductPoints;
        fetchDuct();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
function fetchListDuct() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/duct?country=" + selectedCountry,
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
      let suppliedDuctId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/duct/",
        ""
      );
      let ductIds =
        "<option disabled value='-1' selected='selected'> -- select a duct -- </option>";
      if (suppliedDuctId != null) {
        ductIds =
          "<option disabled value='-1'> -- select a duct -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedDuctId == data[i]) {
          ductIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          ductIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("ductId").innerHTML = ductIds;
      if (suppliedDuctId != null) {
        fetchDuctPoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchDuct() {
  let r = document.getElementById("ductId");
  ductId = r.options[r.selectedIndex].value;
  let p = document.getElementById("ductPoint");
  point = p.options[p.selectedIndex].value;
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/duct/" +
      ductId +
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
        let source = "historical";
        let c = document.getElementById("country");
        let selectedCountry = c.options[c.selectedIndex].value;
        if (data.source != null) {
          source = data.source;
        }

        const counts = drawDuctCrossSection(grid, data, source);
        let ductUsed = counts.used;
        let ductFree = counts.free;
        let ductReserved = counts.reserved;
        let ductFaulty = counts.faulty;

        let metadata = "<b>Reference:</b>&emsp;";
        if (data.reference != null) {
          metadata = metadata + data.reference;
        }
        metadata =
          metadata +
          "&emsp;( " +
          ductId +
          " )<br>&emsp;Source:&emsp;" +
          data.source +
          "<br><br>" +
          "&emsp;Purpose:&emsp;" +
          data.purpose +
          "<br>" +
          "&emsp;Category:&emsp;" +
          data.category +
          "<br>" +
          "&emsp;Configuration:&emsp;" +
          data.configuration +
          "-way<br>";
        if (data.within != null) {
          metadata +=
            "&emsp;Within Duct:&emsp;" +
            ' <a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/duct/" +
            data.within +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.within +
            "</a><br>";
        }
        if (data.placement != null) {
          metadata +=
            "&emsp;Placement:&emsp;H=" +
            data.placement.horizontal +
            data.placement.unit +
            "&emsp;V=" +
            data.placement.vertical +
            data.placement.unit +
            "<br>";
        }
        metadata = metadata + "<br><b>Location</b>:<br>";
        metadata +=
          "&emsp;Trench:&emsp;" +
          ' <a href="' +
          localStorage.getItem("ni.rootUrl") +
          "/trench/" +
          data.trenchId +
          "?country=" +
          selectedCountry +
          '" target="_self">' +
          data.trenchId +
          "</a><br>";

        if (data.category == "duct") {
          metadata = metadata + "<br><b>Sub-Ducts:</b><br>";
          if (Array.isArray(data.subduct) && data.subduct.length > 0) {
            for (let c = 0; c < data.subduct.length; c++) {
              metadata +=
                '&emsp;<a href="' +
                localStorage.getItem("ni.rootUrl") +
                "/duct/" +
                data.subduct[c] +
                "?country=" +
                selectedCountry +
                '" target="_self">' +
                data.subduct[c] +
                "</a><br>";
            }
          }
        }
        metadata = metadata + "<br><b>Cables:</b><br>";
        if (Array.isArray(data.cable)) {
          for (let c = 0; c < data.cable.length; c++) {
            metadata +=
              "&emsp;" +
              ' <a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/cable/" +
              data.cable[c] +
              "?country=" +
              selectedCountry +
              '" target="_self">' +
              data.cable[c] +
              "</a><br>";
          }
        }
        metadata +=
          "<br>" +
          "<br><b>Usage Summary:</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
          ductFaulty +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
          ductReserved +
          "</div>" +
          '<div id="stateusage-used" class="stateusage">Used: ' +
          ductUsed +
          "</div>" +
          '<div id="stateusage-free" class="stateusage">Free: ' +
          ductFree +
          "</div></div>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  countryListPopulate(fetchListDuct);
} catch (e) {
  console.error(e);
}
