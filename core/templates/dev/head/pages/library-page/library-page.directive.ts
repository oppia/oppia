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
 * @fileoverview Data and directive for the Oppia contributors' library page.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');
require('components/summary-tile/collection-summary-tile.directive.ts');
require('pages/library-page/search-results/search-results.directive.ts');

require('domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts');
require('domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts');
require('domain/learner_dashboard/LearnerPlaylistService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');
require('services/ConstructTranslationIdsService.ts');
require('services/PageTitleService.ts');
require('services/SearchService.ts');
require('services/UserService.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');

require('pages/library-page/library-page.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('libraryPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library-page/library-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$log', '$rootScope', '$scope', '$timeout', '$uibModal',
        '$window', 'AlertsService', 'ConstructTranslationIdsService',
        'LearnerDashboardActivityIdsObjectFactory',
        'LearnerDashboardIdsBackendApiService', 'LearnerPlaylistService',
        'PageTitleService', 'SearchService',
        'UrlInterpolationService', 'UrlService', 'UserService',
        'WindowDimensionsService', 'ALL_CATEGORIES',
        'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES', 'LIBRARY_TILE_WIDTH_PX',
        function(
            $http, $log, $rootScope, $scope, $timeout, $uibModal,
            $window, AlertsService, ConstructTranslationIdsService,
            LearnerDashboardActivityIdsObjectFactory,
            LearnerDashboardIdsBackendApiService, LearnerPlaylistService,
            PageTitleService, SearchService,
            UrlInterpolationService, UrlService, UserService,
            WindowDimensionsService, ALL_CATEGORIES,
            LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES, LIBRARY_TILE_WIDTH_PX) {
          var ctrl = this;
          $rootScope.loadingMessage = 'I18N_LIBRARY_LOADING';
          var possibleBannerFilenames = [
            'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
          ctrl.bannerImageFilename = possibleBannerFilenames[
            Math.floor(Math.random() * possibleBannerFilenames.length)];

          ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
            '/library/' + ctrl.bannerImageFilename);

          ctrl.activeGroupIndex = null;

          var currentPath = $window.location.pathname;
          if (!LIBRARY_PATHS_TO_MODES.hasOwnProperty(currentPath)) {
            $log.error('INVALID URL PATH: ' + currentPath);
          }
          ctrl.pageMode = LIBRARY_PATHS_TO_MODES[currentPath];
          ctrl.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;

          var title = 'Exploration Library - Oppia';
          if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP ||
              ctrl.pageMode === LIBRARY_PAGE_MODES.SEARCH) {
            title = 'Find explorations to learn from - Oppia';
          }
          PageTitleService.setPageTitle(title);

          // Keeps track of the index of the left-most visible card of each
          // group.
          ctrl.leftmostCardIndices = [];

          if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP) {
            var pathnameArray = $window.location.pathname.split('/');
            ctrl.groupName = pathnameArray[2];

            $http.get('/librarygrouphandler', {
              params: {
                group_name: ctrl.groupName
              }
            }).success(
              function(data) {
                ctrl.activityList = data.activity_list;

                ctrl.groupHeaderI18nId = data.header_i18n_id;

                $rootScope.$broadcast(
                  'preferredLanguageCodesLoaded',
                  data.preferred_language_codes);

                $rootScope.loadingMessage = '';
              });
          } else {
            $http.get('/libraryindexhandler').success(function(data) {
              ctrl.libraryGroups = data.activity_summary_dicts_by_category;

              UserService.getUserInfoAsync().then(function(userInfo) {
                ctrl.activitiesOwned = {explorations: {}, collections: {}};
                if (userInfo.isLoggedIn()) {
                  $http.get('/creatordashboardhandler/data')
                    .then(function(response) {
                      ctrl.libraryGroups.forEach(function(libraryGroup) {
                        var activitySummaryDicts = (
                          libraryGroup.activity_summary_dicts);

                        var ACTIVITY_TYPE_EXPLORATION = 'exploration';
                        var ACTIVITY_TYPE_COLLECTION = 'collection';
                        activitySummaryDicts.forEach(function(
                            activitySummaryDict) {
                          if (activitySummaryDict.activity_type === (
                            ACTIVITY_TYPE_EXPLORATION)) {
                            ctrl.activitiesOwned.explorations[
                              activitySummaryDict.id] = false;
                          } else if (activitySummaryDict.activity_type === (
                            ACTIVITY_TYPE_COLLECTION)) {
                            ctrl.activitiesOwned.collections[
                              activitySummaryDict.id] = false;
                          } else {
                            $log.error('INVALID ACTIVITY TYPE: Activity' +
                            '(id: ' + activitySummaryDict.id +
                            ', name: ' + activitySummaryDict.title +
                            ', type: ' + activitySummaryDict.activity_type +
                            ') has an invalid activity type, which could ' +
                            'not be recorded as an exploration or a collection.'
                            );
                          }
                        });

                        response.data.explorations_list
                          .forEach(function(ownedExplorations) {
                            ctrl.activitiesOwned.explorations[
                              ownedExplorations.id] = true;
                          });

                        response.data.collections_list
                          .forEach(function(ownedCollections) {
                            ctrl.activitiesOwned.collections[
                              ownedCollections.id] = true;
                          });
                      });
                      $rootScope.loadingMessage = '';
                    });
                } else {
                  $rootScope.loadingMessage = '';
                }
              });

              $rootScope.$broadcast(
                'preferredLanguageCodesLoaded', data.preferred_language_codes);

              // Initialize the carousel(s) on the library index page.
              // Pause is necessary to ensure all elements have loaded.
              $timeout(initCarousels, 390);


              // Check if actual and expected widths are the same.
              // If not produce an error that would be caught by e2e tests.
              $timeout(function() {
                var actualWidth = $('exploration-summary-tile').width();
                if (actualWidth && actualWidth !== LIBRARY_TILE_WIDTH_PX) {
                  console.error(
                    'The actual width of tile is different than the expected ' +
                    'width. Actual size: ' + actualWidth + ', Expected size: ' +
                    LIBRARY_TILE_WIDTH_PX);
                }
              }, 3000);
              // The following initializes the tracker to have all
              // elements flush left.
              // Transforms the group names into translation ids
              ctrl.leftmostCardIndices = [];
              for (var i = 0; i < ctrl.libraryGroups.length; i++) {
                ctrl.leftmostCardIndices.push(0);
              }
            });
          }

          ctrl.setActiveGroup = function(groupIndex) {
            ctrl.activeGroupIndex = groupIndex;
          };

          ctrl.clearActiveGroup = function() {
            ctrl.activeGroupIndex = null;
          };

          // If the value below is changed, the following CSS values in
          // oppia.css must be changed:
          // - .oppia-exp-summary-tiles-container: max-width
          // - .oppia-library-carousel: max-width
          var MAX_NUM_TILES_PER_ROW = 4;
          ctrl.tileDisplayCount = 0;

          var initCarousels = function() {
            // This prevents unnecessary execution of this method immediately
            // after a window resize event is fired.
            if (!ctrl.libraryGroups) {
              return;
            }

            var windowWidth = $(window).width() * 0.85;
            // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to
            // compensate for padding and margins. 20 is just an arbitrary
            // number.
            ctrl.tileDisplayCount = Math.min(
              Math.floor(windowWidth / (LIBRARY_TILE_WIDTH_PX + 20)),
              MAX_NUM_TILES_PER_ROW);

            $('.oppia-library-carousel').css({
              width: (ctrl.tileDisplayCount * LIBRARY_TILE_WIDTH_PX) + 'px'
            });

            // The following determines whether to enable left scroll after
            // resize.
            for (var i = 0; i < ctrl.libraryGroups.length; i++) {
              var carouselJQuerySelector = (
                '.oppia-library-carousel-tiles:eq(n)'.replace(
                  'n', <string><any>i));
              var carouselScrollPositionPx = $(
                carouselJQuerySelector).scrollLeft();
              var index = Math.ceil(
                carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
              ctrl.leftmostCardIndices[i] = index;
            }
          };

          var isAnyCarouselCurrentlyScrolling = false;

          ctrl.scroll = function(ind, isLeftScroll) {
            if (isAnyCarouselCurrentlyScrolling) {
              return;
            }
            var carouselJQuerySelector = (
              '.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));

            var direction = isLeftScroll ? -1 : 1;
            var carouselScrollPositionPx = $(
              carouselJQuerySelector).scrollLeft();

            // Prevent scrolling if there more carousel pixed widths than
            // there are tile widths.
            if (ctrl.libraryGroups[ind].activity_summary_dicts.length <=
                ctrl.tileDisplayCount) {
              return;
            }

            carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

            if (isLeftScroll) {
              ctrl.leftmostCardIndices[ind] = Math.max(
                0, ctrl.leftmostCardIndices[ind] - ctrl.tileDisplayCount);
            } else {
              ctrl.leftmostCardIndices[ind] = Math.min(
                ctrl.libraryGroups[ind].activity_summary_dicts.length -
                  ctrl.tileDisplayCount + 1,
                ctrl.leftmostCardIndices[ind] + ctrl.tileDisplayCount);
            }

            var newScrollPositionPx = carouselScrollPositionPx +
              (ctrl.tileDisplayCount * LIBRARY_TILE_WIDTH_PX * direction);

            $(carouselJQuerySelector).animate({
              scrollLeft: newScrollPositionPx
            }, {
              duration: 800,
              queue: false,
              start: function() {
                isAnyCarouselCurrentlyScrolling = true;
              },
              complete: function() {
                isAnyCarouselCurrentlyScrolling = false;
              }
            });
          };

          // The carousels do not work when the width is 1 card long, so we need
          // to handle this case discretely and also prevent swiping past the
          // first and last card.
          ctrl.incrementLeftmostCardIndex = function(ind) {
            var lastItem = ((
              ctrl.libraryGroups[ind].activity_summary_dicts.length -
              ctrl.tileDisplayCount) <= ctrl.leftmostCardIndices[ind]);
            if (!lastItem) {
              ctrl.leftmostCardIndices[ind]++;
            }
          };
          ctrl.decrementLeftmostCardIndex = function(ind) {
            ctrl.leftmostCardIndices[ind] = (
              Math.max(ctrl.leftmostCardIndices[ind] - 1, 0));
          };

          $(window).resize(function() {
            initCarousels();
            // This is needed, otherwise ctrl.tileDisplayCount takes a long
            // time (several seconds) to update.
            $scope.$apply();
          });

          var activateSearchMode = function() {
            if (ctrl.pageMode !== LIBRARY_PAGE_MODES.SEARCH) {
              $('.oppia-library-container').fadeOut(function() {
                ctrl.pageMode = LIBRARY_PAGE_MODES.SEARCH;
                $timeout(function() {
                  $('.oppia-library-container').fadeIn();
                }, 50);
              });
            }
          };

          // The following loads explorations belonging to a particular group.
          // If fullResultsUrl is given it loads the page corresponding to
          // the url. Otherwise, it will initiate a search query for the
          // given list of categories.
          ctrl.showFullResultsPage = function(categories, fullResultsUrl) {
            if (fullResultsUrl) {
              $window.location.href = fullResultsUrl;
            } else {
              var selectedCategories = {};
              for (var i = 0; i < categories.length; i++) {
                selectedCategories[categories[i]] = true;
              }

              var targetSearchQueryUrl = SearchService.getSearchUrlQueryString(
                '', selectedCategories, {});
              $window.location.href = '/search/find?q=' + targetSearchQueryUrl;
            }
          };

          var libraryWindowCutoffPx = 530;
          ctrl.libraryWindowIsNarrow = (
            WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

          WindowDimensionsService.registerOnResizeHook(function() {
            ctrl.libraryWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$apply();
          });
        }
      ]
    };
  }
]);
