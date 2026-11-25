//=====================================================================
// Network Insight (NI) - JavaScript: Q2C
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
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let mapRenderReady = null;
let MapCtor = null;
let PolylineCtor = null;
let polyline = null;
let path = null;
let defaultCurrencyIsoCode = "GBP";
let calcIsoCode = "GBP";
let calcSymbol = "£";
let calcCost = 0;
let calcDistance = 0;
let calcUnit = "m";
let calcRate = 1;
let kmlPolyColor = "647800f0";
let niStrokeColor = "#F00078";
let niStrokeOpacity = 1.0;
let niStrokeWeight = 4;
function jsonSortByMultiKeys(arr, keys) {
  if (Array.isArray(arr)) {
    return arr.sort((x, y) => {
      for (let key of keys) {
        if (x[key] < y[key]) return -1;
        if (x[key] > y[key]) return 1;
      }
      return 0;
    });
  } else {
    return arr;
  }
}
function trenchSave() {
  // reduce to unique lat lng
  if (typeof pathCoordinates !== "undefined" && pathCoordinates.length > 0) {
    pathCoordinates = Array.from(
      new Set(pathCoordinates.map(JSON.stringify))
    ).map(JSON.parse);
  }
}
function saveToDisk(filename, data, type = "application/xml") {
  let blob = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}
