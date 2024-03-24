// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ParameterMetadataService.
 */

import {TestBed} from '@angular/core/testing';
import {ParameterMetadataService} from 'pages/exploration-editor-page/services/parameter-metadata.service';
import {ExplorationParamChangesService} from 'pages/exploration-editor-page/services/exploration-param-changes.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {StatesObjectFactory} from 'domain/exploration/StatesObjectFactory';
import {HttpClientTestingModule} from '@angular/common/http/testing';

class MockExplorationParamChangesService {
  savedMemento = [
    {
      customizationArgs: {
        parse_with_jinja: false,
        value: '5',
      },
      generatorId: 'Copier',
      name: 'ParamChange1',
    },
    {
      customizationArgs: {
        parse_with_jinja: true,
        value: '{{ParamChange2}}',
      },
      generatorId: 'Copier',
    },
    {
      customizationArgs: {
        parse_with_jinja: true,
        value: '5',
      },
      generatorId: 'RandomSelector',
      name: 'ParamChange3',
    },
  ];
}
class MockGraphDataService {
  getGraphData() {
    return {
      links: [
        {
          source: 'Hola',
          target: 'Hola',
        },
        {
          source: 'State2',
          target: 'State3',
        },
        {
          source: 'State',
          target: 'State',
        },
        {
          source: 'State3',
          target: 'State',
        },
      ],
    };
  }
}

describe('Parameter Metadata Service', () => {
  let parameterMetadataService: ParameterMetadataService;
  let statesObjectFactory: StatesObjectFactory;

  beforeEach(() => {
    class MockExplorationStatesService {
      getStates() {
        return statesObjectFactory.createFromBackendDict({
          Hola: {
            classifier_model_id: null,
            solicit_answer_details: false,
            card_is_checkpoint: false,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: '{{HtmlValue}}',
            },
            recorded_voiceovers: {
              voiceovers_mapping: {
                content: {},
                default_outcome: {},
              },
            },
            param_changes: [],
            interaction: {
              confirmed_unclassified_answers: [],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_2',
                    unicode_str: '',
                  },
                },
                rows: {
                  value: 1,
                },
                catchMisspellings: {
                  value: false,
                },
              },
              solution: {
                answer_is_exclusive: true,
                correct_answer: '1',
                explanation: {
                  content_id: 'solution_5',
                  html: '<p>1</p>',
                },
              },
              id: 'TextInput',
              answer_groups: [
                {
                  rule_specs: [],
                  training_data: [],
                  tagged_skill_misconception_id: null,
                  outcome: {
                    labelled_as_correct: true,
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null,
                    dest: '',
                    dest_if_really_stuck: null,
                    feedback: {
                      content_id: 'feedback_1',
                      html: '{{FeedbackValue}}',
                    },
                  },
                },
              ],
              default_outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'Hola',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              hints: [],
            },
          },
          State: {
            classifier_model_id: null,
            solicit_answer_details: false,
            card_is_checkpoint: false,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: 'content',
            },
            recorded_voiceovers: {
              voiceovers_mapping: {
                content: {},
                default_outcome: {},
              },
            },
            param_changes: [],
            interaction: {
              confirmed_unclassified_answers: [],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_2',
                    unicode_str: '',
                  },
                },
                rows: {
                  value: 1,
                },
                catchMisspellings: {
                  value: false,
                },
              },
              solution: {
                answer_is_exclusive: true,
                correct_answer: '1',
                explanation: {
                  content_id: 'solution_5',
                  html: '<p>1</p>',
                },
              },
              id: 'TextInput',
              answer_groups: [
                {
                  rule_specs: [],
                  training_data: [],
                  tagged_skill_misconception_id: null,
                  outcome: {
                    labelled_as_correct: true,
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null,
                    dest: '',
                    dest_if_really_stuck: null,
                    feedback: {
                      content_id: 'feedback_1',
                      html: '{{StateFeedbackValue}}',
                    },
                  },
                },
              ],
              default_outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'default_outcome',
                  html: '',
                },
              },
              hints: [],
            },
          },
          State2: {
            classifier_model_id: null,
            solicit_answer_details: false,
            card_is_checkpoint: false,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: 'content',
            },
            recorded_voiceovers: {
              voiceovers_mapping: {
                content: {},
                default_outcome: {},
              },
            },
            param_changes: [],
            interaction: {
              confirmed_unclassified_answers: [],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_2',
                    unicode_str: '',
                  },
                },
                rows: {
                  value: 1,
                },
                catchMisspellings: {
                  value: false,
                },
              },
              solution: {
                answer_is_exclusive: true,
                correct_answer: '1',
                explanation: {
                  content_id: 'solution_5',
                  html: '<p>1</p>',
                },
              },
              id: 'TextInput',
              answer_groups: [
                {
                  rule_specs: [],
                  training_data: [],
                  tagged_skill_misconception_id: null,
                  outcome: {
                    labelled_as_correct: true,
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null,
                    dest: '',
                    dest_if_really_stuck: null,
                    feedback: {
                      content_id: '',
                      html: '',
                    },
                  },
                },
              ],
              default_outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State2',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'default_outcome',
                  html: '',
                },
              },
              hints: [],
            },
          },
          State3: {
            classifier_model_id: null,
            solicit_answer_details: false,
            card_is_checkpoint: false,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: 'content',
            },
            recorded_voiceovers: {
              voiceovers_mapping: {
                content: {},
                default_outcome: {},
              },
            },
            param_changes: [],
            interaction: {
              confirmed_unclassified_answers: [],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_2',
                    unicode_str: '',
                  },
                },
                rows: {
                  value: 1,
                },
                catchMisspellings: {
                  value: false,
                },
              },
              solution: {
                answer_is_exclusive: true,
                correct_answer: '1',
                explanation: {
                  content_id: 'solution_5',
                  html: '<p>1</p>',
                },
              },
              id: 'TextInput',
              answer_groups: [
                {
                  rule_specs: [],
                  training_data: [],
                  tagged_skill_misconception_id: null,
                  outcome: {
                    labelled_as_correct: true,
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null,
                    dest: '',
                    dest_if_really_stuck: null,
                    feedback: {
                      content_id: '',
                      html: '',
                    },
                  },
                },
              ],
              default_outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State2',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              hints: [],
            },
          },
        });
      }
    }

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ParameterMetadataService,
        {
          provide: ExplorationParamChangesService,
          useClass: MockExplorationParamChangesService,
        },
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService,
        },
        {
          provide: GraphDataService,
          useClass: MockGraphDataService,
        },
      ],
    });

    parameterMetadataService = TestBed.inject(ParameterMetadataService);
    statesObjectFactory = TestBed.inject(StatesObjectFactory);
  });

  it('should get unset parameters info', () => {
    expect(
      parameterMetadataService.getUnsetParametersInfo(['Hola', 'State2'])
    ).toEqual([
      {
        paramName: 'ParamChange2',
        stateName: null,
      },
      {
        paramName: 'HtmlValue',
        stateName: 'Hola',
      },
      {
        paramName: 'FeedbackValue',
        stateName: 'Hola',
      },
      {
        paramName: 'StateFeedbackValue',
        stateName: 'State',
      },
    ]);

    expect(
      parameterMetadataService.getUnsetParametersInfo(['State', 'State3'])
    ).toEqual([
      {
        paramName: 'ParamChange2',
        stateName: null,
      },
      {
        paramName: 'StateFeedbackValue',
        stateName: 'State',
      },
    ]);
  });
});
