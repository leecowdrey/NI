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
      localStorage.getItem("mni.gatewayUrl") + "/admin/email/provider/" + id,
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
  let vendor = document.getElementById("vendor").value;
  if (vendor != null) {
    if (document.getElementById("address").value.length > 0) {
      if (document.getElementById("sendUsername").value.length > 0) {
        if (document.getElementById("sendPassword").value.length > 0) {
          if (document.getElementById("sendHost").value.length > 0) {
            if (document.getElementById("sendHost").value.length > 0) {
              if (document.getElementById("sendAuthentication").value != "-1") {
                let reqJson = null;
                if (
                  document.getElementById("sendUsername").value.length > 0 &&
                  document.getElementById("receiveUsername").value.length > 0
                ) {
                  let txP = document.getElementById("sendProtocol");
                  let txProtocol = txP.options[txP.selectedIndex].value;
                  let txA = document.getElementById("sendAuthentication");
                  let txAuthentication = txA.options[txA.selectedIndex].value;
                  let rxP = document.getElementById("receiveProtocol");
                  let rxProtocol = rxP.options[rxP.selectedIndex].value;
                  reqJson = {
                    vendor: vendor,
                    address: document.getElementById("address").value,
                    name: document.getElementById("name").value,
                    send: {
                      username: document.getElementById("sendUsername").value,
                      password: document.getElementById("sendPassword").value,
                      host: document.getElementById("sendHost").value,
                      port: toInteger(
                        document.getElementById("sendPort").value
                      ),
                      protocol: txProtocol,
                      authentication: txAuthentication,
                      encryption: {
                        enabled: document.getElementById(
                          "sendEncryptionEnabled"
                        ).checked,
                        starttls: document.getElementById(
                          "sendEncryptionStartTls"
                        ).checked,
                      },
                    },
                    receive: {
                      username:
                        document.getElementById("receiveUsername").value,
                      password:
                        document.getElementById("receivePassword").value,
                      host: document.getElementById("receiveHost").value,
                      port: toInteger(
                        document.getElementById("receivePort").value
                      ),
                      protocol: rxProtocol,
                      encryption: {
                        enabled: document.getElementById(
                          "receiveEncryptionEnabled"
                        ).checked,
                        starttls: document.getElementById(
                          "receiveEncryptionStartTls"
                        ).checked,
                      },
                      rootFolder:
                        document.getElementById("receiveRootFolder").value,
                      folderSeparator: document.getElementById(
                        "receiveFolderSeparator"
                      ).value,
                    },
                  };
                } else if (
                  document.getElementById("sendUsername").value.length > 0 &&
                  document.getElementById("receiveUsername").value.length == 0
                ) {
                  let txP = document.getElementById("sendProtocol");
                  let txProtocol = txP.options[txP.selectedIndex].value;
                  let txA = document.getElementById("sendAuthentication");
                  let txAuthentication = txA.options[txA.selectedIndex].value;
                  reqJson = {
                    vendor: vendor,
                    address: document.getElementById("address").value,
                    name: document.getElementById("name").value,
                    send: {
                      username: document.getElementById("sendUsername").value,
                      password: document.getElementById("sendPassword").value,
                      host: document.getElementById("sendHost").value,
                      port: toInteger(
                        document.getElementById("sendPort").value
                      ),
                      protocol: txProtocol,
                      authentication: txAuthentication,
                      encryption: {
                        enabled: document.getElementById(
                          "sendEncryptionEnabled"
                        ).checked,
                        starttls: document.getElementById(
                          "sendEncryptionStartTls"
                        ).checked,
                      },
                    },
                  };
                }
                if (id == "-1") {
                  // new provider
                  //
                  fetch(
                    localStorage.getItem("mni.gatewayUrl") +
                      "/admin/email/provider",
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
                  //
                  reqJson.emailProviderId = id;
                  fetch(
                    localStorage.getItem("mni.gatewayUrl") +
                      "/admin/email/provider/" +
                      id,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
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
              }
            } else {
              window.alert("Sending authentication scheme must be specified");
            }
          } else {
            window.alert("Sending host must be specified");
          }
        } else {
          window.alert("Sending password must be specified");
        }
      } else {
        window.alert("Sending username must be specified");
      }
    } else {
      window.alert("Address must be specified");
    }
  } else {
    window.alert("Vendor must be specified");
  }
}
function clearProvider() {
  document.getElementById("vendor").value = "";
  document.getElementById("address").value = "";
  document.getElementById("name").value = "";
  document.getElementById("sendUsername").value = "";
  document.getElementById("sendPassword").value = "";
  document.getElementById("sendHost").value = "";
  document.getElementById("sendPort").value = "465";
  document.getElementById("sendProtocol").value = "-1";
  document.getElementById("sendAuthentication").value = "-1";
  document.getElementById("sendEncryptionEnabled").checked = true;
  document.getElementById("receiveUsername").value = "";
  document.getElementById("receivePassword").value = "";
  document.getElementById("receivePort").value = "993";
  document.getElementById("receiveProtocol").value = "-1";
  document.getElementById("receiveRootFolder").value = "";
  document.getElementById("receiveFolderSeparator").value = "/";
  document.getElementById("send").style.display = "block";
  document.getElementById("receive").style.display = "block";
}
function displayProvider(d) {
  clearProvider();
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (d !== undefined && d != null) {
    document.getElementById("vendor").value = d.vendor;
    document.getElementById("address").value = d.address;
    document.getElementById("name").value = d.name;
    if (d?.send != null) {
      document.getElementById("send").style.display = "block";
      document.getElementById("sendUsername").value = d.send.username;
      document.getElementById("sendPassword").value = d.send.password;
      document.getElementById("sendHost").value = d.send.host;
      document.getElementById("sendPort").value = d.send.port;
      document.getElementById("sendProtocol").value = d.send.protocol;
      document.getElementById("sendAuthentication").value =
        d.send.authentication;
      document.getElementById("sendEncryptionEnabled").value =
        d.send.encryption.enabled;
      document.getElementById("sendEncryptionStartTls").value =
        d.send.encryption.starttls;
    } else {
      document.getElementById("send").style.display = "none";
    }
    if (d?.receive != null) {
      document.getElementById("receive").style.display = "block";
      document.getElementById("receiveUsername").value = d.receive.username;
      document.getElementById("receivePassword").value = d.receive.password;
      document.getElementById("receiveHost").value = d.receive.host;
      document.getElementById("receivePort").value = d.receive.port;
      document.getElementById("receiveProtocol").value = d.receive.protocol;
      document.getElementById("receiveEncryptionEnabled").value =
        d.receive.encryption.enabled;
      document.getElementById("receiveEncryptionStartTls").value =
        d.receive.encryption.starttls;
      document.getElementById("receiveRootFolder").value = d.receive.rootFolder;
      document.getElementById("receiveFolderSeparator").value =
        d.receive.folderSeparator;
    } else {
      document.getElementById("receive").style.display = "none";
    }
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
      localStorage.getItem("mni.gatewayUrl") + "/admin/email/provider/" + id,
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

  fetch(localStorage.getItem("mni.gatewayUrl") + "/admin/email/provider", {
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
