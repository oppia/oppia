// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview General config file for Webpack.
 */

const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackRTLPlugin = require('webpack-rtl-plugin');
var path = require('path');
var webpack = require('webpack');
const macros = require('./webpack.common.macros.ts');
var analyticsConstants = require('./assets/analytics-constants.json');

var htmlMinifyConfig = {
  ignoreCustomFragments: [/<\[[\s\S]*?\]>/],
  removeAttributeQuotes: false,
  caseSensitive: true,
  customAttrSurround: [
    [/#/, /(?:)/],
    [/\*/, /(?:)/],
    [/\[?\(?/, /(?:)/],
  ],
  customAttrAssign: [/\)?\]?=/],
};
var commonPrefix = './core/templates';
var defaultMeta = {
  name: 'Personalized Online Learning from Oppia',
  description:
    'Oppia is a free, open-source learning platform. Join ' +
    'the community to create or try an exploration today!',
};

module.exports = {
  resolve: {
    modules: [
      path.resolve(__dirname, 'assets'),
      path.resolve(__dirname, 'core/templates'),
      path.resolve(__dirname, 'extensions'),
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'third_party'),
    ],
    extensions: ['.ts', '.js', '.json', '.html', '.svg', '.png'],
    alias: {
      '@angular/upgrade/static':
        '@angular/upgrade/bundles/upgrade-static.umd.js',
      // These both are used so that we can refer to them in imports using their
      // full path: 'assets/{{filename}}'.
      'assets/constants': 'constants.ts',
      'assets/rich_text_components_definitions':
        'rich_text_components_definitions.ts',
    },
  },
  entry: {
    oppia_root: commonPrefix + '/pages/oppia-root/index.ts',
    lightweight_oppia_root:
      commonPrefix + '/pages/lightweight-oppia-root/index.ts',
  },

  /**
   * TODO(#13079): Remove the hybrid field from the html webpack plugin options
   * once angularjs is removed from corresponding pages.
   */
  plugins: [
    // TODO(#18260): Change this when we permanently move to the Docker Setup.
    // This plugin is used to define the environment variable USE_FIREBASE_ENDPOINT, which is used
    // in the AuthService class to determine whether to use the localhost or firebase endpoint. This
    // is needed since we need to use the firebase endpoint when running scripts internally in a
    // docker container.
    new webpack.DefinePlugin({
      'process.env.USE_FIREBASE_ENDPOINT': JSON.stringify(
        process.env.USE_FIREBASE_ENDPOINT
      ),
    }),
    new webpack.DefinePlugin({
      CAN_SEND_ANALYTICS_EVENTS: analyticsConstants.CAN_SEND_ANALYTICS_EVENTS,
    }),
    new webpack.ProvidePlugin({
      diff_match_patch: [
        'diff_match_patch/lib/diff_match_patch',
        'diff_match_patch',
      ],
      DIFF_EQUAL: ['diff_match_patch/lib/diff_match_patch', 'DIFF_EQUAL'],
      DIFF_INSERT: ['diff_match_patch/lib/diff_match_patch', 'DIFF_INSERT'],
      DIFF_DELETE: ['diff_match_patch/lib/diff_match_patch', 'DIFF_DELETE'],
    }),
    new HtmlWebpackPlugin({
      chunks: ['oppia_root'],
      filename: 'oppia-root.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/oppia-root/oppia-root.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false,
    }),
    new HtmlWebpackPlugin({
      chunks: ['lightweight_oppia_root'],
      filename: 'lightweight-oppia-root.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix +
        '/pages/lightweight-oppia-root/lightweight-oppia-root.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false,
      lightweight: true,
    }),
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['**/*', '!*.html'],
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        macros: {
          load: macros.load,
          loadExtensions: macros.loadExtensions,
        },
      },
    }),
    // Here we insert the CSS files depending on key-value stored on
    // the local storage. This only works for dynamically inserted bundles.
    // For statically inserted bundles we handle this logic in
    // core/templates/pages/footer_js_libs.html.
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
      ignoreOrder: false,
      insert: function (linkTag) {
        if (localStorage.getItem('direction') === 'rtl') {
          linkTag.href = linkTag.href.replace('.css', '.rtl.css');
        }
        document.head.appendChild(linkTag);
      },
    }),
    // This generates the RTL version for all CSS bundles.
    new WebpackRTLPlugin({
      minify: {
        zindex: false,
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: [
          path.resolve(__dirname, 'assets'),
          path.resolve(__dirname, 'core/templates'),
          path.resolve(__dirname, 'extensions'),
          path.resolve(__dirname, 'typings'),
        ],
        use: [
          'cache-loader',
          {
            loader: 'ts-loader',
            options: {
              // Typescript checks do the type checking.
              transpileOnly: true,
            },
          },
          {
            loader: path.resolve(
              'angular-template-style-url-replacer.webpack-loader'
            ),
          },
        ],
      },
      {
        test: {
          include: /.html$/,
          exclude: /(directive|component)\.html$/,
        },
        loader: ['cache-loader', 'underscore-template-loader'],
      },
      {
        test: /(directive|component)\.html$/,
        use: [
          'cache-loader',
          {
            loader: 'html-loader',
            options: {
              attributes: false,
              minimize: htmlMinifyConfig,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: [
          path.resolve(__dirname, 'core/templates'),
          path.resolve(__dirname, 'extensions'),
          path.resolve(__dirname, 'node_modules'),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
        ],
      },
    ],
  },
  externals: {
    jquery: 'jQuery',
  },
  optimization: {
    runtimeChunk: 'single',
    sideEffects: true,
    usedExports: true,
    splitChunks: {
      chunks: 'all',
    },
  },
};
