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
 * @fileoverview Page object for Collection Editor Page, for use in WebdriverIO
 * tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var CollectionEditorPage = function() {
  var addExplorationButton = $('.e2e-test-add-exploration-button');
  var addExplorationInput = $('.e2e-test-add-exploration-input');
  var categoryFilterDropdown = $(
    '.e2e-test-collection-editor-category-dropdown');
  var closeSaveModalButton = $('.e2e-test-close-save-modal-button');
  var collectionEditorObjectiveInput = $(
    '.e2e-test-collection-editor-objective-input');
  var commitMessageInput = $('.e2e-test-commit-message-input');
  var editorPublishButton = $('.e2e-test-editor-publish-button');
  var editorTitleInput = $('.e2e-test-collection-editor-title-input');
  var saveChangesButton = $('.e2e-test-collection-save-changes-button');
  var saveDraftButton = $('.e2e-test-save-draft-button');
  var saveInProgressLabel = $('.e2e-test-save-in-progress-label');
  var saveModal = $('.e2e-test-save-modal');

  this.addExistingExploration = async function(explorationId) {
    await waitFor.visibilityOf(
      addExplorationInput, 'Add Exploration Input is not visible');
    await action.setValue(
      'Add Exploration Input', addExplorationInput, explorationId);
    // Waits until the button becomes active after debouncing.
    await waitFor.elementToBeClickable(
      addExplorationButton,
      'Unable to find exploration ID: ' + explorationId);
    await action.click('Add Exploration Button', addExplorationButton);
  };

  // Shift a node left in the node graph.
  this.shiftNodeLeft = async function(number) {
    var editorShiftLeft = await $$('.e2e-test-editor-shift-right');
    await action.click('Editor Shift Left', editorShiftLeft[number]);
  };

  this.setCommitMessage = async function(message) {
    await waitFor.visibilityOf(
      saveModal, 'Save Modal takes too long to appear');
    await waitFor.elementToBeClickable(
      commitMessageInput, 'Commit Message input takes too long to appear');
    await action.click('Commit Message Input', commitMessageInput);
    await action.setValue(
      'Commit Message Input', commitMessageInput, message);
  };

  // Shift a node right in the node graph.
  this.shiftNodeRight = async function(number) {
    var editorShiftRight = await $$('.e2e-test-editor-shift-right');
    await action.click('Editor Shift Right', editorShiftRight[number]);
  };

  // Delete a node in the node graph.
  this.deleteNode = async function(number) {
    var editorDeleteNode = await $$('.e2e-test-editor-delete-node');
    await action.click('Editor Delete Node', editorDeleteNode[number]);
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
    await action.setValue('Editor Title Input', editorTitleInput, title);
  };

  // Set collection objective.
  this.setObjective = async function(objective) {
    await action.setValue(
      'Collection Editor Objective Input',
      collectionEditorObjectiveInput, objective);
  };

  // Set collection category.
  this.setCategory = async function(category) {
    await action.click('Category filter', categoryFilterDropdown);
    var dropdownOption = await $(`.mat-option-text=${category}`);
    await action.click(
      'category option: ' + category, dropdownOption);
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
