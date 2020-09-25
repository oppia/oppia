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

var Constants = require('../protractor_utils/ProtractorConstants.js');
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

  it('should assign, unassign, create and delete a skill', async function() {
    let topicName = 'Topic1 TASD';
    let skillName = 'skill1 TASD'
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.createTopic(
      topicName, 'topic-tasd-one', 'Topic 1 description', true);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicName);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);

    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        skillName, 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.filterSkillsByStatus(
      Constants.SKILL_STATUS_UNASSIGNED);
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      skillName, topicName);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();

    await topicsAndSkillsDashboardPage.unassignSkillFromTopic(
      skillName, topicName);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.filterSkillsByStatus(
      Constants.SKILL_STATUS_ASSIGNED);
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.filterSkillsByStatus(
      Constants.SKILL_STATUS_UNASSIGNED);
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.deleteSkillWithName(skillName);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.searchSkillByName(skillName);
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicName);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.deleteTopicWithName(topicName);
    let topicsTableIsPresent = (
      await topicsAndSkillsDashboardPage.isTopicTablePresent());
    if (topicsTableIsPresent) {
      await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicName);
      await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    }
  });

  it('should filter the topics', async function() {
    let topicNameAlpha = 'Alpha TASD';
    let topicNameBeta = 'Beta TASD';
    let topicsTableIsPresent = (
      await topicsAndSkillsDashboardPage.isTopicTablePresent());
    if (topicsTableIsPresent) {
      await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicNameAlpha);
      await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
      await topicsAndSkillsDashboardPage.resetTopicFilters();
      await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicNameBeta);
      await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    }
    await topicsAndSkillsDashboardPage.createTopic(
      topicNameAlpha, 'alpha-tasd', 'Alpha description', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      topicNameBeta, 'beta-tasd', 'Beta description', true);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicNameAlpha);
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(topicNameBeta);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);
    await topicsAndSkillsDashboardPage.resetTopicFilters();

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('alp');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('be');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();

    await topicsAndSkillsDashboardPage.filterTopicsByClassroom('Math');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('gamma');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
  });

  it('should move skill to a topic', async function() {
    let skillName = 'skill2 TASD';
    let topicName = 'Topic2 TASD';
    await topicsAndSkillsDashboardPage.createTopic(
      topicName, 'topic-tasd-two', 'Topic 2 description', true);
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        skillName, 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      skillName, topicName);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.expectNumberOfUncategorizedSkillsToBe(1);
  });

  it('should merge an outside skill with one in a topic', async function() {
    let skillName = 'skill3 TASD';
    let topicName = 'Topic3 TASD';
    await topicsAndSkillsDashboardPage.createTopic(
      topicName, 'topic-tasd-three', 'Topic 3 description', true);
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        skillName, 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      skillName, topicName);
    await topicsAndSkillsDashboardPage.get();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill to be merged', 'Concept card explanation', false);
    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.clickCreateQuestionButton();
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
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.filterSkillsByStatus(
      Constants.SKILL_STATUS_UNASSIGNED);
    await topicsAndSkillsDashboardPage.mergeSkills(
      'Skill to be merged', skillName);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.moveToQuestionsTab();
    await topicEditorPage.expectNumberOfQuestionsForSkillWithDescriptionToBe(
      1, skillName);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
