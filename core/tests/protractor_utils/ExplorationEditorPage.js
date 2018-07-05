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
var general = require('./general.js');
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
var ExplorationEditorStatsTab = require(
  '../protractor_utils/ExplorationEditorStatsTab.js');

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
      browser.wait(until.elementToBeClickable(saveDraftButton), 5000,
        'Save Draft button is not clickable').then(function(isClickable){
        if (isClickable) {
          saveDraftButton.click();
        }
      });
      // This is necessary to give the page time to record the changes,
      // so that it does not attempt to stop the user leaving.
      browser.wait(until.invisibilityOf(toastSuccessElement), 10000,
        'Toast message taking too long to disappear after saving changes');
      expect(toastSuccessElement.isPresent()).toBe(false);
    });
  };

  this.discardChanges = function() {
    saveDiscardToggleButton.click();
    discardChangesButton.click();
    confirmDiscardChangesButton.click();
    // Expect editor page to completely reload.
    general.waitForLoadingMessage();
  };

  this.expectCannotSaveChanges = function() {
    expect(saveChangesButton.isPresent()).toBeFalsy();
  };

  // NAVIGATION

  this.navigateToHistoryTab = function() {
    browser.wait(until.elementToBeClickable(navigateToHistoryTabButton), 5000);
    navigateToHistoryTabButton.click();
  };

  this.navigateToFeedbackTab = function() {
    browser.wait(until.elementToBeClickable(navigateToFeedbackTabButton), 5000);
    navigateToFeedbackTabButton.click();
    general.waitForLoadingMessage();
  };

  this.navigateToMainTab = function() {
    browser.wait(until.elementToBeClickable(navigateToMainTabButton), 5000);
    navigateToMainTabButton.click();
    neutralElement.click();
  };

  this.navigateToPreviewTab = function() {
    browser.wait(until.elementToBeClickable(navigateToPreviewTabButton), 5000);
    navigateToPreviewTabButton.click();
    general.waitForLoadingMessage();
  };

  this.navigateToSettingsTab = function() {
    browser.wait(until.elementToBeClickable(navigateToSettingsTabButton), 5000);
    navigateToSettingsTabButton.click();
  };

  this.navigateToStatsTab = function() {
    browser.wait(until.elementToBeClickable(navigateToStatsTabButton), 5000);
    navigateToStatsTabButton.click();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
