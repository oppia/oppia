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
   * Workflows
   */
  this.deleteExploration = async function() {
    var neutralElement = await $('.e2e-test-settings-container');
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    var deleteExplorationButton = await $(
      '.e2e-test-delete-exploration-button');
    await action.click('Delete Exploration Button', deleteExplorationButton);
    var confirmDeleteExplorationButton = await $(
      '.e2e-test-really-delete-exploration-button');
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
    var disableCorrectnessFeedbackButton = await $(
      '.e2e-test-enable-mark-correctness-feedback');
    await action.click(
      'Disable Correctness Feedback Button', disableCorrectnessFeedbackButton);
  };

  this.setCategory = async function(category) {
    var explorationCategoryInput = await $(
      '.e2e-test-exploration-category-input');
    await waitFor.presenceOf(
      explorationCategoryInput, 'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
  };

  this.setLanguage = async function(language) {
    var explorationLanguageInput = await $(
      '.e2e-test-exploration-language-select');
    await waitFor.presenceOf(
      explorationLanguageInput, 'Language input takes too long to be visible.');
    await explorationLanguageInput.selectByVisibleText(language);
  };

  this.setObjective = async function(objective) {
    var explorationObjectiveInput = await $(
      '.e2e-test-exploration-objective-input');
    await action.clear(
      'Exploration Objective input', explorationObjectiveInput);
    await action.keys(
      'Exploration Objective input', explorationObjectiveInput, objective);
  };

  this.setTitle = async function(title) {
    await action.waitForAutosave();
    await general.scrollToTop();
    var explorationTitleInput = await $(
      '.e2e-test-exploration-title-input');
    await action.clear('Exploration Title Input', explorationTitleInput);
    await action.keys(
      'Exploration Title Input', explorationTitleInput, title);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
