// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the exploration editor, for use in Protractor
 * tests.
 */

var until = protractor.ExpectedConditions;

var ExplorationEditorFeedbackTab = require(
  '../protractor_utils/ExplorationEditorFeedbackTab.js');
var ExplorationEditorHistoryTab = require(
  '../protractor_utils/ExplorationEditorHistoryTab.js'
);
var ExplorationEditorMainTab = require(
  '../protractor_utils/ExplorationEditorMainTab.js'
);
var ExplorationEditorSettingsTab = require(
  '../protractor_utils/ExplorationEditorSettingsTab.js');

var ExplorationEditorPage = function() {
  /*
   * Components
   */
  this.getFeedbackTab = function() {
    return new ExplorationEditorFeedbackTab.ExplorationEditorFeedbackTab();
  };
  this.getHistoryTab = function() {
    return new ExplorationEditorHistoryTab.ExplorationEditorHistoryTab();
  };
  this.getMainTab = function() {
    return new ExplorationEditorMainTab.ExplorationEditorMainTab();
  };
  this.getSettingsTab = function() {
    return new ExplorationEditorSettingsTab.ExplorationEditorSettingsTab();
  };

  /*
   * Interactive elements
   */
  var commitMessageInput = element(
    by.css('.protractor-test-commit-message-input'));
  var neutralElement = element.all(by.css('.protractor-test-neutral-element'))
    .first();

  /*
   * Buttons
   */
  var confirmDiscardChangesButton = element(
    by.css('.protractor-test-confirm-discard-changes'));
  var discardChangesButton = element(
    by.css('.protractor-test-discard-changes'));
  var navigateToFeedbackTabButton = element(
    by.css('.protractor-test-feedback-tab'));
  var navigateToHistoryTabButton = element(
    by.css('.protractor-test-history-tab'));
  var navigateToMainTabButton = element(by.css('.protractor-test-main-tab'));
  var navigateToPreviewTabButton = element(
    by.css('.protractor-test-preview-tab'));
  var navigateToSettingsTabButton = element(
    by.css('.protractor-test-settings-tab'));
  var saveChangesButton = element(by.css('.protractor-test-save-changes'));
  var saveDiscardToggleButton = element(
    by.css('.protractor-test-save-discard-toggle'));
  var saveDraftButton = element(by.css('.protractor-test-close-save-modal'));

  /*
   * Workflows
   */
  // CONTROLS

  this.saveChanges = function(commitMessage) {
    var toastSuccessElement = element(by.css('.toast-success'));
    expect(saveChangesButton.isDisplayed()).toBe(true);
    saveChangesButton.click().then(function() {
      if (commitMessage) {
        commitMessageInput.sendKeys(commitMessage);
      }
      expect(saveDraftButton.isDisplayed()).toBe(true);
      saveDraftButton.click().then(function() {
      });
      // This is necessary to give the page time to record the changes,
      // so that it does not attempt to stop the user leaving.
      browser.wait(until.stalenessOf(toastSuccessElement), 5000,
        'toast message taking too long to disappear after saving changes');
      expect(toastSuccessElement.isPresent()).toBe(false);
    });
  };

  this.discardChanges = function() {
    saveDiscardToggleButton.click();
    discardChangesButton.click();
    confirmDiscardChangesButton.click();
    browser.waitForAngular();
    browser.wait(until.presenceOf(neutralElement), 5000,
      'neutralElement taking too long to appear after discarding changes');
    neutralElement.click();
  };

  this.expectCannotSaveChanges = function() {
    expect(saveChangesButton.isPresent()).toBeFalsy();
  };

  // NAVIGATION

  this.navigateToHistoryTab = function() {
    navigateToHistoryTabButton.click();
  };

  this.navigateToFeedbackTab = function() {
    navigateToFeedbackTabButton.click();
  };

  this.navigateToMainTab = function() {
    navigateToMainTabButton.click();
    neutralElement.click();
  };

  this.navigateToPreviewTab = function() {
    navigateToPreviewTabButton.click();
  };

  this.navigateToSettingsTab = function() {
    navigateToSettingsTabButton.click();
  };
};
exports.ExplorationEditorPage = ExplorationEditorPage;
