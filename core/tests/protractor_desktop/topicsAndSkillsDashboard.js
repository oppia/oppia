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
 * @fileoverview End-to-end tests for the topics and skills dashboard page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');

var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../protractor_utils/TopicsAndSkillsDashboardPage.js');
var SkillEditorPage = require('../protractor_utils/SkillEditorPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');

describe('Topics and skills dashboard functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var skillEditorPage = null;
  var topicEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;

  beforeAll(async function() {
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAdmin(
      'creator@topicsAndSkillsDashboard.com',
      'creatorTopicsAndSkillsDB');
  });

  beforeEach(async function() {
    await users.login('creator@topicsAndSkillsDashboard.com');
    await topicsAndSkillsDashboardPage.get();
  });

  it('should add a new topic to list and delete it', async function() {
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.createTopic(
      'Topic1 TASD', 'Topic 1 description', true);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.deleteTopicWithIndex(0);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
  });

  it('should filter the topics', async function() {
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.createTopic(
      'Alpha TASD', 'Alpha description', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Beta TASD', 'Beta description', true);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('alp');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('be');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);

    await topicsAndSkillsDashboardPage.filterTopicsByClassroom('Math');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('gamma');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();

    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);
  });

  it('should move published skill to unused skills section', async function() {
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill 2', 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
  });

  it('should move skill to a topic', async function() {
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillWithIndexToTopic(0, 0);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    await topicEditorPage.moveToSubtopicsTab();
    await topicEditorPage.expectNumberOfUncategorizedSkillsToBe(1);
  });

  it('should merge an outside skill with one in a topic', async function() {
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill to be merged', 'Concept card explanation', false);
    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.clickCreateQuestionButton();
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
    await explorationEditorMainTab.setInteraction(
      'TextInput', 'Placeholder', 5);
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();
    await explorationEditorMainTab.addHint('Hint 1');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    await skillEditorPage.saveQuestion();
    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.mergeSkillWithIndexToSkillWithIndex(
      0, 0);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    await topicEditorPage.moveToQuestionsTab();
    await topicEditorPage.expectNumberOfQuestionsForSkillWithDescriptionToBe(
      1, 'Skill 2');
  });

  it('should remove a skill from list once deleted', async function() {
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill to be deleted', 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    await topicsAndSkillsDashboardPage.deleteSkillWithIndex(0);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
