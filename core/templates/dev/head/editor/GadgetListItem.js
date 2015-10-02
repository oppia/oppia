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
 * @fileoverview Directive for gadget list item.
 *
 * @author anuzis@google.com (Michael Anuzis)
 */

 oppia.directive('oppiaGadgetListItem', function() {
  return {
    restrict: 'E',
    scope: {
      gadgetType: '&',
      gadgetName: '&'
    },
    templateUrl: 'editor/gadgetListItem',
    controller: [
        '$scope', '$filter', function($scope, $filter) {

      $scope.gadgetListItemHtml = function() {
        if ($scope.gadgetType() == $scope.gadgetName()) {
          return $scope.gadgetName();
        } else {
          return $scope.gadgetType() + ' (' + $scope.gadgetName() + ')';
        }
      };

    }]
  };
});
