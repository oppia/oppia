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

var ExplorationEditorSettingsTab = function() {
  /*
   * Interactive elements
   */
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
  var closePreviewSummaryButton = element(
    by.css('.protractor-test-close-preview-summary-modal'));
  var openPreviewSummaryButton = element(
    by.css('.protractor-test-open-preview-summary-modal'));

  /*
   * Workflows
   */
  this.expectAvailableFirstStatesToBe = function(names) {
    initialStateSelect.all(by.tagName('option')).map(function(elem) {
      return elem.getText();
    }).then(function(options) {
      expect(options.sort()).toEqual(names.sort());
    });
  };

  this.openAndClosePreviewSummaryTile = function() {
    openPreviewSummaryButton.click();
    general.waitForSystem();
    expect(explorationSummaryTile.isPresent()).toBeTruthy();
    closePreviewSummaryButton.click();
    general.waitForSystem();
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
