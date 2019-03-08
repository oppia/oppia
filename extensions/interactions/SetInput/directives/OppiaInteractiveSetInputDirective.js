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
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/SetInput/directives/' +
        'set_input_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', '$translate', 'SetInputRulesService',
        'WindowDimensionsService', 'CurrentInteractionService',
        function(
            $scope, $attrs, $translate, SetInputRulesService,
            WindowDimensionsService, CurrentInteractionService) {
          $scope.schema = {
            type: 'list',
            items: {
              type: 'unicode'
            },
            ui_config: {
              // TODO(mili): Translate this in the HTML.
              add_element_text: $translate.instant(
                'I18N_INTERACTIONS_SET_INPUT_ADD_ITEM')
            }
          };

          // Adds an input field by default
          $scope.answer = [''];

          var hasDuplicates = function(answer) {
            for (var i = 0; i < answer.length; i++) {
              for (var j = 0; j < i; j++) {
                if (angular.equals(answer[i], answer[j])) {
                  return true;
                }
              }
            }
            return false;
          };

          var hasBlankOption = function(answer) {
            return answer.some(function(element) {
              return (element === '');
            });
          };

          $scope.submitAnswer = function(answer) {
            if (hasDuplicates(answer)) {
              $scope.errorMessage = (
                'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR');
            } else {
              $scope.errorMessage = '';
              CurrentInteractionService.onSubmit(
                answer, SetInputRulesService);
            }
          };

          $scope.isAnswerValid = function() {
            return ($scope.answer.length > 0 &&
              !hasBlankOption($scope.answer));
          };

          var submitAnswerFn = function() {
            $scope.submitAnswer($scope.answer);
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, $scope.isAnswerValid);
        }
      ]
    };
  }
]);
