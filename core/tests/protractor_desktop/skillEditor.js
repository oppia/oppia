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

  beforeAll(async function() {
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAndLoginAdminUser(
      'creator@skillEditor.com', 'creatorSkillEditor');
    await topicsAndSkillsDashboardPage.get();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill 1', 'Concept card explanation', false);
    var url = await browser.getCurrentUrl();
    skillId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
  });

  beforeEach(async function() {
    await users.login('creator@skillEditor.com');
    await skillEditorPage.get(skillId);
  });

  it('should edit description and concept card explanation', async function() {
    await skillEditorPage.changeSkillDescription('Skill 1 edited');
    await skillEditorPage.editConceptCard('Test concept card explanation');
    await skillEditorPage.saveOrPublishSkill(
      'Changed skill description and added review material.');

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectSkillDescriptionToBe(
      'Skill 1 edited', 0);

    await skillEditorPage.get(skillId);
    await skillEditorPage.expectSkillDescriptionToBe('Skill 1 edited');
    await skillEditorPage.expectConceptCardExplanationToMatch(
      'Test concept card explanation');
  });

  it('should create and delete worked examples', async function() {
    await skillEditorPage.addWorkedExample(
      'Example Question 1', 'Example Explanation 1');
    await skillEditorPage.addWorkedExample(
      'Example Question 2', 'Example Explanation 2');
    await skillEditorPage.saveOrPublishSkill('Added worked examples');

    await skillEditorPage.get(skillId);
    await skillEditorPage.expectWorkedExampleSummariesToMatch(
      ['Example Question 1', 'Example Question 2'],
      ['Example Explanation 1', 'Example Explanation 2']
    );

    await skillEditorPage.deleteWorkedExampleWithIndex(0);
    await skillEditorPage.saveOrPublishSkill('Deleted a worked example');

    await skillEditorPage.get(skillId);
    await skillEditorPage.expectWorkedExampleSummariesToMatch(
      ['Example Question 2'], ['Example Explanation 2']
    );
  });

  it('should edit rubrics for the skill', async function() {
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Explanation for easy difficulty');
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Medium', 'Explanation for medium difficulty');
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Hard', 'Explanation for hard difficulty');

    await skillEditorPage.expectRubricExplanationsToMatch(
      'Easy', ['Explanation for easy difficulty']);
    await skillEditorPage.expectRubricExplanationsToMatch(
      'Medium', ['Skill 1', 'Explanation for medium difficulty']);
    await skillEditorPage.expectRubricExplanationsToMatch(
      'Hard', ['Explanation for hard difficulty']);

    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Medium', 'Second explanation for medium difficulty.');
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Hard', 'Second explanation for hard difficulty.');

    await skillEditorPage.editRubricExplanationWithIndex(
      'Easy', 0, 'Easy explanation 1 edited');
    await skillEditorPage.editRubricExplanationWithIndex(
      'Easy', 1, 'Easy explanation 2 edited');
    await skillEditorPage.editRubricExplanationWithIndex(
      'Medium', 1, 'Medium explanation 1 edited');
    await skillEditorPage.editRubricExplanationWithIndex(
      'Medium', 2, 'Medium explanation 2 edited');
    await skillEditorPage.deleteRubricExplanationWithIndex('Medium', 0);
    await skillEditorPage.editRubricExplanationWithIndex(
      'Hard', 0, 'Hard explanation 1 edited');
    await skillEditorPage.editRubricExplanationWithIndex(
      'Hard', 1, 'Hard explanation 2 edited');

    await skillEditorPage.saveOrPublishSkill('Edited rubrics');

    await skillEditorPage.get(skillId);
    await skillEditorPage.expectRubricExplanationsToMatch(
      'Easy', ['Easy explanation 1 edited', 'Easy explanation 2 edited']
    );
    await skillEditorPage.expectRubricExplanationsToMatch(
      'Medium', ['Medium explanation 1 edited', 'Medium explanation 2 edited']
    );
    await skillEditorPage.expectRubricExplanationsToMatch(
      'Hard', ['Hard explanation 1 edited', 'Hard explanation 2 edited']);
  });

  it('should create a question for the skill', async function() {
    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.clickCreateQuestionButton();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
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

    await skillEditorPage.get(skillId);
    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.expectNumberOfQuestionsToBe(1);
  });

  it('should create and delete misconceptions', async function() {
    await skillEditorPage.addMisconception(
      'Misconception 1', 'Notes 1', 'Feedback 1');
    await skillEditorPage.addMisconception(
      'Misconception 2', 'Notes 2', 'Feedback 2');
    await skillEditorPage.saveOrPublishSkill('Added misconceptions');

    await skillEditorPage.get(skillId);
    await skillEditorPage.expectNumberOfMisconceptionsToBe(2);

    await skillEditorPage.deleteMisconception(1);
    await skillEditorPage.saveOrPublishSkill('Deleted a misconception');

    await skillEditorPage.get(skillId);
    await skillEditorPage.expectNumberOfMisconceptionsToBe(1);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
