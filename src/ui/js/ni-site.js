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
var map;
var polePath;
var lineSymbol;
let siteId = null;
let point = null;
let mapVendor = null;
let siteX = 0;
let siteY = 0;
let marker = null;
let endMarker = null;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
let urlOnOffNetSuffix = "";
var trenchPanel = null;
var polePanel = null;
let trenchList = "";
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
        if (suppliedSiteId == data[i]) {
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
function fetchSite() {
  let t = document.getElementById("siteId");
  siteId = t.options[t.selectedIndex].value;
  poleCoordinates = [];
  mapCenter = { lat: 0, lng: 0 };
  if (siteId != "-1" && point != "-1") {
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
      .then((data) => {
        if (data != null) {
          siteX = data.location.coordinate.x;
          siteY = data.location.coordinate.y;
          if (data.trench != null) {
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
          }
          if (data.pole != null) {
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
          }
          if (
            document.getElementById("mapRender") !== undefined &&
            document.getElementById("mapRender") != null
          ) {
            map.setCenter({ lat: siteY, lng: siteX });
            if (marker != null) {
              marker.setMap(null);
            }
            marker.setPosition({ lat: siteY, lng: siteX });
            marker.setMap(map);
            if (document.getElementById("onNet").checked) {
              google.maps.event.addListener(marker, "click", function (h) {
                trenchPanel = new google.maps.InfoWindow({
                  headerContent: "Trenches",
                  position: { lat: siteY, lng: siteX },
                  content: trenchList,
                });
                trenchPanel.open({
                  shouldFocus: true,
                  map,
                });
              });
              google.maps.event.addListener(marker, "mouseover", function (e) {
                injectTooltip(e, siteId);
              });
              google.maps.event.addListener(marker, "mouseout", function (e) {
                deleteTooltip(e);
              });
              google.maps.event.addListener(marker, "rightclick", function (h) {
                polePanel = new google.maps.InfoWindow({
                  headerContent: "Poles",
                  position: { lat: siteY, lng: siteX },
                  content: poleList,
                });
                polePanel.open({
                  shouldFocus: true,
                  map,
                });
              });
            }
          }
          if (data.area != null) {
            document
              .getElementById("siteArea")
              .setAttribute("value", data.area);
          }
          if (data.type != null) {
            document
              .getElementById("siteType")
              .setAttribute("value", data.type);
          }
        }
      })
      .catch((e) => {
        console.error(e);
      });
    loadScript(mapRenderUrl, function () {
      function displayMap() {
        map = new google.maps.Map(document.getElementById("map"), {
          zoom: 17,
          center: { lat: siteY, lng: siteX },
          mapTypeId: "hybrid",
          disableDefaultUI: true,
        });

        marker = new google.maps.Marker({
          position: { lat: siteY, lng: siteX },
          label: {
            text: "\ue7ee", // codepoint from https://fonts.google.com/icons
            fontFamily: "Material Symbols Outlined",
            color: "#ffffff",
            fontSize: "18px",
          },
          map: map,
        });
        google.maps.event.addListener(marker, "mouseover", function (e) {
          injectTooltip(e, siteId);
        });
        google.maps.event.addListener(marker, "mouseout", function (e) {
          deleteTooltip(e);
        });
        google.maps.event.addListener(marker, "click", function (h) {
          trenchPanel = new google.maps.InfoWindow({
            headerContent: "Trenches",
            position: { lat: siteY, lng: siteX },
            content: trenchList,
          });
          trenchPanel.open({
            shouldFocus: true,
            map,
          });
        });
        google.maps.event.addListener(marker, "rightclick", function (h) {
          polePanel = new google.maps.InfoWindow({
            headerContent: "Poles",
            position: { lat: siteY, lng: siteX },
            content: poleList,
          });
          polePanel.open({
            shouldFocus: true,
            map,
          });
        });
      }
      window.displayMap = displayMap;
    });
  }
}
try {
  fetchMapRender();
  countryListPopulate(fetchListSites);
} catch (e) {
  console.error(e);
}
