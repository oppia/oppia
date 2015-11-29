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
 * Directive for the SetInput interaction.
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
      templateUrl: 'interaction/SetInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.schema = {
          type: 'list',
          items: {
            type: 'unicode'
          },
          ui_config: {
            // TODO(mili): Translate this in the html
            add_element_text: $translate.instant('I18N_INTERACTIONS_SET_INPUT_ADD_ITEM')
          }
        };

        $scope.answer = [];

        var hasDuplicates = function(answer) {
          for (var i = 0; i < answer.length; i++) {
            for (var j = 0; j < i; j++) {
              if (angular.equals(answer[i], answer[j], true)) {
                return true;
              }
            }
          }
          return false;
        }

        $scope.submitAnswer = function(answer) {
          if (hasDuplicates(answer)) {
            $scope.errorMessage = (
              'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR');
          } else {
            $scope.errorMessage = '';
            $scope.$parent.$parent.submitAnswer(answer);
          }
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseSetInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/SetInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseSetInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/SetInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        $scope.displayedAnswer = (
          _answer.length > 0 ? _answer.join(', ') :
          'I18N_INTERACTIONS_SET_INPUT_NO_ANSWER');
      }]
    };
  }
]);
