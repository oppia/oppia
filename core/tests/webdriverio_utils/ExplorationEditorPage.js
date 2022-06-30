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
   * Workflows
   */
  // ---- CONTROLS ----

  this.publishCardExploration = async function(
      title, objective, category, language, tags) {
    await action.waitForAutosave();
    var publishExplorationButton = await $('.e2e-test-publish-exploration');
    await action.click('Publish button', publishExplorationButton);

    var expTitle = await $('.e2e-test-exploration-title-input');
    await action.keys('Exploration title', expTitle, title);
    var explorationMetadataModalHeaderElement = await $(
      '.e2e-test-metadata-modal-header');
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    var expObjective = await $('.e2e-test-exploration-objective-input');
    await action.keys('Exploration objective', expObjective, objective);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    var expCategoryDropdownElement = await $(
      '.e2e-test-exploration-category-dropdown');
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

    var expLanguageSelectorElement = await $(
      '.e2e-test-exploration-language-select');
    await action.select(
      'Exploration Language', expLanguageSelectorElement,
      language);
    await action.click(
      'Exploration metadata modal header',
      explorationMetadataModalHeaderElement);
    await action.waitForAutosave();

    for (var elem of tags) {
      var expTags = await $('.e2e-test-tags');
      var expInput = await expTags.$('<input>');
      await action.click('Exploration input', expInput);
      await action.keys('Exploration input', expInput, elem + '\n');
      await action.click(
        'Exploration metadata modal header',
        explorationMetadataModalHeaderElement);
      await action.waitForAutosave();
    }

    var prePublicationConfirmButton = await $(
      '.e2e-test-confirm-pre-publication');
    await action.click(
      'Publish confirmation button', prePublicationConfirmButton);
    await waitFor.invisibilityOf(
      prePublicationConfirmButton,
      'Exploration metadata modal takes too long to disappear.');
    var modalContentElement = await $('.modal-content');
    await waitFor.visibilityOf(
      modalContentElement, 'Modal Content taking too long to appear');

    var confirmPublish = await $('.e2e-test-confirm-publish');
    await action.click('Confirm Publish', confirmPublish);
    await waitFor.invisibilityOf(
      confirmPublish,
      'Confirm publish modal takes too long to disappear.');
    var sharePublishModalElement = await $('.e2e-test-share-publish-modal');
    await waitFor.visibilityOf(
      sharePublishModalElement, 'Awesome modal taking too long to appear');

    var closeButton = await $('.e2e-test-share-publish-close');
    await action.click('Share publish button', closeButton);
    await waitFor.invisibilityOf(
      closeButton, 'Close button taking too long to disappear');
  };

  this.saveChanges = async function(commitMessage) {
    await action.waitForAutosave();
    var saveChangesButton = await $('.e2e-test-save-changes');
    await action.click('Save changes button', saveChangesButton);
    if (commitMessage) {
      var commitMessageInput = await $('.e2e-test-commit-message-input');
      await action.keys(
        'Commit message input', commitMessageInput, commitMessage);
    }
    var commitChangesButton = await $('.e2e-test-save-draft-button');
    await action.click('Save draft button', commitChangesButton);
    // TODO(#13096): Remove browser.pause from e2e files.
    // eslint-disable-next-line wdio/no-pause
    await browser.pause(2500);
    var saveDraftButtonTextContainer = await $('.e2e-test-save-draft-message');
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
    var navigateToSettingsTabButton = await $('.e2e-test-settings-tab');
    await action.click('Settings tab button', navigateToSettingsTabButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
