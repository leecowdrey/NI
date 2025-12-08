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
var map;
var trenchPath;
var tPath = [];
var tPoly = [];
var lineSymbol;
let trenchId = null;
let mapVendor = null;
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
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
  if (pathCoordinates.length > 0) {
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
  let trenchId = t.options[t.selectedIndex].value;
  let coordinates = [];
  if (path != null) {
    if (path.getLength() > 0) {
      path.forEach((p) => {
        coordinates.push({ x: p.lng(), y: p.lat() });
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
  if (trenchId != "-1") {
    kmlData += "      <ni:linkTrenchId>" + trenchId + "</ni:linkTrenchId>\n";
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
  let constructionMethod = null;
  let c = document.getElementById("currency");
  let t = document.getElementById("trenchId");
  let trenchId = t.options[t.selectedIndex].value;
  let reqJson = {
    purpose: p.options[p.selectedIndex].value,
    isoCode: c.options[c.selectedIndex].value,
    coordinates: [],
  };
  if (p.options[p.selectedIndex].value == "unclassified") {
    reqJson.type = tcm.options[tcm.selectedIndex].value;
  }
  if (trenchId != "-1") {
    reqJson.trenchId = trenchId;
  }
  if (path != null) {
    if (path.getLength() > 0) {
      path.forEach((p) => {
        reqJson.coordinates.push({ x: p.lng(), y: p.lat() });
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
        if (data != null) {
          if (data.distance != null && data.cost != null) {
            calcIsoCode = data.isoCode;
            calcSymbol = data.symbol;
            calcRate = data.rate;
            calcCost = data.cost;
            calcDistance = data.distance;
            calcUnit = data.unit;
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
      } //else {
      //fltReady = setTimeout(fetchListTrench, retryMs);
      //}
    })
    .then((data) => {
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
      //fltReady = setTimeout(fetchListTrench, retryMs);
    });
}
function fetchMapRender() {
  fetch(localStorage.getItem("ni.gatewayUrl") + "/ui/mapRender", {
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
      if (data.vendor != null) {
        document.getElementById("mapVendor").innerHTML =
          "<option value='" +
          data.vendor +
          "' selected='selected'>" +
          data.vendor +
          "</option>";
        // <option disabled value='OpenStreet Map'>OpenStreet Map</option>
        // <option disabled value='Microsoft Azure'>Microsoft Azure</option>
        // <option disabled value='ERSI'>ERSI</option>
      }
      if (data.url != null) {
        mapRenderUrl = data.url + "&loading=async&callback=displayMap&v=weekly";
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
async function wipeMapClean() {
  if (Object.keys(tPoly).length > 0) {
    for (let trenchId in tPoly) {
      tPoly[trenchId].setMap(null);
      tPoly[trenchId] = null;
    }
  }
  tPoly = [];
  tPath = [];
  if (path != null) {
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
  if (path != null) {
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
    if (Object.keys(tPoly).length > 0) {
      for (let trenchId in tPoly) {
        tPoly[trenchId].setMap(null);
        tPoly[trenchId] = null;
      }
      tPoly = [];
      tPath = [];
    }
    //
    for (let s = 0; s < trenchCoordinates.sets.length; s++) {
      let tSet = trenchCoordinates.sets[s].point;
      if (trenchCoordinates.sets[s].source == "predicted") {
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
      for (let c = 0; c < trenchCoordinates[tSet].length; c++) {
        tPath[tSet].push({
          lat: trenchCoordinates[tSet][c].y,
          lng: trenchCoordinates[tSet][c].x,
        });
      }
      tPoly[tSet] = new google.maps.Polyline({
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
      tPoly[tSet].setMap(map);
      // custom trench path
      polyline = new google.maps.Polyline({
        strokeColor: niStrokeColor,
        strokeOpacity: niStrokeOpacity,
        strokeWeight: niStrokeWeight,
        map: map,
      });
      path = polyline.getPath();
      map.addListener("click", (event) => {
        path.push(event.latLng);
      });
      map.addListener("rightclick", (event) => {
        if (path.length > 0) {
          path.removeAt(path.getLength() - 1);
          polyline.setPath(path);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}
async function fetchTrenchGeometryLifetime() {
  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;

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
    .then((data) => {
      if (data != null) {
        trenchCoordinates = {};
        trenchCoordinates = JSON.parse(JSON.stringify(data));
        if (trenchCoordinates.sets.length > 0) {
          let tSet = trenchCoordinates.sets[0].point;
          if (trenchCoordinates[tSet].length > 0) {
            mapCenter = {
              lng: trenchCoordinates[tSet][0].x,
              lat: trenchCoordinates[tSet][0].y,
            };
          }
        }
      }
      if (
        document.getElementById("mapRender") !== undefined &&
        document.getElementById("mapRender") != null
      ) {
        map.setCenter(mapCenter);
        drawOnMap();
      }
    })
    .catch((e) => {
      console.error(e);
    });
  loadScript(mapRenderUrl, function () {
    function displayMap() {
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17,
        center: mapCenter,
        mapTypeId: "hybrid",
        disableDefaultUI: true,
        draggableCursor: "crosshair",
      });
      lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1.0,
        scale: 4,
      };
      map.setCenter(mapCenter);
      drawOnMap();
      //
      polyline = new google.maps.Polyline({
        strokeColor: "#eb34ba",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map,
      });
      path = polyline.getPath();
      map.addListener("click", (event) => {
        path.push(event.latLng);
      });
      map.addListener("rightclick", (event) => {
        if (path.length > 0) {
          path.removeAt(path.getLength() - 1);
          polyline.setPath(path);
        }
      });
    }
    window.displayMap = displayMap;
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
      defaultCurrencyIsoCode = data.isoCode;
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
  countryListPopulate();
} catch (e) {
  console.error(e);
}
