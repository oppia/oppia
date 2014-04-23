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
 * @fileoverview Data and controllers for the Oppia playtesters' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('playtestGallerySection', [function() {
  return {
    restrict: 'E',
    scope: {
      explorations: '='
    },
    templateUrl: 'playtestGallery/gallerySection',
    controller: ['$scope', 'oppiaDateFormatter', function($scope, oppiaDateFormatter) {
      $scope.getLocaleStringForDate = function(millisSinceEpoch) {
        return oppiaDateFormatter.getLocaleString(millisSinceEpoch);
      };
    }]
  };
}]);

function PlaytestGallery($scope, $http, $rootScope, warningsData) {
  $scope.playtestGalleryDataUrl = '/playtesthandler/data';

  $rootScope.loadingMessage = 'Loading';

  // Retrieves gallery data from the server.
  $http.get($scope.playtestGalleryDataUrl).success(function(data) {
    $scope.publicExplorations = data.public_explorations_list;
    $scope.privateExplorations = data.private_explorations_list;
    $rootScope.loadingMessage = '';
  }).error(function(data) {
    warningsData.addWarning(data.error || 'Error communicating with server.');
  });
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
PlaytestGallery.$inject = [
  '$scope', '$http', '$rootScope', 'warningsData'];
