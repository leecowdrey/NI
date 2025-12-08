//=====================================================================
// Network Insight (NI) - JavaScript: NE
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let neId = null;
let neRawPoints = [];
let point = null;
var cveKnown = 0;
var cveImpacting = 0;
function fetchCveNe(neId = null) {
  cveKnown = 0;
  cveImpacting = 0;
  if (neId == null) {
    let r = document.getElementById("neId");
    neId = r.options[r.selectedIndex].value;
  }
  fetch(localStorage.getItem("ni.gatewayUrl") + "/cve/ne/" + neId, {
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
        if (data.known != null) {
          cveKnown = data.known.length;
        }
        if (data.impacting != null) {
          cveImpacting = data.impacting.length;
        }
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchListNe() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/ne?country=" + selectedCountry,
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
      let suppliedNeId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/ne/",
        ""
      );
      let neIds =
        "<option disabled value='-1' selected='selected'> -- select a ne -- </option>";
      if (suppliedNeId != null) {
        trenchIds = "<option disabled value='-1'> -- select a ne -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedNeId == data[i]) {
          neIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          neIds += "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("neId").innerHTML = neIds;
      if (suppliedNeId != null) {
        fetchNePoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchNe(neId, point = null) {
  if (neId == null) {
    let r = document.getElementById("neId");
    neId = r.options[r.selectedIndex].value;
  }
  if (point == null) {
    let p = document.getElementById("nePoint");
    point = p.options[p.selectedIndex].value;
  }
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/ne/" + neId + "?point=" + point,
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
      if (data.ports != null) {
        let c = document.getElementById("country");
        let selectedCountry = c.options[c.selectedIndex].value;
        let nePorts = data.ports.length;
        let neGridMaxColumns = 8;
        let neGridColumns = 8;
        let portUsed = 0;
        let portFree = 0;
        let portReserved = 0;
        let portFaulty = 0;
        let portErrorCount = 0;
        let source = "historical";
        if (data.source != null) {
          source = data.source;
        }
        if (nePorts > neGridMaxColumns) {
          neGridColumns = Math.max(
            Math.ceil(nePorts / neGridMaxColumns),
            neGridMaxColumns
          );
        }

        grid.style.setProperty("--max-ne-rows", nePorts);
        grid.style.setProperty("--max-ne-columns", neGridColumns);

        for (let j = 0; j < data.ports.length; j++) {
          let cell = document.createElement("div");
          cell.setAttribute("id", "port" + j);
          cell.setAttribute(
            "title",
            data.ports[j].name +
              ": " +
              data.ports[j].state +
              " " +
              data.ports[j].configuration.rate +
              data.ports[j].configuration.unit +
              ", errors: " +
              data.ports[j].errorCount
          );
          portErrorCount = portErrorCount + data.ports[j].errorCount;
          switch (data.ports[j].state) {
            case "free":
              if (source == "predicted") {
                cell.setAttribute("class", "predictedPortFree");
              } else {
                cell.setAttribute("class", "portFree");
              }
              portFree = portFree + 1;
              break;
            case "used":
              if (source == "predicted") {
                cell.setAttribute("class", "predictedPortUsed");
              } else {
                cell.setAttribute("class", "portUsed");
              }
              portUsed = portUsed + 1;
              break;
            case "reserved":
              if (source == "predicted") {
                cell.setAttribute("class", "predictedPortReserved");
              } else {
                cell.setAttribute("class", "portReserved");
              }
              portReserved = portReserved + 1;
              break;
            case "faulty":
              if (source == "predicted") {
                cell.setAttribute("class", "predictedPortFaulty");
              } else {
                cell.setAttribute("class", "portFaulty");
              }
              portFaulty = portFaulty + 1;
              break;
          }
          cell.classList.add("cell");
          grid.appendChild(cell);
          // <i class="fa fa-check"></i> or &#10003;
          // <i class="fa fa fa-exclamation"></i> or &#x26A0;
          // <i class="fa fa-times"></i> or &#10060;
          let errorIndicator = '<i class="fa fa-check"></i>';
          if (data.ports[j].errorCount > 0 && data.ports[j].errorCount < 100) {
            errorIndicator = '<i class="fa fa fa-exclamation"></i>';
          } else if (data.ports[j].errorCount >= 100) {
            errorIndicator = '<i class="fa fa-times"></i> ';
          }
          document.getElementById("port" + j).innerHTML =
            j + 1 + "<br>" + errorIndicator; //data.ports[j].name;
        }
        if (data?.decommissioned == undefined) {
          data.decommissioned = "";
        }
        let metadata =
          "<b>Host</b>:&emsp;" +
          data.host +
          "<br>" +
          "<center>( " +
          neId +
          " )</center><br>" +
          "<br>Commissioned:&emsp;&emsp;" +
          data.commissioned +
          "<br>" +
          "Decommissioned:&emsp;" +
          data.decommissioned +
          "<br>" +
          "Source:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" +
          source +
          "<br>" +
          "<br><b>Details</b>:<br>" +
          "IP:&emsp;&emsp;" +
          data.mgmtIP +
          "<br>" +
          "Vendor:&emsp;" +
          data.vendor +
          "<br>" +
          "Model:&emsp;" +
          data.model +
          "<br>" +
          "Image:&emsp;" +
          data.image +
          "<br>" +
          "Version:&emsp;" +
          data.version +
          "<br>" +
          "<br><b>Location</b>:<br>" +
          'Site:&emsp;<a href="' +
          localStorage.getItem("ni.rootUrl") +
          "/site/" +
          data.siteId +
          "?country=" +
          selectedCountry +
          '" target="_self">' +
          data.siteId +
          "</a>" +
          '<br>Rack:&emsp;<a href="' +
          localStorage.getItem("ni.rootUrl") +
          "/rack/" +
          data.rackId +
          "?country=" +
          selectedCountry +
          '" target="_self">' +
          data.rackId +
          "</a>" +
          "<br>" +
          "Slot(s):&emsp;" +
          data.slotPosition +
          "<br>" +
          "<br><b>Usage Summary:</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
          portFaulty +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
          portReserved +
          "</div>" +
          '<div id="stateusage-used" class="stateusage">Used: ' +
          portUsed +
          "</div>" +
          '<div id="stateusage-free" class="stateusage">Free: ' +
          portFree +
          "</div>" +
          '<div id="stateusage-error" class="stateusage">Errors: ' +
          portErrorCount +
          "</div>" +
          "</div><br>" +
          "<br><b>Common vulnerabilities and Exposures (CVE):</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Impacting: ' +
          cveImpacting +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Known: ' +
          cveKnown +
          "</div>" +
          "</div>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchNePoints() {
  let r = document.getElementById("neId");
  neId = r.options[r.selectedIndex].value;
  if (neId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/ne/timeline/" + neId, {
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
        neRawPoints = [];
        let nePoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            nePoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            nePoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
          neRawPoints.push(data[i].point);
        }
        document.getElementById("nePoint").innerHTML = nePoints;
          fetchNe();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
try {
  countryListPopulate(fetchListNe);
} catch (e) {
  console.error(e);
}
