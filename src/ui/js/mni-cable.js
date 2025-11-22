//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Cable
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
let cableId = null;
let cableRawPoints = [];
let point = null;
function fetchListCable() {
  fetch(
    localStorage.getItem("mni.gatewayUrl") +
      "/cable?country=" +
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
      let suppliedCableId = window.location.pathname.replace(
        localStorage.getItem("mni.rootUrl") + "/cable/",
        ""
      );
      let cableIds =
        "<option disabled value='-1' selected='selected'> -- select a cable -- </option>";
      if (suppliedCableId != null) {
        trenchIds =
          "<option disabled value='-1'> -- select a cable -- </option>";
      }
      for (var i = 0; i < data.length; i++) {
        if (suppliedCableId == data[i]) {
          cableIds +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          cableIds +=
            "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("cableId").innerHTML = cableIds;
      if (suppliedCableId != null) {
        fetchCablePoints();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchCable(cableId, point = null) {
  if (cableId == null) {
    let r = document.getElementById("cableId");
    cableId = r.options[r.selectedIndex].value;
  }
  if (point == null) {
    let p = document.getElementById("cablePoint");
    point = p.options[p.selectedIndex].value;
  }
  let grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  fetch(
    localStorage.getItem("mni.gatewayUrl") +
      "/cable/" +
      cableId +
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
      if (data.configuration != null) {
        let cableOuter = 0;
        let cableInner = 1;
        let cableGridMaxOuter = 36;
        let cableGridMaxInner = 48;
        let cableGridColumns = 24;
        let cableUsed = 0;
        let cableFree = 0;
        let cableReserved = 0;
        let cableFaulty = 0;
        let c = document.getElementById("country");
        let selectedCountry = c.options[c.selectedIndex].value;
        let source = "historical";
        if (data.source != null) {
          source = data.source;
        }
        switch (data.technology) {
          case "coax":
            cableOuter = 1;
            cableInner = 1;
            break;
          case "copper":
            cableOuter = 1;
            cableInner = 1;
            break;
          case "ethernet":
            cableOuter = 1;
            cableInner = 1;
            break;
          case "singleFiber":
            cableOuter = 1;
            cableInner = data.configuration.strands;
            break;
          case "multiFiber":
            cableOuter = data.configuration.ribbons;
            cableInner = data.configuration.strands;
            break;
        }
        if (cableInner > cableGridMaxInner) {
          cableGridColumns = Math.max(
            Math.ceil(cableInner / cableGridMaxInner),
            cableGridMaxInner
          );
        }

        grid.style.setProperty("--max-cable-rows", cableGridMaxInner);
        grid.style.setProperty("--max-cable-columns", cableGridColumns);

        for (let o = 0; o < cableOuter; o++) {
          for (let j = 0; j < cableInner; j++) {
            let cell = document.createElement("div");
            cell.setAttribute("id", "cable" + o + "-" + j);
            switch (data.technology) {
              case "coax":
                cell.setAttribute("title", data.configuration.state);
                switch (data.configuration.state) {
                  case "free":
                    cell.setAttribute("title", data.configuration.state);
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFree");
                    } else {
                      cell.setAttribute("class", "cableFree");
                    }
                    cableFree = cableFree + 1;
                    break;
                  case "used":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableUsed");
                    } else {
                      cell.setAttribute("class", "cableUsed");
                    }
                    cableUsed = cableUsed + 1;
                    break;
                  case "reserved":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableReserved");
                    } else {
                      cell.setAttribute("class", "cableReserved");
                    }
                    cableReserved = cableReserved + 1;
                    break;
                  case "faulty":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFaulty");
                    } else {
                      cell.setAttribute("class", "cableFaulty");
                    }
                    cableFaulty = cableFaulty + 1;
                    break;
                }
                break;
              case "copper":
                cell.setAttribute("title", data.configuration.state);
                switch (data.configuration.state) {
                  case "free":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFree");
                    } else {
                      cell.setAttribute("class", "cableFree");
                    }
                    cableFree = cableFree + 1;
                    break;
                  case "used":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableUsed");
                    } else {
                      cell.setAttribute("class", "cableUsed");
                    }
                    cableUsed = cableUsed + 1;
                    break;
                  case "reserved":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableReserved");
                    } else {
                      cell.setAttribute("class", "cableReserved");
                    }
                    cableReserved = cableReserved + 1;
                    break;
                  case "faulty":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFaulty");
                    } else {
                      cell.setAttribute("class", "cableFaulty");
                    }
                    cableFaulty = cableFaulty + 1;
                    break;
                }
                break;
              case "ethernet":
                cell.setAttribute("title", data.configuration.state);
                switch (data.configuration.state) {
                  case "free":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFree");
                    } else {
                      cell.setAttribute("class", "cableFree");
                    }
                    cableFree = cableFree + 1;
                    break;
                  case "used":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableUsed");
                    } else {
                      cell.setAttribute("class", "cableUsed");
                    }
                    cableUsed = cableUsed + 1;
                    break;
                  case "reserved":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableReserved");
                    } else {
                      cell.setAttribute("class", "cableReserved");
                    }
                    cableReserved = cableReserved + 1;
                    break;
                  case "faulty":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFaulty");
                    } else {
                      cell.setAttribute("class", "cableFaulty");
                    }
                    cableFaulty = cableFaulty + 1;
                    break;
                }
                break;
              case "singleFiber":
                cell.setAttribute(
                  "title",
                  data.configuration.states[j].strand +
                    " " +
                    data.configuration.states[j].state
                );
                switch (data.configuration.states[j].state) {
                  case "free":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFree");
                    } else {
                      cell.setAttribute("class", "cableFree");
                    }
                    cableFree = cableFree + 1;
                    break;
                  case "used":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableUsed");
                    } else {
                      cell.setAttribute("class", "cableUsed");
                    }
                    cableUsed = cableUsed + 1;
                    break;
                  case "reserved":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableReserved");
                    } else {
                      cell.setAttribute("class", "cableReserved");
                    }
                    cableReserved = cableReserved + 1;
                    break;
                  case "faulty":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFaulty");
                    } else {
                      cell.setAttribute("class", "cableFaulty");
                    }
                    cableFaulty = cableFaulty + 1;
                    break;
                }
                break;
              case "multiFiber":
                cell.setAttribute(
                  "title",
                  o +
                    1 +
                    "." +
                    (j + 1) +
                    " " +
                    data.configuration.states[j].state
                );
                switch (data.configuration.states[j].state) {
                  case "free":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFree");
                    } else {
                      cell.setAttribute("class", "cableFree");
                    }
                    cableFree = cableFree + 1;
                    break;
                  case "used":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableUsed");
                    } else {
                      cell.setAttribute("class", "cableUsed");
                    }
                    cableUsed = cableUsed + 1;
                    break;
                  case "reserved":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableReserved");
                    } else {
                      cell.setAttribute("class", "cableReserved");
                    }
                    cableReserved = cableReserved + 1;
                    break;
                  case "faulty":
                    if (source == "predicted") {
                      cell.setAttribute("class", "predictedCableFaulty");
                    } else {
                      cell.setAttribute("class", "cableFaulty");
                    }
                    cableFaulty = cableFaulty + 1;
                    break;
                }
                break;
            }

            cell.classList.add("cell");
            grid.appendChild(cell);
            // <i class="fa fa-check"></i> or &#10003;
            // <i class="fa fa fa-exclamation"></i> or &#x26A0;
            // <i class="fa fa-times"></i> or &#10060;
            switch (data.technology) {
              case "coax":
                document.getElementById("cable" + o + "-" + j).innerHTML =
                  "<br>" + (j + 1);
                break;
              case "copper":
                document.getElementById("cable" + o + "-" + j).innerHTML =
                  "<br>" + (j + 1);
                break;
              case "ethernet":
                document.getElementById("cable" + o + "-" + j).innerHTML =
                  "<br>" + (j + 1);
                break;
              case "singleFiber":
                document.getElementById("cable" + o + "-" + j).innerHTML =
                  "<br>" + (j + 1);
                break;
              case "multiFiber":
                document.getElementById("cable" + o + "-" + j).innerHTML =
                  "<br>" + (o + 1) + "." + (j + 1);
                break;
            }
          }
        }
        let metadata =
          "<b>Reference:</b>&emsp;" +
          data.reference +
          "</b>&emsp;( " +
          cableId +
          " )<br>&emsp;Source:&emsp;" +
          data.source +
          "<br>";
        switch (data.technology) {
          case "coax":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Coax<br>" +
              "&emsp;Frequency Range:&emsp;" +
              data.configuration.frequencyRange.low +
              data.configuration.unit +
              " to " +
              data.configuration.frequencyRange.high +
              data.configuration.unit +
              "<br>" +
              "&emsp;Channels:&emsp;" +
              data.configuration.channels +
              " of " +
              data.configuration.width +
              data.configuration.unit +
              "<br>";
            break;
          case "copper":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Copper<br>" +
              "&emsp;Twisted Pairs:&emsp;" +
              data.configuration.twistedPairs +
              "<br>";
            break;
          case "ethernet":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Ethernet<br>" +
              "&emsp;Category:&emsp;" +
              data.configuration.category +
              "<br>" +
              "&emsp;Transmission:&emsp;" +
              data.configuration.rate +
              data.configuration.unit +
              "<br>";
            break;
          case "singleFiber":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Single-Fiber<br>" +
              "&emsp;Strands:&emsp;" +
              data.configuration.strands +
              "<br>" +
              "&emsp;Mode:&emsp;" +
              data.configuration.mode +
              "<br>" +
              "&emsp;Transmission:&emsp;" +
              data.configuration.rate +
              data.configuration.unit +
              " per strand<br>";
            break;
          case "multiFiber":
            metadata =
              metadata +
              "<br><b>Technology</b>:<br>&emsp;Type:&emsp;Multi-Fiber<br>" +
              "&emsp;Ribbons.Strands:&emsp;" +
              data.configuration.ribbons +
              "." +
              data.configuration.strands +
              "<br>" +
              "&emsp;Mode:&emsp;" +
              data.configuration.mode +
              "<br>" +
              "&emsp;Transmission:&emsp;" +
              data.configuration.rate +
              data.configuration.unit +
              " per strand<br>";
            break;
        }
        metadata = metadata + "<br><b>Location</b>:<br>";
        if (data.ductId != null) {
          metadata =
            metadata +
            "&emsp;Duct:&emsp;" +
            '<a href="' +
            localStorage.getItem("mni.rootUrl") +
            "/duct/" +
            data.ductId +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.ductId +
            "</a><br>";
        }
        if (data.poleId != null) {
          metadata =
            metadata +
            "&emsp;Pole:&emsp;" +
            '<a href="' +
            localStorage.getItem("mni.rootUrl") +
            "/pole/" +
            data.poleId +
            "?country=" +
            selectedCountry +
            '" target="_self">' +
            data.poleId +
            "</a><br>";
        }
        metadata =
          metadata +
          "<br><b>Usage Summary:</b><br>" +
          '<div class="stateusage-key">' +
          '<div id="stateusage-faulty" class="stateusage">Faulty: ' +
          cableFaulty +
          "</div>" +
          '<div id="stateusage-reserved" class="stateusage">Reserved: ' +
          cableReserved +
          "</div>" +
          '<div id="stateusage-used" class="stateusage">Used: ' +
          cableUsed +
          "</div>" +
          '<div id="stateusage-free" class="stateusage">Free: ' +
          cableFree +
          "</div></div>";
        document.getElementById("metadataPanel").innerHTML = metadata;
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function fetchCablePoints() {
  let r = document.getElementById("cableId");
  cableId = r.options[r.selectedIndex].value;
  if (cableId != "-1") {
    fetch(
      localStorage.getItem("mni.gatewayUrl") + "/cable/timeline/" + cableId,
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
        cableRawPoints = [];
        let cablePoints =
          "<option disabled value='-1'> -- select a date/time -- </option>";
        for (var i = 0; i < data.length; i++) {
          if (i == 0) {
            cablePoints +=
              "<option selected='selected' value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          } else {
            cablePoints +=
              "<option value='" +
              data[i].point +
              "' >" +
              data[i].point +
              "</option>";
          }
          cableRawPoints.push(data[i].point);
        }
        document.getElementById("cablePoint").innerHTML = cablePoints;
          fetchCable();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
try {
  countryListPopulate(fetchListCable);
} catch (e) {
  console.error(e);
}
