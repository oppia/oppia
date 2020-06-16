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
 * @fileoverview Unit tests for the AlgebraicExpressionInput interactive
 * component.
 */

require(
  'interactions/AlgebraicExpressionInput/directives/' +
  'algebraic-expression-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');

require('./oppia-interactive-algebraic-expression-input.component.ts');

describe('AlgebraicExpressionInputInteractive', function() {
  var ctrl = null;
  var mockCurrentInteractionService = {
    onSubmit: function(answer, rulesService) {},
    registerCurrentInteraction: function(submitAnswerFn, validateAnswerFn) {
      submitAnswerFn();
    }
  };
  var mockAlgebraicExpressionInputRulesService = {};

  class MockGuppy {
    constructor(id: string, config: Object) {}

    event(name: string, handler: Function): void {
      handler();
    }
    asciimath() {
      return 'Dummy value';
    }
    render(): void {}
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('CurrentInteractionService',
      mockCurrentInteractionService);
    $provide.value('AlgebraicExpressionInputRulesService',
      mockAlgebraicExpressionInputRulesService);
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('oppiaInteractiveAlgebraicExpressionInput');
    (<any>window).Guppy = MockGuppy;
  }));

  it('should assign a random id to the guppy divs', function() {
    var mockDocument = document.createElement('div');
    mockDocument.setAttribute('class', 'guppy-div-learner');
    angular.element(document).find('body').append(mockDocument.outerHTML);

    ctrl.$onInit();

    var guppyDivs = document.querySelectorAll('.guppy-div-learner');
    for (var i = 0; i < guppyDivs.length; i++) {
      expect(guppyDivs[i].getAttribute('id')).toMatch(/guppy_[0-9]{1,8}/);
    }
  });

  it('should not submit the answer if invalid', function() {
    ctrl.hasBeenTouched = true;
    // Invalid answer.
    ctrl.value = 'x/';

    spyOn(mockCurrentInteractionService, 'onSubmit');
    ctrl.submitAnswer();
    expect(mockCurrentInteractionService.onSubmit).not.toHaveBeenCalled();
  });

  it('should correctly validate current answer', function() {
    // This should be validated as true if the editor hasn't been touched.
    ctrl.value = '';
    expect(ctrl.isCurrentAnswerValid()).toBeTrue();
    expect(ctrl.warningText).toBe('');

    ctrl.hasBeenTouched = true;
    // This should be validated as false if the editor has been touched.
    ctrl.value = '';
    expect(ctrl.isCurrentAnswerValid()).toBeFalse();
    expect(ctrl.warningText).toBe('Please enter a non-empty answer.');

    ctrl.value = 'a/';
    expect(ctrl.isCurrentAnswerValid()).toBeFalse();
    expect(ctrl.warningText).toBe('/ is not a valid postfix operator.');

    ctrl.value = '12+sqrt(4)';
    expect(ctrl.isCurrentAnswerValid()).toBeFalse();
    expect(ctrl.warningText).toBe(
      'It looks like you have entered only numbers. Make sure to include' +
      ' the necessary variables mentioned in the question.');

    ctrl.value = 'x-y=0';
    expect(ctrl.isCurrentAnswerValid()).toBeFalse();
    expect(ctrl.warningText).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an algebraic expression instead.');
  });
});
