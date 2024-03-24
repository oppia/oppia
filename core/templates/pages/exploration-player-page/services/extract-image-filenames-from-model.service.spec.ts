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

import {TestBed} from '@angular/core/testing';

import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {ContextService} from 'services/context.service';
import {
  ExplorationBackendDict,
  ExplorationObjectFactory,
} from 'domain/exploration/ExplorationObjectFactory';
import {
  ExtractImageFilenamesFromModelService,
  // eslint-disable-next-line max-len
} from 'pages/exploration-player-page/services/extract-image-filenames-from-model.service';

import {
  SkillBackendDict,
  SkillObjectFactory,
} from 'domain/skill/SkillObjectFactory';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Extracting Image file names in the state service', () => {
  let eifms: ExtractImageFilenamesFromModelService;
  let eof: ExplorationObjectFactory;
  let sof: SkillObjectFactory;
  let ecs: ContextService;
  let explorationDict: ExplorationBackendDict;
  let ImageFilenamesInExploration: {[x: string]: string[]};
  let skillDict: SkillBackendDict;
  let expectedImageFilenamesInSkill: string[];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CamelCaseToHyphensPipe],
    });
    eof = TestBed.inject(ExplorationObjectFactory);
    ecs = TestBed.inject(ContextService);
    eifms = TestBed.inject(ExtractImageFilenamesFromModelService);
    sof = TestBed.inject(SkillObjectFactory);
    spyOn(ecs, 'getExplorationId').and.returnValue('1');

    explorationDict = {
      draft_changes: [],
      is_version_of_draft_valid: false,
      language_code: 'en',
      draft_change_list_id: 0,
      title: 'My Title',
      next_content_id_index: 3,
      init_state_name: 'Introduction',
      auto_tts_enabled: false,
      states: {
        'State 1': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
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
                value: {
                  content_id: 'ca_buttonText_0',
                  unicode_str: 'Continue',
                },
              },
            },
            solution: null,
            answer_groups: [],
            hints: [],
          },
          linked_skill_id: null,
          solicit_answer_details: false,
          classifier_model_id: null,
          card_is_checkpoint: false,
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
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
          linked_skill_id: null,
          solicit_answer_details: false,
          classifier_model_id: null,
          card_is_checkpoint: false,
        },
        Introduction: {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Multiple Choice',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
            },
          },
          interaction: {
            id: 'MultipleChoiceInput',
            default_outcome: {
              dest: 'Introduction',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: 'Try Again!',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: [
                  {
                    content_id: 'ca_choices_3',
                    html:
                      '<p> Go to ItemSelection <oppia-noninteractive-image' +
                      ' filepath-with-value="&amp;quot;sIMultipleChoice1.png&amp;' +
                      'quot;"></oppia-noninteractive-image></p>',
                  },
                  {
                    content_id: 'ca_choices_4',
                    html:
                      '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                      ' filepath-with-value="&amp;quot;sIMultipleChoice2.png&amp;' +
                      'quot;"></oppia-noninteractive-image></p>',
                  },
                ],
              },
              showChoicesInShuffledOrder: {value: false},
            },
            answer_groups: [
              {
                outcome: {
                  dest: 'State 4',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_1',
                    html:
                      '<p>We are going to ItemSelection' +
                      '<oppia-noninteractive-image filepath-with-value=' +
                      '"&amp;quot;sIOutcomeFeedback.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null,
                  labelled_as_correct: false,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {x: 0},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 5',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_2',
                    html: "Let's go to state 5 ImageAndRegion",
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null,
                  labelled_as_correct: false,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {x: 1},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
            ],
            hints: [],
            solution: null,
          },
          linked_skill_id: null,
          solicit_answer_details: false,
          card_is_checkpoint: false,
        },
        'State 4': {
          param_changes: [],
          content: {
            content_id: 'content',
            html:
              '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
              'quot;s4Content.png&amp;quot;">' +
              '</oppia-noninteractive-image></p>',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
            },
          },
          interaction: {
            id: 'ItemSelectionInput',
            default_outcome: {
              feedback: {
                content_id: 'content',
                html:
                  '<p>Try Again! <oppia-noninteractive-image' +
                  'filepath-with-value="&amp;quot;' +
                  's4DefaultOutcomeFeedback.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>',
              },
              dest: 'State 4',
              dest_if_really_stuck: null,
              param_changes: [],
              labelled_as_correct: false,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              minAllowableSelectionCount: {
                value: 1,
              },
              maxAllowableSelectionCount: {
                value: 2,
              },
              choices: {
                value: [
                  {
                    content_id: 'ca_choices_3',
                    html:
                      '<p><oppia-noninteractive-image filepath-with-value=' +
                      '"&amp;quot;s4Choice1.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>',
                  },
                  {
                    content_id: 'ca_choices_4',
                    html:
                      '<p><oppia-noninteractive-image filepath-with-value=' +
                      '"&amp;quot;s4Choice2.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>',
                  },
                ],
              },
            },
            hints: [],
            solution: null,
            answer_groups: [
              {
                outcome: {
                  dest: 'State 6',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_1',
                    html: "It is choice number 1. Let's go to the Text Input",
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value' +
                          '=&amp;quot;s4Choice1.png&amp;quot;></oppia-nonin' +
                          'teractive-image></p>',
                      ],
                    },
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_2',
                    html: 'It is choice number 2',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: true,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value=' +
                          '"&amp;quot;s4Choice2.png&amp;quot;">' +
                          '</oppia-noninteractive-image></p>',
                      ],
                    },
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
            ],
          },
          linked_skill_id: null,
          solicit_answer_details: false,
          classifier_model_id: null,
          card_is_checkpoint: false,
        },
        'State 5': {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: '',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              feedback_3: {},
              feedback_4: {},
              feedback_5: {},
            },
          },
          interaction: {
            id: 'ImageClickInput',
            confirmed_unclassified_answers: [],
            default_outcome: {
              dest: 'State 5',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'content',
                html: 'Try Again!',
              },
              param_changes: [],
              refresher_exploration_id: null,
              labelled_as_correct: true,
              missing_prerequisite_skill_id: null,
            },
            answer_groups: [
              {
                outcome: {
                  dest: 'State 5',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feeedback_1',
                    html: '<p>That is the class definition. Try again.</p>',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'IsInRegion',
                    inputs: {x: 'classdef'},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 5',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feeedback_2',
                    html:
                      '<p>That is a function, which is close to what you' +
                      'are looking for. Try again!</p>',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'IsInRegion',
                    inputs: {x: 'instancefunc'},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 5',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feeedback_3',
                    html: '<p>That is the class docstring. Try again.</p>',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'IsInRegion',
                    inputs: {x: 'docstring'},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 5',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feeedback_4',
                    html:
                      "<p>That's a classmethod. It does execute code," +
                      "but it doesn't construct anything. Try again!</p>",
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'IsInRegion',
                    inputs: {x: 'classfunc'},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feeedback_5',
                    html:
                      '<p>You found it! This is the code responsible for' +
                      'constructing a new class object.</p>',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'IsInRegion',
                    inputs: {x: 'ctor'},
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
            ],
            customization_args: {
              highlightRegionsOnHover: {
                value: true,
              },
              imageAndRegions: {
                value: {
                  imagePath: 's5ImagePath.png',
                  labeledRegions: [
                    {
                      label: 'classdef',
                      region: {
                        area: [
                          [0.004291845493562232, 0.004692192192192192],
                          [0.40987124463519314, 0.05874624624624625],
                        ],
                        regionType: 'Rectangle',
                      },
                    },
                    {
                      label: 'docstring',
                      region: {
                        area: [
                          [0.07296137339055794, 0.06475225225225226],
                          [0.9892703862660944, 0.1218093093093093],
                        ],
                        regionType: 'Rectangle',
                      },
                    },
                    {
                      label: 'instancefunc',
                      region: {
                        area: [
                          [0.07296137339055794, 0.15183933933933935],
                          [0.6995708154506438, 0.44012762762762764],
                        ],
                        regionType: 'Rectangle',
                      },
                    },
                    {
                      label: 'classfunc',
                      region: {
                        area: [
                          [0.06866952789699571, 0.46114864864864863],
                          [0.6931330472103004, 0.776463963963964],
                        ],
                        regionType: 'Rectangle',
                      },
                    },
                    {
                      label: 'ctor',
                      region: {
                        area: [
                          [0.06437768240343347, 0.821509009009009],
                          [0.740343347639485, 0.9926801801801802],
                        ],
                        regionType: 'Rectangle',
                      },
                    },
                  ],
                },
              },
            },
            hints: [],
            solution: null,
          },
          solicit_answer_details: false,
          linked_skill_id: null,
          card_is_checkpoint: false,
        },
        'State 6': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Text Input Content</p>',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {},
              solution: {},
            },
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'State 6',
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
                value: {
                  content_id: 'ca_placeholder_3',
                  unicode_str: '',
                },
              },
              catchMisspellings: {
                value: false,
              },
            },
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
                tagged_skill_misconception_id: null,
                training_data: [],
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
                  dest: 'State 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_2',
                    html:
                      "<p>Let's go to State 1</p><oppia-noninteractive-mat" +
                      'h math_content-with-value="{&amp;quot;raw_latex&amp;quot;:' +
                      ' &amp;quot;+,-,-,+&amp;quot;, &amp;quot;svg_filename&amp;q' +
                      'uot;: &amp;quot;mathImg_20207261338jhi1j6rvob_height_1d34' +
                      '5_width_3d124_vertical_0d124.svg&amp;quot;}"></oppia-noni' +
                      'nteractive-math>',
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null,
                },
                tagged_skill_misconception_id: null,
                training_data: [],
              },
            ],
            hints: [
              {
                hint_content: {
                  content_id: 'hint_1',
                  html:
                    '<p><oppia-noninteractive-image filepath-with-value="' +
                    '&amp;quot;s6Hint1.png&amp;quot;">' +
                    '</oppia-noninteractive-image></p>',
                },
              },
            ],
            solution: {
              answer_is_exclusive: false,
              correct_answer: 'cat',
              explanation: {
                content_id: 'solution',
                html:
                  '<p><oppia-noninteractive-image filepath-with-value="' +
                  '&amp;quot;s6SolutionExplanation.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>',
              },
            },
          },
          linked_skill_id: null,
          solicit_answer_details: false,
          classifier_model_id: null,
          card_is_checkpoint: false,
        },
        'State 7': {
          param_changes: [],
          content: {
            content_id: 'content',
            html:
              '<p><oppia-noninteractive-image filepath-with-value="' +
              '&amp;quot;s7Image.png&amp;quot;">' +
              '</oppia-noninteractive-image>' +
              '<oppia-noninteractive-collapsible content-with-value=' +
              '"&amp;quot;&amp;lt;p&amp;gt;Content.&amp;lt;/p&amp;' +
              'gt;&amp;lt;oppia-noninteractive-image ' +
              'filepath-with-value=\\&amp;quot;&amp;amp;amp;quot;' +
              's7CollapsibleImage.png&amp;amp;amp;quot;\\&amp;quot;' +
              '&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;' +
              '&amp;quot;"></oppia-noninteractive-collapsible>' +
              '<oppia-noninteractive-tabs tab_contents-with-value="' +
              '[{&amp;quot;title&amp;quot;:&amp;quot;Title1&amp;' +
              'quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p' +
              '&amp;gt;Content1&amp;lt;/p&amp;gt;&amp;quot;},' +
              '{&amp;quot;title&amp;quot;:&amp;quot;Title2&amp;quot;' +
              ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;' +
              'gt;Content2&amp;lt;/p&amp;gt;&amp;lt;' +
              'oppia-noninteractive-image filepath-with-value=\\' +
              '&amp;quot;&amp;amp;amp;quot;s7TabImage.png&amp;amp;' +
              'amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/' +
              'oppia-noninteractive-image&amp;gt;&amp;quot;}]">' +
              '</oppia-noninteractive-tabs></p>',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
            },
          },
          interaction: {
            id: 'ItemSelectionInput',
            default_outcome: {
              feedback: {
                content_id: 'content',
                html: '<p>Try again!</p>',
              },
              dest: 'State 4',
              dest_if_really_stuck: null,
              param_changes: [],
              labelled_as_correct: false,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              minAllowableSelectionCount: {
                value: 1,
              },
              maxAllowableSelectionCount: {
                value: 2,
              },
              choices: {
                value: [
                  {
                    content_id: 'ca_choices_3',
                    html: '<p>Choice 1</p>',
                  },
                  {
                    content_id: 'ca_choices_4',
                    html: '<p>Choice 2</p>',
                  },
                ],
              },
            },
            hints: [],
            solution: null,
            answer_groups: [
              {
                outcome: {
                  dest: 'State 7',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_1',
                    html: 'It is choice number 1.',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {
                      x: ['<p>Choice 1</p>'],
                    },
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
              {
                outcome: {
                  dest: 'State 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_2',
                    html: 'It is choice number 2',
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  missing_prerequisite_skill_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {
                      x: ['<p>Choice 2</p>'],
                    },
                  },
                ],
                tagged_skill_misconception_id: null,
                training_data: [],
              },
            ],
          },
          solicit_answer_details: false,
          classifier_model_id: null,
          card_is_checkpoint: false,
          linked_skill_id: null,
        },
      },
      param_specs: {},
      param_changes: [],
      version: 1,
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

    ImageFilenamesInExploration = {
      'State 1': [],
      'State 3': [],
      'State 4': [
        's4Content.png',
        's4Choice1.png',
        's4Choice2.png',
        's4DefaultOutcomeFeedback.png',
      ],
      'State 5': ['s5ImagePath.png'],
      'State 6': [
        's6Hint1.png',
        's6SolutionExplanation.png',
        'mathImg_20207261338jhi1j6rvob_height_1d34' +
          '5_width_3d124_vertical_0d124.svg',
      ],
      'State 7': ['s7Image.png', 's7CollapsibleImage.png', 's7TabImage.png'],
      Introduction: [
        'sIMultipleChoice1.png',
        'sIMultipleChoice2.png',
        'sIOutcomeFeedback.png',
      ],
    };

    const misconceptionDict1 = {
      id: 2,
      name: 'test name 1',
      notes:
        '<p><oppia-noninteractive-image alt-with-value="&amp;' +
        'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
        'filepath-with-value="&amp;quot;misconception-dict-1-notes' +
        '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
        'input.</p>',
      feedback:
        '<p><oppia-noninteractive-image alt-with-value="&amp;' +
        'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
        'filepath-with-value="&amp;quot;misconception-dict-1-feedback' +
        '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
        'input.</p>',
      must_be_addressed: true,
    };

    const misconceptionDict2 = {
      id: 4,
      name: 'test name 2',
      notes:
        '<p><oppia-noninteractive-image alt-with-value="&amp;' +
        'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
        'filepath-with-value="&amp;quot;misconception-dict-2-notes' +
        '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
        'input.</p>',
      feedback:
        '<p><oppia-noninteractive-image alt-with-value="&amp;' +
        'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
        'filepath-with-value="&amp;quot;misconception-dict-2-feedback' +
        '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
        'input.</p>',
      must_be_addressed: true,
    };

    const rubricDict = {
      difficulty: 'Easy',
      explanations: [
        '<p><oppia-noninteractive-image alt-with-value="&amp;' +
          'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
          'filepath-with-value="&amp;quot;rubric-dict-easy-explanation' +
          '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
          'input.</p>',
      ],
    };

    const example1 = {
      question: {
        html:
          '<p><oppia-noninteractive-image alt-with-value="&amp;' +
          'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
          'filepath-with-value="&amp;quot;worked-example-1-question' +
          '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
          'input.</p>',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html:
          '<p><oppia-noninteractive-image alt-with-value="&amp;' +
          'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
          'filepath-with-value="&amp;quot;worked-example-1-explanation' +
          '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
          'input.</p>',
        content_id: 'worked_example_e_1',
      },
    };

    const example2 = {
      question: {
        html:
          '<p><oppia-noninteractive-image alt-with-value="&amp;' +
          'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
          'filepath-with-value="&amp;quot;worked-example-2-question' +
          '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
          'input.</p>',
        content_id: 'worked_example_q_2',
      },
      explanation: {
        html:
          '<p><oppia-noninteractive-image alt-with-value="&amp;' +
          'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
          'filepath-with-value="&amp;quot;worked-example-2-explanation' +
          '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
          'input.</p>',
        content_id: 'worked_example_e_2',
      },
    };

    const skillContentsDict = {
      explanation: {
        html:
          '<p><oppia-noninteractive-image alt-with-value="&amp;' +
          'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
          'filepath-with-value="&amp;quot;skill-concept-card-explanation' +
          '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
          'input.</p>',
        content_id: 'explanation',
      },
      worked_examples: [example1, example2],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_1: {},
          worked_example_e_1: {},
          worked_example_q_2: {},
          worked_example_e_2: {},
        },
      },
    };

    skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: ['skill_1'],
      all_questions_merged: false,
      next_misconception_id: 0,
      superseding_skill_id: '',
    };
    expectedImageFilenamesInSkill = [
      'misconception-dict-1-notes.png',
      'misconception-dict-1-feedback.png',
      'misconception-dict-2-notes.png',
      'misconception-dict-2-feedback.png',
      'rubric-dict-easy-explanation.png',
      'worked-example-1-question.png',
      'worked-example-1-explanation.png',
      'worked-example-2-question.png',
      'worked-example-2-explanation.png',
      'skill-concept-card-explanation.png',
    ];
  });

  it('should get all the filenames of the images in a state', () => {
    let exploration = eof.createFromBackendDict(explorationDict);
    let states = exploration.getStates();
    let stateNames = states.getStateNames();
    stateNames.forEach(statename => {
      let filenamesInState = eifms.getImageFilenamesInState(
        states.getState(statename)
      );
      filenamesInState.forEach(function (filename) {
        expect(ImageFilenamesInExploration[statename]).toContain(filename);
      });
    });
  });

  it('should get all the filenames of the images in a skill', () => {
    let skill = sof.createFromBackendDict(skillDict);
    let imageFilenamesInSkill = eifms.getImageFilenamesInSkill(skill).sort();
    expect(imageFilenamesInSkill).toEqual(expectedImageFilenamesInSkill.sort());
  });
});
