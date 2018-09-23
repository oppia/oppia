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

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var LibraryPage = function(){
  var LIBRARY_URL_SUFFIX = '/library';
  var allCollectionSummaryTile = element.all(
    by.css('.protractor-test-collection-summary-tile'));
  var allExplorationSummaryTile = element.all(
    by.css('.protractor-test-exp-summary-tile'));
  var allCollectionsTitled = function(collectionName) {
    return element.all(by.cssContainingText(
      '.protractor-test-collection-summary-tile-title', collectionName));
  };
  var allExplorationsTitled = function(explorationName) {
    return element.all(by.cssContainingText(
      '.protractor-test-exp-summary-tile-title', explorationName));
  };

  var categorySelector = forms.MultiSelectEditor(
    element(by.css('.protractor-test-search-bar-category-selector'))
  );
  var createActivityButton = element(
    by.css('.protractor-test-create-activity')
  );
  var languageSelector = forms.MultiSelectEditor(
    element(by.css('.protractor-test-search-bar-language-selector'))
  );
  var searchInputs = element.all(
    by.css('.protractor-test-search-input'));
  var mainHeader = element(by.css('.protractor-test-library-main-header'));

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

  var _submitSearchQuery = function(searchQuery) {
    // The library page has two search bar input elements.
    // The first search bar input element is visible only in a desktop
    // browser and is invisible in case of a mobile browser.
    // The second search bar input element is visible when the library
    // page is rendered for mobile device.

    // get function is a zero-based index.
    var searchInput = (
      browser.isMobile ? searchInputs.get(1) : searchInputs.first());
    searchInput.clear();
    searchInput.sendKeys(searchQuery);
  };

  this.get = function() {
    browser.get(LIBRARY_URL_SUFFIX);
    return waitFor.pageToFullyLoad();
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

  this.expectMainHeaderTextToBe = function(expectedHeaderText) {
    expect(mainHeader.getText()).toEqual(expectedHeaderText);
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

  this.playCollection = function(collectionName) {
    waitFor.pageToFullyLoad();
    waitFor.visibilityOf(
      allCollectionSummaryTile.first(),
      'Library Page does not have any collections');
    waitFor.visibilityOf(
      allCollectionsTitled(collectionName).first(),
      'Unable to find collection ' + collectionName);
    allCollectionsTitled(collectionName).first().click();
    waitFor.pageToFullyLoad();
  };

  this.playExploration = function(explorationName) {
    waitFor.pageToFullyLoad();
    waitFor.visibilityOf(
      allExplorationSummaryTile.first(),
      'Library Page does not have any explorations');
    waitFor.visibilityOf(
      allExplorationsTitled(explorationName).first(),
      'Unable to find exploration ' + explorationName);
    allExplorationsTitled(explorationName).first().click();
    waitFor.pageToFullyLoad();
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
      waitFor.visibilityOf(elems[0], 'Rating card takes too long to appear');
      elems[0].element(by.css(
        '.protractor-test-exp-summary-tile-rating'
      )).getText().then(function(value) {
        expect(value).toBe(ratingValue);
      });
    });
  };

  this.clickCreateActivity = function(){
    createActivityButton.click();
    waitFor.pageToFullyLoad();
  };

  this.findExploration = function(explorationTitle) {
    waitFor.pageToFullyLoad();
    _submitSearchQuery(explorationTitle);
  };

  this.findCollection = function(collectionTitle) {
    waitFor.pageToFullyLoad();
    _submitSearchQuery(collectionTitle);
  };
};

exports.LibraryPage = LibraryPage;
