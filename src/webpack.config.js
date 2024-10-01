// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

// module.exports = {
//   // Other configurations...
//   plugins: [
//     new NodePolyfillPlugin()
//   ]
// };


const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'global': 'window'
    })
  ]
};