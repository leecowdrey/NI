//=====================================================================
// Network Insight (NI) - JavaScript: Duct
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let ductId = null;
let ductRawPoints = [];
let point = null;
function updateDuctPointFromSlider() {
  document.getElementById("ductPoint").value =
    ductRawPoints[
      ductRawPoints.length - document.getElementById("ductPointRange").value
    ];
  fetchDuct();
}
function fetchDuctPoints() {
  let r = document.getElementById("ductId");
  ductId = r.options[r.selectedIndex].value;
  if (ductId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/duct/timeline/" + ductId, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      keepalive: true,
    })
      .then((response) => {
        if (
          response.status == 200 &&
          toInteger(response.headers.get("Content-Length")) > 0
        ) {
          return response.json();
        }
      })
      .then((data) => {
        let ductPoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i==0) {
          ductPoints +=
            "<option selected='selected' value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
          } else {
          ductPoints +=
            "<option value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
          }
          ductRawPoints.push(data[i].point);
        }
        document.getElementById("ductPoint").innerHTML = ductPoints;
        fetchDuct();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
function fetchListDuct() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/duct?country=" + selectedCountry,
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
        if (
          response.status == 200 &&
          toInteger(response.headers.get("Content-Length")) > 0
        ) {
          return response.json();
        }
      }
    })
    .then((data) => {
      let suppliedDuctId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/duct/",
        ""
      );
      let ductIds =
        "<option disabled value='-1' selected='selected'> -- select a duct -- </option>";
      if (suppliedDuctId != null) {
        trenchIds =
          "<option disabled value='-1'> -- select a duct -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedDuctId == data[i]) {
          ductIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          ductIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("ductId").innerHTML = ductIds;
      if (suppliedDuctId != null) {
        fetchDuctPoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchDuct() {
  let r = document.getElementById("ductId");
  ductId = r.options[r.selectedIndex].value;
  let p = document.getElementById("ductPoint");
  point = p.options[p.selectedIndex].value;
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/duct/" +
      ductId +
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
        if (
          response.status == 200 &&
          toInteger(response.headers.get("Content-Length")) > 0
        ) {
          return response.json();
        }
      }
    })
    .then((data) => {
      if (data?.configuration != null) {
        let ductOuter = 0;
        let ductInner = 1;
        let ductGridMaxOuter = 36;
        let ductGridMaxInner = 48;
        let ductGridColumns = 24;
        let ductUsed = 0;
        let ductFree = 0;
        let ductReserved = 0;
        let ductFaulty = 0;
        let source = "historical";
        let c = document.getElementById("country");
        let selectedCountry = c.options[c.selectedIndex].value;
        if (data.source != null) {
          source = data.source;
        }
        ductOuter = 1;
        ductInner = toInteger(data.configuration);
        if (ductInner > ductGridMaxInner) {
          ductGridColumns = Math.max(
            Math.ceil(ductInner / ductGridMaxInner),
            ductGridMaxInner
          );
        }

        grid.style.setProperty("--max-duct-rows", ductGridMaxInner);
        grid.style.setProperty("--max-duct-columns", ductGridColumns);

        for (let o = 0; o < ductOuter; o++) {
          for (let j = 0; j < ductInner; j++) {
            let cell = document.createElement("div");
            cell.setAttribute("id", "duct" + o + "-" + j);
            cell.setAttribute("title", data.state);
            switch (data.state) {
              case "free":
                if (source == "predicted") {
                  cell.setAttribute("class", "predictedDuctFree");
                } else {
                  cell.setAttribute("class", "ductFree");
                }
                ductFree = ductFree + 1;
                break;
              case "used":
                if (source == "predicted") {
                  cell.setAttribute("class", "predictedDuctUsed");
                } else {
                  cell.setAttribute("class", "ductUsed");
                }
                ductUsed = ductUsed + 1;
                break;
              case "reserved":
                if (source == "predicted") {
                  cell.setAttribute("class", "predictedDuctReserved");
                } else {
                  cell.setAttribute("class", "ductReserved");
                }
                ductReserved = ductReserved + 1;
                break;
              case "faulty":
                if (source == "predicted") {
                  cell.setAttribute("class", "predictedDuctFaulty");
                } else {
                  cell.setAttribute("class", "ductFaulty");
                }
                ductFaulty = ductFaulty + 1;
                break;
            }

            cell.classList.add("cell");
            grid.appendChild(cell);
            // <i class="fa fa-check"></i> or &#10003;
            // <i class="fa fa fa-exclamation"></i> or &#x26A0;
            // <i class="fa fa-times"></i> or &#10060;
            document.getElementById("duct" + o + "-" + j).innerHTML =
              "<br>" + (j + 1);
          }
        }
        let metadata = "<b>Reference:</b>&emsp;";
        if (data.reference != null) {
          metadata = metadata + data.reference;
        }
        metadata =
          metadata +
          "&emsp;( " +
          ductId +
          " )<br>&emsp;Source:&emsp;" +
          data.source +
          "<br><br>" +
          "&emsp;Purpose:&emsp;" +
          data.purpose +
          "<br>" +
          "&emsp;Category:&emsp;" +
          data.category +
          "<br>" +
          "&emsp;Configuration:&emsp;" +
          data.configuration +
          "-way<br>";
        if (data.within != null) {
          metadata += "&emsp;Within Duct:&emsp;" +
            ' <a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/duct/" +
            data.within +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.within +
            "</a><br>";
        }
        "&emsp;Placement:&emsp;H=" +
          data.configuration.horizontal +
          data.configuration.unit +
          "&emsp;V=" +
          data.configuration.vertical +
          data.configuration.unit;
        ("<br>");
        metadata = metadata + "<br><b>Location</b>:<br>";
        metadata +=
          "&emsp;Trench:&emsp;" +
          ' <a href="' +
          localStorage.getItem("ni.rootUrl") +
          "/trench/" +
          data.trenchId +
          "?country=" +
          selectedCountry +
          '" target="_self">' +
          data.trenchId +
          "</a><br>";

        if (data.category == "duct") {
            metadata = metadata + "<br><b>Sub-Ducts:</b><br>";
          if (data.subduct.length > 0) {
            for (let c = 0; c < data.subduct.length; c++) {
              metadata +=
                '&emsp;<a href="' +
                localStorage.getItem("ni.rootUrl") +
                "/duct/" +
                data.subduct[c] +
                "?country=" +
                selectedCountry +
                '" target="_self">' +
                data.subduct[c] +
                "</a><br>";
            }
          }
        }
        metadata = metadata + "<br><b>Cables:</b><br>";
        for (let c = 0; c < data.cable.length; c++) {
          metadata +=
            "&emsp;" +
            ' <a href="' +
            localStorage.getItem("ni.rootUrl") +
            "/cable/" +
            data.cable[c] +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.cable[c] +
            "</a><br>";
        }
        metadata +=
          "<br>" +
          "<br><b>Usage Summary:</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
          ductFaulty +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
          ductReserved +
          "</div>" +
          '<div id="stateusage-used" class="stateusage">Used: ' +
          ductUsed +
          "</div>" +
          '<div id="stateusage-free" class="stateusage">Free: ' +
          ductFree +
          "</div></div>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  countryListPopulate(fetchListDuct);
} catch (e) {
  console.error(e);
}
