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
let trenchId = null;
let mapVendor = null;
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let startMarker = [];
let endMarker = [];
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
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
      } //else {
      //ftppReady = setTimeout(fetchTrenchPremisesPassed, retryMs, id, p);
      //}
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
    localStorage.getItem("mni.gatewayUrl") +
      "/trench?country=" +
      mniSelectedCountry,
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
      let suppliedTrenchId = window.location.pathname.replace(
        localStorage.getItem("mni.rootUrl") + "/trenchLifetime/",
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
  if (startMarker != null) {
    for (let i = 0; i < startMarker.length; i++) {
      startMarker[i].setMap(null);
      startMarker[i] = null;
    }
    startMarker.splice(0, startMarker.length);
  }
  if (endMarker != null) {
    for (let i = 0; i < endMarker.length; i++) {
      endMarker[i].setMap(null);
      endMarker[i] = null;
    }
    endMarker.splice(0, endMarker.length);
  }
  if (Object.keys(tPoly).length > 0) {
    for (let trenchId in tPoly) {
      tPoly[trenchId].setMap(null);
      tPoly[trenchId] = null;
    }
    tPoly = [];
  }
  if (tPath != null) {
    tPath.splice(0, tPath.length);
  }
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
            lat: trenchCoordinates[tSet][c].y,
            lng: trenchCoordinates[tSet][c].x,
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
              lat: trenchCoordinates[tSet][c].y,
              lng: trenchCoordinates[tSet][c].x,
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
        lat: trenchCoordinates[tSet][c].y,
        lng: trenchCoordinates[tSet][c].x,
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
    google.maps.event.addListener(tPoly[tSet], "click", function (h) {
      ductPanel = new google.maps.InfoWindow({
        headerContent: "Ducts",
        position: h.latLng,
        content: "<ul><li>none</li></ul>",
      });
      ductPanel.open({
        shouldFocus: true,
        map,
      });
    });
    google.maps.event.addListener(tPoly[tSet], "mouseover", function (e) {
      injectTooltip(e, trenchId);
    });
    google.maps.event.addListener(tPoly[tSet], "mouseout", function (e) {
      deleteTooltip(e);
    });
    google.maps.event.addListener(tPoly[tSet], "rightclick", function (h) {
      polePanel = new google.maps.InfoWindow({
        headerContent: "Poles",
        position: h.latLng,
        content: "<ul><li>none</li></ul>",
      });
      polePanel.open({
        shouldFocus: true,
        map,
      });
    });
  }
}
async function fetchTrenchGeometryLifetime() {
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
              lat: trenchCoordinates[tSet][0].y,
              lng: trenchCoordinates[tSet][0].x,
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
      console.error(e);
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
  countryListPopulate(fetchListTrench);
} catch (e) {
  console.error(e);
}
