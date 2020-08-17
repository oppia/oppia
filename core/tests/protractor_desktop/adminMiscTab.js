// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for admin page functionality.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');

describe('Admin misc tab', function() {
  var adminPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var topicId = null;
  var allowedErrors = [];
  const topicName = 'MiscTabTestTopic';

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();

    await users.createAndLoginAdminUser(
      'miscTabTester@miscTab.com', 'miscTabTester');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(topicName,
      'admin-misc-tab-test', 'A topic to test the Admin Page\'s Misc Tab',
      false);
    var url = await browser.getCurrentUrl();
    topicId = url.split('/')[4].substring(0, 12);
    await adminPage.get();
    await adminPage.getMiscTab();
  });

  it('should upload and download similarity files', async function() {
    await adminPage.uploadTopicSimilarities(
      '../data/sample_topic_similarities.csv', true);
    await adminPage.expectSimilaritiesToBeUploaded();
    await adminPage.uploadTopicSimilarities('../data/cafe.mp3', false);
    // We uploaded an invalid file (cafe.mp3), so we expect the errors below.
    allowedErrors.push('encode', 'Object', 'resource');
    await adminPage.downloadSimilarityFile();
    await waitFor.fileToBeDownloaded('topic_similarities.csv');
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await waitFor.fileToBeDownloaded('topic_similarities.csv');
  });

  it('should clear the search index', async function() {
    await adminPage.clearSearchIndex();
  });

  it('should flush migration bot contributions', async function() {
    await adminPage.flushMigrationBotContributions();
  });

  it('should successfully change the username', async function() {
    await adminPage.changeUsername('miscTabTester', 'mTabChecker');
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await adminPage.expectUsernameToBeChanged('mTabChecker');
  });

  it('should generate SVGs for explorations', async function() {
    await adminPage.generateSVG();
  });

  it('should regenerate contribution opportunities for a topic',
    async function() {
      await adminPage.regenerateContributionsForTopic('0', false);
      // These errors come from supplying '0' as the topic ID (invalid)
      allowedErrors.push('500', 'id 0', 'Entity', 'Object');
      await adminPage.regenerateContributionsForTopic(topicId, true);
    });

  it('should send a test mail to admin', async function() {
    // Locally, Oppia is unable to send emails, hence we expect errors.
    await adminPage.sendTestEmailToAdminAndExpectError();
    allowedErrors.push('400', 'Object', 'This app cannot send emails.');
  });

  it('should extract data', async function() {
    await adminPage.extractDataAndExpectExtraction('0', '0', '0', '0');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors(allowedErrors);
  });
});
