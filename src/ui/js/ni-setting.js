//=====================================================================
// Network Insight (NI) - JavaScript: Setting
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
function resetMinMax(w) {
  let u = document.getElementById(w + "Unit");
  let v = u.options[u.selectedIndex].value;
  let d = document.getElementById(w + "Duration");
  switch (v) {
    case "day":
      d.setAttribute("min", "1");
      d.setAttribute("max", "31");
      break;
    case "week":
      d.setAttribute("min", "1");
      d.setAttribute("max", "52");
      break;
    case "month":
      d.setAttribute("min", "1");
      d.setAttribute("max", "12");
      break;
    case "quarter":
      d.setAttribute("min", "1");
      d.setAttribute("max", "4");
      break;
    case "year":
      d.setAttribute("min", "1");
      d.setAttribute("max", "10");
      break;
    default:
      u.setAttribute("min", "1");
      u.setAttribute("max", "99");
  }
}
function saveAdminData() {
  let a = document.getElementById("historicalDuration");
  let b = document.getElementById("historicalUnit");
  let c = document.getElementById("predictedDuration");
  let d = document.getElementById("historicalUnit");
  let hD = a.value;
  let hU = b.options[b.selectedIndex].value;
  let pD = c.value;
  let pU = d.options[d.selectedIndex].value;
  let reqJson = {
    historical: {
      duration: toInteger(hD),
      unit: hU,
    },
    predicted: {
      duration: toInteger(pD),
      unit: pU,
    },
  };
  fetch(localStorage.getItem("ni.gatewayUrl") + "/admin/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqJson),
    keepalive: true,
  }).catch((e) => {
    console.error(e);
  });
}
function fetchAdminData() {
  fetch(localStorage.getItem("ni.gatewayUrl") + "/admin/data", {
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
      let hD = 3;
      let hU = "month";
      let pD = 1;
      let pU = "week";
      if (data.historical?.duration != null) {
        hD = data.historical.duration;
      }
      if (data.historical?.unit != null) {
        hU = data.historical.unit;
      }
      if (data.predicted?.duration != null) {
        pD = data.predicted.duration;
      }
      if (data.predicted?.unit != null) {
        pU = data.predicted.unit;
      }
      document.getElementById("historicalDuration").value = hD;
      document.getElementById("historicalUnit").value = hU;
      document.getElementById("predictedDuration").value = pD;
      document.getElementById("predictedUnit").value = pU;
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  resetMinMax("historical");
  resetMinMax("predicted");
  fetchAdminData();
} catch (e) {
  console.error(e);
}
