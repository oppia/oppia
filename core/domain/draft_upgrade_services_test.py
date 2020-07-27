# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for draft upgrade services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import draft_upgrade_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.tests import test_utils
import feconf
import python_utils
import utils


class DraftUpgradeUnitTests(test_utils.GenericTestBase):
    """Test the draft upgrade services module."""

    EXP_ID = 'exp_id'
    USER_ID = 'user_id'
    OTHER_CHANGE_LIST = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
        'property_name': 'title',
        'new_value': 'New title'
    })]
    EXP_MIGRATION_CHANGE_LIST = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'from_version': '0',
        'to_version': python_utils.UNICODE(
            feconf.CURRENT_STATE_SCHEMA_VERSION)
    })]
    DRAFT_CHANGELIST = [exp_domain.ExplorationChange({
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'Updated title'})]

    def setUp(self):
        super(DraftUpgradeUnitTests, self).setUp()
        self.save_new_valid_exploration(self.EXP_ID, self.USER_ID)

    def test_try_upgrade_with_no_version_difference(self):
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, 1, self.EXP_ID))

    def test_try_upgrade_raises_exception_if_versions_are_invalid(self):
        with self.assertRaisesRegexp(
            utils.InvalidInputException,
            'Current draft version is greater than the exploration version.'):
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 2, 1, self.EXP_ID)

        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID, self.OTHER_CHANGE_LIST,
            'Changed exploration title.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, exploration.version, self.EXP_ID))

    def test_try_upgrade_failure_due_to_unsupported_commit_type(self):
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID, self.OTHER_CHANGE_LIST,
            'Changed exploration title.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, exploration.version, self.EXP_ID))

    def test_try_upgrade_failure_due_to_unimplemented_upgrade_methods(self):
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID, self.EXP_MIGRATION_CHANGE_LIST,
            'Ran Exploration Migration job.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, exploration.version, self.EXP_ID))

    def test_extract_html_from_draft_change_list(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        draft_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state2',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            html_content,
                            '<p>4</p>'
                        ]
                    },
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    }
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'ContainsAtLeastOneOf',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'IsProperSubsetOf',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'DoesNotContainAtLeastOneOf',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': 1
                        }
                    }, {
                        'rule_type': 'HasElementXAtPositionY',
                        'inputs': {
                            'x': html_content,
                            'y': 2
                        }
                    }, {
                        'rule_type': 'IsEqualToOrdering',
                        'inputs': {
                            'x': [[html_content]]
                        }
                    }, {
                        'rule_type': 'HasElementXBeforeElementY',
                        'inputs': {
                            'x': html_content,
                            'y': html_content
                        }
                    }, {
                        'rule_type': (
                            'IsEqualToOrderingWithOneItemAtIncorrectPosition'),
                        'inputs': {
                            'x': [[html_content]]
                        }
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': html_content
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': html_content
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'written_translations',
                'new_value': {
                    'translations_mapping': {
                        'content1': {
                            'en': {
                                'html': html_content,
                                'needs_update': True
                            },
                            'hi': {
                                'html': 'Hey!',
                                'needs_update': False
                            }
                        },
                        'feedback_1': {
                            'hi': {
                                'html': html_content,
                                'needs_update': False
                            },
                            'en': {
                                'html': 'hello!',
                                'needs_update': False
                            }
                        }
                    }
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'solution',
                'new_value': {
                    'answer_is_exclusive': False,
                    'correct_answer': 'helloworld!',
                    'explanation': {
                        'content_id': 'solution',
                        'html': html_content
                    },
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'solution',
                'new_value': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        [html_content],
                        ['<p>2</p>'],
                        ['<p>3</p>'],
                        ['<p>4</p>']
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_content
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'hints',
                'new_value': [{
                    'hint_content': {
                        'content_id': 'hint1',
                        'html': html_content
                    }
                }]
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Intro',
                'new_state_name': 'Introduction',
            })
        ]

        list_of_html = (
            draft_upgrade_services.extract_html_from_draft_change_list(
                draft_change_list))
        self.assertEqual(len(list_of_html), 27)
        expected_html_strings = [
            html_content, '<p>1</p>', '<p>2</p>', '<p>3</p>', '<p>4</p>',
            '<p>This is solution for state1</p>', 'Hey!', 'hello!']
        for html in list_of_html:
            self.assertTrue(html in expected_html_strings)


