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

import { CurrentInteractionService } from
  'pages/exploration-player-page/services/current-interaction.service.ts';

describe('Current Interaction Service', function() {
  let DUMMY_ANSWER: string = 'dummy_answer';

  let currentInteractionService: CurrentInteractionService;
  beforeEach(() => {
    currentInteractionService = new CurrentInteractionService();
  });

  it('should properly register onSubmitFn and submitAnswerFn', function() {
    var answerState = null;
    var dummyOnSubmitFn = function(answer, interactionRulesService) {
      answerState = answer;
    };

    currentInteractionService.setOnSubmitFn(dummyOnSubmitFn);
    currentInteractionService.onSubmit(DUMMY_ANSWER, null);
    expect(answerState).toEqual(DUMMY_ANSWER);

    answerState = null;
    var dummySubmitAnswerFn = function() {
      currentInteractionService.onSubmit(DUMMY_ANSWER, null);
    };
    currentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn, null);
    currentInteractionService.submitAnswer();
    expect(answerState).toEqual(DUMMY_ANSWER);
  });

  it('should properly register validityCheckFn', function() {
    var dummyValidityCheckFn = function() {
      return false;
    };
    currentInteractionService.registerCurrentInteraction(
      null, dummyValidityCheckFn);
    expect(currentInteractionService.isSubmitButtonDisabled()).toBe(
      !dummyValidityCheckFn());
  });

  it('should handle case where validityCheckFn is null', function() {
    currentInteractionService.registerCurrentInteraction(null, null);
    expect(currentInteractionService.isSubmitButtonDisabled()).toBe(false);
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

    currentInteractionService.registerPresubmitHook(hookA);
    currentInteractionService.registerPresubmitHook(hookB);

    currentInteractionService.setOnSubmitFn(function() {});
    currentInteractionService.onSubmit(null, null);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);

    currentInteractionService.clearPresubmitHooks();
    currentInteractionService.onSubmit(null, null);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);
  });
});
