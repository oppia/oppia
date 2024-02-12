// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Exploration object factory.
 */

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { Exploration, ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { Voiceover } from
  'domain/exploration/voiceover.model';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledHtmlBackendDict } from 'domain/exploration/subtitled-html.model';
import {FetchExplorationBackendResponse } from './read-only-exploration-backend-api.service';

describe('Exploration object factory', () => {
  let eof: ExplorationObjectFactory;
  let sof: StateObjectFactory;
  let exploration: Exploration;
  let iof: InteractionObjectFactory;
  let ls: LoggerService;
  let loggerErrorSpy: jasmine.Spy<(msg: string) => void>;
  let firstState: StateBackendDict;
  let secondState: StateBackendDict;
  let mockReadOnlyExplorationData: FetchExplorationBackendResponse;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    eof = TestBed.get(ExplorationObjectFactory);
    sof = TestBed.get(StateObjectFactory);
    iof = TestBed.get(InteractionObjectFactory);
    ls = TestBed.get(LoggerService);

    firstState = {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'myfile1.mp3',
              file_size_bytes: 210000,
              needs_update: false,
              duration_secs: 4.3
            },
            'hi-en': {
              filename: 'myfile3.mp3',
              file_size_bytes: 430000,
              needs_update: false,
              duration_secs: 2.1
            }
          },
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 },
          catchMisspellings: {
            value: false
          }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {} as SubtitledHtmlBackendDict,
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        id: 'TextInput',
        solution: null
      },
      param_changes: [],
      solicit_answer_details: false,
      classifier_model_id: null,
      card_is_checkpoint: false,
      linked_skill_id: null,
    };
    secondState = {
      content: {
        content_id: 'content',
        html: 'more content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            'hi-en': {
              filename: 'myfile2.mp3',
              file_size_bytes: 120000,
              needs_update: false,
              duration_secs: 1.2
            }
          },
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          recommendedExplorationIds: { value: [] }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {} as SubtitledHtmlBackendDict,
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        id: 'EndExploration',
        solution: null
      },
      param_changes: [],
      solicit_answer_details: false,
      classifier_model_id: null,
      card_is_checkpoint: false,
      linked_skill_id: null,
    };

    mockReadOnlyExplorationData = {
      can_edit: true,
      exploration: {
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: {},
        states: {
          'first state': firstState,
          'second state': secondState
        },
        title: 'Dummy Title',
        language_code: 'en',
        objective: 'Dummy Objective',
        next_content_id_index: 4,
      },
      exploration_metadata: {
        title: 'Dummy Title',
        category: 'Dummy Category',
        objective: 'Dummy Objective',
        language_code: 'en',
        tags: [],
        blurb: 'Dummy Blurb',
        author_notes: 'Dummy Notes',
        states_schema_version: 0,
        init_state_name: 'Introduction',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: true,
        edits_allowed: true,
      },
      exploration_id: '1',
      is_logged_in: true,
      session_id: '0',
      version: 0,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      record_playthrough_probability: 1,
      draft_change_list_id: 1,
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 0,
      furthest_reached_checkpoint_state_name: '',
      most_recently_reached_checkpoint_state_name: '',
      most_recently_reached_checkpoint_exp_version: 1,
      displayable_language_codes: ['en'],
    };

    const explorationDict: ExplorationBackendDict = {
      title: 'My Title',
      init_state_name: 'Introduction',
      language_code: 'en',
      auto_tts_enabled: false,
      states: {
        'first state': firstState,
        'second state': secondState
      },
      param_specs: {},
      param_changes: [],
      draft_changes: [],
      is_version_of_draft_valid: true,
      version: 1,
      draft_change_list_id: 0,
      next_content_id_index: 4,
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
        edits_allowed: true
      }
    };

    exploration = eof.createFromBackendDict(explorationDict);
    exploration.setInitialStateName('first state');
    loggerErrorSpy = spyOn(ls, 'error').and.callThrough();
  });

  it('should get all language codes of an exploration', () => {
    expect(exploration.getAllVoiceoverLanguageCodes())
      .toEqual(['en', 'hi-en']);
  });

  it('should get the language code of an exploration', () => {
    expect(exploration.getLanguageCode()).toBe('en');
  });

  it('should correctly get the content html', () => {
    expect(exploration.getUninterpolatedContentHtml('first state'))
      .toEqual('content');
  });

  it('should correctly get all audio translations by language code',
    () => {
      expect(exploration.getAllVoiceovers('hi-en')).toEqual({
        'first state': [Voiceover.createFromBackendDict({
          filename: 'myfile3.mp3',
          file_size_bytes: 430000,
          needs_update: false,
          duration_secs: 2.1
        })],
        'second state': [Voiceover.createFromBackendDict({
          filename: 'myfile2.mp3',
          file_size_bytes: 120000,
          needs_update: false,
          duration_secs: 1.2
        })]
      });
      expect(exploration.getAllVoiceovers('en')).toEqual({
        'first state': [Voiceover.createFromBackendDict({
          filename: 'myfile1.mp3',
          file_size_bytes: 210000,
          needs_update: false,
          duration_secs: 4.3
        })],
        'second state': []
      });

      expect(exploration.getAllVoiceovers('hi')).toEqual({
        'first state': [],
        'second state': []
      });
    });

  it('should correctly get the interaction from an exploration', () => {
    expect(exploration.getInteraction('first state')).toEqual(
      iof.createFromBackendDict(firstState.interaction)
    );
    expect(exploration.getInteraction('second state')).toEqual(
      iof.createFromBackendDict(secondState.interaction)
    );

    expect(exploration.getInteraction('invalid state')).toBeNull();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: ' + 'invalid state');
  });

  it('should correctly get the interaction id from an exploration', () => {
    expect(exploration.getInteractionId('first state'))
      .toBe('TextInput');
    expect(exploration.getInteractionId('second state'))
      .toBe('EndExploration');

    expect(exploration.getInteractionId('invalid state')).toBeNull();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: ' + 'invalid state');
  });

  it('should correctly get the interaction customization args from an' +
    ' exploration', () => {
    expect(exploration.getInteractionCustomizationArgs('invalid state'))
      .toBeNull();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: ' + 'invalid state');

    expect(exploration.getInteractionCustomizationArgs('first state'))
      .toEqual({
        placeholder: {
          value: new SubtitledUnicode('', 'ca_placeholder_0')
        },
        rows: {
          value: 1
        },
        catchMisspellings: {
          value: false
        }
      });
    expect(exploration.getInteractionCustomizationArgs('second state'))
      .toEqual({
        recommendedExplorationIds: {
          value: []
        }
      });
  });

  it('should correctly check when an exploration has inline display mode',
    () => {
      expect(exploration.isInteractionInline('first state')).toBe(true);
      expect(exploration.isInteractionInline('first state')).toBe(true);

      expect(exploration.isInteractionInline('invalid state')).toBe(true);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Invalid state name: invalid state');
    });

  it('should get and set initial state of an exploration', () => {
    expect(exploration.getInitialState()).toEqual(
      sof.createFromBackendDict('first state', firstState));

    exploration.setInitialStateName('second state');
    expect(exploration.getInitialState()).toEqual(
      sof.createFromBackendDict('second state', secondState));
  });

  it('should get author recommended exploration ids according by if state' +
    ' is terminal in an exploration', () => {
    expect(exploration.isStateTerminal('first state')).toBe(false);
    expect(() => {
      exploration.getAuthorRecommendedExpIds('first state');
    }).toThrowError(
      'Tried to get recommendations for a non-terminal state: ' +
        'first state');

    expect(exploration.isStateTerminal('second state')).toBe(true);
    expect(exploration.getAuthorRecommendedExpIds('second state'))
      .toEqual([]);
  });

  it('should return correct list of translatable objects', () => {
    expect(exploration.getTranslatableObjects().length).toEqual(2);
  });

  it('should create a exploration for given exploration' +
   'backend response', () => {
    const responseExploration = eof.
      createFromExplorationBackendResponse(
        mockReadOnlyExplorationData);

    expect(responseExploration.getLanguageCode()).toBe('en');
    expect(responseExploration.getInteraction('first state')).toEqual(
      iof.createFromBackendDict(firstState.interaction)
    );
    expect(responseExploration.getInteraction('second state')).toEqual(
      iof.createFromBackendDict(secondState.interaction)
    );
    expect(responseExploration.getInteraction('invalid state')).toBeNull();
  });
});
