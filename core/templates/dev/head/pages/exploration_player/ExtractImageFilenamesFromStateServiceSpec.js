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
 * @fileoverview Unit tests for the extracting image files in state service.
 */

describe('Extracting Image file names in the state service', function() {
  beforeEach(function() {
    module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          is_terminal: false
        },
        ItemSelectionInput: {
            is_terminal: false
        },
        MultipleChoiceInput: {
            is_terminal: false
        },
        Continue: {
          is_terminal: false
        },
        EndExploration: {
          is_terminal: true
        }
      });
    });
  });

  var eifss, eof, ecs;
  var $rootScope = null;
  var explorationDict;
  var FilenamesInExp;
  beforeEach(inject(function($injector) {
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ExplorationContextService');
    eifss = $injector.get('ExtractImageFilesInStateService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    $rootScope = $injector.get('$rootScope');
    explorationDict = {
      id: 1,
      title: 'My Title',
      category: 'Art',
      objective: 'Your objective',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 15,
      init_state_name: 'Introduction',
      states: { 
        'State 1': {
          param_changes: [],
          content: {
            html: '',
            audio_translations: {}
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: [],
              dest: 'State 3',
              param_changes: []
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
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            html: 'Congratulations, you have finished!',
            audio_translations: {}
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
          classifier_model_id: null
        },
        Introduction: {
          classifier_model_id: null,
          param_changes: [],
          content: {
            html: 'Multiple Choice',
            audio_translations: {}
          },
          interaction: {
            id: 'MultipleChoiceInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                audio_tranlsation: {},
                html: 'Try Again!'
              }
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                values: ['<p> Go to ItemSelection <oppia-noninteractive-image filepath-with-value="&amp;quot;sIMultipleChoice1.png&amp;quot;"></oppia-noninteractive-image></p>',
                '<p> Go to ImageAndRegion<oppia-noninteractive-image filepath-with-value="&amp;quot;sIMultipleChoice2.png&amp;quot;"></oppia-noninteractive-image></p>'
              ]
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    audio_translations: {},
                    html: '<p>We are going to ItemSelection <oppia-noninteractive-image filepath-with-value="&amp;quot;sIOutcomeFeedback.png&amp;quot;"></oppia-noninteractive-image></p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 0
                    },
                    rule_type: 'Equals'
                  }
                ]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    audio_translations: {},
                    html: 'Lets go to state 5 ImageAndRegion'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 1
                    },
                    rule_type: 'Equals'
                  }
                ]
              }

            ],
            hints: [],
            solution: null
          }
        },
        'State 6': {
          param_changes: [],
          content: {
            html: '<p>Text Input Content</p>',
            audio_translations: {}
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'State 6',
              feedback: [
                '<p>Try again.</p>'
              ],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
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
            answer_groups: [{
              rule_specs: [{
                inputs: {
                  x: '1'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: [
                  "<p>Let's go to State 1</p>"
                ],
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }, {
              rule_specs: [{
                inputs: {
                  x: '2'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: [
                  "<p>Let's go to State 1</p>"
                ],
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            hints: [
              {
                hint_content: {
                  html: '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;s6Hint1.png&amp;quot;"></oppia-noninteractive-image></p>',
                  audio_translations: {}
                }
              }],
            solution: {
              answer_is_exclusive: false,
              correct_answer: 'cat',
              explanation: {
                audio_translations: {},
                html: '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;s6SolutionExplanation.png&amp;quot;"></oppia-noninteractive-image></p>'
              }
            },
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    
    filenamesInExploration = {
      'State 1': [],
      'State 3': [],
      'State 6': ['s6Hint1.png','s6SolutionExplanation.png'],
      'Introduction': ['sIMultipleChoice1.png','sIMultipleChoice2.png','sIOutcomeFeedback.png']
    };
  }));

  it('should get all the filenames of the images in a state',
    function() {
      var exploration = eof.createFromBackendDict(explorationDict);
      exploration.getStates().forEach(function(state){
        expect(eifss.getImageFilenamesInState(state)).toBe(filenamesInExploration[state]);
      });
    });
});
  