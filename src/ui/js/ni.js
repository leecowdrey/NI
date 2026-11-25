//=====================================================================
// Network Insight (NI) - JavaScript: UI Common
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
var niLicenseHost = null;
var niLicenseDomain = null;
var niLicenseStart = null;
var niLicenseExpiry = null;
var niAppShortName = "NI";
var niAppIcon = "/favicon.ico";
var niAppNotificationIcon = "/favicon.ico";
var niAppName = null;
var niAppVersion = null;
var niAppBuild = null;
var niCountryCode = "GBR";
var niCurrencyName = "Sterling";
var niCurrencyIsoCode = "GBP";
var niCurrencySymbol = "£";
var niSelectedCountry = null;
var niRootUrl = "/ni";
var niGatewayUrl = null;
var niGatewayUrlIp = null;
var niGatewayUrlDns = null;
var niRetryMs = 1000;
var niRefreshMs = 60000;
var niReadinessAttempts = 10;
var niOAuthRefresh = null;
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
function niMetadata() {
  try {
    fetch("/ni/metadata", {
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
        localStorage.setItem("ni.appName", data.name);
        localStorage.setItem("ni.appShortName", data.shortName);
        localStorage.setItem("ni.appIcon", data.icon);
        localStorage.setItem("ni.appNotificationIcon", data.notificatonIcon);
        localStorage.setItem("ni.appVersion", data.version);
        localStorage.setItem("ni.appBuild", data.build);
        localStorage.setItem("ni.country", data.country);
        localStorage.setItem("ni.selectedCountry", data.country);
        localStorage.setItem("ni.currencyName", data.currencyName);
        localStorage.setItem("ni.currencyIsoCode", data.currencyIsoCode);
        localStorage.setItem("ni.currencySymbol", data.currencySymbol);
        localStorage.setItem("ni.rootUrl", data.rootUrl);
        localStorage.setItem("ni.gatewayUrl", data.gatewayUrl);
        localStorage.setItem("ni.gatewayUrlIp", data.gatewayUrlIp);
        localStorage.setItem("ni.gatewayUrlDns", data.gatewayUrlDns);
        localStorage.setItem("ni.retryMs", data.retryMs);
        localStorage.setItem("ni.refreshMs", data.refreshMs);
        localStorage.setItem("ni.readinessAttempts", data.readinessAttempts);
        localStorage.setItem("ni.", true);
      })
      .catch((e) => {
        console.error(e);
      });
    niAppName = localStorage.getItem("ni.appName");
    niAppShortName = localStorage.getItem("ni.appShortName");
    niAppIcon = localStorage.getItem("ni.appIcon");
    niAppNotificationIcon = localStorage.getItem("ni.appNotificationIcon");
    niAppVersion = localStorage.getItem("ni.appVersion");
    niAppBuild = localStorage.getItem("ni.appBuild");
    niCountryCode = localStorage.getItem("ni.country");
    niCurrencyName = localStorage.getItem("ni.currencyName");
    niCurrencyIsoCode = localStorage.getItem("ni.currencyIsoCode");
    niCurrencySymbol = localStorage.getItem("ni.currencySymbol");
    niRootUrl = localStorage.getItem("ni.rootUrl");
    niGatewayUrl = localStorage.getItem("ni.gatewayUrl");
    niGatewayUrlIp = localStorage.getItem("ni.gatewayUrlIp");
    niGatewayUrlDns = localStorage.getItem("ni.gatewayUrlDns");
    niRetryMs = localStorage.getItem("ni.retryMs");
    niRefreshMs = localStorage.getItem("ni.refreshMs");
    niReadinessAttempts = localStorage.getItem("ni.readinessAttempts");
    niSelectedCountry = localStorage.getItem("ni.selectedCountry");
  } catch (e) {
    console.error(e);
  }
}
function niLicense() {
  try {
    fetch(localStorage.getItem("ni.gatewayUrl") + "/license", {
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
        localStorage.setItem("ni.license.host", data.host);
        localStorage.setItem("ni.license.domain", data.domain);
        localStorage.setItem("ni.license.start", data.start);
        localStorage.setItem("ni.license.expiry", data.expiry);
        localStorage.setItem("ni.license.", true);
      })
      .catch((e) => {
        console.error(e);
      });
    niLicenseHost = localStorage.getItem("ni.license.host");
    niLicenseDomain = localStorage.getItem("ni.license.domain");
    niLicenseStart = localStorage.getItem("ni.license.start");
    niLicenseExpiry = localStorage.getItem("ni.license.expiry");
  } catch (e) {
    console.error(e);
  }
}
function niLoadScript(url, callback) {
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
      if (localStorage.key(i).startsWith("ni.")) {
        localStorage.removeItem(localStorage.key(i));
      }
    }
  }
}
function dumpSessionStorage() {
  let storageLength = localStorage.length;
  for (var i = 0; i < storageLength; i++) {
    if (localStorage.key(i) != null) {
      if (localStorage.key(i).startsWith("ni.")) {
        console.log(
          localStorage.key(i) + "=" + localStorage.getItem(localStorage.key(i))
        );
      }
    }
  }
}
function notify(m, t = "NI", i = "/favicon.ico") {
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
          body: "Requesting permission to send notifications while using ni",
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
  jump(localStorage.getItem("ni.rootUrl") + "/" + jumpTo);
  return false;
}
function tokenRefresh() {
  if (toBoolean(localStorage.getItem("ni.auth.oauth"))) {
    if (niOAuthRefresh != null) {
      clearTimeout(niOAuthRefresh);
    }
    let auth = new URLSearchParams({
      grant_type: "refresh_token",
      scope: localStorage.getItem("ni.auth.scope"),
      refresh_token: localStorage.getItem("ni.auth.refreshToken"),
    });
    let status = fetch(localStorage.getItem("ni.rootUrl") + "/login/refresh", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: auth,
      keepalive: true,
    })
      .then((response) => {
        if (response.ok) {
          if (response.status == 200) {
            return response.json();
          }
        } else if (response.status == 401) {
          window.alert("Authorization time-out");
          window.location.replace("/");
        }
      })
      .then(async (data) => {
        if (data != null) {
          localStorage.setItem("ni.auth.accessToken", data.access_token);
          localStorage.setItem("ni.auth.expiresIn", data.expires_in);
          localStorage.setItem(
            "ni.auth.refreshExpiresIn",
            data.refresh_expires_in
          );
          localStorage.setItem("ni.auth.refreshToken", data.refresh_token);
          niOAuthRefresh = setTimeout(
            tokenRefresh,
            localStorage.getItem("ni.auth.refreshExpiresIn") * 1000
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
      localStorage.setItem("ni.auth.oauth", true);
      let auth = new URLSearchParams({
        username: username,
        password: password,
      });
      let status = fetch(localStorage.getItem("ni.rootUrl") + "/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: auth,
        keepalive: true,
      })
        .then((response) => {
          if (response.ok) {
            if (response.status == 200) {
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
            localStorage.setItem("ni.auth.idToken", data.id_token);
            localStorage.setItem("ni.auth.accessToken", data.access_token);
            localStorage.setItem("ni.auth.expiresIn", data.expires_in);
            localStorage.setItem(
              "ni.auth.refreshExpiresIn",
              data.refresh_expires_in
            );
            localStorage.setItem("ni.auth.refreshToken", data.refresh_token);
            localStorage.setItem("ni.auth.sessionState", data.session_state);
            localStorage.setItem("ni.auth.tokenType", data.token_type);
            localStorage.setItem("ni.auth.scope", data.scope);
            niOAuthRefresh = setTimeout(
              tokenRefresh,
              localStorage.getItem("ni.auth.refreshExpiresIn") * 1000
            );
            window.location.replace(
              localStorage.getItem("ni.rootUrl") + "/readiness"
            );
          }
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      localStorage.setItem("ni.auth.oauth", false);
      res.sendStatus(401);
    }
  } else {
    window.location.replace("/");
  }
}
function logout() {
  if (niOAuthRefresh != null) {
    clearTimeout(niOAuthRefresh);
  }
  let oauth = toBoolean(localStorage.getItem("ni.auth.oauth"));
  if (oauth) {
    let auth = new URLSearchParams({
      id_token: localStorage.getItem("ni.auth.idToken") || "",
      access_token: localStorage.getItem("ni.auth.accessToken") || "",
      refresh_token: localStorage.getItem("ni.auth.refreshToken") || "",
    });
    let status = fetch(localStorage.getItem("ni.rootUrl") + "/logout", {
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
    localStorage.removeItem("ni.auth.idToken");
    localStorage.removeItem("ni.auth.accessToken");
    localStorage.removeItem("ni.auth.expiresIn");
    localStorage.removeItem("ni.auth.refreshExpiresIn");
    localStorage.removeItem("ni.auth.refreshToken");
    localStorage.removeItem("ni.auth.sessionState");
    localStorage.removeItem("ni.auth.tokenType");
    localStorage.removeItem("ni.auth.scope");
    localStorage.removeItem("ni.auth.oauth");
  }
  window.location.replace(localStorage.getItem("ni.rootUrl"));
}
function buildGoogleMapsScriptUrl(rawUrl, callbackName = "displayMap") {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    console.error("Invalid Google Maps script URL:", rawUrl);
    return null;
  }
  try {
    let parsed = new URL(rawUrl.trim(), window.location.origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      console.error("Unsupported Google Maps script URL protocol:", parsed.protocol);
      return null;
    }
    let apiKey = parsed.searchParams.get("key");
    if (
      apiKey == null ||
      apiKey.trim().length === 0 ||
      apiKey === "null" ||
      apiKey === "undefined"
    ) {
      console.error("Google Maps script URL is missing a valid API key");
      return null;
    }
    parsed.searchParams.set("v", "weekly");
    parsed.searchParams.set("loading", "async");
    let existingLibs = (parsed.searchParams.get("libraries") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!existingLibs.includes("marker")) {
      existingLibs.push("marker");
    }
    parsed.searchParams.set("libraries", existingLibs.join(","));
    if (typeof callbackName === "string" && callbackName.trim().length > 0) {
      parsed.searchParams.set("callback", callbackName.trim());
    }
    return parsed.toString();
  } catch (e) {
    console.error("Failed to parse Google Maps script URL:", e);
    return null;
  }
}
function validateMapRenderResponse(data) {
  if (data == null || typeof data !== "object") {
    console.error("Invalid /ui/mapRender response payload");
    return null;
  }
  let vendor =
    typeof data.vendor === "string" && data.vendor.trim().length > 0
      ? data.vendor.trim()
      : null;
  let url =
    typeof data.url === "string" && data.url.trim().length > 0
      ? data.url.trim()
      : null;
  if (vendor == null || url == null) {
    console.error("Incomplete /ui/mapRender response payload:", data);
    return null;
  }
  let mapId =
    typeof data.mapId === "string" && data.mapId.trim().length > 0
      ? data.mapId.trim()
      : "DEMO_MAP_ID";
  return { vendor, url, mapId };
}
function validateMapCoordinate(coord) {
  if (coord == null || typeof coord !== "object") {
    return null;
  }
  let lng = Number(coord.x);
  let lat = Number(coord.y);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return { lat, lng };
}
function createMapPinElement(iconClass, bgColor = "#D93025") {
  let pin = document.createElement("div");
  pin.style.width = "30px";
  pin.style.height = "30px";
  pin.style.borderRadius = "50% 50% 50% 0";
  pin.style.transform = "rotate(-45deg)";
  pin.style.backgroundColor = bgColor;
  pin.style.border = "2px solid #ffffff";
  pin.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.45)";
  pin.style.display = "flex";
  pin.style.alignItems = "center";
  pin.style.justifyContent = "center";
  pin.style.cursor = "pointer";
  let icon = document.createElement("i");
  icon.className = iconClass;
  icon.style.transform = "rotate(45deg)";
  icon.style.color = "#ffffff";
  icon.style.fontSize = "14px";
  pin.appendChild(icon);
  return pin;
}
function createMapDotElement(color, sizePx = 12) {
  let dot = document.createElement("div");
  dot.style.width = sizePx + "px";
  dot.style.height = sizePx + "px";
  dot.style.borderRadius = "50%";
  dot.style.backgroundColor = color;
  dot.style.border = "1px solid rgba(0, 0, 0, 0.35)";
  dot.style.boxSizing = "border-box";
  return dot;
}
function loadGoogleMaps(scriptUrl, initCallback, id = "mapRender") {
  if (typeof initCallback !== "function") {
    console.error("Google Maps init callback is required");
    return false;
  }
  window.gm_authFailure = function () {
    console.error(
      "Google Maps authentication failed (InvalidKeyMapError / invalid API key). Update the Google Maps API key in Settings -> Map Providers."
    );
    let mapEl = document.getElementById("map");
    if (mapEl != null) {
      mapEl.innerHTML =
        '<div style="padding:16px;background:#333;color:#fff;border-radius:6px;max-width:480px;font-family:sans-serif;">' +
        "<strong>Google Maps authentication failed</strong><br>" +
        "The configured Google Maps API key was rejected (InvalidKeyMapError). " +
        "Please update it with a valid Maps JavaScript API key in <em>Settings &rarr; Map Providers</em>." +
        "</div>";
    }
  };
  if (
    window.google &&
    window.google.maps &&
    typeof window.google.maps.importLibrary === "function"
  ) {
    Promise.resolve(initCallback()).catch((e) => console.error(e));
    return true;
  }
  window.displayMap = function () {
    Promise.resolve(initCallback()).catch((e) => console.error(e));
  };
  let existing = document.getElementById(id);
  if (existing != null) {
    return true;
  }
  if (typeof scriptUrl !== "string" || scriptUrl.trim().length === 0) {
    console.error("Google Maps script URL is missing or invalid");
    return false;
  }
  let s = document.createElement("script");
  s.id = id;
  s.src = scriptUrl;
  s.async = true;
  s.defer = true;
  s.onerror = function (err) {
    console.error("Failed to load Google Maps script:", err);
    if (s.parentNode) {
      s.parentNode.removeChild(s);
    }
  };
  document.head.appendChild(s);
  return true;
}
function loadScript(scriptPath, callback, id = "mapRender") {
  if (typeof scriptPath !== "string" || scriptPath.trim().length === 0) {
    console.error("loadScript called with invalid scriptPath:", scriptPath);
    return;
  }
  if (document.getElementById(id) == null) {
    let s = document.createElement("script");
    s.setAttribute("id", id);
    s.setAttribute("src", scriptPath);
    s.async = true;
    s.defer = true;
    if (typeof callback === "function") {
      s.onload = function () {
        callback();
      };
    }
    s.onerror = function (err) {
      console.error("Failed to load script:", scriptPath, err);
      if (s.parentNode) {
        s.parentNode.removeChild(s);
      }
    };
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
  niSelectedCountry = selectedCountry;
  localStorage.setItem("ni.selectedCountry", selectedCountry);
}
function countryListPopulate(nextfunc = null) {
  let niCountryCode = localStorage.getItem("ni.country");
  fetch(localStorage.getItem("ni.gatewayUrl") + "/ui/countries", {
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
            niSelectedCountry = suppliedCountry;
            localStorage.setItem("ni.selectedCountry", suppliedCountry);
            document.getElementById("country").value = suppliedCountry;
          } else {
            niSelectedCountry = localStorage.getItem("ni.selectedCountry");
            document.getElementById("country").value = niSelectedCountry;
          }
        } else {
          niSelectedCountry = localStorage.getItem("ni.selectedCountry");
          document.getElementById("country").value = niSelectedCountry;
        }
      } else {
        document.getElementById("country").innerHTML =
          "<option value='" +
          niCountryCode +
          "' selected='selected'>" +
          niCountryCode +
          "</option>";
        localStorage.setItem("ni.selectedCountry", niCountryCode);
        document.getElementById("country").value = niCountryCode;
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
  if (window.location.pathname == "/ni/") {
    niMetadata();
    //niLicense();
  }
} catch (e) {
  console.error(e);
}
