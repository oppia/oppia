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
 * @fileoverview Unit tests for conversation flow service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';

import {ConversationFlowService} from './conversation-flow.service';
import {StateCard} from '../../../domain/state_card/state-card.model';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from '../../../components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from '../../../domain/exploration/InteractionObjectFactory';
import {ExplorationModeService} from './exploration-mode.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {PageContextService} from '../../../services/page-context.service';
import {PlayerPositionService} from './player-position.service';
import {StatsReportingService} from './stats-reporting.service';
import {HintsAndSolutionManagerService} from './hints-and-solution-manager.service';
import {ConceptCardManagerService} from './concept-card-manager.service';
import {Solution} from '../../../domain/exploration/SolutionObjectFactory';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';
import {ConceptCardBackendApiService} from '../../../domain/skill/concept-card-backend-api.service';
import {ExplorationSummaryBackendApiService} from '../../../domain/summary/exploration-summary-backend-api.service';
import {RefresherExplorationConfirmationModalService} from './refresher-exploration-confirmation-modal.service';

describe('Conversation flow service', () => {
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let conversationFlowService: ConversationFlowService;
  let hintsAndSolutionManagerService: HintsAndSolutionManagerService;
  let conceptCardManagerService: ConceptCardManagerService;
  let explorationSummaryBackendApiService: ExplorationSummaryBackendApiService;
  let playerTranscriptService: PlayerTranscriptService;
  let explorationModeService: ExplorationModeService;
  let refresherExplorationConfirmationModalService: RefresherExplorationConfirmationModalService;
  let conceptCardBackendApiService: ConceptCardBackendApiService;
  let pageContextService: PageContextService;
  let playerPositionService: PlayerPositionService;
  let statsReportingService: StatsReportingService;
  let explorationEngineService: ExplorationEngineService;

  let createCard = function (interactionType: string): StateCard {
    return new StateCard(
      null,
      null,
      null,
      new Interaction([], [], null, null, [], interactionType, null),
      [],
      null,
      '',
      null
    );
  };
  let displayedCard = createCard('');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConversationFlowService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
    conversationFlowService = TestBed.inject(ConversationFlowService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    pageContextService = TestBed.inject(PageContextService);
    conceptCardBackendApiService = TestBed.inject(ConceptCardBackendApiService);
    explorationSummaryBackendApiService = TestBed.inject(
      ExplorationSummaryBackendApiService
    );
    refresherExplorationConfirmationModalService = TestBed.inject(
      RefresherExplorationConfirmationModalService
    );
    playerPositionService = TestBed.inject(PlayerPositionService);
    statsReportingService = TestBed.inject(StatsReportingService);
    hintsAndSolutionManagerService = TestBed.inject(
      HintsAndSolutionManagerService
    );

    conceptCardManagerService = TestBed.inject(ConceptCardManagerService);
    explorationModeService = TestBed.inject(ExplorationModeService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    conversationFlowService = TestBed.inject(ConversationFlowService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
  }));

  it('should handle adding new cards to transcript', () => {
    spyOn(playerTranscriptService, 'addNewCard');
    spyOn(conversationFlowService, 'getLanguageCode').and.returnValue('en');
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('es');
    spyOn(
      contentTranslationManagerService,
      'displayTranslations'
    ).and.returnValue();

    conversationFlowService.addNewCard(displayedCard);
    expect(playerTranscriptService.addNewCard).toHaveBeenCalledWith(
      displayedCard
    );
    expect(
      contentTranslationManagerService.displayTranslations
    ).toHaveBeenCalledWith('es');
  });

  it('should tell if supplemental card is non empty', () => {
    expect(
      conversationFlowService.isSupplementalCardNonempty(displayedCard)
    ).toBeFalse();

    let textInputCard = createCard('TextInput');
    expect(
      conversationFlowService.isSupplementalCardNonempty(textInputCard)
    ).toBeFalse();

    let supplementaryImageInputCard = createCard('ImageClickInput');
    expect(
      conversationFlowService.isSupplementalCardNonempty(
        supplementaryImageInputCard
      )
    ).toBeTrue();
  });

  it('should record new card added', () => {
    spyOn(explorationEngineService, 'recordNewCardAdded');
    spyOn(conversationFlowService, 'recordNewCardAdded').and.callThrough();
    explorationModeService.setExplorationMode();
    conversationFlowService.recordNewCardAdded();
    expect(conversationFlowService.recordNewCardAdded).toHaveBeenCalled();
  });

  it('should test getters', () => {
    expect(conversationFlowService.onPlayerStateChange).toBeDefined();
    expect(conversationFlowService.onOppiaFeedbackAvailable).toBeDefined();
    expect(conversationFlowService.onShowProgressModal).toBeDefined();
  });

  it('should get language code', () => {
    let languageCode: string = 'test_lang_code';
    spyOn(explorationEngineService, 'getLanguageCode').and.returnValue(
      languageCode
    );
    explorationModeService.setExplorationMode();
    expect(conversationFlowService.getLanguageCode()).toEqual(languageCode);
  });

  it('should record leaving for refresher exploration if not in editor', () => {
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'StateName'
    );
    spyOn(statsReportingService, 'recordLeaveForRefresherExp');

    conversationFlowService.recordLeaveForRefresherExp('refresherExpId');

    expect(
      statsReportingService.recordLeaveForRefresherExp
    ).toHaveBeenCalledWith('StateName', 'refresherExpId');
  });

  it('should NOT record leaving refresher if in editor', () => {
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      true
    );
    spyOn(statsReportingService, 'recordLeaveForRefresherExp');

    conversationFlowService.recordLeaveForRefresherExp('refresherExpId');

    expect(
      statsReportingService.recordLeaveForRefresherExp
    ).not.toHaveBeenCalled();
  });

  it('should record incorrect answer properly', () => {
    spyOn(playerTranscriptService, 'incrementNumberOfIncorrectSubmissions');
    spyOn(hintsAndSolutionManagerService, 'recordWrongAnswer');
    spyOn(conceptCardManagerService, 'recordWrongAnswer');

    conversationFlowService.recordIncorrectAnswer();

    expect(
      playerTranscriptService.incrementNumberOfIncorrectSubmissions
    ).toHaveBeenCalled();
    expect(hintsAndSolutionManagerService.recordWrongAnswer).toHaveBeenCalled();
    expect(conceptCardManagerService.recordWrongAnswer).toHaveBeenCalled();
  });

  it('should handle giveFeedbackAndStayOnCurrentCard correctly', fakeAsync(() => {
    const feedbackHtml = '<p>Feedback</p>';
    const missingSkillId = 'skill123';
    const refresherExpId = 'exp456';
    const refreshInteraction = true;

    const mockCard = createCard('TextInput');
    spyOn(conversationFlowService, '_getCurrentCard').and.returnValue(mockCard);

    spyOn(conversationFlowService, 'recordIncorrectAnswer');
    spyOn(playerTranscriptService, 'addNewResponse');
    spyOn(conversationFlowService, 'emitHelpCard');
    spyOn(mockCard, 'isInteractionInline').and.returnValue(false);
    spyOn(mockCard, 'markAsCompleted');
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(
      Promise.resolve([{explanation: {html: 'concept explanation'}}])
    );
    spyOn(conceptCardManagerService, 'setConceptCard');
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml');
    spyOn(explorationEngineService, 'getRandomSuffix').and.returnValue(
      '-suffix'
    );
    spyOn(conversationFlowService, 'recordLeaveForRefresherExp');
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicExplorationSummariesAsync'
    ).and.returnValue(Promise.resolve({summaries: [{}]}));
    spyOn(
      refresherExplorationConfirmationModalService,
      'displayRedirectConfirmationModal'
    ).and.callFake((_id: string, callback: Function) => {
      callback();
    });

    conversationFlowService.giveFeedbackAndStayOnCurrentCard(
      feedbackHtml,
      missingSkillId,
      refreshInteraction,
      refresherExpId
    );
    tick();

    expect(conversationFlowService.recordIncorrectAnswer).toHaveBeenCalled();
    expect(playerTranscriptService.addNewResponse).toHaveBeenCalledWith(
      feedbackHtml
    );
    expect(conversationFlowService.emitHelpCard).toHaveBeenCalledWith(
      feedbackHtml,
      false
    );
    expect(mockCard.markAsCompleted).toHaveBeenCalled();
    expect(conceptCardManagerService.setConceptCard).toHaveBeenCalled();
    expect(conversationFlowService.emitHelpCard).toHaveBeenCalledWith(
      feedbackHtml,
      true
    );
    expect(
      playerTranscriptService.updateLatestInteractionHtml
    ).toHaveBeenCalledWith(mockCard.getInteractionHtml() + '-suffix');
    expect(
      refresherExplorationConfirmationModalService.displayRedirectConfirmationModal
    ).toHaveBeenCalledWith(refresherExpId, jasmine.any(Function));
    expect(
      conversationFlowService.redirectToRefresherExplorationConfirmed
    ).toBeTrue();
    expect(
      conversationFlowService.recordLeaveForRefresherExp
    ).toHaveBeenCalledWith(refresherExpId);
  }));

  it('should move forward by one card when index is valid', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(5);
    const changeCardSpy = spyOn(conversationFlowService, 'changeCard');

    conversationFlowService.moveForwardByOneCard();

    expect(playerPositionService.getDisplayedCardIndex).toHaveBeenCalled();
    expect(changeCardSpy).toHaveBeenCalledWith(3);
  });

  it('should move backward by one card when index is valid', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(5);
    const changeCardSpy = spyOn(conversationFlowService, 'changeCard');

    conversationFlowService.moveBackByOneCard();

    expect(playerPositionService.getDisplayedCardIndex).toHaveBeenCalled();
    expect(changeCardSpy).toHaveBeenCalledWith(1);
  });

  it('should throw error when moving forward beyond last card', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(4);
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(5);

    // Moving to index 5 (equal to num cards) → out of bounds.
    expect(() => {
      conversationFlowService.moveForwardByOneCard();
    }).toThrowError('Target card index out of bounds.');
  });

  it('should throw error when moving backward before first card', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(5);

    // Moving to index -1 → out of bounds.
    expect(() => {
      conversationFlowService.moveBackByOneCard();
    }).toThrowError('Target card index out of bounds.');
  });

  it('should return correct value for isRefresherExploration', () => {
    conversationFlowService.isRefresherExploration = true;
    expect(conversationFlowService.getIsRefresherExploration()).toBeTrue();

    conversationFlowService.isRefresherExploration = false;
    expect(conversationFlowService.getIsRefresherExploration()).toBeFalse();
  });

  it('should return correct parent exploration IDs', () => {
    const parentIds = ['exp1', 'exp2'];
    conversationFlowService.parentExplorationIds = parentIds;

    expect(conversationFlowService.getParentExplorationIds()).toEqual(
      parentIds
    );
  });

  it('should emit help card data', () => {
    const spy = spyOn(playerPositionService.onHelpCardAvailable, 'emit');
    conversationFlowService.emitHelpCard('<p>help</p>', true);

    expect(spy).toHaveBeenCalledWith({
      helpCardHtml: '<p>help</p>',
      hasContinueButton: true,
    });
  });

  it('should set and get nextCardIfStuck', () => {
    const mockCard = createCard('TextInput');
    conversationFlowService.setNextCardIfStuck(mockCard);
    expect(conversationFlowService.getNextCardIfStuck()).toBe(mockCard);
  });

  it('should set and get solution for state', () => {
    const mockSolution = {
      correctAnswer: true,
      explanationHtml: 'Html',
      answerIsExclusive: true,
      explanationContentId: 'content_id',
    } as Solution;

    conversationFlowService.setSolutionForState(mockSolution);
    expect(conversationFlowService.getSolutionForState()).toBe(mockSolution);
  });

  it('should defer stuck check when isDelayed is true', fakeAsync(() => {
    const mockCallback = jasmine.createSpy('onShowContinueToReviseButton');

    spyOn(
      playerTranscriptService,
      'getNumberOfIncorrectSubmissions'
    ).and.returnValue(
      ExplorationPlayerConstants.MAX_INCORRECT_ANSWERS_BEFORE_RELEASING_SOLUTION
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(
      createCard('TextInput')
    );
    spyOn(hintsAndSolutionManagerService, 'releaseSolution');

    const mockSolution = {
      correctAnswer: true,
      explanationHtml: 'Html',
      answerIsExclusive: true,
      explanationContentId: 'content_id',
    } as Solution;
    conversationFlowService.setSolutionForState(mockSolution);
    conversationFlowService.triggerIfLearnerStuckAction(true, mockCallback);
    tick(
      ExplorationPlayerConstants.WAIT_BEFORE_RESPONSE_FOR_STUCK_LEARNER_MSEC
    );

    expect(hintsAndSolutionManagerService.releaseSolution).toHaveBeenCalled();
  }));

  it('should defer stuck check when isDelayed is false', fakeAsync(() => {
    conversationFlowService.responseTimeout = 100;
    const mockCallback = jasmine.createSpy('onShowContinueToReviseButton');
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);

    const nextCardIfStuck = new StateCard(
      'StuckCard',
      null,
      null,
      new Interaction([], [], null, null, [], 'EndExploration', null),
      [],
      '',
      null
    );

    let displayedCard = new StateCard(
      'CurrentCard',
      null,
      null,
      new Interaction([], [], null, null, [], '', null),
      [],
      '',
      null
    );

    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);
    conversationFlowService.nextCardIfStuck = nextCardIfStuck;
    conversationFlowService.triggerIfLearnerStuckAction(false, mockCallback);
  }));

  it('should set and get next state card', () => {
    const nextCard = new StateCard(
      'NextCard',
      null,
      null,
      new Interaction([], [], null, null, [], 'TextInput', null),
      [],
      '',
      null
    );

    conversationFlowService.setNextStateCard(nextCard);

    expect(conversationFlowService.getNextStateCard()).toBe(nextCard);
  });
});
