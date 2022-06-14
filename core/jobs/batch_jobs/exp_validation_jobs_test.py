# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for jobs.batch_jobs.exp_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class ExpStateValidationJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exp_validation_jobs.ExpStateValidationJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'

    EXP_1_STATE_1 = state_domain.State.create_default_state(
        "EXP_1_STATE_1", is_initial_state=True).to_dict()

    EXP_1_STATE_1['interaction'] = {
      "id": "NumericInput",
      "customization_args": {
        "requireNonnegativeInput": {
          "value": False
        }
      },
      "answer_groups": [
        {
          "rule_specs": [],
          "outcome": {
            "dest": "Not valid state",
            "feedback": {
              "content_id": "feedback_4",
              "html": "<p>good</p>"
            },
            "labelled_as_correct": True,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": "Not None"
        }
      ],
      "default_outcome": {
        "dest": "Not valid state",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>try</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": "Not None",
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [
        {
          "hint_content": {
            "content_id": "hint_1",
            "html": "<p>c</p>"
          }
        }
      ],
      "solution": None
    }

    EXP_1_STATE_2 = state_domain.State.create_default_state(
        "EXP_1_STATE_2", is_initial_state=False).to_dict()

    EXP_1_STATE_2['interaction'] = {
      "id": "NumericInput",
      "customization_args": {
        "requireNonnegativeInput": {
          "value": False
        }
      },
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": 0
              }
            }
          ],
          "outcome": {
            "dest": "EXP_1_STATE_2",
            "feedback": {
              "content_id": "feedback_4",
              "html": "<p>good</p>"
            },
            "labelled_as_correct": True,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_1_STATE_2",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>try</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [
        {
          "hint_content": {
            "content_id": "hint_1",
            "html": "<p>c</p>"
          }
        }
      ],
      "solution": None
    }

    # Interaction Validation
    EXP_2_STATE_1 = state_domain.State.create_default_state(
        "EXP_2_STATE_1", is_initial_state=True).to_dict()

    EXP_2_STATE_1['interaction'] = {
      "id": "Continue",
      "customization_args": {
        "buttonText": {
          "value": {
            "content_id": "ca_buttonText_0",
            "unicode_str": "Continueeeeeeeeeeeeeeeeeeeeeeeeee"
          }
        }
      },
      "answer_groups": [],
      "default_outcome": {
        "dest": "EXP_2_STATE_1",
        "feedback": {
          "content_id": "default_outcome",
          "html": ""
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_2 = state_domain.State.create_default_state(
        "EXP_2_STATE_2", is_initial_state=False).to_dict()

    EXP_2_STATE_2['interaction'] = {
      "id": "EndExploration",
      "customization_args": {
        "recommendedExplorationIds": {
          "value": ["EXP_1", "EXP_2", "EXP_3", "EXP_4"]
        }
      },
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": 0
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_2",
            "feedback": {
              "content_id": "feedback_4",
              "html": "<p>good</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_2_STATE_2",
        "feedback": {
          "content_id": "default_outcome",
          "html": ""
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_3 = state_domain.State.create_default_state(
        "EXP_2_STATE_3", is_initial_state=False).to_dict()
    EXP_2_STATE_3['interaction'] = {
      "id": "TextInput",
      "customization_args": {
        "placeholder": {
          "value": {
            "content_id": "ca_placeholder_0",
            "unicode_str": ""
          }
        },
        "rows": {
          "value": 1
        }
      },
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "FuzzyEquals",
              "inputs": {
                "x": {
                  "contentId": "rule_input_2",
                  "normalizedStrSet": [
                    "a",
                    "b"
                  ]
                }
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_3",
            "feedback": {
              "content_id": "feedback_1",
              "html": "<p>sdvds</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_2_STATE_3",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>sd</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_4 = state_domain.State.create_default_state(
        "EXP_2_STATE_4", is_initial_state=False).to_dict()
    EXP_2_STATE_4['interaction'] = {
      "id": "MultipleChoiceInput",
      "customization_args": {
        "choices": {
          "value": [
            {
              "content_id": "ca_choices_14",
              "html": "<p>1</p>"
            },
            {
              "content_id": "ca_choices_15",
              "html": "<p>2</p>"
            },
            {
              "content_id": "ca_choices_16",
              "html": "<p></p>"
            }
          ]
        },
        "showChoicesInShuffledOrder": {
          "value": True
        }
      },
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": 3
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_4",
            "feedback": {
              "content_id": "feedback_19",
              "html": "<p>try</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        },
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": 2
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_4",
            "feedback": {
              "content_id": "feedback_20",
              "html": "<p>try</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        },
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": 2
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_4",
            "feedback": {
              "content_id": "feedback_20",
              "html": "<p>try</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_2_STATE_3",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>sd</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_5 = state_domain.State.create_default_state(
        "EXP_2_STATE_5", is_initial_state=False).to_dict()
    EXP_2_STATE_5['interaction'] = {
      "id": "NumericInput",
      "customization_args": {
        "requireNonnegativeInput": {
          "value": False
        }
      },
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "IsWithinTolerance",
              "inputs": {
                "tol": -1,
                "x": 5
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_5",
            "feedback": {
              "content_id": "feedback_0",
              "html": "<p>dvfdf</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        },
        {
          "rule_specs": [
            {
              "rule_type": "IsInclusivelyBetween",
              "inputs": {
                "a": 10,
                "b": 2
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_5",
            "feedback": {
              "content_id": "feedback_1",
              "html": "<p>dfb</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_2_STATE_5",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>fre</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_6 = state_domain.State.create_default_state(
        "EXP_2_STATE_6", is_initial_state=False).to_dict()
    EXP_2_STATE_6['interaction'] = {
      "id": "NumberWithUnits",
      "customization_args": {},
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "IsEquivalentTo",
              "inputs": {
                "f": {
                  "type": "real",
                  "real": 2,
                  "fraction": {
                    "isNegative": False,
                    "wholeNumber": 0,
                    "numerator": 0,
                    "denominator": 1
                  },
                  "units": [
                    {
                      "unit": "km",
                      "exponent": 1
                    },
                    {
                      "unit": "hr",
                      "exponent": -1
                    }
                  ]
                }
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_6",
            "feedback": {
              "content_id": "feedback_0",
              "html": "<p>dfv</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        },
        {
          "rule_specs": [
            {
              "rule_type": "IsEqualTo",
              "inputs": {
                "f": {
                  "type": "real",
                  "real": 2,
                  "fraction": {
                    "isNegative": False,
                    "wholeNumber": 0,
                    "numerator": 0,
                    "denominator": 1
                  },
                  "units": [
                    {
                      "unit": "km",
                      "exponent": 1
                    },
                    {
                      "unit": "hr",
                      "exponent": -1
                    }
                  ]
                }
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_6",
            "feedback": {
              "content_id": "feedback_1",
              "html": "<p>sdv</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_2_STATE_6",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>fds</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }
    
    EXP_2_STATE_7 = state_domain.State.create_default_state(
        "EXP_2_STATE_7", is_initial_state=False).to_dict()
    EXP_2_STATE_7['interaction'] = {
      "id": "ItemSelectionInput",
      "customization_args": {
        "minAllowableSelectionCount": {
          "value": 6
        },
        "maxAllowableSelectionCount": {
          "value": 5
        },
        "choices": {
          "value": [
            {
              "content_id": "ca_choices_59",
              "html": "<p>1</p>"
            },
            {
              "content_id": "ca_choices_60",
              "html": "<p>2</p>"
            },
            {
              "content_id": "ca_choices_61",
              "html": "<p>3</p>"
            },
            {
              "content_id": "ca_choices_62",
              "html": "<p></p>"
            }
          ]
        }
      },
      "answer_groups": [
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": [
                  "ca_choices_59"
                ]
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_7",
            "feedback": {
              "content_id": "feedback_63",
              "html": "<p>df</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        },
        {
          "rule_specs": [
            {
              "rule_type": "Equals",
              "inputs": {
                "x": [
                  "ca_choices_59"
                ]
              }
            }
          ],
          "outcome": {
            "dest": "EXP_2_STATE_7",
            "feedback": {
              "content_id": "feedback_63",
              "html": "<p>df</p>"
            },
            "labelled_as_correct": False,
            "param_changes": [],
            "refresher_exploration_id": None,
            "missing_prerequisite_skill_id": None
          },
          "training_data": [],
          "tagged_skill_misconception_id": None
        }
      ],
      "default_outcome": {
        "dest": "EXP_2_STATE_7",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>sd</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_8 = state_domain.State.create_default_state(
        "EXP_2_STATE_8", is_initial_state=False).to_dict()
    EXP_2_STATE_8['interaction'] = {
      "id": "DragAndDropSortInput",
      "customization_args": {
      "choices": {
        "value": [
          {
            "content_id": "ca_choices_68",
            "html": "<p></p>"
          }
        ]
      },
      "allowMultipleItemsInSamePosition": {
        "value": False
      }
    },
      "answer_groups": [
      {
        "rule_specs": [
          {
            "rule_type": "IsEqualToOrderingWithOneItemAtIncorrectPosition",
            "inputs": {
              "x": [
                [
                  "ca_choices_68"
                ],
                [
                  "ca_choices_69", "ca_choices_70"
                ],
                [
                  "ca_choices_71"
                ]
              ]
            }
          }
        ],
        "outcome": {
          "dest": "EXP_2_STATE_8",
          "feedback": {
            "content_id": "feedback_71",
            "html": "<p>df</p>"
          },
          "labelled_as_correct": False,
          "param_changes": [],
          "refresher_exploration_id": None,
          "missing_prerequisite_skill_id": None
        },
        "training_data": [],
        "tagged_skill_misconception_id": None
      },
      {
        "rule_specs": [
          {
            "rule_type": "HasElementXBeforeElementY",
            "inputs": {
              "x": "ca_choices_68",
              "y": "ca_choices_68"
            }
          }
        ],
        "outcome": {
          "dest": "EXP_2_STATE_8",
          "feedback": {
            "content_id": "feedback_72",
            "html": "<p>dvds</p>"
          },
          "labelled_as_correct": False,
          "param_changes": [],
          "refresher_exploration_id": None,
          "missing_prerequisite_skill_id": None
        },
        "training_data": [],
        "tagged_skill_misconception_id": None
      }
    ],
      "default_outcome": {
        "dest": "EXP_2_STATE_8",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>sd</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    EXP_2_STATE_9 = state_domain.State.create_default_state(
        "EXP_2_STATE_9", is_initial_state=False).to_dict()
    EXP_2_STATE_9['interaction'] = {
      "id": "FractionInput",
      "customization_args": {
        "requireSimplestForm": {
          "value": True
        },
        "allowImproperFraction": {
          "value": False
        },
        "allowNonzeroIntegerPart": {
          "value": False
        },
        "customPlaceholder": {
          "value": {
            "content_id": "ca_customPlaceholder_73",
            "unicode_str": ""
          }
        }
      },
      "answer_groups": [
      {
        "rule_specs": [
          {
            "rule_type": "HasFractionalPartExactlyEqualTo",
            "inputs": {
              "f": {
                "isNegative": False,
                "wholeNumber": 0,
                "numerator": 1,
                "denominator": 0
              }
            }
          }
        ],
        "outcome": {
          "dest": "EXP_2_STATE_9",
          "feedback": {
            "content_id": "feedback_74",
            "html": "<p>dfb</p>"
          },
          "labelled_as_correct": False,
          "param_changes": [],
          "refresher_exploration_id": None,
          "missing_prerequisite_skill_id": None
        },
        "training_data": [],
        "tagged_skill_misconception_id": None
      },
      {
        "rule_specs": [
          {
            "rule_type": "HasFractionalPartExactlyEqualTo",
            "inputs": {
              "f": {
                "isNegative": False,
                "wholeNumber": 0,
                "numerator": 6,
                "denominator": 4
              }
            }
          }
        ],
        "outcome": {
          "dest": "EXP_2_STATE_9",
          "feedback": {
            "content_id": "feedback_74",
            "html": "<p>dfb</p>"
          },
          "labelled_as_correct": False,
          "param_changes": [],
          "refresher_exploration_id": None,
          "missing_prerequisite_skill_id": None
        },
        "training_data": [],
        "tagged_skill_misconception_id": None
      },
      {
        "rule_specs": [
          {
            "rule_type": "HasIntegerPartEqualTo",
            "inputs": {
              "x": 5
            }
          }
        ],
        "outcome": {
          "dest": "EXP_2_STATE_9",
          "feedback": {
            "content_id": "feedback_74",
            "html": "<p>dfb</p>"
          },
          "labelled_as_correct": False,
          "param_changes": [],
          "refresher_exploration_id": None,
          "missing_prerequisite_skill_id": None
        },
        "training_data": [],
        "tagged_skill_misconception_id": None
      }
    ],
      "default_outcome": {
        "dest": "EXP_2_STATE_9",
        "feedback": {
          "content_id": "default_outcome",
          "html": "<p>sd</p>"
        },
        "labelled_as_correct": False,
        "param_changes": [],
        "refresher_exploration_id": None,
        "missing_prerequisite_skill_id": None
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": None
    }

    # RTE Validation
    EXP_3_STATE_1 = state_domain.State.create_default_state(
        "EXP_3_STATE_1", is_initial_state=True).to_dict()
    EXP_3_STATE_1['content']['html'] = (
    '"<p><oppia-noninteractive-link' +
    ' text-with-value=\"&amp;quot;&amp;quot;\"' +
    ' url-with-value=\"&amp;quot;http://www.example.com&amp;quot;\">' +
    '</oppia-noninteractive-link></p>\n\n<p><oppia-noninteractive-math' +
    ' math_content-with-value=\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;' +
    '2/3&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;' +
    'mathImg_20220606_180525_2toc4729js_height_2d731_width_3d519_vertical' +
    '_0d833.svgas&amp;quot;}\"></oppia-noninteractive-math>' +
    '<oppia-noninteractive-skillreview skill_id-with-value=' +
    '\"&amp;quot;&amp;quot;\" text-with-value=\"&amp;quot;' +
    '&amp;quot;\"></oppia-noninteractive-skillreview>&nbsp;heading' +
    '</p><oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'bbb&amp;quot;\" caption-with-value=\"&amp;quot;aaaaaaaaaaaaaaaaaaaaaaaaaa'
    + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    + '&amp;quot;\" ' +
    'filepath-with-value=\"&amp;quot;img_20220606_174455_f8yf0gg4rz_height_350'
    + '_width_450.svg&amp;quot;\"></oppia-noninteractive-image>' +
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'aaaaaaaaaaaaaaaaaaaa&amp;quot;\" caption-with-value=' +
    '\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;' +
    'img_20220606_114604' + '_0xmbq9hwfz_height_276_width_490.svg&amp;quot;\">'
    + '</oppia-noninteractive-image>"<oppia-noninteractive-video ' +
    'autoplay-with-value=\"true\" end-with-value=\"11\" ' +
    'start-with-value=\"13\"' +
    ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'+
    'quot;\"></oppia-noninteractive-video>')

    def setUp(self):
        super().setUp()

        # This is an invalid model with state validation
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
            states={"EXP_1_STATE_1": self.EXP_1_STATE_1,
            "EXP_1_STATE_2": self.EXP_1_STATE_2}
        )

        # This is an invalid model with state interaction
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
            "EXP_2_STATE_1": self.EXP_2_STATE_1,
            "EXP_2_STATE_2": self.EXP_2_STATE_2,
            "EXP_2_STATE_3": self.EXP_2_STATE_3,
            "EXP_2_STATE_4": self.EXP_2_STATE_4,
            "EXP_2_STATE_5": self.EXP_2_STATE_5,
            "EXP_2_STATE_6": self.EXP_2_STATE_6,
            "EXP_2_STATE_7": self.EXP_2_STATE_7,
            "EXP_2_STATE_8": self.EXP_2_STATE_8,
            "EXP_2_STATE_9": self.EXP_2_STATE_9,
            }
        )

        # This is an invalid model with state RTE
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
            states={"EXP_3_STATE_1": self.EXP_3_STATE_1}
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_state_validation(self) -> None:
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 1, and the state RTE erroneous data are " +
              "[{'state_name': 'EXP_1_STATE_1'}, {'state_name': " +
              "'EXP_1_STATE_2'}]"
            ),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 1, and the state interaction part 1 " +
              "erroneous data are [{'state_name': 'EXP_1_STATE_1'}, " +
              "{'state_name': 'EXP_1_STATE_2'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 1, and the state interaction part 2 " +
              "erroneous data are [{'state_name': 'EXP_1_STATE_1'}, " +
              "{'state_name': 'EXP_1_STATE_2'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 1, and the state interaction part 3 " +
              "erroneous data are [{'state_name': 'EXP_1_STATE_1'}, " +
              "{'state_name': 'EXP_1_STATE_2'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 1, and the state erroneous data are " +
              "[{'state_name': 'EXP_1_STATE_1', " +
              "'tagged_skill_misconception_ids': ['The " +
              "tagged_skill_misconception_id of answer group 0 is not None.']" +
              ", 'not_single_rule_spec': " +
              "['There is no rule present in answer group 0, atleast one " +
              "is required.'], 'invalid_destinations': ['The destination " +
              "Not valid state of answer group 0 is not valid.'], " +
              "'invalid_default_outcome_dest': ['The destination of default " +
              "outcome is not valid, the value is Not valid state']}, " +
              "{'state_name': 'EXP_1_STATE_2',"
              +" 'wrong_labelled_as_correct_values': ['The value of " +
              "labelled_as_correct of answer group 0 is True but the " +
              "destination is the state itself.']}]"
            )
        ])

    def test_run_with_state_interaction_validaton(self) -> None:
        self.put_multi([self.exp_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 2, and the state RTE erroneous data are " +
              "[{'state_name': 'EXP_2_STATE_1'}, {'state_name': " +
              "'EXP_2_STATE_2'}, {'state_name': 'EXP_2_STATE_3'}, " +
              "{'state_name': 'EXP_2_STATE_4'}, {'state_name': " +
              "'EXP_2_STATE_5'}, {'state_name': 'EXP_2_STATE_6'}, " +
              "{'state_name': 'EXP_2_STATE_7'}, {'state_name': " +
              "'EXP_2_STATE_8'}, {'state_name': 'EXP_2_STATE_9'}]"
            ),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 2, and the state erroneous data are " +
              "[{'state_name': 'EXP_2_STATE_1'}, {'state_name': " +
              "'EXP_2_STATE_2'}, {'state_name': 'EXP_2_STATE_3'}, " +
              "{'state_name': 'EXP_2_STATE_4'}, {'state_name': " +
              "'EXP_2_STATE_5'}, {'state_name': 'EXP_2_STATE_6'}, " +
              "{'state_name': 'EXP_2_STATE_7'}, {'state_name': " +
              "'EXP_2_STATE_8'}, {'state_name': 'EXP_2_STATE_9'}]"
            ),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 2, and the state interaction part 2 " +
              "erroneous data are [{'state_name': 'EXP_2_STATE_1'}, " +
              "{'state_name': 'EXP_2_STATE_2'}, {'state_name': " +
              "'EXP_2_STATE_3'}, {'state_name': 'EXP_2_STATE_4', " +
              "'mc_interaction_invalid_values': ['rule - 0, answer " +
              "group - 2 is already present.', 'There should be atleast " +
              "4 choices found 3', 'There should not be any empty choices " +
              "- 2', 'All choices have feedback and still has default " +
              "outcome']}, {'state_name': 'EXP_2_STATE_5'}, {'state_name': " +
              "'EXP_2_STATE_6'}, {'state_name': 'EXP_2_STATE_7', " +
              "'item_selec_interaction_values': ['Selected choices of rule 0 "+
              "of answer group 0 either less than min_selection_value or " +
              "greter than max_selection_value.', 'Selected choices of rule " +
              "0 of answer group 1 either less than min_selection_value or " +
              "greter than max_selection_value.', 'Min value which is 6 is " +
              "greater than max value which is 5', 'Number of choices which " +
              "is 4 is lesser than the max value selection which is 5', " +
              "'There should not be any empty choices - 3']}, " +
              "{'state_name': 'EXP_2_STATE_8'}, {'state_name': " +
              "'EXP_2_STATE_9'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 2, and the state interaction part 1 " +
              "erroneous data are [{'state_name': 'EXP_2_STATE_1'}, " +
              "{'state_name': 'EXP_2_STATE_2'}, {'state_name': " +
              "'EXP_2_STATE_3'}, {'state_name': 'EXP_2_STATE_4'}, " +
              "{'state_name': 'EXP_2_STATE_5', " +
              "'numeric_input_interaction_values': ['The rule 0 of answer " +
              "group 0 having rule type IsWithinTolerance have tol value " +
              "less than zero.', 'The rule 0 of answer group 1 having rule " +
              "type IsInclusivelyBetween have a value greater than b " +
              "value']}, {'state_name': 'EXP_2_STATE_6', " +
              "'number_with_units_errors': ['The rule 0 of answer group 1 " +
              "has rule type equal is coming after rule type equivalent " +
              "having same value']}, {'state_name': 'EXP_2_STATE_7'}, " +
              "{'state_name': 'EXP_2_STATE_8'}, {'state_name': " +
              "'EXP_2_STATE_9', 'fraction_interaction_invalid_values': " +
              "['The rule 0 of answer group 0 has denominator equals to " +
              "zero.', 'The rule 0 of answer group 0 do not have value in " +
              "proper fraction', 'The rule 0 of answer group 1 do not have " +
              "value in simple form', 'The rule 0 of answer group 1 do not " +
              "have value in proper fraction', 'The rule 0 of answer group " +
              "2 has non zero integer part.']}]"
            ),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 2, and the state interaction part 3 " +
              "erroneous data are [{'state_name': 'EXP_2_STATE_1', " +
              "'continue_interaction_invalid_values': ['The text value " +
              "is invalid, either it is empty or the character length is " +
              "more than 20, the value is Continueeeeeeeeeeeeee" +
              "eeeeeeeeeeee']}, {'state_name': 'EXP_2_STATE_2', " +
              "'end_interaction_invalid_values': ['There should be no " +
              "default value present in the end exploration interaction.', " +
              "'There should be no answer groups present in the end " +
              "exploration interaction.', 'Total number of recommended " +
              "explorations should not be more than 3, found 4.']}, " +
              "{'state_name': 'EXP_2_STATE_3'}, {'state_name': " +
              "'EXP_2_STATE_4'}, {'state_name': 'EXP_2_STATE_5'}, " +
              "{'state_name': 'EXP_2_STATE_6'}, {'state_name': " +
              "'EXP_2_STATE_7'}, {'state_name': 'EXP_2_STATE_8', " +
              "'drag_drop_interaction_values': ['The rule 0 of answer " +
              "group 0 have multiple items at same place when multiple " +
              "items in same position settings is turned off.', 'The " +
              "rule 0 of answer group 0 having rule type - " +
              "IsEqualToOrderingWithOneItemAtIncorrectPosition should " +
              "not be there when the multiple items in same position " +
              "setting is turned off.', 'The rule 0 of answer group 1 " +
              "The value 1 and value 2 cannot be same when rule type is " +
              "HasElementXBeforeElementY', 'Atleast 2 choices should be " +
              "there', 'There should not be any empty choices, present on " +
              "the index - 0']}, {'state_name': 'EXP_2_STATE_9'}]"
            )
        ])

    def test_run_with_state_rte_validation(self) -> None:
        self.put_multi([self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 3, and the state RTE erroneous data are " +
              "[{'state_name': 'EXP_3_STATE_1', 'rte_components_errors': " +
              "['State - EXP_3_STATE_1 Image tag caption value is greater " +
              "than 160.', 'State - EXP_3_STATE_1 Image tag alt value is " +
              "less than 5.', 'State - EXP_3_STATE_1 Link tag text value is " +
              "empty.', 'State - EXP_3_STATE_1 Math tag svg_filename value " +
              "has a non svg extension.', 'State - EXP_3_STATE_1 Skill " +
              "review tag text value is empty.', 'State - EXP_3_STATE_1 " +
              "Video tag start value is greater than end value.']}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 3, and the state interaction part 1 " +
              "erroneous data are [{'state_name': 'EXP_3_STATE_1'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 3, and the state interaction part 2 " +
              "erroneous data are [{'state_name': 'EXP_3_STATE_1'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 3, and the state interaction part 3 " +
              "erroneous data are [{'state_name': 'EXP_3_STATE_1'}]"),
            job_run_result.JobRunResult.as_stderr(
              "The id of exp is 3, and the state erroneous data " +
              "are [{'state_name': 'EXP_3_STATE_1'}]")
        ])
