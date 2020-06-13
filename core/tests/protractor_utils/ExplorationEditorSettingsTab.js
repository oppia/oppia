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
var waitFor = require('./waitFor.js');

var ExplorationEditorSettingsTab = function() {
  /*
   * Interactive elements
   */
  var editParamChanges = element(
    by.css('.protractor-test-exploration-edit-param-changes'));
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

  /*
   * Buttons
   */
  var addParamButton = element(by.css('.protractor-test-add-param-button'));
  var closePreviewSummaryButton = element(
    by.css('.protractor-test-close-preview-summary-modal'));
  var enableParametersSwitch = element(
    by.css('.protractor-test-enable-parameters'));
  var openPreviewSummaryButton = element(
    by.css('.protractor-test-open-preview-summary-modal'));
  var saveParamChangesButton = element(
    by.css('.protractor-test-save-param-changes-button'));
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
    await waitFor.elementToBeClickable(deleteExplorationButton,
      'Delete Exploration button is not clickable');
    await deleteExplorationButton.click();
    await waitFor.elementToBeClickable(confirmDeleteExplorationButton,
      'Confirm Delete Exploration button is not clickable');
    await confirmDeleteExplorationButton.click();
    await waitFor.invisibilityOf(confirmDeleteExplorationButton,
      'Delete Exploration modal takes too long to disappear');
    // Returning to /creator-dashboard.
    await waitFor.pageToFullyLoad();
  };

  this.enableCorrectnessFeedback = async function() {
    expect(await enableCorrectnessFeedbackButton.isDisplayed()).toBe(true);
    await waitFor.elementToBeClickable(enableCorrectnessFeedbackButton,
      'Enable correctness feedback button is not clickable.');
    await enableCorrectnessFeedbackButton.click();
  };

  this.expectAvailableFirstStatesToBe = async function(names) {
    var options = await initialStateSelect.all(by.tagName('option'))
      .map(async function(elem) {
        return await elem.getText();
      });
    expect(options.sort()).toEqual(names.sort());
  };

  this.openAndClosePreviewSummaryTile = async function() {
    await openPreviewSummaryButton.click();
    await waitFor.visibilityOf(explorationSummaryTile,
      'Summary Tile takes too long to appear');
    expect(await explorationSummaryTile.isPresent()).toBeTruthy();
    await closePreviewSummaryButton.click();
    await waitFor.invisibilityOf(explorationSummaryTile,
      'Summary Tile takes too long to disappear');
    expect(await explorationSummaryTile.isPresent()).toBeFalsy();
  };

  this.setCategory = async function(category) {
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
  };

  this.setFirstState = async function(stateName) {
    await initialStateSelectOption(stateName).click();
  };

  this.setLanguage = async function(language) {
    await element(by.css('.protractor-test-exploration-language-select')).
      element(by.cssContainingText('option', language)).click();
  };

  this.setObjective = async function(objective) {
    await explorationObjectiveInput.clear();
    await explorationObjectiveInput.sendKeys(objective);
  };

  this.setTitle = async function(title) {
    await explorationTitleInput.clear();
    await explorationTitleInput.sendKeys(title);
  };

  this.expectCategoryToBe = async function(category) {
    expect(await explorationCategoryInput.$('option:checked').getText()).
      toEqual(category);
  };

  this.expectFirstStateToBe = async function(firstState) {
    expect(await initialStateSelect.$('option:checked').getText()).
      toEqual(firstState);
  };

  this.expectLanguageToBe = async function(language) {
    expect(await explorationLanguageInput.$('option:checked').getText()).
      toEqual(language);
  };

  this.expectObjectiveToBe = async function(objective) {
    expect(await explorationObjectiveInput.getAttribute('value')).
      toEqual(objective);
  };

  this.expectTitleToBe = async function(title) {
    expect(await explorationTitleInput.getAttribute('value')).
      toEqual(title);
  };

  this.expectWarningsColorToBe = async function(color) {
    expect(await explorationObjectiveWarning.getCssValue('color')).
      toEqual(color);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
