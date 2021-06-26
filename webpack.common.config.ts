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
const path = require('path');
const webpack = require('webpack');
const macros = require('./webpack.common.macros.ts');

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
    about: commonPrefix + '/pages/about-page/about-page.import.ts',
    admin: commonPrefix + '/pages/admin-page/admin-page.import.ts',
    classroom:
      commonPrefix + '/pages/classroom-page/classroom-page.import.ts',
    collection_editor:
      commonPrefix + '/pages/collection-editor-page/' +
      'collection-editor-page.import.ts',
    collection_player:
      commonPrefix + '/pages/collection-player-page/' +
      'collection-player-page.import.ts',
    contact: commonPrefix + '/pages/contact-page/contact-page.import.ts',
    console_errors: commonPrefix + '/tests/console_errors.import.ts',
    creator_dashboard:
      commonPrefix + '/pages/creator-dashboard-page/' +
      'creator-dashboard-page.import.ts',
    contributor_dashboard:
      commonPrefix + '/pages/contributor-dashboard-page/' +
      'contributor-dashboard-page.import.ts',
    delete_account:
      commonPrefix + '/pages/delete-account-page/' +
        'delete-account-page.import.ts',
    donate: commonPrefix + '/pages/donate-page/donate-page.import.ts',
    email_dashboard:
      commonPrefix +
      '/pages/email-dashboard-pages/email-dashboard-page.import.ts',
    email_dashboard_result:
      commonPrefix +
      '/pages/email-dashboard-pages/email-dashboard-result.import.ts',
    error: commonPrefix + '/pages/error-pages/error-page.import.ts',
    exploration_editor:
      commonPrefix + '/pages/exploration-editor-page/' +
      'exploration-editor-page.import.ts',
    exploration_player:
      commonPrefix + '/pages/exploration-player-page/' +
      'exploration-player-page.import.ts',
    get_started:
      commonPrefix + '/pages/get-started-page/get-started-page.import.ts',
    landing:
      commonPrefix + '/pages/landing-pages/topic-landing-page/' +
      'topic-landing-page.import.ts',
    learner_dashboard:
      commonPrefix + '/pages/learner-dashboard-page/' +
      'learner-dashboard-page.import.ts',
    library: commonPrefix + '/pages/library-page/library-page.import.ts',
    license: commonPrefix + '/pages/license-page/license.import.ts',
    login: commonPrefix + '/pages/login-page/login-page.import.ts',
    logout: commonPrefix + '/pages/logout-page/logout-page.import.ts',
    maintenance:
      commonPrefix + '/pages/maintenance-page/maintenance-page.import.ts',
    moderator:
      commonPrefix + '/pages/moderator-page/moderator-page.import.ts',
    notifications_dashboard:
      commonPrefix + '/pages/notifications-dashboard-page/' +
      'notifications-dashboard-page.import.ts',
    pending_account_deletion:
      commonPrefix + '/pages/pending-account-deletion-page/' +
      'pending-account-deletion-page.import.ts',
    playbook: commonPrefix + '/pages/participation-playbook/playbook.import.ts',
    practice_session:
      commonPrefix + '/pages/practice-session-page/' +
        'practice-session-page.import.ts',
    privacy: commonPrefix + '/pages/privacy-page/privacy-page.import.ts',
    preferences:
      commonPrefix + '/pages/preferences-page/preferences-page.import.ts',
    profile: commonPrefix + '/pages/profile-page/profile-page.import.ts',
    release_coordinator: commonPrefix + (
      '/pages/release-coordinator-page/release-coordinator-page.import.ts'),
    review_test:
      commonPrefix + '/pages/review-test-page/review-test-page.import.ts',
    signup: commonPrefix + '/pages/signup-page/signup-page.import.ts',
    skill_editor:
      commonPrefix + '/pages/skill-editor-page/skill-editor-page.import.ts',
    splash: commonPrefix + '/pages/splash-page/splash-page.import.ts',
    stewards:
      commonPrefix + '/pages/landing-pages/stewards-landing-page/' +
      'stewards-landing-page.import.ts',
    story_editor:
      commonPrefix + '/pages/story-editor-page/story-editor-page.import.ts',
    story_viewer:
      commonPrefix + '/pages/story-viewer-page/story-viewer-page.import.ts',
    subtopic_viewer:
      commonPrefix +
      '/pages/subtopic-viewer-page/subtopic-viewer-page.import.ts',
    teach: commonPrefix + '/pages/teach-page/teach-page.import.ts',
    terms: commonPrefix + '/pages/terms-page/terms-page.import.ts',
    thanks: commonPrefix + '/pages/thanks-page/thanks-page.import.ts',
    topic_editor:
      commonPrefix + '/pages/topic-editor-page/topic-editor-page.import.ts',
    topics_and_skills_dashboard: (
      commonPrefix +
      '/pages/topics-and-skills-dashboard-page/' +
      'topics-and-skills-dashboard-page.import.ts'
    ),
    topic_viewer:
      commonPrefix + '/pages/topic-viewer-page/topic-viewer-page.import.ts',
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['about'],
      filename: 'about-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'With Oppia, you can access free lessons on ' +
          'math, physics, statistics, chemistry, music, history and ' +
          'more from anywhere in the world. Oppia is a nonprofit ' +
          'with the mission of providing high-quality ' +
          'education to those who lack access to it.'
      },
      template: commonPrefix + '/pages/about-page/about-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['admin'],
      filename: 'admin-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'With Oppia, you can access free lessons on ' +
          'math, physics, statistics, chemistry, music, history and ' +
          'more from anywhere in the world. Oppia is a nonprofit ' +
          'with the mission of providing high-quality ' +
          'education to those who lack access to it.'
      },
      template: commonPrefix + '/pages/admin-page/admin-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['classroom'],
      filename: 'classroom-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Learn and practice all major math topics, functions, ' +
        'equations, and formulas through problems, stories, and examples.'
      },
      template:
        commonPrefix + '/pages/classroom-page/' +
        'classroom-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['collection_editor'],
      filename: 'collection-editor-page.mainpage.html',
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
      chunks: ['contact'],
      filename: 'contact-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Contact the Oppia team, submit feedback, and learn ' +
          'how to get involved with the Oppia project.'
      },
      template: commonPrefix + '/pages/contact-page/contact-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['creator_dashboard'],
      filename: 'creator-dashboard-page.mainpage.html',
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
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/contributor-dashboard-page/' +
        'contributor-dashboard-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['delete_account'],
      filename: 'delete-account-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/delete-account-page/' +
          'delete-account-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['donate'],
      filename: 'donate-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Donate to The Oppia Foundation to enable more ' +
        'students to receive the quality education they deserve.'
      },
      template: commonPrefix + '/pages/donate-page/donate-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['email_dashboard'],
      filename: 'email-dashboard-page.mainpage.html',
      meta: defaultMeta,
      template: (
        commonPrefix +
        '/pages/email-dashboard-pages/email-dashboard-page.mainpage.html'),
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
      chunks: ['error'],
      filename: 'error-iframed.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-iframed.mainpage.html',
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
      filename: 'error-page-404.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false,
      statusCode: 404
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
      chunks: ['error'],
      filename: 'error-iframed.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/error-pages/error-iframed.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['exploration_editor'],
      filename: 'exploration-editor-page.mainpage.html',
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
      chunks: ['exploration_player'],
      filename: 'exploration-player-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/exploration-player-page/' +
        'exploration-player-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['get_started'],
      filename: 'get-started-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Learn how to get started using Oppia.'
      },
      template:
        commonPrefix + '/pages/get-started-page/get-started-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['landing'],
      filename: 'topic-landing-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/landing-pages/topic-landing-page/' +
        'topic-landing-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['learner_dashboard'],
      filename: 'learner-dashboard-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/learner-dashboard-page/' +
        'learner-dashboard-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['library'],
      filename: 'library-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Looking to learn something new? Learn any subject ' +
          'of your choice created by professors, teachers and Oppia ' +
          'users! Free lessons are always available for any topic and ' +
          'level you want.'
      },
      template: commonPrefix + '/pages/library-page/library-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['license'],
      filename: 'license.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'License terms that Oppia is attributed under.'
      },
      template:
        commonPrefix + '/pages/license-page/license.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['login'],
      filename: 'login-page.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/login-page/login-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['logout'],
      filename: 'logout-page.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/logout-page/logout-page.mainpage.html',
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
      chunks: ['moderator'],
      filename: 'moderator-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/moderator-page/moderator-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['notifications_dashboard'],
      filename: 'notifications-dashboard-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Keep track of the lessons you have created, as well ' +
          'as feedback from learners.'
      },
      template: (
        commonPrefix +
        '/pages/notifications-dashboard-page/' +
        'notifications-dashboard-page.mainpage.html'
      ),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['pending_account_deletion'],
      filename: 'pending-account-deletion-page.mainpage.html',
      meta: defaultMeta,
      template:
          commonPrefix + '/pages/pending-account-deletion-page/' +
          'pending-account-deletion-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['playbook'],
      filename: 'playbook.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'The Oppia library is full of user-created lessons ' +
        'called \'explorations\'. Read about how to participate in the ' +
        'community and begin creating explorations.'
      },
      template:
        commonPrefix + '/pages/participation-playbook/playbook.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['practice_session'],
      filename: 'practice-session-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/practice-session-page/' +
        'practice-session-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['preferences'],
      filename: 'preferences-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Change your Oppia profile settings and preferences'
      },
      template:
        commonPrefix + '/pages/preferences-page/preferences-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['privacy'],
      filename: 'privacy-page.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/privacy-page/privacy-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['profile'],
      filename: 'profile-page.mainpage.html',
      meta: defaultMeta,
      template: commonPrefix + '/pages/profile-page/profile-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['release_coordinator'],
      filename: 'release-coordinator-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'With Oppia, you can access free lessons on ' +
          'math, physics, statistics, chemistry, music, history and ' +
          'more from anywhere in the world. Oppia is a nonprofit ' +
          'with the mission of providing high-quality ' +
          'education to those who lack access to it.'
      },
      template: (
        commonPrefix +
        '/pages/release-coordinator-page/release-coordinator-page.mainpage.html'
      ),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['review_test'],
      filename: 'review-test-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/review-test-page/review-test-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['signup'],
      filename: 'signup-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Sign up for Oppia and begin exploring a new subject.'
      },
      template: commonPrefix + '/pages/signup-page/signup-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['skill_editor'],
      filename: 'skill-editor-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/skill-editor-page/' +
        'skill-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'With Oppia, you can access free lessons on math, ' +
        'physics, statistics, chemistry, music, history and more from ' +
        'anywhere in the world. Oppia is a nonprofit with the mission ' +
        'of providing high-quality education to those who lack access to it.'
      },
      template: commonPrefix + '/pages/splash-page/splash-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['stewards'],
      filename: 'stewards-landing-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix +
        '/pages/landing-pages/stewards-landing-page/' +
        'stewards-landing-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['story_editor'],
      filename: 'story-editor-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/story-editor-page/' +
        'story-editor-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['story_viewer'],
      filename: 'story-viewer-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/story-viewer-page/' +
        'story-viewer-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['subtopic_viewer'],
      filename: 'subtopic-viewer-page.mainpage.html',
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/subtopic-viewer-page/' +
        'subtopic-viewer-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['teach'],
      filename: 'teach-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'The Oppia library is full of user-created lessons ' +
        'called \'explorations\'. Read about how to participate in the ' +
        'community and begin creating explorations.'
      },
      template: commonPrefix + '/pages/teach-page/teach-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['terms'],
      filename: 'terms-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Oppia is a 501(c)(3) registered non-profit open-source' +
        ' e-learning platform. Learn about our terms and conditions for ' +
        'creating and distributing learning material.'
      },
      template: commonPrefix + '/pages/terms-page/terms-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['thanks'],
      filename: 'thanks-page.mainpage.html',
      meta: {
        name: defaultMeta.name,
        description: 'Thank you for donating to The Oppia Foundation!'
      },
      template: commonPrefix + '/pages/thanks-page/thanks-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topic_editor'],
      filename: 'topic-editor-page.mainpage.html',
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
      meta: defaultMeta,
      template:
        commonPrefix + '/pages/topic-viewer-page/' +
        'topic-viewer-page.mainpage.html',
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
          loader: 'angular2-template-loader'
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
        path.resolve(__dirname, 'extensions'),
        path.resolve(__dirname, 'node_modules'),
      ],
      use: [
        'cache-loader',
        {
          loader: 'style-loader',
          options: {
            esModule: false
          }
        },
        {
          loader: 'css-loader',
          options: {
            url: false,
          }
        }
      ]
    }]
  },
  externals: {
    jquery: 'jQuery'
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all'
    },
  }
};
