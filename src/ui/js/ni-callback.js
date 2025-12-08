//=====================================================================
// Network Insight (NI) - JavaScript: Callback
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
try {
  window.location.replace(localStorage.getItem("ni.rootUrl") + "/readiness");
} catch (e) {
  console.error(e);
}
