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
  var ImageFilenamesInExploration;
  beforeEach(inject(function($injector) {
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ContextService');
    eifss = $injector.get('ExtractImageFilenamesFromStateService');
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
            content_id: 'content',
            html: ''
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {}
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
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
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {}
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
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        Introduction: {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Multiple Choice'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          },
          interaction: {
            id: 'MultipleChoiceInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: 'Try Again!'
              }
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: [
                  '<p> Go to ItemSelection <oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;sIMultipleChoice1.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>',
                  '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;sIMultipleChoice2.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>'
                ]
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 4',
                  feedback: {
                    content_id: 'feedback_1',
                    html: '<p>We are going to ItemSelection' +
                          '<oppia-noninteractive-image filepath-with-value=' +
                          '"&amp;quot;sIOutcomeFeedback.png&amp;quot;">' +
                          '</oppia-noninteractive-image></p>'
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
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feedback_2',
                    html: "Let's go to state 5 ImageAndRegion"
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
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          }
        },
        'State 4': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
                  'quot;s4Content.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          },
          interaction: {
            id: 'ItemSelectionInput',
            default_outcome: {
              feedback: {
                content_id: 'content',
                html: '<p>Try Again! <oppia-noninteractive-image' +
                      'filepath-with-value="&amp;quot;' +
                      's4DefaultOutcomeFeedback.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              },
              dest: 'State 4',
              param_changes: []
            },
            confirmed_unclassifies_answers: [],
            customization_args: {
              minAllowableSelectionCount: {
                value: 1
              },
              maxAllowableSelectionCount: {
                value: 2
              },
              choices: {
                value: [
                  '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
                  'quot;s4Choice1.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>',
                  '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
                  'quot;s4Choice2.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>']
              }
            },
            hints: [],
            solution: null,
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 6',
                  feedback: {
                    content_id: 'feedback_1',
                    html: "It is choice number 1. Let's go to the Text Input"
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value=' +
                        '"&amp;quot;s4Choice1.png&amp;quot;">' +
                        '</oppia-noninteractive-image></p>'
                      ]
                    },
                    rule_type: 'Equals'
                  }
                ]
              },
              {
                labelled_as_correct: true,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    content_id: 'feedback_2',
                    html: 'It is choice number 2'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value=' +
                        '"&amp;quot;s4Choice2.png&amp;quot;">' +
                        '</oppia-noninteractive-image></p>'
                      ]
                    },
                    rule_type: 'Equals'
                  }
                ]
              }
            ]
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          }
        },
        'State 5': {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: ''
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {},
            feedback_3: {},
            feedback_4: {},
            feedback_5: {}
          },
          interaction: {
            id: 'ImageClickInput',
            confirmed_unclassified_answers: [],
            default_outcome: {
              dest: 'State 5',
              feedback: {
                content_id: 'content',
                html: 'Try Again!'
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_1',
                    html: '<p>That is the class definition. Try again.</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'classdef'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_2',
                    html: '<p>That is a function, which is close to what you' +
                          'are looking for. Try again!</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'instancefunc'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_3',
                    html: '<p>That is the class docstring. Try again.</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'docstring'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_4',
                    html: "<p>That's a classmethod. It does execute code," +
                          "but it doesn't construct anything. Try again!</p>"
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'classfunc'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    content_id: 'feeedback_5',
                    html: '<p>You found it! This is the code responsible for' +
                          'constructing a new class object.</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'ctor'
                  },
                  rule_type: 'IsInRegion'
                }]
              }
            ],
            customization_args: {
              highlightRegionsOnHover: {
                value: true
              },
              imageAndRegions: {
                value: {
                  imagePath: 's5ImagePath.png',
                  labeledRegions: [{
                    label: 'classdef',
                    region: {
                      area: [
                        [0.004291845493562232, 0.004692192192192192],
                        [0.40987124463519314, 0.05874624624624625]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'docstring',
                    region: {
                      area: [
                        [0.07296137339055794, 0.06475225225225226],
                        [0.9892703862660944, 0.1218093093093093]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'instancefunc',
                    region: {
                      area: [
                        [0.07296137339055794, 0.15183933933933935],
                        [0.6995708154506438, 0.44012762762762764]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'classfunc',
                    region: {
                      area: [
                        [0.06866952789699571, 0.46114864864864863],
                        [0.6931330472103004, 0.776463963963964]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'ctor',
                    region: {
                      area: [
                        [0.06437768240343347, 0.821509009009009],
                        [0.740343347639485, 0.9926801801801802]
                      ],
                      regionType: 'Rectangle'
                    }
                  }]
                }
              }
            },
            hints: [],
            solution: null
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              feedback_3: {},
              feedback_4: {},
              feedback_5: {}
            }
          }
        },
        'State 6': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Text Input Content</p>'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {},
            hint_1: {},
            solution: {}
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'State 6',
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>'
              },
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
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>"
                },
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
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            hints: [{
              hint_content: {
                content_id: 'hint_1',
                html: '<p><oppia-noninteractive-image filepath-with-value="' +
                      '&amp;quot;s6Hint1.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              }
            }],
            solution: {
              answer_is_exclusive: false,
              correct_answer: 'cat',
              explanation: {
                content_id: 'solution',
                html: '<p><oppia-noninteractive-image filepath-with-value="' +
                      '&amp;quot;s6SolutionExplanation.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              }
            },
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {},
              solution: {}
            }
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    ImageFilenamesInExploration = {
      'State 1': [],
      'State 3': [],
      'State 4': ['s4Content.png', 's4Choice1.png', 's4Choice2.png',
        's4DefaultOutcomeFeedback.png'],
      'State 5': ['s5ImagePath.png'],
      'State 6': ['s6Hint1.png', 's6SolutionExplanation.png'],
      Introduction: ['sIMultipleChoice1.png', 'sIMultipleChoice2.png',
        'sIOutcomeFeedback.png']
    };
  }));

  it('should get all the filenames of the images in a state',
    function() {
      var exploration = eof.createFromBackendDict(explorationDict);
      var states = exploration.getStates();
      var stateNames = states.getStateNames();
      stateNames.forEach(function(statename) {
        var filenamesInState = (
          eifss.getImageFilenamesInState(states.getState(statename)));
        filenamesInState.forEach(function(filename) {
          expect(ImageFilenamesInExploration[statename]).toContain(filename);
        });
      });
    });
});
