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
var waitFor = require('./waitFor.js');
var action = require('./action.js');

var CollectionEditorPage = function() {
  var addExplorationButton = element(
    by.css('.protractor-test-add-exploration-button'));
  var addExplorationInput = element(
    by.css('.protractor-test-add-exploration-input'));
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));
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
  var saveModal = element(by.css('.protractor-test-save-modal'));
  var saveInProgressLabel = element(by.css(
    '.protractor-test-save-in-progress-label'));

  this.addExistingExploration = async function(explorationId) {
    await waitFor.visibilityOf(
      addExplorationInput, 'Add Exploration Input is not visible');
    await action.sendKeys(
      'Add Exploration Input', addExplorationInput, explorationId);
    // Waits until the button becomes active after debouncing.
    await waitFor.elementToBeClickable(
      addExplorationButton,
      'Unable to find exploration ID: ' + explorationId);
    await action.click('Add Exploration Button', addExplorationButton);
  };

  // Search and add an existing exploration (by title) to the node graph.
  this.searchForAndAddExistingExploration = async function(query) {
    await waitFor.visibilityOf(
      addExplorationInput, 'Add Exploration Input is not visible');
    await action.sendKeys(
      'Add Exploration Input', addExplorationInput, query);
    // Need to wait for result to appear.
    await waitFor.elementToBeClickable(
      addExplorationButton, 'Unable to find exploration: ' + query);

    var dropdownResultElement = element(
      by.cssContainingText('.dropdown-menu', new RegExp(query)));
    await waitFor.presenceOf(
      dropdownResultElement, 'Unable to find exploration: ' + query);

    var matchingSearchResult = element(by.cssContainingText(
      '.uib-typeahead-match', new RegExp(query)));
    await waitFor.presenceOf(
      matchingSearchResult, 'Unable to find search result: ' + query);
    await action.click('Matching search result', matchingSearchResult);

    var isEnabled = await addExplorationButton.isEnabled();
    if (isEnabled) {
      await action.click('Add Exploration Button', addExplorationButton);
    } else {
      throw new Error ('Add Exploration Button is not clickable');
    }
  };

  // Shift a node left in the node graph.
  this.shiftNodeLeft = async function(number) {
    await action.click('Editor Shift Left', editorShiftLeft.get(number));
  };

  this.setCommitMessage = async function(message) {
    await waitFor.visibilityOf(
      saveModal, 'Save Modal takes too long to appear');
    await waitFor.elementToBeClickable(
      commitMessageInput, 'Commit Message input takes too long to appear');
    await action.click('Commit Message Input', commitMessageInput);
    await action.sendKeys(
      'Commit Message Input', commitMessageInput, message);
  };

  // Shift a node right in the node graph.
  this.shiftNodeRight = async function(number) {
    await action.click('Editor Shift Right', editorShiftRight.get(number));
  };

  // Delete a node in the node graph.
  this.deleteNode = async function(number) {
    await action.click('Editor Delete Node', editorDeleteNode.get(number));
  };

  // Save draft of the collection.
  this.saveDraft = async function() {
    await waitFor.elementToBeClickable(
      saveDraftButton, 'Collection Save Draft button is not clickable');
    await action.click('Save Draft Button', saveDraftButton);
  };

  // Closes the save modal.
  this.closeSaveModal = async function() {
    await waitFor.elementToBeClickable(
      closeSaveModalButton, 'Publish Changes button is not clickable');
    await action.click('Close Save Modal Button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton, 'Save Modal takes too long to close');
  };

  // Click on publish collection.
  this.publishCollection = async function() {
    await waitFor.elementToBeClickable(
      editorPublishButton, 'Collection Publish button is not clickable');
    await action.click('Editor Publish Button', editorPublishButton);
  };

  // Set collection title.
  this.setTitle = async function(title) {
    await action.sendKeys('Editor Title Input', editorTitleInput, title);
  };

  // Set collection objective.
  this.setObjective = async function(objective) {
    await action.sendKeys(
      'Collection Editor Objective Input',
      collectionEditorObjectiveInput, objective);
  };

  // Set collection category.
  this.setCategory = async function(category) {
    await action.select2(
      'Editor Category Drop Down', editorCategoryDropdown.first(),
      category);
  };

  // Saves changes and publishes collection.
  this.saveChanges = async function() {
    await waitFor.elementToBeClickable(
      saveChangesButton, 'Save Changes button is not clickable');
    await action.click('Save Changes Button', saveChangesButton);
    await waitFor.invisibilityOf(
      saveChangesButton, 'Save Changes Modal takes too long to close');
    await waitFor.invisibilityOf(
      saveInProgressLabel, 'Collection is taking too long to save.');
  };
};

exports.CollectionEditorPage = CollectionEditorPage;
