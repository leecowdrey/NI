//=====================================================================
// Network Insight (NI) - JavaScript: trenchCountry
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
var map = null;
var tPath = {};
var tPoly = {};
var lineSymbol;
let trenchId = null;
let mapVendor = null;
let mapId = "DEMO_MAP_ID";
let trenches = [];
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let mapRenderReady = null;
let MapCtor = null;
let PolylineCtor = null;
let InfoWindowCtor = null;
let LatLngBoundsCtor = null;
var ductPanel = {};
var polePanel = {};
let ductList = {};
let poleList = {};
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
async function displayMap() {
  try {
    const mapsLib = await google.maps.importLibrary("maps");
    const coreLib = await google.maps.importLibrary("core");
    MapCtor = mapsLib.Map;
    PolylineCtor = mapsLib.Polyline;
    InfoWindowCtor = mapsLib.InfoWindow;
    LatLngBoundsCtor = coreLib.LatLngBounds;

    map = new MapCtor(document.getElementById("map"), {
      zoom: 6,
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
    map.setCenter(mapCenter);
    drawOnMap();
  } catch (e) {
    console.error("Failed to initialize Google Map for trenchCountry:", e);
  }
}
function fetchTrenchCountry() {
  try {
    trenchCoordinates = {};
    trenches = [];
    mapCenter = { lat: 0, lng: 0 };
    fetch(
      localStorage.getItem("ni.gatewayUrl") +
        "/trench/geometry/country?country=" +
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
      .then(async (data) => {
        if (data != null && typeof data === "object") {
          let centroid = validateMapCoordinate(data.centroid);
          if (centroid != null) {
            mapCenter = centroid;
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
          trenches = Array.isArray(trenchCoordinates.trenches)
            ? trenchCoordinates.trenches
            : [];
          if (map != null) {
            map.setCenter(mapCenter);
            drawOnMap();
          } else {
            if (mapRenderReady != null) {
              await mapRenderReady;
            }
            loadGoogleMaps(mapRenderUrl, displayMap);
          }
        }
      })
      .catch((e) => {
        console.error(e);
      });
  } catch (e) {
    console.error(e);
  }
}

function drawOnMap() {
  try {
    if (map == null || PolylineCtor == null || LatLngBoundsCtor == null) {
      return;
    }
    if (Object.keys(tPoly).length > 0) {
      for (let key in tPoly) {
        if (tPoly[key] != null) {
          tPoly[key].setMap(null);
          tPoly[key] = null;
        }
      }
      tPoly = {};
      tPath = {};
      ductList = {};
      poleList = {};
      ductPanel = {};
      polePanel = {};
    }
    //
    let latlngbounds = new LatLngBoundsCtor();
    if (trenchCoordinates != null && Array.isArray(trenches)) {
      for (let t = 0; t < trenches.length; t++) {
        let currentTrenchId = trenches[t];
        let trenchData = trenchCoordinates[currentTrenchId];
        if (trenchData == null || typeof trenchData !== "object") {
          continue;
        }
        tPath[currentTrenchId] = [];
        ductList[currentTrenchId] = "<ul><li>none</li></ul>";
        poleList[currentTrenchId] = "<ul><li>none</li></ul>";

        if (Array.isArray(trenchData.duct) && trenchData.duct.length > 0) {
          ductList[currentTrenchId] = "<ul>";
          for (let d = 0; d < trenchData.duct.length; d++) {
            ductList[currentTrenchId] +=
              '<li><a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/duct/" +
              trenchData.duct[d] +
              "?country=" +
              niSelectedCountry +
              '">' +
              trenchData.duct[d] +
              "</a></li>";
          }
          ductList[currentTrenchId] += "</ul>";
        }
        if (Array.isArray(trenchData.pole) && trenchData.pole.length > 0) {
          poleList[currentTrenchId] = "<ul>";
          for (let p = 0; p < trenchData.pole.length; p++) {
            poleList[currentTrenchId] +=
              '<li><a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/pole/" +
              trenchData.pole[p] +
              "?country=" +
              niSelectedCountry +
              '">' +
              trenchData.pole[p] +
              "</a></li>";
          }
          poleList[currentTrenchId] += "</ul>";
        }
        if (Array.isArray(trenchData.coordinates)) {
          for (let c = 0; c < trenchData.coordinates.length; c++) {
            let coord = validateMapCoordinate(trenchData.coordinates[c]);
            if (coord != null) {
              tPath[currentTrenchId].push(coord);
              latlngbounds.extend(coord);
            }
          }
        }
        if (tPath[currentTrenchId].length === 0) {
          continue;
        }
        tPoly[currentTrenchId] = new PolylineCtor({
          path: tPath[currentTrenchId],
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
        tPoly[currentTrenchId].addListener("click", function (h) {
          if (ductPanel[currentTrenchId] != null) {
            ductPanel[currentTrenchId].close();
          }
          ductPanel[currentTrenchId] = new InfoWindowCtor({
            headerContent: "Ducts",
            position: h.latLng,
            content: ductList[currentTrenchId],
          });
          ductPanel[currentTrenchId].open({
            shouldFocus: true,
            map: map,
          });
        });
        tPoly[currentTrenchId].addListener("mouseover", function (e) {
          injectTooltip(e, currentTrenchId);
        });
        tPoly[currentTrenchId].addListener("mouseout", function (e) {
          deleteTooltip(e);
        });
        tPoly[currentTrenchId].addListener("rightclick", function (h) {
          if (polePanel[currentTrenchId] != null) {
            polePanel[currentTrenchId].close();
          }
          polePanel[currentTrenchId] = new InfoWindowCtor({
            headerContent: "Poles",
            position: h.latLng,
            content: poleList[currentTrenchId],
          });
          polePanel[currentTrenchId].open({
            shouldFocus: true,
            map: map,
          });
        });
      }
      if (!latlngbounds.isEmpty()) {
        map.fitBounds(latlngbounds);
        map.setCenter(latlngbounds.getCenter());
      }
    }
  } catch (e) {
    console.error(e);
  }
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

try {
  fetchMapRender();
  countryListPopulate(fetchTrenchCountry);
} catch (e) {
  console.error(e);
}
