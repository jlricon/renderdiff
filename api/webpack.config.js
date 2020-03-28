const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
  entry: {
    index: "./worker/worker.js"
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new WasmPackPlugin({
      crateDirectory: __dirname
      // extraArgs: "--out-name index"
    })
  ]
};
