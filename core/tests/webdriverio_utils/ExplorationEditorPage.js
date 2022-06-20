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

var ExplorationEditorMainTab = require(
  '../webdriverio_utils/ExplorationEditorMainTab.js');
var ExplorationEditorSettingsTab = require(
  '../webdriverio_utils/ExplorationEditorSettingsTab.js');

var ExplorationEditorPage = function() {
  /*
  * Interactive elements
  */
  var commitMessageInput = $('.protractor-test-commit-message-input');
  var neutralElement = $$('.protractor-test-neutral-element')[0];
  var expTitle = $(
    '.protractor-test-exploration-title-input');
  var expObjective = $(
    '.protractor-test-exploration-objective-input');
  var expTags = $('.protractor-test-tags');
  var expCategoryDropdownElement = $(
    '.protractor-test-exploration-category-dropdown');
  var expLanguageSelectorElement = $(
    '.protractor-test-exploration-language-select');
  var explorationMetadataModalHeaderElement = $(
    '.protractor-test-metadata-modal-header');
  var confirmPublish = $('.protractor-test-confirm-publish');
  var expTagsSelectionChoiceElements = $$('.select2-selection__choice');
  var modalContentElement = $('.modal-content');
  var sharePublishModalElement = $('.protractor-test-share-publish-modal');
  var selectionRenderedElement = $('.select2-selection__rendered');
  var promptModalElement = $('.protractor-test-save-prompt-modal');
  var explorationSaveModalElement = $(
    '.protractor-test-exploration-save-modal');
  var toastMessage = $('.protractor-test-toast-message');

  /*
   * Non-Interactive elements
   */
  var loadingModal = $('.protractor-test-loading-modal');

  /*
   * Buttons
   */
  var confirmDiscardChangesButton = $(
    '.protractor-test-confirm-discard-changes');
  var discardChangesButton = $('.protractor-test-discard-changes');
  var discardLostChangesButton = $(
    '.protractor-test-discard-lost-changes-button');
  var discardAndExportLostChangesButton = $(
    '.protractor-test-discard-and-export-lost-changes-button');
  var navigateToImprovementsTabButton = $('.protractor-test-improvements-tab');
  var navigateToFeedbackTabButton = $('.protractor-test-feedback-tab');
  var navigateToHistoryTabButton = $('.protractor-test-history-tab');
  var navigateToMainTabButton = $('.protractor-test-main-tab');
  var navigateToPreviewTabButton = $('.protractor-test-preview-tab');
  var navigateToSettingsTabButton = $('.protractor-test-settings-tab');
  var navigateToStatsTabButton = $('.protractor-test-stats-tab');
  var navigateToTranslationTabButton = $('.protractor-test-translation-tab');
  var saveChangesButton = $('.protractor-test-save-changes');
  var saveDiscardToggleButton = $('.protractor-test-save-discard-toggle');
  var commitChangesButton = $('.protractor-test-save-draft-button');
  var saveDraftButtonTextContainer = $('.protractor-test-save-draft-message');
  var recommendationPromptSaveButton = $(
    '.protractor-test-recommendation-prompt-save-button');
  var publishChangesButtonTextContainer = $(
    '.protractor-test-publish-changes-message');
  var publishExplorationButton = $('.protractor-test-publish-exploration');
  var prePublicationConfirmButton = $(
    '.protractor-test-confirm-pre-publication');
  var closeButton = $('.protractor-test-share-publish-close');

  /*
   * Workflows
   */
  // ---- CONTROLS ----

  this.publishCardExploration = async function(
      title, objective, category, language, tags) {
    await action.waitForAutosave();
    await action.click('Publish button', publishExplorationButton);

    await action.keys('Exploration title', expTitle, title);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    await action.keys('Exploration objective', expObjective, objective);
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

    await action.select(
      'Exploration Language', expLanguageSelectorElement,
      language);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    for (var elem of tags) {
      var expInput = expTags.$('<input>');
      await action.click('Exploration input', expInput);
      await action.keys('Exploration input', expInput, elem + '\n');
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

  this.saveChanges = async function(commitMessage) {
    await action.waitForAutosave();
    var saveChangesButton = $('.protractor-test-save-changes');
    await action.click('Save changes button', saveChangesButton);
    if (commitMessage) {
      var commitMessageInput = $(
        '.protractor-test-commit-message-input');
      await action.keys(
        'Commit message input', commitMessageInput, commitMessage);
    }
    var commitChangesButton = $(
      '.protractor-test-save-draft-button');
    await action.click('Save draft button', commitChangesButton);
    // TODO(#13096): Remove browser.sleep from e2e files.
    // eslint-disable-next-line wdio/no-pause
    await browser.pause(2500);
    var saveDraftButtonTextContainer = $(
      '.protractor-test-save-draft-message');
    await waitFor.textToBePresentInElement(
      saveDraftButtonTextContainer, 'Save Draft',
      'Changes could not be saved');
  };

  /*
   * Components
   */
  this.getMainTab = function() {
    return new ExplorationEditorMainTab.ExplorationEditorMainTab();
  };
  this.getSettingsTab = function() {
    return new ExplorationEditorSettingsTab.ExplorationEditorSettingsTab();
  };

  // ---- NAVIGATION ----

  this.navigateToSettingsTab = async function() {
    var navigateToSettingsTabButton = await $('.protractor-test-settings-tab');
    await action.click('Settings tab button', navigateToSettingsTabButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
