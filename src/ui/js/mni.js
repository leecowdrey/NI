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
var mmdReady = null;
var mmlReady = null;
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
var mniCountryCode = null;
var mniRootUrl = "/";
var mniGatewayUrl = null;
var mniGatewayUrlIp = null;
var mniGatewayUrlDns = null;
var mniRetryMs = 1000;
var mniRefreshMs = 60000;
var mniReadinessAttempts = 10;
const countryCode = [
  "ABW",
  "AFG",
  "AGO",
  "AIA",
  "ALA",
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
  "BVT",
  "BWA",
  "CAF",
  "CAN",
  "CCK",
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
  "CXR",
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
  "ESH",
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
  "HKG",
  "HMD",
  "HND",
  "HRV",
  "HTI",
  "HUN",
  "IDN",
  "IMN",
  "IND",
  "IOT",
  "IRL",
  "IRN",
  "IRQ",
  "ISL",
  "ISR",
  "ITA",
  "JAM",
  "JEY",
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
  "MAC",
  "MAF",
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
  "NFK",
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
  "PRI",
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
  "SGS",
  "SHN",
  "SJM",
  "SLB",
  "SLE",
  "SLV",
  "SMR",
  "SOM",
  "SPM",
  "SRB",
  "SSD",
  "STP",
  "SUR",
  "SVK",
  "SVN",
  "SWE",
  "SWZ",
  "SXM",
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
  "UMI",
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

function mniMetadata() {
  try {
    if (mmdReady != null) {
      clearTimeout(mmdReady);
    }
    fetch("/mni/metadata", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          mmdReady = setTimeout(mniMetadata, mniRetryMs);
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
        mmdReady = setTimeout(mniMetadata, mniRetryMs);
      });
    mniAppName = localStorage.getItem("mni.appName");
    mniAppShortName = localStorage.getItem("mni.appShortName");
    mniAppIcon = localStorage.getItem("mni.appIcon");
    mniAppNotificationIcon = localStorage.getItem("mni.appNotificationIcon");
    mniAppVersion = localStorage.getItem("mni.appVersion");
    mniAppBuild = localStorage.getItem("mni.appBuild");
    mniCountryCode = localStorage.getItem("mni.country");
    mniRootUrl = localStorage.getItem("mni.rootUrl");
    mniGatewayUrl = localStorage.getItem("mni.gatewayUrl");
    mniGatewayUrlIp = localStorage.getItem("mni.gatewayUrlIp");
    mniGatewayUrlDns = localStorage.getItem("mni.gatewayUrlDns");
    mniRetryMs = localStorage.getItem("mni.retryMs");
    mniRefreshMs = localStorage.getItem("mni.refreshMs");
    mniReadinessAttempts = localStorage.getItem("mni.readinessAttempts");
  } catch (e) {
    mmdReady = setTimeout(mniMetadata, mniRetryMs);
  }
}
function mniLicense() {
  try {
    if (mmlReady != null) {
      clearTimeout(mmlReady);
    }
    fetch(localStorage.getItem("mni.gatewayUrl") + "/license", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          mmlReady = setTimeout(mniLicense, mniRetryMs);
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
        mmlReady = setTimeout(mniLicense, mniRetryMs);
      });
    mniLicenseHost = localStorage.getItem("mni.license.host");
    mniLicenseDomain = localStorage.getItem("mni.license.domain");
    mniLicenseStart = localStorage.getItem("mni.license.start");
    mniLicenseExpiry = localStorage.getItem("mni.license.expiry");
  } catch (e) {
    mmlReady = setTimeout(mniLicense, mniRetryMs);
  }
}
function clearSessionStorage() {
  let storageLength = localStorage.length;
  for (var i = 0; i < storageLength; i++) {
    let keyName = localStorage.key(i);
    if (keyName.startsWith("mni.")) {
      localStorage.removeItem(keyName);
    }
  }
}
function dumpSessionStorage() {
  let storageLength = localStorage.length;
  for (var i = 0; i < storageLength; i++) {
    let keyName = localStorage.key(i);
    if (keyName.startsWith("mni.")) {
      console.log(keyName + "=" + localStorage.getItem(keyName));
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
  window.location = localStorage.getItem("mni.rootUrl") + "/" + jumpTo;
  return false;
}
function logout() {
  clearSessionStorage();
  window.location.replace("/");
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
function countryListPopulate() {
  let mniCountryCode = localStorage.getItem("mni.country");
  let countries = "";
  if (countryCode.length > 0) {
    for (let c = 0; c < countryCode.length; c++) {
      let selected = "'>";
      if (countryCode[c] == mniCountryCode) {
        selected = "' selected='selected'>";
      }
      countries +=
        "<option value='" +
        countryCode[c] +
        selected +
        countryCode[c] +
        "</option>";
    }
    document.getElementById("country").innerHTML = countries;
  } else {
    document.getElementById("country").innerHTML =
      "<option value='" +
      mniCountryCode +
      "' selected='selected'>" +
      mniCountryCode +
      "</option>";
  }
}
try {
  if (!localStorage.getItem("mni.")) {
    mniMetadata();
  }
} catch (e) {
  mmdReady = setTimeout(mniMetadata, mniRetryMs);
}
try {
  if (!localStorage.getItem("mni.license.")) {
    mniLicense();
  }
} catch (e) {
  mmlReady = setTimeout(mniLicense, mniRetryMs);
}
