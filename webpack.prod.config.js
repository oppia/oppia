const commonWebpackConfig = require("./webpack.config.js")
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    app: './core/templates/dev/head/app2.js',
    about: './core/templates/dev/head/pages/about/About.js',
    donate: './core/templates/dev/head/pages/donate/Donate.js'
  },
  plugins: commonWebpackConfig.plugins,
  output: {
    filename: '[name].[contenthash].bundle.js',
    path: path.resolve(__dirname, 'core/templates/dev/head/dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 1024 * 10,
      maxInitialRequests: 9,
    }
  }
};
