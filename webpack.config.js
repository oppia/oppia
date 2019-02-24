const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const htmlMinifyConfig = {
  ignoreCustomFragments: [ /\{\{[\s\S]*?\}\}/, /<\{%[\s\S]*?%\}/, /<\[[\s\S]*?\]>/]
}

module.exports = {
  plugins: [
    new CleanWebpackPlugin(['core/templates/dev/head/dist']),
    new HtmlWebpackPlugin({
      chunks: ['app'],
      filename: 'base.html',
      template: 'core/templates/dev/head/pages/base2.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['about'],
      filename: 'about.html',
      template: 'core/templates/dev/head/pages/about/about.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['donate'],
      filename: 'donate.html',
      template: 'core/templates/dev/head/pages/donate/donate.html',
      minify: htmlMinifyConfig,
      inject: false
    })
  ]
};
