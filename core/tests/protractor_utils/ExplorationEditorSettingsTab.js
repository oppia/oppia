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
    by.css('.protractor-test-exploration-category-input'));
  var explorationLanguageInput = element(
    by.css('.protractor-test-exploration-language-select'));
  var explorationObjectiveInput = element(
    by.css('.protractor-test-exploration-objective-input'));
  var explorationObjectiveWarning = element(
    by.css('.protractor-test-exploration-objective-warning'));
  var explorationSummaryTile = element(
    by.css('.protractor-test-exploration-summary-tile'));
  var explorationTitleInput = element(
    by.css('.protractor-test-exploration-title-input'));
  var initialStateSelect = element(
    by.css('.protractor-test-initial-state-select'));
  var initialStateSelectOption = function(stateName) {
    return initialStateSelect.element(
      by.cssContainingText('option', stateName));
  };
  var neutralElement = element(by.css('.protractor-test-settings-container'));

  /*
   * Buttons
   */
  var closePreviewSummaryButton = element(
    by.css('.protractor-test-close-preview-summary-modal'));
  var openPreviewSummaryButton = element(
    by.css('.protractor-test-open-preview-summary-modal'));
  var deleteExplorationButton = element(
    by.css('.protractor-test-delete-exploration-button'));
  var confirmDeleteExplorationButton = element(
    by.css('.protractor-test-really-delete-exploration-button'));
  var enableCorrectnessFeedbackButton = element(
    by.css('.protractor-test-enable-mark-correctness-feedback'));

  /*
   * Workflows
   */
  this.deleteExploration = async function() {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await waitFor.elementToBeClickable(
      deleteExplorationButton, 'Delete Exploration button is not clickable');
    await deleteExplorationButton.click();
    await waitFor.elementToBeClickable(
      confirmDeleteExplorationButton,
      'Confirm Delete Exploration button is not clickable');
    await confirmDeleteExplorationButton.click();
    await waitFor.invisibilityOf(
      confirmDeleteExplorationButton,
      'Delete Exploration modal takes too long to disappear');
    // Returning to /creator-dashboard.
    await waitFor.pageToFullyLoad();
  };

  this.enableCorrectnessFeedback = async function() {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await action.click(
      'Enable Correctness Feedback Button', enableCorrectnessFeedbackButton);
    await action.click('Neutral element', neutralElement);
  };

  this.expectAvailableFirstStatesToBe = async function(names) {
    await waitFor.presenceOf(
      initialStateSelect, 'Initial state select takes too long to be visible.');
    var options = await initialStateSelect.all(by.tagName('option'))
      .map(async function(elem) {
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
    await closePreviewSummaryButton.click();
    await waitFor.invisibilityOf(
      explorationSummaryTile, 'Summary Tile takes too long to disappear');
    expect(await explorationSummaryTile.isPresent()).toBeFalsy();
    await action.click('Neutral element', neutralElement);
  };

  this.setCategory = async function(category) {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await waitFor.presenceOf(
      explorationCategoryInput, 'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
    await action.click('Neutral element', neutralElement);
  };

  this.setFirstState = async function(stateName) {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await waitFor.presenceOf(
      initialStateSelect, 'Initial state select takes too long to be visible.');
    await action.click(
      'State name option', initialStateSelectOption(stateName));
    await action.click('Neutral element', neutralElement);
  };

  this.setLanguage = async function(language) {
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    await waitFor.presenceOf(
      explorationLanguageInput, 'Language input takes too long to be visible.');
    var languageButton = explorationLanguageInput.element(
      by.cssContainingText('option', language));
    await action.click('Language button', languageButton);
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
    await action.click('Neutral element', neutralElement);
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
