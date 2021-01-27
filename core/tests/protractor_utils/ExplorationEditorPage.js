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

var action = require('./action');
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorImprovementsTab = require(
  '../protractor_utils/ExplorationEditorImprovementsTab.js');
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
  this.getImprovementsTab = function() {
    return (
      new ExplorationEditorImprovementsTab.ExplorationEditorImprovementsTab());
  };
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
  var navigateToImprovementsTabButton = element(
    by.css('.protractor-test-improvements-tab'));
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
  // ---- CONTROLS ----

  this.publishCardExploration = async function(
      title, objective, category, language, tags) {
    await action.waitForAutosave();
    await action.click('Publish button', publishExplorationButton);

    var expTitle = element(by.css(
      '.protractor-test-exploration-title-input'));
    var expObjective = element(by.css(
      '.protractor-test-exploration-objective-input'));
    var expTags = element(by.css('.protractor-test-tags'));
    var expInput = expTags.element(by.tagName('input'));
    var expCategory = element(
      by.css('.protractor-test-exploration-category-dropdown'));
    var expLanguage = element(
      by.css('.protractor-test-exploration-language-select'));
    var neutralElement = element(
      by.css('.protractor-test-metadata-modal-header'));

    await action.sendKeys('Exploration title', expTitle, title);
    await action.click('Neutral Element', neutralElement);
    await action.waitForAutosave();

    await action.sendKeys('Exploration objective', expObjective, objective);
    await action.click('Neutral Element', neutralElement);
    await action.waitForAutosave();

    await waitFor.presenceOf(
      expCategory, 'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(expCategory)
    ).setValue(category);
    await action.click('Neutral Element', neutralElement);
    await action.waitForAutosave();

    await action.select('Exploration Language', expLanguage, language);
    await action.click('Neutral Element', neutralElement);
    await action.waitForAutosave();

    for (var elem of tags) {
      await action.click('Exploration input', expInput);
      await action.sendKeys('Exploration input', expInput, elem + '\n');
      await action.click('Neutral Element', neutralElement);
      await action.waitForAutosave();
    }

    const saveChangesButton = element(by.css(
      '.protractor-test-confirm-pre-publication'));
    await action.click('Save Changes', saveChangesButton);
    await waitFor.invisibilityOf(
      saveChangesButton,
      'Exploration metadata modal takes too long to disappear.');
    await waitFor.visibilityOf(
      element(by.css('.modal-content')),
      'Modal Content taking too long to appear');

    const confirmPublish = element(by.css('.protractor-test-confirm-publish'));
    await action.click('Confirm Publish', confirmPublish);
    await waitFor.invisibilityOf(
      confirmPublish,
      'Confirm publish modal takes too long to disappear.');
    await waitFor.visibilityOf(element(by.css(
      '.protractor-test-share-publish-modal')),
    'Awesome modal taking too long to appear');

    const closeButton = element(by.css('.protractor-test-share-publish-close'));
    await action.click('Share publish button', closeButton);
    await waitFor.invisibilityOf(
      closeButton, 'Close button taking too long to disappear');
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
    await waitFor.visibilityOf(
      explorationTitle, 'Exploration Goal taking too long to appear');
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
    await action.waitForAutosave();
    await action.click('Save changes button', saveChangesButton);
    if (commitMessage) {
      await action.sendKeys(
        'Commit message input', commitMessageInput, commitMessage);
    }
    await action.click('Save draft button', saveDraftButton);
    await waitFor.visibilityOf(
      toastSuccessElement,
      'Toast message is taking too long to appear after saving changes');

    // This is necessary to give the page time to record the changes,
    // so that it does not attempt to stop the user leaving.
    await waitFor.invisibilityOf(
      toastSuccessElement,
      'Toast message is taking too long to disappear after saving changes');
  };

  this.discardChanges = async function() {
    await action.waitForAutosave();
    await action.click('Save Discard Toggle button', saveDiscardToggleButton);
    await action.click('Discard Changes button', discardChangesButton);
    await action.click(
      'Confirm Discard Changes button', confirmDiscardChangesButton);
    await waitFor.invisibilityOf(
      loadingModal, 'Loading modal taking too long to disappear');
    await waitFor.invisibilityOfInfoToast(
      'Changes take too long to be discarded.');
    // Expect editor page to completely reload.
    await waitFor.pageToFullyLoad();
  };

  this.expectCannotSaveChanges = async function() {
    await action.waitForAutosave();
    expect(await saveChangesButton.isPresent()).toBeFalsy();
  };

  this.expectCanPublishChanges = async function() {
    await action.waitForAutosave();
    expect(await publishExplorationButton.isEnabled()).toBeTrue();
  };

  this.expectCannotPublishChanges = async function() {
    await action.waitForAutosave();
    expect(await publishExplorationButton.isEnabled()).toBeFalsy();
  };

  // ---- NAVIGATION ----

  this.navigateToImprovementsTab = async function() {
    await action.click(
      'Improvements tab button', navigateToImprovementsTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToHistoryTab = async function() {
    await action.click('History tab button', navigateToHistoryTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToFeedbackTab = async function() {
    await action.click('Feedback tab button', navigateToFeedbackTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToMainTab = async function() {
    await action.waitForAutosave();
    await action.click('Main tab button', navigateToMainTabButton);
    await action.click('Neutral element', neutralElement);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToPreviewTab = async function() {
    await action.click('Preview tab button', navigateToPreviewTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSettingsTab = async function() {
    await action.click('Settings tab button', navigateToSettingsTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToStatsTab = async function() {
    await action.click('Statistics tab button', navigateToStatsTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToTranslationTab = async function() {
    await action.click(
      'Translation tab button', navigateToTranslationTabButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
