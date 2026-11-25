//=====================================================================
// Network Insight (NI) - JavaScript: Trench
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
var map = null;
var trenchPath = null;
var lineSymbol;
let trenchId = null;
let point = null;
let mapVendor = null;
let mapId = "DEMO_MAP_ID";
let trenchCoordinates = [];
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let mapRenderReady = null;
let MapCtor = null;
let PolylineCtor = null;
let InfoWindowCtor = null;
var ductPanel = null;
var polePanel = null;
let ductList = "<ul><li>none</li></ul>";
let poleList = "<ul><li>none</li></ul>";
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
        localStorage.getItem("ni.rootUrl") + "/trench/",
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
        fetchTrenchPoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchTrenchPoints() {
  let t = document.getElementById("trenchId");
  try {
    trenchId = t.options[t.selectedIndex].value;
    if (trenchId != "-1") {
      fetch(
        localStorage.getItem("ni.gatewayUrl") + "/trench/timeline/" + trenchId,
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
          let trenchPoints =
            "<option disabled value='-1'> -- select a date/time -- </option>";
          for (var i = 0; i < data.length; i++) {
            if (data[i] == null || data[i].point == null) {
              continue;
            }
            if (i == 0) {
              trenchPoints +=
                "<option selected='selected' value='" +
                data[i].point +
                "' >" +
                data[i].point +
                "</option>";
            } else {
              trenchPoints +=
                "<option value='" +
                data[i].point +
                "' >" +
                data[i].point +
                "</option>";
            }
          }
          document.getElementById("trenchPoint").innerHTML = trenchPoints;
          fetchTrenchGeometry();
        })
        .catch((e) => {
          console.error(e);
        });
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
async function displayMap() {
  try {
    const mapsLib = await google.maps.importLibrary("maps");
    MapCtor = mapsLib.Map;
    PolylineCtor = mapsLib.Polyline;
    InfoWindowCtor = mapsLib.InfoWindow;

    map = new MapCtor(document.getElementById("map"), {
      zoom: 17,
      center: mapCenter,
      mapTypeId: "roadmap",
      mapId: mapId,
      disableDefaultUI: true,
    });
    lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1,
      scale: 4,
    };

    trenchPath = new PolylineCtor({
      path: trenchCoordinates,
      strokeOpacity: 1.0,
      strokeColor: "#8B0000",
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
    trenchPath.addListener("click", function (h) {
      if (ductPanel != null) {
        ductPanel.close();
      }
      ductPanel = new InfoWindowCtor({
        headerContent: "Ducts",
        position: h.latLng,
        content: ductList,
      });
      ductPanel.open({
        shouldFocus: true,
        map: map,
      });
    });
    trenchPath.addListener("mouseover", function (e) {
      injectTooltip(e, trenchId);
    });
    trenchPath.addListener("mouseout", function (e) {
      deleteTooltip(e);
    });
    trenchPath.addListener("rightclick", function (h) {
      if (polePanel != null) {
        polePanel.close();
      }
      polePanel = new InfoWindowCtor({
        headerContent: "Poles",
        position: h.latLng,
        content: poleList,
      });
      polePanel.open({
        shouldFocus: true,
        map: map,
      });
    });
  } catch (e) {
    console.error("Failed to initialize Google Map for trench:", e);
  }
}
function fetchTrenchGeometry() {
  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;
  let p = document.getElementById("trenchPoint");
  point = p.options[p.selectedIndex].value;
  trenchCoordinates = [];
  mapCenter = { lat: 0, lng: 0 };

  if (trenchId == "-1" || point == "-1") {
    return;
  }

  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/trench/" +
      trenchId +
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
      if (response.ok) {
        return response.json();
      }
    })
    .then(async (data) => {
      if (data != null && typeof data === "object") {
        if (Array.isArray(data.pole) && data.pole.length > 0) {
          poleList = "<ul>";
          for (let i = 0; i < data.pole.length; i++) {
            poleList +=
              '<li><a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/pole/" +
              data.pole[i] +
              "?country=" +
              niSelectedCountry +
              '">' +
              data.pole[i] +
              "</a></li>";
          }
          poleList += "</ul>";
        } else {
          poleList = "<ul><li>none</li></ul>";
        }
        if (Array.isArray(data.duct) && data.duct.length > 0) {
          ductList = "<ul>";
          for (let d = 0; d < data.duct.length; d++) {
            ductList +=
              '<li><a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/duct/" +
              data.duct[d] +
              "?country=" +
              niSelectedCountry +
              '">' +
              data.duct[d] +
              "</a></li>";
          }
          ductList += "</ul>";
        } else {
          ductList = "<ul><li>none</li></ul>";
        }
        if (Array.isArray(data.coordinates)) {
          for (var i = 0; i < data.coordinates.length; i++) {
            let coord = validateMapCoordinate(data.coordinates[i]);
            if (coord != null) {
              trenchCoordinates.push(coord);
            }
          }
        }
        if (trenchCoordinates.length > 0) {
          let mi = Math.floor(trenchCoordinates.length / 2);
          mapCenter = trenchCoordinates[mi];
        } else {
          mapCenter = { lat: 0, lng: 0 };
        }
        if (map != null && trenchPath != null) {
          map.setCenter(mapCenter);
          trenchPath.setMap(null);
          trenchPath.setPath(trenchCoordinates);
          trenchPath.setMap(map);
        } else {
          if (mapRenderReady != null) {
            await mapRenderReady;
          }
          loadGoogleMaps(mapRenderUrl, displayMap);
        }
      }
      fetchTrenchDistance(trenchId, point);
      fetchTrenchPremisesPassed(trenchId, point);
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
