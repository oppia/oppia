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
 * @fileoverview Unit tests for CurrentInteractionService.
 */

describe('Current Interaction Service', function() {
  beforeEach(module('oppia'));

  var DUMMY_ANSWER = 'dummy_answer';

  var CurrentInteractionService;
  beforeEach(inject(function($injector) {
    CurrentInteractionService = $injector.get('CurrentInteractionService');
  }));

  it('should properly register onSubmitFn and submitAnswerFn', function() {
    var answerState = null;
    var dummyOnSubmitFn = function(answer, interactionRulesService) {
      answerState = answer;
    };

    CurrentInteractionService.setOnSubmitFn(dummyOnSubmitFn);
    CurrentInteractionService.onSubmit(DUMMY_ANSWER, null);
    expect(answerState).toEqual(DUMMY_ANSWER);

    answerState = null;
    var dummySubmitAnswerFn = function() {
      CurrentInteractionService.onSubmit(DUMMY_ANSWER, null);
    };
    CurrentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn, null);
    CurrentInteractionService.submitAnswer();
    expect(answerState).toEqual(DUMMY_ANSWER);
  });

  it('should properly register validityCheckFn', function() {
    var dummyValidityCheckFn = function() {
      return false;
    };
    CurrentInteractionService.registerCurrentInteraction(
      null, dummyValidityCheckFn);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(
      !dummyValidityCheckFn());
  });

  it('should handle case where validityCheckFn is null', function() {
    CurrentInteractionService.registerCurrentInteraction(null, null);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(false);
  });

  it('should properly register and clear presubmit hooks', function() {
    var hookStateA = 0;
    var hookStateB = 1;
    var hookA = function() {
      hookStateA = hookStateA + 1;
    };
    var hookB = function() {
      hookStateB = hookStateB * 3;
    };

    CurrentInteractionService.registerPresubmitHook(hookA);
    CurrentInteractionService.registerPresubmitHook(hookB);

    CurrentInteractionService.setOnSubmitFn(function() {});
    CurrentInteractionService.onSubmit(null, null);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);

    CurrentInteractionService.clearPresubmitHooks();
    CurrentInteractionService.onSubmit(null, null);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);
  });
});
