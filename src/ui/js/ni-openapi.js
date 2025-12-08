//=====================================================================
// Network Insight (NI) - JavaScript: OpenAPI Loader
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
window.onload = function () {
  const ui = SwaggerUIBundle({
    url: localStorage.getItem('ni.gatewayUrl')+'/api',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIBundle.SwaggerUIStandalonePreset,
    ],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
  });
  window.ui = ui;
};
