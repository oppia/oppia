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
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');
require('components/summary-tile/exploration-summary-tile.component.ts');
require('components/summary-tile/collection-summary-tile.component.ts');
require('pages/library-page/search-results/search-results.component.ts');

require('domain/classroom/classroom-backend-api.service');
require('domain/learner_dashboard/learner-dashboard-activity-ids.model.ts');
require(
  'domain/learner_dashboard/learner-dashboard-ids-backend-api.service.ts');
require(
  'domain/learner_dashboard/learner-dashboard-activity-backend-api.service');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/keyboard-shortcut.service.ts');
require('services/search.service.ts');
require('services/user.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/i18n-language-code.service.ts');

require('pages/library-page/library-page.constants.ajs.ts');

angular.module('oppia').component('libraryPage', {
  template: require('./library-page.component.html'),
  controller: [
    '$http', '$log', '$rootScope', '$scope', '$timeout', '$window',
    'I18nLanguageCodeService', 'KeyboardShortcutService', 'LoaderService',
    'SearchService', 'UrlInterpolationService',
    'UserService', 'WindowDimensionsService', 'LIBRARY_PAGE_MODES',
    'LIBRARY_PATHS_TO_MODES', 'LIBRARY_TILE_WIDTH_PX',
    function(
        $http, $log, $rootScope, $scope, $timeout, $window,
        I18nLanguageCodeService, KeyboardShortcutService, LoaderService,
        SearchService, UrlInterpolationService,
        UserService, WindowDimensionsService, LIBRARY_PAGE_MODES,
        LIBRARY_PATHS_TO_MODES, LIBRARY_TILE_WIDTH_PX) {
      var ctrl = this;

      ctrl.classroomBackendApiService = (
        OppiaAngularRootComponent.classroomBackendApiService);
      ctrl.pageTitleService = (
        OppiaAngularRootComponent.pageTitleService);

      var possibleBannerFilenames = [
        'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
      // If the value below is changed, the following CSS values in
      // oppia.css must be changed:
      // - .oppia-exp-summary-tiles-container: max-width
      // - .oppia-library-carousel: max-width.
      var MAX_NUM_TILES_PER_ROW = 4;
      var isAnyCarouselCurrentlyScrolling = false;

      ctrl.CLASSROOM_PROMOS_ARE_ENABLED = false;

      ctrl.setActiveGroup = function(groupIndex) {
        ctrl.activeGroupIndex = groupIndex;
      };

      ctrl.clearActiveGroup = function() {
        ctrl.activeGroupIndex = null;
      };

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
              'n', String(i)));
          var carouselScrollPositionPx = $(
            carouselJQuerySelector).scrollLeft();
          var index = Math.ceil(
            carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
          ctrl.leftmostCardIndices[i] = index;
        }
      };

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
      ctrl.$onInit = function() {
        LoaderService.showLoadingScreen('I18N_LIBRARY_LOADING');
        ctrl.bannerImageFilename = possibleBannerFilenames[
          Math.floor(Math.random() * possibleBannerFilenames.length)];

        ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
          '/library/' + ctrl.bannerImageFilename);

        ctrl.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };

        let service = ctrl.classroomBackendApiService;
        service.fetchClassroomPromosAreEnabledStatusAsync().then(
          function(classroomPromosAreEnabled) {
            ctrl.CLASSROOM_PROMOS_ARE_ENABLED = classroomPromosAreEnabled;
          });

        ctrl.activeGroupIndex = null;

        var currentPath = $window.location.pathname;
        if (!LIBRARY_PATHS_TO_MODES.hasOwnProperty(currentPath)) {
          $log.error('INVALID URL PATH: ' + currentPath);
        }
        ctrl.pageMode = LIBRARY_PATHS_TO_MODES[currentPath];
        ctrl.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;

        var title = 'Community Library Lessons | Oppia';
        if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP ||
            ctrl.pageMode === LIBRARY_PAGE_MODES.SEARCH) {
          title = 'Find explorations to learn from - Oppia';
        }
        ctrl.pageTitleService.setPageTitle(title);

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
          }).then(
            function(response) {
              ctrl.activityList = response.data.activity_list;

              ctrl.groupHeaderI18nId = response.data.header_i18n_id;

              I18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
                response.data.preferred_language_codes);

              LoaderService.hideLoadingScreen();
            });
        } else {
          $http.get('/libraryindexhandler').then(function(response) {
            ctrl.libraryGroups =
              response.data.activity_summary_dicts_by_category;
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
                          $log.error(
                            'INVALID ACTIVITY TYPE: Activity' +
                            '(id: ' + activitySummaryDict.id +
                            ', name: ' + activitySummaryDict.title +
                            ', type: ' + activitySummaryDict.activity_type +
                            ') has an invalid activity type, which could ' +
                            'not be recorded as an exploration or a ' +
                            'collection.'
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
                    LoaderService.hideLoadingScreen();
                  });
              } else {
                LoaderService.hideLoadingScreen();
              }
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the controller is migrated to angular.
              $rootScope.$applyAsync();
            });

            I18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
              response.data.preferred_language_codes);

            // Initialize the carousel(s) on the library index page.
            // Pause is necessary to ensure all elements have loaded.
            $timeout(initCarousels, 390);
            KeyboardShortcutService.bindLibraryPageShortcuts();


            // Check if actual and expected widths are the same.
            // If not produce an error that would be caught by e2e tests.
            $timeout(function() {
              var actualWidth = $('exploration-summary-tile').width();
              if (actualWidth && actualWidth !== LIBRARY_TILE_WIDTH_PX) {
                $log.error(
                  'The actual width of tile is different than the ' +
                  'expected width. Actual size: ' + actualWidth +
                  ', Expected size: ' + LIBRARY_TILE_WIDTH_PX);
              }
            }, 3000);
            // The following initializes the tracker to have all
            // elements flush left.
            // Transforms the group names into translation ids.
            ctrl.leftmostCardIndices = [];
            for (var i = 0; i < ctrl.libraryGroups.length; i++) {
              ctrl.leftmostCardIndices.push(0);
            }
          });
        }
        ctrl.tileDisplayCount = 0;

        var libraryWindowCutoffPx = 530;
        ctrl.libraryWindowIsNarrow = (
          WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

        ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
          subscribe(evt => {
            initCarousels();

            ctrl.libraryWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$applyAsync();
          });
      };
      ctrl.$onDestroy = function() {
        if (ctrl.resizeSubscription) {
          ctrl.resizeSubscription.unsubscribe();
        }
      };
    }
  ]
});
