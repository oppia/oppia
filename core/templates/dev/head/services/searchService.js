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

oppia.constant('GALLERY_DATA_URL', '/galleryhandler/data');

oppia.factory('searchService', [
  '$http', '$rootScope', 'GALLERY_DATA_URL',
  function($http, $rootScope, GALLERY_DATA_URL) {
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
      querySuffix += ' category=("' + _categories + '")';
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
      querySuffix += ' language_code=("' + _languageCodes + '")';
    }

    return querySuffix;
  };

  var hasPageFinishedLoading = function() {
    return _searchCursor === null;
  };

  var _isCurrentlyFetchingResults = false;
  var numSearchesInProgress = 0;

  return {
    // Note that an empty query results in all explorations being shown.
    executeSearchQuery: function(
        searchQuery, selectedCategories, selectedLanguageCodes,
        successCallback) {
      console.log(searchQuery);
      var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(
        searchQuery +
        _getSuffixForQuery(selectedCategories, selectedLanguageCodes));

      _isCurrentlyFetchingResults = true;
      numSearchesInProgress++;
      $http.get(queryUrl).success(function(data) {
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
      }).error(function() {
        numSearchesInProgress--;
      });

      if (successCallback) {
        successCallback();
      }
      return encodeURI(searchQuery +
        _getSuffixForQuery(selectedCategories, selectedLanguageCodes));
    },
    isSearchInProgress: function() {
      return numSearchesInProgress > 0;
    },
    loadMoreData: function(successCallback) {
      // If a new query is still being sent, do not fetch more results.
      if (_isCurrentlyFetchingResults) {
        return;
      }

      var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(
        _lastQuery + _getSuffixForQuery(
          _lastSelectedCategories, _lastSelectedLanguageCodes));

      if (_searchCursor) {
        queryUrl += '&cursor=' + _searchCursor;
      }

      _isCurrentlyFetchingResults = true;
      $http.get(queryUrl).success(function(data) {
        _searchCursor = data.search_cursor;
        _isCurrentlyFetchingResults = false;

        if (successCallback) {
          successCallback(data, hasPageFinishedLoading());
        }
      });
    }
  };
}]);
