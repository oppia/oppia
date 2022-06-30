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
  this.addExistingExploration = async function(explorationId) {
    var addExplorationInput = await $('.e2e-test-add-exploration-input');
    await waitFor.visibilityOf(
      addExplorationInput, 'Add Exploration Input is not visible');
    await action.keys(
      'Add Exploration Input', addExplorationInput, explorationId);
    // Waits until the button becomes active after debouncing.
    var addExplorationButton = await $('.e2e-test-add-exploration-button');
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
    var saveModal = await $('.e2e-test-save-modal');
    await waitFor.visibilityOf(
      saveModal, 'Save Modal takes too long to appear');
    var commitMessageInput = await $('.e2e-test-commit-message-input');
    await waitFor.elementToBeClickable(
      commitMessageInput, 'Commit Message input takes too long to appear');
    await action.click('Commit Message Input', commitMessageInput);
    await action.keys(
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
    var saveDraftButton = await $('.e2e-test-save-draft-button');
    await waitFor.elementToBeClickable(
      saveDraftButton, 'Collection Save Draft button is not clickable');
    await action.click('Save Draft Button', saveDraftButton);
  };

  // Closes the save modal.
  this.closeSaveModal = async function() {
    var closeSaveModalButton = await $('.e2e-test-close-save-modal-button');
    await waitFor.elementToBeClickable(
      closeSaveModalButton, 'Publish Changes button is not clickable');
    await action.click('Close Save Modal Button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton, 'Save Modal takes too long to close');
  };

  // Click on publish collection.
  this.publishCollection = async function() {
    var editorPublishButton = await $('.e2e-test-editor-publish-button');
    await waitFor.elementToBeClickable(
      editorPublishButton, 'Collection Publish button is not clickable');
    await action.click('Editor Publish Button', editorPublishButton);
  };

  // Set collection title.
  this.setTitle = async function(title) {
    var editorTitleInput = await $('.e2e-test-collection-editor-title-input');
    await action.keys('Editor Title Input', editorTitleInput, title);
  };

  // Set collection objective.
  this.setObjective = async function(objective) {
    var collectionEditorObjectiveInput = await $(
      '.e2e-test-collection-editor-objective-input');
    await action.keys(
      'Collection Editor Objective Input',
      collectionEditorObjectiveInput, objective);
  };

  // Set collection category.
  this.setCategory = async function(category) {
    var categoryFilterDropdown = await $(
      '.e2e-test-collection-editor-category-dropdown');
    await action.click('Category filter', categoryFilterDropdown);
    var dropdownOption = await $(`.mat-option-text=${category}`);
    await action.click(
      'category option: ' + category, dropdownOption);
  };

  // Saves changes and publishes collection.
  this.saveChanges = async function() {
    var saveChangesButton = await $(
      '.e2e-test-collection-save-changes-button');
    await waitFor.elementToBeClickable(
      saveChangesButton, 'Save Changes button is not clickable');
    await action.click('Save Changes Button', saveChangesButton);
    await waitFor.invisibilityOf(
      saveChangesButton, 'Save Changes Modal takes too long to close');
    var saveInProgressLabel = await $(
      '.e2e-test-save-in-progress-label');
    await waitFor.invisibilityOf(
      saveInProgressLabel, 'Collection is taking too long to save.');
  };
};

exports.CollectionEditorPage = CollectionEditorPage;
