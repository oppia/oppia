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
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { ExplorationObjectFactory } from
  'domain/exploration/ExplorationObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { IStateBackendDict } from 'domain/state/StateObjectFactory';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';

describe('Exploration object factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe, ConvertToPlainTextPipe]
    });

    this.eof = TestBed.get(ExplorationObjectFactory);
    this.sof = TestBed.get(StateObjectFactory);
    this.vof = TestBed.get(VoiceoverObjectFactory);
    this.ssof = TestBed.get(StatesObjectFactory);
    this.iof = TestBed.get(InteractionObjectFactory);
    this.ls = TestBed.get(LoggerService);

    this.firstState = <IStateBackendDict>{
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
        customization_args: {},
        default_outcome: {
          dest: 'new state',
          param_changes: [],
          feedback: null,
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        id: 'TextInput',
        solution: null,
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      classifier_model_id: null,
    };
    this.secondState = <IStateBackendDict>{
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
        customization_args: {},
        default_outcome: {
          dest: 'new state',
          param_changes: [],
          feedback: null,
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        id: 'EndExploration',
        solution: null,
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      classifier_model_id: null,
    };

    const explorationDict = {
      id: 1,
      title: 'My Title',
      category: 'Art',
      objective: 'Your objective',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 15,
      init_state_name: 'Introduction',
      language_code: 'en',
      states: {
        'first state': this.firstState,
        'second state': this.secondState},
      param_specs: {},
      param_changes: [],
      version: 1
    };

    this.exploration = this.eof.createFromBackendDict(explorationDict);
    this.exploration.setInitialStateName('first state');

    this.loggerErrorSpy = spyOn(this.ls, 'error').and.callThrough();
  });

  it('should get all language codes of an exploration', () => {
    expect(this.exploration.getAllVoiceoverLanguageCodes())
      .toEqual(['en', 'hi-en']);
  });

  it('should get the language code of an exploration', () => {
    expect(this.exploration.getLanguageCode()).toEqual('en');
  });

  it('should correctly get the content html', () => {
    expect(this.exploration.getUninterpolatedContentHtml('first state'))
      .toEqual('content');
  });

  it('should correctly get all audio translations by language code',
    () => {
      expect(this.exploration.getAllVoiceovers('hi-en')).toEqual({
        'first state': [this.vof.createFromBackendDict({
          filename: 'myfile3.mp3',
          file_size_bytes: 430000,
          needs_update: false,
          duration_secs: 2.1
        })],
        'second state': [this.vof.createFromBackendDict({
          filename: 'myfile2.mp3',
          file_size_bytes: 120000,
          needs_update: false,
          duration_secs: 1.2
        })]
      });
      expect(this.exploration.getAllVoiceovers('en')).toEqual({
        'first state': [this.vof.createFromBackendDict({
          filename: 'myfile1.mp3',
          file_size_bytes: 210000,
          needs_update: false,
          duration_secs: 4.3
        })],
        'second state': []
      });

      expect(this.exploration.getAllVoiceovers('hi'))
        .toEqual({ 'first state': [], 'second state': [] });
    });

  it('should correctly get the voiceovers from a language code in' +
    ' an exploration', () => {
    expect(this.exploration.getVoiceover('first state', 'en')).toEqual(
      this.vof.createFromBackendDict({
        filename: 'myfile1.mp3',
        file_size_bytes: 210000,
        needs_update: false,
        duration_secs: 4.3
      })
    );

    expect(this.exploration.getVoiceover('second state', 'en')).toBeNull();

    expect(this.exploration.getVoiceover('third state', 'en')).toBeNull();
    expect(this.loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: third state');
  });

  it('should correctly get all voiceovers from an exploration', () => {
    expect(this.exploration.getVoiceovers('first state')).toEqual({
      en: this.vof.createFromBackendDict({
        filename: 'myfile1.mp3',
        file_size_bytes: 210000,
        needs_update: false,
        duration_secs: 4.3
      }),
      'hi-en': this.vof.createFromBackendDict({
        filename: 'myfile3.mp3',
        file_size_bytes: 430000,
        needs_update: false,
        duration_secs: 2.1
      })
    });

    expect(this.exploration.getVoiceovers('second state')).toEqual({
      'hi-en': this.vof.createFromBackendDict({
        filename: 'myfile2.mp3',
        file_size_bytes: 120000,
        needs_update: false,
        duration_secs: 1.2
      })
    });

    expect(this.exploration.getVoiceovers('third state')).toBeNull();
    expect(this.loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: third state');
  });

  it('should correctly get all the states from an exploration', () => {
    expect(this.exploration.getState('first state')).toEqual(
      this.sof.createFromBackendDict('first state', this.firstState));
    expect(this.exploration.getState('second state')).toEqual(
      this.sof.createFromBackendDict('second state', this.secondState));
    expect(this.exploration.getStates()).toEqual(
      this.ssof.createFromBackendDict({
        'first state': this.firstState,
        'second state': this.secondState
      }));
  });

  it('should correctly get the interaction from an exploration', () => {
    expect(this.exploration.getInteraction('first state')).toEqual(
      this.iof.createFromBackendDict(this.firstState.interaction)
    );
    expect(this.exploration.getInteraction('second state')).toEqual(
      this.iof.createFromBackendDict(this.secondState.interaction)
    );

    expect(this.exploration.getInteraction('invalid state')).toBeNull();
    expect(this.loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: ' + 'invalid state');
  });

  it('should correctly get the interaction id from an exploration', () => {
    expect(this.exploration.getInteractionId('first state'))
      .toEqual('TextInput');
    expect(this.exploration.getInteractionId('second state'))
      .toEqual('EndExploration');

    expect(this.exploration.getInteractionId('invalid state')).toBeNull();
    expect(this.loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: ' + 'invalid state');
  });

  it('should correctly get the interaction customization args from an' +
    ' exploration', () => {
    expect(this.exploration.getInteractionCustomizationArgs('invalid state'))
      .toBeNull();
    expect(this.loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: ' + 'invalid state');

    expect(this.exploration.getInteractionCustomizationArgs('first state'))
      .toEqual({});
    expect(this.exploration.getInteractionCustomizationArgs('second state'))
      .toEqual({});
  });

  it('should correctly get the interaction instructions from an exploration',
    () => {
      expect(this.exploration.getInteractionInstructions('first state'))
        .toBeNull();
      expect(this.exploration.getNarrowInstructions('first state'))
        .toBeNull();

      expect(this.exploration.getInteractionInstructions('invalid state'))
        .toEqual('');
      expect(this.loggerErrorSpy)
        .toHaveBeenCalledWith('Invalid state name: ' + 'invalid state');

      expect(this.exploration.getNarrowInstructions('invalid state'))
        .toEqual('');
      expect(this.loggerErrorSpy)
        .toHaveBeenCalledWith('Invalid state name: ' + 'invalid state');
    });

  it('should correctly get interaction thumbnail src from an exploration',
    () => {
      expect(this.exploration.getInteractionThumbnailSrc('first state'))
        .toEqual('/extensions/interactions/TextInput/static/TextInput.png');
      expect(this.exploration.getInteractionThumbnailSrc('invalid state'))
        .toEqual('');
    });

  it('should correctly check when an exploration has inline display mode',
    () => {
      expect(this.exploration.isInteractionInline('first state')).toBeTrue();
      expect(this.exploration.isInteractionInline('first state')).toBeTrue();

      expect(this.exploration.isInteractionInline('invalid state')).toBeTrue();
      expect(this.loggerErrorSpy).toHaveBeenCalledWith(
        'Invalid state name: invalid state');
    });

  it('should get and set initial state of an exploration', () => {
    expect(this.exploration.getInitialState()).toEqual(
      this.sof.createFromBackendDict('first state', this.firstState));

    this.exploration.setInitialStateName('second state');

    expect(this.exploration.getInitialState()).toEqual(
      this.sof.createFromBackendDict('second state', this.secondState));
  });

  it('should get author recommended exploration ids according by if state' +
    ' is terminal in an exploration', () => {
    expect(this.exploration.isStateTerminal('first state')).toBeFalse();

    expect(() => {
      this.exploration.getAuthorRecommendedExpIds('first state');
    }).toThrowError(
      'Tried to get recommendations for a non-terminal state: ' +
      'first state');

    expect(this.exploration.isStateTerminal('second state')).toBeTrue();
    expect(this.exploration.getAuthorRecommendedExpIds('second state'))
      .toBeNull();
  });
});
