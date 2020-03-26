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

// TODO(#7222): Remove the following block of unnnecessary imports once
// current-interaction.service.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { EditabilityService } from 'services/editability.service';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateEditorService } from
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/exploration-player-page/services/current-interaction.service.ts');

describe('Current Interaction Service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  // This mock is required since ContextService is used in
  // CurrentInteractionService to obtain the explorationId. So, in the
  // tests also we need to create a mock environment of exploration editor
  // since ContextService will error if it is used outside the context
  // of an exploration.
  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('UrlService', {
        getPathname: function() {
          return '/explore/123';
        }
      });
      $provide.value('AngularNameService', new AngularNameService());
      $provide.value('EditabilityService', new EditabilityService());
      $provide.value('SolutionValidityService', new SolutionValidityService());
      $provide.value(
        'StateEditorService', new StateEditorService(
          new SolutionValidityService()));
      $provide.value('SuggestionModalService', new SuggestionModalService());
      $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    });
  });

  var DUMMY_ANSWER = 'dummy_answer';

  var CurrentInteractionService;
  beforeEach(angular.mock.inject(function($injector) {
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
    var dummySubmitAnswerFn = function() {
      return false;
    };
    CurrentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn, dummyValidityCheckFn);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(
      !dummyValidityCheckFn());
  });

  it('should handle case where validityCheckFn is null', function() {
    var dummySubmitAnswerFn = function() {
      return false;
    };
    CurrentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn, null);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(false);
  });

  it('should handle case where submitAnswerFn is null', function() {
    CurrentInteractionService.registerCurrentInteraction(
      null, null);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(true);
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
