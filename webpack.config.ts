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

var CleanWebpackPlugin = require('clean-webpack-plugin');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var htmlMinifyConfig = {
  ignoreCustomFragments: [
    /\{\{[\s\S]*?\}\}/,
    /<\{%[\s\S]*?%\}/,
    /<\[[\s\S]*?\]>/]
};

var commonPrefix = './core/templates/dev/head';

module.exports = {
  entries: {
    about: commonPrefix + '/pages/about-page/about-page.controller.ts',
    admin: commonPrefix + '/pages/admin/Admin.ts',
    app: commonPrefix + '/App.ts',
    collection_editor:
      commonPrefix + '/pages/collection_editor/CollectionEditor.ts',
    collection_player:
      commonPrefix + '/pages/collection_player/CollectionPlayer.ts',
    contact: commonPrefix + '/pages/contact-page/contact-page.scripts.ts',
    creator_dashboard:
      commonPrefix + '/pages/creator_dashboard/CreatorDashboard.ts',
    donate: commonPrefix + '/pages/donate-page/donate-page.controller.ts',
    email_dashboard:
      commonPrefix +
      '/pages/email-dashboard-pages/email-dashboard-page.controller.ts',
    email_dashboard_result:
      commonPrefix +
      '/pages/email-dashboard-pages/email-dashboard-result.controller.ts',
    error: commonPrefix + '/pages/error/Error.ts',
    exploration_editor:
      commonPrefix + '/pages/exploration_editor/ExplorationEditor.ts',
    exploration_player:
      commonPrefix + '/pages/exploration_player/ExplorationPlayer.ts',
    get_started:
      commonPrefix + 'pages/get-started-page/get-started-page.scripts.ts',
    landing:
      commonPrefix + '/pages/landing/topic-landing-page/' +
      'topic-landing-page.controller.ts',
    learner_dashboard:
      commonPrefix + '/pages/learner_dashboard/LearnerDashboard.ts',
    library: commonPrefix + '/pages/library/Library.ts',
    maintenance:
      commonPrefix + '/pages/maintenance-page/maintenance-page.controller.ts',
    moderator:
      commonPrefix + '/pages/moderator-page/moderator-page.controller.ts',
    notifications_dashboard:
      commonPrefix + '/pages/notifications-dashboard-page/' +
      'notifications-dashboard-page.controller.ts',
    practice_session:
      commonPrefix + '/pages/practice-session-page/' +
      'practice-session-page.controller.ts',
    preferences:
      commonPrefix + '/pages/preferences-page/preferences-page.controller.ts',
    profile: commonPrefix + '/pages/profile-page/profile-page.controller.ts',
    signup: commonPrefix + '/pages/signup-page/signup-page.controller.ts',
    skill_editor: commonPrefix + '/pages/skill_editor/SkillEditor.ts',
    splash: commonPrefix + '/pages/splash-page/splash-page.controller.ts',
    stewards:
      commonPrefix + '/pages/landing/stewards-landing-page/' +
      'stewards-landing-page.controller.ts',
    story_editor: commonPrefix + '/pages/story_editor/StoryEditor.ts',
    teach: commonPrefix + '/pages/teach/Teach.ts',
    thanks: commonPrefix + '/pages/thanks/Thanks.ts',
    topic_editor: commonPrefix + '/pages/topic_editor/TopicEditor.ts',
    topics_and_skills_dashboard: (
      commonPrefix +
      '/pages/topics_and_skills_dashboard/' +
      'TopicsAndSkillsDashboard.ts'
    ),
    topic_viewer: commonPrefix + '/pages/topic_viewer/TopicViewer.ts',
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['app', 'admin'],
      filename: 'admin.html',
      template: commonPrefix + '/pages/admin/admin.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['app'],
      filename: 'base.html',
      template: 'core/templates/dev/head/pages/base.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['about'],
      filename: 'about-page.mainpage.html',
      template: commonPrefix + '/pages/about-page/about-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['collection_editor'],
      filename: 'collection_editor.html',
      template:
        commonPrefix + '/pages/collection_editor/collection_editor.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['collection_player'],
      filename: 'collection_player.html',
      template:
        commonPrefix + '/pages/collection_player/collection_player.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'console_errors.html',
      template: commonPrefix + '/pages/tests/console_errors.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['contact'],
      filename: 'contact-page.mainpage.html',
      template: commonPrefix + '/pages/contact-page/contact-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['creator_dashboard'],
      filename: 'creator_dashboard.html',
      template:
        commonPrefix + '/pages/creator_dashboard/creator_dashboard.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['donate'],
      filename: 'donate-page.mainpage.html',
      template: commonPrefix + '/pages/donate-page/donate-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['email_dashboard'],
      filename: 'email-dashboard-page.mainpage.html',
      template: (
        commonPrefix +
        '/pages/email-dashboard-pages/email-dashboard-page.mainpage.html'),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['email_dashboard_result'],
      filename: 'email-dashboard-result.mainpage.html',
      template:
        commonPrefix +
        '/pages/email-dashboard-pages/email-dashboard-result.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['error'],
      filename: 'error-page.mainpage.html',
      template: commonPrefix + '/pages/error-pages/error-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['exploration_editor'],
      filename: 'exploration_editor.html',
      template:
        commonPrefix + '/pages/exploration_editor/exploration_editor.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['exploration_player'],
      filename: 'exploration_player.html',
      template:
        commonPrefix + '/pages/exploration_player/exploration_player.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['get_started'],
      filename: 'get-started-page.mainpage.html',
      template:
        commonPrefix + '/pages/get-started-page/get-started-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['landing'],
      filename: 'topic-landing-page.mainpage.html',
      template:
        commonPrefix + '/pages/landing/topic-landing-page/' +
        'topic-landing-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['learner_dashboard'],
      filename: 'learner_dashboard.html',
      template:
        commonPrefix + '/pages/learner_dashboard/learner_dashboard.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['library'],
      filename: 'library.html',
      template: commonPrefix + '/pages/library/library.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['app', 'maintenance'],
      filename: 'maintenance-page.mainpage.html',
      template:
        commonPrefix + '/pages/maintenance-page/maintenance-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['moderator'],
      filename: 'moderator-page.mainpage.html',
      template:
        commonPrefix + '/pages/moderator-page/moderator-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'privacy-page.mainpage.html',
      template: commonPrefix + '/pages/privacy-page/privacy-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['notifications_dashboard'],
      filename: 'notifications-dashboard-page.mainpage.html',
      template: (
        commonPrefix +
        '/pages/notifications-dashboard-page/' +
        'notifications-dashboard-page.mainpage.html'
      ),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['practice_session'],
      filename: 'practice-session-page.mainpage.html',
      template:
        commonPrefix + '/pages/practice-session-page/' +
        'practice-session-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['preferences'],
      filename: 'preferences-page.mainpage.html',
      template:
        commonPrefix + '/pages/preferences-page/preferences-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['profile'],
      filename: 'profile-page.mainpage.html',
      template: commonPrefix + '/pages/profile-page/profile-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['signup'],
      filename: 'signup-page.mainpage.html',
      template: commonPrefix + '/pages/signup-page/signup-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['skill_editor'],
      filename: 'skill_editor.html',
      template: commonPrefix + '/pages/skill_editor/skill_editor.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash-page.mainpage.html',
      template: commonPrefix + '/pages/splash-page/splash-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at0.html',
      template: commonPrefix + '/pages/splash-page/splash_at0.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at1.html',
      template: commonPrefix + '/pages/splash-page/splash_at1.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['stewards'],
      filename: 'stewards-landing-page.mainpage.html',
      template:
        commonPrefix +
        '/pages/landing-pages/stewards-landing-page/' +
        'stewards-landing-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['story_editor'],
      filename: 'story_editor.html',
      template: commonPrefix + '/pages/story_editor/story_editor.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['teach'],
      filename: 'teach.html',
      template: commonPrefix + '/pages/teach/teach.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'terms.html',
      template: commonPrefix + '/pages/terms/terms.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['thanks'],
      filename: 'thanks.html',
      template: commonPrefix + '/pages/thanks/thanks.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topic_editor'],
      filename: 'topic_editor.html',
      template: commonPrefix + '/pages/topic_editor/topic_editor.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topics_and_skills_dashboard'],
      filename: 'topics_and_skills_dashboard.html',
      template: (
        commonPrefix +
        '/pages/topics_and_skills_dashboard/topics_and_skills_dashboard.html'
      ),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['topic_viewer'],
      filename: 'topic_viewer.html',
      template: commonPrefix + '/pages/topic_viewer/topic_viewer.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true })
  ]
};
