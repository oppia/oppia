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
 * @fileoverview Directive for showing search results.
 */

require(
  'pages/library-page/search-results/' +
  'activity-tiles-infinity-grid.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');

angular.module('oppia').directive('searchResults', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library-page/search-results/search-results.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$q', '$timeout', '$window', 'LoaderService',
        'SiteAnalyticsService', 'UserService',
        function($scope, $q, $timeout, $window, LoaderService,
            SiteAnalyticsService, UserService) {
          var ctrl = this;

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          ctrl.onRedirectToLogin = function(destinationUrl) {
            SiteAnalyticsService.registerStartLoginEvent('noSearchResults');
            $timeout(function() {
              $window.location = destinationUrl;
            }, 150);
            return false;
          };
          ctrl.$onInit = function() {
            ctrl.someResultsExist = true;

            ctrl.userIsLoggedIn = null;
            LoaderService.showLoadingScreen('Loading');
            var userInfoPromise = UserService.getUserInfoAsync();
            userInfoPromise.then(function(userInfo) {
              ctrl.userIsLoggedIn = userInfo.isLoggedIn();
            });

            // Called when the first batch of search results is retrieved from
            // the server.
            var searchResultsPromise = $scope.$on(
              'initialSearchResultsLoaded', function(evt, activityList) {
                ctrl.someResultsExist = activityList.length > 0;
              }
            );

            $q.all([userInfoPromise, searchResultsPromise]).then(function() {
              LoaderService.hideLoadingScreen();
            });
          };
        }
      ]
    };
  }]);
