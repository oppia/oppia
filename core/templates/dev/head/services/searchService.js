// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview search service for activityTilesInfinityGrid
 */

oppia.constant('SEARCH_DATA_URL', '/searchhandler/data');

oppia.factory('searchService', [
  '$http', '$rootScope', 'SEARCH_DATA_URL',
  function($http, $rootScope, SEARCH_DATA_URL) {
  var _lastQuery = null;
  var _lastSelectedCategories = {};
  var _lastSelectedLanguageCodes = {};
  var _searchCursor = null;

  // Appends a suffix to the query describing allowed category and language
  // codes to filter on.
  var _getSuffixForQuery = function(selectedCategories, selectedLanguageCodes) {
    var querySuffix = '';

    var _categories = '';
    for (var key in selectedCategories) {
      if (selectedCategories[key]) {
        if (_categories) {
          _categories += '" OR "';
        }
        _categories += key;
      }
    }
    if (_categories) {
      querySuffix += '&category=("' + _categories + '")';
    }

    var _languageCodes = '';
    for (var key in selectedLanguageCodes) {
      if (selectedLanguageCodes[key]) {
        if (_languageCodes) {
          _languageCodes += '" OR "';
        }
        _languageCodes += key;
      }
    }
    if (_languageCodes) {
      querySuffix += '&language_code=("' + _languageCodes + '")';
    }

    return querySuffix;
  };

  var hasPageFinishedLoading = function() {
    return _searchCursor === null;
  };

  var updateSearchFields = function(itemsType, urlComponent,
                                    selectionDetails) {
    var itemCodeGroup = urlComponent.match(/=\("[A-Za-z%20" ]+"\)/);
    var itemCodes = itemCodeGroup ? itemCodeGroup[0] : null;

    var EXPECTED_PREFIX = '=("';
    var EXPECTED_SUFFIX = '")';

    if (!itemCodes ||
        itemCodes.indexOf(EXPECTED_PREFIX) !== 0 ||
        itemCodes.lastIndexOf(EXPECTED_SUFFIX) !==
          itemCodes.length - EXPECTED_SUFFIX.length) {
      throw Error('Invalid search query url fragment for ' +
                  itemsType + ': ' + urlComponent);
      return;
    }

    var items = itemCodes.substring(
      EXPECTED_PREFIX.length, itemCodes.length - EXPECTED_SUFFIX.length
    ).split('" OR "');

    var selections = selectionDetails[itemsType].selections;
    for (var i = 0; i < items.length; i++) {
      selections[items[i]] = true;
    }
  };

  var _isCurrentlyFetchingResults = false;
  var numSearchesInProgress = 0;

  var getQueryUrl = function(searchUrlQueryString) {
    return SEARCH_DATA_URL + '?q=' + searchUrlQueryString;
  };

  return {
    getSearchUrlQueryString: function(searchQuery, selectedCategories,
      selectedLanguageCodes) {
      return encodeURIComponent(searchQuery) +
        _getSuffixForQuery(selectedCategories, selectedLanguageCodes);
    },
    // Note that an empty query results in all explorations being shown.
    executeSearchQuery: function(
        searchQuery, selectedCategories, selectedLanguageCodes,
        successCallback) {
      var queryUrl = getQueryUrl(
        this.getSearchUrlQueryString(
          searchQuery, selectedCategories, selectedLanguageCodes));

      _isCurrentlyFetchingResults = true;
      numSearchesInProgress++;
      $http.get(queryUrl).then(function(response) {
        var data = response.data;
        _lastQuery = searchQuery;
        _lastSelectedCategories = angular.copy(selectedCategories);
        _lastSelectedLanguageCodes = angular.copy(selectedLanguageCodes);
        _searchCursor = data.search_cursor;
        numSearchesInProgress--;

        if ($('.oppia-splash-search-input').val() === searchQuery) {
          $rootScope.$broadcast('refreshGalleryData', data,
                                hasPageFinishedLoading());
          _isCurrentlyFetchingResults = false;
        } else {
          console.log('Mismatch');
          console.log('SearchQuery: ' + searchQuery);
          console.log('Input: ' + $('.oppia-splash-search-input').val());
        }
      }, function() {
        numSearchesInProgress--;
      });

      if (successCallback) {
        successCallback();
      }
    },
    isSearchInProgress: function() {
      return numSearchesInProgress > 0;
    },
    // The following takes in the url search component as an argument and the
    // selectionDetails. It will update selectionDetails with the relevant
    // fields that were extracted from the url. It returns the unencoded search
    // query string.
    updateSearchFieldsBasedOnUrlQuery: function(
        urlComponent, selectionDetails) {
      var urlQuery = urlComponent.substring('?q='.length);
      // The following will split the urlQuery into 3 components:
      // 1. query
      // 2. categories (optional)
      // 3. language codes (default to 'en')
      var querySegments = urlQuery.split('&');

      if (querySegments.length > 3) {
        alert('Invalid search query url!');
        return '';
      }

      for (var i = 1; i < querySegments.length; i++) {
        var urlComponent = decodeURIComponent(querySegments[i]);

        var itemsType = null;
        if (urlComponent.indexOf('category') === 0) {
          itemsType = 'categories';
        } else if (urlComponent.indexOf('language_code') === 0) {
          itemsType = 'languageCodes';
        } else {
          console.error('Invalid search query component: ' + urlComponent);
          continue;
        }

        try {
          updateSearchFields(
            itemsType, urlComponent, selectionDetails);
        } catch (error) {
          selectionDetails[itemsType].selections = {};
          throw error;
        }
      }

      return decodeURIComponent(querySegments[0]);
    },
    loadMoreData: function(successCallback) {
      // If a new query is still being sent, do not fetch more results.
      if (_isCurrentlyFetchingResults) {
        return;
      }

      var queryUrl = getQueryUrl(
        this.getSearchUrlQueryString(
          _lastQuery, _lastSelectedCategories, _lastSelectedLanguageCodes));

      if (_searchCursor) {
        queryUrl += '&cursor=' + _searchCursor;
      }

      _isCurrentlyFetchingResults = true;
      $http.get(queryUrl).then(function(response) {
        _searchCursor = response.data.search_cursor;
        _isCurrentlyFetchingResults = false;

        if (successCallback) {
          successCallback(response.data, hasPageFinishedLoading());
        }
      });
    }
  };
}]);
