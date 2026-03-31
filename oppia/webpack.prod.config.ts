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
 * @fileoverview Production environment config file for Webpack.
 */

var {merge} = require('webpack-merge');
var common = require('./webpack.common.config.ts');
var path = require('path');
var webpack = require('webpack');
var analyticsConstants = require('./assets/analytics-constants.json');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].bundle.js',
    path: path.resolve(__dirname, 'backend_prod_files/webpack_bundles'),
    publicPath: '/build/webpack_bundles/',
  },
  plugins: [
    // This plugin performs a direct text replacement, so the value given to it
    // must include the surrounding quotes. This is done using JSON.stringify.
    // See https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      GA_ANALYTICS_ID: JSON.stringify(analyticsConstants.GA_ANALYTICS_ID),
      GTM_ANALYTICS_ID: JSON.stringify(analyticsConstants.GTM_ANALYTICS_ID),
      SITE_NAME_FOR_ANALYTICS: JSON.stringify(
        analyticsConstants.SITE_NAME_FOR_ANALYTICS
      ),
    }),
  ],
  optimization: {
    ...common.optimization,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: false,
        sourceMap: true,
      }),
    ],
  },
});
