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
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

describe('Exploration object factory', () => {
  let eof: ExplorationObjectFactory;
  let sof: StateObjectFactory, exploration: Exploration,
    vof: VoiceoverObjectFactory;
  let ssof: StatesObjectFactory;
  let iof: InteractionObjectFactory;
  let ls: LoggerService;
  let loggerErrorSpy;
  let firstState, secondState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    eof = TestBed.get(ExplorationObjectFactory);
    sof = TestBed.get(StateObjectFactory);
    vof = TestBed.get(VoiceoverObjectFactory);
    ssof = TestBed.get(StatesObjectFactory);
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
          rows: { value: 1 }
        },
        default_outcome: {
          dest: 'new state',
          feedback: [],
          param_changes: []
        },
        hints: [],
        id: 'TextInput'
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      },
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
          feedback: [],
          param_changes: []
        },
        hints: [],
        id: 'EndExploration'
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      },
    };

    const explorationDict: ExplorationBackendDict = {
      title: 'My Title',
      init_state_name: 'Introduction',
      language_code: 'en',
      states: {
        'first state': firstState,
        'second state': secondState},
      param_specs: {},
      param_changes: [],
      draft_changes: [],
      is_version_of_draft_valid: true,
      version: '1'
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
        'first state': [vof.createFromBackendDict({
          filename: 'myfile3.mp3',
          file_size_bytes: 430000,
          needs_update: false,
          duration_secs: 2.1
        })],
        'second state': [vof.createFromBackendDict({
          filename: 'myfile2.mp3',
          file_size_bytes: 120000,
          needs_update: false,
          duration_secs: 1.2
        })]
      });
      expect(exploration.getAllVoiceovers('en')).toEqual({
        'first state': [vof.createFromBackendDict({
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

  it('should correctly get the voiceovers from a language code in' +
    ' an exploration', () => {
    expect(exploration.getVoiceover('first state', 'en')).toEqual(
      vof.createFromBackendDict({
        filename: 'myfile1.mp3',
        file_size_bytes: 210000,
        needs_update: false,
        duration_secs: 4.3
      })
    );

    expect(exploration.getVoiceover('second state', 'en')).toBeNull();

    expect(exploration.getVoiceover('third state', 'en')).toBeNull();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: third state');
  });

  it('should correctly get all voiceovers from an exploration', () => {
    expect(exploration.getVoiceovers('first state')).toEqual({
      en: vof.createFromBackendDict({
        filename: 'myfile1.mp3',
        file_size_bytes: 210000,
        needs_update: false,
        duration_secs: 4.3
      }),
      'hi-en': vof.createFromBackendDict({
        filename: 'myfile3.mp3',
        file_size_bytes: 430000,
        needs_update: false,
        duration_secs: 2.1
      })
    });

    expect(exploration.getVoiceovers('second state')).toEqual({
      'hi-en': vof.createFromBackendDict({
        filename: 'myfile2.mp3',
        file_size_bytes: 120000,
        needs_update: false,
        duration_secs: 1.2
      })
    });

    expect(exploration.getVoiceovers('third state')).toBeNull();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid state name: third state');
  });

  it('should correctly get all the states from an exploration', () => {
    expect(exploration.getState('first state')).toEqual(
      sof.createFromBackendDict('first state', firstState));
    expect(exploration.getState('second state')).toEqual(
      sof.createFromBackendDict('second state', secondState));
    expect(exploration.getStates()).toEqual(
      ssof.createFromBackendDict({
        'first state': firstState,
        'second state': secondState
      }));
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
        }
      });
    expect(exploration.getInteractionCustomizationArgs('second state'))
      .toEqual({
        recommendedExplorationIds: {
          value: []
        }
      });
  });

  it('should correctly get the interaction instructions from an exploration',
    () => {
      expect(exploration.getInteractionInstructions('first state')).toBeNull();
      expect(exploration.getNarrowInstructions('first state')).toBeNull();

      expect(exploration.getInteractionInstructions('invalid state')).toBe('');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Invalid state name: ' + 'invalid state');

      expect(exploration.getNarrowInstructions('invalid state')).toBe('');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Invalid state name: ' + 'invalid state');
    });

  it('should correctly get interaction thumbnail src from an exploration',
    () => {
      expect(exploration.getInteractionThumbnailSrc('first state')).toBe(
        '/extensions/interactions/TextInput/static/TextInput.png');
      expect(exploration.getInteractionThumbnailSrc('invalid state')).toBe('');
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

  it('should correctly get displayable written translation language codes',
    () => {
      expect(
        exploration.getDisplayableWrittenTranslationLanguageCodes()
      ).toEqual([]);

      const firstState = exploration.getState('first state');

      firstState.interaction.id = null;
      firstState.writtenTranslations.addWrittenTranslation(
        'content', 'fr', 'html', '<p>translation</p>');
      expect(
        exploration.getDisplayableWrittenTranslationLanguageCodes()
      ).toEqual(['fr']);
    });
});
