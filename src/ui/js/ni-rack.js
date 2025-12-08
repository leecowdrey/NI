//=====================================================================
// Network Insight (NI) - JavaScript: Rack
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
let rackId = null;
let point = null;
function fetchListRack() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  fetch(
    localStorage.getItem("ni.gatewayUrl") + "/rack?country=" + selectedCountry,
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
      let suppliedRackId = window.location.pathname.replace(
        localStorage.getItem("ni.rootUrl") + "/rack/",
        ""
      );
      let rackIds =
        "<option disabled value='-1' selected='selected'> -- select a rack -- </option>";
      if (suppliedRackId != null) {
        rackIds = "<option disabled value='-1'> -- select a rack -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedRackId == data[i]) {
          rackIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          rackIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("rackId").innerHTML = rackIds;
      if (suppliedRackId != null) {
        fetchRackPoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchRack() {
  let r = document.getElementById("rackId");
  rackId = r.options[r.selectedIndex].value;
  let p = document.getElementById("rackPoint");
  point = p.options[p.selectedIndex].value;
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("ni.gatewayUrl") +
      "/rack/" +
      rackId +
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
      let rackSlots = data.slots;
      let slotUsed = 0;
      let slotFree = 0;
      let slotReserved = 0;
      let slotFaulty = 0;
      let slotUsage = data.slotUsage.reverse();
      let source = "historical";
      if (data.source != null) {
        source = data.source;
      }
      grid.style.setProperty("--max-rack-slots", rackSlots);
      for (let j = 0; j < slotUsage.length; j++) {
        let cell = document.createElement("div");
        cell.setAttribute("id", "slot" + (rackSlots - j));
        switch (slotUsage[j].usage) {
          case "free":
            cell.setAttribute(
              "title",
              rackSlots - j + ": " + slotUsage[j].usage
            );
            if (source == "predicted") {
              cell.setAttribute("class", "predictedSlotFree");
            } else {
              cell.setAttribute("class", "slotFree");
            }
            slotFree = slotFree + 1;
            break;
          case "used":
            cell.setAttribute(
              "title",
              rackSlots -
                j +
                ": " +
                slotUsage[j].usage +
                " " +
                slotUsage[j].host
            );
            if (source == "predicted") {
              cell.setAttribute("class", "predictedSlotUsed");
            } else {
              cell.setAttribute("class", "slotUsed");
            }
            slotUsed = slotUsed + 1;
            break;
          case "reserved":
            cell.setAttribute(
              "title",
              rackSlots - j + ": " + slotUsage[j].usage
            );
            if (source == "predicted") {
              cell.setAttribute("class", "predictedSlotReserved");
            } else {
              cell.setAttribute("class", "slotReserved");
            }
            slotReserved = slotReserved + 1;
            break;
          case "faulty":
            cell.setAttribute(
              "title",
              rackSlots - j + ": " + slotUsage[j].usage
            );
            if (source == "predicted") {
              cell.setAttribute("class", "predictedSlotFaulty");
            } else {
              cell.setAttribute("class", "slotFaulty");
            }
            slotFaulty = slotFaulty + 1;
            break;
        }
        cell.classList.add("cell");
        grid.appendChild(cell);
        let cellHTML = "";
        switch (slotUsage[j].usage) {
          case "used":
            if (slotUsage[j].neId != null) {
              let c = document.getElementById("country");
              let selectedCountry = c.options[c.selectedIndex].value;
              cellHTML =
                "&emsp;" +
                (rackSlots - j) +
                ' <a href="' +
                localStorage.getItem("ni.rootUrl") +
                "/ne/" +
                slotUsage[j].neId +
                "?country=" +
                selectedCountry +
                '" target="_self">' +
                slotUsage[j].host +
                "</a>&emsp;";
            } else {
              cellHTML = "&emsp;" + (rackSlots - j);
            }
            break;
          default:
            cellHTML = "&emsp;" + (rackSlots - j);
        }
        document.getElementById("slot" + (rackSlots - j)).innerHTML = cellHTML;
      }
      if (data?.decommissioned == undefined) {
        data.decommissioned = "";
      }
      let metadata =
        "<b>Reference</b>:&emsp;" +
        data.reference +
        "<br>" +
        "<center>( " +
        rackId +
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
        "<br><b>Dimensions</b>:<br>" +
        "H/W/D:&emsp;" +
        data.dimensions.height +
        " / " +
        data.dimensions.width +
        " / " +
        data.dimensions.depth +
        " " +
        data.dimensions.unit +
        "<br>" +
        "Slots:&emsp;&emsp;" +
        data.slots +
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
        "<br>X,Y,Z:&emsp;&emsp;" +
        data.coordinate.x +
        " , " +
        data.coordinate.y +
        " , " +
        data.coordinate.z +
        "<br>" +
        "Area:&emsp;&emsp;" +
        data.area +
        "<br>" +
        "Floor:&emsp;&emsp;" +
        data.floor +
        "<br>" +
        "Row:&emsp;&emsp;" +
        data.row +
        "<br><br><b>Usage Summary:</b><br>" +
        '<div class="stateusage-key">' +
        '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
        slotFaulty +
        "</div>" +
        '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
        slotReserved +
        "</div>" +
        '<div id="stateusage-used" class="stateusage">Used: ' +
        slotUsed +
        "</div>" +
        '<div id="stateusage-free" class="stateusage">Free: ' +
        slotFree +
        "</div></div>";
      document.getElementById("metadataPanel").innerHTML = metadata;
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchRackPoints() {
  let r = document.getElementById("rackId");
  rackId = r.options[r.selectedIndex].value;
  if (rackId != "-1") {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/rack/timeline/" + rackId, {
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
        let rackPoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i==0) {
          rackPoints +=
            "<option selected='selected' value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
          } else {
          rackPoints +=
            "<option value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
          }
        }
        document.getElementById("rackPoint").innerHTML = rackPoints;
        fetchRack();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
try {
  countryListPopulate(fetchListRack);
} catch (e) {
  console.error(e);
}
