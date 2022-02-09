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
 * @fileoverview Com,ponent for the NumberWithUnits interaction.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('domain/objects/NumberWithUnitsObjectFactory.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/NumberWithUnits/directives/' +
  'number-with-units-rules.service.ts');
require('services/html-escaper.service.ts');

require('domain/objects/objects-domain.constants.ajs.ts');

angular.module('oppia').component('oppiaInteractiveNumberWithUnits', {
  bindings: {
    savedSolution: '<'
  },
  template: require('./number-with-units-interaction.component.html'),
  controllerAs: '$ctrl',
  controller: [
    '$attrs', '$scope', '$uibModal', 'CurrentInteractionService',
    'NumberWithUnitsObjectFactory', 'NumberWithUnitsRulesService',
    function(
        $attrs, $scope, $uibModal, CurrentInteractionService,
        NumberWithUnitsObjectFactory, NumberWithUnitsRulesService) {
      var ctrl = this;
      var errorMessage = '';
      // Label for errors caused whilst parsing number with units.
      var FORM_ERROR_TYPE = 'NUMBER_WITH_UNITS_FORMAT_ERROR';
      ctrl.getWarningText = function() {
        return errorMessage;
      };

      ctrl.submitAnswer = function(answer) {
        try {
          var numberWithUnits = (
            NumberWithUnitsObjectFactory.fromRawInputString(answer));
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
        return (
          !ctrl.NumberWithUnitsForm.$invalid && ctrl.answer !== '');
      };

      var submitAnswerFn = function() {
        ctrl.submitAnswer(ctrl.answer);
      };
      ctrl.showHelp = function() {
        $uibModal.open({
          template: require(
            './number-with-units-help-modal.directive.html'),
          backdrop: true,
          controller: 'ConfirmOrCancelModalController'
        }).result.then(function() {}, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };
      ctrl.$onInit = function() {
        $scope.$watch('$ctrl.answer', function(newValue) {
          try {
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
        if (ctrl.savedSolution !== undefined) {
          let savedSolution = ctrl.savedSolution;
          savedSolution = NumberWithUnitsObjectFactory.fromDict(
            savedSolution).toString();
          ctrl.answer = savedSolution;
        } else {
          ctrl.answer = '';
        }
        ctrl.labelForFocusTarget = $attrs.labelForFocusTarget || null;

        ctrl.NUMBER_WITH_UNITS_FORM_SCHEMA = {
          type: 'unicode',
          ui_config: {}
        };

        try {
          NumberWithUnitsObjectFactory.createCurrencyUnits();
        } catch (parsingError) {}

        CurrentInteractionService.registerCurrentInteraction(
          submitAnswerFn, ctrl.isAnswerValid);
      };
    }
  ]
});
