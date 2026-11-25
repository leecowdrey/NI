//=====================================================================
// Network Insight (NI) - JavaScript: Site
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
let siteId = null;
let point = null;
let mapVendor = null;
let mapId = "DEMO_MAP_ID";
let siteX = 0;
let siteY = 0;
let marker = null;
let endMarker = null;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let mapRenderReady = null;
let MapCtor = null;
let InfoWindowCtor = null;
let AdvancedMarkerElementCtor = null;
let urlOnOffNetSuffix = "";
var trenchPanel = null;
var polePanel = null;
let trenchList = "<ul><li>none</li></ul>";
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
function fetchListSites() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  if (document.getElementById("onNet").checked) {
    urlOnOffNetSuffix = "onnet?country=" + selectedCountry;
  } else {
    urlOnOffNetSuffix = "offnet?country=" + selectedCountry;
  }
  fetch(localStorage.getItem("ni.gatewayUrl") + "/site/" + urlOnOffNetSuffix, {
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
      let suppliedSiteId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/site/",
        ""
      );
      let siteIds =
        "<option disabled value='-1' selected='selected'> -- select a site -- </option>";
      if (suppliedSiteId != null) {
        siteIds = "<option disabled value='-1'> -- select a site -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (data[i] == null || data[i].siteId == null) {
          continue;
        }
        if (suppliedSiteId == data[i].siteId) {
          siteIds +=
            "<option value='" +
            data[i].siteId +
            "' selected='selected'>" +
            data[i].reference +
            "</option>";
        } else {
          siteIds +=
            "<option value='" +
            data[i].siteId +
            "' >" +
            data[i].reference +
            "</option>";
        }
      }
      document.getElementById("siteId").innerHTML = siteIds;
      document.getElementById("siteArea").setAttribute("value", "");
      document.getElementById("siteType").setAttribute("value", "");
      if (suppliedSiteId != null) {
        fetchSite();
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
function createSiteMarker(position) {
  let pinElement = createMapPinElement("fa fa-building-o", "#D93025");
  let siteMarker = new AdvancedMarkerElementCtor({
    map: map,
    position: position,
    content: pinElement,
    title: siteId || "",
    gmpClickable: true,
  });
  siteMarker.addEventListener("gmp-click", function () {
    if (!document.getElementById("onNet").checked) {
      return;
    }
    if (trenchPanel != null) {
      trenchPanel.close();
    }
    trenchPanel = new InfoWindowCtor({
      headerContent: "Trenches",
      content: trenchList,
    });
    trenchPanel.open({
      anchor: siteMarker,
      shouldFocus: true,
      map: map,
    });
  });
  pinElement.addEventListener("mouseenter", function (e) {
    injectTooltip(e, siteId);
  });
  pinElement.addEventListener("mouseleave", function (e) {
    deleteTooltip(e);
  });
  pinElement.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!document.getElementById("onNet").checked) {
      return;
    }
    if (polePanel != null) {
      polePanel.close();
    }
    polePanel = new InfoWindowCtor({
      headerContent: "Poles",
      content: poleList,
    });
    polePanel.open({
      anchor: siteMarker,
      shouldFocus: true,
      map: map,
    });
  });
  return siteMarker;
}
async function displayMap() {
  try {
    const mapsLib = await google.maps.importLibrary("maps");
    const markerLib = await google.maps.importLibrary("marker");
    MapCtor = mapsLib.Map;
    InfoWindowCtor = mapsLib.InfoWindow;
    AdvancedMarkerElementCtor = markerLib.AdvancedMarkerElement;

    let pos = { lat: siteY, lng: siteX };
    map = new MapCtor(document.getElementById("map"), {
      zoom: 17,
      center: pos,
      mapTypeId: "hybrid",
      mapId: mapId,
      disableDefaultUI: true,
    });
    marker = createSiteMarker(pos);
  } catch (e) {
    console.error("Failed to initialize Google Map for site:", e);
  }
}
function fetchSite() {
  let t = document.getElementById("siteId");
  siteId = t.options[t.selectedIndex].value;
  mapCenter = { lat: 0, lng: 0 };
  if (siteId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/site/" + siteId, {
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
      .then(async (data) => {
        if (data == null || typeof data !== "object") {
          return;
        }
        let coord = validateMapCoordinate(data.location?.coordinate);
        if (coord == null) {
          console.error(
            "Invalid site coordinate payload:",
            data.location?.coordinate
          );
          return;
        }
        siteX = coord.lng;
        siteY = coord.lat;
        mapCenter = coord;

        if (Array.isArray(data.trench) && data.trench.length > 0) {
          trenchList = "<ul>";
          for (let p = 0; p < data.trench.length; p++) {
            trenchList +=
              '<li><a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/trench/" +
              data.trench[p] +
              "?country=" +
              niSelectedCountry +
              '">' +
              data.trench[p] +
              "</a></li>";
          }
          trenchList += "</ul>";
        } else {
          trenchList = "<ul><li>none</li></ul>";
        }
        if (Array.isArray(data.pole) && data.pole.length > 0) {
          poleList = "<ul>";
          for (let p = 0; p < data.pole.length; p++) {
            poleList +=
              '<li><a href="' +
              localStorage.getItem("ni.rootUrl") +
              "/pole/" +
              data.pole[p] +
              "?country=" +
              niSelectedCountry +
              '">' +
              data.pole[p] +
              "</a></li>";
          }
          poleList += "</ul>";
        } else {
          poleList = "<ul><li>none</li></ul>";
        }

        if (data.area != null) {
          document.getElementById("siteArea").setAttribute("value", data.area);
        }
        if (data.type != null) {
          document.getElementById("siteType").setAttribute("value", data.type);
        }

        if (map != null) {
          map.setCenter(coord);
          if (marker != null) {
            marker.position = coord;
            marker.title = siteId || "";
            marker.map = map;
          } else if (AdvancedMarkerElementCtor != null) {
            marker = createSiteMarker(coord);
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
  countryListPopulate(fetchListSites);
} catch (e) {
  console.error(e);
}
