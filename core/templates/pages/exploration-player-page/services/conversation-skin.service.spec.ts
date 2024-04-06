// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for common conversation skin service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';

import {ConversationSkinService} from './conversation-skin.service';
import {ConceptCardBackendApiService} from 'domain/skill/concept-card-backend-api.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {LearnerParamsService} from '../services/learner-params.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {QuestionPlayerEngineService} from '../services/question-player-engine.service';
import {StatsReportingService} from '../services/stats-reporting.service';
import {QuestionPlayerStateService} from 'components/question-directives/question-player/services/question-player-state.service';
import {InteractionRulesService} from '../services/answer-classification.service';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {BindableVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {CurrentInteractionService} from './current-interaction.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/path/name',
      reload: () => {},
    },
    onresize: () => {},
    addEventListener(event: string, callback) {
      callback({returnValue: null});
    },
    scrollTo: (x, y) => {},
  };
}

describe('Conversation skin component', () => {
  let conceptCardBackendApiService: ConceptCardBackendApiService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let conversationSkinService: ConversationSkinService;
  let currentInteractionService: CurrentInteractionService;
  let explorationEngineService: ExplorationEngineService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let learnerParamsService: LearnerParamsService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let statsReportingService: StatsReportingService;
  let windowDimensionsService: WindowDimensionsService;

  let displayedCard = new StateCard(
    null,
    null,
    null,
    new Interaction([], [], null, null, [], '', null),
    [],
    null,
    '',
    null
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConversationSkinService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    conceptCardBackendApiService = TestBed.inject(ConceptCardBackendApiService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
    conversationSkinService = TestBed.inject(ConversationSkinService);
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    learnerParamsService = TestBed.inject(LearnerParamsService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    questionPlayerStateService = TestBed.inject(QuestionPlayerStateService);
    statsReportingService = TestBed.inject(StatsReportingService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
  }));

  it('should handle new card addition', () => {
    spyOn(playerTranscriptService, 'addNewCard');
    spyOn(explorationPlayerStateService, 'getLanguageCode').and.returnValue(
      'en'
    );
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('es');
    spyOn(
      contentTranslationManagerService,
      'displayTranslations'
    ).and.returnValue();
    spyOn(playerTranscriptService, 'getNumCards').and.returnValues(2, 1);
    spyOn(playerPositionService, 'setDisplayedCardIndex');
    spyOn(playerPositionService, 'changeCurrentQuestion');

    spyOn(
      conversationSkinService,
      'isSupplementalCardNonempty'
    ).and.returnValues(false, true);
    spyOn(conversationSkinService, 'canWindowShowTwoCards').and.returnValue(
      true
    );
    spyOn(conversationSkinService, 'animateToTwoCards');

    conversationSkinService.handleNewCardAddition(displayedCard);
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(1);
    expect(conversationSkinService.animateToTwoCards).toHaveBeenCalled();

    conversationSkinService.handleNewCardAddition(displayedCard);
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(1);

    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    conversationSkinService.handleNewCardAddition(displayedCard);
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(0);
    expect(playerPositionService.changeCurrentQuestion).toHaveBeenCalledWith(0);
  });

  it('should submit answer and reset current answer state', fakeAsync(() => {
    spyOn(displayedCard, 'updateCurrentAnswer');
    conversationSkinService.displayedCard = displayedCard;
    conversationSkinService.answerIsBeingProcessed = false;
    spyOn(explorationEngineService, 'getLanguageCode').and.returnValue('en');
    spyOn(
      conversationSkinService,
      'isCurrentCardAtEndOfTranscript'
    ).and.returnValue(true);
    let explorationModeSpy = spyOn(
      explorationPlayerStateService,
      'isPresentingIsolatedQuestions'
    );
    explorationModeSpy.and.returnValue(false);

    spyOn(explorationPlayerStateService.onOppiaFeedbackAvailable, 'emit');

    spyOn(explorationPlayerStateService, 'isInQuestionMode').and.returnValues(
      false,
      false,
      false,
      true
    );
    spyOn(explorationEngineService, 'getState');
    spyOn(playerTranscriptService, 'addNewInput');
    spyOn(playerTranscriptService, 'addNewResponse');
    spyOn(playerPositionService.onHelpCardAvailable, 'emit');
    spyOn(playerPositionService, 'setDisplayedCardIndex');

    spyOn(playerPositionService, 'recordAnswerSubmission');
    spyOn(
      explorationPlayerStateService,
      'getCurrentEngineService'
    ).and.returnValue(explorationEngineService);
    spyOn(explorationPlayerStateService, 'getLanguageCode').and.returnValue(
      'en'
    );

    let callback = (
      answer: string,
      interactionRulesService: InteractionRulesService,
      successCallback: (
        nextCard: StateCard,
        refreshInteraction: boolean,
        feedbackHtml: string,
        feedbackAudioTranslations: BindableVoiceovers,
        refresherExplorationId: string,
        missingPrerequisiteSkillId: string,
        remainOnCurrentCard: boolean,
        taggedSkillMisconceptionId: string,
        wasOldStateInitial: boolean,
        isFirstHit: boolean,
        isFinalQuestion: boolean,
        nextCardIfReallyStuck: StateCard | null,
        focusLabel: string
      ) => void
    ) => {
      let stateCard = new StateCard(
        null,
        null,
        null,
        new Interaction([], [], null, null, [], 'EndExploration', null),
        [],
        null,
        '',
        null
      );
      successCallback(
        stateCard,
        true,
        'feedback',
        null,
        'refresherId',
        '',
        false,
        '',
        true,
        false,
        true,
        null,
        ''
      );
      successCallback(
        stateCard,
        true,
        '',
        null,
        'refresherId',
        '',
        false,
        '',
        true,
        false,
        true,
        null,
        ''
      );
      successCallback(
        stateCard,
        true,
        'feedback',
        null,
        'refresherId',
        '',
        false,
        '',
        true,
        false,
        false,
        null,
        ''
      );
      successCallback(
        stateCard,
        true,
        '',
        null,
        'refresherId',
        '',
        false,
        '',
        true,
        false,
        false,
        null,
        ''
      );
      successCallback(
        stateCard,
        true,
        'feedback',
        null,
        '',
        'skill_id',
        true,
        '',
        true,
        false,
        false,
        null,
        ''
      );
      explorationModeSpy.and.returnValue(true);
      conversationSkinService.displayedCard = new StateCard(
        null,
        null,
        null,
        new Interaction([], [], null, null, [], 'TextInput', null),
        [],
        null,
        '',
        null
      );
      spyOn(
        explorationPlayerStateService,
        'isInDiagnosticTestPlayerMode'
      ).and.returnValue(true);
      successCallback(
        stateCard,
        true,
        'feedback',
        null,
        '',
        'skill_id',
        true,
        '',
        true,
        false,
        false,
        null,
        ''
      );
      conversationSkinService.displayedCard = new StateCard(
        null,
        null,
        null,
        new Interaction([], [], null, null, [], 'ImageClickInput', null),
        [],
        null,
        '',
        null
      );
      explorationModeSpy.and.returnValue(false);
      successCallback(
        stateCard,
        true,
        'feedback',
        null,
        'refresherId',
        'skill_id',
        true,
        '',
        true,
        false,
        false,
        null,
        ''
      );
      return false;
    };
    spyOn(explorationEngineService, 'submitAnswer').and.callFake(callback);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'oldState'
    );
    spyOn(statsReportingService, 'recordStateTransition');
    spyOn(learnerParamsService, 'getAllParams');
    spyOn(statsReportingService, 'recordStateCompleted');
    spyOn(statsReportingService, 'recordExplorationActuallyStarted');
    spyOn(
      explorationPlayerStateService,
      'isInQuestionPlayerMode'
    ).and.returnValue(true);
    spyOn(questionPlayerStateService, 'answerSubmitted');
    spyOn(questionPlayerEngineService, 'getCurrentQuestion');
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml');
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(
      Promise.resolve([new ConceptCard(new SubtitledHtml('', ''), [], null)])
    );

    spyOn(statsReportingService, 'recordLeaveForRefresherExp');
    spyOn(playerTranscriptService, 'hasEncounteredStateBefore').and.returnValue(
      true
    );
    spyOn(explorationPlayerStateService, 'recordNewCardAdded');

    conversationSkinService.explorationActuallyStarted = false;

    conversationSkinService.submitAnswerNavigation('', null);
    tick(2000);
  }));

  it('should process feedback and prerequisite skills', fakeAsync(() => {
    const feedbackHtml = 'Feedback HTML';
    const missingPrerequisiteSkillId = 'Skill ID';
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(
      Promise.resolve([new ConceptCard(new SubtitledHtml('', ''), [], null)])
    );
    spyOn(playerPositionService.onHelpCardAvailable, 'emit');
    spyOn(playerTranscriptService, 'addNewResponse');

    conversationSkinService.displayedCard = displayedCard;
    spyOn(conversationSkinService.displayedCard, 'markAsCompleted');
    spyOn(
      conversationSkinService.displayedCard,
      'isInteractionInline'
    ).and.returnValue(false);

    conversationSkinService.processFeedbackAndPrerequisiteSkills(
      feedbackHtml,
      missingPrerequisiteSkillId
    );
    tick(200);
    expect(playerTranscriptService.addNewResponse).toHaveBeenCalledWith(
      feedbackHtml
    );
    expect(
      conversationSkinService.displayedCard.markAsCompleted
    ).toHaveBeenCalled();
  }));

  it('should handle navigation properly for the final question', () => {
    spyOn(
      explorationPlayerStateService,
      'isInQuestionPlayerMode'
    ).and.returnValue(true);
    spyOn(conversationSkinService.onShowUpcomingCard, 'emit');
    spyOn(playerTranscriptService, 'addNewResponse');

    conversationSkinService.displayedCard = displayedCard;
    spyOn(
      conversationSkinService.displayedCard,
      'isInteractionInline'
    ).and.returnValue(false);

    conversationSkinService.handleFinalQuestionNavigation('feedback');
    expect(
      conversationSkinService.onShowUpcomingCard.emit
    ).not.toHaveBeenCalled();

    conversationSkinService.handleFinalQuestionNavigation('');
    expect(conversationSkinService.onShowUpcomingCard.emit).toHaveBeenCalled();
  });

  it('should handle navigation properly for available feedback', () => {
    spyOn(playerTranscriptService, 'hasEncounteredStateBefore').and.returnValue(
      true
    );
    spyOn(displayedCard, 'isInteractionInline').and.returnValue(false);
    const onNewCardAvailableSpy = spyOn(
      playerPositionService.onNewCardAvailable,
      'emit'
    );
    spyOn(playerTranscriptService, 'addNewResponse');
    conversationSkinService.displayedCard = displayedCard;
    conversationSkinService.nextCard = displayedCard;

    conversationSkinService.handleFeedbackNavigation('feedback', displayedCard);
    expect(playerPositionService.onNewCardAvailable.emit).toHaveBeenCalled();

    onNewCardAvailableSpy.calls.reset();
    conversationSkinService.handleFeedbackNavigation(null, displayedCard);
    expect(
      playerPositionService.onNewCardAvailable.emit
    ).not.toHaveBeenCalled();
  });

  it('should submit answer from progress nav and toggle submit clicked', () => {
    conversationSkinService.displayedCard = displayedCard;
    spyOn(displayedCard, 'toggleSubmitClicked');
    spyOn(explorationEngineService, 'getLanguageCode').and.returnValue('en');
    spyOn(currentInteractionService, 'submitAnswer');

    conversationSkinService.submitAnswerFromProgressNav();

    expect(currentInteractionService.submitAnswer).toHaveBeenCalled();
    expect(displayedCard.toggleSubmitClicked).toHaveBeenCalledOnceWith(true);
  });

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
    );

    expect(conversationSkinService.canWindowShowTwoCards()).toBeTrue();
  });

  it('should tell if current supplemental card is non empty', () => {
    conversationSkinService.displayedCard = displayedCard;
    spyOn(
      conversationSkinService,
      'isSupplementalCardNonempty'
    ).and.returnValues(true, false);

    expect(
      conversationSkinService.isCurrentSupplementalCardNonempty()
    ).toBeTrue();
    expect(
      conversationSkinService.isCurrentSupplementalCardNonempty()
    ).toBeFalse();
  });

  it('should scroll to bottom', fakeAsync(() => {
    conversationSkinService.scrollToBottom();
    tick(200);

    spyOn(window, '$').and.returnValue({
      offset: () => {
        return {top: 10};
      },
      outerHeight: () => 10,
      scrollTop: () => 0,
      height: () => 0,
      animate: () => {},
    } as unknown as JQLite);

    conversationSkinService.scrollToBottom();
    tick(200);
    expect(window.$).toHaveBeenCalled();
  }));

  it('should tell if current is at end of transcript', () => {
    let index = 1;
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(
      index
    );

    expect(conversationSkinService.isCurrentCardAtEndOfTranscript()).toBeTrue();
    expect(playerTranscriptService.isLastCard).toHaveBeenCalledWith(index);
  });

  it('should animate to one card', fakeAsync(() => {
    let doneCallbackSpy = jasmine.createSpy('done callback');
    conversationSkinService.animateToOneCard(doneCallbackSpy);

    tick(600);
    expect(conversationSkinService.isAnimatingToOneCard).toBeFalse();
    expect(doneCallbackSpy).toHaveBeenCalled();
  }));

  it('should animate to two cards', fakeAsync(() => {
    let doneCallbackSpy = jasmine.createSpy('done callback');
    conversationSkinService.animateToTwoCards(doneCallbackSpy);

    tick(1000);
    expect(conversationSkinService.isAnimatingToTwoCards).toBeFalse();
    expect(doneCallbackSpy).toHaveBeenCalled();
  }));

  it('should check if answer can be submitted safely', () => {
    conversationSkinService.displayedCard = displayedCard;
    conversationSkinService.answerIsBeingProcessed = true;

    expect(conversationSkinService.canSubmitAnswerSafely()).toBeFalse();

    conversationSkinService.answerIsBeingProcessed = false;
    spyOn(
      conversationSkinService,
      'isCurrentCardAtEndOfTranscript'
    ).and.returnValue(true);
    spyOn(conversationSkinService.displayedCard, 'isCompleted').and.returnValue(
      false
    );

    expect(conversationSkinService.canSubmitAnswerSafely()).toBeTrue();
  });
});
