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
 * @fileoverview Directive for displaying the collection's owner name and
 * permissions.
 */

oppia.directive('collectionPermissionsCard', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/collection_permissions_card_directive',
    controller: [
      '$scope',
      function($scope) {
        $scope.ownerNames = GLOBALS.ownerNames;
        $scope.isPrivate = GLOBALS.isPrivate;
      }
    ]
  };
}]);
