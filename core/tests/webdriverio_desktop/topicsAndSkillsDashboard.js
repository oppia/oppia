// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');

var Constants = require('../webdriverio_utils/WebdriverioConstants.js');
var ExplorationEditorPage = require(
  '../webdriverio_utils/ExplorationEditorPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');


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
    await users.createAndLoginCurriculumAdminUser(
      'creator@topicsAndSkillsDashboard.com',
      'creatorTopicsAndSkillsDB');
  });

  beforeEach(async function() {
    await topicsAndSkillsDashboardPage.get();
  });

  it('should assign, unassign, create and delete a skill', async function() {
    let TOPIC_NAME = 'Topic1 TASD';
    let SKILL_NAME = 'skill1 TASD';
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, 'topic-tasd-one', 'Topic 1 description', true);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(TOPIC_NAME);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);

    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        SKILL_NAME, 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.filterSkillsByStatus(
      Constants.SKILL_STATUS_UNASSIGNED);
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      SKILL_NAME, TOPIC_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();

    await topicsAndSkillsDashboardPage.unassignSkillFromTopic(
      SKILL_NAME, TOPIC_NAME);
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
    await topicsAndSkillsDashboardPage.deleteSkillWithName(SKILL_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.searchSkillByName(SKILL_NAME);
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(TOPIC_NAME);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.deleteTopicWithName(TOPIC_NAME);
    let topicsTableIsPresent = (
      await topicsAndSkillsDashboardPage.isTopicTablePresent());
    if (topicsTableIsPresent) {
      await topicsAndSkillsDashboardPage.filterTopicsByKeyword(TOPIC_NAME);
      await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    }
  });

  it('should filter the topics', async function() {
    let TOPIC_ALPHA = 'Alpha TASD';
    let TOPIC_BETA = 'Beta TASD';
    let topicsTableIsPresent = (
      await topicsAndSkillsDashboardPage.isTopicTablePresent());
    if (topicsTableIsPresent) {
      await topicsAndSkillsDashboardPage.filterTopicsByKeyword(TOPIC_ALPHA);
      await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
      await topicsAndSkillsDashboardPage.resetTopicFilters();
      await topicsAndSkillsDashboardPage.filterTopicsByKeyword(TOPIC_BETA);
      await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    }
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_ALPHA, 'alpha-tasd', 'Alpha description', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_BETA, 'beta-tasd', 'Beta description', true);

    await topicsAndSkillsDashboardPage.get();
    let topicsCount = await topicsAndSkillsDashboardPage.getTopicsCount();
    await topicsAndSkillsDashboardPage.filterTopicsByKeyword(
      TOPIC_ALPHA + '\n' + TOPIC_BETA);
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(topicsCount);

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('alp');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(topicsCount);

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('be');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(topicsCount);

    await topicsAndSkillsDashboardPage.filterTopicsByClassroom('math');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(topicsCount);

    await topicsAndSkillsDashboardPage.filterTopicsByKeyword('gamma');
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.resetTopicFilters();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(topicsCount);
  });

  it('should move skill to a topic', async function() {
    let SKILL_NAME = 'skill2 TASD';
    let TOPIC_NAME = 'Topic2 TASD';
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, 'topic-tasd-two', 'Topic 2 description', true);
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        SKILL_NAME, 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      SKILL_NAME, TOPIC_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    await topicEditorPage.expectNumberOfUncategorizedSkillsToBe(1);
  });

  it('should merge an outside skill with one in a topic', async function() {
    let SKILL_NAME = 'skill3 TASD';
    let TOPIC_NAME = 'Topic3 TASD';
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, 'topic-tasd-three', 'Topic 3 description', true);
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        SKILL_NAME, 'Concept card explanation', true);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      SKILL_NAME, TOPIC_NAME);
    await topicsAndSkillsDashboardPage.get();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill to be merged', 'Concept card explanation', false);
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    var url = await browser.getUrl();
    skillId = url.split('/')[4];
    await skillEditorPage.get(skillId);

    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.clickCreateQuestionButton();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'), true);
    await explorationEditorMainTab.setInteraction(
      'TextInput', 'Placeholder', 5);
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', ['correct']);
    var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();
    await (
      await explorationEditorMainTab.getResponseEditor('default')
    ).setFeedback(await forms.toRichText('Try again'));
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
      'Skill to be merged', SKILL_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    await topicEditorPage.moveToQuestionsTab();
    await topicEditorPage.expectNumberOfQuestionsForSkillWithDescriptionToBe(
      1, SKILL_NAME);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.logout();
  });
});
