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

import {TestBed} from '@angular/core/testing';

import {
  CurrentInteractionService,
  OnSubmitFn,
  ValidityCheckFn,
} from 'pages/exploration-player-page/services/current-interaction.service';
import {UrlService} from 'services/contextual/url.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {ContextService} from 'services/context.service';
import {InteractionRulesService} from './answer-classification.service';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {AudioTranslationLanguageService} from './audio-translation-language.service';

describe('Current Interaction Service', () => {
  let urlService: UrlService;
  let currentInteractionService: CurrentInteractionService;
  let contextService: ContextService;
  let DUMMY_ANSWER = 'dummy_answer';
  let playerTranscriptService: PlayerTranscriptService;
  let playerPositionService: PlayerPositionService;
  let interactionRulesService: InteractionRulesService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  const displayedCard = new StateCard(
    '',
    '',
    '',
    {} as Interaction,
    [],
    {} as RecordedVoiceovers,
    '',
    {} as AudioTranslationLanguageService
  );

  // This mock is required since ContextService is used in
  // CurrentInteractionService to obtain the explorationId. So, in the
  // tests also we need to create a mock environment of exploration editor
  // since ContextService will error if it is used outside the context
  // of an exploration.
  beforeEach(() => {
    urlService = TestBed.inject(UrlService);
    spyOn(urlService, 'getPathname').and.callFake(() => {
      return '/explore/123';
    });
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    contextService = TestBed.inject(ContextService);
  });

  it('should properly register onSubmitFn and submitAnswerFn', () => {
    let answerState = null;
    let dummyOnSubmitFn: OnSubmitFn = (answer: Object) => {
      answerState = answer;
    };
    let dummyValidityCheckFn: ValidityCheckFn = () => {
      return false;
    };

    currentInteractionService.setOnSubmitFn(dummyOnSubmitFn);
    currentInteractionService.onSubmit(DUMMY_ANSWER, interactionRulesService);
    expect(answerState).toEqual(DUMMY_ANSWER);

    answerState = null;
    let dummySubmitAnswerFn = () => {
      currentInteractionService.onSubmit(DUMMY_ANSWER, interactionRulesService);
    };
    currentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn,
      dummyValidityCheckFn
    );
    currentInteractionService.submitAnswer();
    expect(answerState).toEqual(DUMMY_ANSWER);
  });

  it('should properly register validityCheckFn', () => {
    let dummyValidityCheckFn = () => {
      return false;
    };
    let dummySubmitAnswerFn = () => {
      return false;
    };
    currentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn,
      dummyValidityCheckFn
    );
    expect(currentInteractionService.isSubmitButtonDisabled()).toBe(
      !dummyValidityCheckFn()
    );
  });

  it('should handle case where validityCheckFn is null', () => {
    let dummySubmitAnswerFn = () => {
      return false;
    };
    currentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn,
      null
    );
    expect(currentInteractionService.isSubmitButtonDisabled()).toBe(false);
  });

  it('should handle case where submitAnswerFn is null', () => {
    currentInteractionService.registerCurrentInteraction(null, null);
    expect(currentInteractionService.isSubmitButtonDisabled()).toBe(true);
  });

  it('should properly register and clear presubmit hooks', () => {
    let hookStateA = 0;
    let hookStateB = 1;
    let hookA = () => {
      hookStateA = hookStateA + 1;
    };
    let hookB = () => {
      hookStateB = hookStateB * 3;
    };

    currentInteractionService.registerPresubmitHook(hookA);
    currentInteractionService.registerPresubmitHook(hookB);

    currentInteractionService.setOnSubmitFn(() => {});
    currentInteractionService.onSubmit(DUMMY_ANSWER, interactionRulesService);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);

    currentInteractionService.clearPresubmitHooks();
    currentInteractionService.onSubmit(DUMMY_ANSWER, interactionRulesService);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);
  });

  it('should throw error on submitting when submitAnswerFn is null', () => {
    let interaction = new Interaction([], [], {}, null, [], null, null);
    let recordedVoiceovers = new RecordedVoiceovers({});
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(1);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(
      StateCard.createNewCard(
        'First State',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        interaction,
        recordedVoiceovers,
        '',
        audioTranslationLanguageService
      )
    );
    spyOn(contextService, 'getExplorationId').and.returnValue('abc');
    spyOn(contextService, 'getPageContext').and.returnValue('learner');

    let additionalInfo =
      '\nUndefined submit answer debug logs:' +
      '\nInteraction ID: null' +
      '\nExploration ID: abc' +
      '\nState Name: First State' +
      '\nContext: learner' +
      '\nErrored at index: 1';

    currentInteractionService.registerCurrentInteraction(null, null);

    expect(() => currentInteractionService.submitAnswer()).toThrowError(
      'The current interaction did not ' +
        'register a _submitAnswerFn.' +
        additionalInfo
    );
  });

  it('should update view with new answer', () => {
    // Here, toBeDefined is used instead of testing with a value
    // because currentInteractionService.onAnswerChanged$ returns
    // observable of answerChangedSubject which is a private static
    // member of the class CurrentInteractionService and hence cannot
    // be accessed from outside. And the first toBeDefined is used
    // just to verify that updateViewWithNewAnswer is a defined function.

    expect(currentInteractionService.updateViewWithNewAnswer).toBeDefined();
    currentInteractionService.updateViewWithNewAnswer();

    expect(currentInteractionService.onAnswerChanged$).toBeDefined();
  });

  it('should return display card', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(1);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);

    expect(currentInteractionService.getDisplayedCard()).toEqual(displayedCard);
  });

  it('should update current answer', () => {
    spyOn(displayedCard, 'updateCurrentAnswer');
    spyOn(currentInteractionService, 'getDisplayedCard').and.returnValue(
      displayedCard
    );

    currentInteractionService.updateCurrentAnswer('answer');

    expect(displayedCard.updateCurrentAnswer).toHaveBeenCalledOnceWith(
      'answer'
    );
  });

  it('should check if "no response error" should be displayed', () => {
    spyOn(currentInteractionService, 'getDisplayedCard').and.returnValue(
      displayedCard
    );
    spyOn(displayedCard, 'showNoResponseError').and.returnValue(true);

    expect(currentInteractionService.showNoResponseError()).toBeTrue();
  });
});
