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
  var explorationTitleInput = $('.e2e-test-exploration-title-input');
  var neutralElement = $('.e2e-test-settings-container');

  /*
   * Buttons
   */
  var confirmDeleteExplorationButton = $(
    '.e2e-test-really-delete-exploration-button');
  var deleteExplorationButton = $('.e2e-test-delete-exploration-button');
  var disableCorrectnessFeedbackButton = $(
    '.e2e-test-enable-mark-correctness-feedback');

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

  this.setCategory = async function(category) {
    await waitFor.presenceOf(
      explorationCategoryInput, 'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
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
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
