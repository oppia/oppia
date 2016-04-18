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
 * @fileoverview Directive for the Search Bar.
 */

oppia.directive('searchBar', [function() {
  return {
    restrict: 'E',
    templateUrl: 'components/searchBar',
    controller: [
      '$scope', '$rootScope', '$timeout', '$window', '$location',
      'searchService', 'oppiaDebouncer', 'oppiaHtmlEscaper',
      'ExplorationCreationButtonService', 'urlService', 'CATEGORY_LIST',
      function(
          $scope, $rootScope, $timeout, $window, $location, searchService,
          oppiaDebouncer, oppiaHtmlEscaper, ExplorationCreationButtonService,
          urlService, CATEGORY_LIST) {
        $scope.isSearchInProgress = searchService.isSearchInProgress;
        $scope.ALL_CATEGORIES = CATEGORY_LIST.map(function(categoryName) {
          return {
            id: categoryName,
            text: categoryName
          };
        });
        $scope.ALL_LANGUAGE_CODES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(
          function(languageItem) {
            return {
              id: languageItem.code,
              text: languageItem.name
            };
          });

        $scope.searchQuery = '';
        $scope.selectionDetails = {
          categories: {
            description: '',
            itemsName: 'categories',
            masterList: $scope.ALL_CATEGORIES,
            numSelections: 0,
            selections: {},
            summary: ''
          },
          languageCodes: {
            description: '',
            itemsName: 'languages',
            masterList: $scope.ALL_LANGUAGE_CODES,
            numSelections: 0,
            selections: {},
            summary: ''
          }
        };

        // Update the description, numSelections and summary fields of the
        // relevant entry of $scope.selectionDetails.
        var _updateSelectionDetails = function(itemsType) {
          var itemsName = $scope.selectionDetails[itemsType].itemsName;
          var masterList = $scope.selectionDetails[itemsType].masterList;

          var selectedItems = [];
          for (var i = 0; i < masterList.length; i++) {
            if ($scope.selectionDetails[itemsType]
                      .selections[masterList[i].id]) {
              selectedItems.push(masterList[i].text);
            }
          }

          var totalCount = selectedItems.length;
          $scope.selectionDetails[itemsType].numSelections = totalCount;

          $scope.selectionDetails[itemsType].summary = (
            totalCount === 0 ? (
              'All ' + itemsName.charAt(0).toUpperCase() +
                       itemsName.substr(1)) :
            totalCount === 1 ? selectedItems[0] :
            totalCount + ' ' + itemsName);

          $scope.selectionDetails[itemsType].description = (
            selectedItems.length > 0 ? selectedItems.join(', ') :
            'All ' + itemsName + ' selected');
        };

        $scope.toggleSelection = function(itemsType, optionName) {
          var selections = $scope.selectionDetails[itemsType].selections;
          if (!selections.hasOwnProperty(optionName)) {
            selections[optionName] = true;
          } else {
            selections[optionName] = !selections[optionName];
          }

          _updateSelectionDetails(itemsType);
          _onSearchQueryChangeExec();
        };

        $scope.deselectAll = function(itemsType) {
          $scope.selectionDetails[itemsType].selections = {};
          _updateSelectionDetails(itemsType);
        };

        var _searchBarFullyLoaded = false;

        var _hasChangedSearchQuery = Boolean(urlService.getUrlParams().q);
        var _onSearchQueryChangeExec = function() {
          $scope.searchIsLoading = true;
          searchService.executeSearchQuery(
              $scope.searchQuery, $scope.selectionDetails.categories.selections,
              $scope.selectionDetails.languageCodes.selections, function() {
            if (!_hasChangedSearchQuery && _searchBarFullyLoaded) {
              _hasChangedSearchQuery = true;
              $rootScope.$broadcast('hasChangedSearchQuery');
            }
          });

          var searchUrl = searchService.searchQueryUrl(
            $scope.searchQuery, $scope.selectionDetails.categories.selections,
            $scope.selectionDetails.languageCodes.selections
          );
          if ($window.location.pathname != '/search' &&
              $scope.searchQuery != '') {
            $window.location.href = '/search?q=' + searchUrl;
          } else {
            if ($window.location.pathname == '/search') {
              $location.search({
                q: decodeURIComponent(searchUrl)
              });
            }
          }
        };

        // Initialize the selection descriptions and summaries.
        for (var itemsType in $scope.selectionDetails) {
          _updateSelectionDetails(itemsType);
        }

        $scope.onSearchQueryChange = function(evt) {
          // Query immediately when the enter or space key is pressed.
          if (evt.keyCode == 13 || evt.keyCode == 32) {
            _onSearchQueryChangeExec();
          } else {
            oppiaDebouncer.debounce(_onSearchQueryChangeExec(), 400)();
          }
        };

        $scope.$on(
          'preferredLanguageCodesLoaded',
          function(evt, preferredLanguageCodesList) {
            for (var i = 0; i < preferredLanguageCodesList.length; i++) {
              var selections = $scope.selectionDetails.languageCodes.selections;
              var languageCode = preferredLanguageCodesList[i];
              if (!selections.hasOwnProperty(languageCode)) {
                selections[languageCode] = true;
              } else {
                selections[languageCode] = !selections[languageCode];
              }
            }

            _updateSelectionDetails('languageCodes');

            if (Boolean(urlService.getUrlParams().q)) {
              updateSearchFieldsBasedOnUrlQuery();
            }
            _onSearchQueryChangeExec();

            _searchBarFullyLoaded = true;
          }
        );

        var updateLanguageCodeFields = function(url) {
          // Grabs Grab language code(s) from URL and returns url without
          // language fields. This function assumes that language codes are
          // at the end of the url.

          var _languageCodePattern = / language_code=\([a-zOR\%\" ]+\)$/;
          var _languageCodes = url.match(_languageCodePattern)[0];
          var _languageCodeSelections = [];
          if (_languageCodes != undefined) {
            url = url.replace(_languageCodePattern, '');

            // Grab language code(s) from extracted language section,
            // these are 2 lowercase letters.
            _languageCodeSelections = _languageCodes.match(/"([a-z]{2})"/g);
          }

          for (i = 0; i < _languageCodeSelections.length; i++) {
            var language = _languageCodeSelections[i].match(/[a-z]{2}/g);
            $scope.selectionDetails.languageCodes.selections[language] = true;
          }
          _updateSelectionDetails('languageCodes');
          return url;
        };

        var updateCategoryFields = function(url) {
          // Grab category code(s) from URL and returns the url without
          // the category field.
          var _categoryPattern = /category=\([A-Za-z0-9\" ]+\)\s*/;
          var _categoriesCodes = url.match(_categoryPattern);

          var _categories = [];
          if (_categoriesCodes != undefined) {
            url = url.replace(_categoryPattern, '');
            _categories = _categoriesCodes[0].match(/"[A-Za-z]+"/g);
          }

          for (i = 0; i < _categories.length; i++) {
            var category = _categories[i].match(/[A-Za-z]+/);
            $scope.selectionDetails.categories.selections[category] = true;
          }
          _updateSelectionDetails('categories');
          return url;
        };

        var updateSearchFieldsBasedOnUrlQuery = function() {
          var query = decodeURIComponent(urlService.getUrlParams().q);
          query = updateLanguageCodeFields(query);
          query = updateCategoryFields(query);

          // Remove leading and ending spaces from query.
          $scope.searchQuery = query.trim();
        };
      }
    ]
  };
}]);
