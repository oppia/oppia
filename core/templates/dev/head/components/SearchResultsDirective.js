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
 * @fileoverview Data and controllers for the Oppia gallery search page.
 */

oppia.directive('searchResults', [function() {
  return {
    restrict: 'E',
    templateUrl: 'components/searchResults',
    controller: [
      '$scope', '$rootScope', function($scope, $rootScope) {
        // Called when the page loads, and after every search query.
        var _refreshGalleryData = function(data, hasPageFinishedLoading) {
          $scope.searchIsLoading = false;
          $scope.allExplorationsInOrder = data.explorations_list;
          $scope.finishedLoadingPage = hasPageFinishedLoading;
          $rootScope.loadingMessage = '';
        };

        $scope.$on(
          'refreshGalleryData',
          function(evt, data, hasPageFinishedLoading) {
            _refreshGalleryData(data, hasPageFinishedLoading);
          }
        );
      }
    ]
  };
}]);
