// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the NumberWithUnits interaction.
 */

require(
  'interactions/NumberWithUnits/directives/' +
  'oppia-interactive-number-with-units.component.ts');

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('oppiaInteractiveNumberWithUnits', function() {
  let ctrl = null, $scope = null, $rootScope = null;
  let $q = null;
  let $uibModal = null;
  let numberWithUnitsObjectFactory = null;
  let currentInteractionService = null;
  let mockCurrentInteractionService = {
    onSubmit: function(answer, rulesService) {},
    registerCurrentInteraction: function(submitAnswerFn, isAnswerValid) {
      submitAnswerFn();
      isAnswerValid();
    }
  };
  let mockNumberWithUnitsRulesService = {};
  let mockInteractionAttributesExtractorService = {
    getValuesFromAttributes: function(interactionId, attrs) {
      return attrs;
    }
  };

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'CurrentInteractionService', mockCurrentInteractionService);
    $provide.value(
      'NumberWithUnitsRulesService',
      mockNumberWithUnitsRulesService);
    $provide.value(
      'InteractionAttributesExtractorService',
      mockInteractionAttributesExtractorService);
    $provide.value('$attrs', {
      labelForFocusTarget: 'label'
    });
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $q = $injector.get('$q');
    $uibModal = $injector.get('$uibModal');
    numberWithUnitsObjectFactory =
      $injector.get('NumberWithUnitsObjectFactory');
    currentInteractionService = $injector.get('CurrentInteractionService');
    ctrl = $componentController('oppiaInteractiveNumberWithUnits');
    ctrl.NumberWithUnitsForm = {
      answer: {
        $invalid: false,
        $setValidity: function(errorType, valid) {
          this.$invalid = !valid;
        }
      }
    };
  }));

  it('should initialise component when user adds or plays interaction', () => {
    spyOn(numberWithUnitsObjectFactory, 'createCurrencyUnits');
    spyOn(currentInteractionService, 'registerCurrentInteraction');

    ctrl.$onInit();

    expect(ctrl.answer).toBe('');
    expect(ctrl.labelForFocusTarget).toBe('label');
    expect(ctrl.NUMBER_WITH_UNITS_FORM_SCHEMA).toEqual({
      type: 'unicode',
      ui_config: {}
    });
    expect(numberWithUnitsObjectFactory.createCurrencyUnits).toHaveBeenCalled();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should not display warning when the answer format is correct', () => {
    ctrl.$onInit();

    expect(ctrl.getWarningText()).toBe('');

    ctrl.answer = '24 km';
    $scope.$apply();

    expect(ctrl.getWarningText()).toBe('');
  });

  it('should display warning when the answer format is incorrect', () => {
    ctrl.$onInit();

    expect(ctrl.getWarningText()).toBe('');

    ctrl.answer = '24 k';
    $scope.$apply();

    expect(ctrl.getWarningText()).toBe('Unit "k" not found.');
  });

  it('should close help modal when user clicks the \'close\' button', () =>{
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject('close')
    });

    ctrl.showHelp();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should display help modal when user clicks the \'help\' button', () =>{
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve('confirm')
    });

    ctrl.showHelp();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should return true if the answer is valid', () => {
    ctrl.NumberWithUnitsForm = undefined;

    expect(ctrl.isAnswerValid()).toBeTrue();
  });

  it('should return false if the answer is invalid', () => {
    ctrl.answer = '';
    ctrl.NumberWithUnitsForm.answer.$setValidity(
      'NUMBER_WITH_UNITS_FORMAT_ERROR', false);

    expect(ctrl.isAnswerValid()).toBeFalse();
  });

  it('should save solution when user saves solution', () => {
    ctrl.savedSolution = {
      type: 'real',
      real: 24,
      fraction: {
        isNegative: false,
        wholeNumber: 0,
        numerator: 0,
        denominator: 1
      },
      units: [
        {
          unit: 'km',
          exponent: 1
        }
      ]
    };

    ctrl.answer = '';

    ctrl.$onInit();

    expect(ctrl.answer).toBe('24 km');
  });

  it('should show error when user submits answer in incorrect format', () => {
    expect(ctrl.getWarningText()).toBe('');

    ctrl.submitAnswer('24 k');

    expect(ctrl.getWarningText()).toBe('Unit "k" not found.');
  });
});
