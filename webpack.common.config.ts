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

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
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
  customAttrSurround: [[/#/, /(?:)/], [/\*/, /(?:)/], [/\[?\(?/, /(?:)/]],
  customAttrAssign: [/\)?\]?=/]
};
var commonPrefix = './core/templates';
var defaultMeta = {
  name: 'Personalized Online Learning from Oppia',
  description: 'Oppia is a free, open-source learning platform. Join ' +
    'the community to create or try an exploration today!'
};

module.exports = {
  resolve: {
    modules: [
      path.resolve(__dirname, 'assets'),
      path.resolve(__dirname, 'core/templates'),
      path.resolve(__dirname, 'extensions'),
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'third_party')
    ],
    extensions: ['.ts', '.js', '.json', '.html', '.svg', '.png'],
    alias: {
      '@angular/upgrade/static': (
        '@angular/upgrade/bundles/upgrade-static.umd.js'),
      // These both are used so that we can refer to them in imports using their
      // full path: 'assets/{{filename}}'.
      'assets/constants': 'constants.ts',
      'assets/rich_text_components_definitions':
        'rich_text_components_definitions.ts'
    }
  },
  entry: {
    collection_editor:
      commonPrefix + '/pages/collection-editor-page/' +
      'collection-editor-page.import.ts',
    collection_player:
      commonPrefix + '/pages/collection-player-page/' +
      'collection-player-page.import.ts',
    console_errors: commonPrefix + '/tests/console_errors.import.ts',
    creator_dashboard:
      commonPrefix + '/pages/creator-dashboard-page/' +
      'creator-dashboard-page.import.ts',
    contributor_dashboard:
      commonPrefix + '/pages/contributor-dashboard-page/' +
      'contributor-dashboard-page.import.ts',
    diagnostic_test_player_page:
      commonPrefix + '/pages/diagnostic-test-player-page/' +
      'diagnostic-test-player-page.import.ts',
    email_dashboard_result:
      commonPrefix +
      '/pages/email-dashboard-pages/email-dashboard-result.import.ts',
    error: commonPrefix + '/pages/error-pages/error-page.import.ts',
    error_iframed: commonPrefix + '/pages/error-pages/error-iframed-page/' +
                   'error-iframed-page.import.ts',
    exploration_editor:
      commonPrefix + '/pages/exploration-editor-page/' +
      'exploration-editor-page.import.ts',
    facilitator_dashboard:
      commonPrefix + '/pages/facilitator-dashboard-page/' +
      'facilitator-dashboard-page.import.ts',
    maintenance:
      commonPrefix + '/pages/maintenance-page/maintenance-page.import.ts',
    oppia_root:
      commonPrefix + '/pages/oppia-root/index.ts',
    lightweight_oppia_root:
      commonPrefix + '/pages/lightweight-oppia-root/index.ts',
    practice_session:
      commonPrefix +
      '/pages/practice-session-page/practice-session-page.import.ts',
    review_test:
      commonPrefix + '/pages/review-test-page/review-test-page.import.ts',
    skill_editor:
      commonPrefix + '/pages/skill-editor-page/skill-editor-page.import.ts',
    story_editor:
      commonPrefix + '/pages/story-editor-page/story-editor-page.import.ts',
    subtopic_viewer:
      commonPrefix +
      '/pages/subtopic-viewer-page/subtopic-viewer-page.import.ts',
    topic_editor:
      commonPrefix + '/pages/topic-editor-page/topic-editor-page.import.ts',
    topics_and_skills_dashboard: (
      commonPrefix +
      '/pages/topics-and-skills-dashboard-page/' +
      'topics-and-skills-dashboard-page.import.ts'
    ),
    topic_viewer:
      commonPrefix + '/pages/topic-viewer-page/topic-viewer-page.import.ts',
    voiceover_admin:
      commonPrefix + '/pages/voiceover-admin-page/' +
      'voiceover-admin-page.import.ts',
  },

  /**
  * TODO(#13079): Remove the hybrid field from the html webpack plugin options
  * once angularjs is removed from corresponding pages.
  */
  plugins: [
    new webpack.DefinePlugin({
      CAN_SEND_ANALYTICS_EVENTS: (
        analyticsConstants.CAN_SEND_ANALYTICS_EVENTS
      )
    }),
    new webpack.ProvidePlugin({
      diff_match_patch: [
        'diff_match_patch/lib/diff_match_patch', 'diff_match_patch'],
      DIFF_EQUAL: ['diff_match_patch/lib/diff_match_patch', 'DIFF_EQUAL'],
      DIFF_INSERT: ['diff_match_patch/lib/diff_match_patch', 'DIFF_INSERT'],
      DIFF_DELETE: ['diff_match_patch/lib/diff_match_patch', 'DIFF_DELETE'],
    }),
    new HtmlWebpackPlugin({
      chunks: ['diagnostic_test_player_page'],
      filename: 'diagnostic-test-player-page.mainpage.html',
      hybrid: true,
      meta: {
        name: defaultMeta.name,
        description: 'With Oppia, you can access free lessons on math, ' +
        'physics, statistics, chemistry, music, history, and more from ' +
        'anywhere in the world. Oppia is a nonprofit with the mission of ' +
        'providing high-quality education to those who lack access to it. ' +
        'The Learner Diagnostic test page will allow the learner to ' +
        'test their knowledge and get a set of recommendations for where ' +
        'they should begin learning.'
      },
      template:
        commonPrefix + '/pages/diagnostic-test-player-page/' +
        'diagnostic-test-player-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['collection_editor'],
      filename: 'collection-editor-page.mainpage.html',
      hybrid: true,
      meta: {
        name: defaultMeta.name,
        description: 'Contact the Oppia team, submit feedback, and learn ' +
          'how to get involved with the Oppia project.'
      },
      template:
        commonPrefix + '/pages/collection-editor-page/' +
        'collection-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['collection_player'],
      filename: 'collection-player-page.mainpage.html',
      hybrid: true,
      meta: {
        name: defaultMeta.name,
        description: 'Contact the Oppia team, submit feedback, and learn ' +
          'how to get involved with the Oppia project.'
      },
      template:
        commonPrefix + '/pages/collection-player-page/' +
        'collection-player-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['console_errors'],
      filename: 'console_errors.html',
      hybrid: true,
      meta: {
        name: defaultMeta.name,
        description: 'Contact the Oppia team, submit feedback, and learn ' +
          'how to get involved with the Oppia project.'
      },
      template: commonPrefix + '/tests/console_errors.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['creator_dashboard'],
      filename: 'creator-dashboard-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/creator-dashboard-page/' +
        'creator-dashboard-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['contributor_dashboard'],
      filename: 'contributor-dashboard-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/contributor-dashboard-page/' +
        'contributor-dashboard-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['email_dashboard_result'],
      filename: 'email-dashboard-result.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix +
        '/pages/email-dashboard-pages/email-dashboard-result.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['error_iframed'],
      filename: 'error-iframed.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-iframed-page/' +
                'error-iframed.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['error'],
      filename: 'error-page-400.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false,
      statusCode: 400
    }),
    new HtmlWebpackPlugin({
      chunks: ['error'],
      filename: 'error-page-401.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false,
      statusCode: 401
    }),
    new HtmlWebpackPlugin({
      chunks: ['error'],
      filename: 'error-page-500.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false,
      statusCode: 500
    }),
    new HtmlWebpackPlugin({
      chunks: ['exploration_editor'],
      filename: 'exploration-editor-page.mainpage.html',
      hybrid: true,
      meta: {
        name: defaultMeta.name,
        description: 'Help others learn new things. Create lessons through ' +
          'explorations and share your knowledge with the community.'
      },
      template:
        commonPrefix + '/pages/exploration-editor-page/' +
        'exploration-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['maintenance'],
      filename: 'maintenance-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/maintenance-page/maintenance-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['oppia_root'],
      filename: 'oppia-root.mainpage.html',
      meta: defaultMeta,
      template:
          commonPrefix + '/pages/oppia-root/oppia-root.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
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
      lightweight: true
    }),
    new HtmlWebpackPlugin({
      chunks: ['practice_session'],
      filename: 'practice-session-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/practice-session-page/' +
        'practice-session-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['review_test'],
      filename: 'review-test-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/review-test-page/review-test-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['skill_editor'],
      filename: 'skill-editor-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/skill-editor-page/' +
        'skill-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['story_editor'],
      filename: 'story-editor-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/story-editor-page/' +
        'story-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['subtopic_viewer'],
      filename: 'subtopic-viewer-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/subtopic-viewer-page/' +
        'subtopic-viewer-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topic_editor'],
      filename: 'topic-editor-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/topic-editor-page/' +
        'topic-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topics_and_skills_dashboard'],
      filename: 'topics-and-skills-dashboard-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template: (
        commonPrefix +
        '/pages/topics-and-skills-dashboard-page/' +
        'topics-and-skills-dashboard-page.mainpage.html'
      ),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topic_viewer'],
      filename: 'topic-viewer-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/topic-viewer-page/' +
        'topic-viewer-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['facilitator_dashboard'],
      filename: 'facilitator-dashboard-page.mainpage.html',
      hybrid: true,
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/facilitator-dashboard-page/' +
        'facilitator-dashboard-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['voiceover_admin'],
      filename: 'voiceover-admin-page.mainpage.html',
      hybrid: true,
      meta: {
        name: defaultMeta.name,
        description: 'The voiceover admin page provides functionalities ' +
        'for the voiceover admin, allowing them to manage language accent' +
        ' support for Oppia\'s voiceovers. The Voiceover Admin can use ' +
        'this page to add new language accent support, remove existing ' +
        'language accent support, and generate automatic voiceovers ' +
        'for exploration.'
      },
      template:
        commonPrefix + '/pages/voiceover-admin-page/' +
        'voiceover-admin-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['**/*', '!*.html'],
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        macros: {
          load: macros.load,
          loadExtensions: macros.loadExtensions
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
      insert: function(linkTag) {
        if (localStorage.getItem('direction') === 'rtl') {
          linkTag.href = linkTag.href.replace('.css', '.rtl.css');
        }
        document.head.appendChild(linkTag);
      }
    }),
    // This generates the RTL version for all CSS bundles.
    new WebpackRTLPlugin({
      minify: {
        zindex: false
      }
    })
  ],
  module: {
    rules: [{
      test: /\.ts$/,
      include: [
        path.resolve(__dirname, 'assets'),
        path.resolve(__dirname, 'core/templates'),
        path.resolve(__dirname, 'extensions'),
        path.resolve(__dirname, 'typings')
      ],
      use: [
        'cache-loader',
        {
          loader: 'ts-loader',
          options: {
            // Typescript checks do the type checking.
            transpileOnly: true
          }
        },
        {
          loader: path.resolve(
            'angular-template-style-url-replacer.webpack-loader')
        }
      ]
    },
    {
      test: {
        include: /.html$/,
        exclude: /(directive|component)\.html$/
      },
      loader: ['cache-loader', 'underscore-template-loader']
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
          }
        }
      ]
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
          }
        },
      ],
    }]
  },
  externals: {
    jquery: 'jQuery'
  },
  optimization: {
    runtimeChunk: 'single',
    sideEffects: true,
    usedExports: true,
    splitChunks: {
      chunks: 'all'
    },
  }
};
