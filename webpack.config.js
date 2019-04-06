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

var CleanWebpackPlugin = require('clean-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var htmlMinifyConfig = {
  ignoreCustomFragments: [
    /\{\{[\s\S]*?\}\}/,
    /<\{%[\s\S]*?%\}/,
    /<\[[\s\S]*?\]>/]
};


module.exports = {
  entries: {
    app: './core/templates/dev/head/App.js',
    about: './core/templates/dev/head/pages/about/About.js',
    contact: './core/templates/dev/head/pages/contact/Contact.js',
    donate: './core/templates/dev/head/pages/donate/Donate.js',
    error: './core/templates/dev/head/pages/error/Error.js',
    get_started: './core/templates/dev/head/pages/get_started/GetStarted.js',
    landing: './core/templates/dev/head/pages/landing/TopicLandingPage.js',
    library: './core/templates/dev/head/pages/library/Library.js',
    splash: './core/templates/dev/head/pages/splash/Splash.js',
    stewards: './core/templates/dev/head/pages/landing/stewards/Stewards.js',
    teach: './core/templates/dev/head/pages/teach/Teach.js',
    thanks: './core/templates/dev/head/pages/thanks/Thanks.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['app'],
      filename: 'base.html',
      template: 'core/templates/dev/head/pages/base.html',
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
      chunks: ['contact'],
      filename: 'contact.html',
      template: 'core/templates/dev/head/pages/contact/contact.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['donate'],
      filename: 'donate.html',
      template: 'core/templates/dev/head/pages/donate/donate.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['error'],
      filename: 'error.html',
      template: 'core/templates/dev/head/pages/error/error.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['get_started'],
      filename: 'get_started.html',
      template: 'core/templates/dev/head/pages/get_started/get_started.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['landing'],
      filename: 'topic_landing_page.html',
      template: 'core/templates/dev/head/pages/landing/topic_landing_page.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['library'],
      filename: 'library.html',
      template: 'core/templates/dev/head/pages/library/library.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'privacy.html',
      template: 'core/templates/dev/head/pages/privacy/privacy.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash.html',
      template: 'core/templates/dev/head/pages/splash/splash.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ah0.html',
      template: 'core/templates/dev/head/pages/splash/splash_ah0.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ah1.html',
      template: 'core/templates/dev/head/pages/splash/splash_ah1.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ah2.html',
      template: 'core/templates/dev/head/pages/splash/splash_ah2.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ai0.html',
      template: 'core/templates/dev/head/pages/splash/splash_ai0.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ai1.html',
      template: 'core/templates/dev/head/pages/splash/splash_ai1.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ai2.html',
      template: 'core/templates/dev/head/pages/splash/splash_ai2.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_ai3.html',
      template: 'core/templates/dev/head/pages/splash/splash_ai3.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at0.html',
      template: 'core/templates/dev/head/pages/splash/splash_at0.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at1.html',
      template: 'core/templates/dev/head/pages/splash/splash_at1.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at2.html',
      template: 'core/templates/dev/head/pages/splash/splash_at2.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_av0.html',
      template: 'core/templates/dev/head/pages/splash/splash_av0.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_av1.html',
      template: 'core/templates/dev/head/pages/splash/splash_av1.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['stewards'],
      filename: 'landing_page_stewards.html',
      template: 'core/templates/dev/head/pages/landing/stewards/landing_page_stewards.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['teach'],
      filename: 'teach.html',
      template: 'core/templates/dev/head/pages/teach/teach.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'terms.html',
      template: 'core/templates/dev/head/pages/terms/terms.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['thanks'],
      filename: 'thanks.html',
      template: 'core/templates/dev/head/pages/thanks/thanks.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
  ]
};
