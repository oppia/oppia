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
import {ContextService} from 'services/context.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
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
  let explorationObjectFactory: ExplorationObjectFactory;
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
          content_id: 'content2',
          html: 'Congratulations, you have finished!',
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

  beforeEach(() => {
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    audioPreloaderService.setAudioLoadedCallback((_: string): void => {});
    explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
    contextService = TestBed.inject(ContextService);
    spyOn(contextService, 'getExplorationId').and.returnValue('1');
  });

  it('should maintain the correct number of download requests in queue', fakeAsync(() => {
    const exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
    audioPreloaderService.init(exploration);

    let manualVoiceoverBackendDict1: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };

    let manualVoiceover1 = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict1
    );

    let manualVoiceoverBackendDict2: VoiceoverBackendDict = {
      filename: 'b.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };

    let manualVoiceover2 = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict2
    );

    let manualVoiceoverBackendDict3: VoiceoverBackendDict = {
      filename: 'c.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };

    let manualVoiceover3 = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict3
    );

    let manualVoiceoverBackendDict4: VoiceoverBackendDict = {
      filename: 'd.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };

    let manualVoiceover4 = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict4
    );

    audioPreloaderService.contentIdsToVoiceovers = {
      content: [manualVoiceover1],
      feedback_1: [manualVoiceover2],
      feedback_2: [manualVoiceover3],
      default_outcome: [manualVoiceover4],
    };

    audioPreloaderService.kickOffAudioPreloader(
      exploration.getInitialState().name as string
    );
    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['a.mp3', 'b.mp3', 'c.mp3']);

    let requestUrl1 = '/assetsdevhandler/exploration/1/assets/audio/a.mp3';
    let requestUrl2 = '/assetsdevhandler/exploration/1/assets/audio/b.mp3';
    let requestUrl3 = '/assetsdevhandler/exploration/1/assets/audio/c.mp3';
    let requestUrl4 = '/assetsdevhandler/exploration/1/assets/audio/d.mp3';

    httpTestingController.expectOne(requestUrl1).flush(audioBlob);
    httpTestingController.expectOne(requestUrl2).flush(audioBlob);
    httpTestingController.expectOne(requestUrl3).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual(['d.mp3']);

    httpTestingController.expectOne(requestUrl4).flush(audioBlob);
    flushMicrotasks();

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual([]);
  }));

  it('should return empty audioFiles list if language code is null', () => {
    const exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
    audioPreloaderService.init(exploration);
    audioPreloaderService.kickOffAudioPreloader(
      exploration.getInitialState().name as string
    );

    expect(
      audioPreloaderService.getFilenamesOfAudioCurrentlyDownloading()
    ).toEqual([]);
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

  it('should be able to restart audio preloader', () => {
    spyOn(audioPreloaderService, 'kickOffAudioPreloader');
    audioPreloaderService.restartAudioPreloader('State 1');
    expect(audioPreloaderService.kickOffAudioPreloader).toHaveBeenCalledWith(
      'State 1'
    );
  });
});
