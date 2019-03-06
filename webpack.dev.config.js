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


var commonWebpackConfig = require('./webpack.config.js');
var path = require('path');

module.exports = {
  mode: 'development',
  resolve: {
    modules: [path.resolve(__dirname, 'core/templates/dev/head')],
  },  
  entry: {
    app: './core/templates/dev/head/app.js',
    about: './core/templates/dev/head/pages/about/About.js',
    donate: './core/templates/dev/head/pages/donate/Donate.js'
  },
  plugins: commonWebpackConfig.plugins,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'core/templates/dev/head/dist')
  },
  devtool: 'inline-source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 1024 * 10,
      maxInitialRequests: 9,
    }
  }
};
