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
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              },
              rule_specs: [{
                inputs: {
                  x: 10
                },
                rule_type: 'Equals'
              }],
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              labelled_as_correct: false,
              param_changes: []
            },
            hints: [],
            solution: null
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
            answer_groups: [{
              outcome: {
                dest: 'second state',
                feedback: {
                  html: '<p>Good.</p>',
                  audio_translations: {
                    zh: {
                      filename: 'myfile4.mp3',
                      file_size_bytes: 1.1,
                      needs_update: false
                    }
                  }
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              },
              rule_specs: [{
                inputs: {
                  x: 20
                },
                rule_type: 'Equals'
              }]
            }],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: {
                html: '<p>Feedback</p>',
                audio_translations: {
                  he: {
                    filename: 'myfile10.mp3',
                    file_size_bytes: 0.5,
                    needs_update: false
                  }
                }
              },
              labelled_as_correct: false,
              param_changes: []
            },
            hints: [{
              hint_content: {
                html: '<p>Here is a hint.</p>',
                audio_translations: {
                  es: {
                    filename: 'myfile5.mp3',
                    file_size_bytes: 0.7,
                    needs_update: false
                  },
                  zh: {
                    filename: 'myfile6.mp3',
                    file_size_bytes: 0.9,
                    needs_update: false
                  },
                  'hi-en': {
                    filename: 'myfile8.mp3',
                    file_size_bytes: 1.2,
                    needs_update: false
                  }
                }
              }
            }, {
              hint_content: {
                html: '<p>Here is another hint.</p>',
                audio_translations: {
                  cs: {
                    filename: 'myfile7.mp3',
                    file_size_bytes: 0.2,
                    needs_update: false
                  }
                }
              }
            }],
            id: 'TextInput'
          },
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
              labelled_as_correct: false,
              param_changes: []
            },
            hints: [],
            solution: {
              answer_is_exclusive: false,
              correct_answer: 'answer',
              explanation: {
                html: '<p>This is an explanation.</p>',
                audio_translations: {
                  de: {
                    filename: 'myfile9.mp3',
                    file_size_bytes: 0.5,
                    needs_update: false
                  }
                }
              }
            },
            id: 'TextInput'
          },
          param_changes: []
        }
      };
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
        .toEqual(['en', 'hi-en', 'zh', 'he', 'es', 'cs', 'de']);
    });

    it('should correctly get all audio translations in states', function() {
      var statesWithAudio = ssof.createFromBackendDict(statesWithAudioDict);
      expect(statesWithAudio.getAllAudioTranslations('hi-en'))
        .toEqual({
          'first state': [atof.createFromBackendDict({
            filename: 'myfile3.mp3',
            file_size_bytes: 0.8,
            needs_update: false
          }), atof.createFromBackendDict({
            filename: 'myfile8.mp3',
            file_size_bytes: 1.2,
            needs_update: false
          })],
          'second state': [atof.createFromBackendDict({
            filename: 'myfile2.mp3',
            file_size_bytes: 0.8,
            needs_update: false
          })]
        });
    });
  });
});
