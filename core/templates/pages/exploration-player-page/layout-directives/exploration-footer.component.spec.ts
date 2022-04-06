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
 * @fileoverview Unit tests for showing author/share footer
 * in exploration player.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ExplorationFooterComponent } from './exploration-footer.component';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { LimitToPipe } from 'filters/limit-to.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ExplorationSummaryBackendApiService, ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';
import { EventEmitter } from '@angular/core';
import { QuestionPlayerStateService } from 'components/question-directives/question-player/services/question-player-state.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { WrittenTranslationsObjectFactory } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { AudioTranslationLanguageService } from '../services/audio-translation-language.service';

describe('ExplorationFooterComponent', () => {
  let component: ExplorationFooterComponent;
  let fixture: ComponentFixture<ExplorationFooterComponent>;
  let contextService: ContextService;
  let urlService: UrlService;
  let learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService;
  let loggerService: LoggerService;
  let readOnlyExplorationBackendApiService:
   ReadOnlyExplorationBackendApiService;
  let windowDimensionsService: WindowDimensionsService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let mockResizeEventEmitter = new EventEmitter();
  let explorationSummaryBackendApiService: ExplorationSummaryBackendApiService;
  let stateObjectFactory: StateObjectFactory;
  let explorationEngineService: ExplorationEngineService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let audioTranslationLanguageService: AudioTranslationLanguageService;

  let mockResultsLoadedEventEmitter = new EventEmitter<boolean>();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [
        ExplorationFooterComponent,
        MockTranslatePipe,
        LimitToPipe
      ],
      providers: [
        QuestionPlayerStateService,
        LearnerViewInfoBackendApiService,
        LoggerService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
    urlService = TestBed.inject(UrlService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    learnerViewInfoBackendApiService = TestBed.inject(
      LearnerViewInfoBackendApiService);
    loggerService = TestBed.inject(LoggerService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    explorationSummaryBackendApiService = TestBed.inject(
      ExplorationSummaryBackendApiService);
    questionPlayerStateService = TestBed.inject(
      QuestionPlayerStateService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    writtenTranslationsObjectFactory = TestBed.inject(
      WrittenTranslationsObjectFactory);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
    fixture = TestBed.createComponent(ExplorationFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialise component when user opens exploration ' +
  'player', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and
      .returnValue(true);
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicAndPrivateExplorationSummariesAsync').and.resolveTo({
      summaries: [
        {
          category: 'Coding',
          community_owned: true,
          thumbnail_bg_color: '#a33f40',
          title: 'Project Euler Problem 1',
          num_views: 263,
          tags: [],
          human_readable_contributors_summary: {
            contributor_1: {
              num_commits: 1
            },
            contributor_2: {
              num_commits: 3
            },
            contributor_3: {
              num_commits: 2
            }
          },
          status: 'public',
          language_code: 'en',
          objective: 'Solve problem 1 on the Project Euler site',
          thumbnail_icon_url: '/subjects/Lightbulb.svg',
          id: 'exp1',
        } as unknown as ExplorationSummaryDict
      ]
    });

    component.ngOnInit();
    tick();

    expect(component.explorationId).toBe('exp1');
    expect(component.iframed).toBeTrue();
    expect(component.windowIsNarrow).toBeFalse();
    expect(
      explorationSummaryBackendApiService.
        loadPublicAndPrivateExplorationSummariesAsync)
      .toHaveBeenCalledWith(['exp1']);
    expect(component.contributorNames).toEqual([
      'contributor_2', 'contributor_3', 'contributor_1']);
  }));

  it('should not show hints after user finishes practice session' +
  ' and results are loaded.', () => {
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    expect(component.hintsAndSolutionsAreSupported).toBeTrue();

    spyOnProperty(questionPlayerStateService, 'resultsPageIsLoadedEventEmitter')
      .and.returnValue(mockResultsLoadedEventEmitter);

    component.ngOnInit();
    mockResultsLoadedEventEmitter.emit(true);

    expect(component.hintsAndSolutionsAreSupported).toBeFalse();
  });

  it('should open the lesson information card', fakeAsync(() => {
    let ngbModal = TestBed.inject(NgbModal);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        numberofCheckpoints: 0,
        completedWidth: 0,
        contributorNames: [],
        expInfo: null
      },
      result: {
        then: (successCallback: () => void, errorCallback: () => void) => {
          successCallback();
          errorCallback();
        }
      }
    } as NgbModalRef);

    let sampleDataResults: FetchExplorationBackendResponse = {
      exploration_id: '0',
      is_logged_in: true,
      session_id: 'KERH',
      draft_change_list_id: 0,
      exploration: {
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: null,
        title: 'Exploration',
        language_code: 'en',
        correctness_feedback_enabled: true,
        objective: 'To learn',
        states: {
          Introduction: {
            param_changes: [],
            classifier_model_id: null,
            recorded_voiceovers: null,
            solicit_answer_details: true,
            card_is_checkpoint: true,
            written_translations: null,
            linked_skill_id: null,
            next_content_id_index: null,
            content: {
              html: '',
              content_id: 'content'
            },
            interaction: {
              customization_args: {},
              answer_groups: [],
              solution: null,
              hints: [],
              default_outcome: {
                param_changes: [],
                dest: 'Introduction',
                feedback: {
                  html: '',
                  content_id: 'content'
                },
                labelled_as_correct: true,
                refresher_exploration_id: 'exp',
                missing_prerequisite_skill_id: null
              },
              confirmed_unclassified_answers: [],
              id: null
            }
          }
        }
      },
      version: 1,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      correctness_feedback_enabled: true,
      record_playthrough_probability: 1,
      user_has_viewed_lesson_info_modal_once: false,
      furthest_completed_checkpoint_exp_version: 1,
      furthest_completed_checkpoint_state_name: 'State B',
      most_recently_reached_checkpoint_state_name: 'State A',
      most_recently_reached_checkpoint_exp_version: 1
    };

    spyOn(readOnlyExplorationBackendApiService, 'loadLatestExplorationAsync')
      .and.returnValue(Promise.resolve(sampleDataResults));

    component.checkpointCount = 1;

    spyOn(component, 'getCheckpointIndexFromStateName').and.returnValue(1);
    spyOn(explorationEngineService, 'getState')
      .and.returnValue(stateObjectFactory.createFromBackendDict(
        'State B', {
          classifier_model_id: null,
          content: {
            html: '',
            content_id: 'content'
          },
          interaction: {
            id: 'FractionInput',
            customization_args: {
              requireSimplestForm: { value: false },
              allowImproperFraction: { value: true },
              allowNonzeroIntegerPart: { value: true },
              customPlaceholder: { value: {
                content_id: '',
                unicode_str: ''
              } },
            },
            answer_groups: [],
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            confirmed_unclassified_answers: [],
            hints: [],
            solution: null
          },
          linked_skill_id: null,
          next_content_id_index: 0,
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          solicit_answer_details: false,
          card_is_checkpoint: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          }
        }
      ));
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(1);
    component.openInformationCardModal();
    tick();
    fixture.detectChanges();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.mostRecentlyReachedCheckpointStateName).toEqual('State A');
    expect(component.isLastCheckpointReached).toEqual(true);
    expect(component.completedWidth).toEqual(100);
  }));

  it('should display lesson information card', fakeAsync(() => {
    let explorationId = 'expId';
    component.explorationId = explorationId;
    component.expInfo = {} as LearnerExplorationSummaryBackendDict;

    spyOn(component, 'openInformationCardModal');
    component.showInformationCard();
    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.returnValue(Promise.resolve({
        summaries: []
      }));

    expect(component.openInformationCardModal).toHaveBeenCalled();
    component.expInfo = null;

    component.showInformationCard();
    tick();

    expect(learnerViewInfoBackendApiService.fetchLearnerInfoAsync)
      .toHaveBeenCalled();
  }));

  it('should get checkpoint index from state name', fakeAsync(() => {
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(1);
    const card = StateCard.createNewCard(
      'State A', '<p>Content</p>', '<interaction></interaction>',
      null,
      RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);
    component.mostRecentlyReachedCheckpointStateName = 'State A';
    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);
    spyOn(explorationEngineService, 'getStateFromStateName')
      .and.returnValue(stateObjectFactory.createFromBackendDict(
        'State A', {
          classifier_model_id: null,
          content: {
            html: '',
            content_id: 'content'
          },
          interaction: {
            id: 'FractionInput',
            customization_args: {
              requireSimplestForm: { value: false },
              allowImproperFraction: { value: true },
              allowNonzeroIntegerPart: { value: true },
              customPlaceholder: { value: {
                content_id: '',
                unicode_str: ''
              } },
            },
            answer_groups: [],
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            confirmed_unclassified_answers: [],
            hints: [],
            solution: null
          },
          linked_skill_id: null,
          next_content_id_index: 0,
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          solicit_answer_details: false,
          card_is_checkpoint: true,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          }
        }

      ));

    let checkpointIndex = component.getCheckpointIndexFromStateName();
    tick();
    fixture.detectChanges();
    expect(checkpointIndex).toEqual(1);
  }));

  it('should handle error if backend call' +
   'to learnerViewInfoBackendApiService fails', fakeAsync(() => {
    let explorationId = 'expId';
    component.explorationId = explorationId;
    component.expInfo = null;

    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.returnValue(Promise.reject());
    spyOn(loggerService, 'error');

    component.showInformationCard();
    tick();

    expect(loggerService.error).toHaveBeenCalled();
  }));

  it('should fetch number of checkpoints correctly', fakeAsync(() => {
    let sampleDataResults: FetchExplorationBackendResponse = {
      exploration_id: 'expId',
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: null,
        title: 'Exploration',
        language_code: 'en',
        correctness_feedback_enabled: true,
        objective: 'To learn',
        states: {
          Introduction: {
            param_changes: [],
            classifier_model_id: null,
            recorded_voiceovers: null,
            solicit_answer_details: true,
            card_is_checkpoint: true,
            written_translations: null,
            linked_skill_id: null,
            next_content_id_index: null,
            content: {
              html: '',
              content_id: 'content'
            },
            interaction: {
              customization_args: {},
              answer_groups: [],
              solution: null,
              hints: [],
              default_outcome: {
                param_changes: [],
                dest: 'Introduction',
                feedback: {
                  html: '',
                  content_id: 'content'
                },
                labelled_as_correct: true,
                refresher_exploration_id: 'exp',
                missing_prerequisite_skill_id: null
              },
              confirmed_unclassified_answers: [],
              id: null
            }
          }
        }
      },
      version: 1,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      correctness_feedback_enabled: true,
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      user_has_viewed_lesson_info_modal_once: false,
      furthest_completed_checkpoint_exp_version: 1,
      furthest_completed_checkpoint_state_name: 'State B',
      most_recently_reached_checkpoint_state_name: 'State A',
      most_recently_reached_checkpoint_exp_version: 1
    };

    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve(sampleDataResults));
    expect(component.checkpointCount).toEqual(0);

    component.getCheckpointCount('expId');
    tick();

    expect(component.expStates).toEqual(sampleDataResults.exploration.states);
    expect(component.checkpointCount).toEqual(1);
  }));

  it('should show hints when initialized in question player when user is' +
  ' going through the practice session and should add subscription.', () => {
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(
      questionPlayerStateService.resultsPageIsLoadedEventEmitter, 'subscribe');

    component.ngOnInit();

    expect(component.hintsAndSolutionsAreSupported).toBeTrue();
    expect(questionPlayerStateService.resultsPageIsLoadedEventEmitter.subscribe)
      .toHaveBeenCalled();
  });

  it('should check if window is narrow when user resizes window', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and
      .returnValue(false);
    component.windowIsNarrow = true;

    component.ngOnInit();
    mockResizeEventEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  });

  it('should not display author names when exploration is in question' +
  ' player mode', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and
      .returnValue(false);
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicAndPrivateExplorationSummariesAsync');

    component.ngOnInit();

    expect(
      explorationSummaryBackendApiService.
        loadPublicAndPrivateExplorationSummariesAsync).not.toHaveBeenCalled();
  });
});
