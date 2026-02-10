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
 * @fileoverview Page object for the exploration editor, for use in WebdriverIO
 * tests.
 */

var action = require('./action');
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorImprovementsTab = require('../webdriverio_utils/ExplorationEditorImprovementsTab.js');
var ExplorationEditorFeedbackTab = require('../webdriverio_utils/ExplorationEditorFeedbackTab.js');
var ExplorationEditorHistoryTab = require('../webdriverio_utils/ExplorationEditorHistoryTab.js');
var ExplorationEditorMainTab = require('../webdriverio_utils/ExplorationEditorMainTab.js');
var ExplorationEditorSettingsTab = require('../webdriverio_utils/ExplorationEditorSettingsTab.js');
var ExplorationEditorStatsTab = require('../webdriverio_utils/ExplorationEditorStatsTab.js');
var ExplorationEditorTranslationTab = require('../webdriverio_utils/ExplorationEditorTranslationTab.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');

var ExplorationEditorPage = function () {
  /*
   * Interactive elements
   */
  var commitMessageInput = $('.e2e-test-commit-message-input');
  var confirmPublish = $('.e2e-test-confirm-publish');
  var expCategoryDropdownElement = $(
    '.e2e-test-exploration-category-metadata-modal'
  );
  var expLanguageSelectorElement = $('.e2e-test-exploration-language-select');
  var expLanguageSelectorElementModal = $(
    '.e2e-test-exploration-language-select-modal'
  );
  var explorationSaveModalElement = $('.e2e-test-exploration-save-modal');
  var expTagsSelectionChoiceElementsSelector = function () {
    return $$('.select2-selection__choice');
  };
  var expObjective = $('.e2e-test-exploration-objective-input');
  var expInput = $('.e2e-test-chip-list-tags');
  var expTitle = $('.e2e-test-exploration-title-input');
  var expTitleInPostPublishModal = $('.e2e-test-exploration-title-input-modal');
  var expObjectiveInPostPublishModal = $(
    '.e2e-test-exploration-objective-input-modal'
  );
  var explorationMetadataModalHeaderElement = $(
    '.e2e-test-metadata-modal-header'
  );
  var modalContentElement = $('.modal-content');
  var promptModalElement = $('.e2e-test-save-prompt-modal');
  var languageChoiceOptionElement = function (language) {
    return $$(`.e2e-test-exploration-language-select-lan=${language}`);
  };
  var explorationCategoryDropdown = $(
    '.e2e-test-exploration-category-dropdown'
  );
  var sharePublishModalElement = $('.e2e-test-share-publish-modal');
  var toastMessage = $('.e2e-test-toast-message');

  /*
   * Non-Interactive elements
   */
  var loadingModal = $('.e2e-test-loading-modal');

  /*
   * Buttons
   */
  var closeButton = $('.e2e-test-share-publish-close');
  var commitChangesButton = $('.e2e-test-save-draft-button');
  var confirmDiscardChangesButton = $('.e2e-test-confirm-discard-changes');
  var discardChangesButton = $('.e2e-test-discard-changes');
  var discardLostChangesButton = $('.e2e-test-discard-lost-changes-button');
  var discardAndExportLostChangesButton = $(
    '.e2e-test-discard-and-export-lost-changes-button'
  );
  var navigateToImprovementsTabButton = $('.e2e-test-improvements-tab');
  var navigateToFeedbackTabButton = $('.e2e-test-feedback-tab');
  var navigateToHistoryTabButton = $('.e2e-test-history-tab');
  var navigateToMainTabButton = $('.e2e-test-main-tab');
  var navigateToPreviewTabButton = $('.e2e-test-preview-tab');
  var navigateToSettingsTabButton = $('.e2e-test-settings-tab');
  var navigateToStatsTabButton = $('.e2e-test-stats-tab');
  var navigateToTranslationTabButton = $('.e2e-test-translation-tab');
  var prePublicationConfirmButton = $('.e2e-test-confirm-pre-publication');
  var publishChangesButtonTextContainer = $(
    '.e2e-test-publish-changes-message'
  );
  var publishExplorationButton = $('.e2e-test-publish-exploration');
  var recommendationPromptSaveButton = $(
    '.e2e-test-recommendation-prompt-save-button'
  );
  var saveChangesButton = $('.e2e-test-save-changes');
  var saveDiscardToggleButton = $('.e2e-test-save-discard-toggle');
  var saveDraftButtonTextContainer = $('.e2e-test-save-draft-message');
  var saveButtonMobileSelector = function () {
    return $$('.e2e-test-save-changes-for-small-screens');
  };
  var navigateToSettingsTabButtonMobile = $('.e2e-test-mobile-options');
  var optionsDropdownMobile = $('.e2e-test-mobile-options-dropdown');
  var settingsButtonMobile = $('.e2e-test-mobile-settings-button');

  /*
   * Components
   */
  this.getImprovementsTab = function () {
    return new ExplorationEditorImprovementsTab.ExplorationEditorImprovementsTab();
  };

  this.getFeedbackTab = function () {
    return new ExplorationEditorFeedbackTab.ExplorationEditorFeedbackTab();
  };

  this.getHistoryTab = function () {
    return new ExplorationEditorHistoryTab.ExplorationEditorHistoryTab();
  };

  this.getMainTab = function () {
    return new ExplorationEditorMainTab.ExplorationEditorMainTab();
  };

  this.getSettingsTab = function () {
    return new ExplorationEditorSettingsTab.ExplorationEditorSettingsTab();
  };

  this.getStatsTab = function () {
    return new ExplorationEditorStatsTab.ExplorationEditorStatsTab();
  };

  this.getTranslationTab = function () {
    return new ExplorationEditorTranslationTab.ExplorationEditorTranslationTab();
  };

  this.getPreviewTab = function () {
    return new ExplorationPlayerPage.ExplorationPlayerPage();
  };

  /*
   * Workflows
   */
  // ---- CONTROLS ----

  this.publishCardExploration = async function (
    title,
    objective,
    category,
    language,
    tags
  ) {
    await action.waitForAutosave();
    await action.click('Publish button', publishExplorationButton);

    await action.setValue(
      'Exploration title',
      expTitleInPostPublishModal,
      title
    );
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement
    );
    await action.waitForAutosave();

    await action.setValue(
      'Exploration objective',
      expObjectiveInPostPublishModal,
      objective
    );
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement
    );
    await action.waitForAutosave();

    await waitFor.presenceOf(
      expCategoryDropdownElement,
      'Category input takes too long to be visible.'
    );
    await (
      await forms.AutocompleteDropdownEditor(expCategoryDropdownElement)
    ).setValue(category);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement
    );
    await action.waitForAutosave();

    await action.click('Exploration Language', expLanguageSelectorElementModal);

    var languageChoiceOption = await languageChoiceOptionElement(language)[0];
    await action.click('Language input Choice', languageChoiceOption);

    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement
    );
    await action.waitForAutosave();

    for (var elem of tags) {
      await action.click('Exploration input', expInput);
      await action.setValue('Exploration input', expInput, elem + '\n');
      await action.click(
        'Exploration metadata modal header',
        explorationMetadataModalHeaderElement
      );
      await action.waitForAutosave();
    }

    await action.click(
      'Publish confirmation button',
      prePublicationConfirmButton
    );
    await waitFor.invisibilityOf(
      prePublicationConfirmButton,
      'Exploration metadata modal takes too long to disappear.'
    );
    await waitFor.visibilityOf(
      modalContentElement,
      'Modal Content taking too long to appear'
    );

    await action.click('Confirm Publish', confirmPublish);
    await waitFor.invisibilityOf(
      confirmPublish,
      'Confirm publish modal takes too long to disappear.'
    );
    await waitFor.visibilityOf(
      sharePublishModalElement,
      'Awesome modal taking too long to appear'
    );

    await action.click('Share publish button', closeButton);
    await waitFor.invisibilityOf(
      closeButton,
      'Close button taking too long to disappear'
    );
  };

  this.verifyExplorationSettingFields = async function (
    title,
    category,
    objective,
    language,
    tags
  ) {
    var explorationCategory = await action.getText(
      'Exploration Category Dropdown Element',
      explorationCategoryDropdown
    );
    var explorationLanguage = await action.getText(
      'Exploration Language Selector Element',
      expLanguageSelectorElement
    );
    await waitFor.visibilityOf(
      expTitle,
      'Exploration Goal taking too long to appear'
    );
    var expTitleValue = await action.getValue('Exploration Title', expTitle);
    expect(expTitleValue).toMatch(title);
    expect(explorationCategory).toMatch(category);
    var expObjectiveValue = await action.getValue(
      'Exploration Objective',
      expObjective
    );
    expect(expObjectiveValue).toMatch(objective);
    expect(explorationLanguage).toBe(language);
    var expTagsSelectionChoiceElements =
      await expTagsSelectionChoiceElementsSelector();
    for (var i = 0; i < expTagsSelectionChoiceElements.length; i++) {
      expect(
        await action.getText(
          'Exploration Tags Selection Choice Element',
          expTagsSelectionChoiceElements[i]
        )
      ).toMatch(tags[i]);
    }
  };

  // eslint-disable-next-line padded-blocks
  this.saveChanges = async function (commitMessage) {
    await action.waitForAutosave();
    let width = (await browser.getWindowSize()).width;
    if (width > 768) {
      await action.click('Save changes button', saveChangesButton);
      if (commitMessage) {
        await action.setValue(
          'Commit message input',
          commitMessageInput,
          commitMessage
        );
      }

      await action.click('Save draft button', commitChangesButton);
      // TODO(#13096): Remove browser.pause from e2e files.
      /* eslint-disable-next-line oppia/e2e-practices */
      await browser.pause(2500);
      await waitFor.textToBePresentInElement(
        saveDraftButtonTextContainer,
        'Save Draft',
        'Changes could not be saved'
      );
    } else {
      var saveButtonMobile = await saveButtonMobileSelector();
      if ((await saveButtonMobile.length) === 0) {
        await action.click(
          'Settings tab button',
          navigateToSettingsTabButtonMobile
        );
      }
      await action.click('Save draft', saveButtonMobile[0]);
      if (commitMessage) {
        await action.setValue(
          'Commit message input',
          commitMessageInput,
          commitMessage
        );
      }
      await action.click('Save draft button', commitChangesButton);
    }
  };

  this.publishChanges = async function (commitMessage) {
    await action.waitForAutosave();
    await action.click('Save changes button', saveChangesButton);
    await action.setValue(
      'Commit message input',
      commitMessageInput,
      commitMessage
    );
    await action.click('Publish changes button', commitChangesButton);
    // TODO(#13096): Remove browser.pause from e2e files.
    /* eslint-disable-next-line oppia/e2e-practices */
    await browser.pause(2500);
    await waitFor.textToBePresentInElement(
      publishChangesButtonTextContainer,
      'Publish Changes',
      'Changes could not be saved'
    );
  };

  this.discardChanges = async function () {
    await action.waitForAutosave();
    await action.click('Save Discard Toggle button', saveDiscardToggleButton);
    await action.click('Discard Changes button', discardChangesButton);
    await action.click(
      'Confirm Discard Changes button',
      confirmDiscardChangesButton
    );
    await waitFor.invisibilityOf(
      loadingModal,
      'Loading modal taking too long to disappear'
    );
    await waitFor.invisibilityOfInfoToast(
      'Changes take too long to be discarded.'
    );
    // Expect editor page to completely reload.
    await waitFor.pageToFullyLoad();
  };

  this.discardLostChanges = async function () {
    await action.click('Discard Lost Changes button', discardLostChangesButton);
    // Expect editor page to completely reload.
    await waitFor.pageToFullyLoad();
  };

  this.discardAndExportLostChanges = async function () {
    await action.click(
      'Discard Lost Changes button',
      discardAndExportLostChangesButton
    );
    await browser.url('chrome://downloads/');
    var items = await browser.execute('return downloads.Manager.get().items_');
    expect(items.length).toBe(1);
    expect(items[0].file_name).toBe('lostChanges.txt');
    // Expect editor page to completely reload.
    await waitFor.pageToFullyLoad();
  };

  this.expectCannotSaveChanges = async function () {
    await action.waitForAutosave();
    expect(await saveChangesButton.isExisting()).toBeFalsy();
  };

  this.expectCanPublishChanges = async function () {
    await action.waitForAutosave();
    expect(await publishExplorationButton.isEnabled()).toBeTrue();
  };

  this.expectCannotPublishChanges = async function () {
    await action.waitForAutosave();
    expect(await publishExplorationButton.isEnabled()).toBeFalsy();
  };

  this.acceptSaveRecommendationPrompt = async function (commitMessage) {
    await action.click(
      'Recommendation prompt Save button',
      recommendationPromptSaveButton
    );
    await waitFor.invisibilityOf(
      promptModalElement,
      'Save Recommendation Prompt modal does not disappear.'
    );
    await waitFor.visibilityOf(
      explorationSaveModalElement,
      'Exploration Save Modal taking too long to appear'
    );
    if (commitMessage) {
      await action.setValue(
        'Commit message input',
        commitMessageInput,
        commitMessage
      );
    }
    await action.click('Save draft button', commitChangesButton);
  };

  this.expectSaveChangesButtonEnabled = async function () {
    await action.waitForAutosave();
    expect(await saveChangesButton.isEnabled()).toBe(true);
  };

  this.expectSaveChangesButtonDisabled = async function () {
    await action.waitForAutosave();
    expect(await saveChangesButton.isEnabled()).toBe(false);
  };

  // ---- NAVIGATION ----

  this.navigateToImprovementsTab = async function () {
    await action.click(
      'Improvements tab button',
      navigateToImprovementsTabButton
    );
    await waitFor.pageToFullyLoad();
  };

  this.navigateToHistoryTab = async function () {
    await action.click('History tab button', navigateToHistoryTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToFeedbackTab = async function () {
    await action.click('Feedback tab button', navigateToFeedbackTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToMainTab = async function () {
    await action.waitForAutosave();
    await action.click('Main tab button', navigateToMainTabButton);
    // Wait for the appearing and disappearing action to get completed after
    // the main tab button is clicked.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(2000);
  };

  this.navigateToPreviewTab = async function () {
    await action.click('Preview tab button', navigateToPreviewTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.waitForPreviewTabToLoad = async function () {
    // We need to use browser.pause in order to explicitly wait for preview tab
    // to load because waitFor.pageToFullyLoad only works when we navigate to
    // preview tab for the first time.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(2000);
  };

  this.navigateToSettingsTab = async function () {
    let width = (await browser.getWindowSize()).width;
    if (width > 768) {
      await action.click('Settings tab button', navigateToSettingsTabButton);
    } else {
      var saveButtonMobile = await saveButtonMobileSelector();
      if ((await saveButtonMobile.length) === 0) {
        await action.click(
          'Settings tab button',
          navigateToSettingsTabButtonMobile
        );
      }
      await action.click('Options button dropdown', optionsDropdownMobile);
      await action.click('Settings tab', settingsButtonMobile);
    }
    await waitFor.pageToFullyLoad();
  };

  this.navigateToStatsTab = async function () {
    await action.click('Statistics tab button', navigateToStatsTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToTranslationTab = async function () {
    await action.click(
      'Translation tab button',
      navigateToTranslationTabButton
    );
    await waitFor.pageToFullyLoad();
  };

  // ---- INTERNET CONNECTION ----

  this.waitForOnlineAlert = async function () {
    await waitFor.visibilityOf(
      toastMessage,
      'Online info toast message taking too long to appear.'
    );
    expect(await action.getText('Toast Message', toastMessage)).toMatch(
      'Reconnected. Checking whether your changes are mergeable.'
    );
    await waitFor.invisibilityOf(
      toastMessage,
      'Online info toast message taking too long to disappear.'
    );
  };

  this.waitForOfflineAlert = async function () {
    await waitFor.visibilityOf(
      toastMessage,
      'Offline warning toast message taking too long to appear.'
    );
    expect(await action.getText('Toast Message', toastMessage)).toMatch(
      'Looks like you are offline. You can continue working, and can save ' +
        'your changes once reconnected.'
    );
    await waitFor.invisibilityOf(
      toastMessage,
      'Offline warning toast message taking too long to disappear.'
    );
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
