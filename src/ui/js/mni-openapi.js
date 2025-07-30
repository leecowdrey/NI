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
