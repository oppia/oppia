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

var forms = require('./forms.js');
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

  this.get = function(skillId) {
    browser.get(EDITOR_URL_PREFIX + skillId);
    return waitFor.pageToFullyLoad();
  };

  this.addRubricExplanationForDifficulty = function(difficulty, explanation) {
    var addRubricExplanationButton = element(
      by.css('.protractor-test-add-explanation-button-' + difficulty));
    waitFor.elementToBeClickable(
      addRubricExplanationButton,
      'Add Rubric Explanation button takes too long to be clickable');
    addRubricExplanationButton.click();
    var editor = element(
      by.css('.protractor-test-rubric-explanation-text'));
    waitFor.visibilityOf(
      editor, 'Rubric explanation editor takes too long to appear');
    browser.switchTo().activeElement().sendKeys(explanation);
    waitFor.elementToBeClickable(
      saveRubricExplanationButton,
      'Save Rubric Explanation button takes too long to be clickable');
    saveRubricExplanationButton.click();
  };

  this.deleteRubricExplanationWithIndex = function(difficulty, explIndex) {
    // The edit explanation buttons for all explanations of a difficulty have
    // the same class name and each explanation in it are identified by its
    // index.
    var editRubricExplanationButtons = element.all(
      by.css('.protractor-test-edit-rubric-explanation-' + difficulty));
    editRubricExplanationButtons.then(function(buttons) {
      waitFor.elementToBeClickable(
        buttons[explIndex],
        'Edit Rubric Explanation button takes too long to be clickable');
      buttons[explIndex].click();
      var editor = element(
        by.css('.protractor-test-rubric-explanation-text'));
      waitFor.visibilityOf(
        editor, 'Rubric explanation editor takes too long to appear');
      deleteRubricExplanationButton.click();
    });
  };

  this.editRubricExplanationWithIndex = function(
      difficulty, explIndex, explanation) {
    // The edit explanation buttons for all explanations of a difficulty have
    // the same class name and each explanation in it are identified by its
    // index.
    var editRubricExplanationButtons = element.all(
      by.css('.protractor-test-edit-rubric-explanation-' + difficulty));
    editRubricExplanationButtons.then(function(buttons) {
      waitFor.elementToBeClickable(
        buttons[explIndex],
        'Edit Rubric Explanation button takes too long to be clickable');
      buttons[explIndex].click();
      var editor = element(
        by.css('.protractor-test-rubric-explanation-text'));
      waitFor.visibilityOf(
        editor, 'Rubric explanation editor takes too long to appear');
      browser.switchTo().activeElement().sendKeys(explanation);
      waitFor.elementToBeClickable(
        saveRubricExplanationButton,
        'Save Rubric Explanation button takes too long to be clickable');
      saveRubricExplanationButton.click();
    });
  };

  this.expectRubricExplanationsToMatch = function(difficulty, explanations) {
    var rubricExplanationsForDifficulty = element.all(
      by.css('.protractor-test-rubric-explanation-' + difficulty));
    var explanationCounter = 0;
    rubricExplanationsForDifficulty.then(function(explanationElements) {
      for (var idx in explanationElements) {
        explanationElements[idx].getText().then(function(text) {
          expect(text).toMatch(explanations[explanationCounter]);
          explanationCounter++;
        });
      }
    });
  };

  this.expectNumberOfQuestionsToBe = function(count) {
    waitFor.visibilityOf(
      questionItem, 'Question takes too long to appear');
    questionItems.then(function(items) {
      expect(items.length).toEqual(count);
    });
  };

  this.saveQuestion = function() {
    saveQuestionButton.click();
    return waitFor.pageToFullyLoad();
  };

  this.moveToQuestionsTab = function() {
    waitFor.elementToBeClickable(
      questionsTab,
      'Questions tab button takes too long to be clickable');
    questionsTab.click();
  };

  this.clickCreateQuestionButton = function() {
    createQuestionButton.click();
  };

  this.confirmSkillDifficulty = function() {
    confirmSkillDifficultyButton.click();
  };

  this.changeSkillDescription = function(description) {
    skillDescriptionField.clear();
    skillDescriptionField.sendKeys(description);
  };

  this.expectSkillDescriptionToBe = function(description) {
    expect(skillDescriptionField.getAttribute('value')).toEqual(description);
  };

  this.saveOrPublishSkill = function(commitMessage) {
    saveOrPublishSkillButton.click();

    commitMessageField.sendKeys(commitMessage);
    waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    closeSaveModalButton.click();
    waitFor.pageToFullyLoad();
  };

  this.editConceptCard = function(explanation) {
    editConceptCardExplanationButton.click();

    var editor = element(by.css('.protractor-test-concept-card-text'));
    waitFor.visibilityOf(
      editor, 'Explanation Editor takes too long to appear');

    browser.switchTo().activeElement().sendKeys(explanation);

    waitFor.elementToBeClickable(
      saveConceptCardExplanationButton,
      'Save Concept Card Explanation button takes too long to be clickable');
    saveConceptCardExplanationButton.click();
    waitFor.invisibilityOf(
      editor, 'Explanation Editor takes too long to close');
  };

  this.expectConceptCardExplanationToMatch = function(explanation) {
    conceptCardExplanationText.getText().then(function(text) {
      expect(text).toMatch(explanation);
    });
  };

  this.addWorkedExample = function(question, explanation) {
    addWorkedExampleButton.click();

    var addWorkedExampleModal =
      element(by.css('.protractor-test-add-worked-example-modal'));
    waitFor.visibilityOf(
      addWorkedExampleModal,
      'Add Worked Example Modal takes too long to appear');

    workedExampleQuestion.click();
    browser.switchTo().activeElement().sendKeys(question);

    workedExampleExplanation.click();
    browser.switchTo().activeElement().sendKeys(explanation);

    waitFor.elementToBeClickable(
      saveWorkedExampleButton,
      'Save Worked Example button takes too long to be clickable');
    saveWorkedExampleButton.click();
    waitFor.invisibilityOf(
      addWorkedExampleModal,
      'Add Worked Example Modal takes too long to close');
  };

  this.deleteWorkedExampleWithIndex = function(index) {
    deleteWorkedExampleButton(index).click();

    var deleteWorkedExampleModal =
      element(by.css('.protractor-test-delete-worked-example-modal'));
    waitFor.visibilityOf(
      deleteWorkedExampleModal,
      'Delete Worked Example Modal takes too long to appear');

    confirmDeleteWorkedExample.click();

    waitFor.invisibilityOf(
      deleteWorkedExampleModal,
      'Delete Worked Example Modal takes too long to close');
  };

  this.expectWorkedExampleSummariesToMatch = function(questions, explanations) {
    // This is declared separately since the expect() statements are in an async
    // callback and so 'index' gets incremented before the check is done. So, we
    // need another variable to track the correct index to check.
    var questionIndexToCheck = 0;
    var explanationIndexToCheck = 0;
    for (var index in questions) {
      workedExampleSummary(index).click();
      workedExampleQuestionField.getText().then(function(text) {
        expect(text).toMatch(questions[questionIndexToCheck]);
        questionIndexToCheck++;
      });
      workedExampleExplanationField.getText().then(function(text) {
        expect(text).toMatch(explanations[explanationIndexToCheck]);
        explanationIndexToCheck++;
      });
      workedExampleSummary(index).click();
    }
  };

  this.addMisconception = function(name, notes, feedback) {
    addMisconceptionButton.click();

    var addMisconceptionModal =
      element(by.css('.protractor-test-add-misconception-modal'));
    waitFor.visibilityOf(
      addMisconceptionModal,
      'Add Misconception Modal takes too long to appear');

    misconceptionNameField.click();
    browser.switchTo().activeElement().sendKeys(name);

    misconceptionNotesField.click();
    browser.switchTo().activeElement().sendKeys(notes);

    misconceptionFeedbackField.click();
    browser.switchTo().activeElement().sendKeys(feedback);

    waitFor.elementToBeClickable(
      confirmAddMisconception,
      'Save Misconception button takes too long to be clickable');
    confirmAddMisconception.click();

    waitFor.invisibilityOf(
      addMisconceptionModal,
      'Add Misconception Modal takes too long to close');
  };

  this.expectNumberOfMisconceptionsToBe = function(number) {
    misconceptionListItems.then(function(elems) {
      expect(elems.length).toBe(number);
    });
  };

  this.deleteMisconception = function(index) {
    deleteMisconceptionButton(index).click();

    var deleteMisconceptionModal =
      element(by.css('.protractor-test-delete-misconception-modal'));
    waitFor.visibilityOf(
      deleteMisconceptionModal,
      'Delete Misconception Modal takes too long to appear');

    confirmDeleteMisconception.click();

    waitFor.invisibilityOf(
      deleteMisconceptionModal,
      'Delete Misconception Modal takes too long to close');
  };
};

exports.SkillEditorPage = SkillEditorPage;
