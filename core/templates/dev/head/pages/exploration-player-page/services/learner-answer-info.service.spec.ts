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
 * @fileoverview Unit tests for the learner answer info service.
 */

import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory.ts';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory.ts';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory.ts';
import { ExplorationFeaturesService } from
  'services/ExplorationFeaturesService.ts';
import { PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory.ts';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
import { TopicRightsObjectFactory } from
  'domain/topic/TopicRightsObjectFactory.ts';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';

require('App.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');

describe('Learner answer info service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'ExplorationFeaturesService', new ExplorationFeaturesService());
    $provide.value(
      'PredictionResultObjectFactory', new PredictionResultObjectFactory());
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('TopicRightsObjectFactory', new TopicRightsObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
  }));

  var ExplorationEngineService = null;
  var LearnerAnswerInfoService = null;

  beforeEach(angular.mock.inject(function(
    _LearnerAnswerInfoService_, _ExplorationEngineService_) {
      ExplorationEngineService = _ExplorationEngineService_;
      LearnerAnswerInfoService = _LearnerAnswerInfoService_;

      var explorationDict = {
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
              content_id: 'content'
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
                  value: 'Continue'
                }
              },
              solution: null,
              answer_groups: [],
              hints: []
            },
            solicit_answer_details: false,
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
            recorded_voiceovers: {
              voiceovers_mapping: {
                content: {}
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
            solicit_answer_details: false,
            written_translations: {
              translations_mapping: {
                content: {}
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
                  value: [
                    '<p> Go to ItemSelection <oppia-noninteractive-image' +
                    ' filepath-with-value="&amp;quot;' +
                    'sIMChoice1_height_32_width_42.png&amp;' +
                    'quot;"></oppia-noninteractive-image></p>',
                    '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                    ' filepath-with-value="&amp;quot;' +
                    'sIMChoice2_height_30_width_40.png&amp;' +
                    'quot;"></oppia-noninteractive-image></p>'
                  ]
                }
              },
              answer_groups: [
                {
                  labelled_as_correct: false,
                  outcome: {
                    dest: 'State 6',
                    feedback: {
                      content_id: 'feedback_1',
                      html: '<p>We are going to ItemSelection' +
                            '<oppia-noninteractive-image filepath-with-value=' +
                            '"&amp;quot;sIOFeedback_height_50_width_50.png' +
                            '&amp;quot;"></oppia-noninteractive-image></p>'
                    },
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null
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
                      content_id: 'feedback_2',
                      html: "Let's go to state 1 ImageAndRegion"
                    },
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null
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
            solicit_answer_details: false,
            written_translations: {
              translations_mapping: {
                content: {},
                default_outcome: {},
                feedback_1: {},
                feedback_2: {}
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
                hint_1: {}
              }
            },
            interaction: {
              id: 'TextInput',
              default_outcome: {
                dest: 'State 6',
                feedback: {
                  content_id: 'default_outcome',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null
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
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null
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
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null
                }
              }],
              hints: [{
                hint_content: {
                  content_id: 'hint_1',
                  html: '<p><oppia-noninteractive-image filepath-with-value="' +
                        '&amp;quot;s6Hint1_height_60_width_60.png&amp;quot;">' +
                        '</oppia-noninteractive-image></p>'
                }
              }],
              solution: null,
            },
            solicit_answer_details: false,
            written_translations: {
              translations_mapping: {
                content: {},
                default_outcome: {},
                feedback_1: {},
                feedback_2: {},
                hint_1: {}
              }
            },
            classifier_model_id: null
          }
        },
        param_specs: {},
        param_changes: [],
        version: 1
      };
      ExplorationEngineService.init(explorationDict, '1', 'en', false);
  }));

  it('should increment number of attempts correctly', function() {
    expect(
      LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(false);
  });

  it('should ', function() {
    expect(LearnerAnswerInfoService.getCurrentAnswer()).toBeNull();
  });

  it('should ', function() {
    expect(
      LearnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(false);
  });
});
