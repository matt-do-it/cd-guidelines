const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = [{
  entry: {
    v2: "./src/v2/index.js",
  },
  output: {
    filename: "main-[name].js",
    path: path.resolve(__dirname, "dist", "v2"),
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 51200000,
  },
  mode: "production",
  plugins: [
    new HtmlWebpackPlugin({
      filename: "guidelines-v2.html",
      title: "CD Guidelines v2",
      chunks: ["v2"],
      template: "guidelines-v2.html",
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "src/v2/images", to: "assets/images" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: ["style-loader", "css-loader", "sass-loader", "postcss-loader"],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
}, {
  entry: {
    v3: "./src/v3/index.js",
  },
  output: {
    filename: "main-[name].js",
    path: path.resolve(__dirname, "dist", "v3"),
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 51200000,
  },
  mode: "production",
  plugins: [
    new HtmlWebpackPlugin({
      filename: "guidelines-v3.html",
      title: "CD Guidelines v3",
      chunks: ["v3"],
      template: "guidelines-v3.html",
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "src/v3/images", to: "assets/images" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: ["style-loader", "css-loader", "sass-loader", "postcss-loader"],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
}];
