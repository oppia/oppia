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
 * @fileoverview Data and controllers for the Oppia contributors' library page.
 */

// NOTE TO DEVELOPERS: The constants defined below in LIBRARY_PAGE_MODES should
// be same as the LIBRARY_PAGE_MODE constants defined in feconf.py. For example
// LIBRARY_PAGE_MODES.GROUP should have the same value as
// LIBRARY_PAGE_MODE_GROUP in feconf.py.
oppia.constant('LIBRARY_PAGE_MODES', {
  GROUP: 'group',
  INDEX: 'index',
  SEARCH: 'search'
});

oppia.controller('Library', [
  '$scope', '$http', '$uibModal', '$rootScope', '$window', '$timeout',
  'ConstructTranslationIdsService', 'UrlService', 'ALL_CATEGORIES',
  'SearchService', 'WindowDimensionsService', 'UrlInterpolationService',
  'LIBRARY_PAGE_MODES', 'LIBRARY_TILE_WIDTH_PX', 'AlertsService',
  'LearnerDashboardIdsBackendApiService',
  'LearnerDashboardActivityIdsObjectFactory', 'LearnerPlaylistService',
  function(
      $scope, $http, $uibModal, $rootScope, $window, $timeout,
      ConstructTranslationIdsService, UrlService, ALL_CATEGORIES,
      SearchService, WindowDimensionsService, UrlInterpolationService,
      LIBRARY_PAGE_MODES, LIBRARY_TILE_WIDTH_PX, AlertsService,
      LearnerDashboardIdsBackendApiService,
      LearnerDashboardActivityIdsObjectFactory, LearnerPlaylistService) {
    $rootScope.loadingMessage = 'I18N_LIBRARY_LOADING';
    var possibleBannerFilenames = [
      'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
    $scope.bannerImageFilename = possibleBannerFilenames[
      Math.floor(Math.random() * possibleBannerFilenames.length)];

    $scope.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
      '/library/' + $scope.bannerImageFilename);

    $scope.activeGroupIndex = null;

    $scope.pageMode = GLOBALS.PAGE_MODE;
    $scope.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;

    // Keeps track of the index of the left-most visible card of each group.
    $scope.leftmostCardIndices = [];

    if ($scope.pageMode === LIBRARY_PAGE_MODES.GROUP) {
      var pathnameArray = $window.location.pathname.split('/');
      $scope.groupName = pathnameArray[2];

      $http.get('/librarygrouphandler', {
        params: {
          group_name: $scope.groupName
        }
      }).success(
        function(data) {
          $scope.activityList = data.activity_list;

          $scope.groupHeaderI18nId = data.header_i18n_id;

          $rootScope.$broadcast(
            'preferredLanguageCodesLoaded', data.preferred_language_codes);

          $rootScope.loadingMessage = '';
        });
    } else {
      $http.get('/libraryindexhandler').success(function(data) {
        $scope.libraryGroups = data.activity_summary_dicts_by_category;

        for (var i = 0; i < $scope.libraryGroups.length; i++) {
          var categoryActivity = $scope.libraryGroups[i].activity_summary_dicts;
          for (var j = 0; j < categoryActivity.length; j++) {
            activityType = categoryActivity[j].activity_type;
            activityId = categoryActivity[j].id;

            var learnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl(
                '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                  activityType: activityType,
                  activityId: activityId
                }));
            $http.post(learnerPlaylistUrl, {})
              .then(function(response) {
                for (var i = 0; i < $scope.libraryGroups.length; i++) {
                  var categoryActivity = $scope.libraryGroups[i]
                    .activity_summary_dicts;
                  for (var j = 0; j < categoryActivity.length; j++) {
                    url = response.config.url;
                    url = url.substring(url.lastIndexOf('/') + 1, url.length);
                    if (url === categoryActivity[j].id) {
                      categoryActivity[j].shouldShowAddToPlaylistIcon = response
                        .data.belongs_to_subscribed_activities;
                    }
                  }
                }
              });
          }
        }

        $rootScope.$broadcast(
          'preferredLanguageCodesLoaded', data.preferred_language_codes);

        $rootScope.loadingMessage = '';

        // Initialize the carousel(s) on the library index page.
        // Pause is necessary to ensure all elements have loaded.
        $timeout(initCarousels, 390);


        // Check if actual and expected widths are the same.
        // If not produce an error that would be caught by e2e tests.
        $timeout(function () {
          var actualWidth = $('exploration-summary-tile').width();
          if (actualWidth && actualWidth !== LIBRARY_TILE_WIDTH_PX) {
            console.error(
              'The actual width of tile is different than the expected width.' +
              ' Actual size: ' + actualWidth + ', Expected size: ' +
              LIBRARY_TILE_WIDTH_PX);
          }
        }, 3000);
        // The following initializes the tracker to have all
        // elements flush left.
        // Transforms the group names into translation ids
        $scope.leftmostCardIndices = [];
        for (i = 0; i < $scope.libraryGroups.length; i++) {
          $scope.leftmostCardIndices.push(0);
        }
      });
    }

    $scope.setActiveGroup = function(groupIndex) {
      $scope.activeGroupIndex = groupIndex;
    };

    $scope.clearActiveGroup = function() {
      $scope.activeGroupIndex = null;
    };

    // If the value below is changed, the following CSS values in oppia.css
    // must be changed:
    // - .oppia-exp-summary-tiles-container: max-width
    // - .oppia-library-carousel: max-width
    var MAX_NUM_TILES_PER_ROW = 4;
    $scope.tileDisplayCount = 0;

    var initCarousels = function() {
      // This prevents unnecessary execution of this method immediately after
      // a window resize event is fired.
      if (!$scope.libraryGroups) {
        return;
      }

      var windowWidth = $(window).width() * 0.85;
      // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to compensate
      // for padding and margins. 20 is just an arbitrary number.
      $scope.tileDisplayCount = Math.min(
        Math.floor(windowWidth / (LIBRARY_TILE_WIDTH_PX + 20)),
        MAX_NUM_TILES_PER_ROW);

      $('.oppia-library-carousel').css({
        width: ($scope.tileDisplayCount * LIBRARY_TILE_WIDTH_PX) + 'px'
      });

      // The following determines whether to enable left scroll after resize.
      for (var i = 0; i < $scope.libraryGroups.length; i++) {
        var carouselJQuerySelector = (
          '.oppia-library-carousel-tiles:eq(n)'.replace('n', i));
        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
        var index = Math.ceil(carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
        $scope.leftmostCardIndices[i] = index;
      }
    };

    var isAnyCarouselCurrentlyScrolling = false;

    $scope.scroll = function(ind, isLeftScroll) {
      if (isAnyCarouselCurrentlyScrolling) {
        return;
      }
      var carouselJQuerySelector = (
        '.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));

      var direction = isLeftScroll ? -1 : 1;
      var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();

      // Prevent scrolling if there more carousel pixed widths than
      // there are tile widths.
      if ($scope.libraryGroups[ind].activity_summary_dicts.length <=
          $scope.tileDisplayCount) {
        return;
      }

      carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

      if (isLeftScroll) {
        $scope.leftmostCardIndices[ind] = Math.max(
          0, $scope.leftmostCardIndices[ind] - $scope.tileDisplayCount);
      } else {
        $scope.leftmostCardIndices[ind] = Math.min(
          $scope.libraryGroups[ind].activity_summary_dicts.length -
            $scope.tileDisplayCount + 1,
          $scope.leftmostCardIndices[ind] + $scope.tileDisplayCount);
      }

      var newScrollPositionPx = carouselScrollPositionPx +
        ($scope.tileDisplayCount * LIBRARY_TILE_WIDTH_PX * direction);

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

    // The carousels do not work when the width is 1 card long, so we need to
    // handle this case discretely.
    $scope.incrementLeftmostCardIndex = function(ind) {
      $scope.leftmostCardIndices[ind]++;
    };
    $scope.decrementLeftmostCardIndex = function(ind) {
      $scope.leftmostCardIndices[ind]--;
    };

    $(window).resize(function() {
      initCarousels();
      // This is needed, otherwise $scope.tileDisplayCount takes a long time
      // (several seconds) to update.
      $scope.$apply();
    });

    var activateSearchMode = function() {
      if ($scope.pageMode !== LIBRARY_PAGE_MODES.SEARCH) {
        $('.oppia-library-container').fadeOut(function() {
          $scope.pageMode = LIBRARY_PAGE_MODES.SEARCH;
          $timeout(function() {
            $('.oppia-library-container').fadeIn();
          }, 50);
        });
      }
    };

    // The following loads explorations belonging to a particular group. If
    // fullResultsUrl is given it loads the page corresponding to the url.
    // Otherwise, it will initiate a search query for the given list of
    // categories.
    $scope.showFullResultsPage = function(categories, fullResultsUrl) {
      if (fullResultsUrl) {
        $window.location.href = fullResultsUrl;
      } else {
        var selectedCategories = {};
        for (i = 0; i < categories.length; i++) {
          selectedCategories[categories[i]] = true;
        }

        var targetSearchQueryUrl = SearchService.getSearchUrlQueryString(
          '', selectedCategories, {});
        $window.location.href = '/search/find?q=' + targetSearchQueryUrl;
      }
    };

    var libraryWindowCutoffPx = 530;
    $scope.libraryWindowIsNarrow = (
      WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

    WindowDimensionsService.registerOnResizeHook(function() {
      $scope.libraryWindowIsNarrow = (
        WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
      $scope.$apply();
    });
  }
]);
