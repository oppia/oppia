// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the exploration engine service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed} from '@angular/core/testing';
import { ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationFeaturesBackendApiService } from 'services/exploration-features-backend-api.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AnswerClassificationService } from './answer-classification.service';
import { AudioPreloaderService } from './audio-preloader.service';
import { AudioTranslationLanguageService } from './audio-translation-language.service';
import { ContentTranslationLanguageService } from './content-translation-language.service';
import { ExplorationEngineService } from './exploration-engine.service';
import { ImagePreloaderService } from './image-preloader.service';
import { LearnerParamsService } from './learner-params.service';
import { PlayerTranscriptService } from './player-transcript.service';
import { StatsReportingService } from './stats-reporting.service';

describe('Exploration engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let audioPreloaderService: AudioPreloaderService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let contextService: ContextService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let explorationFeaturesBackendApiService:
    ExplorationFeaturesBackendApiService;
  let explorationEngineService: ExplorationEngineService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let explorationObjectFactory: ExplorationObjectFactory;
  let focusManagerService: FocusManagerService;
  let imagePreloaderService: ImagePreloaderService;
  let learnerParamsService: LearnerParamsService;
  let playerTranscriptService: PlayerTranscriptService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let stateCardObjectFactory: StateCardObjectFactory;
  let statsReportingService: StatsReportingService;
  let urlService: UrlService;

  let explorationDict: ExplorationBackendDict;

  beforeEach(() => {
    explorationDict = {
      correctness_feedback_enabled: false,
      draft_change_list_id: 1,
      draft_changes: [],
      version: 1,
      is_version_of_draft_valid: true,
      language_code: 'en',
      title: 'My Title',
      init_state_name: 'Introduction',
      states: {
        'State 1': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>State 1 Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-2.mp3',
                  file_size_bytes: 120000,
                  needs_update: false,
                  duration_secs: 1.2
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: [],
              labelled_as_correct: false,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          card_is_checkpoint: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          linked_skill_id: null,
          classifier_model_id: null,
          next_content_id_index: null,
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-4.mp3',
                  file_size_bytes: 120000,
                  needs_update: false,
                  duration_secs: 1.2
                }
              }
            }
          },
          interaction: {
            id: 'EndExploration',
            default_outcome: null,
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          card_is_checkpoint: false,
          written_translations: {
            translations_mapping: {
              content: {}
            }
          },
          linked_skill_id: null,
          classifier_model_id: null,
          next_content_id_index: null,
        },
        'State 2': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>State 2 Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-3.mp3',
                  file_size_bytes: 120000,
                  needs_update: false,
                  duration_secs: 1.2
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: [],
              labelled_as_correct: false,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          card_is_checkpoint: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          linked_skill_id: null,
          classifier_model_id: null,
          next_content_id_index: null,
        },
        Introduction: {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Introduction Content</p>',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-1.mp3',
                  file_size_bytes: 120000,
                  needs_update: false,
                  duration_secs: 1.2
                }
              },
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: ''
              }
            },
            solution: null,
            answer_groups: [{
              rule_specs: [{
                rule_type: 'Contains',
                inputs: {x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['1']
                }}
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              training_data: null,
              tagged_skill_misconception_id: null,
            }, {
              rule_specs: [{
                rule_type: 'Contains',
                inputs: {x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['2']
                }}
              }],
              outcome: {
                dest: 'State 2',
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 2</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              training_data: null,
              tagged_skill_misconception_id: null,
            }],
            hints: []
          },
          solicit_answer_details: false,
          card_is_checkpoint: true,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          linked_skill_id: null,
          classifier_model_id: null,
          next_content_id_index: null,
        }
      },
      param_specs: {},
      param_changes: [],
    };
  })
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
    contextService = TestBed.inject(ContextService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService);
    expressionInterpolationService = TestBed.inject(
      ExpressionInterpolationService);
    explorationFeaturesBackendApiService = TestBed.inject(
      ExplorationFeaturesBackendApiService);
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService);
    explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    learnerParamsService = TestBed.inject(LearnerParamsService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    focusManagerService = TestBed.inject(FocusManagerService);
    focusManagerService = TestBed.inject(FocusManagerService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    stateCardObjectFactory = TestBed.inject(StateCardObjectFactory);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlService = TestBed.inject(UrlService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
  });

  fit('should init', () => {
    let initSuccessCb = jasmine.createSpy('success');

    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId');
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(2);
    spyOn(contentTranslationLanguageService, 'init').and.returnValue(null);
    spyOn(imagePreloaderService, 'init').and.returnValue(null);
    spyOn(imagePreloaderService, 'kickOffImagePreloader').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationStarted')
      .and.returnValue(null);

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], initSuccessCb);
    
  });
});