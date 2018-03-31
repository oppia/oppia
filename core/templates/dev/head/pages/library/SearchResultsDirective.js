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

oppia.directive('searchResults', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library/search_results_directive.html'),
      controller: [
        '$scope', '$rootScope', '$timeout', '$window', 'siteAnalyticsService',
        function($scope, $rootScope, $timeout, $window, siteAnalyticsService) {
          $rootScope.loadingMessage = 'Loading';
          $scope.someResultsExist = true;
          $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;

          // Called when the first batch of search results is retrieved from the
          // server.
          $scope.$on(
            'initialSearchResultsLoaded', function(evt, activityList) {
              $scope.someResultsExist = activityList.length > 0;
              $rootScope.loadingMessage = '';
            }
          );

          $scope.onRedirectToLogin = function(destinationUrl) {
            siteAnalyticsService.registerStartLoginEvent('noSearchResults');
            $timeout(function() {
              $window.location = destinationUrl;
            }, 150);
            return false;
          };

          $scope.noExplorationsImgUrl =
           UrlInterpolationService.getStaticImageUrl(
             '/general/no_explorations_found.png');
        }
      ]
    };
  }]);
