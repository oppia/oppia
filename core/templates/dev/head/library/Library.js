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

oppia.controller('Library', [
  '$scope', '$http', '$rootScope', '$window', '$timeout', 'i18nIdService',
  'urlService', 'CATEGORY_LIST', 'searchService', 'windowDimensionsService',
  'UrlInterpolationService', function(
      $scope, $http, $rootScope, $window, $timeout, i18nIdService,
      urlService, CATEGORY_LIST, searchService, windowDimensionsService,
      UrlInterpolationService) {
    $rootScope.loadingMessage = 'I18N_LIBRARY_LOADING';
    var possibleBannerFilenames = [
      'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
    $scope.bannerImageFilename = possibleBannerFilenames[
      Math.floor(Math.random() * possibleBannerFilenames.length)];

    $scope.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
      '/library/' + $scope.bannerImageFilename);

    // Below is the width of each tile (width + margins), which can be found
    // in core/templates/dev/head/components/
    //         exploration_summary_tile_directive.html
    var tileDisplayWidth = 0;

    // Keeps track of the index of the left-most visible card of each group.
    $scope.leftmostCardIndices = [];

    $http.get('/libraryindexhandler').success(function(data) {
      $scope.libraryGroups = data.activity_summary_dicts_by_category;

      $rootScope.$broadcast(
        'preferredLanguageCodesLoaded', data.preferred_language_codes);

      $rootScope.loadingMessage = '';

      // Pause is necessary to ensure all elements have loaded, same for
      // initCarousels.
      // TODO(sll): On small screens, the tiles do not have a defined width.
      // The use of 214 here is a hack, and the underlying problem of the tiles
      // not having a defined width on small screens needs to be fixed.
      $timeout(function() {
        tileDisplayWidth = $('exploration-summary-tile').width() || 214;
      }, 20);

      // Initialize the carousel(s) on the library index page.
      $timeout(initCarousels, 390);

      // The following initializes the tracker to have all
      // elements flush left.
      // Transforms the group names into translation ids
      $scope.leftmostCardIndices = [];
      for (i = 0; i < $scope.libraryGroups.length; i++) {
        $scope.leftmostCardIndices.push(0);
        $scope.libraryGroups[i].translationId = i18nIdService.getLibraryId(
          'groups', $scope.libraryGroups[i].header);
      }
    });

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
      // The number 20 is added to tileDisplayWidth in order to compensate
      // for padding and margins. 20 is just an arbitrary number.
      $scope.tileDisplayCount = Math.min(
        Math.floor(windowWidth / (tileDisplayWidth + 20)),
        MAX_NUM_TILES_PER_ROW);

      $('.oppia-library-carousel').css({
        width: ($scope.tileDisplayCount * tileDisplayWidth) + 'px'
      });

      // The following determines whether to enable left scroll after resize.
      for (var i = 0; i < $scope.libraryGroups.length; i++) {
        var carouselJQuerySelector = (
          '.oppia-library-carousel-tiles:eq(n)'.replace('n', i));
        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
        var index = Math.ceil(carouselScrollPositionPx / tileDisplayWidth);
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
      var leftOverlaySelector =
        '.oppia-library-carousel-overlay-left:eq(n)'.replace('n', ind);
      var rightOverlaySelector =
        '.oppia-library-carousel-overlay-right:eq(n)'.replace('n', ind);

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
        ($scope.tileDisplayCount * tileDisplayWidth * direction);

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

      $(leftOverlaySelector).css({
        display: 'inline'
      }).fadeOut({
        duration: 800,
        queue: false
      });
      $(rightOverlaySelector).css({
        display: 'inline'
      }).fadeOut({
        duration: 800,
        queue: false
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

    // The following checks if the page is in search mode.
    $scope.inSearchMode = ($window.location.pathname.indexOf('/search') === 0);
    var activateSearchMode = function() {
      if (!$scope.inSearchMode) {
        $('.oppia-library-container').fadeOut(function() {
          $scope.inSearchMode = true;
          $timeout(function() {
            $('.oppia-library-container').fadeIn();
          }, 50);
        });
      }
    };

    $scope.showAllResultsForCategories = function(categories) {
      var selectedCategories = {};
      for (i = 0; i < categories.length; i++) {
        selectedCategories[categories[i]] = true;
      }

      var targetSearchQueryUrl = searchService.getSearchUrlQueryString(
        '', selectedCategories, {});
      $window.location.href = '/search/find?q=' + targetSearchQueryUrl;
    };

    var libraryWindowCutoffPx = 530;
    $scope.libraryWindowIsNarrow = (
      windowDimensionsService.getWidth() <= libraryWindowCutoffPx);

    windowDimensionsService.registerOnResizeHook(function() {
      $scope.libraryWindowIsNarrow = (
        windowDimensionsService.getWidth() <= libraryWindowCutoffPx);
      $scope.$apply();
    });
  }
]);
