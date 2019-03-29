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
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
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

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    skillEditorPage =
      new SkillEditorPage.SkillEditorPage();
    topicEditorPage =
      new TopicEditorPage.TopicEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    users.createAdmin('creator@topicsAndSkillsDashboard.com',
      'creatorTopicsAndSkillsDashboard');
  });

  beforeEach(function() {
    users.login('creator@topicsAndSkillsDashboard.com');
    topicsAndSkillsDashboardPage.get();
  });

  it('should add a new topic to list', function() {
    topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    topicsAndSkillsDashboardPage.createTopicWithTitle('Topic 1');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
  });

  it('should add a new unpublished skill to list', function() {
    topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();

    topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);
    topicsAndSkillsDashboardPage.createSkillWithDescription('Skill 1');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.navigateToUnpublishedSkillsTab();
    topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
  });

  it('should move published skill to unused skills section', function() {
    topicsAndSkillsDashboardPage.createSkillWithDescription('Skill 2');
    skillEditorPage.editConceptCard('Concept card explanation');
    skillEditorPage.saveOrPublishSkill('Added review material.');
    skillEditorPage.firstTimePublishSkill();
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
  });

  it('should move skill to a topic', function() {
    topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    topicsAndSkillsDashboardPage.assignSkillWithIndexToTopic(0, 0);
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.expectNumberOfUncategorizedSkillsToBe(1);
  });

  it('should merge an outside skill with one in a topic', function() {
    topicsAndSkillsDashboardPage.createSkillWithDescription(
      'Skill to be merged');
    skillEditorPage.editConceptCard('Concept card explanation');
    skillEditorPage.saveOrPublishSkill('Added review material.');
    skillEditorPage.moveToQuestionsTab();
    skillEditorPage.clickCreateQuestionButton();
    explorationEditorMainTab.setContent(forms.toRichText('Question 1'));
    explorationEditorMainTab.setInteraction('TextInput', 'Placeholder', 5);
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    explorationEditorMainTab.getResponseEditor(0).markAsCorrect();
    explorationEditorMainTab.addHint('Hint 1');
    explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    skillEditorPage.saveQuestion();
    skillEditorPage.firstTimePublishSkill();
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    topicsAndSkillsDashboardPage.mergeSkillWithIndexToSkillWithIndex(0, 0);
    topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    topicEditorPage.moveToQuestionsTab();
    topicEditorPage.expectNumberOfQuestionsToBe(1);
  });

  it('should remove a skill from list once deleted', function() {
    topicsAndSkillsDashboardPage.navigateToUnpublishedSkillsTab();
    topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    topicsAndSkillsDashboardPage.deleteSkillWithIndex(0);

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);
  });

  it('should remove a topic from list once deleted', function() {
    topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    topicsAndSkillsDashboardPage.deleteTopicWithIndex(0);

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
