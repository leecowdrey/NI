//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Site
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
let fmrReady = null;
let ftgReady = null;
let flsReady = null;
let fppReady = null;
let retryMs = 5000;
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
function fetchListSites() {
  if (flsReady != null) {
    clearTimeout(flsReady);
  }
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  if (document.getElementById("onNet").checked) {
    urlOnOffNetSuffix = "onnet?country=" +
      selectedCountry;
  } else {
    urlOnOffNetSuffix = "offnet?country=" +
      selectedCountry;
  }
  fetch(localStorage.getItem("mni.gatewayUrl") + "/site/" + urlOnOffNetSuffix, {
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
        //flsReady = setTimeout(fetchListSites, retryMs);
      //}
    })
    .then((data) => {
      let siteIds =
        "<option disabled value='-1' selected='selected'> -- select a site -- </option>";
      for (var i = 0; i < data.length; i++) {
        siteIds +=
          "<option value='" +
          data[i].siteId +
          "' >" +
          data[i].reference +
          "</option>";
      }
      document.getElementById("siteId").innerHTML = siteIds;
      document.getElementById("siteArea").setAttribute("value", "");
      document.getElementById("siteType").setAttribute("value", "");
    })
    .catch((e) => {
      notify(e);
      //flsReady = setTimeout(fetchListSites, retryMs);
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
      //fmrReady = setTimeout(fetchMapRender, retryMs);
    });
}
function fetchSite() {
  if (ftgReady != null) {
    clearTimeout(ftgReady);
  }
  let t = document.getElementById("siteId");
  siteId = t.options[t.selectedIndex].value;
  poleCoordinates = [];
  mapCenter = { lat: 0, lng: 0 };
  if (siteId != "-1" && point != "-1") {
    fetch(localStorage.getItem("mni.gatewayUrl") + "/site/" + siteId, {
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
          //ftgReady = setTimeout(fetchSite, retryMs);
        //}
      })
      .then((data) => {
        if (data != null) {
          siteX = data.location.coordinate.x;
          siteY = data.location.coordinate.y;
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
        notify(e);
        //ftgReady = setTimeout(fetchSite, retryMs);
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
      }
      window.displayMap = displayMap;
    });
  }
}
try {
  countryListPopulate();
  fetchMapRender();
} catch (e) {
  notify(e);
  //fmrReady = setTimeout(fetchMapRender, retryMs);
}
try {
  fetchListSites();
} catch (e) {
  notify(e);
  //flsReady = setTimeout(fetchListSites, retryMs);
}
