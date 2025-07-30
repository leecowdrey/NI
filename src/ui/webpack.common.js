const path = require("path");

module.exports = {
  entry: {
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    clean: true,
    filename: "./js/[name].js",
  },
};
