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
 * @fileoverview Directive for showing author/share footer
 * in collection player.
 */

oppia.directive('collectionFooter', [function() {
  return {
    restrict: 'E',
    scope: {
      twitterText: '@'
    },
    templateUrl: 'components/collectionFooter',
    controller: [
      '$scope', 'UrlInterpolationService',
      function($scope, UrlInterpolationService) {
        $scope.collectionId = GLOBALS.collectionId;

        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

        $scope.getTwitterText = function() {
          return $scope.twitterText;
        };
      }
    ]
  };
}]);
