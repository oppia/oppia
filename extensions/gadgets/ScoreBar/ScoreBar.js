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
  'oppiaHtmlEscaper', 'learnerParamsService', function(oppiaHtmlEscaper, learnerParamsService) {

    // Gadget height and width in pixels.
    var _HEIGHT = 100;
    var _WIDTH = 250;

    return {
      restrict: 'E',
      templateUrl: 'gadget/ScoreBar',
      controller: ['$scope', '$attrs', function ($scope, $attrs) {

        $scope.maxValue = oppiaHtmlEscaper.escapedJsonToObj($attrs.maxValueWithValue);
        $scope.scoreBarTitle = oppiaHtmlEscaper.escapedJsonToObj($attrs.titleWithValue);
        $scope.scoreBarParamName = oppiaHtmlEscaper.escapedJsonToObj($attrs.paramNameWithValue);

        // @sll: How do we surface available learnerParamsService in a
        // pulldown menu in the gadget editor view? We looked at how to do
        // this in gadget_editor.html, but when we got into the details
        // the only simple option appeared to be adding 1-off code specific to
        // ScoreBars in gadget_editor.html.
        //
        // We considered rolling an entirely new custom html-binding method
        // where any gadget can specify inputs it requires based on dynamic
        // values in Angular services, but that seemed too complex to
        // include in this already-big commit.  Is there a simple solution
        // we're missing?

        $scope.getWarnings = function() {
          var params = learnerParamsService.getAllParams()
          if ($scope.scoreBarParamName in params) {
            return '';
          } else {
            var validationError = $scope.scoreBarParamName + ' is not yet ' +
            'created as a parameter. Please create the parameter first.';
            return validationError;
          }
        }

        $scope.getHeight = function() {
          return _HEIGHT;
        }

        $scope.getWidth = function () {
          return _WIDTH;
        }

        $scope.getScoreValue = function() {
          return learnerParamsService.getValue($scope.scoreBarParamName);
        }
      }],
    }
  }
]);