class DraftUpgradeUtilUnitTests(test_utils.GenericTestBase):
    """Test the DraftUpgradeUtil module."""

    EXP_ID = 'exp_id'
    USER_ID = 'user_id'
    EXP_MIGRATION_CHANGE_LIST = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'from_version': '33',
        'to_version': '34'
    })]

    # EXP_ID and USER_ID used to create default explorations.
    EXP_ID = 'exp_id'
    USER_ID = 'user_id'

    def create_and_migrate_new_exploration(
            self, current_schema_version, target_schema_version):
        """Creates an exploration and applies a state schema migration to it.

        Creates an exploration and migrates its state schema from version
        current_schema_version to target_schema_version. Asserts that the
        exploration was successfully migrated.

        Args:
            current_schema_version: string. The current schema version of the
                exploration (eg. '29').
            target_schema_version: string. The schema version to upgrade
                the exploration to (eg. '30').
        """

        # Create an exploration change list with the command that will migrate
        # the schema from current_schema_version to target_schema_version.
        exp_migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': current_schema_version,
                'to_version': target_schema_version
            })
        ]

        # The migration will automatically migrate the exploration to the latest
        # state schema version, so we set the latest schema version to be the
        # target_schema_version.
        with self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION',
            int(target_schema_version)):

            # Create and migrate the exploration.
            self.save_new_valid_exploration(self.EXP_ID, self.USER_ID)
            exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
            exp_services.update_exploration(
                self.USER_ID, self.EXP_ID, exp_migration_change_list,
                'Ran Exploration Migration job.')

            # Assert that the update was applied and that the exploration state
            # schema was successfully updated.
            exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
            self.assertEqual(exploration.version, 2)
            self.assertEqual(
                python_utils.UNICODE(
                    exploration.states_schema_version),
                target_schema_version)

    def test_convert_to_latest_schema_version_implemented(self):
        state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        conversion_fn_name = '_convert_states_v%s_dict_to_v%s_dict' % (
            state_schema_version - 1, state_schema_version)
        self.assertTrue(
            hasattr(
                draft_upgrade_services.DraftUpgradeUtil, conversion_fn_name),
            msg='Current schema version is %d but DraftUpgradeUtil.%s is '
            'unimplemented.' % (state_schema_version, conversion_fn_name))

    def test_convert_states_v33_dict_to_v34_dict(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        draft_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state2',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            html_content,
                            '<p>4</p>'
                        ]
                    },
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    }
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'ContainsAtLeastOneOf',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'IsProperSubsetOf',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'DoesNotContainAtLeastOneOf',
                        'inputs': {
                            'x': [html_content]
                        }
                    }, {
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': 1
                        }
                    }, {
                        'rule_type': 'HasElementXAtPositionY',
                        'inputs': {
                            'x': html_content,
                            'y': 2
                        }
                    }, {
                        'rule_type': 'IsEqualToOrdering',
                        'inputs': {
                            'x': [[html_content]]
                        }
                    }, {
                        'rule_type': 'HasElementXBeforeElementY',
                        'inputs': {
                            'x': html_content,
                            'y': html_content
                        }
                    }, {
                        'rule_type': (
                            'IsEqualToOrderingWithOneItemAtIncorrectPosition'),
                        'inputs': {
                            'x': [[html_content]]
                        }
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': html_content
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': html_content
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'written_translations',
                'new_value': {
                    'translations_mapping': {
                        'content1': {
                            'en': {
                                'html': html_content,
                                'needs_update': True
                            },
                            'hi': {
                                'html': 'Hey!',
                                'needs_update': False
                            }
                        },
                        'feedback_1': {
                            'hi': {
                                'html': html_content,
                                'needs_update': False
                            },
                            'en': {
                                'html': 'hello!',
                                'needs_update': False
                            }
                        }
                    }
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'solution',
                'new_value': {
                    'answer_is_exclusive': False,
                    'correct_answer': 'helloworld!',
                    'explanation': {
                        'content_id': 'solution',
                        'html': html_content
                    },
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'solution',
                'new_value': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        [html_content],
                        ['<p>2</p>'],
                        ['<p>3</p>'],
                        ['<p>4</p>']
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_content
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'hints',
                'new_value': [{
                    'hint_content': {
                        'content_id': 'hint1',
                        'html': html_content
                    }
                }]
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Intro',
                'new_state_name': 'Introduction',
            })
        ]

        self.save_new_valid_exploration(self.EXP_ID, self.USER_ID)
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID, self.EXP_MIGRATION_CHANGE_LIST,
            'Ran Exploration Migration job.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        migrated_draft_change_list = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list, 1, exploration.version, self.EXP_ID))
        self.assertEqual(
            migrated_draft_change_list[0].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state2',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            expected_html_content,
                            '<p>4</p>'
                        ]
                    },
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    }
                }
            }).to_dict())

        self.assertEqual(
            migrated_draft_change_list[1].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': [expected_html_content]
                        }
                    }, {
                        'rule_type': 'ContainsAtLeastOneOf',
                        'inputs': {
                            'x': [expected_html_content]
                        }
                    }, {
                        'rule_type': 'IsProperSubsetOf',
                        'inputs': {
                            'x': [expected_html_content]
                        }
                    }, {
                        'rule_type': 'DoesNotContainAtLeastOneOf',
                        'inputs': {
                            'x': [expected_html_content]
                        }
                    }, {
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': 1
                        }
                    }, {
                        'rule_type': 'HasElementXAtPositionY',
                        'inputs': {
                            'x': expected_html_content,
                            'y': 2
                        }
                    }, {
                        'rule_type': 'IsEqualToOrdering',
                        'inputs': {
                            'x': [[expected_html_content]]
                        }
                    }, {
                        'rule_type': 'HasElementXBeforeElementY',
                        'inputs': {
                            'x': expected_html_content,
                            'y': expected_html_content
                        }
                    }, {
                        'rule_type': (
                            'IsEqualToOrderingWithOneItemAtIncorrectPosition'),
                        'inputs': {
                            'x': [[expected_html_content]]
                        }
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': expected_html_content
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]
            }).to_dict())
        self.assertEqual(
            migrated_draft_change_list[2].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': expected_html_content
                }
            }).to_dict())
        self.assertEqual(
            migrated_draft_change_list[3].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'written_translations',
                'new_value': {
                    'translations_mapping': {
                        'content1': {
                            'en': {
                                'html': expected_html_content,
                                'needs_update': True
                            },
                            'hi': {
                                'html': 'Hey!',
                                'needs_update': False
                            }
                        },
                        'feedback_1': {
                            'hi': {
                                'html': expected_html_content,
                                'needs_update': False
                            },
                            'en': {
                                'html': 'hello!',
                                'needs_update': False
                            }
                        }
                    }
                }
            }).to_dict())
        self.assertEqual(
            migrated_draft_change_list[4].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'solution',
                'new_value': {
                    'answer_is_exclusive': False,
                    'correct_answer': 'helloworld!',
                    'explanation': {
                        'content_id': 'solution',
                        'html': expected_html_content
                    },
                }
            }).to_dict())
        self.assertEqual(
            migrated_draft_change_list[5].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'solution',
                'new_value': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        [expected_html_content],
                        ['<p>2</p>'],
                        ['<p>3</p>'],
                        ['<p>4</p>']
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                }
            }).to_dict())

        self.assertEqual(
            migrated_draft_change_list[6].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': expected_html_content
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                }
            }).to_dict())

        self.assertEqual(
            migrated_draft_change_list[7].to_dict(),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'hints',
                'new_value': [{
                    'hint_content': {
                        'content_id': 'hint1',
                        'html': expected_html_content
                    }
                }]
            }).to_dict())

    def test_convert_states_v32_dict_to_v33_dict(self):
        draft_change_list_v32 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state1',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            '<p>3</p>',
                            '<p>4</p>'
                        ]
                    }
                }
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state2',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            '<p>3</p>',
                            '<p>4</p>'
                        ]
                    },
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    }
                }
            })
        ]
        # Version 33 adds a showChoicesInShuffledOrder bool, which doesn't
        # impact the second ExplorationChange because it will only impact
        # it if 'choices' is the only key for new_value.
        expected_draft_change_list_v33 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state1',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            '<p>3</p>',
                            '<p>4</p>'
                        ]
                    },
                    'showChoicesInShuffledOrder': {
                        'value': False
                    }
                }
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state2',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            '<p>1</p>',
                            '<p>2</p>',
                            '<p>3</p>',
                            '<p>4</p>'
                        ]
                    },
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    }
                }
            })
        ]
        # Migrate exploration to state schema version 33.
        self.create_and_migrate_new_exploration('32', '33')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema.
        migrated_draft_change_list_v33 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v32, 1, 2, self.EXP_ID)
        )
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v33_dict_list = [
            change.to_dict() for change in expected_draft_change_list_v33
        ]
        migrated_draft_change_list_v33_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v33
        ]
        self.assertEqual(
            expected_draft_change_list_v33_dict_list,
            migrated_draft_change_list_v33_dict_list)

    def test_convert_states_v31_dict_to_v32_dict(self):
        draft_change_list_v31 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 32.
        self.create_and_migrate_new_exploration('31', '32')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema. In this case there are no changes to the
        # draft change list since version 32 adds a customization arg
        # for the "Add" button text in SetInput interaction for the
        # exploration, for which there should be no changes to drafts.
        migrated_draft_change_list_v32 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v31, 1, 2, self.EXP_ID)
        )
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v31_dict_list = [
            change.to_dict() for change in draft_change_list_v31
        ]
        migrated_draft_change_list_v32_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v32
        ]
        self.assertEqual(
            draft_change_list_v31_dict_list,
            migrated_draft_change_list_v32_dict_list)

    def test_convert_states_v30_dict_to_v31_dict(self):
        draft_change_list_v30 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'recorded_voiceovers',
                'new_value': {
                    'voiceovers_mapping': {
                        'content': {
                            'en': {
                                'file_size_name': 100,
                                'filename': 'atest.mp3',
                                'needs_update': False
                            }
                        }
                    }
                }
            })
        ]
        # Version 31 adds the duration_secs property.
        expected_draft_change_list_v31 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'recorded_voiceovers',
                'new_value': {
                    'voiceovers_mapping': {
                        'content': {
                            'en': {
                                'file_size_name': 100,
                                'filename': 'atest.mp3',
                                'needs_update': False,
                                'duration_secs': 0.0
                            }
                        }
                    }
                }
            })
        ]
        # Migrate exploration to state schema version 31.
        self.create_and_migrate_new_exploration('30', '31')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema.
        migrated_draft_change_list_v31 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v30, 1, 2, self.EXP_ID)
        )
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v31_dict_list = [
            change.to_dict() for change in expected_draft_change_list_v31
        ]
        migrated_draft_change_list_v31_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v31
        ]
        self.assertEqual(
            expected_draft_change_list_v31_dict_list,
            migrated_draft_change_list_v31_dict_list)

    def test_convert_states_v29_dict_to_v30_dict(self):
        draft_change_list_v29 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': {
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {'x': [
                            '<p>This is value1 for ItemSelection</p>'
                        ]}
                    }, {
                        'rule_type': 'Equals',
                        'inputs': {'x': [
                            '<p>This is value2 for ItemSelection</p>'
                        ]}
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': '<p>Outcome for state1</p>'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_misconception_id': None
                }
            })
        ]
        # Version 30 replaces the tagged_misconception_id in version 29
        # with tagged_skill_misconception_id.
        expected_draft_change_list_v30 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': {
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {'x': [
                            '<p>This is value1 for ItemSelection</p>'
                        ]}
                    }, {
                        'rule_type': 'Equals',
                        'inputs': {'x': [
                            '<p>This is value2 for ItemSelection</p>'
                        ]}
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': '<p>Outcome for state1</p>'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }
            })
        ]
        # Migrate exploration to state schema version 30.
        self.create_and_migrate_new_exploration('29', '30')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema.
        migrated_draft_change_list_v30 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v29, 1, 2, self.EXP_ID)
        )
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v30_dict_list = [
            change.to_dict() for change in expected_draft_change_list_v30
        ]
        migrated_draft_change_list_v30_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v30
        ]
        self.assertEqual(
            expected_draft_change_list_v30_dict_list,
            migrated_draft_change_list_v30_dict_list)

    def test_convert_states_v28_dict_to_v29_dict(self):
        draft_change_list_v28 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 29.
        self.create_and_migrate_new_exploration('28', '29')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema. In this case there are no change to the
        # draft change list since version 29 adds the
        # solicit_answer_details boolean variable to the exploration
        # state, for which there should be no changes to drafts.
        migrated_draft_change_list_v29 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v28, 1, 2, self.EXP_ID)
        )
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v28_dict_list = [
            change.to_dict() for change in draft_change_list_v28
        ]
        migrated_draft_change_list_v29_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v29
        ]
        self.assertEqual(
            draft_change_list_v28_dict_list,
            migrated_draft_change_list_v29_dict_list)

    def test_convert_states_v27_dict_to_v28_dict(self):
        draft_change_list_v27 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'content_ids_to_audio_translations',
                'state_name': 'State B',
                'new_value': 'new value',
            })
        ]
        # Version 28 adds voiceovers_mapping.
        expected_draft_change_list_v28 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'recorded_voiceovers',
                'state_name': 'State B',
                'new_value': {'voiceovers_mapping': 'new value'}
            })
        ]
        # Migrate exploration to state schema version 28.
        self.create_and_migrate_new_exploration('27', '28')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema.
        migrated_draft_change_list_v28 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v27, 1, 2, self.EXP_ID)
        )
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v28_dict_list = [
            change.to_dict() for change in expected_draft_change_list_v28
        ]
        migrated_draft_change_list_v28_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v28
        ]
        self.assertEqual(
            expected_draft_change_list_v28_dict_list,
            migrated_draft_change_list_v28_dict_list)
