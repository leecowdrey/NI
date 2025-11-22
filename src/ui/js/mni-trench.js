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
let trenchId = null;
let point = null;
let mapVendor = null;
let trenchCoordinates = [];
let mapCenter = { lat: 0, lng: 0 };
let mapRenderUrl = null;
var ductPanel = null;
var polePanel = null;
let ductList = "";
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
function fetchTrenchPremisesPassed(id, p) {
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
    localStorage.getItem("mni.gatewayUrl") +
      "/trench?country=" +
      mniSelectedCountry,
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
      let suppliedTrenchId = window.location.pathname.replace(
        localStorage.getItem("mni.rootUrl") + "/trench/",
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
          }
        })
        .then((data) => {
          let trenchPoints =
            "<option disabled value='-1'> -- select a date/time -- </option>";
          for (var i = 0; i < data.length; i++) {
            if (i==0) {
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
  } catch (e) {}
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
function fetchTrenchGeometry() {
  let t = document.getElementById("trenchId");
  trenchId = t.options[t.selectedIndex].value;
  let p = document.getElementById("trenchPoint");
  point = p.options[p.selectedIndex].value;
  trenchCoordinates = [];
  mapCenter = { lat: 0, lng: 0 };

  fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
    .then((data) => {
      if (data != null) {
        if (data.pole != null) {
          poleList = "<ul>";
          for (let p = 0; p < data.pole.length; p++) {
            poleList +=
              '<li><a href="' +
              localStorage.getItem("mni.rootUrl") +
              "/pole/" +
              data.pole[p] +
              "?country=" +
              mniSelectedCountry +
              '">' +
              data.pole[p] +
              "</a></li>";
          }
          poleList += "</ul>";
        }
        if (data.duct != null) {
          ductList = "<ul>";
          for (let d = 0; d < data.duct.length; d++) {
            ductList +=
              '<li><a href="' +
              localStorage.getItem("mni.rootUrl") +
              "/duct/" +
              data.duct[d] +
              "?country=" +
              mniSelectedCountry +
              '">' +
              data.duct[d] +
              "</a></li>";
          }
          ductList += "</ul>";
        } else {
          ductList = "<ul><li>none</li></ul>";
        }
        if (data.coordinates.length > 0) {
          let mi = Number.parseFloat(data.coordinates.length / 2).toFixed(0);
          mapCenter = {
            lat: data.coordinates[mi].y,
            lng: data.coordinates[mi].x,
          };
        } else {
          mapCenter = { lat: 0, lng: 0 };
        }
        for (var i = 0; i < data.coordinates.length; i++) {
          let c = { lat: data.coordinates[i].y, lng: data.coordinates[i].x };
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
        }
      }
      fetchTrenchDistance(trenchId, point);
      fetchTrenchPremisesPassed(trenchId, point);
    })
    .catch((e) => {
      console.error(e);
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
      google.maps.event.addListener(trenchPath, "click", function (h) {
        ductPanel = new google.maps.InfoWindow({
          headerContent: "Ducts",
          position: h.latLng,
          content: ductList,
        });
        ductPanel.open({
          shouldFocus: true,
          map,
        });
      });
      google.maps.event.addListener(trenchPath, "mouseover", function (e) {
        injectTooltip(e, trenchId);
      });
      google.maps.event.addListener(trenchPath, "mouseout", function (e) {
        deleteTooltip(e);
      });
      google.maps.event.addListener(trenchPath, "rightclick", function (h) {
        polePanel = new google.maps.InfoWindow({
          headerContent: "Poles",
          position: h.latLng,
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
try {
  fetchMapRender();
  countryListPopulate(fetchListTrench);
} catch (e) {
  console.error(e);
}
