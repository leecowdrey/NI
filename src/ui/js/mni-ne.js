//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: NE
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
let flrReady = null;
let frpReady = null;
let frReady = null;
let fvnReady = null;
let retryMs = 5000;
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
  fetch(localStorage.getItem("mni.gatewayUrl") + "/cve/ne/" + neId, {
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
      notify(e);
    });
}
function updateNePointFromSlider() {
  document.getElementById("nePoint").value =
    neRawPoints[
      neRawPoints.length - document.getElementById("nePointRange").value
    ];
  fetchNe();
}
function fetchListNe() {
  if (flrReady != null) {
    clearTimeout(flrReady);
  }
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("mni.gatewayUrl") + "/ne?country=" + selectedCountry,
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
        //flrReady = setTimeout(fetchListNe, retryMs);
      //}
    })
    .then((data) => {
      let neIds =
        "<option disabled value='-1' selected='selected'> -- select a ne -- </option>";
      for (var i = 0; i < data.length; i++) {
        neIds += "<option value='" + data[i] + "' >" + data[i] + "</option>";
      }
      document.getElementById("neId").innerHTML = neIds;
    })
    .catch((e) => {
      notify(e);
      //flrReady = setTimeout(fetchListNe, retryMs);
    });
}
function fetchNe(neId, point = null) {
  if (frReady != null) {
    clearTimeout(flrReady);
  }
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
    localStorage.getItem("mni.gatewayUrl") + "/ne/" + neId + "?point=" + point,
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
        //flrReady = setTimeout(fetchNe, retryMs);
      //}
    })
    .then((data) => {
      if (data.ports != null) {
        let nePorts = data.ports.length;
        let neGridMaxColumns = 8;
        let neGridColumns = 8;
        let portUsed = 0;
        let portFree = 0;
        let portReserved = 0;
        let portFaulty = 0;
        let portPredicted = 0;
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
            case "predicted":
              if (source == "predicted") {
                cell.setAttribute("class", "predictedPortPredicted");
              } else {
                cell.setAttribute("class", "portPredicted");
              }
              portPredicted = portPredicted + 1;
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
          "<small><b>Host</b>:&emsp;" +
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
          "Site:&emsp;" +
          data.siteId +
          "<br>" +
          "Rack:&emsp;" +
          data.rackId +
          "<br>" +
          "Slot(s):&emsp;" +
          data.slotPosition +
          "<br>" +
          "<br><b>Usage Summary:</b><br>" +
          "Free:&emsp;&emsp;&emsp;" +
          portFree +
          "<br>" +
          "Used:&emsp;&emsp;&emsp;" +
          portUsed +
          "<br>" +
          "Reserved:&emsp;" +
          portReserved +
          "<br>" +
          "Faulty:&emsp;&emsp;" +
          portFaulty +
          "<br>" +
          "Predicted:&emsp;" +
          portPredicted +
          "<br>" +
          "Error Count:&emsp;" +
          portErrorCount +
          "<br>" +
          "<br><b>Common vulnerabilities and Exposures (CVE):</b><br>" +
          "Known:&emsp;&emsp;" +
          cveKnown +
          "<br>" +
          "Impacting:&emsp;" +
          cveImpacting +
          "</small>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      notify(e);
      //frReady = setTimeout(fetchNe, retryMs);
    });
}
function fetchNePoints() {
  if (frpReady != null) {
    clearTimeout(frpReady);
  }
  let r = document.getElementById("neId");
  neId = r.options[r.selectedIndex].value;
  if (neId != "-1") {
    fetch(localStorage.getItem("mni.gatewayUrl") + "/ne/timeline/" + neId, {
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
          //frpReady = setTimeout(fetchNePoints, retryMs);
        //}
      })
      .then((data) => {
        neRawPoints = [];
        let nePoints =
          "<option disabled value='-1' selected='selected'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          nePoints +=
            "<option value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
          neRawPoints.push(data[i].point);
        }
        document.getElementById("nePoint").innerHTML = nePoints;
        // slider
        if (neRawPoints.length > 0) {
          document.getElementById("nePointRange").disabled = false;
          document.getElementById("nePointRange").setAttribute("min", 1);
          document
            .getElementById("nePointRange")
            .setAttribute("max", neRawPoints.length);
          document
            .getElementById("nePointRange")
            .setAttribute("value", neRawPoints.length);
          document.getElementById("nePoint").value =
            neRawPoints[
              neRawPoints.length - document.getElementById("nePointRange").value
            ];
          fetchNe();
        } else {
          document.getElementById("nePointRange").setAttribute("min", 0);
          document.getElementById("nePointRange").setAttribute("max", 0);
          document.getElementById("nePointRange").setAttribute("value", 0);
          document.getElementById("nePointRange").disabled = true;
        }
      })
      .catch((e) => {
        notify(e);
        //frpReady = setTimeout(fetchNePoints, retryMs);
      });
  }
}
try {
  countryListPopulate();
  fetchListNe();
} catch (e) {
  notify(e);
  //flrReady = setTimeout(fetchListNe, retryMs);
}
