const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    new HtmlWebpackPlugin({
      template: "!!raw-loader!./index.ejs",
      filename: "index.ejs",
    }),
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
      template: "!!raw-loader!./setting.ejs",
      filename: "setting.ejs",
    }),
    new CopyPlugin({
      patterns: [
        { from: "img", to: "img" },
        { from: "css", to: "css" },
        { from: "fonts", to: "fonts" },
        { from: "js/mni.js", to: "js/mni.js" },
        { from: "js/vendor", to: "js/vendor" },
        { from: "js/color.esm.min.js", to: "js/color.esm.min.js" },
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
