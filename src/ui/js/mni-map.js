
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
                if (!document.getElementById("systemDefault").checked) {
                    fetch("<%=payload.gatewayUrl%>/admin/map/provider/" + id, {
                        method: "DELETE",
                        keepalive: true,
                    })
                        .then((response) => {
                            if (response.ok) {
                                previousProvider();
                                fetchProviderList();
                            } else {
                                window.alert(`Failed to delete provider ${id}`);
                            }
                        })
                        .catch((e) => {
                        });
                } else {
                    window.alert("Can not delete the default provider !");
                }
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
            document.getElementById("provider").value = "-1"
            clearProvider();
        }
        function saveProvider() {
            let p = document.getElementById("provider");
            let id = p.options[p.selectedIndex].value;
            let v = document.getElementById("vendor");
            let vendor = v.options[v.selectedIndex].value;
            let systemDefault = document.getElementById("systemDefault").checked || false;
            let reqJson = null;
            if (vendor != "-1") {
                if (document.getElementById("renderUrl").value.length > 0) {
                    if (document.getElementById("credentialKey").value.length > 0 || document.getElementById("idpBase").value.length > 0) {
                        if (document.getElementById("credentialKey").value.length > 0) {
                            reqJson = {
                                vendor: vendor,
                                default: systemDefault,
                                renderUrl: document.getElementById("renderUrl").value,
                                credentials: {
                                    identity: document.getElementById("credentialIdentity").value,
                                    key: document.getElementById("credentialKey").value,
                                }
                            };
                        } else if (document.getElementById("idpBase").value.length > 0) {
                            reqJson = {
                                vendor: vendor,
                                default: systemDefault,
                                renderUrl: document.getElementById("renderUrl").value,
                                identityProvider: {
                                    base: document.getElementById("idpBase").value,
                                    authorization: document.getElementById("idpAuthorization").value,
                                    token: document.getElementById("idpToken").value,
                                    wellKnown: document.getElementById("idpWellKnown").value
                                }
                            };
                        }
                        if (id == "-1") {
                            // new provider
                            //
                            fetch("<%=payload.gatewayUrl%>/admin/map/provider", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Accept": "application/json",
                                },
                                body: JSON.stringify(reqJson),
                                keepalive: true,
                            })
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
                            reqJson.mapProviderId = id;
                            fetch("<%=payload.gatewayUrl%>/admin/map/provider/" + id, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(reqJson),
                                keepalive: true,
                            })
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
                        window.alert("Either credentials identity/key must be suppied or identity Provider base/authorization/token/Well-Known URLs");
                    }
                } else {
                    window.alert("Render URL must be supplied");
                }
            } else {
                window.alert("Vendor must be selected");
            }
        }
        function clearProvider() {
            document.getElementById("vendor").value = "-1";
            document.getElementById("systemDefault").checked = false;
            document.getElementById("renderUrl").value = "";
            document.getElementById("credentialIdentity").value = "";
            document.getElementById("credentialKey").value = "";
            document.getElementById("idpBase").value = "";
            document.getElementById("idpAuthorization").value = "";
            document.getElementById("idpToken").value = "";
            document.getElementById("idpWellKnown").value = "";
            document.getElementById("credential").style.display = "block";
            document.getElementById("idp").style.display = "block";
        }
        function displayProvider(d) {
            clearProvider();
            let p = document.getElementById("provider");
            let id = p.options[p.selectedIndex].value;
            if (d !== undefined && d != null) {
                switch (d.vendor) {
                    case "Google Maps":
                        document.getElementById("vendor").value = d.vendor;
                        break;
                    case "OpenStreet Map":
                        document.getElementById("vendor").value = d.vendor;
                        break;
                    case "Microsoft Azure":
                        document.getElementById("vendor").value = d.vendor;
                        break;
                    case "ERSI":
                        document.getElementById("vendor").value = d.vendor;
                        break;
                    default:
                        document.getElementById("vendor").value = "-1";
                }
            }
            document.getElementById("systemDefault").checked = d.default;
            document.getElementById("renderUrl").value = d.renderUrl;
            if (d.credentials != null) {
                document.getElementById("credentialIdentity").value = d.credentials.identity;
                document.getElementById("credentialKey").value = d.credentials.key;
                document.getElementById("credential").style.display = "block";
                document.getElementById("idp").style.display = "none";
            } else if (d.identityProvider != null) {
                document.getElementById("idpBase").value = d.identityProvider.base;
                document.getElementById("idpAuthorization").value = d.identityProvider.authorization;
                document.getElementById("idpToken").value = d.identityProvider.token;
                document.getElementById("idpWellKnown").value = d.identityProvider.wellKnown;
                document.getElementById("credential").style.display = "none";
                document.getElementById("idp").style.display = "block";
            } else {
                document.getElementById("credential").style.display = "none";
                document.getElementById("idp").style.display = "none";
            }
        }
        function fetchProvider() {
            if (fpReady != null) {
                clearTimeout(fpReady);
            }
            let p = document.getElementById("provider");
            let id = p.options[p.selectedIndex].value;
            if (id != null) {

                fetch("<%=payload.gatewayUrl%>/admin/map/provider/" + id, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                    },
                    keepalive: true,
                })
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

            fetch("<%=payload.gatewayUrl%>/admin/map/provider", {
                method: "GET",
                headers: {
                    "Accept": "application/json",
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
                    let Ids = "<option disabled value='-1' selected='selected'> -- new provider -- </option>";
                    for (var i = 0; i < data.length; i++) {
                        if (i == 0) {
                            Ids += "<option value='" + data[i] + "' selected='selected'>" + data[i] + "</option>"
                        } else {
                            Ids += "<option value='" + data[i] + "' >" + data[i] + "</option>"
                        }
                    }
                    document.getElementById("provider").innerHTML = Ids;
                    if (data.length > 0) {
                        document.getElementById("meter").setAttribute("min", 1);
                        document.getElementById("meter").setAttribute("value", 1);
                    }
                    else {
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
