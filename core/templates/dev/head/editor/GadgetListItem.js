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
      gadgetShortDescription: '&',
      gadgetName: '&'
    },
    templateUrl: 'editor/gadgetListItem',
    controller: [
        '$scope', '$filter', function($scope, $filter) {

      // A gadget list item shows the gadget's short description by default.
      // If a gadget has been renamed or if multiple gadgets of the same type
      // exist the gadget's name is shown in parenthesis following it's
      // description.
      //
      // Examples:
      // 'Score Bar'                    // Gadget with default name
      // 'Score Bar (Current Score)'    // Gadget renamed to 'Current Score'
      $scope.gadgetListItemHtml = function() {
        if ($scope.gadgetShortDescription() == $scope.gadgetName()) {
          return $scope.gadgetShortDescription();
        } else {
          return $scope.gadgetShortDescription() + ' (' + $scope.gadgetName() + ')';
        }
      };

    }]
  };
});
