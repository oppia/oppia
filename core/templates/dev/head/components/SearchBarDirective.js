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
          $scope, $rootScope, $timeout, $window, $location,
          searchService, oppiaDebouncer, oppiaHtmlEscaper,
          ExplorationCreationButtonService, urlService, CATEGORY_LIST) {
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
        var updateSelectionDetails = function(itemsType) {
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

          updateSelectionDetails(itemsType);
          onSearchQueryChangeExec();
        };

        $scope.deselectAll = function(itemsType) {
          $scope.selectionDetails[itemsType].selections = {};
          updateSelectionDetails(itemsType);
        };

        var onSearchQueryChangeExec = function() {
          searchService.executeSearchQuery(
            $scope.searchQuery, $scope.selectionDetails.categories.selections,
            $scope.selectionDetails.languageCodes.selections);

          var searchUrlQueryString = searchService.getSearchUrlQueryString(
            $scope.searchQuery, $scope.selectionDetails.categories.selections,
            $scope.selectionDetails.languageCodes.selections
          );
          if ($window.location.pathname == '/search/find') {
            $location.url('/find?q=' + searchUrlQueryString);
          } else {
            $window.location.href = '/search/find?q=' + searchUrlQueryString;
          }
        };

        // Initialize the selection descriptions and summaries.
        for (var itemsType in $scope.selectionDetails) {
          updateSelectionDetails(itemsType);
        }

        $scope.onSearchQueryChange = function(evt) {
          // Query immediately when the enter or space key is pressed.
          if (evt.keyCode == 13 || evt.keyCode == 32) {
            onSearchQueryChangeExec();
          } else {
            oppiaDebouncer.debounce(onSearchQueryChangeExec, 400)();
          }
        };

        var updateSearchFieldsBasedOnUrlQuery = function() {
          $scope.selectionDetails.categories.selections = {};
          $scope.selectionDetails.languageCodes.selections = {};

          $scope.searchQuery = searchService.updateSearchFieldsBasedOnUrlQuery(
            $window.location.search, $scope.selectionDetails);

          updateSelectionDetails('categories');
          updateSelectionDetails('languageCodes');

          onSearchQueryChangeExec();
        };

        $scope.$on('$locationChangeSuccess', function() {
          if (urlService.getUrlParams().hasOwnProperty('q')) {
            updateSearchFieldsBasedOnUrlQuery();
          }
        });

        $scope.$on(
          'preferredLanguageCodesLoaded',
          function(evt, preferredLanguageCodesList) {
            preferredLanguageCodesList.forEach(function(languageCode) {
              var selections = $scope.selectionDetails.languageCodes.selections;
              if (!selections.hasOwnProperty(languageCode)) {
                selections[languageCode] = true;
              } else {
                selections[languageCode] = !selections[languageCode];
              }
            });

            updateSelectionDetails('languageCodes');

            if (urlService.getUrlParams().hasOwnProperty('q')) {
              updateSearchFieldsBasedOnUrlQuery();
            }

            if ($window.location.pathname == '/search/find') {
              onSearchQueryChangeExec();
            }
          }
        );
      }
    ]
  };
}]);
