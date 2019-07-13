const path = require("path");
const webpack = require("webpack");
const htmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackPluginServe } = require('webpack-plugin-serve');
const watch = process.env.NODE_ENV === 'development';
module.exports = (env, argv) => {
  const mode = process.env.NODE_ENV || "development";
  const isProduction = mode === "production";
  const watch = mode === 'development';
return {
    mode: mode,
    devtool: 'cheap-eval-source-map',
    entry: {
      main: [
        path.resolve(__dirname, "src/index.tsx"),
        'webpack-plugin-serve/client'
      ]
    },
    output: {
      filename: isProduction ? "bundle.[hash].js" : "[name].js",
      path: path.resolve(__dirname, "dist")
    },
    devtool: isProduction ? false : "source-map",
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"]
    },
    optimization: {
      splitChunks: {
        name: "vendor",
        chunks: "initial",
      }
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader" },
        { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
      ]
    },
    plugins: [
      new htmlWebpackPlugin({
        template: path.resolve(__dirname, "src/index.html"),
      }),
      new WebpackPluginServe({
        hmr: true,
        historyFallback: true,
        static: [path.resolve(__dirname, "dist")],
        host: "localhost",
        port: 8080
      })
    ],
    watch
  }
}
