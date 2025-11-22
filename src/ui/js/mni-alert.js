//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Alert
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//let chartAlert = null;
let availableAlert = 0;
let activeCallback = 0;
let activePublish = 0;
let activeNotify = 0;
let activeWorkflow = 0;
function fetchStats() {
  fetch(localStorage.getItem("mni.gatewayUrl") + "/ui/statistic", {
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
      if (data.alerts != null) {
        if (data.alerts?.available != null) {
          availableAlert = toInteger(data.alerts.available);
        }
        if (data.alerts?.active?.callbacks != null) {
          activeCallback = toInteger(data.alerts.active.callbacks);
        }
        if (data.alerts?.active?.publish != null) {
          activePublish = toInteger(data.alerts.active.publish);
        }
        if (data.alerts?.active?.notify != null) {
          activeNotify = toInteger(data.alerts.active.notify);
        }
        if (data.alerts?.active?.workflow != null) {
          activeWorkflow = toInteger(data.alerts.active.workflow);
        }
      }
      Chart.defaults.font.family = "Lato";
      if (chartAlert != null) {
        chartAlert.data.datasets[0].data[0] = availableAlert;
        chartAlert.data.datasets[1].data[1] = activeCallback;
        chartAlert.data.datasets[1].data[2] = activePublish;
        chartAlert.data.datasets[1].data[3] = activeNotify;
        chartAlert.data.datasets[1].data[4] = activeWorkflow;
        chartAlert.update();
      } else {
        chartAlert = new Chart("alertSummary", {
          type: "bar",
          options: {
            indexAxis: "y",
            responsive: true,
            scales: {
              x: {
                display: false,
                stacked: true,
                grid: {
                  display: false,
                },
                scales: {
                  x: {
                    display: false,
                  },
                },
              },
              y: {
                stacked: true,
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
          data: {
            labels: [
              "Available",
              ["Active", "Callbacks"],
              ["Active", "Publish"],
              ["Active", "Notify"],
              ["Active", "Workflows"],
            ],
            datasets: [
              {
                data: [availableAlert, 0, 0, 0, 0],
                backgroundColor: "rgba(0,128,0,1)",
                hoverBackgroundColor: "rgba(10,99,10,1)",
              },
              {
                data: [
                  0,
                  activeCallback,
                  activePublish,
                  activeNotify,
                  activeWorkflow,
                ],
                backgroundColor: "rgba(54, 162, 235,1)",
                hoverBackgroundColor: "rgba(26, 122, 186,1)",
              },
            ],
          },
        });
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
function firstMasterAlert() {
  let p = document.getElementById("alert");
  let i = p.selectedIndex;
  let l = p.length;
  if (l > 1) {
    p.selectedIndex = 1;
    fetchMasterAlert();
    document.getElementById("meter").setAttribute("value", 1);
  }
}
function previousMasterAlert() {
  let p = document.getElementById("alert");
  let i = p.selectedIndex;
  let l = p.length - 1;
  if (i >= 2) {
    p.selectedIndex = i - 1;
    fetchMasterAlert();
    document.getElementById("meter").setAttribute("value", i - 1);
  }
}
function nextMasterAlert() {
  let p = document.getElementById("alert");
  let i = p.selectedIndex;
  let l = p.length - 1;
  if (i < l) {
    p.selectedIndex = i + 1;
    fetchMasterAlert();
    document.getElementById("meter").setAttribute("value", i + 1);
  }
}
function lastMasterAlert() {
  let p = document.getElementById("alert");
  let i = p.selectedIndex;
  let l = p.length - 1;
  if (i < l && l > 1) {
    p.selectedIndex = l;
    fetchMasterAlert();
    document.getElementById("meter").setAttribute("value", l);
  }
}
function updateMasterAlert() {
  let p = document.getElementById("alert");
  let id = p.options[p.selectedIndex].value;
}
function deleteMasterAlert() {
  let p = document.getElementById("alert");
  let id = p.options[p.selectedIndex].value;
  if (id != null && id != "-1") {
    fetch(localStorage.getItem("mni.gatewayUrl") + "/alert/" + id, {
      method: "DELETE",
      keepalive: true,
    })
      .then((response) => {
        if (response.ok) {
          notify("Deleted");
          previousMasterAlert();
          fetchMasterAlertList();
        } else {
          notify("Failed to delete provider");
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
function redisplayMasterAlert() {
  let p = document.getElementById("alert");
  let id = p.options[p.selectedIndex].value;
  if (id == "-1") {
    clearMasterAlert();
  } else {
    fetchMasterAlert();
  }
}
function newMasterAlert() {
  document.getElementById("alert").value = "-1";
  clearMasterAlert();
}
function saveMasterAlert() {
  let p = document.getElementById("alert");
  let id = p.options[p.selectedIndex].value;
  if (
    document.getElementById("alertDescription").value.length > 0 &&
    document.getElementById("alertFunction").value.length > 0
  ) {
    if (id == "-1") {
      let reqJson = null;
      reqJson = {
        description: document.getElementById("alertDescription").value,
        function: document.getElementById("alertFunction").value,
      };
      fetch(localStorage.getItem("mni.gatewayUrl") + "/alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(reqJson),
        keepalive: true,
      })
        .then((response) => {
          if (response.ok) {
            notify("Saved");
            return response.json();
          }
        })
        .then((data) => {
          fetchMasterAlertList();
          lastMasterAlert();
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      let reqJson = null;
      reqJson = {
        description: document.getElementById("alertDescription").value,
        function: document.getElementById("alertFunction").value,
      };
      fetch(localStorage.getItem("mni.gatewayUrl") + "/alert/" + id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqJson),
        keepalive: true,
      })
        .then((response) => {
          if (response.ok) {
            notify("Updated");
          } else {
            notify("Failed to save change");
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  } else {
    notify("description must be supplied");
  }
}
function clearMasterAlert() {
  document.getElementById("alertDescription").value = "";
  document.getElementById("alertFunction").value = "";
}
function displayMasterAlert(d) {
  clearMasterAlert();
  let p = document.getElementById("alert");
  let id = p.options[p.selectedIndex].value;
  if (d !== undefined && d != null) {
    document.getElementById("alertDescription").value = d.description;
    document.getElementById("alertFunction").value = d.function;
  }
}
function fetchMasterAlert() {
  let p = document.getElementById("alert");
  let id = p.options[p.selectedIndex].value;
  if (id != null && id != "-1") {
    fetch(localStorage.getItem("mni.gatewayUrl") + "/alert/" + id, {
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
        displayMasterAlert(data);
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
function fetchMasterAlertList() {
  fetch(localStorage.getItem("mni.gatewayUrl") + "/alert", {
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
      let Ids =
        "<option disabled value='-1' selected='selected'> -- new provider -- </option>";
      for (var i = 0; i < data.length; i++) {
        if (i == 0) {
          Ids +=
            "<option value='" +
            data[i] +
            "' selected='selected'>" +
            data[i] +
            "</option>";
        } else {
          Ids += "<option value='" + data[i] + "' >" + data[i] + "</option>";
        }
      }
      document.getElementById("alert").innerHTML = Ids;
      if (data.length > 0) {
        document.getElementById("meter").setAttribute("min", 1);
        document.getElementById("meter").setAttribute("value", 1);
      } else {
        document.getElementById("meter").setAttribute("value", 0);
        document.getElementById("meter").setAttribute("min", 0);
      }
      document.getElementById("meter").setAttribute("max", data.length);
      fetchMasterAlert();
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  fetchMasterAlertList();
  fetchStats();
} catch (e) {
  console.error(e);
}
