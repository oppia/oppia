// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for Collection Editor Page, for use in Protractor
 * tests.
 */

var CollectionEditorPage = function() {
  var addExplorationButton = element(
    by.css('.protractor-test-add-exploration-button'));
  var addExplorationInput = element(
    by.css('.protractor-test-add-exploration-input'));
  var closeSaveModal = element(
      by.css('.protractor-test-close-save-modal'));
  var collectionEditorObjectiveInput = element(
        by.css('.protractor-collection-editor-objective-input'));
  var commitMessageInput = element(
        by.css('.protractor-test-commit-message-input'));
  var editorCategoryDropdown = element.all(
    by.css('.protractor-test-collection-editor-category-dropdown'));
  var editorDeleteNode = element.all(
    by.css('.protractor-test-editor-delete-node'));
  var editorPublishButton = element(
    by.css('.protractor-test-editor-publish-button'));
  var editorShiftLeft = element.all(
    by.css('.protractor-test-editor-shift-left'));
  var editorShiftRight = element.all(
    by.css('.protractor-test-editor-shift-right'));
  var editorTitleInput = element(
    by.css('.protractor-collection-editor-title-input'));
  var saveChangesButton = element(
    by.css('.protractor-test-collection-save-changes-button'));
  var saveDraftButton = element(
    by.css('.protractor-test-save-draft-button'));

  this.addExistingExploration = function(explorationId) {
    addExplorationInput.sendKeys(explorationId);
    // Waits until the button becomes active after debouncing.
    browser.driver.sleep(300);
    addExplorationButton.click();
  };

  // Search and add existing exploration to the node graph.
  this.searchForAndAddExistingExploration = function(query) {
    addExplorationInput.sendKeys(query);
    // Waits until the button becomes active after debouncing.
    browser.driver.sleep(300);
    // Selects the exploration from dropdown.
    addExplorationInput.sendKeys(protractor.Key.TAB);
    addExplorationButton.click();
  };

  // Shift a node left in the node graph.
  this.shiftNodeLeft = function(number) {
    editorShiftLeft.get(number).click();
  };

  this.setCommitMessage = function(message) {
    commitMessageInput.sendKeys(message);
  };

  // Shift a node right in the node graph.
  this.shiftNodeRight = function(number) {
    editorShiftRight.get(number).click();
  };

  // Delete a node in the node graph.
  this.deleteNode = function(number) {
    editorDeleteNode.get(number).click();
  };

  // Save draft of the collection.
  this.saveDraft = function() {
    saveDraftButton.click();
  };

  // Closes the save modal.
  this.closeSaveModal = function() {
    closeSaveModal.click();
  };

  // Click on publish collection.
  this.publishCollection = function() {
    editorPublishButton.click();
  };

  // Set collection title.
  this.setTitle = function(title) {
    editorTitleInput.sendKeys(title);
  };

  // Set collection objective.
  this.setObjective = function(objective) {
    collectionEditorObjectiveInput.sendKeys(objective);
  };

  // Set collection category.
  this.setCategory = function(category) {
    editorCategoryDropdown.first().click();
    browser.driver.switchTo().activeElement().sendKeys(category + '\n');
  };

  // Saves changes and publishes collection.
  this.saveChanges = function () {
    saveChangesButton.click();
  };
};

exports.CollectionEditorPage = CollectionEditorPage;
