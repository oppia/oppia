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
from core.jobs.batch_jobs import audit_exploration_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, opportunity_models) = models.Registry.import_models([
  models.NAMES.exploration,
  models.NAMES.opportunity
])


class ExpStateAuditChecksJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = audit_exploration_jobs.ExpStateAuditChecksJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'

    EXP_1_STATE_1 = state_domain.State.create_default_state(
        'EXP_1_STATE_1', is_initial_state=True).to_dict()

    EXP_1_STATE_1['interaction'] = {
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
            'dest': 'EXP_1_STATE_1',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': 'Not None',
            'missing_prerequisite_skill_id': None
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
        'refresher_exploration_id': 'Not None',
        'missing_prerequisite_skill_id': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_1_STATE_2 = state_domain.State.create_default_state(
        'EXP_1_STATE_2', is_initial_state=False).to_dict()
    EXP_1_STATE_2['interaction'] = {
      'id': 'ItemSelectionInput',
      'customization_args': {
        'minAllowableSelectionCount': {
          'value': 2
        },
        'maxAllowableSelectionCount': {
          'value': 3
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
            'dest': 'EXP_1_STATE_2',
            'feedback': {
              'content_id': 'feedback_63',
              'html': '<p>df</p>'
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
        'dest': 'EXP_1_STATE_2',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_1_STATE_3 = state_domain.State.create_default_state(
        'EXP_1_STATE_3', is_initial_state=False).to_dict()
    EXP_1_STATE_3['interaction'] = {
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
          },
          {
            'content_id': 'ca_choices_71',
            'html': '<p>4</p>'
          },
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
          'dest': 'EXP_1_STATE_3',
          'feedback': {
            'content_id': 'feedback_71',
            'html': '<p>df</p>'
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
        'dest': 'EXP_1_STATE_3',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_1_STATE_4 = state_domain.State.create_default_state(
        'EXP_1_STATE_4', is_initial_state=True).to_dict()
    EXP_1_STATE_4['content']['html'] = (
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'bbb&amp;quot;\" caption-with-value=\"&amp;quot;caption' +
    '&amp;quot;\" filepath-with-value=\"&amp;quot;img_1' +
    '.svgg&amp;quot;\"></oppia-noninteractive-image>' +
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'aaaaaaaaaaaaaaaaaaaa&amp;quot;\" caption-with-value=' +
    '\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;' +
    'img_2_0xmbq9hwfz_height_276_width_490.svg&amp;quot;\">' +
    '</oppia-noninteractive-image><oppia-noninteractive-video ' +
    'autoplay-with-value=\"true\" end-with-value=\"11\" ' +
    'start-with-value=\"13\"' +
    ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;' +
    'quot;\"></oppia-noninteractive-video>'
    )

    # Exploration 2.
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
            'dest': 'EXP_2_STATE_1',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': 'Not None',
            'missing_prerequisite_skill_id': None
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
        'refresher_exploration_id': 'Not None',
        'missing_prerequisite_skill_id': None
      },
      'confirmed_unclassified_answers': [],
      'hints': [],
      'solution': None
    }

    EXP_2_STATE_2 = state_domain.State.create_default_state(
        'EXP_2_STATE_2', is_initial_state=False).to_dict()
    EXP_2_STATE_2['interaction'] = {
      'id': 'ItemSelectionInput',
      'customization_args': {
        'minAllowableSelectionCount': {
          'value': 2
        },
        'maxAllowableSelectionCount': {
          'value': 3
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
            'dest': 'EXP_2_STATE_2',
            'feedback': {
              'content_id': 'feedback_63',
              'html': '<p>df</p>'
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
        'dest': 'EXP_2_STATE_2',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_2_STATE_3 = state_domain.State.create_default_state(
        'EXP_2_STATE_3', is_initial_state=False).to_dict()
    EXP_2_STATE_3['interaction'] = {
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
          },
          {
            'content_id': 'ca_choices_71',
            'html': '<p>4</p>'
          },
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
          'dest': 'EXP_2_STATE_3',
          'feedback': {
            'content_id': 'feedback_71',
            'html': '<p>df</p>'
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
        'dest': 'EXP_2_STATE_3',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_2_STATE_4 = state_domain.State.create_default_state(
        'EXP_2_STATE_4', is_initial_state=True).to_dict()
    EXP_2_STATE_4['content']['html'] = (
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'bbb&amp;quot;\" caption-with-value=\"&amp;quot;caption' +
    '&amp;quot;\" filepath-with-value=\"&amp;quot;img_1' +
    '.svgg&amp;quot;\"></oppia-noninteractive-image>' +
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'aaaaaaaaaaaaaaaaaaaa&amp;quot;\" caption-with-value=' +
    '\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;' +
    'img_2_0xmbq9hwfz_height_276_width_490.svg&amp;quot;\">' +
    '</oppia-noninteractive-image><oppia-noninteractive-video ' +
    'autoplay-with-value=\"true\" end-with-value=\"11\" ' +
    'start-with-value=\"13\"' +
    ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;' +
    'quot;\"></oppia-noninteractive-video>'
    )

    # Exploration 3.
    EXP_3_STATE_1 = state_domain.State.create_default_state(
        'EXP_3_STATE_1', is_initial_state=True).to_dict()

    EXP_3_STATE_1['interaction'] = {
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
            'dest': 'EXP_3_STATE_1',
            'feedback': {
              'content_id': 'feedback_4',
              'html': '<p>good</p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': 'Not None',
            'missing_prerequisite_skill_id': None
          },
          'training_data': [],
          'tagged_skill_misconception_id': None
        }
      ],
      'default_outcome': {
        'dest': 'EXP_3_STATE_1',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>try</p>'
        },
        'labelled_as_correct': False,
        'param_changes': [],
        'refresher_exploration_id': 'Not None',
        'missing_prerequisite_skill_id': None
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
          'value': 2
        },
        'maxAllowableSelectionCount': {
          'value': 3
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
            'dest': 'EXP_3_STATE_2',
            'feedback': {
              'content_id': 'feedback_63',
              'html': '<p>df</p>'
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
        'dest': 'EXP_3_STATE_2',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_3_STATE_3 = state_domain.State.create_default_state(
        'EXP_3_STATE_3', is_initial_state=False).to_dict()
    EXP_3_STATE_3['interaction'] = {
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
          },
          {
            'content_id': 'ca_choices_71',
            'html': '<p>4</p>'
          },
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
          'dest': 'EXP_3_STATE_3',
          'feedback': {
            'content_id': 'feedback_71',
            'html': '<p>df</p>'
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
        'dest': 'EXP_3_STATE_3',
        'feedback': {
          'content_id': 'default_outcome',
          'html': '<p>sd</p>'
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

    EXP_3_STATE_4 = state_domain.State.create_default_state(
        'EXP_3_STATE_4', is_initial_state=True).to_dict()
    EXP_3_STATE_4['content']['html'] = (
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'bbb&amp;quot;\" caption-with-value=\"&amp;quot;caption' +
    '&amp;quot;\" filepath-with-value=\"&amp;quot;img_1' +
    '.svgg&amp;quot;\"></oppia-noninteractive-image>' +
    '<oppia-noninteractive-image alt-with-value=\"&amp;quot;' +
    'aaaaaaaaaaaaaaaaaaaa&amp;quot;\" caption-with-value=' +
    '\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;' +
    'img_2_0xmbq9hwfz_height_276_width_490.svg&amp;quot;\">' +
    '</oppia-noninteractive-image><oppia-noninteractive-video ' +
    'autoplay-with-value=\"true\" end-with-value=\"11\" ' +
    'start-with-value=\"13\"' +
    ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;' +
    'quot;\"></oppia-noninteractive-video>'
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
            states={
            'EXP_1_STATE_1': self.EXP_1_STATE_1,
            'EXP_1_STATE_2': self.EXP_1_STATE_2,
            'EXP_1_STATE_3': self.EXP_1_STATE_3,
            'EXP_1_STATE_4': self.EXP_1_STATE_4
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
            'EXP_2_STATE_1': self.EXP_2_STATE_1,
            'EXP_2_STATE_2': self.EXP_2_STATE_2,
            'EXP_2_STATE_3': self.EXP_2_STATE_3,
            'EXP_2_STATE_4': self.EXP_2_STATE_4
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
            states={
            'EXP_3_STATE_1': self.EXP_1_STATE_1,
            'EXP_3_STATE_2': self.EXP_1_STATE_2,
            'EXP_3_STATE_3': self.EXP_1_STATE_3,
            'EXP_3_STATE_4': self.EXP_1_STATE_4
            }
        )

        self.opportunity_model = self.create_model(
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

        self.private_exp_summary = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_2,
            title='private exp summary title',
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            status=constants.ACTIVITY_STATUS_PRIVATE,
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
        self.private_exp_summary.update_timestamps()

        self.public_exp_summary = self.create_model(
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
        self.public_exp_summary.update_timestamps()

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_invalid_curated_exp(self) -> None:
        self.put_multi([self.exp_1, self.opportunity_model])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                f'The id of curated exp is 1, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid curated exp item selection interaction '
                f'errors are [{{\'state_name\': \'EXP_1_STATE_2\', '
                f'\'item_selec_interaction_values\': [\'Selected choices '
                f'of rule 0 of answer group 0 either less than '
                f'min_selection_value or greter than '
                f'max_selection_value.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of curated exp is 1, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid curated exp continue interaction '
                f'errors are [{{\'state_name\': \'EXP_1_STATE_1\', '
                f'\'continue_interaction_invalid_values\': [\'The text '
                f'value is invalid, either it is empty or the character '
                f'length is more than 20 or it is None, the value is '
                f'Continueeeeeeeeeeeeeeeeeeeeeeeeee\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of curated exp is 1, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid curated exp refresher_exp_id errors are '
                f'[{{\'state_name\': \'EXP_1_STATE_1\', '
                f'\'invalid_refresher_exploration_id\': '
                f'[\'The refresher_exploration_id of answer group 0 is not '
                f'None having value Not None\', \'The '
                f'refresher_exploration_id of default outcome is not None '
                f'having value Not None\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of curated exp is 1, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid curated exp drag and drop interaction '
                f'errors are [{{\'state_name\': \'EXP_1_STATE_3\', '
                f'\'drag_drop_interaction_values\': [\'The rule 0 of '
                f'answer group 0 have multiple items at same place when '
                f'multiple items in same position settings is turned off.\', '
                f'\'The rule 0 of answer group 0 having rule type - '
                f'IsEqualToOrderingWithOneItemAtIncorrectPosition should not '
                f'be there when the multiple items in same position '
                f'setting is turned off.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of curated exp is 1, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid curated exp RTE image tag errors are '
                f'[{{\'state_name\': \'EXP_1_STATE_4\', \'rte_image_errors\': '
                f'[\'State - EXP_1_STATE_4 Image tag alt value is less than '
                f'5 at index 0 having value bbb.\', \'State - EXP_1_STATE_4 '
                f'Image tag filepath value at index 0 does not have svg '
                f'extension having value img_1.svgg.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of curated exp is 1, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid curated exp RTE video tag errors are '
                f'[{{\'state_name\': \'EXP_1_STATE_4\', \'rte_video_errors\': '
                f'[\'State - EXP_1_STATE_4 Video tag at index 2, start value '
                f'13 is greater than end value 11\']}}]'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF CURATED EXPS WITH INVALID ITEM SELEC ' +
                'INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF CURATED EXPS WITH INVALID CONT INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF CURATED EXPS WITH INVALID REF EXP ID SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF CURATED EXPS WITH INVALID RTE IMAGE SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF CURATED EXPS WITH INVALID DRAG DROP ' +
                'INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF CURATED EXPS WITH INVALID RTE VIDEO SUCCESS: 1'
            )
        ])

    def test_run_with_invalid_private_exp(self) -> None:
        self.put_multi([self.exp_2, self.private_exp_summary])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                f'The id of private exp is 2, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid private exp item selection interaction '
                f'errors are [{{\'state_name\': \'EXP_2_STATE_2\', '
                f'\'item_selec_interaction_values\': [\'Selected choices '
                f'of rule 0 of answer group 0 either less than '
                f'min_selection_value or greter than '
                f'max_selection_value.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of private exp is 2, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid private exp continue interaction '
                f'errors are [{{\'state_name\': \'EXP_2_STATE_1\', '
                f'\'continue_interaction_invalid_values\': [\'The text '
                f'value is invalid, either it is empty or the character '
                f'length is more than 20 or it is None, the value is '
                f'Continueeeeeeeeeeeeeeeeeeeeeeeeee\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of private exp is 2, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid private exp refresher_exp_id errors are '
                f'[{{\'state_name\': \'EXP_2_STATE_1\', '
                f'\'invalid_refresher_exploration_id\': '
                f'[\'The refresher_exploration_id of answer group 0 is not '
                f'None having value Not None\', \'The '
                f'refresher_exploration_id of default outcome is not None '
                f'having value Not None\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of private exp is 2, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid private exp drag and drop interaction '
                f'errors are [{{\'state_name\': \'EXP_2_STATE_3\', '
                f'\'drag_drop_interaction_values\': [\'The rule 0 of '
                f'answer group 0 have multiple items at same place when '
                f'multiple items in same position settings is turned off.\', '
                f'\'The rule 0 of answer group 0 having rule type - '
                f'IsEqualToOrderingWithOneItemAtIncorrectPosition should not '
                f'be there when the multiple items in same position '
                f'setting is turned off.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of private exp is 2, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid private exp RTE image tag errors are '
                f'[{{\'state_name\': \'EXP_2_STATE_4\', \'rte_image_errors\': '
                f'[\'State - EXP_2_STATE_4 Image tag alt value is less than '
                f'5 at index 0 having value bbb.\', \'State - EXP_2_STATE_4 '
                f'Image tag filepath value at index 0 does not have svg '
                f'extension having value img_1.svgg.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of private exp is 2, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid private exp RTE video tag errors are '
                f'[{{\'state_name\': \'EXP_2_STATE_4\', \'rte_video_errors\': '
                f'[\'State - EXP_2_STATE_4 Video tag at index 2, start value '
                f'13 is greater than end value 11\']}}]'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PRIVATE EXPS WITH INVALID ITEM SELEC ' +
                'INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PRIVATE EXPS WITH INVALID CONT INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PRIVATE EXPS WITH INVALID REF EXP ID SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PRIVATE EXPS WITH INVALID RTE IMAGE SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PRIVATE EXPS WITH INVALID DRAG DROP ' +
                'INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PRIVATE EXPS WITH INVALID RTE VIDEO SUCCESS: 1'
            )
        ])

    def test_run_with_invalid_public_exp(self) -> None:
        self.put_multi([self.exp_3, self.public_exp_summary])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                f'The id of public exp is 3, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid public exp item selection interaction '
                f'errors are [{{\'state_name\': \'EXP_3_STATE_2\', '
                f'\'item_selec_interaction_values\': [\'Selected choices '
                f'of rule 0 of answer group 0 either less than '
                f'min_selection_value or greter than '
                f'max_selection_value.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of public exp is 3, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid public exp continue interaction '
                f'errors are [{{\'state_name\': \'EXP_3_STATE_1\', '
                f'\'continue_interaction_invalid_values\': [\'The text '
                f'value is invalid, either it is empty or the character '
                f'length is more than 20 or it is None, the value is '
                f'Continueeeeeeeeeeeeeeeeeeeeeeeeee\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of public exp is 3, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid public exp refresher_exp_id errors are '
                f'[{{\'state_name\': \'EXP_3_STATE_1\', '
                f'\'invalid_refresher_exploration_id\': '
                f'[\'The refresher_exploration_id of answer group 0 is not '
                f'None having value Not None\', \'The '
                f'refresher_exploration_id of default outcome is not None '
                f'having value Not None\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of public exp is 3, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid public exp drag and drop interaction '
                f'errors are [{{\'state_name\': \'EXP_3_STATE_3\', '
                f'\'drag_drop_interaction_values\': [\'The rule 0 of '
                f'answer group 0 have multiple items at same place when '
                f'multiple items in same position settings is turned off.\', '
                f'\'The rule 0 of answer group 0 having rule type - '
                f'IsEqualToOrderingWithOneItemAtIncorrectPosition should not '
                f'be there when the multiple items in same position '
                f'setting is turned off.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of public exp is 3, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid public exp RTE image tag errors are '
                f'[{{\'state_name\': \'EXP_3_STATE_4\', \'rte_image_errors\': '
                f'[\'State - EXP_3_STATE_4 Image tag alt value is less than '
                f'5 at index 0 having value bbb.\', \'State - EXP_3_STATE_4 '
                f'Image tag filepath value at index 0 does not have svg '
                f'extension having value img_1.svgg.\']}}]'
            ),
            job_run_result.JobRunResult.as_stderr(
                f'The id of public exp is 3, created '
                f'on {str(self.YEAR_AGO_DATE)}, '
                f'and the invalid public exp RTE video tag errors are '
                f'[{{\'state_name\': \'EXP_3_STATE_4\', \'rte_video_errors\': '
                f'[\'State - EXP_3_STATE_4 Video tag at index 2, start value '
                f'13 is greater than end value 11\']}}]'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PUBLIC EXPS WITH INVALID ITEM SELEC ' +
                'INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PUBLIC EXPS WITH INVALID CONT INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PUBLIC EXPS WITH INVALID REF EXP ID SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PUBLIC EXPS WITH INVALID RTE IMAGE SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PUBLIC EXPS WITH INVALID DRAG DROP ' +
                'INTERAC SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'NUMBER OF PUBLIC EXPS WITH INVALID RTE VIDEO SUCCESS: 1'
            )
        ])
