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
  var EditConceptCardExplanationButton = element(
    by.css('.protractor-test-edit-concept-card'));
  var saveConceptCardExplanationButton = element(
    by.css('.protractor-test-save-concept-card'));
  var conceptCardExplanationText = element(
    by.css('.protractor-test-concept-card-explanation'));
  var addWorkedExampleButton = element(
    by.css('.protractor-test-add-worked-example'));
  var saveWorkedExampleButton = element(
    by.css('.protractor-test-save-worked-example'));
  var workedExampleSummary = function(index) {
    return element(by.css('.protractor-test-worked-example-' + index));
  };
  var deleteWorkedExampleButton = function(index) {
    return element(
      by.css('.protractor-test-worked-example-' + index))
      .element(by.css('.oppia-delete-example-button'));
  };
  var confirmDeleteWorkedExample = element(
    by.css('.protractor-test-confirm-delete-worked-example'));
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
    by.css('.protractor-test-confirm-add-misconception'));
  var misconceptionListItems = element.all(
    by.css('.protractor-test-misconception-list-item'));
  var deleteMisconceptionButton = function(index) {
    return element(
      by.css('.protractor-test-misconception-' + index))
      .element(by.css('.oppia-delete-example-button'));
  };
  var confirmDeleteMisconception =
    element(by.css('.protractor-test-confirm-delete-misconception'));

  this.editConceptCard = function(explanation) {
    EditConceptCardExplanationButton.click();

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

  this.addWorkedExample = function(example) {
    addWorkedExampleButton.click();

    var addWorkedExampleModal =
      element(by.css('.protractor-test-add-worked-example-modal'));
    waitFor.visibilityOf(
      addWorkedExampleModal,
      'Add Worked Example Modal takes too long to appear');

    browser.switchTo().activeElement().sendKeys(example);

    waitFor.elementToBeClickable(
      saveWorkedExampleButton,
      'Save Worked Example button takes too long to be clickable');
    saveWorkedExampleButton.click();
    waitFor.invisibilityOf(
      addWorkedExampleModal,
      'Add Worked Example Modal takes too long to close');
  };

  this.deleteWorkedExample = function(index) {
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

  this.expectWorkedExampleSummariesToMatch = function(examples) {
    for (index in examples) {
      expect(workedExampleSummary(index).getText()).toMatch(examples[index]);
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
