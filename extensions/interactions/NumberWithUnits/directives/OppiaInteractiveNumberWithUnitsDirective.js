// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * Directive for the NumberWithUnits interaction.
 */

oppia.directive('oppiaInteractiveNumberWithUnits', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/NumberWithUnits/directives/' +
        'number_with_units_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', '$uibModal', 'NumberWithUnitsObjectFactory',
        'NumberWithUnitsRulesService', 'NUMBER_WITH_UNITS_PARSING_ERRORS',
        'CurrentInteractionService', function(
            $scope, $attrs, $uibModal, NumberWithUnitsObjectFactory,
            NumberWithUnitsRulesService, NUMBER_WITH_UNITS_PARSING_ERRORS,
            CurrentInteractionService) {
          $scope.answer = '';
          $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;

          var errorMessage = '';
          // Label for errors caused whilst parsing number with units.
          var FORM_ERROR_TYPE = 'NUMBER_WITH_UNITS_FORMAT_ERROR';
          $scope.NUMBER_WITH_UNITS_FORM_SCHEMA = {
            type: 'unicode',
            ui_config: {}
          };

          $scope.getWarningText = function() {
            return errorMessage;
          };

          try {
            NumberWithUnitsObjectFactory.createCurrencyUnits();
          } catch (parsingError) {}

          $scope.$watch('answer', function(newValue) {
            try {
              var numberWithUnits =
                NumberWithUnitsObjectFactory.fromRawInputString(newValue);
              errorMessage = '';
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, true);
            } catch (parsingError) {
              errorMessage = parsingError.message;
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          });

          $scope.submitAnswer = function(answer) {
            try {
              var numberWithUnits =
                NumberWithUnitsObjectFactory.fromRawInputString(answer);
              CurrentInteractionService.onSubmit(
                numberWithUnits, NumberWithUnitsRulesService);
            } catch (parsingError) {
              errorMessage = parsingError.message;
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          };

          $scope.isAnswerValid = function() {
            if ($scope.NumberWithUnitsForm === undefined) {
              return true;
            }
            return (!$scope.NumberWithUnitsForm.$invalid &&
              $scope.answer !== '');
          };

          var submitAnswerFn = function() {
            $scope.submitAnswer($scope.answer);
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, $scope.isAnswerValid);

          $scope.showHelp = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/NumberWithUnits/directives/' +
                'number_with_units_help_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.close = function() {
                    $uibModalInstance.close();
                  };
                }
              ]
            }).result.then(function() {});
          };
        }]
    };
  }
]);
