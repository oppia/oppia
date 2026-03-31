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
 * @fileoverview Page object for the skill editor page, for use
 * in WebdriverIO tests.
 */

var action = require('./action.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var SkillEditorPage = function () {
  var EDITOR_URL_PREFIX = '/skill_editor/';
  var addMisconceptionButton = $('.e2e-test-add-misconception-modal-button');
  var addMisconceptionModal = $('.e2e-test-add-misconception-modal');
  var closeSaveModalButton = $('.e2e-test-close-save-modal-button');
  var commitMessageField = $('.e2e-test-commit-message-input');
  var conceptCardExplanationEditorInput = $(
    '.e2e-test-concept-card-text .e2e-test-rte'
  );
  var conceptCardExplanationText = $('.e2e-test-concept-card-explanation');
  var conceptCardTextElement = $('.e2e-test-concept-card-text');
  var confirmAddMisconception = $('.e2e-test-confirm-add-misconception-button');
  var confirmDeleteMisconception = $(
    '.e2e-test-confirm-delete-misconception-button'
  );
  var confirmSkillDifficultyButton = $(
    '.e2e-test-confirm-skill-difficulty-button'
  );
  var createQuestionButton = $('.e2e-test-create-question-button');
  var editQuestionButton = $('.e2e-test-edit-question-button');
  var deleteExampleButtonLocator = '.e2e-test-delete-example-button';
  var deleteMisconceptionButton = function (index) {
    return $(`.e2e-test-misconception-${index}`).$(deleteExampleButtonLocator);
  };
  var deleteMisconceptionModal = $('.e2e-test-delete-misconception-modal');
  var deleteRubricExplanationButton = $(
    '.e2e-test-delete-rubric-explanation-button'
  );

  var easyRubricDifficulty = $('.e2e-test-skill-difficulty-easy');
  var editConceptCardExplanationButton = $('.e2e-test-edit-concept-card');
  var misconceptionFeedbackField = $(
    '.e2e-test-feedback-textarea .e2e-test-rte'
  );
  var misconceptionListContainer = $('.e2e-test-misconception-list-container');
  var misconceptionListItemsSelector = function () {
    return $$('.e2e-test-misconception-list-item');
  };
  var misconceptionNameField = $('.e2e-test-misconception-name-field');
  var misconceptionNotesField = $('.e2e-test-notes-textarea .e2e-test-rte');
  var questionInteractionId = $('.e2e-test-question-interaction-id');
  var questionItem = $('.e2e-test-question-list-item');
  var questionItemsSelector = function () {
    return $$('.e2e-test-question-list-item');
  };
  var questionsTab = $('.e2e-test-questions-tab');
  var rubricExplanationEditorElement = $('.e2e-test-rubric-explanation-text');
  var rubricExplanationEditorInput = $(
    '.e2e-test-rubric-explanation-text .e2e-test-rte'
  );
  var saveConceptCardExplanationButton = $('.e2e-test-save-concept-card');
  var saveOrPublishSkillButton = $('.e2e-test-save-or-publish-skill');
  var saveQuestionButton = $('.e2e-test-save-question-button');
  var saveRubricExplanationButton = $(
    '.e2e-test-save-rubric-explanation-button'
  );
  var selectRubricDifficulty = $('.e2e-test-select-rubric-difficulty');
  var skillChangeCount = $('.e2e-test-changes-count-text');
  var skillDescriptionField = $('.e2e-test-skill-description-field');
  var staleTabInfoModal = $('.e2e-test-stale-tab-info-modal');
  var unsavedChangesStatusInfoModal = $('.e2e-test-unsaved-changes-info-modal');

  this.get = async function (skillId) {
    await browser.url(EDITOR_URL_PREFIX + skillId);
    await waitFor.pageToFullyLoad();
  };

  this.selectDifficultyForRubric = async function (difficulty) {
    await waitFor.visibilityOf(
      selectRubricDifficulty,
      'Select Rubric takes too long to appear.'
    );
    await selectRubricDifficulty.selectByVisibleText(difficulty);
  };

  this.addRubricExplanationForDifficulty = async function (
    difficulty,
    explanation
  ) {
    await this.selectDifficultyForRubric(difficulty);
    var addRubricExplanationButton = $(
      `.e2e-test-add-explanation-button-${difficulty}`
    );
    await action.click(
      'Add rubric explanation button',
      addRubricExplanationButton
    );
    await action.setValue(
      'Rubric explanation editor input',
      rubricExplanationEditorInput,
      explanation,
      true
    );
    await action.click(
      'Save rubric explanation button',
      saveRubricExplanationButton
    );
    await waitFor.invisibilityOf(
      saveRubricExplanationButton,
      'Save Rubric Explanation editor takes too long to close.'
    );
  };

  this.deleteRubricExplanationWithIndex = async function (
    difficulty,
    explIndex
  ) {
    // The edit explanation buttons for all explanations of a difficulty have
    // the same class name and each explanation in it are identified by its
    // index.
    await this.selectDifficultyForRubric(difficulty);
    var editRubricExplanationButtons = await $$(
      `.e2e-test-edit-rubric-explanation-${difficulty}`
    );
    var button = editRubricExplanationButtons[explIndex];
    await action.click(`Edit rubric explanation button ${explIndex}`, button);
    await waitFor.visibilityOf(
      rubricExplanationEditorElement,
      'Rubric explanation editor takes too long to appear'
    );
    await action.click(
      'Delete rubric explanation button',
      deleteRubricExplanationButton
    );
  };

  this.editRubricExplanationWithIndex = async function (
    difficulty,
    explIndex,
    explanation
  ) {
    // The edit explanation buttons for all explanations of a difficulty have
    // the same class name and each explanation in it are identified by its
    // index.
    await this.selectDifficultyForRubric(difficulty);
    var editRubricExplanationButtons = await $$(
      `.e2e-test-edit-rubric-explanation-${difficulty}`
    );
    await action.click(
      `Edit rubric explanation button ${explIndex}`,
      editRubricExplanationButtons[explIndex]
    );
    await action.setValue(
      'Rubric explanation editor input',
      rubricExplanationEditorInput,
      explanation,
      true
    );
    await action.click(
      'Save rubric explanation button',
      saveRubricExplanationButton
    );
  };

  this.expectRubricExplanationsToMatch = async function (
    difficulty,
    explanations
  ) {
    await this.selectDifficultyForRubric(difficulty);
    var rubricExplanationsForDifficulty = await $$(
      `.e2e-test-rubric-explanation-${difficulty}`
    );
    var explanationCount = rubricExplanationsForDifficulty.length;
    for (var i = 0; i < explanationCount; i++) {
      var text = await action.getText(
        `Rubric explanations for difficulty ${i}`,
        rubricExplanationsForDifficulty[i]
      );
      expect(text).toMatch(explanations[i]);
    }
  };

  this.expectNumberOfQuestionsToBe = async function (count) {
    await waitFor.visibilityOf(
      questionItem,
      'Question takes too long to appear'
    );
    var questionItems = await questionItemsSelector();
    expect(questionItems.length).toEqual(count);
  };

  this.saveQuestion = async function () {
    await general.scrollToTop();
    await action.click('Save Question Button', saveQuestionButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickEditQuestionButton = async function () {
    await action.click('Edit Question Button', editQuestionButton);
    await waitFor.pageToFullyLoad();
  };

  this.moveToQuestionsTab = async function () {
    await action.click('Questions tab button', questionsTab);
  };

  this.clickCreateQuestionButton = async function () {
    await action.click('Create Question Button', createQuestionButton);
    await action.click('Easy difficulty for skill', easyRubricDifficulty);
  };

  this.confirmSkillDifficulty = async function () {
    await action.click(
      'Confirm skill difficulty button',
      confirmSkillDifficultyButton
    );
  };

  this.changeSkillDescription = async function (description) {
    await action.clear('Skill description', skillDescriptionField);
    await action.setValue(
      'Skill description',
      skillDescriptionField,
      description
    );
  };

  this.expectSkillDescriptionToBe = async function (description) {
    await waitFor.visibilityOf(skillDescriptionField, 'Skill description');
    var description = await action.getAttribute(
      'Skill description field',
      skillDescriptionField,
      'value'
    );
    expect(description).toEqual(description);
  };

  this.saveOrPublishSkill = async function (commitMessage) {
    await action.click(
      'Save or Publish Skill button',
      saveOrPublishSkillButton
    );
    await action.setValue('Commit message', commitMessageField, commitMessage);
    await action.click('Close save modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Save modal takes too long to disappear.'
    );
    await waitFor.invisibilityOf(
      skillChangeCount,
      'Skill change count takes too long to update.'
    );
    await waitFor.visibilityOfSuccessToast('Changes Saved.');
    expect(await saveOrPublishSkillButton.isEnabled()).toEqual(false);
  };

  this.saveChangesToQuestion = async function (commitMessage) {
    await general.scrollToTop();
    await action.click('Save Question Button', saveQuestionButton);
    await action.setValue('Commit message', commitMessageField, commitMessage);
    await action.click('Close save modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Save modal takes too long to disappear.'
    );
    await waitFor.pageToFullyLoad();
  };

  this.expectQuestionInteractionIdToMatch = async function (interactionId) {
    var text = await action.getText(
      'Question Interaction Id',
      questionInteractionId
    );
    expect(text).toMatch(interactionId);
  };

  this.editConceptCard = async function (explanation) {
    await action.click(
      'Edit concept card explanation',
      editConceptCardExplanationButton
    );

    await action.setValue(
      'Concept card explanation editor input',
      conceptCardExplanationEditorInput,
      explanation,
      true
    );

    await action.click(
      'Save Concept Card Explanation Button',
      saveConceptCardExplanationButton
    );
    await waitFor.invisibilityOf(
      conceptCardTextElement,
      'Concept card text Editor takes too long to close'
    );
  };

  this.expectConceptCardExplanationToMatch = async function (explanation) {
    var text = await action.getText(
      'Concept card explanation text',
      conceptCardExplanationText
    );
    expect(text).toMatch(explanation);
  };

  this.addMisconception = async function (name, notes, feedback) {
    await action.click('Add misconception', addMisconceptionButton);

    await waitFor.visibilityOf(
      addMisconceptionModal,
      'Add Misconception Modal takes too long to appear'
    );
    await action.setValue(
      'Misconception name field',
      misconceptionNameField,
      name,
      true
    );

    await action.setValue(
      'Misconception notes field',
      misconceptionNotesField,
      notes,
      true
    );

    await action.setValue(
      'Misconception notes field',
      misconceptionFeedbackField,
      feedback,
      true
    );

    await action.click('Confirm add misconception', confirmAddMisconception);

    await waitFor.invisibilityOf(
      addMisconceptionModal,
      'Add Misconception Modal takes too long to close'
    );
  };

  this.expectNumberOfMisconceptionsToBe = async function (number) {
    await waitFor.visibilityOf(
      misconceptionListContainer,
      'Misconception list container takes too long to appear.'
    );
    var misconceptionListItems = await misconceptionListItemsSelector();
    expect(misconceptionListItems.length).toBe(number);
  };

  this.deleteMisconception = async function (index) {
    await action.click(
      'Delete misconception button',
      deleteMisconceptionButton(index)
    );

    await waitFor.visibilityOf(
      deleteMisconceptionModal,
      'Delete Misconception Modal takes too long to appear'
    );

    await action.click(
      'Confirm delete misconception',
      confirmDeleteMisconception
    );

    await waitFor.invisibilityOf(
      deleteMisconceptionModal,
      'Delete Misconception Modal takes too long to close'
    );
  };

  this.expectStaleTabInfoModalToBeVisible = async function () {
    await waitFor.visibilityOf(
      staleTabInfoModal,
      'Stale tab info modal is taking too long to display'
    );
  };

  this.expectUnsavedChangesStatusInfoModalToBeVisible = async function () {
    await waitFor.visibilityOf(
      unsavedChangesStatusInfoModal,
      'Unsaved changes status info modal is taking too long to display'
    );
  };
};

exports.SkillEditorPage = SkillEditorPage;
