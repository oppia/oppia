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

oppia.directive('searchBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library/' +
        'search_bar_directive.html'),
      controller: [
        '$location', '$rootScope', '$scope', '$timeout', '$translate',
        '$window', 'ConstructTranslationIdsService', 'DebouncerService',
        'HtmlEscaperService', 'LanguageUtilService', 'NavigationService',
        'SearchService', 'UrlService', 'SEARCH_DROPDOWN_CATEGORIES',
        function(
            $location, $rootScope, $scope, $timeout, $translate,
            $window, ConstructTranslationIdsService, DebouncerService,
            HtmlEscaperService, LanguageUtilService, NavigationService,
            SearchService, UrlService, SEARCH_DROPDOWN_CATEGORIES) {
          $scope.isSearchInProgress = SearchService.isSearchInProgress;
          $scope.SEARCH_DROPDOWN_CATEGORIES = (
            SEARCH_DROPDOWN_CATEGORIES.map(
              function(categoryName) {
                return {
                  id: categoryName,
                  text: ConstructTranslationIdsService.getLibraryId(
                    'categories', categoryName)
                };
              }
            )
          );
          $scope.ACTION_OPEN = NavigationService.ACTION_OPEN;
          $scope.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
          $scope.KEYBOARD_EVENT_TO_KEY_CODES =
          NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
          /**
           * Opens the submenu.
           * @param {object} evt
           * @param {String} menuName - name of menu, on which
           * open/close action to be performed (category,language).
           */
          $scope.openSubmenu = function(evt, menuName) {
            NavigationService.openSubmenu(evt, menuName);
          };
          /**
           * Handles keydown events on menus.
           * @param {object} evt
           * @param {String} menuName - name of menu to perform action
           * on(category/language)
           * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
           * corresponding actions to be performed(open/close).
           *
           * @example
           *  onMenuKeypress($event, 'category', {enter: 'open'})
           */

          $scope.onMenuKeypress = function(evt, menuName, eventsTobeHandled) {
            NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
            $scope.activeMenuName = NavigationService.activeMenuName;
          };
          $scope.ALL_LANGUAGE_CODES = (
            LanguageUtilService.getLanguageIdsAndTexts());

          $scope.searchQuery = '';
          $scope.selectionDetails = {
            categories: {
              description: '',
              itemsName: 'categories',
              masterList: $scope.SEARCH_DROPDOWN_CATEGORIES,
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

          // Non-translatable parts of the html strings, like numbers or user
          // names.
          $scope.translationData = {};

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
              totalCount === 0 ? 'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() :
              totalCount === 1 ? selectedItems[0] :
              'I18N_LIBRARY_N_' + itemsName.toUpperCase());
            $scope.translationData[itemsName + 'Count'] = totalCount;

            // TODO(milit): When the language changes, the translations won't
            // change until the user changes the selection and this function is
            // re-executed.
            if (selectedItems.length > 0) {
              var translatedItems = [];
              for (var i = 0; i < selectedItems.length; i++) {
                translatedItems.push($translate.instant(selectedItems[i]));
              }
              $scope.selectionDetails[itemsType].description = (
                translatedItems.join(', '));
            } else {
              $scope.selectionDetails[itemsType].description = (
                'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED');
            }
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
            onSearchQueryChangeExec();
          };

          $scope.$watch('searchQuery', function(newQuery, oldQuery) {
            // Run only if the query has changed.
            if (newQuery !== oldQuery) {
              onSearchQueryChangeExec();
            }
          });

          var onSearchQueryChangeExec = function() {
            SearchService.executeSearchQuery(
              $scope.searchQuery, $scope.selectionDetails.categories.selections,
              $scope.selectionDetails.languageCodes.selections);

            var searchUrlQueryString = SearchService.getSearchUrlQueryString(
              $scope.searchQuery, $scope.selectionDetails.categories.selections,
              $scope.selectionDetails.languageCodes.selections
            );
            if ($window.location.pathname === '/search/find') {
              $location.url('/find?q=' + searchUrlQueryString);
            } else {
              $window.location.href = '/search/find?q=' + searchUrlQueryString;
            }
          };

          // Initialize the selection descriptions and summaries.
          for (var itemsType in $scope.selectionDetails) {
            updateSelectionDetails(itemsType);
          }

          var updateSearchFieldsBasedOnUrlQuery = function() {
            var oldQueryString = SearchService.getCurrentUrlQueryString();

            $scope.selectionDetails.categories.selections = {};
            $scope.selectionDetails.languageCodes.selections = {};

            $scope.searchQuery =
             SearchService.updateSearchFieldsBasedOnUrlQuery(
               $window.location.search, $scope.selectionDetails);

            updateSelectionDetails('categories');
            updateSelectionDetails('languageCodes');

            var newQueryString = SearchService.getCurrentUrlQueryString();

            if (oldQueryString !== newQueryString) {
              onSearchQueryChangeExec();
            }
          };

          $scope.$on('$locationChangeSuccess', function() {
            if (UrlService.getUrlParams().hasOwnProperty('q')) {
              updateSearchFieldsBasedOnUrlQuery();
            }
          });

          $scope.$on(
            'preferredLanguageCodesLoaded',
            function(evt, preferredLanguageCodesList) {
              preferredLanguageCodesList.forEach(function(languageCode) {
                var selections =
                 $scope.selectionDetails.languageCodes.selections;
                if (!selections.hasOwnProperty(languageCode)) {
                  selections[languageCode] = true;
                } else {
                  selections[languageCode] = !selections[languageCode];
                }
              });

              updateSelectionDetails('languageCodes');

              if (UrlService.getUrlParams().hasOwnProperty('q')) {
                updateSearchFieldsBasedOnUrlQuery();
              }

              if ($window.location.pathname === '/search/find') {
                onSearchQueryChangeExec();
              }

              refreshSearchBarLabels();

              // Notify the function that handles overflow in case the search
              // elements load after it has already been run.
              $rootScope.$broadcast('searchBarLoaded', true);
            }
          );

          var refreshSearchBarLabels = function() {
            // If you translate these strings in the html, then you must use a
            // filter because only the first 14 characters are displayed. That
            // would generate FOUC for languages other than English. As an
            // exception, we translate them here and update the translation
            // every time the language is changed.
            $scope.searchBarPlaceholder = $translate.instant(
              'I18N_LIBRARY_SEARCH_PLACEHOLDER');
            // 'messageformat' is the interpolation method for plural forms.
            // http://angular-translate.github.io/docs/#/guide/14_pluralization.
            $scope.categoryButtonText = $translate.instant(
              $scope.selectionDetails.categories.summary,
              $scope.translationData, 'messageformat');
            $scope.languageButtonText = $translate.instant(
              $scope.selectionDetails.languageCodes.summary,
              $scope.translationData, 'messageformat');
          };

          $rootScope.$on('$translateChangeSuccess', refreshSearchBarLabels);
        }
      ]
    };
  }]);
