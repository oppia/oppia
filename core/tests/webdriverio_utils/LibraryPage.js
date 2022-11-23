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
 * @fileoverview Page object for the library pages, for use in WebdriverIO
 * tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var forms = require('./forms.js');

var LibraryPage = function() {
  var LIBRARY_URL_SUFFIX = '/community-library';

  var addToPlayLaterListButton = $('.e2e-test-add-to-playlist-btn');
  var allCollectionSummaryTile = $('.e2e-test-collection-summary-tile');
  var allExplorationSummaryTile = $('.e2e-test-exp-summary-tile');
  var allExplorationSummaryTileSelector = function() {
    return $$('.e2e-test-exp-summary-tile');
  };
  var explorationObjective = $('.e2e-test-exp-summary-tile-objective');
  var expHoverElement = $('.e2e-test-exploration-dashboard-card');
  var expSummaryTileTitleLocator = '.e2e-test-exp-summary-tile-title';
  var homeSection = $('.e2e-test-home-section');
  var mainHeader = $('.e2e-test-library-main-header');
  var oppiaLogo = $('.e2e-test-oppia-main-logo');
  var searchButton = $('.e2e-test-search-button');
  var searchInputElement = $('.e2e-test-search-input');
  var searchInputsSelector = function() {
    return $$('.e2e-test-search-input');
  };
  var allExplorationsTitled = function(explorationName) {
    return $$(
      `.e2e-test-exp-summary-tile-title=${explorationName}`);
  };
  var allCollectionsTitled = function(collectionName) {
    return $$(
      `.e2e-test-collection-summary-tile-title=${collectionName}`);
  };
  var categorySelector = forms.MultiSelectEditor(
    $('.e2e-test-search-bar-category-selector'));
  var expSummaryTileRatingLocator = '.e2e-test-exp-summary-tile-rating';
  var expSummaryTileObjectiveLocator = '.e2e-test-exp-summary-tile-objective';
  var languageSelector = forms.MultiSelectEditor(
    $('.e2e-test-search-bar-language-selector'));

  // Returns a promise of all explorations with the given name.
  // When there is no exploration present on the Library page 'isHidden'
  // will be true and we do not need to wait for the visiblity of explorations.
  var _getExplorationElements = async function(name, isHidden = false) {
    if (!isHidden) {
      await waitFor.visibilityOf(
        allExplorationSummaryTile,
        'All Exploration summary tile is taking too long to appear');
    }
    var allExplorationSummaryTiles = allExplorationSummaryTileSelector();
    return await allExplorationSummaryTiles.filter(
      async function(tile) {
        var tileTitle = await action.getText('Exp Summary Title', tile.$(
          expSummaryTileTitleLocator));
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
    await waitFor.visibilityOf(
      searchInputElement, 'Search input takes too long to appear');

    // Function get is a zero-based index.
    var searchInputs = await searchInputsSelector();
    var searchInput = (
      browser.isMobile ? searchInputs[1] :
      searchInputs[0]);
    await action.clear('Search input', searchInput);
    await action.setValue('Search input', searchInput, searchQuery);
    let searchButtonExists = await searchButton.isExisting();
    if (searchButtonExists) {
      await action.click('Search button', searchButton);
      await waitFor.pageToFullyLoad();
    }
  };

  this.get = async function() {
    await browser.url(LIBRARY_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getHomePage = async function() {
    await action.click('Oppia logo', oppiaLogo);
    await waitFor.textToBePresentInElement(
      homeSection, 'Home', 'Library page takes too long to load');
  };

  this.addSelectedExplorationToPlaylist = async function() {
    // We need to wait till the cards are loaded else it will
    // throw element out of bond error.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(5000);
    await expHoverElement.moveTo();

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
    var mainHeaderText = await action.getText(
      'Main Header Element', mainHeader);
    expect(mainHeaderText).toEqual(expectedHeaderText);
  };

  this.expectExplorationToBeVisible = async function(name) {
    var elems = await _getExplorationElements(name);
    expect(elems.length).not.toBe(0);
  };

  this.expectExplorationToBeHidden = async function(name) {
    var elems = await _getExplorationElements(name, true);
    expect(elems.length).toBe(0);
  };

  this.playCollection = async function(collectionName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      allCollectionSummaryTile,
      'Library Page does not have any collections');
    var collectionCardElement = $(
      `.e2e-test-collection-summary-tile-title=${collectionName}`);
    await waitFor.visibilityOf(
      collectionCardElement,
      'Unable to find collection ' + collectionName);
    // The Collection summary card is masked by a dummy element. Therefore, a
    // Javascript click is used.
    var collectionCard = await allCollectionsTitled(collectionName)[0];
    await action.click('Collection Card', collectionCard, true);
    await waitFor.pageToFullyLoad();
  };

  this.playExploration = async function(explorationName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      allExplorationSummaryTile,
      'Library Page does not have any explorations');

    var explorationCardElement = $(
      `.e2e-test-exp-summary-tile-title=${explorationName}`);
    await waitFor.visibilityOf(
      explorationCardElement, 'Unable to find exploration ' + explorationName);
    var explorationCard = await allExplorationsTitled(explorationName)[0];
    // The Exploration summary card is masked by a dummy element. Therefore, a
    // Javascript click is used.
    await action.click('Exploration Card', explorationCard, true);
    await waitFor.pageToFullyLoad();
  };

  this.getExplorationObjective = async function(name) {
    var elems = await _getExplorationElements(name);
    var explorationObjective = await action.getText(
      'Exp Summary Tile', elems[0].$(expSummaryTileObjectiveLocator));
    return explorationObjective;
  };

  this.expectExplorationRatingToEqual = async function(name, ratingValue) {
    var elems = await _getExplorationElements(name);
    await waitFor.visibilityOf(
      elems[0], 'Rating card takes too long to appear');
    var explorationRatingValue = await action.getText(
      'Exp Summary Tile', elems[0].$(expSummaryTileRatingLocator));
    expect(explorationRatingValue).toBe(ratingValue);
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
