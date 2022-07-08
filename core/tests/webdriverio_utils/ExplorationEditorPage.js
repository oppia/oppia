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
  var commitMessageInput = $('.e2e-test-commit-message-input');
  var confirmPublish = $('.e2e-test-confirm-publish');
  var expCategoryDropdownElement = $('.e2e-test-exploration-category-dropdown');
  var expLanguageSelectorElement = $('.e2e-test-exploration-language-select');
  var expObjective = $('.e2e-test-exploration-objective-input');
  var expTags = $('.e2e-test-tags');
  var expTitle = $('.e2e-test-exploration-title-input');
  var explorationMetadataModalHeaderElement = $(
    '.e2e-test-metadata-modal-header');
  var modalContentElement = $('.modal-content');
  var sharePublishModalElement = $('.e2e-test-share-publish-modal');

  /*
   * Buttons
   */
  var closeButton = $('.e2e-test-share-publish-close');
  var commitChangesButton = $('.e2e-test-save-draft-button');
  var navigateToSettingsTabButton = $('.e2e-test-settings-tab');
  var prePublicationConfirmButton = $('.e2e-test-confirm-pre-publication');
  var publishExplorationButton = $('.e2e-test-publish-exploration');
  var saveChangesButton = $('.e2e-test-save-changes');
  var saveDraftButtonTextContainer = $('.e2e-test-save-draft-message');

  /*
   * Components
   */
  this.getMainTab = function() {
    return new ExplorationEditorMainTab.ExplorationEditorMainTab();
  };
  this.getSettingsTab = function() {
    return new ExplorationEditorSettingsTab.ExplorationEditorSettingsTab();
  };

  /*
   * Workflows
   */
  // ---- CONTROLS ----

  this.publishCardExploration = async function(
      title, objective, category, language, tags) {
    await action.waitForAutosave();
    await action.click('Publish button', publishExplorationButton);

    await action.setValue('Exploration title', expTitle, title);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    await action.setValue('Exploration objective', expObjective, objective);
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
      await action.setValue('Exploration input', expInput, elem + '\n');
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
    await action.click('Save changes button', saveChangesButton);
    if (commitMessage) {
      await action.setValue(
        'Commit message input', commitMessageInput, commitMessage);
    }
    await action.click('Save draft button', commitChangesButton);
    // TODO(#13096): Remove browser.pause from e2e files.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(2500);
    await waitFor.textToBePresentInElement(
      saveDraftButtonTextContainer, 'Save Draft',
      'Changes could not be saved');
  };

  // ---- NAVIGATION ----

  this.navigateToSettingsTab = async function() {
    await action.click('Settings tab button', navigateToSettingsTabButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
