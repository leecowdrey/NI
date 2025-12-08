const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./readiness.ejs",
      filename: "readiness.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./alert.ejs",
      filename: "alert.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./workalert.ejs",
      filename: "workalert.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./callbackalert.ejs",
      filename: "callbackalert.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./publishalert.ejs",
      filename: "publishalert.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./notifyalert.ejs",
      filename: "notifyalert.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./dashboard.ejs",
      filename: "dashboard.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./cable.ejs",
      filename: "cable.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./duct.ejs",
      filename: "duct.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./openapi.ejs",
      filename: "openapi.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./help.ejs",
      filename: "help.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./ne.ejs",
      filename: "ne.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./pole.ejs",
      filename: "pole.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./provider.ejs",
      filename: "provider.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./email.ejs",
      filename: "email.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./kafka.ejs",
      filename: "kafka.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./map.ejs",
      filename: "map.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./rack.ejs",
      filename: "rack.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./workflow.ejs",
      filename: "workflow.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./service.ejs",
      filename: "service.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./site.ejs",
      filename: "site.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./trench.ejs",
      filename: "trench.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./trenchLifetime.ejs",
      filename: "trenchLifetime.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./trenchCountry.ejs",
      filename: "trenchCountry.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./q2c.ejs",
      filename: "q2c.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./callback.ejs",
      filename: "callback.ejs",
    }),
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./setting.ejs",
      filename: "setting.ejs",
    }),
    new CopyPlugin({
      patterns: [
        { from: "index.ejs", to: "index.ejs" },
        { from: "img", to: "img" },
        { from: "css", to: "css" },
        { from: "fonts", to: "fonts" },
        { from: "js/ni-alert.js", to: "js/ni-alert.js" },
        { from: "js/ni-cable.js", to: "js/ni-cable.js" },
        { from: "js/ni-callback.js", to: "js/ni-callback.js" },
        { from: "js/ni-duct.js", to: "js/ni-duct.js" },
        { from: "js/ni-dashboard.js", to: "js/ni-dashboard.js" },
        { from: "js/ni-email.js", to: "js/ni-email.js" },
        { from: "js/ni-kafka.js", to: "js/ni-kafka.js" },
        { from: "js/ni-map.js", to: "js/ni-map.js" },
        { from: "js/ni-ne.js", to: "js/ni-ne.js" },
        { from: "js/ni-openapi.js", to: "js/ni-openapi.js" },
        { from: "js/ni-pole.js", to: "js/ni-pole.js" },
        { from: "js/ni-provider.js", to: "js/ni-provider.js" },
        { from: "js/ni-q2c.js", to: "js/ni-q2c.js" },
        { from: "js/ni-rack.js", to: "js/ni-rack.js" },
        { from: "js/ni-readiness.js", to: "js/ni-readiness.js" },
        { from: "js/ni-service.js", to: "js/ni-service.js" },
        { from: "js/ni-setting.js", to: "js/ni-setting.js" },
        { from: "js/ni-site.js", to: "js/ni-site.js" },
        { from: "js/ni-trench.js", to: "js/ni-trench.js" },
        { from: "js/ni-trenchLifetime.js", to: "js/ni-trenchLifetime.js" },
        { from: "js/ni-trenchCountry.js", to: "js/ni-trenchCountry.js" },
        { from: "js/ni-workflow.js", to: "js/ni-workflow.js" },
        { from: "js/ni.js", to: "js/ni.js" },
        { from: "js/vendor", to: "js/vendor" },
        { from: "js/chart.umd.min.js", to: "js/chart.umd.min.js" },
        { from: "js/gridjs.umd.js", to: "js/gridjs.umd.js" },
        { from: "js/selection.umd.js", to: "js/selection.umd.js" },
        { from: "favicon.ico", to: "favicon.ico" },
        { from: "robots.txt", to: "robots.txt" },
        { from: "404.html", to: "404.html" },
      ],
    }),
  ],
});
