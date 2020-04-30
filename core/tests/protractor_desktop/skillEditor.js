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
 * @fileoverview End-to-end tests for the skill editor page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var SkillEditorPage =
  require('../protractor_utils/SkillEditorPage.js');

describe('Skill Editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var skillEditorPage = null;
  var skillId = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    skillEditorPage =
      new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    users.createAndLoginAdminUser(
      'creator@skillEditor.com', 'creatorSkillEditor');
    topicsAndSkillsDashboardPage.get();
    browser.getWindowHandle().then(function(handle) {
      topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
        'Skill 1', 'Concept card explanation', false);
      browser.getCurrentUrl().then(function(url) {
        skillId = url.split('/')[4];
        general.closeCurrentTabAndSwitchTo(handle);
      }, function() {
        // Note to developers:
        // Promise is returned by getCurrentUrl which is handled here.
        // No further action is needed.
      });
    });
  });

  beforeEach(function() {
    users.login('creator@skillEditor.com');
    skillEditorPage.get(skillId);
  });

  it('should edit description and concept card explanation', function() {
    skillEditorPage.changeSkillDescription('Skill 1 edited');
    skillEditorPage.editConceptCard('Test concept card explanation');
    skillEditorPage.saveOrPublishSkill(
      'Changed skill description and added review material.');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.expectSkillDescriptionToBe(
      'Skill 1 edited', 0);

    skillEditorPage.get(skillId);
    skillEditorPage.expectSkillDescriptionToBe('Skill 1 edited');
    skillEditorPage.expectConceptCardExplanationToMatch(
      'Test concept card explanation');
  });

  it('should create and delete worked examples', function() {
    skillEditorPage.addWorkedExample(
      'Example Question 1', 'Example Explanation 1');
    skillEditorPage.addWorkedExample(
      'Example Question 2', 'Example Explanation 2');
    skillEditorPage.saveOrPublishSkill('Added worked examples');

    skillEditorPage.get(skillId);
    skillEditorPage.expectWorkedExampleSummariesToMatch(
      ['Example Question 1', 'Example Question 2'],
      ['Example Explanation 1', 'Example Explanation 2']
    );

    skillEditorPage.deleteWorkedExampleWithIndex(0);
    skillEditorPage.saveOrPublishSkill('Deleted a worked example');

    skillEditorPage.get(skillId);
    skillEditorPage.expectWorkedExampleSummariesToMatch(
      ['Example Question 2'], ['Example Explanation 2']
    );
  });

  it('should edit rubrics for the skill', function() {
    skillEditorPage.expectRubricExplanationsToMatch(
      'Easy', ['Explanation for easy difficulty']);
    skillEditorPage.expectRubricExplanationsToMatch(
      'Medium', ['Skill 1', 'Explanation for medium difficulty']);
    skillEditorPage.expectRubricExplanationsToMatch(
      'Hard', ['Explanation for hard difficulty']);

    skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    skillEditorPage.addRubricExplanationForDifficulty(
      'Medium', 'Second explanation for medium difficulty.');
    skillEditorPage.addRubricExplanationForDifficulty(
      'Hard', 'Second explanation for hard difficulty.');

    skillEditorPage.editRubricExplanationWithIndex(
      'Easy', 0, 'Easy explanation 1 edited');
    skillEditorPage.editRubricExplanationWithIndex(
      'Easy', 1, 'Easy explanation 2 edited');
    skillEditorPage.editRubricExplanationWithIndex(
      'Medium', 1, 'Medium explanation 1 edited');
    skillEditorPage.editRubricExplanationWithIndex(
      'Medium', 2, 'Medium explanation 2 edited');
    skillEditorPage.deleteRubricExplanationWithIndex('Medium', 0);
    skillEditorPage.editRubricExplanationWithIndex(
      'Hard', 0, 'Hard explanation 1 edited');
    skillEditorPage.editRubricExplanationWithIndex(
      'Hard', 1, 'Hard explanation 2 edited');

    skillEditorPage.saveOrPublishSkill('Edited rubrics');

    skillEditorPage.get(skillId);
    skillEditorPage.expectRubricExplanationsToMatch(
      'Easy', ['Easy explanation 1 edited', 'Easy explanation 2 edited']);
    skillEditorPage.expectRubricExplanationsToMatch(
      'Medium', ['Medium explanation 1 edited', 'Medium explanation 2 edited']);
    skillEditorPage.expectRubricExplanationsToMatch(
      'Hard', ['Hard explanation 1 edited', 'Hard explanation 2 edited']);
  });

  it('should create a question for the skill', function() {
    skillEditorPage.moveToQuestionsTab();
    skillEditorPage.clickCreateQuestionButton();
    skillEditorPage.confirmSkillDifficulty();
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

    skillEditorPage.get(skillId);
    skillEditorPage.moveToQuestionsTab();
    skillEditorPage.expectNumberOfQuestionsToBe(1);
  });

  it('should create and delete misconceptions', function() {
    skillEditorPage.addMisconception(
      'Misconception 1', 'Notes 1', 'Feedback 1');
    skillEditorPage.addMisconception(
      'Misconception 2', 'Notes 2', 'Feedback 2');
    skillEditorPage.saveOrPublishSkill('Added misconceptions');

    skillEditorPage.get(skillId);
    skillEditorPage.expectNumberOfMisconceptionsToBe(2);

    skillEditorPage.deleteMisconception(1);
    skillEditorPage.saveOrPublishSkill('Deleted a misconception');

    skillEditorPage.get(skillId);
    skillEditorPage.expectNumberOfMisconceptionsToBe(1);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
