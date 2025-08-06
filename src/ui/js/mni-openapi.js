//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: OpenAPI Loader
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
window.onload = function () {
  const ui = SwaggerUIBundle({
    url: localStorage.getItem('mni.gatewayUrl')+'/api',
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
