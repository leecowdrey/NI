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
      localStorage.getItem("mni.gatewayUrl") + "/admin/kafka/broker/" + id,
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
      .catch((e) => {});
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
  if (document.getElementById("brokerName").value.length > 0) {
    if (document.getElementById("clientId").value.length > 0) {
      if (document.getElementById("producerHost").value.length > 0) {
        if (document.getElementById("producerPort").value.length > 0) {
          let cMethod = document.getElementById("producerAuthenticationMethod");
          let compressionMethod = cMethod.options[cMethod.selectedIndex].value;
          if (compressionMethod != "-1") {
            let aMethod = document.getElementById(
              "producerAuthenticationMethod"
            );
            let authenticationMethod =
              aMethod.options[aMethod.selectedIndex].value;
            if (authenticationMethod != "-1") {
              if (id == "-1") {
                // new provider
                //
                let reqJson = {
                  name: document.getElementById("brokerName").value,
                  clientId: document.getElementById("clientId").value,
                  producer: {
                    username: document.getElementById("producerUsername").value,
                    password: document.getElementById("producerPassword").value,
                    host: document.getElementById("producerHost").value,
                    port: toInteger(
                      document.getElementById("producerPort").value
                    ),
                    retryDelay: toInteger(
                      document.getElementById("producerRetryDelay").value
                    ),
                    retries: toInteger(
                      document.getElementById("producerRetries").value
                    ),
                    acks: document.getElementById("producerAcks").value,
                    linger: toInteger(
                      document.getElementById("producerLinger").value
                    ),
                    batchSize: toInteger(
                      document.getElementById("producerBatchSize").value
                    ),
                    bufferMemory: toInteger(
                      document.getElementById("producerBufferMemory").value
                    ),
                    maxInFlightRequestsPerConnection: toInteger(
                      document.getElementById(
                        "producerMaxInflightRequestsPerConnection"
                      ).value
                    ),
                    compressionMethod: document.getElementById(
                      "producerCompressionMethod"
                    ).value,
                    authentication: document.getElementById(
                      "producerAuthenticationMethod"
                    ).value,
                  },
                };
                fetch(
                  localStorage.getItem("mni.gatewayUrl") +
                    "/admin/kafka/broker",
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
                  kafkaProducerId: id,
                  name: document.getElementById("brokerName").value,
                  clientId: document.getElementById("clientId").value,
                  producer: {
                    username: document.getElementById("producerUsername").value,
                    password: document.getElementById("producerPassword").value,
                    host: document.getElementById("producerHost").value,
                    port: toInteger(
                      document.getElementById("producerPort").value
                    ),
                    retryDelay: toInteger(
                      document.getElementById("producerRetryDelay").value
                    ),
                    retries: toInteger(
                      document.getElementById("producerRetries").value
                    ),
                    acks: document.getElementById("producerAcks").value,
                    linger: toInteger(
                      document.getElementById("producerLinger").value
                    ),
                    batchSize: toInteger(
                      document.getElementById("producerBatchSize").value
                    ),
                    bufferMemory: toInteger(
                      document.getElementById("producerBufferMemory").value
                    ),
                    maxInFlightRequestsPerConnection: toInteger(
                      document.getElementById(
                        "producerMaxInflightRequestsPerConnection"
                      ).value
                    ),
                    compressionMethod: document.getElementById(
                      "producerCompressionMethod"
                    ).value,
                    authentication: document.getElementById(
                      "producerAuthenticationMethod"
                    ).value,
                  },
                };
                fetch(
                  localStorage.getItem("mni.gatewayUrl") +
                    "/admin/kafka/broker/" +
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
              window.alert("authentication method must be specified");
            }
          } else {
            window.alert("compression method must be specified");
          }
        } else {
          window.alert("port must be specified");
        }
      } else {
        window.alert("host must be specified");
      }
    } else {
      window.alert("client identifier must be specified");
    }
  }
}
function clearProvider() {
  document.getElementById("brokerName").value = "";
  document.getElementById("clientId").value = "mni";
  document.getElementById("producerUsername").value = "";
  document.getElementById("producerPassword").value = "";
  document.getElementById("producerHost").value = "";
  document.getElementById("producerPort").value = "9092";
  document.getElementById("producerRetryDelay").value = "10000";
  document.getElementById("producerRetries").value = "2";
  document.getElementById("producerAcks").value = "leader";
  document.getElementById("producerLinger").value = "0";
  document.getElementById("producerBufferMemory").value = "16";
  document.getElementById("producerMaxInflightRequestsPerConnection").value =
    "5";
  document.getElementById("producerCompressionMethod").value = "-1";
  document.getElementById("producerAuthenticationMethod").value = "-1";
}
function displayProvider(d) {
  clearProvider();
  let p = document.getElementById("provider");
  let id = p.options[p.selectedIndex].value;
  if (d !== undefined && d != null) {
    document.getElementById("brokerName").value = d.name;
    document.getElementById("clientId").value = d.clientId;
    document.getElementById("producerUsername").value = d.producer.username;
    document.getElementById("producerUsername").value = d.producer.username;
    document.getElementById("producerPassword").value = d.producer.password;
    document.getElementById("producerHost").value = d.producer.host;
    document.getElementById("producerPort").value = toInteger(d.producer.port);
    document.getElementById("producerRetryDelay").value = toInteger(
      d.producer.retryDelay
    );
    document.getElementById("producerRetries").value = toInteger(
      d.producer.retries
    );
    document.getElementById("producerAcks").value = d.producer.acks;
    document.getElementById("producerLinger").value = toInteger(
      d.producer.linger
    );
    document.getElementById("producerBufferMemory").value = toInteger(
      d.producer.bufferMemory
    );
    document.getElementById("producerMaxInflightRequestsPerConnection").value =
      toInteger(d.producer.maxInFlightRequestsPerConnection);
    document.getElementById("producerCompressionMethod").value =
      d.producer.compressionMethod;
    document.getElementById("producerAuthenticationMethod").value =
      d.producer.authentication;
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
      localStorage.getItem("mni.gatewayUrl") + "/admin/kafka/broker/" + id,
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
          fpReady = setTimeout(fetchProvider, retryMs);
        }
      })
      .then((data) => {
        displayProvider(data);
      })
      .catch((e) => {
        fpReady = setTimeout(fetchProvider, retryMs);
      });
  } else {
    fpReady = setTimeout(fetchProvider, retryMs);
  }
}
function fetchProviderList() {
  if (fplReady != null) {
    clearTimeout(fplReady);
  }

  fetch(localStorage.getItem("mni.gatewayUrl") + "/admin/kafka/broker", {
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
        fplReady = setTimeout(fetchProviderList, retryMs);
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
      fplReady = setTimeout(fetchProviderList, retryMs);
    });
}
try {
  fetchProviderList();
} catch (e) {
  fplReady = setTimeout(fetchProviderList, retryMs);
}
