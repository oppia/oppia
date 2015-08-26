// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for the gallery in end-to-end tests with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var editor = require('./editor.js');
var forms = require('./forms.js');

var selectLanguages = function(languages) {
  forms.MultiSelectEditor(
    element(by.css('.protractor-test-gallery-language-selector'))
  ).selectValues(languages);
};

var deselectLanguages = function(languages) {
  forms.MultiSelectEditor(
    element(by.css('.protractor-test-gallery-language-selector'))
  ).deselectValues(languages);
};

var expectCurrentLanguageSelectionToBe = function(expectedLanguages) {
  forms.MultiSelectEditor(
    element(by.css('.protractor-test-gallery-language-selector'))
  ).expectCurrentSelectionToBe(expectedLanguages);
};

var selectCategories = function(categories) {
  forms.MultiSelectEditor(
    element(by.css('.protractor-test-gallery-category-selector'))
  ).selectValues(categories);
};

var deselectCategories = function(categories) {
  forms.MultiSelectEditor(
    element(by.css('.protractor-test-gallery-category-selector'))
  ).deselectValues(categories);
};

var expectCurrentCategorySelectionToBe = function(expectedCategories) {
  forms.MultiSelectEditor(
    element(by.css('.protractor-test-gallery-category-selector'))
  ).expectCurrentSelectionToBe(expectedCategories);
};

// Returns a promise of all explorations with the given name.
var _getExplorationElements = function(name) {
  return element.all(by.css('.protractor-test-gallery-tile')).filter(
      function(tile, index) {
    return tile.element(by.css('.protractor-test-gallery-tile-title')).
        getText().then(function(tileTitle) {
      return (tileTitle === name);
    });
  });
};

var expectExplorationToBeVisible = function(name) {
  _getExplorationElements(name).then(function(elems) {
    expect(elems.length).not.toBe(0);
  });
};

var expectExplorationToBeHidden = function(name) {
  _getExplorationElements(name).then(function(elems) {
    expect(elems.length).toBe(0);
  });
};

var playExploration = function(name) {
  _getExplorationElements(name).then(function(elems) {
    if (elems.length === 0) {
      throw 'Could not find exploration tile with name ' + name;
    }
    elems[0].element(by.css('.protractor-test-gallery-tile-title')).click();
  });
};

var editExploration = function(name) {
  _getExplorationElements(name).then(function(elems) {
    elems[0].element(by.css('.protractor-test-edit-exploration')).click();
  });
  editor.exitTutorialIfNecessary();
};

var getExplorationObjective = function(name) {
  return _getExplorationElements(name).then(function(elems) {
    return elems[0].element(by.css('.protractor-test-exploration-objective')).
      getText();
  });
};

exports.selectLanguages = selectLanguages;
exports.deselectLanguages = deselectLanguages;
exports.expectCurrentLanguageSelectionToBe = expectCurrentLanguageSelectionToBe;
exports.selectCategories = selectCategories;
exports.deselectCategories = deselectCategories;
exports.expectCurrentCategorySelectionToBe = expectCurrentCategorySelectionToBe;

exports.expectExplorationToBeVisible = expectExplorationToBeVisible;
exports.expectExplorationToBeHidden = expectExplorationToBeHidden;
exports.playExploration = playExploration;
exports.editExploration = editExploration;
exports.getExplorationObjective = getExplorationObjective;
