//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Workflow
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
let retryMs = 1000;
let refreshMs = 300000;
let fpReady = null;
let dpReady = null;
let spReady = null;
let fplReady = null;
function firstProvider() {
  let p = document.getElementById("provider");
  let i = p.selectedIndex;
  let l = p.length;
  if (l > 1) {
    p.selectedIndex = 1;
    fetchProvider();
    document.getElementById("meter").setAttribute("value", 1);
  }
}
function previousProvider() {
  let p = document.getElementById("provider");
  let i = p.selectedIndex;
  let l = p.length - 1;
  if (i >= 2) {
    p.selectedIndex = i - 1;
    fetchProvider();
    document.getElementById("meter").setAttribute("value", i - 1);
  }
}
function nextProvider() {
  let p = document.getElementById("provider");
  let i = p.selectedIndex;
  let l = p.length - 1;
  if (i < l) {
    p.selectedIndex = i + 1;
    fetchProvider();
    document.getElementById("meter").setAttribute("value", i + 1);
  }
}
function lastProvider() {
  let p = document.getElementById("provider");
  let i = p.selectedIndex;
  let l = p.length - 1;
  if (i < l && l > 1) {
    p.selectedIndex = l;
    fetchProvider();
    document.getElementById("meter").setAttribute("value", l);
  }
}
function deleteProvider() {
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (id != null && id != "-1") {
    fetch(
      localStorage.getItem("mni.gatewayUrl") + "/admin/workflow/engine/" + id,
      {
        method: "DELETE",
        keepalive: true,
      }
    )
      .then((response) => {
        if (response.ok) {
          previousProvider();
          fetchProviderList();
        } else {
          window.alert(`Failed to delete provider ${id}`);
        }
      })
      .catch((e) => {notify(e);});
  }
}
function redisplayProvider() {
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (id == "-1") {
    clearProvider();
  } else {
    fetchProvider();
  }
}
function newProvider() {
  document.getElementById("provider").value = "-1";
  clearProvider();
}
function saveProvider() {
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (document.getElementById("engineName").value.length > 0) {
    if (document.getElementById("engineUrl").value.length > 0) {
      let eType = document.getElementById("engineType");
      let engineType = eType.options[eType.selectedIndex].value;
      if (engineType != "-1") {
        if (id == "-1") {
          // new provider
          //
          let reqJson = {
            name: document.getElementById("engineName").value,
            engine: {
              url: document.getElementById("engineUrl").value,
              username: document.getElementById("engineUsername").value,
              password: document.getElementById("enginePassword").value,
              type: engineType,
            },
          };
          fetch(
            localStorage.getItem("mni.gatewayUrl") + "/admin/workflow/engine",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(reqJson),
              keepalive: true,
            }
          )
            .then((response) => {
              if (response.ok) {
                fetchProviderList();
                lastProvider();
              }
            })
            .catch((e) => {
              window.alert(e);
            });
        } else {
          // existing provider
          let reqJson = {
            workflowEngineId: id,
            name: document.getElementById("engineName").value,
            engine: {
              url: document.getElementById("engineUrl").value,
              username: document.getElementById("engineUsername").value,
              password: document.getElementById("enginePassword").value,
              type: engineType,
            },
          };
          fetch(
            localStorage.getItem("mni.gatewayUrl") +
              "/admin/workflow/engine/" +
              id,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(reqJson),
              keepalive: true,
            }
          )
            .then((response) => {
              if (!response.ok) {
                window.alert(`Failed to update provider ${id}`);
              }
            })
            .catch((e) => {
              window.alert(e);
            });
        }
      } else {
        window.alert("engine type must be specified");
      }
    } else {
      window.alert("engine URL must be specified");
    }
  } else {
    window.alert("name must be specified");
  }
}
function clearProvider() {
  document.getElementById("engineName").value = "";
  document.getElementById("engineUsername").value = "";
  document.getElementById("enginePassword").value = "";
  document.getElementById("engineUrl").value = "";
  document.getElementById("engineType").value = "-1";
}
function displayProvider(d) {
  clearProvider();
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (d !== undefined && d != null) {
    document.getElementById("engineName").value = d.name;
    document.getElementById("engineUsername").value = d.engine.username;
    document.getElementById("enginePassword").value = d.engine.password;
    document.getElementById("engineUrl").value = d.engine.url;
    document.getElementById("engineType").value = d.engine.type;
  }
}
function fetchProvider() {
  if (fpReady != null) {
    clearTimeout(fpReady);
  }
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (id != null) {
    fetch(
      localStorage.getItem("mni.gatewayUrl") + "/admin/workflow/engine/" + id,
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
          //fpReady = setTimeout(fetchProvider, retryMs);
        //}
      })
      .then((data) => {
        displayProvider(data);
      })
      .catch((e) => {
        notify(e);
        //fpReady = setTimeout(fetchProvider, retryMs);
      });
  } //else {
    //fpReady = setTimeout(fetchProvider, retryMs);
  //}
}
function fetchProviderList() {
  if (fplReady != null) {
    clearTimeout(fplReady);
  }

  fetch(localStorage.getItem("mni.gatewayUrl") + "/admin/workflow/engine", {
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
        //fplReady = setTimeout(fetchProviderList, retryMs);
      //}
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
      document.getElementById("provider").innerHTML = Ids;
      if (data.length > 0) {
        document.getElementById("meter").setAttribute("min", 1);
        document.getElementById("meter").setAttribute("value", 1);
      } else {
        document.getElementById("meter").setAttribute("value", 0);
        document.getElementById("meter").setAttribute("min", 0);
      }
      document.getElementById("meter").setAttribute("max", data.length);
      fetchProvider();
    })
    .catch((e) => {
      notify(e);
      //fplReady = setTimeout(fetchProviderList, retryMs);
    });
}
try {
  fetchProviderList();
} catch (e) {
  notify(e);
  //fplReady = setTimeout(fetchProviderList, retryMs);
}
