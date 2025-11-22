//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: UI Common
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
var mniLicenseHost = null;
var mniLicenseDomain = null;
var mniLicenseStart = null;
var mniLicenseExpiry = null;
var mniAppShortName = "MNI";
var mniAppIcon = "/favicon.ico";
var mniAppNotificationIcon = "/favicon.ico";
var mniAppName = null;
var mniAppVersion = null;
var mniAppBuild = null;
var mniCountryCode = "BEL";
var mniCurrencyName = "Euro";
var mniCurrencyIsoCode = "EUR";
var mniCurrencySymbol = "€";
var mniSelectedCountry = null;
var mniRootUrl = "/mni";
var mniGatewayUrl = null;
var mniGatewayUrlIp = null;
var mniGatewayUrlDns = null;
var mniRetryMs = 1000;
var mniRefreshMs = 60000;
var mniReadinessAttempts = 10;
var mniOAuthRefresh = null;
const countryCode = [
  "ABW",
  "AFG",
  "AGO",
  "AIA",
  "ALB",
  "AND",
  "ARE",
  "ARG",
  "ARM",
  "ASM",
  "ATA",
  "ATF",
  "ATG",
  "AUS",
  "AUT",
  "AZE",
  "BDI",
  "BEL",
  "BEN",
  "BES",
  "BFA",
  "BGD",
  "BGR",
  "BHR",
  "BHS",
  "BIH",
  "BLM",
  "BLR",
  "BLZ",
  "BMU",
  "BOL",
  "BRA",
  "BRB",
  "BRN",
  "BTN",
  "BWA",
  "CAF",
  "CAN",
  "CHE",
  "CHL",
  "CHN",
  "CIV",
  "CMR",
  "COD",
  "COG",
  "COK",
  "COL",
  "COM",
  "CPV",
  "CRI",
  "CUB",
  "CUW",
  "CYM",
  "CYP",
  "CZE",
  "DEU",
  "DJI",
  "DMA",
  "DNK",
  "DOM",
  "DZA",
  "ECU",
  "EGY",
  "ERI",
  "ESP",
  "EST",
  "ETH",
  "FIN",
  "FJI",
  "FLK",
  "FRA",
  "FRO",
  "FSM",
  "GAB",
  "GBR",
  "GEO",
  "GGY",
  "GHA",
  "GIB",
  "GIN",
  "GLP",
  "GMB",
  "GNB",
  "GNQ",
  "GRC",
  "GRD",
  "GRL",
  "GTM",
  "GUF",
  "GUM",
  "GUY",
  "HND",
  "HRV",
  "HTI",
  "HUN",
  "IDN",
  "IMN",
  "IND",
  "IRL",
  "IRN",
  "IRQ",
  "ISL",
  "ISR",
  "ITA",
  "JAM",
  "JOR",
  "JPN",
  "KAZ",
  "KEN",
  "KGZ",
  "KHM",
  "KIR",
  "KNA",
  "KOR",
  "KWT",
  "LAO",
  "LBN",
  "LBR",
  "LBY",
  "LCA",
  "LIE",
  "LKA",
  "LSO",
  "LTU",
  "LUX",
  "LVA",
  "MAR",
  "MCO",
  "MDA",
  "MDG",
  "MDV",
  "MEX",
  "MHL",
  "MKD",
  "MLI",
  "MLT",
  "MMR",
  "MNE",
  "MNG",
  "MNP",
  "MOZ",
  "MRT",
  "MSR",
  "MTQ",
  "MUS",
  "MWI",
  "MYS",
  "MYT",
  "NAM",
  "NCL",
  "NER",
  "NGA",
  "NIC",
  "NIU",
  "NLD",
  "NOR",
  "NPL",
  "NRU",
  "NZL",
  "OMN",
  "PAK",
  "PAN",
  "PCN",
  "PER",
  "PHL",
  "PLW",
  "PNG",
  "POL",
  "PRK",
  "PRT",
  "PRY",
  "PSE",
  "PYF",
  "QAT",
  "REU",
  "ROU",
  "RUS",
  "RWA",
  "SAU",
  "SDN",
  "SEN",
  "SGP",
  "SHN",
  "SLB",
  "SLE",
  "SLV",
  "SMR",
  "SOM",
  "SRB",
  "SSD",
  "STP",
  "SUR",
  "SVK",
  "SVN",
  "SWE",
  "SWZ",
  "SYC",
  "SYR",
  "TCA",
  "TCD",
  "TGO",
  "THA",
  "TJK",
  "TKL",
  "TKM",
  "TLS",
  "TON",
  "TTO",
  "TUN",
  "TUR",
  "TUV",
  "TWN",
  "TZA",
  "UGA",
  "UKR",
  "URY",
  "USA",
  "UZB",
  "VAT",
  "VCT",
  "VEN",
  "VGB",
  "VIR",
  "VNM",
  "VUT",
  "WLF",
  "WSM",
  "YEM",
  "ZAF",
  "ZMB",
  "ZWE",
];
function toBoolean(s) {
  return String(s).toLowerCase() === "true";
}
function toPercent(n, t) {
  let r = 0;
  try {
    if (t > 0) {
      r = Number.parseFloat((n / t) * 100).toFixed(0);
    }
    return r;
  } catch (e) {
    return 0;
  }
}
function toInteger(s) {
  if (Number.isNaN(Number.parseInt(s, 10))) {
    return 0;
  }
  return Number.parseInt(s, 10);
}
function mniMetadata() {
  try {
    fetch("/mni/metadata", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        localStorage.setItem("mni.appName", data.name);
        localStorage.setItem("mni.appShortName", data.shortName);
        localStorage.setItem("mni.appIcon", data.icon);
        localStorage.setItem("mni.appNotificationIcon", data.notificatonIcon);
        localStorage.setItem("mni.appVersion", data.version);
        localStorage.setItem("mni.appBuild", data.build);
        localStorage.setItem("mni.country", data.country);
        localStorage.setItem("mni.selectedCountry", data.country);
        localStorage.setItem("mni.currencyName", data.currencyName);
        localStorage.setItem("mni.currencyIsoCode", data.currencyIsoCode);
        localStorage.setItem("mni.currencySymbol", data.currencySymbol);
        localStorage.setItem("mni.rootUrl", data.rootUrl);
        localStorage.setItem("mni.gatewayUrl", data.gatewayUrl);
        localStorage.setItem("mni.gatewayUrlIp", data.gatewayUrlIp);
        localStorage.setItem("mni.gatewayUrlDns", data.gatewayUrlDns);
        localStorage.setItem("mni.retryMs", data.retryMs);
        localStorage.setItem("mni.refreshMs", data.refreshMs);
        localStorage.setItem("mni.readinessAttempts", data.readinessAttempts);
        localStorage.setItem("mni.", true);
      })
      .catch((e) => {
        console.error(e);
      });
    mniAppName = localStorage.getItem("mni.appName");
    mniAppShortName = localStorage.getItem("mni.appShortName");
    mniAppIcon = localStorage.getItem("mni.appIcon");
    mniAppNotificationIcon = localStorage.getItem("mni.appNotificationIcon");
    mniAppVersion = localStorage.getItem("mni.appVersion");
    mniAppBuild = localStorage.getItem("mni.appBuild");
    mniCountryCode = localStorage.getItem("mni.country");
    mniCurrencyName = localStorage.getItem("mni.currencyName");
    mniCurrencyIsoCode = localStorage.getItem("mni.currencyIsoCode");
    mniCurrencySymbol = localStorage.getItem("mni.currencySymbol");
    mniRootUrl = localStorage.getItem("mni.rootUrl");
    mniGatewayUrl = localStorage.getItem("mni.gatewayUrl");
    mniGatewayUrlIp = localStorage.getItem("mni.gatewayUrlIp");
    mniGatewayUrlDns = localStorage.getItem("mni.gatewayUrlDns");
    mniRetryMs = localStorage.getItem("mni.retryMs");
    mniRefreshMs = localStorage.getItem("mni.refreshMs");
    mniReadinessAttempts = localStorage.getItem("mni.readinessAttempts");
    mniSelectedCountry = localStorage.getItem("mni.selectedCountry");
  } catch (e) {
    console.error(e);
  }
}
function mniLicense() {
  try {
    fetch(localStorage.getItem("mni.gatewayUrl") + "/license", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        localStorage.setItem("mni.license.host", data.host);
        localStorage.setItem("mni.license.domain", data.domain);
        localStorage.setItem("mni.license.start", data.start);
        localStorage.setItem("mni.license.expiry", data.expiry);
        localStorage.setItem("mni.license.", true);
      })
      .catch((e) => {
        console.error(e);
      });
    mniLicenseHost = localStorage.getItem("mni.license.host");
    mniLicenseDomain = localStorage.getItem("mni.license.domain");
    mniLicenseStart = localStorage.getItem("mni.license.start");
    mniLicenseExpiry = localStorage.getItem("mni.license.expiry");
  } catch (e) {
    console.error(e);
  }
}
function mniLoadScript(url, callback) {
  let head = document.head;
  let script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  script.onreadystatechange = callback;
  script.onload = callback;
  head.appendChild(script);
}
function clearSessionStorage() {
  let storageLength = localStorage.length;
  for (var i = 0; i < storageLength; i++) {
    if (localStorage.key(i) != null) {
      if (localStorage.key(i).startsWith("mni.")) {
        localStorage.removeItem(localStorage.key(i));
      }
    }
  }
}
function dumpSessionStorage() {
  let storageLength = localStorage.length;
  for (var i = 0; i < storageLength; i++) {
    if (localStorage.key(i) != null) {
      if (localStorage.key(i).startsWith("mni.")) {
        console.log(
          localStorage.key(i) + "=" + localStorage.getItem(localStorage.key(i))
        );
      }
    }
  }
}
function notify(m, t = "MNI", i = "/favicon.ico") {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications.");
  } else if (Notification.permission === "granted") {
    let notify = new Notification(t, {
      body: m,
      icon: i,
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        let notify = new Notification("Permission request", {
          body: "Requesting permission to send notifications while using MNI",
          icon: "/favicon.ico",
        });
      }
    });
  }
}
function jump(jumpTo) {
  window.location = jumpTo;
  return false;
}
function menuJump(jumpTo) {
  jump(localStorage.getItem("mni.rootUrl") + "/" + jumpTo);
  return false;
}
function tokenRefresh() {
  if (toBoolean(localStorage.getItem("mni.auth.oauth"))) {
    if (mniOAuthRefresh != null) {
      clearTimeout(mniOAuthRefresh);
    }
    let auth = new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      scope: localStorage.getItem("mni.auth.scope"),
      refresh_token: localStorage.getItem("mni.auth.refreshToken"),
    });
    let status = fetch(localStorage.getItem("mni.rootUrl") + "/login/refresh", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: auth,
      keepalive: true,
    })
      .then((response) => {
        if (response.ok) {
          if (
            response.status == 200 &&
            toInteger(response.headers.get("Content-Length")) > 0
          ) {
            return response.json();
          }
        } else if (response.status == 401) {
          window.alert("Authorization time-out");
          window.location.replace("/");
        }
      })
      .then(async (data) => {
        if (data != null) {
          localStorage.setItem("mni.auth.accessToken", data.access_token);
          localStorage.setItem("mni.auth.expiresIn", data.expires_in);
          localStorage.setItem(
            "mni.auth.refreshExpiresIn",
            data.refresh_expires_in
          );
          localStorage.setItem("mni.auth.refreshToken", data.refresh_token);
          mniOAuthRefresh = setTimeout(
            tokenRefresh,
            localStorage.getItem("mni.auth.refreshExpiresIn") * 1000
          );
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
function login(username, password, oauth = false) {
  if (username != null && password != null) {
    if (oauth) {
      localStorage.setItem("mni.auth.oauth", true);
      let auth = new URLSearchParams({
        username: username,
        password: password,
      });
      let status = fetch(localStorage.getItem("mni.rootUrl") + "/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: auth,
        keepalive: true,
      })
        .then((response) => {
          if (response.ok) {
            if (
              response.status == 200 &&
              toInteger(response.headers.get("Content-Length")) > 0
            ) {
              return response.json();
            }
          } else if (response.status == 400) {
            window.alert("Bad request");
            window.location.replace("/");
          } else if (response.status == 401) {
            window.alert(
              "Authorization failed\nInvalid or unknown username or password"
            );
            window.location.replace("/");
          } else {
            console.error(response.status, response.statusText);
          }
        })
        .then(async (data) => {
          if (data != null) {
            localStorage.setItem("mni.auth.idToken", data.id_token);
            localStorage.setItem("mni.auth.accessToken", data.access_token);
            localStorage.setItem("mni.auth.expiresIn", data.expires_in);
            localStorage.setItem(
              "mni.auth.refreshExpiresIn",
              data.refresh_expires_in
            );
            localStorage.setItem("mni.auth.refreshToken", data.refresh_token);
            localStorage.setItem("mni.auth.sessionState", data.session_state);
            localStorage.setItem("mni.auth.tokenType", data.token_type);
            localStorage.setItem("mni.auth.scope", data.scope);
            mniOAuthRefresh = setTimeout(
              tokenRefresh,
              localStorage.getItem("mni.auth.refreshExpiresIn") * 1000
            );
            window.location.replace(
              localStorage.getItem("mni.rootUrl") + "/readiness"
            );
          }
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      localStorage.setItem("mni.auth.oauth", false);
      res.sendStatus(401);
    }
  } else {
    window.location.replace("/");
  }
}
function logout() {
  if (mniOAuthRefresh != null) {
    clearTimeout(mniOAuthRefresh);
  }
  let oauth = toBoolean(localStorage.getItem("mni.auth.oauth"));
  if (oauth) {
    let auth = new URLSearchParams({
      access_token: localStorage.getItem("mni.auth.accessToken"),
      refresh_token: localStorage.getItem("mni.auth.refreshToken"),
    });
    let status = fetch(localStorage.getItem("mni.rootUrl") + "/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: auth,
      keepalive: true,
    })
      .then((response) => {
        return response.ok;
      })
      .catch((err) => {
        console.error(err);
      });
    localStorage.removeItem("mni.auth.idToken");
    localStorage.removeItem("mni.auth.accessToken");
    localStorage.removeItem("mni.auth.expiresIn");
    localStorage.removeItem("mni.auth.refreshExpiresIn");
    localStorage.removeItem("mni.auth.refreshToken");
    localStorage.removeItem("mni.auth.sessionState");
    localStorage.removeItem("mni.auth.tokenType");
    localStorage.removeItem("mni.auth.scope");
    localStorage.removeItem("mni.auth.oauth");
  }
  window.location.replace(localStorage.getItem("mni.rootUrl"));
}
function loadScript(scriptPath, callback, id = "mapRender") {
  if (
    document.getElementById(id) === undefined ||
    document.getElementById(id) == null
  ) {
    let s = document.createElement("script");
    s.setAttribute("id", id);
    s.setAttribute("src", scriptPath);
    s.onload = callback();
    document.head.appendChild(s);
  }
}
function togglePassword(id = "password") {
  var x = document.getElementById(id);
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}
function generateUUID() {
  var d = new Date().getTime();
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function toggleDiv(id) {
  let div = document.getElementById(id);
  div.style.display = div.style.display == "none" ? "block" : "none";
}
function updateSelectedCountry() {
  let c = document.getElementById("country");
  let selectedCountry = c.options[c.selectedIndex].value;
  mniSelectedCountry = selectedCountry;
  localStorage.setItem("mni.selectedCountry", selectedCountry);
}
function countryListPopulate(nextfunc = null) {
  let mniCountryCode = localStorage.getItem("mni.country");
  fetch(localStorage.getItem("mni.gatewayUrl") + "/ui/countries", {
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
      let testCountry = null;
      let suppliedCountry = null;
      let countryPattern = /\?country=(.*)(&|$)/g;
      let countries =
        "<option disabled value='-1' selected='selected'> -- select a country -- </option>";
      if (data.length > 0) {
        data.sort();
        for (let c = 0; c < data.length; c++) {
          countries +=
            "<option value='" + data[c] + "'>" + data[c] + "</option>";
        }
        document.getElementById("country").innerHTML = countries;
        if (window.location.search != null) {
          if (
            (testCountry = countryPattern.exec(window.location.search)) != null
          ) {
            suppliedCountry = String(testCountry[1]).toUpperCase();
            mniSelectedCountry = suppliedCountry;
            localStorage.setItem("mni.selectedCountry", suppliedCountry);
            document.getElementById("country").value = suppliedCountry;
          } else {
            mniSelectedCountry = localStorage.getItem("mni.selectedCountry");
            document.getElementById("country").value = mniSelectedCountry;
          }
        } else {
          mniSelectedCountry = localStorage.getItem("mni.selectedCountry");
          document.getElementById("country").value = mniSelectedCountry;
        }
      } else {
        document.getElementById("country").innerHTML =
          "<option value='" +
          mniCountryCode +
          "' selected='selected'>" +
          mniCountryCode +
          "</option>";
        localStorage.setItem("mni.selectedCountry", mniCountryCode);
        document.getElementById("country").value = mniCountryCode;
      }
      if (nextfunc != null) {
        nextfunc();
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
try {
  if (window.location.pathname == "/mni/") {
    mniMetadata();
    mniLicense();
  }
} catch (e) {
  console.error(e);
}
