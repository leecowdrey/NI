//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: trenchLifetime
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//var map;
var trenchPath;
var tPath = [];
var tPoly = [];
var lineSymbol;
let fmrReady = null;
let ftgReady = null;
let fltReady = null;
let ftpReady = null;
let ftdReady = null;
let ftppReady = null;
let retryMs = 5000;
let trenchId = null;
let mapVendor = null;
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let startMarker = [];
let endMarker = [];
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
function fetchTrenchPremisesPassed(id, p) {
  if (ftppReady != null) {
    clearTimeout(ftppReady);
  }

  fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
      } else {
        ftppReady = setTimeout(fetchTrenchPremisesPassed, retryMs, id, p);
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
      ftppReady = setTimeout(fetchTrenchPremisesPassed, retryMs, id, p);
    });
}
function fetchTrenchDistance(id, p) {
  if (ftdReady != null) {
    clearTimeout(ftdReady);
  }

  fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
      } else {
        ftdReady = setTimeout(fetchTrenchDistance, retryMs, id, p);
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
      ftdReady = setTimeout(fetchTrenchDistance, retryMs, id, p);
    });
}
function fetchListTrench() {
  if (fltReady != null) {
    clearTimeout(fltReady);
  }

  fetch(localStorage.getItem("mni.gatewayUrl") + "/trench", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        fltReady = setTimeout(fetchListTrench, retryMs);
      }
    })
    .then((data) => {
      let trenchIds =
        "<option disabled value='-1' selected='selected'> -- select a trench -- </option>";
      for (var i = 0; i < data.length; i++) {
        trenchIds +=
          "<option value='" + data[i] + "' >" + data[i] + "</option>";
      }
      document.getElementById("trenchId").innerHTML = trenchIds;
      document.getElementById("trenchDistance").setAttribute("value", "");
    })
    .catch((e) => {
      fltReady = setTimeout(fetchListTrench, retryMs);
    });
}
function fetchMapRender() {
  if (fmrReady != null) {
    clearTimeout(fmrReady);
  }

  fetch(localStorage.getItem("mni.gatewayUrl") + "/ui/mapRender", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        fmrReady = setTimeout(fetchMapRender, retryMs);
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
      fmrReady = setTimeout(fetchMapRender, retryMs);
    });
}
async function wipeMapClean() {
  for (let i = 0; i < startMarker.length; i++) {
    startMarker[i].setMap(null);
    startMarker[i] = null;
  }
  for (let i = 0; i < endMarker.length; i++) {
    endMarker[i].setMap(null);
    endMarker[i] = null;
  }
  for (let i = 0; i < tPoly.length; i++) {
    tPoly[i].setMap(null);
    tPoly[i] = null;
  }
  startMarker.splice(0, startMarker.length);
  endMarker.splice(0, endMarker.length);
  tPoly.splice(0, tPoly.length);
  tPath.splice(0, tPath.length);
}
async function drawOnMap() {
  if (trenchCoordinates.sets.length > 0) {
    fetchTrenchPremisesPassed(
      trenchId,
      trenchCoordinates.sets[trenchCoordinates.sets.length - 1].point
    );
    fetchTrenchDistance(
      trenchId,
      trenchCoordinates.sets[trenchCoordinates.sets.length - 1].point
    );
  }
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
      if (c == 0) {
        startMarker[tSet] = new google.maps.Marker({
          position: {
            lat: trenchCoordinates[tSet][c].x,
            lng: trenchCoordinates[tSet][c].y,
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            strokeOpacity: 0,
            strokeColor: trenchColor,
            fillOpacity: 1.0,
            fillColor: trenchColor,
          },
          map: map,
          title: tSet,
        });
      }
      if (c == trenchCoordinates[tSet].length - 1) {
        if (c > 0) {
          endMarker[tSet] = new google.maps.Marker({
            position: {
              lat: trenchCoordinates[tSet][c].x,
              lng: trenchCoordinates[tSet][c].y,
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              strokeOpacity: 0,
              strokeColor: trenchColor,
              fillOpacity: 1.0,
              fillColor: trenchColor,
            },
            map: map,
            title: tSet,
          });
        }
      }
      tPath[tSet].push({
        lat: trenchCoordinates[tSet][c].x,
        lng: trenchCoordinates[tSet][c].y,
      });
    }
    tPoly[tSet] = new google.maps.Polyline({
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
    tPoly[tSet].setMap(map);
  }
}
async function fetchTrenchGeometryLifetime() {
  if (ftgReady != null) {
    clearTimeout(ftgReady);
  }
  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;

  await fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
      } else {
        ftgReady = setTimeout(fetchTrenchGeometryLifetime, retryMs);
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
              lat: trenchCoordinates[tSet][0].x,
              lng: trenchCoordinates[tSet][0].y,
            };
          }
        }
      }
      if (
        document.getElementById("mapRender") !== undefined &&
        document.getElementById("mapRender") != null
      ) {
        map.setCenter(mapCenter);
        wipeMapClean();
        drawOnMap();
      }
    })
    .catch((e) => {
      ftgReady = setTimeout(fetchTrenchGeometryLifetime, retryMs);
    });
  loadScript(mapRenderUrl, function () {
    function displayMap() {
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17,
        center: mapCenter,
        mapTypeId: "hybrid",
        disableDefaultUI: true,
      });
      lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1.0,
        scale: 4,
      };
      drawOnMap();
    }
    window.displayMap = displayMap;
  });
}
try {
  fetchMapRender();
} catch (e) {
  fmrReady = setTimeout(fetchMapRender, retryMs);
}
try {
  fetchListTrench();
} catch (e) {
  fltReady = setTimeout(fetchListTrench, retryMs);
}
