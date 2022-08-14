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
 * @fileoverview Page object for the exploration editor's settings tab, for
 * use in Protractor tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var action = require('./action.js');

var ExplorationEditorSettingsTab = function() {
  /*
   * Interactive elements
   */
  var explorationCategoryInput = element(
    by.css('.e2e-test-exploration-category'));
  var explorationLanguageInput = element(
    by.css('.e2e-test-exploration-language-select'));
  var explorationObjectiveInput = element(
    by.css('.e2e-test-exploration-objective-input'));
  var explorationObjectiveWarning = element(
    by.css('.e2e-test-exploration-objective-warning'));
  var explorationSummaryTile = element(
    by.css('.e2e-test-exploration-summary-tile'));
  var explorationTitleInput = element(
    by.css('.e2e-test-exploration-title-input'));
  var initialStateSelect = element(
    by.css('.e2e-test-initial-state-select'));
  var initialStateSelectAllOptions = element.all(
    by.css('.e2e-test-initial-state-select-element'));
  var initialStateSelectOption = function(stateName) {
    return element(
      by.cssContainingText(
        '.e2e-test-initial-state-select-element', stateName));
  };
  var neutralElement = element(by.css('.e2e-test-settings-container'));

  /*
   * Buttons
   */
  var closePreviewSummaryButton = element(
    by.css('.e2e-test-close-preview-summary-modal'));
  var openPreviewSummaryButton = element(
    by.css('.e2e-test-open-preview-summary-modal'));
  var deleteExplorationButton = element(
    by.css('.e2e-test-delete-exploration-button'));
  var confirmDeleteExplorationButton = element(
    by.css('.e2e-test-really-delete-exploration-button'));
  var disableCorrectnessFeedbackButton = element(
    by.css('.e2e-test-enable-mark-correctness-feedback'));

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
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await action.click(
      'Disable Correctness Feedback Button', disableCorrectnessFeedbackButton);
    await action.click('Neutral element', neutralElement);
  };

  this.expectAvailableFirstStatesToBe = async function(names) {
    await waitFor.presenceOf(
      initialStateSelect, 'Initial state select takes too long to be visible.');
    await action.click('State Dropdown element', initialStateSelect, true);

    var options = await initialStateSelectAllOptions.map(async function(elem) {
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
    expect(await explorationSummaryTile.isPresent()).toBeTruthy();
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
      await forms.AutocompleteDropdownEditor(
        explorationCategoryInput)
    ).setValue(category);
  };

  this.setFirstState = async function(stateName) {
    await action.click('Neutral element', neutralElement, true);
    await action.waitForAutosave();
    await waitFor.presenceOf(
      initialStateSelect, 'Initial state select takes too long to be visible.');
    await action.click('State Dropdown element', initialStateSelect, true);

    await action.click(
      'State name option', initialStateSelectOption(stateName), true);
    await action.click('Neutral element', neutralElement);
  };

  this.setLanguage = async function(language) {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await waitFor.presenceOf(
      explorationLanguageInput, 'Language input takes too long to be visible.');

    await action.click(
      'Exploration Language', explorationLanguageInput, true);

    var languageButton = element.all(by.cssContainingText(
      '.e2e-test-exploration-language-selector-choice', language)).first();
    await action.click('Language button', languageButton, true);
    await action.click('Neutral element', neutralElement);
  };

  this.setObjective = async function(objective) {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await action.clear(
      'Exploration Objective input', explorationObjectiveInput);
    await action.sendKeys(
      'Exploration Objective input', explorationObjectiveInput, objective);
    await action.click('Neutral element', neutralElement);
  };

  this.setTitle = async function(title) {
    await action.waitForAutosave();
    await general.scrollToTop();
    await action.clear('Exploration Title Input', explorationTitleInput);
    await action.sendKeys(
      'Exploration Title Input', explorationTitleInput, title);
    await action.click('Neutral element', neutralElement);
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
    expect(await initialStateSelect.$('option:checked').getText()).
      toEqual(firstState);
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
    expect(await explorationObjectiveInput.getAttribute('value')).
      toEqual(objective);
  };

  this.expectTitleToBe = async function(title) {
    await waitFor.presenceOf(
      explorationTitleInput, 'Title input takes too long to be visible.');
    expect(await explorationTitleInput.getAttribute('value')).
      toEqual(title);
  };

  this.expectWarningsColorToBe = async function(color) {
    await waitFor.presenceOf(
      explorationObjectiveWarning,
      'Objective warning takes too long to be visible.');
    expect(await explorationObjectiveWarning.getCssValue('color')).
      toEqual(color);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
