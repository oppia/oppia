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
 * Directive for the SetInput interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveSetInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/SetInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = [];

        $scope.addElement = function(newElement) {
          if (newElement !== 0 && !newElement) {
            return;
          }
          $scope.answer.push(newElement);
          $scope.newElement = '';
          $scope.$parent.$parent.adjustPageHeight(false);
        };

        $scope.deleteElement = function(index) {
          $scope.answer.splice(index, 1);
        };

        $scope.submitAnswer = function(answer) {
          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }]
    };
  }
]);
