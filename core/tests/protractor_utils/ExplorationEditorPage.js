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
  '../protractor_utils/ExplorationEditorHistoryTab.js');
var ExplorationEditorMainTab = require(
  '../protractor_utils/ExplorationEditorMainTab.js');
var ExplorationEditorSettingsTab = require(
  '../protractor_utils/ExplorationEditorSettingsTab.js');
var ExplorationEditorStatsTab = require(
  '../protractor_utils/ExplorationEditorStatsTab.js');
var ExplorationEditorTranslationTab = require(
  '../protractor_utils/ExplorationEditorTranslationTab.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');

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
  this.getPreviewTab = function() {
    return new ExplorationPlayerPage.ExplorationPlayerPage();
  };

  /*
   * Interactive elements
   */
  var commitMessageInput = element(
    by.css('.protractor-test-commit-message-input'));
  var neutralElement = element.all(by.css('.protractor-test-neutral-element'))
    .first();

  /*
   * Non-Interactive elements
   */
  var loadingModal = element(by.css('.protractor-test-loading-modal'));

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
  var publishExplorationButton = element(
    by.css('.protractor-test-publish-exploration'));

  /*
   * Workflows
   */
  // CONTROLS

  this.publishCardExploration = async function(
      title, objective, category, language, tags) {
    await waitFor.elementToBeClickable(publishExplorationButton,
      'Publish button taking too long to be clickable.');
    await publishExplorationButton.click();

    var expTitle = element(by.css(
      '.protractor-test-exploration-title-input'));
    var expObjective = element(by.css(
      '.protractor-test-exploration-objective-input'));
    var expTags = element(by.css('.protractor-test-tags'));
    var expInput = expTags.element(by.tagName('input'));

    await waitFor.elementToBeClickable(expTitle,
      'Exploration Title input is taking too long to appear');
    await waitFor.elementToBeClickable(
      element(by.css(
        '.protractor-test-exploration-title-input'))
    );

    await expTitle.sendKeys(title);
    await expObjective.sendKeys(objective);

    await element(by.css('.select2-container')).click();
    await element(by.css('.select2-dropdown')).element(
      by.css('.select2-search input')).sendKeys(category + '\n');

    await element(by.css('.protractor-test-exploration-language-select'))
      .click();
    await element(by.css('.protractor-test-exploration-language-select'))
      .sendKeys(language + '\n');


    await expTags.click();
    await expInput.click();

    for (var elem of tags) {
      await expInput.sendKeys(elem, protractor.Key.ENTER);
    }

    const saveChangesButton = element(by.css(
      '.protractor-test-confirm-pre-publication'));
    await waitFor.elementToBeClickable(saveChangesButton,
      'Save changes button taking too long to be clickable');
    await saveChangesButton.click();

    await waitFor.visibilityOf(element(by.css('.modal-content')),
      'Modal Content taking too long to appear');

    const confirmPublish = element(by.css('.protractor-test-confirm-publish'));
    await waitFor.elementToBeClickable(confirmPublish,
      'Confirm publish button taking too long to appear');
    await confirmPublish.click();

    await waitFor.visibilityOf(element(by.css(
      '.protractor-test-share-publish-modal')),
    'Awesome modal taking too long to appear');

    const closeButton = element(by.css('.protractor-test-share-publish-close'));
    await waitFor.elementToBeClickable(closeButton,
      'Close button taking too long to be clickable');
    await closeButton.click();
    await waitFor.invisibilityOf(closeButton,
      'Close button taking too long to disappear');
  };

  this.verifyExplorationSettingFields = async function(
      title, category, objective, language, tags) {
    const explorationTitle = element(by.css(
      '.protractor-test-exploration-title-input'));
    const explorationObjective = element(by.css(
      '.protractor-test-exploration-objective-input'
    ));
    const explorationCategory = await element(by.css(
      '.select2-selection__rendered')).getText();
    const explorationLanguage = await element(by.css(
      '.protractor-test-exploration-language-select'
    )).$('option:checked').getText();
    const explorationTags = element.all(by.css(
      '.select2-selection__choice'
    ));
    await waitFor.visibilityOf(explorationTitle,
      'Exploration Goal taking too long to appear');
    expect(await explorationTitle.getAttribute('value')).toMatch(title);
    expect(explorationCategory).toMatch(category);
    expect(await explorationObjective.getAttribute('value')).toMatch(objective);
    expect(explorationLanguage).toMatch(language);
    for (var i = 0; i < await explorationTags.count(); i++) {
      expect(
        await (await explorationTags.get(i)).getText()
      ).toMatch(tags[i]);
    }
  };

  this.saveChanges = async function(commitMessage) {
    var toastSuccessElement = element(by.css('.toast-success'));
    expect(await saveChangesButton.isDisplayed()).toBe(true);
    await saveChangesButton.click();
    if (commitMessage) {
      await commitMessageInput.sendKeys(commitMessage);
    }
    await waitFor.elementToBeClickable(
      saveDraftButton, 'Save Draft button is not clickable');
    await saveDraftButton.click();

    // This is necessary to give the page time to record the changes,
    // so that it does not attempt to stop the user leaving.
    await waitFor.invisibilityOf(
      toastSuccessElement,
      'Toast message taking too long to disappear after saving changes');
    expect(await toastSuccessElement.isPresent()).toBe(false);
  };

  this.discardChanges = async function() {
    await saveDiscardToggleButton.click();
    await discardChangesButton.click();
    await confirmDiscardChangesButton.click();
    await waitFor.invisibilityOf(loadingModal,
      'Loading modal taking too long to disappear');
    // Expect editor page to completely reload.
    await waitFor.pageToFullyLoad();
  };

  this.expectCannotSaveChanges = async function() {
    expect(await saveChangesButton.isPresent()).toBeFalsy();
  };

  // NAVIGATION

  this.navigateToHistoryTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToHistoryTabButton, 'History tab is not clickable');
    await navigateToHistoryTabButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.navigateToFeedbackTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToFeedbackTabButton, 'Feedback tab is not clickable');
    await navigateToFeedbackTabButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.navigateToMainTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToMainTabButton, 'Main tab is not clickable');
    await navigateToMainTabButton.click();
    await neutralElement.click();
  };

  this.navigateToPreviewTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToPreviewTabButton, 'Preview tab is not clickable');
    await navigateToPreviewTabButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSettingsTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToSettingsTabButton, 'Settings tab is not clickable');
    await navigateToSettingsTabButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.navigateToStatsTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToStatsTabButton, 'Stats tab is not clickable');
    await navigateToStatsTabButton.click();
  };
  this.navigateToTranslationTab = async function() {
    await waitFor.elementToBeClickable(
      navigateToTranslationTabButton, 'Translation tab is not clickable');
    await navigateToTranslationTabButton.click();
    await waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
