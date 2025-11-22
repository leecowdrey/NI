//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Callback
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
try {
  window.location.replace(localStorage.getItem("mni.rootUrl") + "/readiness");
} catch (e) {
  console.error(e);
}
