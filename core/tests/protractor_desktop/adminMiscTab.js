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

describe('Admin misc test tab', function() {
  var adminPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var topicId = null;
  var allowedErrors = [];

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();

    await users.createAndLoginAdminUser(
      'miscTabTester@miscTab.com', 'miscTabTester');

    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic('adminPageMiscTabTestTopic',
      'A topic to test the admin page\'s misc tab', false);
    var url = await browser.getCurrentUrl();
    topicId = url.split('/')[4];
    topicId = topicId.substring(2, topicId.length - 1)
    await topicEditorPage.publishTopic();
    await general.closeCurrentTabAndSwitchTo(handle);
  });

  it('should upload and download similarity files', async function() {
    await adminPage.get();
    await adminPage.getMiscTab();
    await adminPage.uploadTopicSimilarities(
      '../data/sample_topic_similarities.csv', true);
    allowedErrors.push('encode', 'Object', 'resource');
    await adminPage.expectSimilaritiesToBeUploaded();
    await browser.refresh();
    await adminPage.uploadTopicSimilarities('../data/cafe.mp3', false);
    await adminPage.downloadSimilarityFile();
    await waitFor.fileToBeDownloaded('topic_similarities.csv');
  });

  it('should clear the search index', async function() {
    await adminPage.clearSearchIndex();
    await adminPage.expectSearchIndexToBeCleared();
  });

  it('should flush migration bot contributions', async function() {
    await adminPage.flushMigrationBotContributions();
    await adminPage.expectMigrationBotContributionsToBeFlushed();
  });

  it('should successfully change the username', async function() {
    await adminPage.changeUsername('miscTabTester', 'mTabChecker');
    await browser.refresh();
    await adminPage.expectUsernameToBeChanged('mTabChecker');
  });

  it('should try to send a test mail to admin', async function() {
    await adminPage.sendTestEmail();
    allowedErrors.push('400', 'emails', 'Object');
    await adminPage.expectEmailError();
  });

  it('should regenerate contribution opportunities for a topic',
    async function() {
      await adminPage.regenerateContributionsForTopic('0');
      await adminPage.expectRegenerationError('0');
      allowedErrors.push('500', 'Entity');
      await adminPage.regenerateContributionsForTopic(topicId);
      await adminPage.expectConributionsToBeRegeneratedForTopic();
    });

  it('should fill out extract data form and extract data', async function() {
    await adminPage.fillExtractDataForm(0, 0, 0, 0);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors(allowedErrors);
  });
});
