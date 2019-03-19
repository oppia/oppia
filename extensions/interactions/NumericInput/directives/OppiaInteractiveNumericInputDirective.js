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
 * Directive for the NumericInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveNumericInput', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/NumericInput/directives/' +
        'numeric_input_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', 'FocusManagerService', 'NumericInputRulesService',
        'WindowDimensionsService', 'CurrentInteractionService',
        function(
            $scope, $attrs, FocusManagerService, NumericInputRulesService,
            WindowDimensionsService, CurrentInteractionService) {
          $scope.answer = '';
          $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;

          $scope.NUMERIC_INPUT_FORM_SCHEMA = {
            type: 'float',
            ui_config: {}
          };

          var isAnswerValid = function() {
            return (
              $scope.answer !== undefined &&
              $scope.answer !== null && $scope.answer !== '');
          };

          $scope.submitAnswer = function(answer) {
            if (isAnswerValid()) {
              CurrentInteractionService.onSubmit(
                answer, NumericInputRulesService);
            }
          };

          var submitAnswerFn = function() {
            $scope.submitAnswer($scope.answer);
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, isAnswerValid);
        }
      ]
    };
  }
]);
