// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for manipulating the collection editor when
 * carrrying out end-to-end testing with protractor.
 */

// Add existing exploration to the node graph.
var addExistingExploration = function(explorationId) {
  element(
    by.css('.protractor-test-add-exploration-input')
  ).sendKeys(explorationId);
  // Waits until the button becomes active after debouncing.
  browser.driver.sleep(300);
  element(by.css('.protractor-test-add-exploration-button')).click();
};

// Search and add existing exploration to the node graph.
var searchForAndAddExistingExploration = function(query) {
  element(
    by.css('.protractor-test-add-exploration-input')
  ).sendKeys(query);
  // Waits until the button becomes active after debouncing.
  browser.driver.sleep(300);
  // Selects the exploration from dropdown.
  element(
    by.css('.protractor-test-add-exploration-input')
  ).sendKeys(protractor.Key.TAB);
  element(by.css('.protractor-test-add-exploration-button')).click();
};

// Shift a node left in the node graph.
var shiftNodeLeft = function(number) {
  element.all(
    by.css('.protractor-test-editor-shift-left')
  ).get(number).click();
};

// Shift a node right in the node graph.
var shiftNodeRight = function(number) {
  element.all(
    by.css('.protractor-test-editor-shift-right')
  ).get(number).click();
};

// Delete a node in the node graph.
var deleteNode = function(number) {
  element.all(
    by.css('.protractor-test-editor-delete-node')
  ).get(number).click();
};

// Save draft of the collection.
var saveDraft = function() {
  element(by.css('.protractor-test-save-draft-button')).click();
};

// Closes the save modal.
var closeSaveModal = function() {
  element(by.css('.protractor-test-close-save-modal')).click();
};

// Click on publish collection.
var publishCollection = function() {
  element(by.css('.protractor-test-editor-publish-button')).click();
};

// Set collection title.
var setTitle = function(title) {
  element(by.css('.protractor-collection-editor-title-input'))
    .sendKeys(title);
};

// Set collection objective.
var setObjective = function(objective) {
  element(by.css('.protractor-collection-editor-objective-input'))
    .sendKeys(objective);
};

// Set collection category.
var setCategory = function(category) {
  var options = element.all(
    by.css('.protractor-test-collection-editor-category-dropdown')
  );
  options.first().click();
  browser.driver.switchTo().activeElement().sendKeys(category + '\n');
};

// Saves changes and publishes collection.
var saveChanges = function () {
  element(
    by.css('.protractor-test-collection-save-changes-button')
  ).click();
};

exports.addExistingExploration = addExistingExploration;
exports.searchForAndAddExistingExploration = searchForAndAddExistingExploration;
exports.shiftNodeLeft = shiftNodeLeft;
exports.shiftNodeRight = shiftNodeRight;
exports.deleteNode = deleteNode;
exports.saveDraft = saveDraft;
exports.closeSaveModal = closeSaveModal;
exports.publishCollection = publishCollection;
exports.setTitle = setTitle;
exports.setObjective = setObjective;
exports.setCategory = setCategory;
exports.saveChanges = saveChanges;
