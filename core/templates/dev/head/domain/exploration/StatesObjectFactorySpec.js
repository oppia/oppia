// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the States object factory.
 */

describe('States object factory', function() {
  beforeEach(module('oppia'));

  describe('StatesObjectFactory', function() {
    var scope, sof, statesDict, statesWithAudioDict, atof;
    beforeEach(inject(function($injector) {
      ssof = $injector.get('StatesObjectFactory');
      sof = $injector.get('StateObjectFactory');
      atof = $injector.get('AudioTranslationObjectFactory');

      GLOBALS.NEW_STATE_TEMPLATE = {
        classifier_model_id: null,
        content: {
          html: '',
          audio_translations: {}
        },
        interaction: {
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: 'Type your answer here.'
            }
          },
          default_outcome: {
            dest: '(untitled state)',
            feedback: [],
            param_changes: []
          },
          hints: [],
          id: 'TextInput'
        },
        param_changes: []
      };

      statesDict = {
        'first state': {
          content: {
            html: 'content',
            audio_translations: {}
          },
          interaction: {
            id: 'RuleTest',
            answer_groups: [{
              outcome: {
                dest: 'outcome 1',
                feedback: [''],
                param_changes: []
              },
              rule_specs: [{
                inputs: {
                  x: 10
                },
                rule_type: 'Equals'
              }],
              correct: false
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              param_changes: []
            },
            hints: []
          },
          param_changes: []
        }
      };

      statesWithAudioDict = {
        'first state': {
          content: {
            html: 'content',
            audio_translations: {
              en: {
                filename: 'myfile1.mp3',
                file_size_bytes: 0.5,
                needs_update: false
              },
              'hi-en': {
                filename: 'myfile3.mp3',
                file_size_bytes: 0.8,
                needs_update: false
              }
            }
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          hints: [],
          param_changes: []
        },
        'second state': {
          content: {
            html: 'more content',
            audio_translations: {
              'hi-en': {
                filename: 'myfile2.mp3',
                file_size_bytes: 0.8,
                needs_update: false
              }
            }
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          hints: [],
          param_changes: []
        }
      }
    }));

    it('should create a new state given a state name', function() {
      var newStates = ssof.createFromBackendDict(statesDict);
      newStates.addState('new state');
      expect(newStates.getState('new state')).toEqual(
        sof.createFromBackendDict('new state', {
          classifier_model_id: null,
          content: {
            html: '',
            audio_translations: {}
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: 'Type your answer here.'
              }
            },
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          param_changes: []
        }));
    });

    it('should correctly get all audio language codes in states', function() {
      var statesWithAudio = ssof.createFromBackendDict(statesWithAudioDict);
      expect(statesWithAudio.getAllAudioLanguageCodes())
        .toEqual(['en', 'hi-en']);
    });

    it('should correctly get all audio translations in states', function() {
      var statesWithAudio = ssof.createFromBackendDict(statesWithAudioDict);
      expect(statesWithAudio.getAllAudioTranslations('hi-en'))
        .toEqual([
          atof.createFromBackendDict({
            filename: 'myfile3.mp3',
            file_size_bytes: 0.8,
            needs_update: false
          }), 
          atof.createFromBackendDict({
            filename: 'myfile2.mp3',
            file_size_bytes: 0.8,
            needs_update: false
          })
        ]);
    });
  });
});
