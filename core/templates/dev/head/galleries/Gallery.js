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

// Overwrite the default ui-bootstrap carousel template to remove the
// on-mouseover behaviour, as well as the left and right arrows.
angular.module('template/carousel/carousel.html', []).run([
    '$templateCache', function($templateCache) {
  $templateCache.put('template/carousel/carousel.html',
    '<div class=\"carousel\" ng-swipe-right=\"prev()\" ' +
    '     ng-swipe-left=\"next()\">\n' +
    '  <ol class=\"carousel-indicators\" ng-show=\"slides.length > 1\">\n' +
    '    <li ng-repeat=\"slide in slides track by $index\" ' +
    '        ng-class=\"{active: isActive(slide)}\" ' +
    '        ng-click=\"select(slide)\"></li>\n' +
    '  </ol>\n' +
    '  <div class=\"carousel-inner\" ng-transclude></div>\n' +
    '</div>\n');
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

    $scope.CAROUSEL_INTERVAL = 3500;
    $scope.CAROUSEL_SLIDES = GLOBALS.CAROUSEL_SLIDES_CONFIG || [];

    // Preload images, otherwise they will only start showing up some time after
    // the carousel slide comes into view. See:
    //
    //     http://stackoverflow.com/q/1373142
    for (var i = 0; i < $scope.CAROUSEL_SLIDES.length; i++) {
      var pic = new Image();
      pic.src = '/images/splash/' + $scope.CAROUSEL_SLIDES[i].image_filename;
    }

    $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $rootScope.loadingMessage = 'Loading';

    $scope.showCreateExplorationModal = function() {
      ExplorationCreationButtonService.showCreateExplorationModal(
        CATEGORY_LIST);
    };

    $scope.currentUserIsModerator = false;

    $scope.inSplashMode = ($scope.CAROUSEL_SLIDES.length > 0);
    $scope.$on('hasChangedSearchQuery', function() {
      if ($scope.inSplashMode) {
        $('.oppia-gallery-container').fadeOut(function() {
          $scope.inSplashMode = false;
          $timeout(function() {
            $('.oppia-gallery-container').fadeIn();
          }, 50);
        });
      }
    });

    $scope.allExplorationsInOrder = [];

    // Called when the page loads, and after every search query.
    var _refreshGalleryData = function(data, hasPageFinishedLoading) {
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

    // Retrieves gallery data from the server.
    $http.get(GALLERY_DATA_URL).then(function(response) {
      $scope.currentUserIsModerator = Boolean(response.data.is_moderator);

      // Note that this will cause an initial search query to be sent.
      $rootScope.$broadcast(
        'preferredLanguageCodesLoaded', response.data.preferred_language_codes);

      if (response.data.username) {
        if (urlService.getUrlParams().mode === 'create') {
          $scope.showCreateExplorationModal(CATEGORY_LIST);
        }
      }
    });

    $scope.onRedirectToLogin = function(destinationUrl) {
      siteAnalyticsService.registerStartLoginEvent('noSearchResults');
      $timeout(function() {
        $window.location = destinationUrl;
      }, 150);
      return false;
    };
  }
]);
