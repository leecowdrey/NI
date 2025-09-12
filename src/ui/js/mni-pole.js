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
let fmrReady = null;
let ftgReady = null;
let fltReady = null;
let fppReady = null;
let retryMs = 5000;
let poleId = null;
let point = null;
let mapVendor = null;
let poleX = 0;
let poleY = 0;
let marker = null;
let endMarker = null;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
function fetchListPoles() {
  if (fltReady != null) {
    clearTimeout(fltReady);
  }

  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(localStorage.getItem("mni.gatewayUrl") + "/pole?country=" +
      selectedCountry, {
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
        //fltReady = setTimeout(fetchMapRender, retryMs);
      //}
    })
    .then((data) => {
      let poleIds =
        "<option disabled value='-1' selected='selected'> -- select a pole -- </option>";
      for (var i = 0; i < data.length; i++) {
        poleIds += "<option value='" + data[i] + "' >" + data[i] + "</option>";
      }
      document.getElementById("poleId").innerHTML = poleIds;
      document.getElementById("poleHeight").setAttribute("value", "");
      document.getElementById("poleClassifier").setAttribute("value", "");
    })
    .catch((e) => {
      notify(e);
      //fltReady = setTimeout(fetchMapRender, retryMs);
    });
}
function fetchPolePoints() {
  if (fppReady != null) {
    clearTimeout(fppReady);
  }

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
        } //else {
          //fppReady = setTimeout(fetchMapRender, retryMs);
        //}
      })
      .then((data) => {
        let polePoints =
          "<option disabled value='-1' selected='selected'> -- select a date/time point -- </option>";
        for (var i = 0; i < data.length; i++) {
          polePoints +=
            "<option value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
        }
        document.getElementById("polePoint").innerHTML = polePoints;
      })
      .catch((e) => {
        notify(e);
        //fppReady = setTimeout(fetchMapRender, retryMs);
      });
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
      //fmrReady = setTimeout(fetchMapRender, retryMs);
    });
}
function fetchPole() {
  if (ftgReady != null) {
    clearTimeout(ftgReady);
  }
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
        } //else {
          //ftgReady = setTimeout(fetchPole, retryMs);
        //}
      })
      .then((data) => {
        if (data != null) {
          poleX = data.coordinate.x;
          poleY = data.coordinate.y;
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
        notify(e);
        //ftgReady = setTimeout(fetchPole, retryMs);
      });
    loadScript(mapRenderUrl, function () {
      function displayMap() {
        map = new google.maps.Map(document.getElementById("map"), {
          zoom: 30,
          center: { lat: poleY, lng: poleX },
          mapTypeId: "hybrid",
          disableDefaultUI: true,
        });
        marker = new google.maps.Marker({
          position: { lat: poleY, lng: poleX },
          icon: {
            path: "M 0,0 V15 M -4,4 H4",
            strokeOpacity: 1,
            fillColor: "#8B0000",
            fillOpacity: 1,
            strokeColor: "#8B0000",
            strokeWeight: 6,
            scale: 4,
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
  fetchListPoles();
} catch (e) {
  notify(e);
  //fltReady = setTimeout(fetchListPoles, retryMs);
}
