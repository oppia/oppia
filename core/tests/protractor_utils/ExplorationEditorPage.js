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
const { browser } = require('protractor');

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
  * Interactive elements
  */
  var commitMessageInput = element(
    by.css('.e2e-test-commit-message-input'));
  var neutralElement = element.all(by.css('.e2e-test-neutral-element'))
    .first();
  var expTitle = element(by.css(
    '.e2e-test-exploration-title-input'));
  var expTitleInPostPublishModal = element(by.css(
    '.e2e-test-exploration-title-input-modal'));
  var expObjective = element(by.css(
    '.e2e-test-exploration-objective-input'));
  var expObjectiveInPostPublishModal = element(by.css(
    '.e2e-test-exploration-objective-input-modal'));
  var expInput = element(by.css('.e2e-test-chip-list-tags'));
  var expCategoryDropdownElement = element(
    by.css('.e2e-test-exploration-category-metadata-modal'));
  var expLanguageSelectorElement = element(
    by.css('.e2e-test-exploration-language-select'));
  var expLanguageSelectorElementModal = element(
    by.css('.e2e-test-exploration-language-select-modal'));
  var explorationMetadataModalHeaderElement = element(
    by.css('.e2e-test-metadata-modal-header'));
  var confirmPublish = element(by.css('.e2e-test-confirm-publish'));
  var expTagsSelectionChoiceElements = element.all(
    by.css('.select2-selection__choice'));
  var modalContentElement = element(by.css('.modal-content'));
  var sharePublishModalElement = element(
    by.css('.e2e-test-share-publish-modal'));
  var explorationCategoryDropdown = element(
    by.css('.e2e-test-exploration-category-dropdown'));
  var promptModalElement = element(
    by.css('.e2e-test-save-prompt-modal'));
  var explorationSaveModalElement = element(
    by.css('.e2e-test-exploration-save-modal'));
  var toastMessage = element(by.css('.e2e-test-toast-message'));
  var languageChoiceOptionElement = function(language) {
    return element.all(by.cssContainingText(
      '.e2e-test-exploration-language-select-lan', language)).first();
  };

  /*
   * Non-Interactive elements
   */
  var loadingModal = element(by.css('.e2e-test-loading-modal'));

  /*
   * Buttons
   */
  var confirmDiscardChangesButton = element(
    by.css('.e2e-test-confirm-discard-changes'));
  var discardChangesButton = element(
    by.css('.e2e-test-discard-changes'));
  var discardLostChangesButton = element(
    by.css('.e2e-test-discard-lost-changes-button'));
  var discardAndExportLostChangesButton = element(
    by.css('.e2e-test-discard-and-export-lost-changes-button'));
  var navigateToImprovementsTabButton = element(
    by.css('.e2e-test-improvements-tab'));
  var navigateToFeedbackTabButton = element(
    by.css('.e2e-test-feedback-tab'));
  var navigateToHistoryTabButton = element(
    by.css('.e2e-test-history-tab'));
  var navigateToMainTabButton = element(by.css('.e2e-test-main-tab'));
  var navigateToPreviewTabButton = element(
    by.css('.e2e-test-preview-tab'));
  var navigateToSettingsTabButton = element(
    by.css('.e2e-test-settings-tab'));
  var navigateToSettingsTabButtonMobile = element(
    by.css('.e2e-test-mobile-options'));
  var optionsDropdownMobile = element(
    by.css('.e2e-test-mobile-options-dropdown'));
  var settingsButtonMobile = element(
    by.css('.e2e-test-mobile-settings-button'));
  var saveButtonMobile = element.all(
    by.css('.e2e-test-save-changes-for-small-screens'));
  var navigateToStatsTabButton = element(by.css('.e2e-test-stats-tab'));
  var navigateToTranslationTabButton = element(
    by.css('.e2e-test-translation-tab'));
  var saveChangesButton = element(by.css('.e2e-test-save-changes'));
  var saveDiscardToggleButton = element(
    by.css('.e2e-test-save-discard-toggle'));
  var commitChangesButton = element(
    by.css('.e2e-test-save-draft-button'));
  var saveDraftButtonTextContainer = element(
    by.css('.e2e-test-save-draft-message'));
  var recommendationPromptSaveButton = element(
    by.css('.e2e-test-recommendation-prompt-save-button'));
  var publishChangesButtonTextContainer = element(
    by.css('.e2e-test-publish-changes-message'));
  var publishExplorationButton = element(
    by.css('.e2e-test-publish-exploration'));
  var prePublicationConfirmButton = element(by.css(
    '.e2e-test-confirm-pre-publication'));
  var closeButton = element(by.css('.e2e-test-share-publish-close'));

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
   * Workflows
   */
  // ---- CONTROLS ----

  this.publishCardExploration = async function(
      title, objective, category, language, tags) {
    await action.waitForAutosave();
    await action.click('Publish button', publishExplorationButton);

    await action.sendKeys(
      'Exploration title', expTitleInPostPublishModal, title);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    await action.sendKeys(
      'Exploration objective', expObjectiveInPostPublishModal, objective);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    await waitFor.presenceOf(
      expCategoryDropdownElement,
      'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(expCategoryDropdownElement)
    ).setValue(category);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    await action.click(
      'Exploration Language', expLanguageSelectorElementModal);

    await action.click(
      'Language input Choice takes too long to be visible. ',
      languageChoiceOptionElement(language));

    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    for (var elem of tags) {
      await action.click('Exploration input', expInput);
      await action.sendKeys('Exploration input', expInput, elem + '\n');
      await action.click(
        'Exploration metadata modal header',
        explorationMetadataModalHeaderElement);
      await action.waitForAutosave();
    }

    await action.click(
      'Publish confirmation button', prePublicationConfirmButton);
    await waitFor.invisibilityOf(
      prePublicationConfirmButton,
      'Exploration metadata modal takes too long to disappear.');
    await waitFor.visibilityOf(
      modalContentElement, 'Modal Content taking too long to appear');

    await action.click('Confirm Publish', confirmPublish);
    await waitFor.invisibilityOf(
      confirmPublish,
      'Confirm publish modal takes too long to disappear.');
    await waitFor.visibilityOf(
      sharePublishModalElement, 'Awesome modal taking too long to appear');

    await action.click('Share publish button', closeButton);
    await waitFor.invisibilityOf(
      closeButton, 'Close button taking too long to disappear');
  };

  this.verifyExplorationSettingFields = async function(
      title, category, objective, language, tags) {
    var explorationCategory = await action.getText(
      'Exploration Category Dropdown Element', explorationCategoryDropdown);
    var explorationLanguage = await action.getText(
      'Exploration Language Selector Element',
      expLanguageSelectorElement);
    await waitFor.visibilityOf(
      expTitle, 'Exploration Goal taking too long to appear');
    expect(await expTitle.getAttribute('value')).toMatch(title);
    expect(explorationCategory).toMatch(category);
    expect(await expObjective.getAttribute('value')).toMatch(objective);
    expect(explorationLanguage).toMatch(language);
    for (var i = 0; i < await expTagsSelectionChoiceElements.count(); i++) {
      expect(
        await action.getText(
          'Exploration Tags Selection Choice Element',
          expTagsSelectionChoiceElements.get(i))
      ).toMatch(tags[i]);
    }
  };

  this.saveChanges = async function(commitMessage) {
    await action.waitForAutosave();
    let width = (await browser.manage().window().getSize()).width;
    if (width > 768) {
      await action.click('Save changes button', saveChangesButton);
      if (commitMessage) {
        await action.sendKeys(
          'Commit message input', commitMessageInput, commitMessage);
      }

      await action.click('Save draft button', commitChangesButton);
      // TODO(#13096): Remove browser.sleep from e2e files.
      /* eslint-disable-next-line oppia/e2e-practices */
      await browser.sleep(2500);
      await waitFor.textToBePresentInElement(
        saveDraftButtonTextContainer, 'Save Draft',
        'Changes could not be saved');
    } else {
      if (await saveButtonMobile.count() === 0) {
        await action.click(
          'Settings tab button', navigateToSettingsTabButtonMobile);
      }
      await action.click('Save draft', saveButtonMobile.first());
      if (commitMessage) {
        await action.sendKeys(
          'Commit message input', commitMessageInput, commitMessage);
      }
      await action.click('Save draft button', commitChangesButton);
    }
  };

  this.publishChanges = async function(commitMessage) {
    await action.waitForAutosave();
    await action.click('Save changes button', saveChangesButton);
    await action.sendKeys(
      'Commit message input', commitMessageInput, commitMessage);
    await action.click('Publish changes button', commitChangesButton);
    // TODO(#13096): Remove browser.sleep from e2e files.
    /* eslint-disable-next-line oppia/e2e-practices */
    await browser.sleep(2500);
    await waitFor.textToBePresentInElement(
      publishChangesButtonTextContainer, 'Publish Changes',
      'Changes could not be saved');
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

  this.discardLostChanges = async function() {
    await action.click('Discard Lost Changes button', discardLostChangesButton);
    // Expect editor page to completely reload.
    await waitFor.pageToFullyLoad();
  };

  this.discardAndExportLostChanges = async function() {
    await action.click(
      'Discard Lost Changes button', discardAndExportLostChangesButton);
    await browser.driver.get('chrome://downloads/');
    var items = (
      await browser.executeScript(
        'return downloads.Manager.get().items_'));
    expect(items.length).toBe(1);
    expect(items[0].file_name).toBe('lostChanges.txt');
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

  this.acceptSaveRecommendationPrompt = async function(commitMessage) {
    await action.click(
      'Recommendation prompt Save button', recommendationPromptSaveButton);
    await waitFor.invisibilityOf(
      promptModalElement,
      'Save Recommendation Prompt modal does not disappear.');
    await waitFor.visibilityOf(
      explorationSaveModalElement,
      'Exploration Save Modal taking too long to appear');
    if (commitMessage) {
      await action.sendKeys(
        'Commit message input', commitMessageInput, commitMessage);
    }
    await action.click('Save draft button', commitChangesButton);
  };

  this.expectSaveChangesButtonEnabled = async function() {
    await action.waitForAutosave();
    expect(await saveChangesButton.isEnabled()).toBe(true);
  };

  this.expectSaveChangesButtonDisabled = async function() {
    await action.waitForAutosave();
    expect(await saveChangesButton.isEnabled()).toBe(false);
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
    let width = (await browser.manage().window().getSize()).width;
    if (width > 768) {
      await action.click('Settings tab button', navigateToSettingsTabButton);
    } else {
      if (await saveButtonMobile.count() === 0) {
        await action.click(
          'Settings tab button', navigateToSettingsTabButtonMobile);
      }
      await action.click(
        'Options button dropdown', optionsDropdownMobile);
      await action.click(
        'Settings tab', settingsButtonMobile);
    }
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

  // ---- INTERNET CONNECTION ----

  this.waitForOnlineAlert = async function() {
    await waitFor.visibilityOf(
      toastMessage,
      'Online info toast message taking too long to appear.');
    expect(await action.getText('Toast Message', toastMessage)).toMatch(
      'Reconnected. Checking whether your changes are mergeable.');
    await waitFor.invisibilityOf(
      toastMessage,
      'Online info toast message taking too long to disappear.');
  };

  this.waitForOfflineAlert = async function() {
    await waitFor.visibilityOf(
      toastMessage,
      'Offline warning toast message taking too long to appear.');
    expect(await action.getText('Toast Message', toastMessage)).toMatch(
      'Looks like you are offline. You can continue working, and can save ' +
      'your changes once reconnected.');
    await waitFor.invisibilityOf(
      toastMessage,
      'Offline warning toast message taking too long to disappear.');
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
