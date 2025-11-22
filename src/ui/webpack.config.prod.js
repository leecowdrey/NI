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
        { from: "js/mni-alert.js", to: "js/mni-alert.js" },
        { from: "js/mni-cable.js", to: "js/mni-cable.js" },
        { from: "js/mni-callback.js", to: "js/mni-callback.js" },
        { from: "js/mni-duct.js", to: "js/mni-duct.js" },
        { from: "js/mni-dashboard.js", to: "js/mni-dashboard.js" },
        { from: "js/mni-email.js", to: "js/mni-email.js" },
        { from: "js/mni-kafka.js", to: "js/mni-kafka.js" },
        { from: "js/mni-map.js", to: "js/mni-map.js" },
        { from: "js/mni-ne.js", to: "js/mni-ne.js" },
        { from: "js/mni-openapi.js", to: "js/mni-openapi.js" },
        { from: "js/mni-pole.js", to: "js/mni-pole.js" },
        { from: "js/mni-provider.js", to: "js/mni-provider.js" },
        { from: "js/mni-q2c.js", to: "js/mni-q2c.js" },
        { from: "js/mni-rack.js", to: "js/mni-rack.js" },
        { from: "js/mni-readiness.js", to: "js/mni-readiness.js" },
        { from: "js/mni-service.js", to: "js/mni-service.js" },
        { from: "js/mni-setting.js", to: "js/mni-setting.js" },
        { from: "js/mni-site.js", to: "js/mni-site.js" },
        { from: "js/mni-trench.js", to: "js/mni-trench.js" },
        { from: "js/mni-trenchLifetime.js", to: "js/mni-trenchLifetime.js" },
        { from: "js/mni-trenchCountry.js", to: "js/mni-trenchCountry.js" },
        { from: "js/mni-workflow.js", to: "js/mni-workflow.js" },
        { from: "js/mni.js", to: "js/mni.js" },
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
