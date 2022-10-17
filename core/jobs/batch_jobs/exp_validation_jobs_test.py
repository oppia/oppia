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
from core.jobs.batch_jobs import exp_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, opportunity_models) = models.Registry.import_models([
  models.Names.EXPLORATION,
  models.Names.OPPORTUNITY
])


class ExpStateValidationJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exp_validation_jobs.ExpStateValidationJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    EXPLORATION_ID_4 = '4'
    EXPLORATION_ID_5 = '5'
    EXPLORATION_ID_6 = '6'

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
          'rule_specs': [],
          'outcome': {
            'dest': 'Not valid state',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': 'Not None',
            'missing_prerequisite_skill_id': None,
            'dest_if_really_stuck': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': 'Not None'
        }
      ],
      'default_outcome': {
        'dest': 'Not valid state',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>try</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': 'Not None',
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
        'EXP_1_STATE_2', is_initial_state=False).to_dict()

    EXP_1_STATE_2['interaction'] = {
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
              'rule_type': 'Equals',
              'inputs': {
                'x': 0
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_1_STATE_2',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': True,
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

    EXP_2_STATE_1 = state_domain.State.create_default_state(
        'EXP_2_STATE_1', is_initial_state=True).to_dict()

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
      'id': 'EndExploration',
      'customization_args': {
        'recommendedExplorationIds': {
          'value': ['EXP_1', 'EXP_2', 'EXP_5', 'EXP_4']
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

    EXP_2_STATE_3 = state_domain.State.create_default_state(
        'EXP_2_STATE_3', is_initial_state=False).to_dict()
    EXP_2_STATE_3['interaction'] = {
      'id': 'TextInput',
      'customization_args': {
        'placeholder': {
          'value': {
            'content_id': 'ca_placeholder_0',
            'unicode_str': ''
          }
        },
        'rows': {
          'value': 1
        }
      },
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'FuzzyEquals',
              'inputs': {
                'x': {
                  'contentId': 'rule_input_2',
                  'normalizedStrSet': [
                    'a',
                    'b'
                  ]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_3',
            'feedback': {
              'content_id': 'feedback_1',
              'html': '<p>sdvds</p>'
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
        'dest': 'EXP_2_STATE_3',
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

    EXP_2_STATE_4 = state_domain.State.create_default_state(
        'EXP_2_STATE_4', is_initial_state=False).to_dict()
    EXP_2_STATE_4['interaction'] = {
      'id': 'MultipleChoiceInput',
      'customization_args': {
        'choices': {
          'value': [
            {
              'content_id': 'ca_choices_0',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_1',
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_2',
              'html': '<p></p>'
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
                'x': 0
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_4',
            'feedback': {
              'content_id': 'feedback_19',
              'html': '<p>try</p>'
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
                'x': 1
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_4',
            'feedback': {
              'content_id': 'feedback_20',
              'html': '<p>try</p>'
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
                'x': 1
              }
            },
            {
              'rule_type': 'Equals',
              'inputs': {
                'x': 2
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_4',
            'feedback': {
              'content_id': 'feedback_20',
              'html': '<p>try</p>'
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
        'dest': 'EXP_2_STATE_3',
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

    EXP_2_STATE_5 = state_domain.State.create_default_state(
        'EXP_2_STATE_5', is_initial_state=False).to_dict()
    EXP_2_STATE_5['interaction'] = {
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
              'rule_type': 'IsWithinTolerance',
              'inputs': {
                'tol': -1,
                'x': 5
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_5',
            'feedback': {
              'content_id': 'feedback_0',
              'html': '<p>dvfdf</p>'
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
              'rule_type': 'IsInclusivelyBetween',
              'inputs': {
                'a': 10,
                'b': 2
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_5',
            'feedback': {
              'content_id': 'feedback_1',
              'html': '<p>dfb</p>'
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
        'dest': 'EXP_2_STATE_5',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fre</p>'
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

    EXP_2_STATE_6 = state_domain.State.create_default_state(
        'EXP_2_STATE_6', is_initial_state=False).to_dict()
    EXP_2_STATE_6['interaction'] = {
      'id': 'NumberWithUnits',
      'customization_args': {},
      'answer_groups': [
        {
          'rule_specs': [
            {
              'rule_type': 'IsEquivalentTo',
              'inputs': {
                'f': {
                  'type': 'real',
                  'real': 2,
                  'fraction': {
                    'isNegative': False,
                    'wholeNumber': 0,
                    'numerator': 0,
                    'denominator': 1
                  },
                  'units': [
                    {
                      'unit': 'km',
                      'exponent': 1
                    },
                    {
                      'unit': 'hr',
                      'exponent': -1
                    }
                  ]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_6',
            'feedback': {
              'content_id': 'feedback_0',
              'html': '<p>dfv</p>'
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
              'rule_type': 'IsEqualTo',
              'inputs': {
                'f': {
                  'type': 'real',
                  'real': 2,
                  'fraction': {
                    'isNegative': False,
                    'wholeNumber': 0,
                    'numerator': 0,
                    'denominator': 1
                  },
                  'units': [
                    {
                      'unit': 'km',
                      'exponent': 1
                    },
                    {
                      'unit': 'hr',
                      'exponent': -1
                    }
                  ]
                }
              }
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_6',
            'feedback': {
              'content_id': 'feedback_1',
              'html': '<p>sdv</p>'
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
        'dest': 'EXP_2_STATE_6',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>fds</p>'
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

    EXP_2_STATE_7 = state_domain.State.create_default_state(
        'EXP_2_STATE_7', is_initial_state=False).to_dict()
    EXP_2_STATE_7['interaction'] = {
      'id': 'ItemSelectionInput',
      'customization_args': {
        'minAllowableSelectionCount': {
          'value': 6
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
              'html': '<p>1</p>'
            },
            {
              'content_id': 'ca_choices_61',
              'html': '<p>3</p>'
            },
            {
              'content_id': 'ca_choices_62',
              'html': '<p></p>'
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
            'dest': 'EXP_2_STATE_7',
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
            }
          ],
          'outcome': {
            'dest': 'EXP_2_STATE_7',
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
        'dest': 'EXP_2_STATE_7',
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

    EXP_3_STATE_1 = state_domain.State.create_default_state(
        'EXP_3_STATE_1', is_initial_state=True).to_dict()
    EXP_3_STATE_1['content']['html'] = (
    '"<p><oppia-noninteractive-link'
    ' text-with-value=\"&amp;quot;&amp;quot;\"'
    ' url-with-value=\"&amp;quot;http://www.example.com&amp;quot;\">'
    '</oppia-noninteractive-link></p>\n\n<p><oppia-noninteractive-math'
    ' math_content-with-value=\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;'
    '&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;'
    'mathImg.svgas&amp;quot;}\"></oppia-noninteractive-math>'
    '<oppia-noninteractive-skillreview skill_id-with-value='
    '\"&amp;quot;&amp;quot;\" text-with-value=\"&amp;quot;'
    '&amp;quot;\"></oppia-noninteractive-skillreview>&nbsp;heading'
    '</p><oppia-noninteractive-image alt-with-value=\"&amp;quot;'
    'bbb&amp;quot;\" caption-with-value=\"&amp;quot;aaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    '&amp;quot;\" filepath-with-value=\"&amp;quot;img_1'
    '.svgg&amp;quot;\"></oppia-noninteractive-image>'
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;'
    'aaaaaaaaaaaaaaaaaaaa&amp;quot;\" caption-with-value='
    '\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;'
    'img_2_0xmbq9hwfz_height_276_width_490.svg&amp;quot;\">'
    '</oppia-noninteractive-image><oppia-noninteractive-video '
    'autoplay-with-value=\"true\" end-with-value=\"11\" '
    'start-with-value=\"13\"'
    ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
    'quot;\"></oppia-noninteractive-video>'
    '"<oppia-noninteractive-video '
    'autoplay-with-value=\"&amp;quot;&amp;quot;\" end-with-value=\"11\" '
    'start-with-value=\"10\"'
    ' video_id-with-value=\"&amp;quot;&amp;'
    'quot;\"></oppia-noninteractive-video>'
    )

    EXP_4_STATE_1 = state_domain.State.create_default_state(
        'EXP_4_STATE_1', is_initial_state=True).to_dict()

    EXP_5_STATE_1 = state_domain.State.create_default_state(
        'EXP_5_STATE_1', is_initial_state=False).to_dict()
    EXP_5_STATE_1['interaction'] = {
      'id': 'DragAndDropSortInput',
      'customization_args': {
      'choices': {
        'value': [
          {
            'content_id': 'ca_choices_68',
            'html': '<p></p>'
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
            'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
            'inputs': {
              'x': [
                [
                  'ca_choices_68'
                ],
                [
                  'ca_choices_69', 'ca_choices_70'
                ],
                [
                  'ca_choices_71'
                ]
              ]
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_1',
          'feedback': {
            'content_id': 'feedback_71',
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
            'rule_type': 'HasElementXBeforeElementY',
            'inputs': {
              'x': 'ca_choices_68',
              'y': 'ca_choices_68'
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_1',
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
        'dest': 'EXP_5_STATE_1',
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

    EXP_5_STATE_2 = state_domain.State.create_default_state(
        'EXP_5_STATE_2', is_initial_state=False).to_dict()
    EXP_5_STATE_2['interaction'] = {
      'id': 'FractionInput',
      'customization_args': {
        'requireSimplestForm': {
          'value': True
        },
        'allowImproperFraction': {
          'value': False
        },
        'allowNonzeroIntegerPart': {
          'value': False
        },
        'customPlaceholder': {
          'value': {
            'content_id': 'ca_customPlaceholder_73',
            'unicode_str': ''
          }
        }
      },
      'answer_groups': [
      {
        'rule_specs': [
          {
            'rule_type': 'HasFractionalPartExactlyEqualTo',
            'inputs': {
              'f': {
                'isNegative': False,
                'wholeNumber': 0,
                'numerator': 1,
                'denominator': 0
              }
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_2',
          'feedback': {
            'content_id': 'feedback_74',
            'html': '<p>dfb</p>'
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
                'isNegative': False,
                'wholeNumber': 0,
                'numerator': 6,
                'denominator': 4
              }
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_2',
          'feedback': {
            'content_id': 'feedback_74',
            'html': '<p>dfb</p>'
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
            'rule_type': 'HasIntegerPartEqualTo',
            'inputs': {
              'x': 5
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_2',
          'feedback': {
            'content_id': 'feedback_74',
            'html': '<p>dfb</p>'
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
            'rule_type': 'IsExactlyEqualTo',
            'inputs': {
              'f': {
                'isNegative': False,
                'wholeNumber': 3,
                'numerator': 0,
                'denominator': 0
              }
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_2',
          'feedback': {
            'content_id': 'feedback_74',
            'html': '<p>dfb</p>'
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
            'rule_type': 'HasDenominatorEqualTo',
            'inputs': {
              'x': 0
            }
          }
        ],
        'outcome': {
          'dest': 'EXP_5_STATE_2',
          'feedback': {
            'content_id': 'feedback_74',
            'html': '<p>dfb</p>'
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
        'dest': 'EXP_5_STATE_2',
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

    EXP_5_STATE_3 = state_domain.State.create_default_state(
        'EXP_5_STATE_3', is_initial_state=False).to_dict()
    EXP_5_STATE_3['interaction'] = {
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
            'html': '<p>1</p>'
          }
        ]
      },
      'allowMultipleItemsInSamePosition': {
        'value': False
      }
    },
      'answer_groups': [
    ],
      'default_outcome': {
        'dest': 'EXP_5_STATE_3',
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

    EXP_6_STATE_1 = state_domain.State.create_default_state(
        'EXP_6_STATE_1', is_initial_state=True).to_dict()
    EXP_6_STATE_1['content']['html'] = (
      '<oppia-noninteractive-image '
      'filepath-with-value="&quot;img.svgg&quot;" caption-with-value='
      '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
      '</oppia-noninteractive-image><oppia-noninteractive-image '
      'filepath-with-value="&quot;img2.svg&quot;" caption-with-value='
      '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
      '</oppia-noninteractive-image>'
    )

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
            states={'EXP_1_STATE_1': self.EXP_1_STATE_1,
            'EXP_1_STATE_2': self.EXP_1_STATE_2}
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
            'EXP_2_STATE_1': self.EXP_2_STATE_1,
            'EXP_2_STATE_2': self.EXP_2_STATE_2,
            'EXP_2_STATE_3': self.EXP_2_STATE_3,
            'EXP_2_STATE_4': self.EXP_2_STATE_4,
            'EXP_2_STATE_5': self.EXP_2_STATE_5,
            'EXP_2_STATE_6': self.EXP_2_STATE_6,
            'EXP_2_STATE_7': self.EXP_2_STATE_7
            }
        )

        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='another title',
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
            states={'EXP_3_STATE_1': self.EXP_3_STATE_1}
        )

        self.exp_4 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_4,
            title='different title',
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
            states={'EXP_4_STATE_1': self.EXP_4_STATE_1}
        )

        self.exp_5 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_5,
            title='titles',
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
            states={'EXP_5_STATE_1': self.EXP_5_STATE_1,
            'EXP_5_STATE_2': self.EXP_5_STATE_2,
            'EXP_5_STATE_3': self.EXP_5_STATE_3
            }
        )

        self.exp_6 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_6,
            title='titles',
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
            states={'EXP_6_STATE_1': self.EXP_6_STATE_1
            }
        )

        self.opportunity_model = self.create_model(
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

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_one_valid_model(self) -> None:
        self.put_multi([self.exp_4])
        self.assert_job_output_is([])

    def test_run_with_state_rte_image_validation(self) -> None:
        self.put_multi([self.exp_6, self.opportunity_model])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of curated exp is 6, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state RTE image having non svg extension '
            f'[{{\'state_name\': \'EXP_6_STATE_1\', \'rte_image_errors\': '
            f'[\'State - EXP_6_STATE_1 Image tag filepath value does not '
            f'have svg extension having value img.svgg.\']}}]'
          )
        ])

    def test_run_with_state_validation(self) -> None:
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state erroneous data are '
            f'[{{\'state_name\': \'EXP_1_STATE_1\', '
            f'\'tagged_skill_misconception_ids\': [\'The '
            f'tagged_skill_misconception_id of answer group 0 is not None.\']'
            f', \'not_single_rule_spec\': '
            f'[\'There is no rule present in answer group 0, atleast one '
            f'is required.\'], \'invalid_refresher_exploration_id\': '
            f'[\'The refresher_exploration_id of answer group 0 is not '
            f'None.\', \'The refresher_exploration_id of default '
            f'outcome is not None.\'], '
            f'\'invalid_destinations\': [\'The destination '
            f'Not valid state of answer group 0 is not valid.\'], '
            f'\'invalid_default_outcome_dest\': [\'The destination of default'
            f' outcome is not valid, the value is Not valid state\']}}, '
            f'{{\'state_name\': \'EXP_1_STATE_2\','
            f' \'wrong_labelled_as_correct_values\': [\'The value of '
            f'labelled_as_correct of answer group 0 is True but the '
            f'destination is the state itself.\']}}]'
          )
        ])

    def test_run_with_state_drag_frac_interaction_validation(self) -> None:
        self.put_multi([self.exp_5])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 5, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state fraction, numeric and number '
            f'with units interaction '
            f'erroneous data are [{{\'state_name\': '
            f'\'EXP_5_STATE_2\', \'fraction_interaction_invalid_values\': '
            f'[\'The rule 0 of answer group 0 has denominator less than or '
            f'equal to zero.\', \'The rule 0 of answer group 0 '
            f'do not have value in '
            f'proper fraction\', \'The rule 0 of answer group 1 do not have '
            f'value in simple form\', \'The rule 0 of answer group 1 do not '
            f'have value in proper fraction\', \'The rule 0 of answer group '
            f'2 has non zero integer part having rule type '
            f'HasIntegerPartEqualTo.\', \'The rule 0 of answer group 3 has '
            f'non zero integer part.\', \'The rule 0 of answer group 4 has '
            f'denominator less than or equal to zero having rule type '
            f'HasDenominatorEqualTo.\']}}]'
            ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 5, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state continue, end and '
            f'drag and drop interactions '
            f'erroneous data are [{{\'state_name\': \'EXP_5_STATE_1\', '
            f'\'drag_drop_interaction_values\': [\'The rule 0 of answer '
            f'group 0 have multiple items at same place when multiple '
            f'items in same position settings is turned off.\', \'The '
            f'rule 0 of answer group 0 having rule type - '
            f'IsEqualToOrderingWithOneItemAtIncorrectPosition should '
            f'not be there when the multiple items in same position '
            f'setting is turned off.\', \'The rule 0 of answer group 1 '
            f'the value 1 and value 2 cannot be same when rule type is '
            f'HasElementXBeforeElementY\', \'Atleast 2 choices should be '
            f'there\', \'There should not be any empty choices\']}}'
            f', {{\'state_name\': '
            f'\'EXP_5_STATE_3\', \'drag_drop_interaction_values\': '
            f'[\'There should not be any duplicate choices\']}}]'
          )
        ])

    def test_run_with_state_interaction_validaton(self) -> None:
        self.put_multi([self.exp_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
              f'The id of exp is 2, created on {str(self.YEAR_AGO_DATE)}'
              f', and the state multiple choice and '
              f'item selection interactions '
              f'erroneous data are [{{\'state_name\': \'EXP_2_STATE_4\', '
              f'\'mc_interaction_invalid_values\': [\'rule - 0, answer '
              f'group - 2 is already present.\', '
              f'\'There should not be any empty choices\', '
              f'\'There should not be any duplicate choices\', '
              f'\'All choices have feedback and still has default '
              f'outcome\']}}, {{\'state_name\': '
              f'\'EXP_2_STATE_7\', \'item_selec_interaction_values\': '
              f'[\'Selected choices of rule 0 of answer group 0 either less '
              f'than min_selection_value or greter than max_selection_value.\','
              f' \'Selected choices of rule 0 of answer group 1 either '
              f'less than min_selection_value or greter than '
              f'max_selection_value.\', \'Min value which is 6 is greater '
              f'than max value which is 5\', \'Number of choices which is 4 '
              f'is lesser than the min value selection which is 6\', '
              f'\'There should not be any empty choices\', '
              f'\'There should not be any duplicate choices\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
              f'The id of exp is 2, created on {str(self.YEAR_AGO_DATE)}'
              f', and the state fraction, numeric and number '
              f'with units interaction '
              f'erroneous data are ['
              f'{{\'state_name\': \'EXP_2_STATE_5\', '
              f'\'numeric_input_interaction_values\': [\'The rule 0 of answer '
              f'group 0 having rule type IsWithinTolerance have tol value '
              f'less than zero.\', \'The rule 0 of answer group 1 having rule '
              f'type IsInclusivelyBetween have a value greater than b '
              f'value\']}}, {{\'state_name\': \'EXP_2_STATE_6\', '
              f'\'number_with_units_errors\': [\'The rule 0 of answer group 1 '
              f'has rule type equal is coming after rule type equivalent '
              f'having same value\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
              f'The id of exp is 2, created on {str(self.YEAR_AGO_DATE)}'
              f', and the state continue, end and '
              f'drag and drop interactions '
              f'erroneous data are [{{\'state_name\': \'EXP_2_STATE_1\', '
              f'\'continue_interaction_invalid_values\': [\'The text value '
              f'is invalid, either it is empty or the character length is '
              f'more than 20 or it is None, the value is Continueeeeeeeeeeeeee'
              f'eeeeeeeeeeee\', \'There should be '
              f'no answer groups present in the continue exploration '
              f'interaction.\']}}, {{\'state_name\': \'EXP_2_STATE_2\', '
              f'\'end_interaction_invalid_values\': [\'There should be no '
              f'default value present in the end exploration interaction.\', '
              f'\'There should be no answer groups present in the end '
              f'exploration interaction.\', \'Total number of recommended '
              f'explorations should not be more than 3, found 4.\']}}]'
            )
        ])

    def test_run_with_state_rte_validation(self) -> None:
        self.put_multi([self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
              f'The id of exp is 3, created on {str(self.YEAR_AGO_DATE)}'
              f', and the state RTE erroneous data are '
              f'[{{\'state_name\': \'EXP_3_STATE_1\', '
              f'\'rte_components_errors\':'
              f' [\'State - EXP_3_STATE_1 Image tag caption value is greater '
              f'than 500 having value img_1.svgg.\', \'State - '
              f'EXP_3_STATE_1 Image tag alt value is '
              f'less than 5 having value img_1.svgg.\', '
              f'\'State - EXP_3_STATE_1 Link tag text value is either empty '
              f'or None having url http://www.example.com\', '
              f'\'State - EXP_3_STATE_1 Math tag svg_filename'
              f' value has a non svg extension having value '
              f'mathImg.svgas.\', \'State - EXP_3_STATE_1 Math tag raw_latex '
              f'value is either empty or None having filename '
              f'mathImg.svgas.\', \'State - EXP_3_STATE_1 '
              f'Skill review tag text value is either empty or None.\', '
              f'\'State - EXP_3_STATE_1 Video tag start value is greater '
              f'than end value having video id Ntcw0H0hwPU.\', \'State - '
              f'EXP_3_STATE_1 Video tag does not have a video_id.\', '
              f'\'State - EXP_3_STATE_1 Video tag autoplay '
              f'value is not boolean.\']}}]'
            )
        ])

    def test_run_with_all_models(self) -> None:
        self.put_multi([self.exp_1, self.exp_2, self.exp_3, self.exp_5])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 1, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state erroneous data are '
            f'[{{\'state_name\': \'EXP_1_STATE_1\', '
            f'\'tagged_skill_misconception_ids\': [\'The '
            f'tagged_skill_misconception_id of answer group 0 is not None.\']'
            f', \'not_single_rule_spec\': '
            f'[\'There is no rule present in answer group 0, atleast one '
            f'is required.\'], \'invalid_refresher_exploration_id\': '
            f'[\'The refresher_exploration_id of answer group 0 is not '
            f'None.\', \'The refresher_exploration_id of default '
            f'outcome is not None.\'], '
            f'\'invalid_destinations\': [\'The destination '
            f'Not valid state of answer group 0 is not valid.\'], '
            f'\'invalid_default_outcome_dest\': [\'The destination of default'
            f' outcome is not valid, the value is Not valid state\']}}, '
            f'{{\'state_name\': \'EXP_1_STATE_2\','
            f' \'wrong_labelled_as_correct_values\': [\'The value of '
            f'labelled_as_correct of answer group 0 is True but the '
            f'destination is the state itself.\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 5, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state fraction, numeric and number '
            f'with units interaction '
            f'erroneous data are [{{\'state_name\': '
            f'\'EXP_5_STATE_2\', \'fraction_interaction_invalid_values\': '
            f'[\'The rule 0 of answer group 0 has denominator less than or '
            f'equal to zero.\', \'The rule 0 of answer group 0 '
            f'do not have value in '
            f'proper fraction\', \'The rule 0 of answer group 1 do not have '
            f'value in simple form\', \'The rule 0 of answer group 1 do not '
            f'have value in proper fraction\', \'The rule 0 of answer group '
            f'2 has non zero integer part having rule type '
            f'HasIntegerPartEqualTo.\', \'The rule 0 of answer group 3 has '
            f'non zero integer part.\', \'The rule 0 of answer group 4 has '
            f'denominator less than or equal to zero having rule type '
            f'HasDenominatorEqualTo.\']}}]'
            ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 5, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state continue, end and '
            f'drag and drop interactions '
            f'erroneous data are [{{\'state_name\': \'EXP_5_STATE_1\', '
            f'\'drag_drop_interaction_values\': [\'The rule 0 of answer '
            f'group 0 have multiple items at same place when multiple '
            f'items in same position settings is turned off.\', \'The '
            f'rule 0 of answer group 0 having rule type - '
            f'IsEqualToOrderingWithOneItemAtIncorrectPosition should '
            f'not be there when the multiple items in same position '
            f'setting is turned off.\', \'The rule 0 of answer group 1 '
            f'the value 1 and value 2 cannot be same when rule type is '
            f'HasElementXBeforeElementY\', \'Atleast 2 choices should be '
            f'there\', \'There should not be any empty choices\']}}'
            f', {{\'state_name\': '
            f'\'EXP_5_STATE_3\', \'drag_drop_interaction_values\': '
            f'[\'There should not be any duplicate choices\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 2, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state multiple choice and '
            f'item selection interactions '
            f'erroneous data are [{{\'state_name\': \'EXP_2_STATE_4\', '
            f'\'mc_interaction_invalid_values\': [\'rule - 0, answer '
            f'group - 2 is already present.\', '
            f'\'There should not be any empty choices\', '
            f'\'There should not be any duplicate choices\', '
            f'\'All choices have feedback and still has default '
            f'outcome\']}}, {{\'state_name\': '
            f'\'EXP_2_STATE_7\', \'item_selec_interaction_values\': '
            f'[\'Selected choices of rule 0 of answer group 0 either less '
            f'than min_selection_value or greter than max_selection_value.\','
            f' \'Selected choices of rule 0 of answer group 1 either '
            f'less than min_selection_value or greter than '
            f'max_selection_value.\', \'Min value which is 6 is greater '
            f'than max value which is 5\', \'Number of choices which is 4 '
            f'is lesser than the min value selection which is 6\', '
            f'\'There should not be any empty choices\', '
            f'\'There should not be any duplicate choices\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 2, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state fraction, numeric and number '
            f'with units interaction '
            f'erroneous data are ['
            f'{{\'state_name\': \'EXP_2_STATE_5\', '
            f'\'numeric_input_interaction_values\': [\'The rule 0 of answer '
            f'group 0 having rule type IsWithinTolerance have tol value '
            f'less than zero.\', \'The rule 0 of answer group 1 having rule '
            f'type IsInclusivelyBetween have a value greater than b '
            f'value\']}}, {{\'state_name\': \'EXP_2_STATE_6\', '
            f'\'number_with_units_errors\': [\'The rule 0 of answer group 1 '
            f'has rule type equal is coming after rule type equivalent '
            f'having same value\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 2, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state continue, end and '
            f'drag and drop interactions '
            f'erroneous data are [{{\'state_name\': \'EXP_2_STATE_1\', '
            f'\'continue_interaction_invalid_values\': [\'The text value '
            f'is invalid, either it is empty or the character length is '
            f'more than 20 or it is None, the value is Continueeeeeeeeeeeeee'
            f'eeeeeeeeeeee\', \'There should be '
            f'no answer groups present in the continue exploration '
            f'interaction.\']}}, {{\'state_name\': \'EXP_2_STATE_2\', '
            f'\'end_interaction_invalid_values\': [\'There should be no '
            f'default value present in the end exploration interaction.\', '
            f'\'There should be no answer groups present in the end '
            f'exploration interaction.\', \'Total number of recommended '
            f'explorations should not be more than 3, found 4.\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of exp is 3, created on {str(self.YEAR_AGO_DATE)}'
            f', and the state RTE erroneous data are '
            f'[{{\'state_name\': \'EXP_3_STATE_1\', '
            f'\'rte_components_errors\':'
            f' [\'State - EXP_3_STATE_1 Image tag caption value is greater '
            f'than 500 having value img_1.svgg.\', \'State - '
            f'EXP_3_STATE_1 Image tag alt value is '
            f'less than 5 having value img_1.svgg.\', '
            f'\'State - EXP_3_STATE_1 Link tag text value is either empty '
            f'or None having url http://www.example.com\', '
            f'\'State - EXP_3_STATE_1 Math tag svg_filename'
            f' value has a non svg extension having value '
            f'mathImg.svgas.\', \'State - EXP_3_STATE_1 Math tag raw_latex '
            f'value is either empty or None having filename '
            f'mathImg.svgas.\', \'State - EXP_3_STATE_1 '
            f'Skill review tag text value is either empty or None.\', '
            f'\'State - EXP_3_STATE_1 Video tag start value is greater '
            f'than end value having video id Ntcw0H0hwPU.\', \'State - '
            f'EXP_3_STATE_1 Video tag does not have a video_id.\', '
            f'\'State - EXP_3_STATE_1 Video tag autoplay '
            f'value is not boolean.\']}}]'
          )
        ])
