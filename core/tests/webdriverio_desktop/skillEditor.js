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
 * @fileoverview End-to-end tests for the skill editor page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var TopicsAndSkillsDashboardPage =
  require('../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var SkillEditorPage =
  require('../webdriverio_utils/SkillEditorPage.js');

describe('Skill Editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var skillEditorPage = null;
  var skillId = null;
  var explorationEditorPage = null;

  beforeAll(async function() {
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAndLoginCurriculumAdminUser(
      'creator@skillEditor.com', 'creatorSkillEditor');
    await topicsAndSkillsDashboardPage.get();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill 1', 'Concept card explanation', false);
    var url = await browser.getUrl();
    skillId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
    await users.logout();
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

  it('should create and edit a question for the skill', async function() {
    await workflow.createQuestion();
    await skillEditorPage.get(skillId);
    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.expectNumberOfQuestionsToBe(1);
    await skillEditorPage.expectQuestionInteractionIdToMatch('TextInput');
    await skillEditorPage.clickEditQuestionButton();
    await workflow.changeQuestionInteraction();
    await skillEditorPage.saveChangesToQuestion('Updated Question');
    await skillEditorPage.expectQuestionInteractionIdToMatch('NumericInput');
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

  it('should show stale tab and unsaved changes status info modals',
    async function() {
      await topicsAndSkillsDashboardPage.get();
      var handle = await browser.getWindowHandle();
      await topicsAndSkillsDashboardPage
        .createSkillWithDescriptionAndExplanation(
          'Skill 2', 'Concept card explanation', false);
      await browser.switchToWindow(handle);
      await topicsAndSkillsDashboardPage
        .navigateToSkillWithDescription('Skill 2');

      var handles = await browser.getWindowHandles();

      await skillEditorPage.changeSkillDescription('new description');
      await browser.switchToWindow(handles[handles.length - 1]);
      await skillEditorPage.expectUnsavedChangesStatusInfoModalToBeVisible();

      await browser.switchToWindow(handles[handles.length - 2]);
      await skillEditorPage.saveOrPublishSkill('Changed skill description.');
      await browser.switchToWindow(handles[handles.length - 1]);
      await skillEditorPage.expectStaleTabInfoModalToBeVisible();

      await general.closeCurrentTabAndSwitchTo(handles[handles.length - 2]);
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
