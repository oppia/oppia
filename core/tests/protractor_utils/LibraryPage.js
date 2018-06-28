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
 * @fileoverview Page object for the library pages, for use in Protractor
 * tests.
 */

var editor = require('./editor.js');
var forms = require('./forms.js');

var LibraryPage = function(){
  var LIBRARY_URL_SUFFIX = '/library';
  var languageSelector = forms.MultiSelectEditor(
    element(by.css('.protractor-test-search-bar-language-selector'))
  );
  var categorySelector = forms.MultiSelectEditor(
    element(by.css('.protractor-test-search-bar-category-selector'))
  );
  var createActivityButton = element(
    by.css('.protractor-test-create-activity')
  );

  // Returns a promise of all explorations with the given name.
  var _getExplorationElements = function(name) {
    return element.all(by.css('.protractor-test-exp-summary-tile')).filter(
      function(tile) {
        return tile.element(by.css('.protractor-test-exp-summary-tile-title')).
          getText().then(function(tileTitle) {
            return (tileTitle === name);
          });
      }
    );
  };

  this.get = function() {
    return browser.get(LIBRARY_URL_SUFFIX);
  };

  this.selectLanguages = function(languages) {
    languageSelector.selectValues(languages);
  };

  this.deselectLanguages = function(languages) {
    languageSelector.deselectValues(languages);
  };

  this.expectCurrentLanguageSelectionToBe = function(expectedLanguages) {
    languageSelector.expectCurrentSelectionToBe(expectedLanguages);
  };

  this.selectCategories = function(categories) {
    categorySelector.selectValues(categories);
  };

  this.deselectCategories = function(categories) {
    categorySelector.deselectValues(categories);
  };

  this.expectCurrentCategorySelectionToBe = function(expectedCategories) {
    categorySelector.expectCurrentSelectionToBe(expectedCategories);
  };

  this.expectExplorationToBeVisible = function(name) {
    _getExplorationElements(name).then(function(elems) {
      expect(elems.length).not.toBe(0);
    });
  };

  this.expectExplorationToBeHidden = function(name) {
    _getExplorationElements(name).then(function(elems) {
      expect(elems.length).toBe(0);
    });
  };

  this.playExploration = function(name) {
    _getExplorationElements(name).then(function(elems) {
      if (elems.length === 0) {
        throw 'Could not find exploration tile with name ' + name;
      }
      elems[0].element(by.css(
        '.protractor-test-exp-summary-tile-title'
      )).click();
    });
  };

  this.getExplorationObjective = function(name) {
    return _getExplorationElements(name).then(function(elems) {
      return elems[0].element(by.css(
        '.protractor-test-exp-summary-tile-objective'
      )).getText();
    });
  };

  this.expectExplorationRatingToEqual = function(name, ratingValue) {
    _getExplorationElements(name).then(function(elems) {
      elems[0].element(by.css(
        '.protractor-test-exp-summary-tile-rating'
      )).getText().then(function(value) {
        expect(value).toBe(ratingValue);
      });
    });
  };

  this.clickCreateActivity = function(){
    createActivityButton.click();
  };

  this.findExploration = function(explorationTitle) {
    element(by.css('.protractor-test-search-input')).sendKeys(
      explorationTitle);
    browser.waitForAngular();
  };
};

exports.LibraryPage = LibraryPage;
