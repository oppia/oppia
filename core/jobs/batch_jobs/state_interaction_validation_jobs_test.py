# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for jobs.batch_jobs.exp_validation_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import state_interaction_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class ExpStateInteractionValidationJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = (
        state_interaction_validation_jobs.ExpStateInteractionValidationJob
    )

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'

    EXP_1_STATE_1 = state_domain.State.create_default_state(
        'EXP_1_STATE_1', is_initial_state=True).to_dict()

    EXP_1_STATE_1['interaction'] = {
      'id': 'NumericInput',
      'customization_args': {
        'requireNonnegativeInput': {
          'value': False
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'IsLessThanOrEqualTo',
              'inputs': {
                'x': 7
              }
            },
            {
              'rule_type': 'IsInclusivelyBetween',
              'inputs': {
                'a': 3,
                'b': 5
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 'Not a number'
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_1',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_1_STATE_1',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>try</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [
        {
          'hint_content': {
            'content_id': 'hint_1',
            'html': '<p>c</p>'
          }
        }
      ],
      'solution': None
    }

    EXP_1_STATE_2 = state_domain.State.create_default_state(
        'EXP_1_STATE_2', is_initial_state=True).to_dict()

    EXP_1_STATE_2['interaction'] = {
      'id': 'FractionInput',
      'customization_args': {
        'requireSimplestForm': {
          'value': False
        },
        'allowImproperFraction': {
          'value': True
        },
        'allowNonzeroIntegerPart': {
          'value': True
        },
        'customPlaceholder': {
          'value': {
            'content_id': 'ca_customPlaceholder_0',
            'unicode_str': ''
          }
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'HasDenominatorEqualTo',
              'inputs': {
                'x': 1
              }
            },
            {
              'rule_type': 'HasFractionalPartExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False,
                  'wholeNumber': 0,
                  'numerator': 2,
                  'denominator': 1
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_2',
            'feedback': {
              'content_id': 'feedback_1',
              'html': '<p>cvcv</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_1_STATE_2',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>df</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_1_STATE_3 = state_domain.State.create_default_state(
      'EXP_1_STATE_3', is_initial_state=False).to_dict()

    EXP_1_STATE_3['interaction'] = {
      'id': 'ItemSelectionInput',
      'customization_args': {
        'minAllowableSelectionCount': {
          'value': 1
        },
        'maxAllowableSelectionCount': {
          'value': 2
        },
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_13',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_14',
              'html': '<p>2</p>'
            },
            {
              'content_id': 'ca_choices_15',
              'html': '<p>3</p>'
            }
          ]
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': [
                  'ca_choices_13',
                  'ca_choices_14'
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_3',
            'feedback': {
              'content_id': 'feedback_16',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': [
                  'ca_choices_13',
                  'ca_choices_14'
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_3',
            'feedback': {
              'content_id': 'feedback_16',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_1_STATE_3',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fd</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_1_STATE_4 = state_domain.State.create_default_state(
      'EXP_1_STATE_4', is_initial_state=False).to_dict()

    EXP_1_STATE_4['interaction'] = {
      'id': 'DragAndDropSortInput',
      'customization_args': {
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_17',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_18',
              'html': '<p>2</p>'
            },
            {
              'content_id': 'ca_choices_19',
              'html': '<p>3</p>'
            },
            {
              'content_id': 'ca_choices_20',
              'html': '<p>4</p>'
            }
          ]
        },
        'allowMultipleItemsInSamePosition': {
          'value': True
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'HasElementXAtPositionY',
              'inputs': {
                'x': 'ca_choices_18',
                'y': 2
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_4',
            'feedback': {
              'content_id': 'feedback_22',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'IsEqualToOrdering',
              'inputs': {
                'x': [
                  [
                    'ca_choices_17'
                  ],
                  [
                    'ca_choices_18'
                  ],
                  [
                    'ca_choices_19'
                  ],
                  [
                    'ca_choices_20'
                  ]
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_4',
            'feedback': {
              'content_id': 'feedback_21',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
              'inputs': {
                'x': [
                  [
                    'ca_choices_4',
                    'ca_choices_6'
                  ],
                  [
                    'ca_choices_5'
                  ],
                  [
                    'ca_choices_7'
                  ]
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_4',
            'feedback': {
              'content_id': 'feedback_8',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'IsEqualToOrdering',
              'inputs': {
                'x': [
                  [
                    'ca_choices_4'
                  ],
                  [
                    'ca_choices_5',
                    'ca_choices_6'
                  ],
                  [
                    'ca_choices_7'
                  ]
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_4',
            'feedback': {
              'content_id': 'feedback_9',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_1_STATE_4',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fd</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_1_STATE_5 = state_domain.State.create_default_state(
      'EXP_1_STATE_5', is_initial_state=False).to_dict()

    EXP_1_STATE_5['interaction'] = {
      'id': 'TextInput',
      'customization_args': {
        'placeholder': {
          'value': {
            'content_id': 'ca_placeholder_23',
            'unicode_str': ''
          }
        },
        'rows': {
          'value': 11
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'Contains',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_27',
                  'normalizedStrSet': [
                    'hello',
                    'abc',
                    'def'
                  ]
                }
              }
            },
            {
              'rule_type': 'StartsWith',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_26',
                  'normalizedStrSet': [
                    'helloooo',
                    'dgfg'
                  ]
                }
              }
            }
          ],
          'outcome': {
            'dest': '2',
            'feedback': {
              'content_id': 'feedback_24',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'StartsWith',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_30',
                  'normalizedStrSet': [
                    'exci',
                    'deve'
                  ]
                }
              }
            },
            {
              'rule_type': 'FuzzyEquals',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_29',
                  'normalizedStrSet': [
                    'exciting',
                    'developer'
                  ]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_5',
            'feedback': {
              'content_id': 'feedback_28',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_1_STATE_5',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fd</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_1_STATE_6 = state_domain.State.create_default_state(
        'EXP_1_STATE_6', is_initial_state=False).to_dict()

    EXP_1_STATE_6['interaction'] = {
      'id': 'EndExploration',
      'customization_args': {
        'recommendedExplorationIds': {
          'value': ['EXP_1', 'EXP_2', 'EXP_5', 'EXP_4', '1']
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 0
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_6',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_1_STATE_6',
        'feedback': {
          'content_id': 'default_outcome',
          'html': ''
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_1_STATE_7 = state_domain.State.create_default_state(
        'EXP_1_STATE_7', is_initial_state=False).to_dict()
    EXP_1_STATE_7['content']['html'] = (
      '<p>dffddfdffdfd</p>\n\n<p>&nbsp;</p>\n<oppia-noninteractive-image>'
      '</oppia-noninteractive-image>\n\n<p>&nbsp;</p>\n\n<p>&nbsp;</p>\n\n<p>'
      '<oppia-noninteractive-link></oppia-noninteractive-link>'
      '<oppia-noninteractive-math math_content-with-value=\"{&amp;quot;'
      'svg_filename&amp;quot;:&amp;quot;mathImg_20220719_221502_sr5wjlbtbn_'
      'height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}\"></oppia-'
      'noninteractive-math><oppia-noninteractive-skillreview></oppia-'
      'noninteractive-skillreview></p><oppia-noninteractive-video>'
      '</oppia-noninteractive-video>'
      '<oppia-noninteractive-math math_content-with-value=\"{&amp;quot;'
      'raw_latex&amp;quot;:&amp;quot;abcde&amp;quot;}\"></oppia-'
      'noninteractive-math>'
      '<oppia-noninteractive-math></oppia-noninteractive-math>'
    )

    EXP_2_STATE_1 = state_domain.State.create_default_state(
        'EXP_2_STATE_1', is_initial_state=False).to_dict()

    EXP_2_STATE_1['interaction'] = {
      'id': 'EndExploration',
      'customization_args': {
        'recommendedExplorationIds': {
          'value': ['1']
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 0
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_1',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_2_STATE_1',
        'feedback': {
          'content_id': 'default_outcome',
          'html': ''
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None,
        'dest_if_really_stuck': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    TODAY_DATE = datetime.datetime.utcnow()
    YEAR_AGO_DATE = (TODAY_DATE - datetime.timedelta(weeks=52)).date()

    def setUp(self):
        super().setUp()

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={
              'EXP_1_STATE_1': self.EXP_1_STATE_1,
              'EXP_1_STATE_2': self.EXP_1_STATE_2,
              'EXP_1_STATE_3': self.EXP_1_STATE_3,
              'EXP_1_STATE_4': self.EXP_1_STATE_4,
              'EXP_1_STATE_5': self.EXP_1_STATE_5,
              'EXP_1_STATE_6': self.EXP_1_STATE_6,
              'EXP_1_STATE_7': self.EXP_1_STATE_7
            }
        )

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='new title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={
              'EXP_2_STATE_1': self.EXP_2_STATE_1
            }
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_state_validation(self) -> None:
        self.put_multi([self.exp_1, self.exp_2])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the state RTE erroneous data are [{{\'state_name\': '
            f'\'EXP_1_STATE_7\', \'rte_components_errors\': [\'State - '
            f'EXP_1_STATE_7 having RTE image tag do not have '
            f'cap-with-value attribute\', \'State - EXP_1_STATE_7 '
            f'having RTE image tag do not have alt-with-value '
            f'attribute\', \'State - EXP_1_STATE_7 having RTE image '
            f'tag do not have filepath-with-value attribute\', \'State - '
            f'EXP_1_STATE_7 having RTE link tag do not have '
            f'text-with-value attribute\', \'State - EXP_1_STATE_7 having '
            f'RTE link tag do not have url-with-value attribute\', \'State - '
            f'EXP_1_STATE_7 having RTE math tag do not have '
            f'raw-latex attribute\', \'State - '
            f'EXP_1_STATE_7 having RTE math tag do not have svg-filename '
            f'attribute\', \'State - EXP_1_STATE_7 having RTE math tag do '
            f'not have math_content-with-value attribute\', '
            f'\'State - EXP_1_STATE_7 having '
            f'RTE skillreview tag do not have text-with-value attribute\', '
            f'\'State - EXP_1_STATE_7 having RTE skillreview tag do not have '
            f'skill_id-with-value attribute\', \'State - EXP_1_STATE_7 having '
            f'RTE video tag do not have start-with-value attribute\', '
            f'\'State - EXP_1_STATE_7 having RTE video tag do not have '
            f'end-with-value attribute\', \'State - EXP_1_STATE_7 having '
            f'RTE video tag do not have video_id-with-value attribute\', '
            f'\'State - EXP_1_STATE_7 having RTE video tag do not have '
            f'autoplay-with-value attribute\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the state text input interaction erroneous data are '
            f'[{{\'state_name\': \'EXP_1_STATE_5\', \'text_input_'
            f'interaction_values\': [\'Rows having value 11 is either '
            f'less than 1 or greater than 10.\', \'Rule - 1 of answer '
            f'group - 0 having rule type StartsWith will never be matched '
            f'because it is made redundant by the above contains rule.\', '
            f'\'Rule - 1 of answer group - 1 having rule type FuzzyEquals '
            f'will never be matched because it is made redundant by the '
            f'above starts with rule.\', \'Rule - 1 of answer group - 1 '
            f'having rule type FuzzyEquals will never be matched because '
            f'it is made redundant by the above starts with rule.\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the state drag drop selection input interaction erroneous '
            f'data are [{{\'state_name\': \'EXP_1_STATE_4\', '
            f'\'drag_drop_interaction_values\': [\'Rule - 0 of answer group '
            f'1 will never be match because it is made redundant by the '
            f'HasElementXAtPositionY rule above.\', \'Rule - 0 of answer '
            f'group 3 will never be match because it is made redundant by '
            f'the IsEqualToOrderingWithOneItemAtIncorrectPosition '
            f'rule above.\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the state item selection input interaction erroneous data '
            f'are [{{\'state_name\': \'EXP_1_STATE_3\', '
            f'\'item_selec_interaction_values\': [\'Rule 0 from answer group '
            f'1 of ItemSelectionInput have same rules.\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the state fraction input interaction erroneous data are '
            f'[{{\'state_name\': \'EXP_1_STATE_2\', '
            f'\'fraction_input_interaction_values\': [\'Rule 1 from answer '
            f'group 0 of FractionInput interaction having rule type '
            f'HasFractionalPartExactlyEqualTo will never be matched because '
            f'it is made redundant by the above rules\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the state numeric input interaction erroneous data are '
            f'[{{\'state_name\': \'EXP_1_STATE_1\', '
            f'\'numeric_input_interaction_values\': [\'Rule 1 from answer '
            f'group 0 will never be matched because it is made '
            f'redundant by the above rules\', \'Rule 2 from answer group 0 '
            f'having rule type equals contains string values.\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}, '
            f'and the invalid end interac values are [{{\'state_name\': '
            f'\'EXP_1_STATE_6\', \'invalid_exps\': [\'EXP_1\', \'EXP_2\', '
            f'\'EXP_5\', \'EXP_4\']}}]'
          )
        ])
