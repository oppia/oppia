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
var general = require('./general.js');
var until = protractor.ExpectedConditions;

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
  var saveModal = element(by.css('.protractor-test-save-modal'));

  this.addExistingExploration = function(explorationId) {
    addExplorationInput.sendKeys(explorationId);
    // Waits until the button becomes active after debouncing.
    browser.wait(until.elementToBeClickable(addExplorationInput), 5000,
      'Unable to find exploration Id ' + explorationId);
    addExplorationButton.click();
  };

  // Search and add existing exploration to the node graph.
  this.searchForAndAddExistingExploration = function(query) {
    browser.wait(until.visibilityOf(addExplorationInput), 10000,
      'Add Exploration Input is not visible').then(function(isVisbile) {
      if (isVisbile) {
        addExplorationInput.sendKeys(query);
        // Need to wait for result to appear.
        browser.wait(until.elementToBeClickable(addExplorationInput), 5000,
          'Unable to find exploration ' + query);
      }
    });
    var matched = false;
    var dropdownResultElements = element.all(by.css('.dropdown-menu'));
    dropdownResultElements.map(function(dropdownResult) {
      return dropdownResult.getText();
    }).then(function(listOfResult) {
      listOfResult.forEach(function(element, index) {
        if (element.indexOf(query) >= 0) {
          // Selects the exploration from dropdown.
          dropdownResultElements.get(index).click();
          matched = true;
        }
      });
    });
    if (!matched) {
      // Press Tab to fill in the default result should one appear when
      // none of the answer matches the given query.
      addExplorationInput.sendKeys(protractor.Key.TAB);
      // If query gets zero result, hitting Tab would not enable the
      // addExplorationButton.
    }
    addExplorationButton.isEnabled().then( function(isEnabled) {
      if (isEnabled) {
        addExplorationButton.click();
      } else {
        throw Error ('Add Exploration Button is not clickable');
      }
    });
  };

  // Shift a node left in the node graph.
  this.shiftNodeLeft = function(number) {
    editorShiftLeft.get(number).click();
  };

  this.setCommitMessage = function(message) {
    browser.wait(until.visibilityOf(saveModal), 5000,
      'Save Modal takes too long to appear').then(function(isVisbile) {
      if (isVisbile) {
        browser.wait(until.elementToBeClickable(commitMessageInput, 5000,
          'Commit Message input takes too long to appear'))
          .then(function(isClickable) {
            if (isClickable) {
              commitMessageInput.click();
              commitMessageInput.sendKeys(message);
            }
          });
      }
    });
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
    browser.wait(until.elementToBeClickable(saveDraftButton), 5000,
      'Collection Save Draft button is not clickable').then(
      function(isClickable){
        if (isClickable) {
          saveDraftButton.click();
        }
      });
  };

  // Closes the save modal.
  this.closeSaveModal = function() {
    browser.wait(until.elementToBeClickable(closeSaveModal), 5000,
      'Publish Changes button is not clickable').then( function(isClickable) {
      if (isClickable) {
        closeSaveModal.click();
      }
    });
    browser.wait(until.invisibilityOf(closeSaveModal), 5000);
  };

  // Click on publish collection.
  this.publishCollection = function() {
    browser.wait(until.elementToBeClickable(editorPublishButton), 5000,
      'Collection Publish button is not clickable')
      .then(function(isClickable){
        if (isClickable) {
          editorPublishButton.click();
        }
      });
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
    browser.wait(until.elementToBeClickable(saveChangesButton), 5000,
      'Save Changes button is not clickable').then(function (isClickable) {
      if (isClickable) {
        saveChangesButton.click();
      }
    });
    browser.wait(until.invisibilityOf(saveChangesButton), 5000);
  };
};

exports.CollectionEditorPage = CollectionEditorPage;
