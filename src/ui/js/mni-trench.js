//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Trench
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
var map;
var trenchPath;
var lineSymbol;
let fmrReady = null;
let ftgReady = null;
let fltReady = null;
let ftpReady = null;
let ftdReady = null;
let ftppReady = null;
let retryMs = 5000;
let trenchId = null;
let point = null;
let mapVendor = null;
let trenchCoordinates = [];
let startMarker = null;
let endMarker = null;
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
function fetchTrenchPremisesPassed(id, p) {
  if (ftppReady != null) {
    clearTimeout(ftppReady);
  }

  fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
      } else {
        ftppReady = setTimeout(fetchTrenchPremisesPassed, retryMs, id);
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
      ftppReady = setTimeout(fetchTrenchPremisesPassed, retryMs, id, p);
    });
}
function fetchTrenchDistance(id, p) {
  if (ftdReady != null) {
    clearTimeout(ftdReady);
  }

  fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
      } else {
        ftdReady = setTimeout(fetchTrenchDistance, retryMs, id, p);
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
      ftdReady = setTimeout(fetchTrenchDistance, retryMs, id, p);
    });
}
function fetchListTrench() {
  if (fltReady != null) {
    clearTimeout(fltReady);
  }
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("mni.gatewayUrl") +
      "/trench?country=" +
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
      } else {
        fltReady = setTimeout(fetchListTrench, retryMs);
      }
    })
    .then((data) => {
      let trenchIds =
        "<option disabled value='-1' selected='selected'> -- select a trench -- </option>";
      for (var i = 0; i < data.length; i++) {
        trenchIds +=
          "<option value='" + data[i] + "' >" + data[i] + "</option>";
      }
      document.getElementById("trenchId").innerHTML = trenchIds;
      document.getElementById("trenchDistance").setAttribute("value", "");
    })
    .catch((e) => {
      fltReady = setTimeout(fetchListTrench, retryMs);
    });
}
function fetchTrenchPoints() {
  if (ftpReady != null) {
    clearTimeout(ftpReady);
  }

  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;
  if (trenchId != "-1") {
    fetch(
      localStorage.getItem("mni.gatewayUrl") + "/trench/timeline/" + trenchId,
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
        } else {
          ftpReady = setTimeout(fetchTrenchPoints, retryMs);
        }
      })
      .then((data) => {
        let trenchPoints =
          "<option disabled value='-1' selected='selected'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          trenchPoints +=
            "<option value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
        }
        document.getElementById("trenchPoint").innerHTML = trenchPoints;
      })
      .catch((e) => {
        ftpReady = setTimeout(fetchTrenchPoints, retryMs);
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
      } else {
        fmrReady = setTimeout(fetchMapRender, retryMs);
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
      fmrReady = setTimeout(fetchMapRender, retryMs);
    });
}
function fetchTrenchGeometry() {
  if (ftgReady != null) {
    clearTimeout(ftgReady);
  }
  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;
  let p = document.getElementById("trenchPoint");
  point = p.options[p.selectedIndex].value;
  trenchCoordinates = [];
  mapCenter = { lat: 0, lng: 0 };

  fetch(
    localStorage.getItem("mni.gatewayUrl") +
      "/trench/geometry/" +
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
      } else {
        ftgReady = setTimeout(fetchTrenchGeometry, retryMs);
      }
    })
    .then((data) => {
      if (data != null) {
        if (data.length > 0) {
          let mi = Number.parseFloat(data.length / 2).toFixed(0);
          mapCenter = { lat: data[mi].x, lng: data[mi].y };
        } else {
          mapCenter = { lat: 0, lng: 0 };
        }
        for (var i = 0; i < data.length; i++) {
          let c = { lat: data[i].x, lng: data[i].y };
          trenchCoordinates.push(c);
        }
        if (
          document.getElementById("mapRender") !== undefined &&
          document.getElementById("mapRender") != null
        ) {
          map.setCenter(mapCenter);
          trenchPath.setMap(null);
          trenchPath.setPath(trenchCoordinates);
          trenchPath.setMap(map);
          if (startMarker != null) {
            startMarker.setMap(null);
          }
          if (endMarker != null) {
            endMarker.setMap(null);
          }
          if (trenchCoordinates.length > 0) {
            startMarker.setPosition({
              lat: trenchCoordinates[0].lat,
              lng: trenchCoordinates[0].lng,
            });
            startMarker.setMap(map);
            endMarker.setPosition({
              lat: trenchCoordinates[trenchCoordinates.length - 1].lat,
              lng: trenchCoordinates[trenchCoordinates.length - 1].lng,
            });
            endMarker.setMap(map);
          }
        }
      }
      fetchTrenchDistance(trenchId, point);
      fetchTrenchPremisesPassed(trenchId, point);
    })
    .catch((e) => {
      ftgReady = setTimeout(fetchTrenchGeometry, retryMs);
    });
  loadScript(mapRenderUrl, function () {
    function displayMap() {
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17,
        center: mapCenter,
        mapTypeId: "hybrid",
        disableDefaultUI: true,
      });
      lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1,
        scale: 4,
      };
      trenchPath = new google.maps.Polyline({
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
      trenchPath.setMap(map);
      startMarker = new google.maps.Marker({
        position: trenchCoordinates[0],
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          strokeOpacity: 0,
          strokeColor: "#8B0000",
          fillOpacity: 1.0,
          fillColor: "#8B0000",
        },
        map: map,
      });
      endMarker = new google.maps.Marker({
        position: trenchCoordinates[trenchCoordinates.length - 1],
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          strokeOpacity: 0,
          strokeColor: "#8B0000",
          fillOpacity: 1.0,
          fillColor: "#8B0000",
        },
        map: map,
      });
    }
    window.displayMap = displayMap;
  });
}
try {
  countryListPopulate();
  fetchMapRender();
} catch (e) {
  fmrReady = setTimeout(fetchMapRender, retryMs);
}
try {
  fetchListTrench();
} catch (e) {
  fltReady = setTimeout(fetchListTrench, retryMs);
}
