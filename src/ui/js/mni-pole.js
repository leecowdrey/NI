//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Pole
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
var map;
var polePath;
var lineSymbol;
let poleId = null;
let point = null;
let mapVendor = null;
let poleX = 0;
let poleY = 0;
let marker = null;
let endMarker = null;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
var trenchPanel = null;
var sitePanel = null;
let trenchList = "";
let siteList = "";
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
    localStorage.getItem("mni.gatewayUrl") + "/pole?country=" + selectedCountry,
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
      let suppliedPoleId = window.location.pathname.replace(
        localStorage.getItem("mni.rootUrl") + "/pole/",
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
    fetch(localStorage.getItem("mni.gatewayUrl") + "/pole/timeline/" + poleId, {
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
        let polePoints =
          "<option disabled value='-1'> -- select a date/time point -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i==0) {
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
function fetchPole() {
  let t = document.getElementById("poleId");
  poleId = t.options[t.selectedIndex].value;
  let p = document.getElementById("polePoint");
  point = p.options[p.selectedIndex].value;
  poleCoordinates = [];
  mapCenter = { lat: 0, lng: 0 };
  if (poleId != "-1" && point != "-1") {
    fetch(
      localStorage.getItem("mni.gatewayUrl") +
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
      .then((data) => {
        if (data != null) {
          poleX = data.coordinate.x;
          poleY = data.coordinate.y;
          if (data.connectsTo?.trenchId != null) {
            trenchList =
              '<li><a href="' +
              localStorage.getItem("mni.rootUrl") +
              "/trench/" +
              data.connectsTo?.trenchId +
              "?country=" +
              mniSelectedCountry +
              '">' +
              data.connectsTo?.trenchId +
              "</a></li>";
          } else {
            trenchList = "<ul><li>none</li></ul>";
          }
          if (data.connectsTo?.siteId != null) {
            siteList =
              '<li><a href="' +
              localStorage.getItem("mni.rootUrl") +
              "/site/" +
              data.connectsTo?.siteId +
              "?country=" +
              mniSelectedCountry +
              '">' +
              data.connectsTo?.siteId +
              "</a></li>";
          } else {
            siteList = "<ul><li>none</li></ul>";
          }
          if (
            document.getElementById("mapRender") !== undefined &&
            document.getElementById("mapRender") != null
          ) {
            map.setCenter({ lat: poleY, lng: poleX });
            if (marker != null) {
              marker.setMap(null);
            }
            marker.setPosition({ lat: poleY, lng: poleX });
            marker.setMap(map);
            google.maps.event.addListener(marker, "click", function (h) {
              trenchPanel = new google.maps.InfoWindow({
                headerContent: "Trench",
                position: marker,
                content: trenchList,
              });
              trenchPanel.open({
                shouldFocus: true,
                map,
              });
            });
            google.maps.event.addListener(marker, "mouseover", function (e) {
              injectTooltip(e, poleId);
            });
            google.maps.event.addListener(marker, "mouseout", function (e) {
              deleteTooltip(e);
            });
            google.maps.event.addListener(marker, "rightclick", function (h) {
              sitePanel = new google.maps.InfoWindow({
                headerContent: "Site",
                position: marker,
                content: siteList,
              });
              sitePanel.open({
                shouldFocus: true,
                map,
              });
            });
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
        }
      })
      .catch((e) => {
        console.error(e);
      });
    loadScript(mapRenderUrl, function () {
      function displayMap() {
        map = new google.maps.Map(document.getElementById("map"), {
          zoom: 17,
          center: { lat: poleY, lng: poleX },
          mapTypeId: "hybrid",
          disableDefaultUI: true,
        });
        marker = new google.maps.Marker({
          position: { lat: poleY, lng: poleX },
          label: {
            text: "\ue7ee", // codepoint from https://fonts.google.com/icons
            fontFamily: "Material Symbols Outlined",
            color: "#ffffff",
            fontSize: "18px",
          },
          map: map,
        });
        google.maps.event.addListener(marker, "click", function (h) {
          trenchPanel = new google.maps.InfoWindow({
            headerContent: "Trench",
            position: { lat: poleY, lng: poleX },
            content: trenchList,
          });
          trenchPanel.open({
            shouldFocus: true,
            map,
          });
        });
        google.maps.event.addListener(marker, "mouseover", function (e) {
          injectTooltip(e, poleId);
        });
        google.maps.event.addListener(marker, "mouseout", function (e) {
          deleteTooltip(e);
        });
        google.maps.event.addListener(marker, "rightclick", function (h) {
          sitePanel = new google.maps.InfoWindow({
            headerContent: "Site",
            position: { lat: poleY, lng: poleX },
            content: siteList,
          });
          sitePanel.open({
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
  countryListPopulate(fetchListPoles);
} catch (e) {
  console.error(e);
}
