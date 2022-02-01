// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the RatioExpressionInput interactive
 * component.
 */

import { Ratio } from 'domain/objects/ratio.model';

require(
  'interactions/RatioExpressionInput/directives/' +
  'oppia-interactive-ratio-expression-input.component.ts');

describe('RatioExpressionInputInteractive', function() {
  let ctrl = null, $scope = null, $rootScope = null;
  let mockCurrentInteractionService = {
    onSubmit: function(answer, rulesService) {},
    registerCurrentInteraction: function(submitAnswerFn, isAnswerValid) {
      submitAnswerFn();
    }
  };
  let mockRatioExpressionInputRulesService = {};
  let mockInteractionAttributesExtractorService = {
    getValuesFromAttributes: function(interactionId, attrs) {
      return attrs;
    }
  };

  describe('without saved solution', function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('Ratio', Ratio);
      $provide.value(
        'CurrentInteractionService', mockCurrentInteractionService);
      $provide.value(
        'RatioExpressionInputRulesService',
        mockRatioExpressionInputRulesService);
      $provide.value(
        'InteractionAttributesExtractorService',
        mockInteractionAttributesExtractorService);
      $provide.value('$attrs', {
        placeholder: {
          unicode: 'Enter ratio here'
        },
        numberOfTerms: 3,
        labelForFocusTarget: 'label'
      });
    }));
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      ctrl = $componentController('oppiaInteractiveRatioExpressionInput');
      ctrl.RatioExpressionInputForm = {
        answer: {
          $invalid: false,
          $setValidity: function(errorType, valid) {
            this.$invalid = !valid;
          }
        }
      };
    }));

    it('should init the component', function() {
      spyOn(mockCurrentInteractionService, 'registerCurrentInteraction');
      ctrl.$onInit();
      expect(ctrl.answer).toEqual('');
      expect(ctrl.labelForFocusTarget).toEqual('label');
      expect(ctrl.placeholder).toEqual('Enter ratio here');
      expect(ctrl.expectedNumberOfTerms).toEqual(3);
      expect(ctrl.RATIO_EXPRESSION_INPUT_FORM_SCHEMA).toEqual({
        type: 'unicode',
        ui_config: {}
      });
      expect(ctrl.getWarningTextI18NKey()).toEqual('');
      expect(
        mockCurrentInteractionService.registerCurrentInteraction
      ).toHaveBeenCalled();
    });

    it('should return valid answer before the form is initialized', function() {
      ctrl.RatioExpressionInputForm = undefined;
      expect(ctrl.isAnswerValid()).toBe(true);
    });

    it('should raise error if invalid answer is submitted', function() {
      ctrl.$onInit();
      ctrl.answer = '2:3';
      ctrl.RatioExpressionInputForm.$invalid = false;
      spyOn(mockCurrentInteractionService, 'onSubmit');
      ctrl.submitAnswer(ctrl.answer);
      expect(ctrl.getWarningTextI18NKey()).toEqual(
        'The creator has specified the number of terms in the answer to be 3.');
      expect(mockCurrentInteractionService.onSubmit).not.toHaveBeenCalled();
      expect(ctrl.isAnswerValid()).toBe(false);
    });

    it('should submit the answer if valid', function() {
      ctrl.$onInit();
      ctrl.answer = '2:3:4';
      $scope.$apply();
      spyOn(mockCurrentInteractionService, 'onSubmit');
      ctrl.submitAnswer('2:3:4');
      expect(
        mockCurrentInteractionService.onSubmit).toHaveBeenCalled();
      expect(ctrl.isAnswerValid()).toBe(true);
    });
  });

  describe('with saved solution', function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('Ratio', Ratio);
      $provide.value(
        'CurrentInteractionService', mockCurrentInteractionService);
      $provide.value(
        'RatioExpressionInputRulesService',
        mockRatioExpressionInputRulesService);
      $provide.value(
        'InteractionAttributesExtractorService',
        mockInteractionAttributesExtractorService);
      $provide.value('$attrs', {
        placeholder: {
          unicode: 'Enter ratio here'
        },
        numberOfTerms: 3,
        labelForFocusTarget: 'label',
      });
    }));
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      ctrl = $componentController('oppiaInteractiveRatioExpressionInput');
      ctrl.savedSolution = [1, 2, 3];
      ctrl.RatioExpressionInputForm = {
        answer: {
          $invalid: false,
          $setValidity: function(errorType, valid) {
            this.$invalid = !valid;
          }
        }
      };
    }));

    it('should populate answer with solution if provided', function() {
      ctrl.$onInit();
      expect(ctrl.answer).toEqual('1:2:3');
    });
  });
});
