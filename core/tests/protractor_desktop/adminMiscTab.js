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
 * @fileoverview End-to-end tests for admin page functionality.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');

describe('Admin misc test tab', function() {
  var adminPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var topicId = null;
  var allowedErrors = ['Failed to load resource', 'Object', 'Entity',
    '500', 'encode'];

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();

    await users.createAndLoginAdminUser(
      'miscTabTester@miscTab.com', 'miscTabTester');

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic('miscTabTopic',
      'A topic to test the misc tab', false);
    await browser.getCurrentUrl().then((url) => {
      var startIndex = url.split('/', 4).join('/').length + 1;
      topicId = url.substring(startIndex, url.length - 2);
    });
    await topicEditorPage.publishTopic();
  });

  it('should upload similarity file', async function() {
    await adminPage.get();
    await adminPage.getMiscTab();
    await adminPage.uploadTopicSimilarities(
      '../data/sample_topic_similarities.csv');
    await adminPage.expectSimilaritiesToBeUploaded();
    await adminPage.uploadTopicSimilarities('../data/cafe.mp3');
    await adminPage.expectUploadError();
  });

  it('should download similarity files', async function() {
    await adminPage.downloadSimilarityFile();
    await adminPage.expectFileToBeDownloaded();
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
    await adminPage.expectUsernameToBeChanged('miscTabTester', 'mTabChecker');
  });

  it('should regenerate contribution opportunities for a topic',
    async function() {
      await adminPage.regenerateContributionsForTopic('0');
      await adminPage.expectRegenerationError('0');
      await adminPage.regenerateContributionsForTopic(topicId.substring(1));
      await adminPage.expectConributionsToBeRegeneratedForTopic();
    });

  it('should fill out extract data form and extract data', async function() {
    await adminPage.fillAndSubmitExtractDataForm(0, 0, 0, 0);
    await adminPage.expectAllDataToBeExtracted();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors(allowedErrors);
  });
});
