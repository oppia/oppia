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

var LibraryPage = function() {
  var LIBRARY_URL_SUFFIX = '/community-library';
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
    element(by.css(
      '.protractor-library-page-search-bar ' +
      '.protractor-test-search-bar-category-selector')));
  var explorationObjective = element(
    by.css('.protractor-test-exp-summary-tile-objective'));
  var createActivityButton = element(
    by.css('.protractor-test-create-activity')
  );
  var languageSelector = forms.MultiSelectEditor(
    element(by.css(
      '.protractor-library-page-search-bar ' +
      '.protractor-test-search-bar-language-selector')));
  var searchInputs = element.all(
    by.css('.protractor-test-search-input'));
  var mainHeader = element(by.css('.protractor-test-library-main-header'));

  // Returns a promise of all explorations with the given name.
  var _getExplorationElements = async function(name) {
    return await element.all(
      by.css('.protractor-test-exp-summary-tile')).filter(
      async function(tile) {
        var tileTitle = await tile.element(
          by.css('.protractor-test-exp-summary-tile-title')).getText();
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

    // get function is a zero-based index.
    var searchInput = (
      browser.isMobile ? await searchInputs.get(1) :
      await searchInputs.first());
    await searchInput.clear();
    await searchInput.sendKeys(searchQuery);
  };

  this.get = async function() {
    await browser.get(LIBRARY_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.addSelectedExplorationToPlaylist = async function() {
    var addToPlaylistButton = element(by.css(
      '.protractor-test-add-to-playlist-btn')
    );

    await browser.actions().mouseMove(element(by.css(
      '.protractor-test-exp-summary-tile-title'))).perform();

    await waitFor.elementToBeClickable(
      addToPlaylistButton, 'Add to playlist Icon taking too long to load');
    await addToPlaylistButton.click();
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
    await waitFor.visibilityOf(
      allCollectionsTitled(collectionName).first(),
      'Unable to find collection ' + collectionName);
    await allCollectionsTitled(collectionName).first().click();
    await waitFor.pageToFullyLoad();
  };

  this.playExploration = async function(explorationName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      await allExplorationSummaryTile.first(),
      'Library Page does not have any explorations');

    var explorationCard = await allExplorationsTitled(explorationName).first();
    await waitFor.visibilityOf(
      explorationCard, 'Unable to find exploration ' + explorationName);
    await explorationCard.click();
    await waitFor.pageToFullyLoad();
  };

  this.getExplorationObjective = async function(name) {
    var elems = await _getExplorationElements(name);
    return await elems[0].element(by.css(
      '.protractor-test-exp-summary-tile-objective')).getText();
  };

  this.expectExplorationRatingToEqual = async function(name, ratingValue) {
    var elems = await _getExplorationElements(name);
    await waitFor.visibilityOf(
      elems[0], 'Rating card takes too long to appear');
    var value = await elems[0].element(by.css(
      '.protractor-test-exp-summary-tile-rating')).getText();
    expect(value).toBe(ratingValue);
  };

  this.clickCreateActivity = async function() {
    await createActivityButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.clickExplorationObjective = async function() {
    await waitFor.elementToBeClickable(
      explorationObjective,
      'Exploration Objective takes too long to be clickable');
    await explorationObjective.click();
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