function trenchExportKml() {
  let p = document.getElementById("trenchPurpose");
  let t = document.getElementById("trenchId");
  let tcm = document.getElementById("trenchConstructionMethod");
  let selectedTrenchId = t.options[t.selectedIndex].value;
  let coordinates = [];
  if (path != null) {
    if (path.getLength() > 0) {
      path.forEach((pt) => {
        coordinates.push({ x: pt.lng(), y: pt.lat() });
      });
      coordinates = Array.from(new Set(coordinates.map(JSON.stringify))).map(
        JSON.parse
      );
    }
  }
  let kmlData = '<?xml version="1.0" encoding="UTF-8"?>\n';
  kmlData +=
    '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:ni="http://www.cowdrey.net/ni/kml/ext/1.0">\n';
  kmlData += "  <Document>\n";
  kmlData += '    <Style id="niLineStyle">\n';
  kmlData += "      <LineStyle>\n";
  kmlData += "        <color>" + kmlPolyColor + "</color>\n";
  kmlData += "        <width>" + niStrokeWeight + "</width>\n";
  kmlData += "      </LineStyle>\n";
  kmlData += "    </Style>\n";
  kmlData +=
    "    <name>" + document.getElementById("reference").value + "</name>\n";
  kmlData += "    <open>1</open>\n";
  kmlData +=
    "    <description><![CDATA[<div>Trench proposal " +
    document.getElementById("reference").value +
    " generated " +
    document.getElementById("referenceDate").value +
    "</div>]]></description>\n";
  kmlData += "    <LookAt>\n";
  if (coordinates.length > 0) {
    kmlData += "      <longitude>" + coordinates[0].x + "</longitude>\n";
    kmlData += "      <latitude>" + coordinates[0].y + "</latitude>\n";
  } else {
    kmlData += "      <longitude>0</longitude>\n";
    kmlData += "      <latitude>0</latitude>\n";
  }
  kmlData += "      <altitude>0</altitude>\n";
  kmlData += "      <heading>0</heading>\n";
  kmlData += "      <tilt>0</tilt>\n";
  kmlData += "      <range>0</range>\n";
  if (selectedTrenchId != "-1") {
    kmlData +=
      "      <ni:linkTrenchId>" + selectedTrenchId + "</ni:linkTrenchId>\n";
  }
  kmlData += "    </LookAt>\n";
  kmlData += "    <Placemark>\n";
  kmlData += "      <ExtendedData>\n";
  kmlData += "        <ni:Q2cData>\n";
  kmlData +=
    "          <ni:Q2cReference>" +
    document.getElementById("reference").value +
    "</ni:Q2cReference>\n";
  kmlData +=
    "          <ni:Q2cDate>" +
    document.getElementById("referenceDate").value +
    "</ni:Q2cDate>\n";
  kmlData +=
    "          <ni:Q2cPurpose>" +
    p.options[p.selectedIndex].value +
    "</ni:Q2cPurpose>\n";
  if (p.options[p.selectedIndex].value == "unclassified") {
    kmlData +=
      "          <ni:Q2cConstructionType>" +
      tcm.options[tcm.selectedIndex].value +
      "</ni:Q2cConstructionType>\n";
  }
  kmlData +=
    "          <ni:Q2cCurrencyIsoCode>" +
    calcIsoCode +
    "</ni:Q2cCurrencyIsoCode>\n";
  kmlData +=
    "          <ni:Q2cCurrencySymbol>" +
    calcSymbol +
    "</ni:Q2cCurrencySymbol>\n";
  kmlData +=
    "          <ni:Q2cCurrencyRateFromDefault>" +
    calcRate +
    "</ni:Q2cCurrencyRateFromDefault>\n";
  kmlData += "          <ni:Q2cLength>" + calcDistance + "</ni:Q2cLength>\n";
  kmlData += "          <ni:Q2cUnit>" + calcUnit + "</ni:Q2cUnit>\n";
  kmlData += "          <ni:Q2cCost>" + calcCost + "</ni:Q2cCost>\n";
  kmlData += "        </ni:Q2cData>\n";
  kmlData += "      </ExtendedData>\n";
  kmlData += "      <name>Proposed Path</name>\n";
  kmlData += "      <styleUrl>#niLineStyle</styleUrl>\n";
  kmlData += "      <LineString>\n";
  kmlData += "        <tessellate>1</tessellate>\n";
  kmlData += "        <altitudeMode>clampToGround</altitudeMode>\n";
  kmlData += "        <coordinates>\n";
  if (coordinates.length > 0) {
    for (let c = 0; c < coordinates.length; c++) {
      kmlData +=
        "          " + coordinates[c].x + "," + coordinates[c].y + ",0\n";
    }
  }
  kmlData += "        </coordinates>\n";
  kmlData += "      </LineString>\n";
  kmlData += "    </Placemark>\n";
  kmlData += "  </Document>\n";
  kmlData += "</kml>";
  saveToDisk(
    "ni-" + document.getElementById("reference").value + ".kml",
    kmlData,
    "application/xml"
  );
}
function toggleConstruction() {
  let p = document.getElementById("trenchPurpose");
  if (p.options[p.selectedIndex].value == "unclassified") {
    document.getElementById("trenchConstructionMethodLabel").hidden = false;
    document.getElementById("trenchConstructionMethod").hidden = false;
  } else {
    document.getElementById("trenchConstructionMethodLabel").hidden = true;
    document.getElementById("trenchConstructionMethod").hidden = true;
  }
}
function trenchCalc() {
  document.getElementById("reference").value = generateUUID();
  document.getElementById("referenceDate").value = new Date().toISOString();
  let p = document.getElementById("trenchPurpose");
  let tcm = document.getElementById("trenchConstructionMethod");
  let c = document.getElementById("currency");
  let t = document.getElementById("trenchId");
  let selectedTrenchId = t.options[t.selectedIndex].value;
  let reqJson = {
    purpose: p.options[p.selectedIndex].value,
    isoCode: c.options[c.selectedIndex].value,
    coordinates: [],
  };
  if (p.options[p.selectedIndex].value == "unclassified") {
    reqJson.type = tcm.options[tcm.selectedIndex].value;
  }
  if (selectedTrenchId != "-1") {
    reqJson.trenchId = selectedTrenchId;
  }
  if (path != null) {
    if (path.getLength() > 0) {
      path.forEach((pt) => {
        reqJson.coordinates.push({ x: pt.lng(), y: pt.lat() });
      });
      reqJson.coordinates = Array.from(
        new Set(reqJson.coordinates.map(JSON.stringify))
      ).map(JSON.parse);
    }
  }
  if (reqJson.coordinates.length > 1) {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/q2c/trenchDistance", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqJson),
      keepalive: true,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        if (data != null && typeof data === "object") {
          if (data.distance != null && data.cost != null) {
            calcIsoCode = data.isoCode ?? calcIsoCode;
            calcSymbol = data.symbol ?? calcSymbol;
            calcRate = data.rate ?? calcRate;
            calcCost = data.cost;
            calcDistance = data.distance;
            calcUnit = data.unit ?? calcUnit;
            document.getElementById("quotePanel").innerHTML =
              calcIsoCode +
              " " +
              calcSymbol +
              calcCost +
              "&emsp;&emsp;Distance: " +
              calcDistance +
              calcUnit;
          }
          document.getElementById("savePath").hidden = false;
          document.getElementById("exportKML").hidden = false;
        }
      })
      .catch((e) => {
        console.error(e);
      });
  } else {
    window.alert("At least two trench points are required");
  }
}
function fetchListTrench() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/trench?country=" +
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
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return;
      }
      let trenchIds =
        "<option disabled value='-1' selected='selected'> -- select a trench -- </option>";
      for (var i = 0; i < data.length; i++) {
        trenchIds +=
          "<option value='" + data[i] + "' >" + data[i] + "</option>";
      }
      document.getElementById("trenchId").innerHTML = trenchIds;
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
  for (let key in tPoly) {
    if (tPoly[key] != null) {
      tPoly[key].setMap(null);
      tPoly[key] = null;
    }
  }
  tPoly = {};
  tPath = {};
  if (path != null && polyline != null) {
    path.clear();
    polyline.setPath(path);
    path = polyline.getPath();
  }
  document.getElementById("quotePanel").innerHTML = "";
  document.getElementById("savePath").hidden = true;
  document.getElementById("exportKML").hidden = true;
  calcIsoCode = "EUR";
  calcSymbol = "€";
  calcCost = 0;
  calcDistance = 0;
  calcUnit = "m";
  calcRate = 1;
}
async function wipePath() {
  if (path != null && polyline != null) {
    path.clear();
    polyline.setPath(path);
    path = polyline.getPath();
  }
  document.getElementById("quotePanel").innerHTML = "";
  document.getElementById("savePath").hidden = true;
  document.getElementById("exportKML").hidden = true;
  calcIsoCode = "EUR";
  calcSymbol = "€";
  calcCost = 0;
  calcRate = 1;
  calcDistance = 0;
  calcUnit = "m";
}
async function drawOnMap() {
  try {
    if (map == null || PolylineCtor == null) {
      return;
    }
    for (let key in tPoly) {
      if (tPoly[key] != null) {
        tPoly[key].setMap(null);
        tPoly[key] = null;
      }
    }
    tPoly = {};
    tPath = {};

    if (!Array.isArray(trenchCoordinates?.sets)) {
      return;
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
      tPoly[tSet] = new PolylineCtor({
        path: tPath[tSet],
        clickable: false,
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
    }
  } catch (e) {
    console.error(e);
  }
}
async function displayMap() {
  try {
    const mapsLib = await google.maps.importLibrary("maps");
    MapCtor = mapsLib.Map;
    PolylineCtor = mapsLib.Polyline;

    map = new MapCtor(document.getElementById("map"), {
      zoom: 17,
      center: mapCenter,
      mapTypeId: "roadmap",
      mapId: mapId,
      disableDefaultUI: true,
      draggableCursor: "crosshair",
    });
    lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1.0,
      scale: 4,
    };
    map.setCenter(mapCenter);
    await drawOnMap();

    // custom proposed trench path (created once on map initialization)
    polyline = new PolylineCtor({
      strokeColor: niStrokeColor,
      strokeOpacity: niStrokeOpacity,
      strokeWeight: niStrokeWeight,
      map: map,
    });
    path = polyline.getPath();
    map.addListener("click", (event) => {
      if (event?.latLng != null && path != null) {
        path.push(event.latLng);
      }
    });
    map.addListener("rightclick", () => {
      if (path != null && path.getLength() > 0) {
        path.removeAt(path.getLength() - 1);
      }
    });
  } catch (e) {
    console.error("Failed to initialize Google Map for q2c:", e);
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
function fetchListCurrency() {
  fetch(localStorage.getItem("ni.gatewayUrl") + "/currency/default", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data != null && data.isoCode != null) {
        defaultCurrencyIsoCode = data.isoCode;
      }
    })
    .catch((e) => {
      console.error(e);
    });

  fetch(localStorage.getItem("ni.gatewayUrl") + "/currency", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return;
      }
      data = jsonSortByMultiKeys(data, ["name"]);
      let currencyIds = "";
      for (var i = 0; i < data.length; i++) {
        if (data[i].isoCode == defaultCurrencyIsoCode) {
          currencyIds +=
            "<option value='" +
            data[i].isoCode +
            "' selected='selected'>" +
            data[i].name +
            " " +
            data[i].symbol +
            "</option>";
        } else {
          currencyIds +=
            "<option value='" +
            data[i].isoCode +
            "'>" +
            data[i].name +
            " " +
            data[i].symbol +
            "</option>";
        }
      }
      document.getElementById("currency").innerHTML = currencyIds;
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  fetchListCurrency();
  fetchMapRender();
  countryListPopulate(fetchListTrench);
} catch (e) {
  console.error(e);
}
