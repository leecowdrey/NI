//=====================================================================
// Network Insight (NI) - JavaScript: trenchCountry
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//var map;
var tPath = [];
var tPoly = [];
var lineSymbol;
let trenchId = null;
let mapVendor = null;
let trenches = [];
let trenchCoordinates = {};
let trenchColor = "#8B0000";
let trenchOpacity = 1.0;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
var ductPanel = [];
var polePanel = [];
let ductList = [];
let poleList = [];
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
                mapTypeId: "hybrid",
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
        console.error(e);
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
      ductList = [];
      poleList = [];
      ductPanel = [];
      polePanel = [];
    }
    //
    let latlngbounds = new google.maps.LatLngBounds();
    if (trenchCoordinates != null) {
      if (trenches != null) {
        for (let t = 0; t < trenches.length; t++) {
          let trenchId = trenches[t];
          tPath[trenchId] = [];
          tPoly[trenchId] = [];
          ductList[trenchId] = "";
          poleList[trenchId] = "";
          if (trenchCoordinates[trenchId].duct.length > 0) {
                        ductList[trenchId] = "<ul>";
            for (let d = 0; d < trenchCoordinates[trenchId].duct.length; d++) {
              ductList[trenchId] +=
                '<li><a href="' +
                localStorage.getItem("ni.rootUrl") +
                "/duct/" +
                trenchCoordinates[trenchId].duct[d] +
                "?country=" +
                niSelectedCountry +
                '">' +
                trenchCoordinates[trenchId].duct[d] +
                "</a></li>";
            }
            ductList[trenchId] += "</ul>";
          } else {
            ductList[trenchId] = "<ul><li>none</li></ul>";
          }
          if (trenchCoordinates[trenchId].pole.length > 0) {
            poleList[trenchId] = "<ul>";
            for (let p = 0; p < trenchCoordinates[trenchId].pole.length; p++) {
              poleList[trenchId] +=
                '<li><a href="' +
                localStorage.getItem("ni.rootUrl") +
                "/pole/" +
                trenchCoordinates[trenchId].pole[p] +
                "?country=" +
                niSelectedCountry +
                '">' +
                trenchCoordinates[trenchId].pole[p] +
                "</a></li>";
            }
            poleList[trenchId] += "</ul>";
          } else {
            poleList = "<ul><li>none</li></ul>";
          }
          for (
            let c = 0;
            c < trenchCoordinates[trenchId].coordinates.length;
            c++
          ) {
            tPath[trenchId].push({
              lat: trenchCoordinates[trenchId].coordinates[c].y,
              lng: trenchCoordinates[trenchId].coordinates[c].x,
            });
            latlngbounds.extend({
              lat: trenchCoordinates[trenchId].coordinates[c].y,
              lng: trenchCoordinates[trenchId].coordinates[c].x,
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
          google.maps.event.addListener(tPoly[trenchId], "click", function (h) {
            ductPanel[trenchId] = new google.maps.InfoWindow({
              headerContent: "Ducts",
              position: h.latLng,
              content: ductList[trenchId],
            });
            ductPanel[trenchId].open({
              shouldFocus: true,
              map,
            });
          });
          google.maps.event.addListener(
            tPoly[trenchId],
            "mouseover",
            function (e) {
              injectTooltip(e, trenchId);
            }
          );
          google.maps.event.addListener(
            tPoly[trenchId],
            "mouseout",
            function (e) {
              deleteTooltip(e);
            }
          );
          google.maps.event.addListener(
            tPoly[trenchId],
            "rightclick",
            function (h) {
              polePanel[trenchId] = new google.maps.InfoWindow({
                headerContent: "Poles",
                position: h.latLng,
                content: poleList[trenchId],
              });
              polePanel[trenchId].open({
                shouldFocus: true,
                map,
              });
            }
          );
        }
      }
      map.fitBounds(latlngbounds);
      map.setCenter(latlngbounds.getCenter());
    }
  } catch (e) {
    console.error(e);
  }
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

try {
  fetchMapRender();
  countryListPopulate(fetchTrenchCountry);
} catch (e) {
  console.error(e);
}
