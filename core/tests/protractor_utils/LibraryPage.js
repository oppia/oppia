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

var action = require('./action.js');
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var LibraryPage = function() {
  var LIBRARY_URL_SUFFIX = '/community-library';
  var allCollectionSummaryTile = element.all(
    by.css('.e2e-test-collection-summary-tile'));
  var allExplorationSummaryTile = element.all(
    by.css('.e2e-test-exp-summary-tile'));
  var expSummaryTileTitleLocator = by.css(
    '.e2e-test-exp-summary-tile-title');
  var allCollectionsTitled = function(collectionName) {
    return element.all(by.cssContainingText(
      '.e2e-test-collection-summary-tile-title', collectionName));
  };
  var allExplorationsTitled = function(explorationName) {
    return element.all(by.cssContainingText(
      '.e2e-test-exp-summary-tile-title', explorationName));
  };

  var categorySelector = forms.MultiSelectEditor(
    element(by.css('.e2e-test-search-bar-category-selector')));
  var explorationObjective = element(
    by.css('.e2e-test-exp-summary-tile-objective'));
  var createActivityButton = element(
    by.css('.e2e-test-create-activity')
  );
  var languageSelector = forms.MultiSelectEditor(
    element(by.css('.e2e-test-search-bar-language-selector')));
  var searchInputs = element.all(
    by.css('.e2e-test-search-input'));
  var mainHeader = element(by.css('.e2e-test-library-main-header'));
  var searchButton = element(by.css('.e2e-test-search-button'));
  var addToPlayLaterListButton = element(
    by.css('.e2e-test-add-to-playlist-btn'));
  var expHoverElement = element(
    by.css('.e2e-test-exploration-dashboard-card'));
  var expSummaryTileObjectiveLocator = by.css(
    '.e2e-test-exp-summary-tile-objective');
  var expSummaryTileRatingLocator = by.css(
    '.e2e-test-exp-summary-tile-rating');

  // Returns a promise of all explorations with the given name.
  var _getExplorationElements = async function(name) {
    return await allExplorationSummaryTile.filter(
      async function(tile) {
        var tileTitle = await tile.element(
          expSummaryTileTitleLocator).getText();
        return (tileTitle === name);
      }
    );
  };

  var _submitSearchQuery = async function(searchQuery) {
    // The library page has two search bar input elements.
    // The first search bar input element is visible only in a desktop
    // browser and is invisible in case of a mobile browser.
    // The second search bar input element is visible when the library
    // page is rendered for mobile device.

    // Function get is a zero-based index.
    var searchInput = (
      browser.isMobile ? searchInputs.get(1) :
      searchInputs.first());
    await action.clear('Search input', searchInput);
    await action.sendKeys('Search input', searchInput, searchQuery);
    let searchButtonExists = await searchButton.isPresent();
    if (searchButtonExists) {
      await action.click('Search button', searchButton);
      await waitFor.pageToFullyLoad();
    }
  };

  this.get = async function() {
    await browser.get(LIBRARY_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.addSelectedExplorationToPlaylist = async function() {
    await browser.actions().mouseMove(expHoverElement).perform();

    await waitFor.elementToBeClickable(
      addToPlayLaterListButton,
      'Add to \'Play Later\' list Icon taking too long to load');
    await action.click(
      'Add to play later list button', addToPlayLaterListButton);
  };

  this.selectLanguages = async function(languages) {
    await languageSelector.selectValues(languages);
  };

  this.deselectLanguages = async function(languages) {
    await languageSelector.deselectValues(languages);
  };

  this.expectCurrentLanguageSelectionToBe = async function(expectedLanguages) {
    await languageSelector.expectCurrentSelectionToBe(expectedLanguages);
  };

  this.selectCategories = async function(categories) {
    await categorySelector.selectValues(categories);
  };

  this.deselectCategories = async function(categories) {
    await categorySelector.deselectValues(categories);
  };

  this.expectCurrentCategorySelectionToBe = async function(
      expectedCategories) {
    await categorySelector.expectCurrentSelectionToBe(expectedCategories);
  };

  this.expectMainHeaderTextToBe = async function(expectedHeaderText) {
    expect(await mainHeader.getText()).toEqual(expectedHeaderText);
  };

  this.expectExplorationToBeVisible = async function(name) {
    var elems = await _getExplorationElements(name);
    expect(elems.length).not.toBe(0);
  };

  this.expectExplorationToBeHidden = async function(name) {
    var elems = await _getExplorationElements(name);
    expect(elems.length).toBe(0);
  };

  this.playCollection = async function(collectionName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      allCollectionSummaryTile.first(),
      'Library Page does not have any collections');
    var collectionCard = allCollectionsTitled(collectionName).first();
    await waitFor.visibilityOf(
      collectionCard,
      'Unable to find collection ' + collectionName);
    // The Collection summary card is masked by a dummy element. Therefore, a
    // Javascript click is used.
    await action.click('Collection Card', collectionCard, true);
    await waitFor.pageToFullyLoad();
  };

  this.playExploration = async function(explorationName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      allExplorationSummaryTile.first(),
      'Library Page does not have any explorations');

    var explorationCard = allExplorationsTitled(explorationName).first();
    await waitFor.visibilityOf(
      explorationCard, 'Unable to find exploration ' + explorationName);
    // The Exploration summary card is masked by a dummy element. Therefore, a
    // Javascript click is used.
    await action.click('Exploration Card', explorationCard, true);
    await waitFor.pageToFullyLoad();
  };

  this.getExplorationObjective = async function(name) {
    var elems = await _getExplorationElements(name);
    return await elems[0].element(expSummaryTileObjectiveLocator).getText();
  };

  this.expectExplorationRatingToEqual = async function(name, ratingValue) {
    var elems = await _getExplorationElements(name);
    await waitFor.visibilityOf(
      elems[0], 'Rating card takes too long to appear');
    var value = await elems[0].element(expSummaryTileRatingLocator).getText();
    expect(value).toBe(ratingValue);
  };

  this.clickCreateActivity = async function() {
    await action.click('create Activity Button', createActivityButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickExplorationObjective = async function() {
    await action.click('Exploration objective', explorationObjective);
  };

  this.findExploration = async function(explorationTitle) {
    await waitFor.pageToFullyLoad();
    await _submitSearchQuery(explorationTitle);
  };

  this.findCollection = async function(collectionTitle) {
    await waitFor.pageToFullyLoad();
    await _submitSearchQuery(collectionTitle);
  };
};

exports.LibraryPage = LibraryPage;
