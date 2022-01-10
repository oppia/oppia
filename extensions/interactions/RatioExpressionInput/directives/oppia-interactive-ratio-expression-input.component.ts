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
 * @fileoverview Directive for the RatioExpressionInput interaction.
 */

import { Ratio } from 'domain/objects/ratio.model';

require(
  'interactions/interaction-attributes-extractor.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/RatioExpressionInput/directives/' +
  'ratio-expression-input-rules.service.ts');
require('services/html-escaper.service.ts');

require('domain/objects/objects-domain.constants.ajs.ts');

angular.module('oppia').component('oppiaInteractiveRatioExpressionInput', {
  template: require('./ratio-expression-input-interaction.component.html'),
  bindings: {
    savedSolution: '<'
  },
  controller: [
    '$attrs', '$scope', 'CurrentInteractionService',
    'InteractionAttributesExtractorService',
    'RatioExpressionInputRulesService',
    function(
        $attrs, $scope, CurrentInteractionService,
        InteractionAttributesExtractorService,
        RatioExpressionInputRulesService) {
      var ctrl = this;
      var errorMessage = '';
      // Label for errors caused whilst parsing ratio expression.
      var FORM_ERROR_TYPE = 'RATIO_EXPRESSION_INPUT_FORMAT_ERROR';
      ctrl.getWarningText = function() {
        return errorMessage;
      };

      ctrl.submitAnswer = function(answer) {
        try {
          var ratioExpression =
            Ratio.fromRawInputString(answer);
          if (
            (
              ratioExpression.getNumberOfTerms() !==
              ctrl.expectedNumberOfTerms) && (ctrl.expectedNumberOfTerms !== 0)
          ) {
            throw new Error(
              'The creator has specified the number of terms in' +
              ' the answer to be ' + ctrl.expectedNumberOfTerms + '.');
          }
          errorMessage = '';
          ctrl.RatioExpressionInputForm.answer.$setValidity(
            FORM_ERROR_TYPE, true);
          CurrentInteractionService.onSubmit(
            ratioExpression.getComponents(),
            RatioExpressionInputRulesService);
        } catch (parsingError) {
          errorMessage = parsingError.message;
          ctrl.RatioExpressionInputForm.answer.$setValidity(
            FORM_ERROR_TYPE, false);
        }
      };

      ctrl.isAnswerValid = function() {
        if (
          ctrl.RatioExpressionInputForm === undefined ||
          ctrl.RatioExpressionInputForm.answer === undefined
        ) {
          return true;
        }
        return (
          !ctrl.RatioExpressionInputForm.answer.$invalid && ctrl.answer !== '');
      };

      var submitAnswerFn = function() {
        ctrl.submitAnswer(ctrl.answer);
      };

      ctrl.$onInit = function() {
        $scope.$watch('$ctrl.answer', function(newValue) {
          errorMessage = '';
          ctrl.RatioExpressionInputForm.answer.$setValidity(
            FORM_ERROR_TYPE, true);
        });
        if (ctrl.savedSolution !== undefined) {
          let savedSolution = ctrl.savedSolution;
          savedSolution = Ratio.fromList(
            savedSolution).toAnswerString();
          ctrl.answer = savedSolution;
        } else {
          ctrl.answer = '';
        }
        ctrl.labelForFocusTarget = $attrs.labelForFocusTarget || null;
        var {
          placeholder,
          numberOfTerms
        } = InteractionAttributesExtractorService.getValuesFromAttributes(
          'RatioExpressionInput',
          $attrs
        );
        ctrl.placeholder = placeholder.unicode;
        ctrl.expectedNumberOfTerms = numberOfTerms;
        ctrl.RATIO_EXPRESSION_INPUT_FORM_SCHEMA = {
          type: 'unicode',
          ui_config: {}
        };

        CurrentInteractionService.registerCurrentInteraction(
          submitAnswerFn, ctrl.isAnswerValid);
      };
    }
  ]
});
