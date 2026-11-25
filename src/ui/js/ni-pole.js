//=====================================================================
// Network Insight (NI) - JavaScript: Pole
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
var map = null;
var polePath;
var lineSymbol;
let poleId = null;
let point = null;
let mapVendor = null;
let mapId = "DEMO_MAP_ID";
let poleX = 0;
let poleY = 0;
let marker = null;
let endMarker = null;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let mapRenderReady = null;
let MapCtor = null;
let InfoWindowCtor = null;
let AdvancedMarkerElementCtor = null;
var trenchPanel = null;
var sitePanel = null;
let trenchList = "<ul><li>none</li></ul>";
let siteList = "<ul><li>none</li></ul>";
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
function fetchListPoles() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/pole?country=" + selectedCountry,
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
      let suppliedPoleId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/pole/",
        ""
      );
      let poleIds =
        "<option disabled value='-1' selected='selected'> -- select a pole -- </option>";
      if (suppliedPoleId != null) {
        poleIds = "<option disabled value='-1'> -- select a pole -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedPoleId == data[i]) {
          poleIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          poleIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("poleId").innerHTML = poleIds;
      document.getElementById("poleHeight").setAttribute("value", "");
      document.getElementById("poleClassifier").setAttribute("value", "");
      if (suppliedPoleId != null) {
        fetchPolePoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchPolePoints() {
  let t = document.getElementById("poleId");
  poleId = t.options[t.selectedIndex].value;
  if (poleId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/pole/timeline/" + poleId, {
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
        let polePoints =
          "<option disabled value='-1'> -- select a date/time point -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (data[i] == null || data[i].point == null) {
            continue;
          }
          if (i == 0) {
            polePoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            polePoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
        }
        document.getElementById("polePoint").innerHTML = polePoints;
        fetchPole();
      })
      .catch((e) => {
        console.error(e);
      });
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
function createPoleMarker(position) {
  let pinElement = createMapPinElement("fa fa-arrows-v", "#D93025");
  let poleMarker = new AdvancedMarkerElementCtor({
    map: map,
    position: position,
    content: pinElement,
    title: poleId || "",
    gmpClickable: true,
  });
  poleMarker.addListener("gmp-click", function () {
    if (trenchPanel != null) {
      trenchPanel.close();
    }
    trenchPanel = new InfoWindowCtor({
      headerContent: "Trench",
      content: trenchList,
    });
    trenchPanel.open({
      anchor: poleMarker,
      shouldFocus: true,
      map: map,
    });
  });
  pinElement.addEventListener("mouseenter", function (e) {
    injectTooltip(e, poleId);
  });
  pinElement.addEventListener("mouseleave", function (e) {
    deleteTooltip(e);
  });
  pinElement.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (sitePanel != null) {
      sitePanel.close();
    }
    sitePanel = new InfoWindowCtor({
      headerContent: "Site",
      content: siteList,
    });
    sitePanel.open({
      anchor: poleMarker,
      shouldFocus: true,
      map: map,
    });
  });
  return poleMarker;
}
async function displayMap() {
  try {
    const mapsLib = await google.maps.importLibrary("maps");
    const markerLib = await google.maps.importLibrary("marker");
    MapCtor = mapsLib.Map;
    InfoWindowCtor = mapsLib.InfoWindow;
    AdvancedMarkerElementCtor = markerLib.AdvancedMarkerElement;

    let pos = { lat: poleY, lng: poleX };
    map = new MapCtor(document.getElementById("map"), {
      zoom: 17,
      center: pos,
      mapTypeId: "hybrid",
      mapId: mapId,
      disableDefaultUI: true,
    });
    marker = createPoleMarker(pos);
  } catch (e) {
    console.error("Failed to initialize Google Map for pole:", e);
  }
}
function fetchPole() {
  let t = document.getElementById("poleId");
  poleId = t.options[t.selectedIndex].value;
  let p = document.getElementById("polePoint");
  point = p.options[p.selectedIndex].value;
  mapCenter = { lat: 0, lng: 0 };
  if (poleId != "-1" && point != "-1") {
    fetch(
      localStorage.getItem("ni.gatewayUrl") +
        "/pole/" +
        poleId +
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
        if (data == null || typeof data !== "object") {
          return;
        }
        let coord = validateMapCoordinate(data.coordinate);
        if (coord == null) {
          console.error("Invalid pole coordinate payload:", data.coordinate);
          return;
        }
        poleX = coord.lng;
        poleY = coord.lat;
        mapCenter = coord;

        if (data.connectsTo?.trenchId != null) {
          trenchList =
            '<ul><li><a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/trench/" +
            data.connectsTo.trenchId +
            "?country=" +
            niSelectedCountry +
            '">' +
            data.connectsTo.trenchId +
            "</a></li></ul>";
        } else {
          trenchList = "<ul><li>none</li></ul>";
        }
        if (data.connectsTo?.siteId != null) {
          siteList =
            '<ul><li><a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/site/" +
            data.connectsTo.siteId +
            "?country=" +
            niSelectedCountry +
            '">' +
            data.connectsTo.siteId +
            "</a></li></ul>";
        } else {
          siteList = "<ul><li>none</li></ul>";
        }

        if (
          data.construction?.height != null &&
          data.construction?.unit != null
        ) {
          document
            .getElementById("poleHeight")
            .setAttribute(
              "value",
              data.construction.height + data.construction.unit
            );
        }
        if (data.construction?.classifier != null) {
          document
            .getElementById("poleClassifier")
            .setAttribute("value", data.construction.classifier);
        }

        if (map != null) {
          map.setCenter(coord);
          if (marker != null) {
            marker.position = coord;
            marker.title = poleId || "";
            marker.map = map;
          } else if (AdvancedMarkerElementCtor != null) {
            marker = createPoleMarker(coord);
          }
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
}
try {
  fetchMapRender();
  countryListPopulate(fetchListPoles);
} catch (e) {
  console.error(e);
}
