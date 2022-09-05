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
 * @fileoverview Page object for the exploration editor's settings tab, for
 * use in WebdriverIO tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var action = require('./action.js');

var ExplorationEditorSettingsTab = function() {
  /*
   * Interactive elements
   */
  var explorationCategoryInput = $('.e2e-test-exploration-category-input');
  var explorationLanguageInput = $('.e2e-test-exploration-language-select');
  var explorationObjectiveInput = $('.e2e-test-exploration-objective-input');
  var explorationObjectiveWarning = $(
    '.e2e-test-exploration-objective-warning');
  var explorationSummaryTile = $('.e2e-test-exploration-summary-tile');
  var explorationTitleInput = $('.e2e-test-exploration-title-input');
  var initialStateSelect = $('.e2e-test-initial-state-select');
  var initialStateSelector = '.e2e-test-initial-state-select';
  var neutralElement = $('.e2e-test-settings-container');

  /*
   * Buttons
   */
  var closePreviewSummaryButton = $('.e2e-test-close-preview-summary-modal');
  var confirmDeleteExplorationButton = $(
    '.e2e-test-really-delete-exploration-button');
  var deleteExplorationButton = $('.e2e-test-delete-exploration-button');
  var disableCorrectnessFeedbackButton = $(
    '.e2e-test-enable-mark-correctness-feedback');
  var openPreviewSummaryButton = $('.e2e-test-open-preview-summary-modal');

  /*
   * Workflows
   */
  this.deleteExploration = async function() {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await action.click('Delete Exploration Button', deleteExplorationButton);
    await action.click(
      'Confirm Delete Exploration Button',
      confirmDeleteExplorationButton);
    await waitFor.invisibilityOf(
      confirmDeleteExplorationButton,
      'Delete Exploration modal takes too long to disappear');
    // Returning to /creator-dashboard.
    await waitFor.pageToFullyLoad();
  };

  this.disableCorrectnessFeedback = async function() {
    await action.waitForAutosave();
    await action.click(
      'Disable Correctness Feedback Button', disableCorrectnessFeedbackButton);
  };

  this.expectAvailableFirstStatesToBe = async function(names) {
    await waitFor.visibilityOf(
      initialStateSelect,
      'Initial state select takes too long to be visible.');
    await waitFor.numberOfElementsToBe(
      initialStateSelector, 'Options', 3, '<option>',);
    var options = await initialStateSelect.$$('<option>')
      .map(async function(elem) {
        await waitFor.visibilityOf(
          elem,
          'option element taking too long to appear');
        return await elem.getText();
      });
    expect(options.sort()).toEqual(names.sort());
  };

  this.openAndClosePreviewSummaryTile = async function() {
    await action.waitForAutosave();
    await action.click('Open preview summary', openPreviewSummaryButton);
    await waitFor.visibilityOf(
      explorationSummaryTile, 'Summary Tile takes too long to appear');
    expect(await explorationSummaryTile.isExisting()).toBeTruthy();
    await action.click(
      'Close Preview Summary Button',
      closePreviewSummaryButton);
    await waitFor.invisibilityOf(
      explorationSummaryTile, 'Summary Tile takes too long to disappear');
    await action.click('Neutral element', neutralElement);
  };

  this.setCategory = async function(category) {
    await waitFor.presenceOf(
      explorationCategoryInput, 'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
  };

  this.setFirstState = async function(stateName) {
    await action.waitForAutosave();
    await waitFor.presenceOf(
      initialStateSelect, 'Initial state select takes too long to be visible.');
    await initialStateSelect.selectByVisibleText(stateName);
  };

  this.setLanguage = async function(language) {
    await waitFor.presenceOf(
      explorationLanguageInput, 'Language input takes too long to be visible.');
    await explorationLanguageInput.selectByVisibleText(language);
  };

  this.setObjective = async function(objective) {
    await action.clear(
      'Exploration Objective input', explorationObjectiveInput);
    await action.setValue(
      'Exploration Objective input', explorationObjectiveInput, objective);
  };

  this.setTitle = async function(title) {
    await action.waitForAutosave();
    await general.scrollToTop();
    await action.clear('Exploration Title Input', explorationTitleInput);
    await action.setValue(
      'Exploration Title Input', explorationTitleInput, title);
  };

  this.expectCategoryToBe = async function(category) {
    await waitFor.presenceOf(
      explorationCategoryInput,
      'Exploration category input takes too long to be visible.');
    expect(await explorationCategoryInput.$('option:checked').getText()).
      toEqual(category);
  };

  this.expectFirstStateToBe = async function(firstState) {
    await waitFor.presenceOf(
      initialStateSelect, 'Initial state select takes too long to be visible.');
    await waitFor.textToBePresentInElement(
      initialStateSelect.$('option:checked'),
      firstState,
      `Initial state is not set as ${firstState}`);
  };

  this.expectLanguageToBe = async function(language) {
    await waitFor.presenceOf(
      explorationLanguageInput, 'Language input takes too long to be visible.');
    expect(await explorationLanguageInput.$('option:checked').getText()).
      toEqual(language);
  };

  this.expectObjectiveToBe = async function(objective) {
    await waitFor.presenceOf(
      explorationObjectiveInput,
      'Objective input takes too long to be visible.');
    expect(await explorationObjectiveInput.getValue()).
      toEqual(objective);
  };

  this.expectTitleToBe = async function(title) {
    await waitFor.presenceOf(
      explorationTitleInput, 'Title input takes too long to be visible.');
    expect(await explorationTitleInput.getValue()).
      toEqual(title);
  };

  this.expectWarningsColorToBe = async function(color) {
    await waitFor.presenceOf(
      explorationObjectiveWarning,
      'Objective warning takes too long to be visible.');
    expect((await explorationObjectiveWarning.getCSSProperty('color')).value).
      toEqual(color);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
