//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: trenchCountry
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//var map;
var tPath = [];
var tPoly = [];
var lineSymbol;
let fmrReady = null;
let ftgReady = null;
let fltReady = null;
let fltcReady = null;
let ftpReady = null;
let ftdReady = null;
let ftppReady = null;
let retryMs = 5000;
let trenchId = null;
let mapVendor = null;
let trenches = [];
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;

function clp() {
  let mniCountryCode = localStorage.getItem("mni.country");
  fetch(localStorage.getItem("mni.gatewayUrl") + "/ui/countries", {
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
      if (data.length > 0) {
        data.sort();
        let countries =
          "<option disabled value='-1' selected='selected'> -- select a country -- </option>";
        for (let c = 0; c < data.length; c++) {
          countries +=
            "<option value='" +
            data[c] +
            "'>" +
            data[c] +
            "</option>";
        }
        document.getElementById("country").innerHTML = countries;
      } else {
        document.getElementById("country").innerHTML =
          "<option value='" +
          mniCountryCode +
          "' selected='selected'>" +
          mniCountryCode +
          "</option>";
      }
    })
    .catch((e) => {
      notify(e);
    });
}
function fetchTrenchCountry() {
  try {
    if (fltcReady != null) {
      clearTimeout(fltcReady);
    }
    trenchCoordinates = {};
    trenches = [];
    let c = document.getElementById("country");
    let selectedCountry = c.options[c.selectedIndex].value;
    mapCenter = { lat: 0, lng: 0 };
    fetch(
      localStorage.getItem("mni.gatewayUrl") +
        "/trench/geometry/country?country=" +
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
        //fltcReady = setTimeout(fetchTrenchCountry, retryMs);
        //}
      })
      .then((data) => {
        if (data != null) {
          if (data.centroid != null) {
            mapCenter = {
              lat: data.centroid.y,
              lng: data.centroid.x,
            };
          }
          if (data.passed != null) {
            document
              .getElementById("trenchPremisesPassed")
              .setAttribute("value", data.passed);
          }
          if (data.distance != null && data.unit != null) {
            document
              .getElementById("trenchDistance")
              .setAttribute("value", data.distance + data.unit);
          }
          trenchCoordinates = JSON.parse(JSON.stringify(data));
          trenches = trenchCoordinates.trenches;
          if (
            document.getElementById("mapRender") !== undefined &&
            document.getElementById("mapRender") != null
          ) {
            map.setCenter(mapCenter);
            drawOnMap();
          }
          loadScript(mapRenderUrl, function () {
            function displayMap() {
              map = new google.maps.Map(document.getElementById("map"), {
                zoom: 6,
                center: mapCenter,
                mapTypeId: "terrain",
                disableDefaultUI: true,
              });
              lineSymbol = {
                path: "M 0,-1 0,1",
                strokeOpacity: 1.0,
                scale: 4,
              };
              map.setCenter(mapCenter);
              drawOnMap();
            }
            window.displayMap = displayMap;
          });
        }
      })
      .catch((e) => {
        notify(e);
      });
  } catch (e) {
    console.error(e);
  }
}

function drawOnMap() {
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
    if (trenchCoordinates != null) {
      if (trenches != null) {
        for (let t = 0; t < trenches.length; t++) {
          let trenchId = trenches[t];
          tPath[trenchId] = [];
          tPoly[trenchId] = [];
          for (let c = 0; c < trenchCoordinates[trenchId].length; c++) {
            tPath[trenchId].push({
              lat: trenchCoordinates[trenchId][c].y,
              lng: trenchCoordinates[trenchId][c].x,
            });
          }
          tPoly[trenchId] = new google.maps.Polyline({
            path: tPath[trenchId],
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
            title: trenchId,
          });
          tPoly[trenchId].setMap(map);
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
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
      } //else {
      //fmrReady = setTimeout(fetchMapRender, retryMs);
      //}
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
      notify(e);
      //mrReady = setTimeout(fetchMapRender, retryMs);
    });
}

try {
  clp();
  fetchMapRender();
} catch (e) {
  notify(e);
  //fmrReady = setTimeout(fetchMapRender, retryMs);
}
