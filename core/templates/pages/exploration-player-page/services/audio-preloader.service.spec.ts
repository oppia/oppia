// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the audio preloader service.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  waitForAsync,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';

import {
  ExplorationBackendDict,
  ExplorationObjectFactory,
} from 'domain/exploration/ExplorationObjectFactory';
import {InteractionAnswer} from 'interactions/answer-defs';
import {AudioPreloaderService} from 'pages/exploration-player-page/services/audio-preloader.service';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import {ContextService} from 'services/context.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {
  Voiceover,
  VoiceoverBackendDict,
} from 'domain/exploration/voiceover.model';

class MockPlatformFeatureService {
  get status(): object {
    return {
      EnableVoiceoverContribution: {
        isEnabled: true,
      },
      AddVoiceoverWithAccent: {
        isEnabled: false,
      },
    };
  }
}

describe('Audio preloader service', () => {
  let httpTestingController: HttpTestingController;
  let interactionAnswer: InteractionAnswer[] = ['Ans1'];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  let audioPreloaderService: AudioPreloaderService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let explorationObjectFactory: ExplorationObjectFactory;
  let entityVoiceoversService: EntityVoiceoversService;
  let contextService: ContextService;

  const audioBlob = new Blob(['audio data'], {type: 'audiotype'});

  let explorationDict: ExplorationBackendDict = {
    draft_change_list_id: 1,
    draft_changes: [],
    auto_tts_enabled: false,
    version: 1,
    is_version_of_draft_valid: true,
    language_code: 'en',
    title: 'My Title',
    init_state_name: 'Introduction',
    next_content_id_index: 7,
    states: {
      'State 1': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: '<p>State 1 Content</p>',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'en-2.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2,
              },
            },
            default_outcome: {},
          },
        },
        interaction: {
          id: 'Continue',
          default_outcome: {
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            dest: 'State 3',
            dest_if_really_stuck: null,
            param_changes: [],
            labelled_as_correct: false,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            buttonText: {
              value: 'Continue',
            },
          },
          solution: null,
          answer_groups: [],
          hints: [],
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        classifier_model_id: null,
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
                duration_secs: 1.2,
              },
            },
          },
        },
        interaction: {
          id: 'EndExploration',
          default_outcome: null,
          confirmed_unclassified_answers: [],
          customization_args: {
            recommendedExplorationIds: {
              value: [],
            },
          },
          solution: null,
          answer_groups: [],
          hints: [],
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        classifier_model_id: null,
      },
      'State 2': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: '<p>State 2 Content</p>',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'en-3.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2,
              },
            },
            default_outcome: {},
          },
        },
        interaction: {
          id: 'Continue',
          default_outcome: {
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            dest: 'State 3',
            dest_if_really_stuck: null,
            param_changes: [],
            labelled_as_correct: false,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            buttonText: {
              value: 'Continue',
            },
          },
          solution: null,
          answer_groups: [],
          hints: [],
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        classifier_model_id: null,
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
                duration_secs: 1.2,
              },
            },
            default_outcome: {},
            feedback_1: {},
          },
        },
        interaction: {
          id: 'TextInput',
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>Try again.</p>',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: '',
            },
            catchMisspellings: {
              value: false,
            },
          },
          solution: null,
          answer_groups: [
            {
              rule_specs: [
                {
                  rule_type: 'Contains',
                  inputs: {
                    x: {
                      contentId: 'rule_input',
                      normalizedStrSet: ['1'],
                    },
                  },
                },
              ],
              outcome: {
                dest: 'State 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>",
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              training_data: interactionAnswer,
              tagged_skill_misconception_id: null,
            },
            {
              rule_specs: [
                {
                  rule_type: 'Contains',
                  inputs: {
                    x: {
                      contentId: 'rule_input',
                      normalizedStrSet: ['2'],
                    },
                  },
                },
              ],
              outcome: {
                dest: 'State 2',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 2</p>",
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              training_data: interactionAnswer,
              tagged_skill_misconception_id: null,
            },
          ],
          hints: [],
        },
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        classifier_model_id: null,
      },
    },
    param_specs: {},
    param_changes: [],
    exploration_metadata: {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    },
  };
  let requestUrl1 = '/assetsdevhandler/exploration/1/assets/audio/en-1.mp3';
  let requestUrl2 = '/assetsdevhandler/exploration/1/assets/audio/en-2.mp3';
  let requestUrl3 = '/assetsdevhandler/exploration/1/assets/audio/en-3.mp3';
  let requestUrl4 = '/assetsdevhandler/exploration/1/assets/audio/en-4.mp3';

  beforeEach(() => {
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    audioPreloaderService.setAudioLoadedCallback((_: string): void => {});
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService
    );
    explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
    contextService = TestBed.inject(ContextService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    spyOn(contextService, 'getExplorationId').and.returnValue('1');
  });

  it('should maintain the correct number of download requests in queue', fakeAsync(() => {
    const exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
    audioPreloaderService.init(exploration);
    audioTranslationLanguageService.init(['en'], 'en', 'en', false);
    audioPreloaderService.kickOffAudioPreloader(
      exploration.getInitialState().name as string
    );

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-1.mp3', 'en-2.mp3', 'en-3.mp3']);
    expect(audioPreloaderService.isLoadingAudioFile('en-1.mp3')).toBeTrue();
    expect(audioPreloaderService.isLoadingAudioFile('en-2.mp3')).toBeTrue();
    expect(audioPreloaderService.isLoadingAudioFile('en-3.mp3')).toBeTrue();
    expect(audioPreloaderService.isLoadingAudioFile('en-4.mp3')).toBeFalse();

    httpTestingController.expectOne(requestUrl1).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-2.mp3', 'en-3.mp3', 'en-4.mp3']);
    expect(audioPreloaderService.isLoadingAudioFile('en-4.mp3')).toBeTrue();

    httpTestingController.expectOne(requestUrl2).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-3.mp3', 'en-4.mp3']);

    httpTestingController.expectOne(requestUrl3).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-4.mp3']);

    httpTestingController.expectOne(requestUrl4).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual([]);
  }));

  it('should maintain the correct number of download requests in queue with accent feature enabled', fakeAsync(() => {
    const exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
    audioPreloaderService.init(exploration);
    audioTranslationLanguageService.init(['en'], 'en', 'en', false);

    let manualVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };

    let manualVoiceover = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict
    );
    spyOn(
      entityVoiceoversService,
      'getAllContentIdsToVoiceovers'
    ).and.returnValue({content: [manualVoiceover]});
    spyOn(
      audioPreloaderService,
      'isVoiceoverContributionWithAccentEnabled'
    ).and.returnValue(true);

    audioPreloaderService.kickOffAudioPreloader(
      exploration.getInitialState().name as string
    );
    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['a.mp3']);

    let requestUrl = '/assetsdevhandler/exploration/1/assets/audio/a.mp3';

    httpTestingController.expectOne(requestUrl).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual([]);
  }));

  it('should return empty audioFiles list if language code is null', () => {
    spyOn(
      audioTranslationLanguageService,
      'getCurrentAudioLanguageCode'
    ).and.returnValue(null);

    const exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
    audioPreloaderService.init(exploration);
    audioTranslationLanguageService.init(['en'], 'en', 'en', false);
    audioPreloaderService.kickOffAudioPreloader(
      exploration.getInitialState().name as string
    );

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual([]);
  });

  it('should properly restart pre-loading from a new state', () => {
    const exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
    audioPreloaderService.init(exploration);
    audioTranslationLanguageService.init(['en'], 'en', 'en', false);
    audioPreloaderService.kickOffAudioPreloader(
      exploration.getInitialState().name as string
    );

    httpTestingController.expectOne(requestUrl1);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-1.mp3', 'en-2.mp3', 'en-3.mp3']);

    audioPreloaderService.restartAudioPreloader('State 3');

    httpTestingController.expectOne(requestUrl4);
    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-4.mp3']);

    audioPreloaderService.restartAudioPreloader('State 2');

    httpTestingController.expectOne(requestUrl3);
    httpTestingController.expectOne(requestUrl4);
    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['en-3.mp3', 'en-4.mp3']);
  });

  it('should properly set most recently requested audio filename', () => {
    audioPreloaderService.clearMostRecentlyRequestedAudioFilename();
    expect(
      audioPreloaderService.getMostRecentlyRequestedAudioFilename()
    ).toEqual(null);
    var filename = 'test_file';
    audioPreloaderService.setMostRecentlyRequestedAudioFilename(filename);
    expect(
      audioPreloaderService.getMostRecentlyRequestedAudioFilename()
    ).toEqual(filename);
  });
});
