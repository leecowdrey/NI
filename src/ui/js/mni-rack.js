let flrReady = null;
let frpReady = null;
let frReady = null;
let retryMs = 5000;
let rackId = null;
let point = null;
function fetchListRack() {
  if (flrReady != null) {
    clearTimeout(flrReady);
  }
  fetch(localStorage.getItem("mni.gatewayUrl") + "/rack", {
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
        flrReady = setTimeout(fetchListRack, retryMs);
      }
    })
    .then((data) => {
      let rackIds =
        "<option disabled value='-1' selected='selected'> -- select a rack -- </option>";
      for (var i = 0; i < data.length; i++) {
        rackIds += "<option value='" + data[i] + "' >" + data[i] + "</option>";
      }
      document.getElementById("rackId").innerHTML = rackIds;
    })
    .catch((e) => {
      console.error(e);
      flrReady = setTimeout(fetchListRack, retryMs);
    });
}
function fetchRack() {
  if (frReady != null) {
    clearTimeout(flrReady);
  }
  let r = document.getElementById("rackId");
  rackId = r.options[r.selectedIndex].value;
  let p = document.getElementById("rackPoint");
  point = p.options[p.selectedIndex].value;
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("mni.gatewayUrl") +
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
      } else {
        flrReady = setTimeout(fetchRack, retryMs);
      }
    })
    .then((data) => {
      let rackSlots = data.slots;
      let slotUsed = 0;
      let slotFree = 0;
      let slotReserved = 0;
      let slotFaulty = 0;
      let slotPredicted = 0;
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
          case "predicted":
            cell.setAttribute(
              "title",
              rackSlots - j + ": " + slotUsage[j].usage
            );
            if (source == "predicted") {
              cell.setAttribute("class", "predictedSlotPredicted");
            } else {
              cell.setAttribute("class", "slotPredicted");
            }
            slotPredicted = slotPredicted + 1;
            break;
        }
        cell.classList.add("cell");
        grid.appendChild(cell);
        let cellHTML = "";
        switch (slotUsage[j].usage) {
          case "used":
            if (slotUsage[j].neId != null) {
              cellHTML =
                "&emsp;" +
                (rackSlots - j) +
                ' <a href="<%=payload.rootUrl%>/ne/' +
                slotUsage[j].neId +
                '" target="_self">+</a>&emsp;' +
                slotUsage[j].host;
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
        "<small><b>Reference</b>:&emsp;" +
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
        "X,Y,Z:&emsp;&emsp;" +
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
        "<br>" +
        "<br><b>Usage Summary:</b><br>" +
        "Free:&emsp;&emsp;&emsp;&emsp;" +
        slotFree +
        "<br>" +
        "Used:&emsp;&emsp;&emsp;&emsp;" +
        slotUsed +
        "<br>" +
        "Reserved:&emsp;&emsp;" +
        slotReserved +
        "<br>" +
        "Faulty:&emsp;&emsp;&emsp;" +
        slotFaulty +
        "<br>" +
        "Predicted:&emsp;&emsp;" +
        slotPredicted +
        "</small>";
      document.getElementById("metadataPanel").innerHTML = metadata;
    })
    .catch((e) => {
      console.error(e);
      frReady = setTimeout(fetchRack, retryMs);
    });
}
function fetchRackPoints() {
  if (frpReady != null) {
    clearTimeout(frpReady);
  }
  let r = document.getElementById("rackId");
  rackId = r.options[r.selectedIndex].value;
  if (rackId != "-1") {
    fetch(localStorage.getItem("mni.gatewayUrl") + "/rack/timeline/" + rackId, {
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
          frpReady = setTimeout(fetchRackPoints, retryMs);
        }
      })
      .then((data) => {
        let rackPoints =
          "<option disabled value='-1' selected='selected'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          rackPoints +=
            "<option value='" +
            data[i].point +
            "' >" +
            data[i].point +
            "</option>";
        }
        document.getElementById("rackPoint").innerHTML = rackPoints;
      })
      .catch((e) => {
        console.error(e);
        frpReady = setTimeout(fetchRackPoints, retryMs);
      });
  }
}
try {
  fetchListRack();
} catch (e) {
  console.error(e);
  flrReady = setTimeout(fetchListRack, retryMs);
}
