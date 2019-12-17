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
var ExplorationEditorImprovementsTab = require(
  '../protractor_utils/ExplorationEditorImprovementsTab.js'
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
  this.getImprovementsTab = function() {
    return new ExplorationEditorImprovementsTab
      .ExplorationEditorImprovementsTab();
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
  var navigateToImprovementsTabButton = element(
    by.css('.protractor-test-improvements-tab'));
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
  var publishExplorationButton = element(
    by.css('.protractor-test-publish-exploration'));

  /*
   * Workflows
   */
  // CONTROLS

  this.publishCardExploration = function(
      title, objective, category, language, tags) {
    waitFor.elementToBeClickable(publishExplorationButton,
      'Publish button taking too long to be clickable.');
    publishExplorationButton.click();

    var expTitle = element(by.css(
      '.protractor-test-exploration-title-input'));
    var expObjective = element(by.css(
      '.protractor-test-exploration-objective-input'));
    var expTags = element(by.css('.protractor-test-tags'));
    var expInput = expTags.element(by.tagName('input'));

    waitFor.elementToBeClickable(expTitle,
      'Exploration Title input is taking too long to appear');

    expTitle.sendKeys(title);
    expObjective.sendKeys(objective);

    element(by.css('.select2-container')).click();
    element(by.css('.select2-dropdown')).element(
      by.css('.select2-search input')).sendKeys(category + '\n');

    element(by.css('.protractor-test-exploration-language-select')).click();
    element(by.css('.protractor-test-exploration-language-select'))
      .sendKeys(language + '\n');


    expTags.click();
    expInput.click();

    tags.forEach(function(element) {
      expInput.sendKeys(element, protractor.Key.ENTER);
    });

    const saveChangesButton = element(by.css(
      '.protractor-test-confirm-pre-publication'));
    waitFor.elementToBeClickable(saveChangesButton,
      'Save changes button taking too long to be clickable');
    saveChangesButton.click();

    waitFor.visibilityOf(element(by.css('.modal-content')),
      'Modal Content taking too long to appear');

    const confirmPublish = element(by.css('.protractor-test-confirm-publish'));
    waitFor.elementToBeClickable(confirmPublish,
      'Confirm publish button taking too long to appear');
    confirmPublish.click();

    waitFor.visibilityOf(element(by.css(
      '.protractor-test-share-publish-modal')),
    'Awesome modal taking too long to appear');

    const closeButton = element(by.css('.protractor-test-share-publish-close'));
    waitFor.elementToBeClickable(closeButton,
      'Close button taking too long to be clickable');
    closeButton.click();
  };

  this.verifyExplorationSettingFields = async function(
      title, category, objective, language, tags) {
    const explorationTitle = element(by.css(
      '.protractor-test-exploration-title-input'));
    const explorationObjective = element(by.css(
      '.protractor-test-exploration-objective-input'
    ));
    const explorationCategory = element(by.css(
      '.select2-selection__rendered')).getText();
    const explorationLanguage = element(by.css(
      '.protractor-test-exploration-language-select'
    )).$('option:checked').getText();
    const explorationTags = element.all(by.css(
      '.select2-selection__choice'
    ));
    waitFor.visibilityOf(explorationTitle,
      'Exploration Goal taking too long to appear');
    expect(explorationTitle.getAttribute('value')).toMatch(title);
    expect(explorationCategory).toMatch(category);
    expect(explorationObjective.getAttribute('value')).toMatch(objective);
    expect(explorationLanguage).toMatch(language);
    explorationTags.then(function(elems) {
      elems.forEach(function(explorationTag, index) {
        expect(explorationTag.getText()).toMatch(tags[index]);
      });
    });
  };

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

  this.navigateToImprovementsTab = function() {
    waitFor.elementToBeClickable(
      navigateToImprovementsTabButton, 'Improvements tab is not clickable');
    navigateToImprovementsTabButton.click();
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
