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
 * @fileoverview Page object for the skill editor page, for use
 * in Protractor tests.
 */

var action = require('./action.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var SkillEditorPage = function() {
  var EDITOR_URL_PREFIX = '/skill_editor/';
  var confirmSkillDifficultyButton = element(
    by.css('.protractor-test-confirm-skill-difficulty-button'));
  var editConceptCardExplanationButton = element(
    by.css('.protractor-test-edit-concept-card'));
  var saveConceptCardExplanationButton = element(
    by.css('.protractor-test-save-concept-card'));
  var conceptCardExplanationText = element(
    by.css('.protractor-test-concept-card-explanation'));
  var addWorkedExampleButton = element(
    by.css('.protractor-test-add-worked-example'));
  var saveWorkedExampleButton = element(
    by.css('.protractor-test-save-worked-example-button'));
  var workedExampleSummary = function(index) {
    return element(by.css('.protractor-test-worked-example-' + index));
  };
  var workedExampleQuestion = element(
    by.css('.protractor-test-worked-example-question')
  ).all(by.tagName('p')).last();
  var workedExampleExplanation = element(
    by.css('.protractor-test-worked-example-explanation')
  ).all(by.tagName('p')).last();
  var workedExampleQuestionField = element(
    by.css('.protractor-test-worked-example-question-field'));
  var workedExampleExplanationField = element(
    by.css('.protractor-test-worked-example-explanation-field'));
  var deleteWorkedExampleButton = function(index) {
    return element(
      by.css('.protractor-test-worked-example-' + index))
      .element(by.css('.oppia-delete-example-button'));
  };
  var confirmDeleteWorkedExample = element(
    by.css('.protractor-test-confirm-delete-worked-example-button'));
  var addMisconceptionButton = element(
    by.css('.protractor-test-add-misconception-modal-button'));
  var misconceptionNameField = element(
    by.css('.protractor-test-misconception-name-field'));
  var misconceptionNotesField = element(
    by.css('.protractor-test-notes-textarea'))
    .all(by.tagName('p')).last();
  var misconceptionFeedbackField = element(
    by.css('.protractor-test-feedback-textarea'))
    .all(by.tagName('p')).last();
  var confirmAddMisconception = element(
    by.css('.protractor-test-confirm-add-misconception-button'));
  var misconceptionListItems = element.all(
    by.css('.protractor-test-misconception-list-item'));
  var misconceptionListContainer = element(
    by.css('.protractor-test-misconception-list-container'));
  var deleteMisconceptionButton = function(index) {
    return element(
      by.css('.protractor-test-misconception-' + index))
      .element(by.css('.oppia-delete-example-button'));
  };
  var confirmDeleteMisconception =
    element(by.css('.protractor-test-confirm-delete-misconception-button'));
  var saveOrPublishSkillButton = element(
    by.css('.protractor-test-save-or-publish-skill')
  );
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));
  var commitMessageField = element(
    by.css('.protractor-test-commit-message-input'));
  var skillDescriptionField = element(
    by.css('.protractor-test-skill-description-field'));
  var questionsTab = element(by.css('.protractor-test-questions-tab'));
  var createQuestionButton = element(
    by.css('.protractor-test-create-question-button'));
  var saveQuestionButton = element(
    by.css('.protractor-test-save-question-button'));
  var questionItems = element.all(
    by.css('.protractor-test-question-list-item'));
  var questionItem = element(by.css('.protractor-test-question-list-item'));

  var saveRubricExplanationButton = element(
    by.css('.protractor-test-save-rubric-explanation-button'));
  var deleteRubricExplanationButton = element(
    by.css('.protractor-test-delete-rubric-explanation-button'));
  var easyRubricDifficulty = element(
    by.css('.protractor-test-skill-difficulty-easy'));
  var skillChangeCount = element(
    by.css('.protractor-test-changes-count-text'));
  var selectRubricDifficulty = element(
    by.css('.protractor-test-select-rubric-difficulty'));

  this.get = async function(skillId) {
    await browser.get(EDITOR_URL_PREFIX + skillId);
    await waitFor.pageToFullyLoad();
  };

  this.selectDifficultyForRubric = async function(difficulty) {
    await waitFor.visibilityOf(
      selectRubricDifficulty, 'Select Rubric takes too long to appear.');
    await action.click(
      'Rubric difficulty option',
      selectRubricDifficulty.element(
        by.cssContainingText('option', difficulty)));
  };

  this.addRubricExplanationForDifficulty = async function(
      difficulty, explanation) {
    await this.selectDifficultyForRubric(difficulty);
    var addRubricExplanationButton = element(
      by.css('.protractor-test-add-explanation-button-' + difficulty));
    await waitFor.elementToBeClickable(
      addRubricExplanationButton,
      'Add Rubric Explanation button takes too long to be clickable');
    await addRubricExplanationButton.click();
    var editor = element(
      by.css('.protractor-test-rubric-explanation-text'));
    await waitFor.visibilityOf(
      editor, 'Rubric explanation editor takes too long to appear');
    await (await browser.switchTo().activeElement()).sendKeys(explanation);
    await waitFor.elementToBeClickable(
      saveRubricExplanationButton,
      'Save Rubric Explanation button takes too long to be clickable');
    await saveRubricExplanationButton.click();
    await waitFor.invisibilityOf(
      saveRubricExplanationButton,
      'Save Rubric Explanation editor takes too long to close.');
  };

  this.deleteRubricExplanationWithIndex = async function(
      difficulty, explIndex) {
    // The edit explanation buttons for all explanations of a difficulty have
    // the same class name and each explanation in it are identified by its
    // index.
    await this.selectDifficultyForRubric(difficulty);
    var editRubricExplanationButtons = element.all(
      by.css('.protractor-test-edit-rubric-explanation-' + difficulty));
    var button = await editRubricExplanationButtons.get(explIndex);
    await waitFor.elementToBeClickable(
      button, 'Edit Rubric Explanation button takes too long to be clickable');
    await button.click();
    var editor = element(
      by.css('.protractor-test-rubric-explanation-text'));
    await waitFor.visibilityOf(
      editor, 'Rubric explanation editor takes too long to appear');
    await deleteRubricExplanationButton.click();
  };

  this.editRubricExplanationWithIndex = async function(
      difficulty, explIndex, explanation) {
    // The edit explanation buttons for all explanations of a difficulty have
    // the same class name and each explanation in it are identified by its
    // index.
    await this.selectDifficultyForRubric(difficulty);
    var editRubricExplanationButtons = element.all(
      by.css('.protractor-test-edit-rubric-explanation-' + difficulty));
    await waitFor.elementToBeClickable(
      await editRubricExplanationButtons.get(explIndex),
      'Edit Rubric Explanation button takes too long to be clickable');
    await editRubricExplanationButtons.get(explIndex).click();
    var editor = element(
      by.css('.protractor-test-rubric-explanation-text'));
    await waitFor.visibilityOf(
      editor, 'Rubric explanation editor takes too long to appear');
    await (await browser.switchTo().activeElement()).sendKeys(explanation);
    await waitFor.elementToBeClickable(
      saveRubricExplanationButton,
      'Save Rubric Explanation button takes too long to be clickable');
    await saveRubricExplanationButton.click();
  };

  this.expectRubricExplanationsToMatch = async function(
      difficulty, explanations) {
    await this.selectDifficultyForRubric(difficulty);
    var rubricExplanationsForDifficulty = element.all(
      by.css('.protractor-test-rubric-explanation-' + difficulty));
    var explanationCount = await rubricExplanationsForDifficulty.count();
    for (var i = 0; i < explanationCount; i++) {
      var text = await (await rubricExplanationsForDifficulty.get(i)).getText();
      expect(text).toMatch(explanations[i]);
    }
  };

  this.expectNumberOfQuestionsToBe = async function(count) {
    await waitFor.visibilityOf(
      questionItem, 'Question takes too long to appear');
    expect(await questionItems.count()).toEqual(count);
  };

  this.saveQuestion = async function() {
    await general.scrollToTop();
    await action.click('Save Question Button', saveQuestionButton);
    await waitFor.pageToFullyLoad();
  };

  this.moveToQuestionsTab = async function() {
    await action.click('Questions tab button', questionsTab);
  };

  this.clickCreateQuestionButton = async function() {
    await action.click('Create Question Button', createQuestionButton);
    await action.click('Easy difficulty for skill', easyRubricDifficulty);
  };

  this.confirmSkillDifficulty = async function() {
    await action.click(
      'Confirm skill difficulty button', confirmSkillDifficultyButton);
  };

  this.changeSkillDescription = async function(description) {
    await action.clear('Skill description', skillDescriptionField);
    await action.sendKeys(
      'Skill description', skillDescriptionField, description);
  };

  this.expectSkillDescriptionToBe = async function(description) {
    await waitFor.visibilityOf(skillDescriptionField, 'Skill description');
    var description = await skillDescriptionField.getAttribute('value');
    expect(description).toEqual(description);
  };

  this.saveOrPublishSkill = async function(commitMessage) {
    await action.click(
      'Save or Publish Skill button', saveOrPublishSkillButton);
    await action.sendKeys('Commit message', commitMessageField, commitMessage);
    await action.click('Close save modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton, 'Save modal takes too long to disappear.');
    await waitFor.invisibilityOf(
      skillChangeCount, 'Skill change count takes too long to update.');
    await waitFor.visibilityOfSuccessToast('Changes Saved.');
    expect(await saveOrPublishSkillButton.isEnabled()).toEqual(false);
  };

  this.editConceptCard = async function(explanation) {
    await action.click(
      'Edit concept card explanation', editConceptCardExplanationButton);

    var editor = element(by.css('.protractor-test-concept-card-text'));
    await waitFor.visibilityOf(
      editor, 'Explanation Editor takes too long to appear');

    await (await browser.switchTo().activeElement()).sendKeys(explanation);

    await action.click(
      'Save Concept Card Explanation Button',
      saveConceptCardExplanationButton);
    await waitFor.invisibilityOf(
      editor, 'Explanation Editor takes too long to close');
  };

  this.expectConceptCardExplanationToMatch = async function(explanation) {
    var text = await conceptCardExplanationText.getText();
    expect(text).toMatch(explanation);
  };

  this.addWorkedExample = async function(question, explanation) {
    await action.click('Add worked example', addWorkedExampleButton);

    var addWorkedExampleModal = (
      element(by.css('.protractor-test-add-worked-example-modal')));
    await waitFor.visibilityOf(
      addWorkedExampleModal,
      'Add Worked Example Modal takes too long to appear');

    await workedExampleQuestion.click();
    await browser.switchTo().activeElement().sendKeys(question);

    await workedExampleExplanation.click();
    await browser.switchTo().activeElement().sendKeys(explanation);

    await action.click(
      'Save worked example', saveWorkedExampleButton);
    await waitFor.invisibilityOf(
      addWorkedExampleModal,
      'Add Worked Example Modal takes too long to close');
  };

  this.deleteWorkedExampleWithIndex = async function(index) {
    await action.click(
      'Delete Worked Example button', deleteWorkedExampleButton(index));

    var deleteWorkedExampleModal = (
      element(by.css('.protractor-test-delete-worked-example-modal')));
    await waitFor.visibilityOf(
      deleteWorkedExampleModal,
      'Delete Worked Example Modal takes too long to appear');

    await action.click(
      'Confirm delete worked example', confirmDeleteWorkedExample);

    await waitFor.invisibilityOf(
      deleteWorkedExampleModal,
      'Delete Worked Example Modal takes too long to close');
  };

  this.expectWorkedExampleSummariesToMatch = async function(
      questions, explanations) {
    // This is declared separately since the expect() statements are in an async
    // callback and so 'index' gets incremented before the check is done. So, we
    // need another variable to track the correct index to check.
    var questionIndexToCheck = 0;
    var explanationIndexToCheck = 0;
    for (var index in questions) {
      await action.click(
        'Worked Example Summary', workedExampleSummary(index));
      await waitFor.visibilityOf(
        workedExampleQuestionField,
        'Worked example question field takes too long to appear.');
      var text = await workedExampleQuestionField.getText();
      expect(text).toMatch(questions[questionIndexToCheck]);
      questionIndexToCheck++;
      await waitFor.visibilityOf(
        workedExampleExplanationField,
        'Worked example explanation field takes too long to appear.');
      var text = await workedExampleExplanationField.getText();
      expect(text).toMatch(explanations[explanationIndexToCheck]);
      explanationIndexToCheck++;
      await action.click(
        'Worked Example Summary', workedExampleSummary(index));
    }
  };

  this.addMisconception = async function(name, notes, feedback) {
    await action.click('Add misconception', addMisconceptionButton);

    var addMisconceptionModal = (
      element(by.css('.protractor-test-add-misconception-modal')));
    await waitFor.visibilityOf(
      addMisconceptionModal,
      'Add Misconception Modal takes too long to appear');

    await misconceptionNameField.click();
    await browser.switchTo().activeElement().sendKeys(name);

    await misconceptionNotesField.click();
    await browser.switchTo().activeElement().sendKeys(notes);

    await misconceptionFeedbackField.click();
    await browser.switchTo().activeElement().sendKeys(feedback);

    await action.click('Confirm add misconception', confirmAddMisconception);

    await waitFor.invisibilityOf(
      addMisconceptionModal,
      'Add Misconception Modal takes too long to close');
  };

  this.expectNumberOfMisconceptionsToBe = async function(number) {
    await waitFor.visibilityOf(
      misconceptionListContainer,
      'Misconception list container takes too long to appear.');
    expect(await misconceptionListItems.count()).toBe(number);
  };

  this.deleteMisconception = async function(index) {
    await action.click(
      'Delete misconception button', deleteMisconceptionButton(index));

    var deleteMisconceptionModal = (
      element(by.css('.protractor-test-delete-misconception-modal')));
    await waitFor.visibilityOf(
      deleteMisconceptionModal,
      'Delete Misconception Modal takes too long to appear');

    await action.click(
      'Confirm delete misconception', confirmDeleteMisconception);

    await waitFor.invisibilityOf(
      deleteMisconceptionModal,
      'Delete Misconception Modal takes too long to close');
  };
};

exports.SkillEditorPage = SkillEditorPage;
