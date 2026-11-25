//=====================================================================
// Network Insight (NI) - JavaScript: trenchLifetime
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
var map = null;
var trenchPath;
var tPath = {};
var tPoly = {};
var lineSymbol;
let trenchId = null;
let mapVendor = null;
let mapId = "DEMO_MAP_ID";
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let startMarker = {};
let endMarker = {};
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let mapRenderReady = null;
let MapCtor = null;
let PolylineCtor = null;
let InfoWindowCtor = null;
let AdvancedMarkerElementCtor = null;
var ductPanel = null;
var polePanel = null;
let ductList = "";
let poleList = "";
var tipObj = null;

function injectTooltip(event, data) {
  if (!tipObj && event) {
    tipObj = document.createElement("div");
    tipObj.setAttribute("class", "mappolytooltip");
    tipObj.innerHTML = data;
    document.body.appendChild(tipObj);
  }
}
function deleteTooltip(event) {
  if (tipObj) {
    //delete the tooltip if it exists in the DOM
    document.body.removeChild(tipObj);
    tipObj = null;
  }
}
function fetchTrenchPremisesPassed(id, p) {
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/trench/premisesPassed/" +
      id +
      "?point=" +
      p,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data != null) {
        if (data.passed != null) {
          document
            .getElementById("trenchPremisesPassed")
            .setAttribute("value", data.passed);
        }
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchTrenchDistance(id, p) {
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/trench/distance/" +
      id +
      "?point=" +
      p,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data != null) {
        if (data.distance != null && data.unit != null) {
          document
            .getElementById("trenchDistance")
            .setAttribute("value", data.distance + data.unit);
        }
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchListTrench() {
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/trench?country=" +
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
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return;
      }
      let suppliedTrenchId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/trenchLifetime/",
        ""
      );
      let trenchIds =
        "<option disabled value='-1' selected='selected'> -- select a trench -- </option>";
      if (suppliedTrenchId != null) {
        trenchIds =
          "<option disabled value='-1'> -- select a trench -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedTrenchId == data[i]) {
          trenchIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          trenchIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("trenchId").innerHTML = trenchIds;
      document.getElementById("trenchDistance").setAttribute("value", "");
      if (suppliedTrenchId != null) {
        fetchTrenchGeometryLifetime();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

function fetchMapRender() {
  mapRenderReady = fetch(
    localStorage.getItem("ni.gatewayUrl") + "/ui/mapRender",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      console.error("Failed to fetch /ui/mapRender:", response.status);
    })
    .then((data) => {
      let validated = validateMapRenderResponse(data);
      if (validated == null) {
        return;
      }
      mapVendor = validated.vendor;
      mapId = validated.mapId;
      document.getElementById("mapVendor").innerHTML =
        "<option value='" +
        validated.vendor +
        "' selected='selected'>" +
        validated.vendor +
        "</option>";
      // <option disabled value='OpenStreet Map'>OpenStreet Map</option>
      // <option disabled value='Microsoft Azure'>Microsoft Azure</option>
      // <option disabled value='ERSI'>ERSI</option>
      mapRenderUrl = buildGoogleMapsScriptUrl(validated.url, "displayMap");
    })
    .catch((e) => {
      console.error(e);
    });
  return mapRenderReady;
}
async function wipeMapClean() {
  for (let key in startMarker) {
    if (startMarker[key] != null) {
      startMarker[key].map = null;
      startMarker[key] = null;
    }
  }
  startMarker = {};
  for (let key in endMarker) {
    if (endMarker[key] != null) {
      endMarker[key].map = null;
      endMarker[key] = null;
    }
  }
  endMarker = {};
  for (let key in tPoly) {
    if (tPoly[key] != null) {
      tPoly[key].setMap(null);
      tPoly[key] = null;
    }
  }
  tPoly = {};
  tPath = {};
}
async function drawOnMap() {
  if (
    map == null ||
    PolylineCtor == null ||
    AdvancedMarkerElementCtor == null ||
    !Array.isArray(trenchCoordinates?.sets)
  ) {
    return;
  }
  if (trenchCoordinates.sets.length > 0) {
    let lastPoint =
      trenchCoordinates.sets[trenchCoordinates.sets.length - 1]?.point;
    if (lastPoint != null) {
      fetchTrenchPremisesPassed(trenchId, lastPoint);
      fetchTrenchDistance(trenchId, lastPoint);
    }
  }
  for (let s = 0; s < trenchCoordinates.sets.length; s++) {
    let setInfo = trenchCoordinates.sets[s];
    if (setInfo == null || setInfo.point == null) {
      continue;
    }
    let tSet = setInfo.point;
    let rawCoords = trenchCoordinates[tSet];
    if (!Array.isArray(rawCoords) || rawCoords.length === 0) {
      continue;
    }
    if (setInfo.source == "predicted") {
      trenchOpacity = 0;
      if (s % 2 == 0) {
        trenchColor = "#FFFF00";
      } else {
        trenchColor = "#CCCC00";
      }
    } else {
      trenchOpacity = 1.0;
      if (s % 2 == 0) {
        trenchColor = "#8B0000";
      } else {
        trenchColor = "#FF6600";
      }
    }
    tPath[tSet] = [];
    for (let c = 0; c < rawCoords.length; c++) {
      let coord = validateMapCoordinate(rawCoords[c]);
      if (coord != null) {
        tPath[tSet].push(coord);
      }
    }
    if (tPath[tSet].length === 0) {
      continue;
    }
    startMarker[tSet] = new AdvancedMarkerElementCtor({
      position: tPath[tSet][0],
      content: createMapDotElement(trenchColor, 12),
      map: map,
      title: String(tSet),
    });
    if (tPath[tSet].length > 1) {
      endMarker[tSet] = new AdvancedMarkerElementCtor({
        position: tPath[tSet][tPath[tSet].length - 1],
        content: createMapDotElement(trenchColor, 12),
        map: map,
        title: String(tSet),
      });
    }
    tPoly[tSet] = new PolylineCtor({
      path: tPath[tSet],
      strokeOpacity: trenchOpacity,
      strokeColor: trenchColor,
      strokeWeight: 4,
      icons: [
        {
          icon: lineSymbol,
          offset: "0",
          repeat: "20px",
        },
      ],
      map: map,
    });
    tPoly[tSet].addListener("click", function (h) {
      if (ductPanel != null) {
        ductPanel.close();
      }
      ductPanel = new InfoWindowCtor({
        headerContent: "Ducts",
        position: h.latLng,
        content: "<ul><li>none</li></ul>",
      });
      ductPanel.open({
        shouldFocus: true,
        map: map,
      });
    });
    tPoly[tSet].addListener("mouseover", function (e) {
      injectTooltip(e, trenchId);
    });
    tPoly[tSet].addListener("mouseout", function (e) {
      deleteTooltip(e);
    });
    tPoly[tSet].addListener("rightclick", function (h) {
      if (polePanel != null) {
        polePanel.close();
      }
      polePanel = new InfoWindowCtor({
        headerContent: "Poles",
        position: h.latLng,
        content: "<ul><li>none</li></ul>",
      });
      polePanel.open({
        shouldFocus: true,
        map: map,
      });
    });
  }
}
async function displayMap() {
  try {
    const mapsLib = await google.maps.importLibrary("maps");
    const markerLib = await google.maps.importLibrary("marker");
    MapCtor = mapsLib.Map;
    PolylineCtor = mapsLib.Polyline;
    InfoWindowCtor = mapsLib.InfoWindow;
    AdvancedMarkerElementCtor = markerLib.AdvancedMarkerElement;

    map = new MapCtor(document.getElementById("map"), {
      zoom: 17,
      center: mapCenter,
      mapTypeId: "hybrid",
      mapId: mapId,
      disableDefaultUI: true,
    });
    lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1.0,
      scale: 4,
    };
    await drawOnMap();
  } catch (e) {
    console.error("Failed to initialize Google Map for trenchLifetime:", e);
  }
}
async function fetchTrenchGeometryLifetime() {
  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;
  if (trenchId == "-1") {
    return;
  }

  await fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/trench/geometry/lifetime/" +
      trenchId,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then(async (data) => {
      if (data != null && typeof data === "object") {
        trenchCoordinates = JSON.parse(JSON.stringify(data));
        if (
          Array.isArray(trenchCoordinates.sets) &&
          trenchCoordinates.sets.length > 0
        ) {
          let tSet = trenchCoordinates.sets[0]?.point;
          if (
            tSet != null &&
            Array.isArray(trenchCoordinates[tSet]) &&
            trenchCoordinates[tSet].length > 0
          ) {
            let firstCoord = validateMapCoordinate(trenchCoordinates[tSet][0]);
            if (firstCoord != null) {
              mapCenter = firstCoord;
            }
          }
        }
      }
      if (map != null) {
        map.setCenter(mapCenter);
        await wipeMapClean();
        await drawOnMap();
      } else {
        if (mapRenderReady != null) {
          await mapRenderReady;
        }
        loadGoogleMaps(mapRenderUrl, displayMap);
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  fetchMapRender();
  countryListPopulate(fetchListTrench);
} catch (e) {
  console.error(e);
}
