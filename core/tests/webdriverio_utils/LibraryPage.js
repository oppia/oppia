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

var LibraryPage = function() {
  var LIBRARY_URL_SUFFIX = '/community-library';

  var allCollectionSummaryTile = $('.e2e-test-collection-summary-tile');
  var allExplorationSummaryTile = $('.e2e-test-exp-summary-tile');
  var mainHeader = $('.e2e-test-library-main-header');
  var searchButton = $('.e2e-test-search-button');
  var allExplorationsTitled = function(explorationName) {
    return $$(
      `.e2e-test-exp-summary-tile-title=${explorationName}`);
  };

  var allCollectionsTitled = function(collectionName) {
    return $$(
      `.e2e-test-collection-summary-tile-title=${collectionName}`);
  };

  var _submitSearchQuery = async function(searchQuery) {
    // The library page has two search bar input elements.
    // The first search bar input element is visible only in a desktop
    // browser and is invisible in case of a mobile browser.
    // The second search bar input element is visible when the library
    // page is rendered for mobile device.

    // Function get is a zero-based index.
    var searchInputs = await $$('.e2e-test-search-input');
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

  this.findExploration = async function(explorationTitle) {
    await waitFor.pageToFullyLoad();
    await _submitSearchQuery(explorationTitle);
  };

  this.playExploration = async function(explorationName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      allExplorationSummaryTile,
      'Library Page does not have any explorations');

    var explorationCard = await allExplorationsTitled(explorationName)[0];
    await waitFor.visibilityOf(
      explorationCard, 'Unable to find exploration ' + explorationName);
    // The Exploration summary card is masked by a dummy element. Therefore, a
    // Javascript click is used.
    await action.click('Exploration Card', explorationCard, true);
    await waitFor.pageToFullyLoad();
  };


  this.findCollection = async function(collectionTitle) {
    await waitFor.pageToFullyLoad();
    await _submitSearchQuery(collectionTitle);
  };

  this.expectMainHeaderTextToBe = async function(expectedHeaderText) {
    expect(await mainHeader.getText()).toEqual(expectedHeaderText);
  };

  this.playCollection = async function(collectionName) {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      allCollectionSummaryTile,
      'Library Page does not have any collections');
    var collectionCard = await allCollectionsTitled(collectionName)[0];
    await waitFor.visibilityOf(
      collectionCard,
      'Unable to find collection ' + collectionName);
    // The Collection summary card is masked by a dummy element. Therefore, a
    // Javascript click is used.
    await action.click('Collection Card', collectionCard, true);
    await waitFor.pageToFullyLoad();
  };
};

exports.LibraryPage = LibraryPage;
