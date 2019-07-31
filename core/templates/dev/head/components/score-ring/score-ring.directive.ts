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
 * @fileoverview Directive for the animated score ring.
 */

angular.module('oppia').directive('scoreRing', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getScore: '&score',
        testIsPassed: '&testIsPassed'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/score-ring/score-ring.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', '$timeout', '$window', 'COLORS_FOR_PASS_FAIL_MODE',
        function($scope, $timeout, $window, COLORS_FOR_PASS_FAIL_MODE) {
          var ctrl = this;
          var setScore = function(percent) {
            const offset = circumference - percent / 100 * circumference;
            circle.style.strokeDashoffset = offset;
          };

          const circle = document.querySelector('.score-ring-circle');
          const radius = circle.r.baseVal.value;
          const circumference = radius * 2 * Math.PI;
          circle.style.strokeDasharray = `${circumference} ${circumference}`;
          circle.style.strokeDashoffset = circumference;
          $scope.$watch(function() {
            return ctrl.getScore();
          }, function(newScore) {
            if (newScore && newScore > 0) {
              setScore(newScore);
            }
          });

          ctrl.getScoreRingColor = function() {
            if (ctrl.testIsPassed()) {
              return COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
            } else {
              return COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR;
            }
          };

          ctrl.getScoreOuterRingColor = function() {
            if (ctrl.testIsPassed()) {
              // return color green when passed.
              return COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_OUTER;
            } else {
              // return color orange when failed.
              return COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR_OUTER;
            }
          };
        }
      ]
    };
  }]);
