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
 * @fileoverview MobileFriendlyTooltip Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

oppia.directive('mobileFriendlyTooltip', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    scope: {},
    controller: ['$scope', 'DeviceInfoService', function(
        $scope, DeviceInfoService) {
      $scope.opened = false;
      $scope.deviceHasTouchEvents = DeviceInfoService.hasTouchEvents();
    }],
    link: function(scope, element) {
      var TIME_TOOLTIP_CLOSE_DELAY_MOBILE = 1000;

      if (scope.deviceHasTouchEvents) {
        element.on('touchstart', function() {
          scope.opened = true;
          scope.$apply();
        });
        element.on('touchend', function() {
          // Set time delay before tooltip close
          $timeout(function() {
            scope.opened = false;
          }, TIME_TOOLTIP_CLOSE_DELAY_MOBILE);
        });
      } else {
        element.on('mouseenter', function() {
          scope.opened = true;
          scope.$apply();
        });

        element.on('mouseleave', function() {
          scope.opened = false;
          scope.$apply();
        });
      }
    }
  };
}]);
