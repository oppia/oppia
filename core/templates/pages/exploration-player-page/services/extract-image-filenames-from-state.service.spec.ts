
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

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ContextService } from 'services/context.service';
import { ExplorationObjectFactory } from
  'domain/exploration/ExplorationObjectFactory';
import { ExtractImageFilenamesFromStateService } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/services/extract-image-filenames-from-state.service';


describe('Extracting Image file names in the state service', () => {
  let eifss: ExtractImageFilenamesFromStateService;
  let eof: ExplorationObjectFactory;
  let ecs: ContextService;
  let explorationDict;
  let ImageFilenamesInExploration;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    eof = TestBed.get(ExplorationObjectFactory);
    ecs = TestBed.get(ContextService);
    eifss = TestBed.get(ExtractImageFilenamesFromStateService);
    spyOn(ecs, 'getExplorationId').and.returnValue('1');

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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
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
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: {
                  content_id: 'ca_buttonText_0',
                  unicode_str: 'Continue'
                }
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          next_content_id_index: 1,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              ca_buttonText_0: {},
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
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
          next_content_id_index: 0,
          solicit_answer_details: false,
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
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
                value: [{
                  content_id: 'ca_choices_3',
                  html: '<p> Go to ItemSelection <oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;sIMultipleChoice1.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>'
                }, {
                  content_id: 'ca_choices_4',
                  html: '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;sIMultipleChoice2.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>'
                }]
              },
              showChoicesInShuffledOrder: {value: false}
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  Equals: [
                    {
                      x: 0
                    }
                  ]
                }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  Equals: [
                    {
                      x: 1
                    }
                  ]
                }
              }
            ],
            hints: [],
            solution: null
          },
          next_content_id_index: 5,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              ca_choices_3: {},
              ca_choices_4: {},
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
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
                value: [{
                  content_id: 'ca_choices_3',
                  html: '<p><oppia-noninteractive-image filepath-with-value=' +
                  '"&amp;quot;s4Choice1.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>'
                }, {
                  content_id: 'ca_choices_4',
                  html: '<p><oppia-noninteractive-image filepath-with-value=' +
                  '"&amp;quot;s4Choice2.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>'
                }]
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  Equals: [
                    {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value' +
                        '=\&amp;quot;s4Choice1.png&amp;quot;\></oppia-nonin' +
                        'teractive-image></p>'
                      ]
                    }
                  ]
                }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  Equals: [
                    {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value=' +
                        '"&amp;quot;s4Choice2.png&amp;quot;">' +
                        '</oppia-noninteractive-image></p>'
                      ]
                    }
                  ]
                }
              }
            ]
          },
          next_content_id_index: 5,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              ca_choices_3: {},
              ca_choices_4: {},
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              feedback_3: {},
              feedback_4: {},
              feedback_5: {}
            }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  IsInRegion: [
                    {
                      x: 'classdef'
                    }
                  ]
                }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  IsInRegion: [
                    {
                      x: 'instancefunc'
                    }
                  ]
                }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  IsInRegion: [
                    {
                      x: 'docstring'
                    }
                  ]
                }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  IsInRegion: [
                    {
                      x: 'classfunc'
                    }
                  ]
                }
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
                rule_input_translations: {},
                rule_types_to_inputs: {
                  IsInRegion: [
                    {
                      x: 'ctor'
                    }
                  ]
                }
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
          solicit_answer_details: false,
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {},
              solution: {}
            }
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
                value: {
                  content_id: 'ca_placeholder_3',
                  unicode_str: ''
                }
              }
            },
            answer_groups: [{
              rule_input_translations: {},
              rule_types_to_inputs: {
                Contains: [
                  {
                    x: '1'
                  }
                ]
              },
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
              rule_input_translations: {},
              rule_types_to_inputs: {
                Contains: [
                  {
                    x: '2'
                  }
                ]
              },
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_2',
                  html: '<p>Let\'s go to State 1</p><oppia-noninteractive-mat' +
                  'h math_content-with-value="{&amp;quot;raw_latex&amp;quot;:' +
                  ' &amp;quot;+,-,-,+&amp;quot;, &amp;quot;svg_filename&amp;q' +
                  'uot;: &amp;quot;mathImg_20207261338jhi1j6rvob_height_1d34' +
                  '5_width_3d124_vertical_0d124.svg&amp;quot;}"></oppia-noni' +
                  'nteractive-math>'
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
          next_content_id_index: 4,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              ca_placeholder_3: {},
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
      'State 6': [
        's6Hint1.png', 's6SolutionExplanation.png',
        'mathImg_20207261338jhi1j6rvob_height_1d34' +
        '5_width_3d124_vertical_0d124.svg'],
      Introduction: ['sIMultipleChoice1.png', 'sIMultipleChoice2.png',
        'sIOutcomeFeedback.png']
    };
  });

  it('should get all the filenames of the images in a state',
    () => {
      let exploration = eof.createFromBackendDict(explorationDict);
      let states = exploration.getStates();
      let stateNames = states.getStateNames();
      stateNames.forEach((statename) => {
        let filenamesInState = (
          eifss.getImageFilenamesInState(states.getState(statename)));
        filenamesInState.forEach(function(filename) {
          expect(ImageFilenamesInExploration[statename]).toContain(filename);
        });
      });
    });
});
