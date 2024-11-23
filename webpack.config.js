const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main-base.js",
    path: path.resolve(__dirname, "dist"),
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 51200000
},
  mode: "production",
  plugins: [
    new HtmlWebpackPlugin({
      title: "Output Management",
      template: "guidelines-base.html",
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "images", to: "assets/images" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.s?css$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
