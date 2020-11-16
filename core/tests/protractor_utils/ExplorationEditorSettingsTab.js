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
    await action.click('Delete Exploration button', deleteExplorationButton);
    await action.click(
      'Confirm Delete Exploration button', confirmDeleteExplorationButton);
    await waitFor.invisibilityOf(
      confirmDeleteExplorationButton,
      'Delete Exploration modal takes too long to disappear');
    // Returning to /creator-dashboard.
    await waitFor.pageToFullyLoad();
  };

  this.enableCorrectnessFeedback = async function() {
    await action.click(
      'Enable Correctness Feedback button', enableCorrectnessFeedbackButton);
  };

  this.expectAvailableFirstStatesToBe = async function(names) {
    var options = await initialStateSelect.all(by.tagName('option'))
      .map(async function(elem) {
        await waitFor.visibilityOf(
          elem, 'Element ' + elem + ' taking too long to appear');
        return await elem.getText();
      });
    expect(options.sort()).toEqual(names.sort());
  };

  this.openAndClosePreviewSummaryTile = async function() {
    await action.click('Open Preview Summary button', openPreviewSummaryButton);
    await waitFor.visibilityOf(
      explorationSummaryTile, 'Summary Tile takes too long to appear');
    expect(await explorationSummaryTile.isPresent()).toBeTruthy();
    await action.click(
      'Close Preview Summary button', closePreviewSummaryButton);
    await waitFor.invisibilityOf(
      explorationSummaryTile, 'Summary Tile takes too long to disappear');
    expect(await explorationSummaryTile.isPresent()).toBeFalsy();
  };

  this.setCategory = async function(category) {
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
  };

  this.setFirstState = async function(stateName) {
    await action.click(
      'Initial State Select Option ' + stateName,
      initialStateSelectOption(stateName));
  };

  this.setLanguage = async function(language) {
    await action.click(
      'Exploration Language Input option ' + language,
      explorationLanguageInput.element(
        by.cssContainingText('option', language)));
  };

  this.setObjective = async function(objective) {
    await action.clear(
      'Exploration Objective input', explorationObjectiveInput);
    await action.sendKeys(
      'Exploration Objective input', explorationObjectiveInput, objective);
  };

  this.setTitle = async function(title) {
    await action.clear('Exploration Title input', explorationTitleInput);
    await action.sendKeys(
      'Exploration Title input', explorationTitleInput, title);
  };

  this.expectCategoryToBe = async function(category) {
    await waitFor.visibilityOf(
      explorationCategoryInput,
      'Exploration Category input taking too long to appear');
    expect(await explorationCategoryInput.$('option:checked').getText()).
      toEqual(category);
  };

  this.expectFirstStateToBe = async function(firstState) {
    await waitFor.visibilityOf(
      initialStateSelect, 'Initial State Select taking too long to appear');
    expect(await initialStateSelect.$('option:checked').getText()).
      toEqual(firstState);
  };

  this.expectLanguageToBe = async function(language) {
    await waitFor.visibilityOf(
      explorationLanguageInput,
      'Exploration Language input taking too long to appear');
    expect(await explorationLanguageInput.$('option:checked').getText()).
      toEqual(language);
  };

  this.expectObjectiveToBe = async function(objective) {
    await waitFor.visibilityOf(
      explorationObjectiveInput,
      'Exploration Objective input taking too long to appear');
    expect(await explorationObjectiveInput.getAttribute('value')).
      toEqual(objective);
  };

  this.expectTitleToBe = async function(title) {
    await waitFor.visibilityOf(
      explorationTitleInput,
      'Exploration Title input taking too long to appear');
    expect(await explorationTitleInput.getAttribute('value')).
      toEqual(title);
  };

  this.expectWarningsColorToBe = async function(color) {
    await waitFor.visibilityOf(
      explorationObjectiveWarning,
      'Exploration Objective warning taking too long to appear');
    expect(await explorationObjectiveWarning.getCssValue('color')).
      toEqual(color);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
