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
 * @fileoverview Data and controllers for the Oppia contributors' gallery page.
 */

oppia.constant('GALLERY_DATA_URL', '/galleryhandler/data');

// Keeps track of the current category and language selections.
oppia.factory('selectionDataService', [function() {
  var currentlySelectedCategories = [];
  var currentlySelectedLanguageCodes = [];

  return {
    getCurrentlySelectedCategories: function() {
      return angular.copy(currentlySelectedCategories);
    },
    getCurrentlySelectedLanguageCodes: function() {
      return angular.copy(currentlySelectedLanguageCodes);
    },
    clearCategories: function() {
      currentlySelectedCategories = [];
    },
    clearLanguageCodes: function() {
      currentlySelectedLanguageCodes = [];
    },
    addCategoriesToSelection: function(newCategories) {
      newCategories.forEach(function(category) {
        if (currentlySelectedCategories.indexOf(category) === -1) {
          currentlySelectedCategories.push(category);
        }
      });
    },
    addLanguageCodesToSelection: function(newLanguageCodes) {
      newLanguageCodes.forEach(function(languageCode) {
        if (currentlySelectedLanguageCodes.indexOf(languageCode) === -1) {
          currentlySelectedLanguageCodes.push(languageCode);
        }
      });
    },
    removeCategoriesFromSelection: function(removedCategories) {
      removedCategories.forEach(function(category) {
        var index = currentlySelectedCategories.indexOf(category);
        if (index !== -1) {
          currentlySelectedCategories.splice(index, 1);
        }
      });
    },
    removeLanguageCodesFromSelection: function(removedLanguageCodes) {
      removedLanguageCodes.forEach(function(languageCode) {
        var index = currentlySelectedLanguageCodes.indexOf(languageCode);
        if (index !== -1) {
          currentlySelectedLanguageCodes.splice(index, 1);
        }
      });
    }
  };
}]);

