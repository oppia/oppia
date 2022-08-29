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
from core.jobs.batch_jobs import audit_rule_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

(exp_models, opportunity_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.opportunity])


class ExpAuditRuleChecksJobTest(job_test_utils.JobTestBase):
    """Tests for ExpAuditRuleChecksJob"""

    JOB_CLASS = (
      audit_rule_validation_jobs.ExpAuditRuleChecksJob
    )

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    EXPLORATION_ID_4 = '4'
    EXPLORATION_ID_5 = '5'
    EXPLORATION_ID_6 = '6'
    EXPLORATION_ID_7 = '7'
    EXPLORATION_ID_8 = '8'

    # DragAndDrop Interaction.
    EXP_1_STATE_1 = state_domain.State.create_default_state(
        'EXP_1_STATE_1', is_initial_state=False).to_dict()
    EXP_1_STATE_1['interaction'] = {
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
        'value': False
      }
    },
      'answer_groups': [
      {
        'rule_specs': [
          {
            'rule_type': 'HasElementXAtPositionY',
            'inputs': {
              'x': 'ca_choices_17',
              'y': 1
            }
          },
          {
            'rule_type': 'IsEqualToOrdering',
            'inputs': {
              'x': [
                [
                  'ca_choices_17', 'ca_choices_18'
                ],
                [
                  'ca_choices_19'
                ],
                [
                  'ca_choices_20'
                ]
              ]
            }
          },
          {
            'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
            'inputs': {
              'x': [
                [
                  'ca_choices_17'
                ],
                [
                  'ca_choices_18', 'ca_choices_19'
                ],
                [
                  'ca_choices_20'
                ]
              ]
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_1_STATE_1',
          'feedback': {
            'content_id': 'feedback_72',
            'html': '<p>dvds</p>'
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
                  'ca_choices_17', 'ca_choices_18'
                ],
                [
                  'ca_choices_19'
                ],
                [
                  'ca_choices_20'
                ]
              ]
            }
          },
          {
            'rule_type': 'HasElementXBeforeElementY',
            'inputs': {
              'x': 'ca_choices_17',
              'y': 'ca_choices_17'
            }
          },
          {
            'rule_type': 'IsEqualToOrdering',
            'inputs': {
              'x': [
                [
                  'ca_choices_17'
                ],
                [
                  'ca_choices_19'
                ],
                [
                  'ca_choices_18', 'ca_choices_20'
                ]
              ]
            }
          },
          {
            'rule_type': 'IsEqualToOrdering',
            'inputs': {
              'x': [] # type: ignore[dict-item]
            }
          }
        ],
        'outcome': {
          'dest': 'A valid state',
          'feedback': {
            'content_id': 'feedback_72',
            'html': '<p>dvds</p>'
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
          'html': '<p>sd</p>'
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

    EXP_1_STATE_2 = state_domain.State.create_default_state(
        'EXP_1_STATE_2', is_initial_state=False).to_dict()
    EXP_1_STATE_2['interaction'] = {
      'id': 'DragAndDropSortInput',
      'customization_args': {
      'choices': {
        'value': [
          {
            'content_id': 'ca_choices_68',
            'html': '<p>1</p>'
          },
          {
            'content_id': 'ca_choices_69',
            'html': '<p>2</p>'
          },
          {
            'content_id': 'ca_choices_70',
            'html': '<p>3</p>'
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
            'rule_type': 'HasElementXBeforeElementY',
            'inputs': {
              'x': 'ca_choices_68',
              'y': 'ca_choices_69'
            }
          },
          {
            'rule_type': 'HasElementXAtPositionY',
            'inputs': {
              'x': 'ca_choices_68',
              'y': 1
            }
          },
          {
            'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
            'inputs': {
              'x': [
                [
                  'ca_choices_68'
                ],
                [
                  'ca_choices_69'
                ],
                [
                  'ca_choices_70'
                ]
              ]
            }
          },
          {
            'rule_type': 'IsEqualToOrdering',
            'inputs': {
              'x': [
                [
                  'ca_choices_70'
                ],
                [
                  'ca_choices_68'
                ],
                [
                  'ca_choices_69'
                ]
              ]
            }
          }
        ],
        'outcome': {
          'dest': 'A valid state',
          'feedback': {
            'content_id': 'feedback_72',
            'html': '<p>dvds</p>'
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
          'html': '<p>sd</p>'
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

    # Continue Interaction.
    EXP_2_STATE_1 = state_domain.State.create_default_state(
        'EXP_2_STATE_1', is_initial_state=False).to_dict()
    EXP_2_STATE_1['interaction'] = {
      'id': 'Continue',
      'customization_args': {
        'buttonText': {
          'value': {
            'content_id': 'ca_buttonText_0',
            'unicode_str': 'Continueeeeeeeeeeeeeeeeeeeeeeeeee'
          }
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
            'dest': 'EXP_2_STATE_2',
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
          'html': '<p>try</p>'
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

    EXP_2_STATE_2 = state_domain.State.create_default_state(
        'EXP_2_STATE_2', is_initial_state=False).to_dict()
    EXP_2_STATE_2['interaction'] = {
      'id': 'Continue',
      'customization_args': {
        'buttonText': {
          'value': {
            'content_id': 'ca_buttonText_0',
            'unicode_str': 'Continue'
          }
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
            'dest': 'EXP_2_STATE_2',
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
        'dest': 'EXP_2_STATE_2',
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
      'hints': [],
      'solution': None
    }

    # Itemselection interaction.
    EXP_3_STATE_1 = state_domain.State.create_default_state(
        'EXP_3_STATE_1', is_initial_state=False).to_dict()
    EXP_3_STATE_1['interaction'] = {
      'id': 'ItemSelectionInput',
      'customization_args': {
        'minAllowableSelectionCount': {
          'value': 1
        },
        'maxAllowableSelectionCount': {
          'value': 4
        },
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_59',
              'html': '<p></p>'
            },
            {
              'content_id': 'ca_choices_60',
              'html': '<p></p>'
            },
            {
              'content_id': 'ca_choices_61',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_62',
              'html': '<p>1</p>'
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
                  'ca_choices_59'
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_3_STATE_1',
            'feedback': {
              'content_id': 'feedback_63',
              'html': '<p>df</p>'
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
                  'ca_choices_59'
                ]
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': [
                  'ca_choices_62'
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
            'feedback': {
              'content_id': 'feedback_63',
              'html': '<p>df</p>'
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
        'dest': 'EXP_3_STATE_1',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_3_STATE_2 = state_domain.State.create_default_state(
        'EXP_3_STATE_2', is_initial_state=False).to_dict()
    EXP_3_STATE_2['interaction'] = {
      'id': 'ItemSelectionInput',
      'customization_args': {
        'minAllowableSelectionCount': {
          'value': 3
        },
        'maxAllowableSelectionCount': {
          'value': 5
        },
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_59',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_60',
              'html': '<p>2</p>'
            },
            {
              'content_id': 'ca_choices_61',
              'html': '<p>3</p>'
            },
            {
              'content_id': 'ca_choices_62',
              'html': '<p>4</p>'
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
                  'ca_choices_59'
                ]
              }
            },
            {
              'rule_type': 'ContainsAtLeastOneOf',
              'inputs': {
                'x': [] # type: ignore[dict-item]
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': [
                  'ca_choices_59',
                  'ca_choices_60',
                  'ca_choices_61'
                ]
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
            'feedback': {
              'content_id': 'feedback_63',
              'html': '<p>df</p>'
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
        'dest': 'EXP_3_STATE_1',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    # NumericInput interaction.
    EXP_4_STATE_1 = state_domain.State.create_default_state(
        'EXP_4_STATE_1', is_initial_state=True).to_dict()
    EXP_4_STATE_1['interaction'] = {
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
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsGreaterThanOrEqualTo',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsLessThan',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsGreaterThan',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsWithinTolerance',
              'inputs': {
                'x': 'Not a number',
                'tol': 'Not a number'
              }
            },
            {
              'rule_type': 'IsInclusivelyBetween',
              'inputs': {
                'a': 'Not a number',
                'b': 'Not a number'
              }
            },
            {
              'rule_type': 'IsLessThanOrEqualTo',
              'inputs': {
                'x': 4
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 2
              }
            },
            {
              'rule_type': 'IsGreaterThan',
              'inputs': {
                'x': 3
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_4_STATE_1',
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
        },
        {
          'rule_specs': [
            {
              'rule_type': 'IsLessThanOrEqualTo',
              'inputs': {
                'x': 4
              }
            },
            {
              'rule_type': 'IsLessThan',
              'inputs': {
                'x': 3
              }
            },
            {
              'rule_type': 'IsWithinTolerance',
              'inputs': {
                'x': 2,
                'tol': 0
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
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
        'dest': 'EXP_4_STATE_2',
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

    EXP_4_STATE_2 = state_domain.State.create_default_state(
        'EXP_4_STATE_2', is_initial_state=True).to_dict()
    EXP_4_STATE_2['interaction'] = {
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
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsGreaterThanOrEqualTo',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsLessThan',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsGreaterThan',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsGreaterThanOrEqualTo',
              'inputs': {
                'x': 5
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 2
              }
            },
            {
              'rule_type': 'IsInclusivelyBetween',
              'inputs': {
                'a': 3,
                'b': 10
              }
            },
            {
              'rule_type': 'IsWithinTolerance',
              'inputs': {
                'x': 2,
                'tol': 0
              }
            },
            {
              'rule_type': 'IsWithinTolerance',
              'inputs': {
                'x': 2,
                'tol': 1
              }
            }
          ],
          'outcome': {
            'dest': 'Valid state',
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
        },
        {
          'rule_specs': [
            {
              'rule_type': 'IsLessThanOrEqualTo',
              'inputs': {
                'x': 4
              }
            }
          ],
          'outcome': {
            'dest': 'Valid',
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
        'dest': 'EXP_4_STATE_2',
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

    # Image tag.
    EXP_5_STATE_1 = state_domain.State.create_default_state(
        'EXP_5_STATE_1', is_initial_state=False).to_dict()
    EXP_5_STATE_1['content']['html'] = (
      '<p>dffddfdffdfd</p>\n\n<p>&nbsp;</p>\n<oppia-noninteractive-image>'
      '</oppia-noninteractive-image>\n\n<p>&nbsp;</p>\n\n<p>&nbsp;</p>\n\n<p>'
      '<oppia-noninteractive-link></oppia-noninteractive-link>'
      '<oppia-noninteractive-math math_content-with-value=\'{&amp;quot;'
      'svg_filename&amp;quot;:&amp;quot;mathImg_20220719_221502_sr5wjlbtbn_'
      'height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}\'></oppia-'
      'noninteractive-math><oppia-noninteractive-skillreview></oppia-'
      'noninteractive-skillreview></p><oppia-noninteractive-video>'
      '</oppia-noninteractive-video>'
      '<oppia-noninteractive-math math_content-with-value=\'{&amp;quot;'
      'raw_latex&amp;quot;:&amp;quot;abcde&amp;quot;}\'></oppia-'
      'noninteractive-math>'
      '<oppia-noninteractive-math></oppia-noninteractive-math>'
      '<oppia-noninteractive-image alt-with-value=\'&amp;quot;'
      'aaaaaaaaaaaaaaaaaaaa&amp;quot;\' caption-with-value='
      '\'&amp;quot;&amp;quot;\' filepath-with-value=\'&amp;quot;'
      'img_2_0xmbq9hwfz_height_276_width_490.svg&amp;quot;\'>'
      '</oppia-noninteractive-image><oppia-noninteractive-image>'
      '</oppia-noninteractive-image>'
    )

    # MultipleChoiceInput interaction.
    EXP_6_STATE_1 = state_domain.State.create_default_state(
        'EXP_6_STATE_1', is_initial_state=False).to_dict()
    EXP_6_STATE_1['interaction'] = {
      'id': 'MultipleChoiceInput',
      'customization_args': {
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_1',
              'html': ''
            },
            {
              'content_id': 'ca_choices_2',
              'html': ''
            },
            {
              'content_id': 'ca_choices_3',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_4',
              'html': '<p>1</p>'
            }
          ]
        },
        'showChoicesInShuffledOrder': {
          'value': True
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 3
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_6_STATE_1',
            'dest_if_really_stuck': None,
            'feedback': {
              'content_id': 'feedback_5',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 3
              }
            }
          ],
          'outcome': {
            'dest': 'end',
            'dest_if_really_stuck': None,
            'feedback': {
              'content_id': 'feedback_5',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'end',
        'dest_if_really_stuck': None,
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fd</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_6_STATE_2 = state_domain.State.create_default_state(
        'EXP_6_STATE_2', is_initial_state=False).to_dict()
    EXP_6_STATE_2['interaction'] = {
      'id': 'MultipleChoiceInput',
      'customization_args': {
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_1',
              'html': ''
            },
            {
              'content_id': 'ca_choices_2',
              'html': '2'
            },
            {
              'content_id': 'ca_choices_3',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_4',
              'html': '<p>3</p>'
            },
            {
              'content_id': 'ca_choices_4',
              'html': '<p>4</p>'
            }
          ]
        },
        'showChoicesInShuffledOrder': {
          'value': True
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 3
              }
            },
            {
              'rule_type': 'Not Equals',
              'inputs': {
                'x': 2
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
            'dest_if_really_stuck': None,
            'feedback': {
              'content_id': 'feedback_5',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        },
        {
          'rule_specs': [
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 3
              }
            },
            {
              'rule_type': 'Not Equals',
              'inputs': {
                'x': 2
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_6_STATE_2',
            'dest_if_really_stuck': None,
            'feedback': {
              'content_id': 'feedback_5',
              'html': ''
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_6_STATE_2',
        'dest_if_really_stuck': None,
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fd</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': None,
        'missing_prerequisite_skill_id': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_7_STATE_1 = state_domain.State.create_default_state(
        'EXP_7_STATE_1', is_initial_state=True).to_dict()

    EXP_7_STATE_1['interaction'] = {
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
              'rule_type': 'HasDenominatorEqualTo',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsLessThan',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 5, # type: ignore[dict-item]
                  'denominator': 2 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'IsGreaterThan',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 10, # type: ignore[dict-item]
                  'denominator': 2 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'IsExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 11, # type: ignore[dict-item]
                  'denominator': 3 # type: ignore[dict-item]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_7_STATE_1',
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
        },
        {
          'rule_specs': [
            {
              'rule_type': 'HasFractionalPartExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 2, # type: ignore[dict-item]
                  'denominator': 1 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'HasDenominatorEqualTo',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 5, # type: ignore[dict-item]
                  'denominator': 3 # type: ignore[dict-item]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
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
        },
        {
          'rule_specs': [
            {
              'rule_type': 'IsEquivalentTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 11, # type: ignore[dict-item]
                  'denominator': 3 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'IsExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 1, # type: ignore[dict-item]
                  'numerator': 5, # type: ignore[dict-item]
                  'denominator': 4 # type: ignore[dict-item]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_7_STATE_1',
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
        'dest': 'EXP_7_STATE_1',
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

    EXP_7_STATE_2 = state_domain.State.create_default_state(
        'EXP_7_STATE_2', is_initial_state=True).to_dict()

    EXP_7_STATE_2['interaction'] = {
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
              'rule_type': 'HasDenominatorEqualTo',
              'inputs': {
                'x': 'Not a number'
              }
            },
            {
              'rule_type': 'IsLessThan',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 5, # type: ignore[dict-item]
                  'denominator': 2 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'IsGreaterThan',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 10, # type: ignore[dict-item]
                  'denominator': 2 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'IsExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 11, # type: ignore[dict-item]
                  'denominator': 3 # type: ignore[dict-item]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_7_STATE_2',
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
        },
        {
          'rule_specs': [
            {
              'rule_type': 'HasFractionalPartExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 2, # type: ignore[dict-item]
                  'denominator': 1 # type: ignore[dict-item]
                }
              }
            },
            {
              'rule_type': 'HasDenominatorEqualTo',
              'inputs': {
                'x': 10
              }
            },
            {
              'rule_type': 'IsExactlyEqualTo',
              'inputs': {
                'f': {
                  'isNegative': False, # type: ignore[dict-item]
                  'wholeNumber': 0, # type: ignore[dict-item]
                  'numerator': 5, # type: ignore[dict-item]
                  'denominator': 3 # type: ignore[dict-item]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
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
        'dest': 'EXP_7_STATE_1',
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

    EXP_8_STATE_1 = state_domain.State.create_default_state(
      'EXP_8_STATE_1', is_initial_state=False).to_dict()

    EXP_8_STATE_1['interaction'] = {
      'id': 'TextInput',
      'customization_args': {
        'placeholder': {
          'value': {
            'content_id': 'ca_placeholder_23',
            'unicode_str': ''
          }
        },
        'rows': {
          'value': 9
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
                  'contentId': 'rule_input_30',
                  'normalizedStrSet': [
                    'exci',
                    'deve'
                  ]
                }
              }
            },
            {
              'rule_type': 'StartsWith',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_30',
                  'normalizedStrSet': ['z']
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_8_STATE_1',
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
              'rule_type': 'Equals',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_29',
                  'normalizedStrSet': [
                    'exciting',
                    'developer'
                  ]
                }
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_26',
                  'normalizedStrSet': [
                    'helloooo'
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
            },
            {
              'rule_type': 'StartsWith',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_30',
                  'normalizedStrSet': ['z']
                }
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
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
        'dest': 'EXP_8_STATE_1',
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

    EXP_8_STATE_2 = state_domain.State.create_default_state(
      'EXP_8_STATE_2', is_initial_state=False).to_dict()

    EXP_8_STATE_2['interaction'] = {
      'id': 'TextInput',
      'customization_args': {
        'placeholder': {
          'value': {
            'content_id': 'ca_placeholder_23',
            'unicode_str': ''
          }
        },
        'rows': {
          'value': 9
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
            }
          ],
          'outcome': {
            'dest': 'EXP_8_STATE_1',
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
              'rule_type': 'Equals',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_29',
                  'normalizedStrSet': [
                    'exciting',
                    'developer'
                  ]
                }
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_26',
                  'normalizedStrSet': [
                    'helloooo'
                  ]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'A valid state',
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
        'dest': 'EXP_8_STATE_2',
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

    TODAY_DATE = datetime.datetime.utcnow()
    YEAR_AGO_DATE = str((TODAY_DATE - datetime.timedelta(weeks=52)).date())

    def setUp(self) -> None:
        super().setUp()

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='title1',
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
              'EXP_1_STATE_2': self.EXP_1_STATE_2
            }
        )

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='title2',
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
              'EXP_2_STATE_1': self.EXP_2_STATE_1,
              'EXP_2_STATE_2': self.EXP_2_STATE_2
            }
        )

        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='title3',
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
              'EXP_3_STATE_1': self.EXP_3_STATE_1,
              'EXP_3_STATE_2': self.EXP_3_STATE_2
            }
        )

        self.exp_4 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_4,
            title='title4',
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
              'EXP_4_STATE_1': self.EXP_4_STATE_1,
              'EXP_4_STATE_2': self.EXP_4_STATE_2
            }
        )

        self.exp_5 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_5,
            title='title5',
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
              'EXP_5_STATE_1': self.EXP_5_STATE_1
            }
        )

        self.exp_6 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_6,
            title='title6',
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
              'EXP_6_STATE_1': self.EXP_6_STATE_1,
              'EXP_6_STATE_2': self.EXP_6_STATE_2
            }
        )

        self.exp_7 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_7,
            title='title6',
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
              'EXP_7_STATE_1': self.EXP_7_STATE_1,
              'EXP_7_STATE_2': self.EXP_7_STATE_2
            }
        )

        self.exp_8 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_8,
            title='title6',
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
              'EXP_8_STATE_1': self.EXP_8_STATE_1,
              'EXP_8_STATE_2': self.EXP_8_STATE_2
            }
        )

        self.public_exp_summary_1 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_1,
            title='public exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=[''],
            contributors_summary={},
            version=0,
            exploration_model_last_updated=None,
            exploration_model_created_on=None,
        )
        self.public_exp_summary_1.update_timestamps()

        self.public_exp_summary_2 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_3,
            title='public exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=[''],
            contributors_summary={},
            version=0,
            exploration_model_last_updated=None,
            exploration_model_created_on=None,
        )
        self.public_exp_summary_2.update_timestamps()

        self.public_exp_summary_3 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_4,
            title='public exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=[''],
            contributors_summary={},
            version=0,
            exploration_model_last_updated=None,
            exploration_model_created_on=None,
        )
        self.public_exp_summary_3.update_timestamps()

        self.public_exp_summary_4 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_6,
            title='public exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=[''],
            contributors_summary={},
            version=0,
            exploration_model_last_updated=None,
            exploration_model_created_on=None,
        )
        self.public_exp_summary_4.update_timestamps()

        self.public_exp_summary_5 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_7,
            title='public exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=[''],
            contributors_summary={},
            version=0,
            exploration_model_last_updated=None,
            exploration_model_created_on=None,
        )
        self.public_exp_summary_5.update_timestamps()

        self.public_exp_summary_6 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_8,
            title='public exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=[''],
            contributors_summary={},
            version=0,
            exploration_model_last_updated=None,
            exploration_model_created_on=None,
        )
        self.public_exp_summary_6.update_timestamps()

        self.opportunity_model_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_5,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_model_2 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_6,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_model_3 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_1,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_model_4 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_3,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_model_5 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_4,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_model_6 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_7,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_model_7 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_8,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.mock_function_for_exp_fetcher()

        self.mock_convert_to_model_pair()

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_drag_drop_interaction(self) -> None:
        self.put_multi(
          [self.exp_1, self.opportunity_model_3, self.public_exp_summary_1]
        )
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid drag drop states are '
            f'[{{\'state_name\': \'EXP_1_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID DRAG DROP RULES SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated drag drop states are '
            f'[{{\'state_name\': \'EXP_1_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF CURATED EXPS WITH INVALID DRAG DROP RULES SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid public drag drop states are '
            f'[{{\'state_name\': \'EXP_1_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF PUBLIC EXPS WITH INVALID DRAG DROP RULES SUCCESS: 1'
          )
        ])

    def test_continue_interaction(self) -> None:
        self.put_multi([self.exp_2])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            'The invalid language codes are en'
          )
        ])

    def test_item_interaction(self) -> None:
        self.put_multi(
          [self.exp_3, self.opportunity_model_4, self.public_exp_summary_2]
        )
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 3, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid item selection states are [{{\'state_name\': '
            f'\'EXP_3_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID ITEM SELECTION SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 3, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated item selection states are '
            f'[{{\'state_name\': \'EXP_3_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED ITEM SELECTION SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 3, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid public item selection states are '
            f'[{{\'state_name\': \'EXP_3_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID PUBLIC ITEM SELECTION SUCCESS: 1'
          )
        ])

    def test_numeric_interaction(self) -> None:
        self.put_multi(
          [self.exp_4, self.opportunity_model_5, self.public_exp_summary_3]
        )
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 4, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid numeric input states are '
            f'[{{\'state_name\': \'EXP_4_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID NUMERIC INPUT RULES SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 4, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated numeric input states are '
            f'[{{\'state_name\': \'EXP_4_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID NUMERIC INPUT CURATED '
            'RULES SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 4, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid public numeric input states are '
            f'[{{\'state_name\': \'EXP_4_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID NUMERIC INPUT PUBLIC '
            'RULES SUCCESS: 1'
          )
        ])

    def test_rte_image(self) -> None:
        self.put_multi([self.exp_5, self.opportunity_model_1])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of curated exp is 5, '
            f'created on {self.YEAR_AGO_DATE}, and the invalid '
            f'RTE image states are [\'EXP_5_STATE_1\']'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID RTE IMAGE SUCCESS: 1'
          )
        ])

    def test_multiple_choice_interaction(self) -> None:
        self.put_multi(
          [self.exp_6, self.opportunity_model_2, self.public_exp_summary_4]
        )
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 6, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid multiple choice input states are '
            f'[{{\'state_name\': \'EXP_6_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 6, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated multiple choice input states are '
            f'[{{\'state_name\': \'EXP_6_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 6, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated multiple choice interaction having '
            f'choices less than 4 are [\'EXP_6_STATE_1\']'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 6, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid public multiple choice input states are '
            f'[{{\'state_name\': \'EXP_6_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID MULTIPLE CHOICE INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID PUBLIC MULTIPLE CHOICE '
            'INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED MULTIPLE CHOICE '
            'INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED MULTIPLE CHOICE INPUT '
            'INTERACTION CHOICES LESS THAN 4 SUCCESS: 1'
          )
        ])

    def test_fraction_interaction(self) -> None:
        self.put_multi(
          [self.exp_7, self.opportunity_model_6, self.public_exp_summary_5]
        )
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 7, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid fraction input states are '
            f'[{{\'state_name\': \'EXP_7_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID FRACTION INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 7, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated fraction input states are '
            f'[{{\'state_name\': \'EXP_7_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED FRACTION INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 7, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid public fraction input states are '
            f'[{{\'state_name\': \'EXP_7_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID PUBLIC FRACTION INPUT SUCCESS: 1'
          )
        ])

    def test_text_interaction(self) -> None:
        self.put_multi(
          [self.exp_8, self.opportunity_model_7, self.public_exp_summary_6]
        )
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 8, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid text input states are '
            f'[{{\'state_name\': \'EXP_8_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID TEXT INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 8, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid curated text input states are '
            f'[{{\'state_name\': \'EXP_8_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED TEXT INPUT SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 8, created on {self.YEAR_AGO_DATE}, '
            f'and the invalid public text input states are '
            f'[{{\'state_name\': \'EXP_8_STATE_1\', \'ans_group_idx\': [1]}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID PUBLIC TEXT INPUT SUCCESS: 1'
          )
        ])

    def mock_function_for_exp_fetcher(self) -> None:
        temp_tuple = ('invalid_model', 'invalid_opportunity_model')
        model = (
          audit_rule_validation_jobs.ExpAuditRuleChecksJob.
          get_exploration_from_models(temp_tuple)
        )

        self.assertEqual(
          model, None
        )

        model = (
          audit_rule_validation_jobs.ExpAuditRuleChecksJob.
          get_exploration_from_models('invalid_model')
        )

        self.assertEqual(
          model, None
        )

    def mock_convert_to_model_pair(self) -> None:
        temp_tuple = (
          [self.exp_1, self.exp_2],
          [self.opportunity_model_1, self.opportunity_model_2]
        )
        model = (
            audit_rule_validation_jobs.ExpAuditRuleChecksJob.
            convert_into_model_pair(temp_tuple)
        )

        self.assertEqual(
          model, (None, None)
        )
