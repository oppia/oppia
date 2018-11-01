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
 * @fileoverview Data and controllers for the Oppia splash page.
 */

oppia.controller('Splash', [
  '$scope', '$rootScope', '$timeout', '$window', 'SiteAnalyticsService',
  'UrlInterpolationService', 'UserService',
  function($scope, $rootScope, $timeout, $window, SiteAnalyticsService,
      UrlInterpolationService, UserService) {
    $scope.userIsLoggedIn = null;
    $rootScope.loadingMessage = 'Loading';
    UserService.getUserInfoAsync().then(function(userInfo) {
      $scope.userIsLoggedIn = userInfo.isLoggedIn();
      $rootScope.loadingMessage = '';
    });
    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
    $scope.getStaticSubjectImageUrl = function(subjectName) {
      return UrlInterpolationService.getStaticImageUrl('/subjects/' +
        subjectName + '.svg');
    };

    $scope.onRedirectToLogin = function(destinationUrl) {
      SiteAnalyticsService.registerStartLoginEvent(
        'splashPageCreateExplorationButton');
      $timeout(function() {
        $window.location = destinationUrl;
      }, 150);
      return false;
    };

    $scope.onClickBrowseLibraryButton = function() {
      SiteAnalyticsService.registerClickBrowseLibraryButtonEvent();
      $timeout(function() {
        $window.location = '/library';
      }, 150);
      return false;
    };

    $scope.onClickCreateExplorationButton = function() {
      SiteAnalyticsService.registerClickCreateExplorationButtonEvent();
      $timeout(function() {
        $window.location = '/creator_dashboard?mode=create';
      }, 150);
      return false;
    };
  }
]);
