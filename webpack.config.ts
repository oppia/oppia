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
    contact: commonPrefix + '/pages/contact/Contact.ts',
    creator_dashboard:
      commonPrefix + '/pages/creator_dashboard/CreatorDashboard.ts',
    donate: commonPrefix + '/pages/donate/Donate.ts',
    email_dashboard:
      commonPrefix + '/pages/email_dashboard/EmailDashboard.ts',
    email_dashboard_result:
      commonPrefix + '/pages/email_dashboard/EmailDashboardResult.ts',
    error: commonPrefix + '/pages/error/Error.ts',
    exploration_editor:
      commonPrefix + '/pages/exploration_editor/ExplorationEditor.ts',
    exploration_player:
      commonPrefix + '/pages/exploration_player/ExplorationPlayer.ts',
    get_started: commonPrefix + '/pages/get_started/GetStarted.ts',
    landing: commonPrefix + '/pages/landing-page/topic-landing-page.controller.ts',
    learner_dashboard:
      commonPrefix + '/pages/learner_dashboard/LearnerDashboard.ts',
    library: commonPrefix + '/pages/library-page/library-page.controller.ts',
    maintenance: commonPrefix + '/pages/maintenance/Maintenance.ts',
    moderator: commonPrefix + '/pages/moderator/Moderator.ts',
    notifications_dashboard:
      commonPrefix + '/pages/notifications_dashboard/NotificationsDashboard.ts',
    practice_session:
      commonPrefix + '/pages/practice_session/PracticeSession.ts',
    preferences: commonPrefix + '/pages/preferences/Preferences.ts',
    profile: commonPrefix + '/pages/profile/Profile.ts',
    signup: commonPrefix + '/pages/signup-page/signup-page.controller.ts',
    skill_editor: commonPrefix + '/pages/skill_editor/SkillEditor.ts',
    splash: commonPrefix + '/pages/splash/Splash.ts',
    stewards: commonPrefix + '/pages/landing-page/landing-page-stewards/landing-page-stewards.controller.ts',
    story_editor: commonPrefix + '/pages/story_editor/StoryEditor.ts',
    teach: commonPrefix + '/pages/teach/Teach.ts',
    thanks: commonPrefix + '/pages/thanks/Thanks.ts',
    topic_editor: commonPrefix + '/pages/topic-editor-page/topic-editor-page.controller.ts',
    topics_and_skills_dashboard: (
      commonPrefix +
      '/pages/topics_and_skills_dashboard/' +
      'TopicsAndSkillsDashboard.ts'
    ),
    topic_viewer: commonPrefix + '/pages/topic-viewer-page/topic-viewer-page.controller.ts',
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
      filename: 'contact.html',
      template: commonPrefix + '/pages/contact/contact.html',
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
      filename: 'donate.html',
      template: commonPrefix + '/pages/donate/donate.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['email_dashboard'],
      filename: 'email_dashboard.html',
      template: commonPrefix + '/pages/email_dashboard/email_dashboard.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['email_dashboard_result'],
      filename: 'email_dashboard_result.html',
      template:
        commonPrefix + '/pages/email_dashboard/email_dashboard_result.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['error'],
      filename: 'error.html',
      template: commonPrefix + '/pages/error/error.html',
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
      filename: 'get_started.html',
      template: commonPrefix + '/pages/get_started/get_started.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['landing'],
      filename: 'topic-landing-page.mainpage.html',
      template: commonPrefix + '/pages/landing-page/topic-landing-page.mainpage.html',
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
      filename: 'library-page.mainpage.html',
      template: commonPrefix + '/pages/library-page/library-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['app', 'maintenance'],
      filename: 'maintenance.html',
      template: commonPrefix + '/pages/maintenance/maintenance.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['moderator'],
      filename: 'moderator.html',
      template: commonPrefix + '/pages/moderator/moderator.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'privacy.html',
      template: commonPrefix + '/pages/privacy/privacy.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['notifications_dashboard'],
      filename: 'notifications_dashboard.html',
      template: (
        commonPrefix +
        '/pages/notifications_dashboard/notifications_dashboard.html'
      ),
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['practice_session'],
      filename: 'practice_session.html',
      template: commonPrefix + '/pages/practice_session/practice_session.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['preferences'],
      filename: 'preferences.html',
      template: commonPrefix + '/pages/preferences/preferences.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['profile'],
      filename: 'profile.html',
      template: commonPrefix + '/pages/profile/profile.html',
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
      filename: 'splash.html',
      template: commonPrefix + '/pages/splash/splash.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at0.html',
      template: commonPrefix + '/pages/splash/splash_at0.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['splash'],
      filename: 'splash_at1.html',
      template: commonPrefix + '/pages/splash/splash_at1.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new HtmlWebpackPlugin({
      chunks: ['stewards'],
      filename: 'landing-page-stewards.mainpage.html',
      template:
        commonPrefix + '/pages/landing-page/landing-page-stewards/landing-page-stewards.mainpage.html',
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
      filename: 'topic-editor-page.mainpage.html',
      template: commonPrefix + '/pages/topic-editor-page/topic-editor-page.mainpage.html',
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
      filename: 'topic-viewer-page.mainpage.html',
      template: commonPrefix + '/pages/topic-viewer-page/topic-viewer-page.mainpage.html',
      minify: htmlMinifyConfig,
      inject: false
    }),
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true })
  ]
};
