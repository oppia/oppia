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
var waitFor = require('./waitFor.js');

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
var ExplorationEditorStatsTab = require(
  '../protractor_utils/ExplorationEditorStatsTab.js');
var ExplorationEditorTranslationTab = require(
  '../protractor_utils/ExplorationEditorTranslationTab.js');

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
  this.getStatsTab = function() {
    return new ExplorationEditorStatsTab.ExplorationEditorStatsTab();
  };
  this.getTranslationTab = function() {
    return new ExplorationEditorTranslationTab
      .ExplorationEditorTranslationTab();
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
  var navigateToStatsTabButton = element(by.css('.protractor-test-stats-tab'));
  var navigateToTranslationTabButton = element(
    by.css('.protractor-test-translation-tab'));
  var saveChangesButton = element(by.css('.protractor-test-save-changes'));
  var saveDiscardToggleButton = element(
    by.css('.protractor-test-save-discard-toggle'));
  var saveDraftButton = element(by.css('.protractor-test-save-draft-button'));

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
      waitFor.elementToBeClickable(
        saveDraftButton, 'Save Draft button is not clickable');
      saveDraftButton.click();

      // This is necessary to give the page time to record the changes,
      // so that it does not attempt to stop the user leaving.
      waitFor.invisibilityOf(
        toastSuccessElement,
        'Toast message taking too long to disappear after saving changes');
      expect(toastSuccessElement.isPresent()).toBe(false);
    });
  };

  this.discardChanges = function() {
    saveDiscardToggleButton.click();
    discardChangesButton.click();
    confirmDiscardChangesButton.click();
    // Expect editor page to completely reload.
    waitFor.pageToFullyLoad();
  };

  this.expectCannotSaveChanges = function() {
    expect(saveChangesButton.isPresent()).toBeFalsy();
  };

  // NAVIGATION

  this.navigateToHistoryTab = function() {
    waitFor.elementToBeClickable(
      navigateToHistoryTabButton, 'History tab is not clickable');
    navigateToHistoryTabButton.click();
    waitFor.pageToFullyLoad();
  };

  this.navigateToFeedbackTab = function() {
    waitFor.elementToBeClickable(
      navigateToFeedbackTabButton, 'Feedback tab is not clickable');
    navigateToFeedbackTabButton.click();
    waitFor.pageToFullyLoad();
  };

  this.navigateToMainTab = function() {
    waitFor.elementToBeClickable(
      navigateToMainTabButton, 'Main tab is not clickable');
    navigateToMainTabButton.click();
    neutralElement.click();
  };

  this.navigateToPreviewTab = function() {
    waitFor.elementToBeClickable(
      navigateToPreviewTabButton, 'Preview tab is not clickable');
    navigateToPreviewTabButton.click();
    waitFor.pageToFullyLoad();
  };

  this.navigateToSettingsTab = function() {
    waitFor.elementToBeClickable(
      navigateToSettingsTabButton, 'Settings tab is not clickable');
    navigateToSettingsTabButton.click();
  };

  this.navigateToStatsTab = function() {
    waitFor.elementToBeClickable(
      navigateToStatsTabButton, 'Stats tab is not clickable');
    navigateToStatsTabButton.click();
  };
  this.navigateToTranslationTab = function() {
    waitFor.elementToBeClickable(
      navigateToTranslationTabButton, 'Translation tab is not clickable');
    navigateToTranslationTabButton.click();
    waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
