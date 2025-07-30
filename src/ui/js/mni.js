//=====================================================================
// MarlinDT Network Intelligence (MNI) - Common JavaScript for UI
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
var mmdReady = null;
var mniAppShortName = "MNI";
var mniAppIcon = "/favicon.ico";
var mniAppNotificationIcon = "/favicon.ico";
var mniAppName = null;
var mniAppVersion = null;
var mniAppBuild = null;
var mniRootUrl = "/";
var mniGatewayUrl = null;
var mniGatewayUrlIp = null;
var mniGatewayUrlDns = null;
var mniRetryMs = 1000;
var mniRefreshMs = 60000;
var mniReadinessAttempts = 10;

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
function clearSessionStorage() {
  localStorage.removeItem("mni.gatewayUrlDns");
  localStorage.removeItem("mni.appIcon");
  localStorage.removeItem("mni.appBuild");
  localStorage.removeItem("mni.appNotificationIcon");
  localStorage.removeItem("mni.retryMs");
  localStorage.removeItem("mni.readinessAttempts");
  localStorage.removeItem("mni.rootUrl");
  localStorage.removeItem("mni.gatewayUrl");
  localStorage.removeItem("mni.gatewayUrlIp");
  localStorage.removeItem("mni.gatewayUrlDns");
  localStorage.removeItem("mni.appName");
  localStorage.removeItem("mni.appShortName");
  localStorage.removeItem("mni.appVersion");
  localStorage.removeItem("mni.refreshMs");
  localStorage.removeItem("mni.");
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
  window.location = localStorage.getItem("mni.rootUrl")+"/"+jumpTo;
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
try {
  if (!localStorage.getItem("mni.")) {
    mniMetadata();
  }
} catch (e) {
  mmdReady = setTimeout(mniMetadata, mniRetryMs);
}