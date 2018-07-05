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
var until = protractor.ExpectedConditions;

var ExplorationEditorSettingsTab = function() {
  /*
   * Interactive elements
   */
  var editParamChanges = element(
    by.css('.protractor-test-exploration-edit-param-changes'));
  var explorationCategoryInput = element(
    by.css('.protractor-test-exploration-category-input'));
  var explorationObjectiveInput = element(
    by.css('.protractor-test-exploration-objective-input'));
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
  var addParamButon = element(by.css('.protractor-test-add-param-button'));
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

  /*
   * Workflows
   */
  // PARAMETERS

  // This function adds a exploration level parameter change, creating
  // the parameter if necessary.
  this.addExplorationLevelParameterChange = function(paramName, paramValue) {
    editParamChanges.click();
    addParamButon.click();

    var editorRowElem = element.all(by.css(
      '.protractor-test-param-changes-list')).last();

    forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);

    /* Setting parameter value is difficult via css since input fields
      are dynamically generated. We isolate it as the last input in the
      current parameter changes UI. */
    var item = editorRowElem.all(by.tagName('input')).last();
    item.clear();
    item.sendKeys(paramValue);

    saveParamChangesButton.click();
  };

  this.deleteExploration = function() {
    browser.wait(until.elementToBeClickable(deleteExplorationButton), 5000,
      'Delete Exploration button is not clickable');
    deleteExplorationButton.click();
    confirmDeleteExplorationButton.click();
    browser.wait(until.invisibilityOf(confirmDeleteExplorationButton), 5000,
      'Delete Exploration modal takes too long to disappear');
  };

  this.enableParameters = function() {
    enableParametersSwitch.click();
  };

  this.expectAvailableFirstStatesToBe = function(names) {
    initialStateSelect.all(by.tagName('option')).map(function(elem) {
      return elem.getText();
    }).then(function(options) {
      expect(options.sort()).toEqual(names.sort());
    });
  };

  this.openAndClosePreviewSummaryTile = function() {
    openPreviewSummaryButton.click();
    browser.wait(until.visibilityOf(explorationSummaryTile), 5000,
      'Summary Tile takes too long to appear');
    expect(explorationSummaryTile.isPresent()).toBeTruthy();
    closePreviewSummaryButton.click();
    browser.wait(until.invisibilityOf(explorationSummaryTile), 5000,
      'Summary Tile takes too long to disappear');
    expect((explorationSummaryTile.isPresent())).toBeFalsy();
  };

  this.setCategory = function(category) {
    forms.AutocompleteDropdownEditor(explorationCategoryInput).setValue(
      category);
  };

  this.setFirstState = function(stateName) {
    initialStateSelectOption(stateName).click();
  };

  this.setLanguage = function(language) {
    element(by.css('.protractor-test-exploration-language-select')).
      element(by.cssContainingText('option', language)).click();
  };

  this.setObjective = function(objective) {
    explorationObjectiveInput.clear();
    explorationObjectiveInput.sendKeys(objective);
  };

  this.setTitle = function(title) {
    explorationTitleInput.clear();
    explorationTitleInput.sendKeys(title);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
