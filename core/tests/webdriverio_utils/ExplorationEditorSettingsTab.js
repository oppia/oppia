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
  this.setCategory = async function(category) {
    var explorationCategoryInput = await $(
      '.protractor-test-exploration-category-input');
    await waitFor.presenceOf(
      explorationCategoryInput, 'Category input takes too long to be visible.');
    await (
      await forms.AutocompleteDropdownEditor(explorationCategoryInput)
    ).setValue(category);
  };

  this.setLanguage = async function(language) {
    var neutralElement = await $(
      '.protractor-test-settings-container');
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    var explorationLanguageInput = await $(
      '.protractor-test-exploration-language-select');
    await waitFor.presenceOf(
      explorationLanguageInput, 'Language input takes too long to be visible.');
    var languageButton = await explorationLanguageInput.$(`option=${language}`);
    await action.click('Language button', languageButton);
    await action.click('Neutral element', neutralElement);
  };

  this.setObjective = async function(objective) {
    var neutralElement = await $(
      '.protractor-test-settings-container');
    await action.click('Neutral element', neutralElement);
    await action.waitForAutosave();
    var explorationObjectiveInput = await $(
      '.protractor-test-exploration-objective-input');
    await action.clear(
      'Exploration Objective input', explorationObjectiveInput);
    await action.keys(
      'Exploration Objective input', explorationObjectiveInput, objective);
    await action.click('Neutral element', neutralElement);
  };

  this.setTitle = async function(title) {
    var explorationTitleInput = await $(
      '.protractor-test-exploration-title-input');
    await action.waitForAutosave();
    await general.scrollToTop();
    await action.clear('Exploration Title Input', explorationTitleInput);
    await action.keys(
      'Exploration Title Input', explorationTitleInput, title);
    var neutralElement = await $(
      '.protractor-test-settings-container');
    await action.click('Neutral element', neutralElement);
  };
};

exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