oppia.controller('Gallery', [
  '$scope', '$http', '$rootScope', '$modal', '$window', '$timeout',
  'ExplorationCreationButtonService', 'oppiaDatetimeFormatter',
  'oppiaDebouncer', 'urlService', 'GALLERY_DATA_URL', 'CATEGORY_LIST',
  'searchService', 'siteAnalyticsService',
  function(
      $scope, $http, $rootScope, $modal, $window, $timeout,
      ExplorationCreationButtonService, oppiaDatetimeFormatter,
      oppiaDebouncer, urlService, GALLERY_DATA_URL, CATEGORY_LIST,
      searchService, siteAnalyticsService) {
    $rootScope.loadingMessage = 'Loading';

    // Below is the width of each tile (width + margins), which can be found
    // in core/templates/dev/head/components/
    //         exploration_summary_tile_directive.html
    var tileDisplayWidth = null;

    // Keeps track of the index of the left-most visible card of each group.
    $scope.leftmostCardIndices = [];

    $http.get('/default_gallery_categories').success(function(data) {
      $scope.galleryGroups = data.activity_summary_dicts_by_category;

      $rootScope.$broadcast(
        'preferredLanguageCodesLoaded', data.preferred_language_codes);

      if (data.username) {
        if (urlService.getUrlParams().mode === 'create') {
          $scope.showCreateExplorationModal(CATEGORY_LIST);
        }
      }

      $rootScope.loadingMessage = '';

      // Pause is necessary to ensure all elements have loaded, same for
      // initCarousels
      $timeout(function() {
        tileDisplayWidth = $('exploration-summary-tile').width();
      }, 20);

      // The following initializes the gallery carousel(s).
      $timeout(initCarousels, 390);

      // The following initializes the tracker to have all
      // elements flush left.
      $scope.leftmostCardIndices = [];
      for (i = 0; i < $scope.galleryGroups.length; i++) {
        $scope.leftmostCardIndices.push(0);
      }
    });

    // If the value below is changed, the following CSS values in oppia.css
    // must be changed:
    // - .oppia-gallery-tiles-carousel: max-width
    // - .oppia-gallery-tiles-container: max-width
    var MAX_NUM_TILES_PER_ROW = 4;
    $scope.tileDisplayCount = 0;

    var initCarousels = function() {
      var windowWidth = $(window).width() * 0.85;
      $scope.tileDisplayCount = Math.min(
        Math.floor(windowWidth / tileDisplayWidth), MAX_NUM_TILES_PER_ROW);

      $('.oppia-gallery-tiles-carousel').css({
        width: ($scope.tileDisplayCount * tileDisplayWidth) + 'px'
      });

      // The following determines whether to enable left scroll after resize.
      for (i = 0; i < $scope.galleryGroups.length; i++) {
        var carouselJQuerySelector = '.oppia-gallery-tiles:eq(n)'.replace(
          'n', i);
        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
        var index = Math.ceil(carouselScrollPositionPx / tileDisplayWidth);
        $scope.leftmostCardIndices[i] = index;
      }
    };

    $scope.scroll = function(ind, isLeftScroll) {
      var carouselJQuerySelector = '.oppia-gallery-tiles:eq(n)'.replace(
        'n', ind);
      var leftOverlaySelector =
        '.oppia-gallery-tiles-carousel-overlay-left:eq(n)'.replace('n', ind);
      var rightOverlaySelector =
        '.oppia-gallery-tiles-carousel-overlay-right:eq(n)'.replace('n', ind);

      var direction = isLeftScroll ? -1 : 1;
      var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();

      // Prevent scrolling if there more carousel pixed widths than
      // there are tile widths.
      if ($scope.galleryGroups[ind].activity_summary_dicts.length <=
          $scope.tileDisplayCount) {
        return;
      }

      carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

      if (isLeftScroll) {
        $scope.leftmostCardIndices[ind] = Math.max(
          0, $scope.leftmostCardIndices[ind] - $scope.tileDisplayCount);
      } else {
        $scope.leftmostCardIndices[ind] = Math.min(
          $scope.galleryGroups[ind].activity_summary_dicts.length -
            $scope.tileDisplayCount + 1,
          $scope.leftmostCardIndices[ind] + $scope.tileDisplayCount);
      }

      var newScrollPositionPx = carouselScrollPositionPx +
        ($scope.tileDisplayCount * tileDisplayWidth * direction);
      $(carouselJQuerySelector).animate({
        scrollLeft: newScrollPositionPx
      }, {
        duration: 800,
        queue: false
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

    $(window).resize(function() {
      initCarousels();
      // This is needed, otherwise $scope.tileDisplayCount takes a long time
      // (several seconds) to update.
      $scope.$apply();
    });

    $window.addEventListener('scroll', function() {
      var oppiaBanner = $('.oppia-gallery-banner-container');
      var oppiaTagline = $('.oppia-gallery-banner-tagline');
      var bannerVanishRate = oppiaBanner.height();
      var taglineVanishRate = oppiaBanner.height() * 0.3;

      oppiaBanner.css({
        opacity: (bannerVanishRate - $(window).scrollTop()) / bannerVanishRate
      });
      oppiaTagline.css({
        opacity: (taglineVanishRate - $(window).scrollTop()) / taglineVanishRate
      });
    });

    $scope.showCreateExplorationModal = function() {
      ExplorationCreationButtonService.showCreateExplorationModal(
        CATEGORY_LIST);
    };

    $scope.allExplorationsInOrder = [];

    // Called when the page loads, and after every search query.
    var _refreshGalleryData = function(data, hasPageFinishedLoading) {
      $scope.searchIsLoading = false;
      $scope.allExplorationsInOrder = data.explorations_list;
      $scope.finishedLoadingPage = hasPageFinishedLoading;
      $rootScope.loadingMessage = '';
    };

    $scope.pageLoaderIsBusy = false;

    $scope.$on(
      'refreshGalleryData',
      function(evt, data, hasPageFinishedLoading) {
        _refreshGalleryData(data, hasPageFinishedLoading);
      }
    );

    $scope.onRedirectToLogin = function(destinationUrl) {
      siteAnalyticsService.registerStartLoginEvent('noSearchResults');
      $timeout(function() {
        $window.location = destinationUrl;
      }, 150);
      return false;
    };
  }
]);
