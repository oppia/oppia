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
 * @fileoverview Directive for the NumberWithUnits interaction.
 */

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/NumberWithUnits/directives/NumberWithUnitsRulesService.ts');
require('services/HtmlEscaperService.ts');

angular.module('oppia').directive('oppiaInteractiveNumberWithUnits', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/NumberWithUnits/directives/' +
        'number_with_units_interaction_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$attrs', '$uibModal', 'NumberWithUnitsObjectFactory',
        'NumberWithUnitsRulesService', 'NUMBER_WITH_UNITS_PARSING_ERRORS',
        'CurrentInteractionService', function(
            $scope, $attrs, $uibModal, NumberWithUnitsObjectFactory,
            NumberWithUnitsRulesService, NUMBER_WITH_UNITS_PARSING_ERRORS,
            CurrentInteractionService) {
          var ctrl = this;
          ctrl.answer = '';
          ctrl.labelForFocusTarget = $attrs.labelForFocusTarget || null;

          var errorMessage = '';
          // Label for errors caused whilst parsing number with units.
          var FORM_ERROR_TYPE = 'NUMBER_WITH_UNITS_FORMAT_ERROR';
          ctrl.NUMBER_WITH_UNITS_FORM_SCHEMA = {
            type: 'unicode',
            ui_config: {}
          };

          ctrl.getWarningText = function() {
            return errorMessage;
          };

          try {
            NumberWithUnitsObjectFactory.createCurrencyUnits();
          } catch (parsingError) {}

          $scope.$watch('$ctrl.answer', function(newValue) {
            try {
              var numberWithUnits =
                NumberWithUnitsObjectFactory.fromRawInputString(newValue);
              errorMessage = '';
              ctrl.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, true);
            } catch (parsingError) {
              errorMessage = parsingError.message;
              ctrl.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          });

          ctrl.submitAnswer = function(answer) {
            try {
              var numberWithUnits =
                NumberWithUnitsObjectFactory.fromRawInputString(answer);
              CurrentInteractionService.onSubmit(
                numberWithUnits, NumberWithUnitsRulesService);
            } catch (parsingError) {
              errorMessage = parsingError.message;
              ctrl.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          };

          ctrl.isAnswerValid = function() {
            if (ctrl.NumberWithUnitsForm === undefined) {
              return true;
            }
            return (!ctrl.NumberWithUnitsForm.$invalid &&
              ctrl.answer !== '');
          };

          var submitAnswerFn = function() {
            ctrl.submitAnswer(ctrl.answer);
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, ctrl.isAnswerValid);

          ctrl.showHelp = function() {
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
