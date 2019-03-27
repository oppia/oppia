// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for form overlay.
 */

oppia.directive('formOverlay', [
  'NestedDirectivesRecursionTimeoutPreventionService',
  'UrlInterpolationService',
  function(
      NestedDirectivesRecursionTimeoutPreventionService,
      UrlInterpolationService) {
    return {
      scope: {
        definition: '=',
        isDisabled: '&',
        savedValue: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/tests/form_entry_point_modal_directive.html'),
      restrict: 'E',
      compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
      controller: ['$scope', function($scope) {
        $scope.$watch('savedValue', function() {
          $scope.localValue = angular.copy($scope.savedValue);
        });

        $scope.submitValue = function() {
          $scope.savedValue = angular.copy($scope.localValue);
          alert($scope.savedValue);
        };
        $scope.cancelEdit = function() {
          $scope.localValue = angular.copy($scope.savedValue);
        };
      }]
    };
  }
]);
