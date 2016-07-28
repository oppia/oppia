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
 * Directive for the ScoreBar gadget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaGadgetScoreBar', [
  'oppiaHtmlEscaper', 'LearnerParamsService',
  function(oppiaHtmlEscaper, LearnerParamsService) {
    return {
      restrict: 'E',
      templateUrl: 'gadget/ScoreBar',
      controller: ['$scope', '$attrs', 'UrlInterpolationService',
      function($scope, $attrs, UrlInterpolationService) {
        $scope.getStaticResourceUrl = (
          UrlInterpolationService.getStaticResourceUrl);
        $scope.scoreBarLabel = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.gadgetName);
        $scope.maxValue = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.maxValueWithValue);
        $scope.scoreBarParamName = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.paramNameWithValue);

        // Returns the closest number to `value` in the range [bound1, bound2]
        var clamp = function(value, bound1, bound2) {
          var minValue = Math.min(bound1, bound2);
          var maxValue = Math.max(bound1, bound2);
          return Math.min(Math.max(value, minValue), maxValue);
        };

        // If a parameter's value exceeds the ScoreBar's maxValue, return
        // maxValue to keep the label text visible.
        $scope.getScoreValue = function() {
          return clamp(
            LearnerParamsService.getValue($scope.scoreBarParamName),
            0,
            $scope.maxValue
          );
        };
      }]
    };
  }
]);
