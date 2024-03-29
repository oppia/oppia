// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Conversation skin component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
  flush,
} from '@angular/core/testing';

import {ConversationSkinService} from './conversation-skin.service';
import {ConversationSkinComponent} from '../learner-experience/conversation-skin.component';
import {ConceptCardBackendApiService} from 'domain/skill/concept-card-backend-api.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {AudioPlayerService} from 'services/audio-player.service';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {LearnerParamsService} from '../services/learner-params.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {QuestionPlayerEngineService} from '../services/question-player-engine.service';
import {StatsReportingService} from '../services/stats-reporting.service';
import {QuestionPlayerStateService} from 'components/question-directives/question-player/services/question-player-state.service';
import {InteractionRulesService} from '../services/answer-classification.service';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {AppConstants} from 'app.constants';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {BindableVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ConceptCard} from 'domain/skill/concept-card.model';

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

fdescribe('Conversation skin component', () => {
  let audioPlayerService: AudioPlayerService;
  let conceptCardBackendApiService: ConceptCardBackendApiService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let conversationSkinComponentMock: jasmine.SpyObj<ConversationSkinComponent>;
  let conversationSkinService: ConversationSkinService;
  let explorationEngineService: ExplorationEngineService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let focusManagerService: FocusManagerService;
  let learnerParamsService: LearnerParamsService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let statsReportingService: StatsReportingService;
  let translateService: TranslateService;

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

  let explorationDict = {
    states: {
      Start: {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            ca_placeholder_0: {},
            feedback_1: {},
            rule_input_2: {},
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'TextInput',
          hints: [],
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0',
              },
            },
            catchMisspellings: {
              value: false,
            },
          },
          answer_groups: [
            {
              outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: false,
                feedback: {
                  content_id: 'feedback_1',
                  html: '<p>Good Job</p>',
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'Mid',
              },
              training_data: [],
              rule_specs: [
                {
                  inputs: {
                    x: {
                      normalizedStrSet: ['answer'],
                      contentId: 'rule_input_2',
                    },
                  },
                  rule_type: 'FuzzyEquals',
                },
              ],
              tagged_skill_misconception_id: null,
            },
          ],
          default_outcome: {
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            labelled_as_correct: false,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>Try again.</p>',
            },
            param_changes: [],
            dest_if_really_stuck: null,
            dest: 'Start',
          },
        },
        param_changes: [],
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '<p>First Question</p>',
        },
      },
      End: {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
          },
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'EndExploration',
          hints: [],
          customization_args: {
            recommendedExplorationIds: {
              value: ['recommnendedExplorationId'],
            },
          },
          answer_groups: [],
          default_outcome: null,
        },
        param_changes: [],
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: 'Congratulations, you have finished!',
        },
      },
      Mid: {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            ca_placeholder_0: {},
            feedback_1: {},
            rule_input_2: {},
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'TextInput',
          hints: [],
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0',
              },
            },
            catchMisspellings: {
              value: false,
            },
          },
          answer_groups: [
            {
              outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: false,
                feedback: {
                  content_id: 'feedback_1',
                  html: ' <p>Good Job</p>',
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'End',
              },
              training_data: [],
              rule_specs: [
                {
                  inputs: {
                    x: {
                      normalizedStrSet: ['answer'],
                      contentId: 'rule_input_2',
                    },
                  },
                  rule_type: 'FuzzyEquals',
                },
              ],
              tagged_skill_misconception_id: null,
            },
          ],
          default_outcome: {
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            labelled_as_correct: false,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>try again.</p>',
            },
            param_changes: [],
            dest_if_really_stuck: null,
            dest: 'Mid',
          },
        },
        param_changes: [],
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '<p>Second Question</p>',
        },
      },
    },
    auto_tts_enabled: true,
    version: 2,
    draft_change_list_id: 9,
    is_version_of_draft_valid: null,
    title: 'Exploration',
    language_code: 'en',
    init_state_name: 'Start',
    param_changes: [],
    next_content_id_index: 4,
    param_specs: null,
    draft_changes: null,
  };

  let uniqueProgressIdResponse = '123456';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConversationSkinService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
    });

    audioPlayerService = TestBed.inject(AudioPlayerService);
    conceptCardBackendApiService = TestBed.inject(ConceptCardBackendApiService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
    conversationSkinComponentMock = jasmine.createSpyObj(
      'ConversationSkinComponent',
      [
        'isSupplementalCardNonempty',
        'canWindowShowTwoCards',
        'animateToTwoCards',
        'animateToOneCard',
        'showUpcomingCard',
      ]
    );
    conversationSkinComponentMock.displayedCard = displayedCard;

    conversationSkinService = TestBed.inject(ConversationSkinService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    focusManagerService = TestBed.inject(FocusManagerService);
    learnerParamsService = TestBed.inject(LearnerParamsService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    questionPlayerStateService = TestBed.inject(QuestionPlayerStateService);
    statsReportingService = TestBed.inject(StatsReportingService);
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
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(2);
    spyOn(playerPositionService, 'setDisplayedCardIndex');
    spyOn(playerPositionService, 'changeCurrentQuestion');

    // First condition
    conversationSkinComponentMock.isSupplementalCardNonempty.and.returnValue(
      true
    );
    conversationSkinService.handleNewCardAddition(
      displayedCard,
      conversationSkinComponentMock
    );
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(1);
    expect(
      conversationSkinComponentMock.animateToTwoCards
    ).toHaveBeenCalledWith();

    // Second condition
    conversationSkinComponentMock.isSupplementalCardNonempty.and.returnValue(
      false
    );
    conversationSkinService.handleNewCardAddition(
      displayedCard,
      conversationSkinComponentMock
    );
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(1);

    // Default condition
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(1);
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    conversationSkinService.handleNewCardAddition(
      displayedCard,
      conversationSkinComponentMock
    );
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(0);
    expect(playerPositionService.changeCurrentQuestion).toHaveBeenCalledWith(0);
  });

  it('should submit answer and reset current answer state', fakeAsync(() => {
    spyOn(displayedCard, 'updateCurrentAnswer');
    conversationSkinComponentMock.displayedCard = displayedCard;
    conversationSkinComponentMock.answerIsBeingProcessed = true;

    conversationSkinService.submitAnswerNavigation(
      '',
      null,
      conversationSkinComponentMock
    );

    expect(displayedCard.updateCurrentAnswer).toHaveBeenCalledOnceWith(null);
    conversationSkinComponentMock.answerIsBeingProcessed = false;
    spyOn(
      conversationSkinComponentMock,
      'isCurrentCardAtEndOfTranscript'
    ).and.returnValue(true);
    let explorationModeSpy = spyOn(
      explorationPlayerStateService,
      'isPresentingIsolatedQuestions'
    );
    explorationModeSpy.and.returnValue(false);
    conversationSkinComponentMock.isInPreviewMode = false;

    spyOn(explorationPlayerStateService.onOppiaFeedbackAvailable, 'emit');
    spyOn(conversationSkinComponentMock, 'showPendingCard');
    conversationSkinService.submitAnswerNavigation(
      '',
      null,
      conversationSkinComponentMock
    );

    spyOn(explorationPlayerStateService, 'isInQuestionMode').and.returnValues(
      false,
      false,
      false,
      true
    );
    spyOn(conversationSkinComponentMock, 'initLearnerAnswerInfoService');
    spyOn(playerTranscriptService, 'addNewInput');

    spyOn(playerTranscriptService, 'addNewResponse');
    spyOn(playerPositionService.onHelpCardAvailable, 'emit');
    spyOn(playerPositionService, 'setDisplayedCardIndex');

    conversationSkinService.submitAnswerNavigation(
      '',
      null,
      conversationSkinComponentMock
    );
    tick(200);

    spyOn(playerPositionService, 'recordAnswerSubmission');
    spyOn(explorationPlayerStateService, 'getLanguageCode').and.returnValue(
      'en'
    );

    spyOn(
      explorationPlayerStateService,
      'getCurrentEngineService'
    ).and.returnValue(explorationEngineService);
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
      conversationSkinComponentMock.displayedCard = new StateCard(
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
      conversationSkinComponentMock.displayedCard = new StateCard(
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

    conversationSkinComponentMock.explorationActuallyStarted = false;

    conversationSkinService.submitAnswerNavigation(
      '',
      null,
      conversationSkinComponentMock
    );
    tick(2000);
  }));

  it('should process feedback and prerequisite skills', () => {
    // Test case 1: feedbackHtml is provided and displayedCard is not inline
    const feedbackHtml = 'Feedback HTML';
    const missingPrerequisiteSkillId = null;
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(
      Promise.resolve([new ConceptCard(new SubtitledHtml('', ''), [], null)])
    );
    spyOn(playerPositionService.onHelpCardAvailable, 'emit');

    conversationSkinService.processFeedbackAndPrerequisiteSkills(
      feedbackHtml,
      missingPrerequisiteSkillId,
      conversationSkinComponentMock
    );
    expect(playerTranscriptService.addNewResponse).toHaveBeenCalledWith(
      feedbackHtml
    );

    // Test case 2: missingPrerequisiteSkillId is provided
    const missingPrerequisiteSkillId2 = 'Skill ID';

    conversationSkinService.processFeedbackAndPrerequisiteSkills(
      null,
      missingPrerequisiteSkillId2,
      conversationSkinComponentMock
    );
    expect(
      conversationSkinComponentMock.displayedCard.markAsCompleted
    ).toHaveBeenCalled();
  });

  it('should handle navigation properly for the final question', () => {
    spyOn(
      explorationPlayerStateService,
      'isInQuestionPlayerMode'
    ).and.returnValue(true);

    conversationSkinService.handleFinalQuestionNavigation(
      'feedback',
      true,
      conversationSkinComponentMock
    );
    expect(
      conversationSkinComponentMock.showUpcomingCard
    ).not.toHaveBeenCalled();

    conversationSkinService.handleFinalQuestionNavigation(
      '',
      true,
      conversationSkinComponentMock
    );
    expect(conversationSkinComponentMock.showUpcomingCard).toHaveBeenCalled();
  });

  it('should handle navigation properly for available feedback', () => {
    spyOn(playerTranscriptService, 'hasEncounteredStateBefore').and.returnValue(
      true
    );
    spyOn(
      conversationSkinComponentMock.displayedCard,
      'isInteractionInline'
    ).and.returnValue(false);
    spyOn(playerPositionService.onNewCardAvailable, 'emit');

    conversationSkinService.handleFeedbackNavigation(
      'feedback',
      displayedCard,
      conversationSkinComponentMock
    );
    expect(playerPositionService.onNewCardAvailable.emit).toHaveBeenCalled();

    conversationSkinService.handleFeedbackNavigation(
      '',
      displayedCard,
      conversationSkinComponentMock
    );
    expect(
      playerPositionService.onNewCardAvailable.emit
    ).not.toHaveBeenCalled();
  });
});
