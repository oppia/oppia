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

from __future__ import annotations

from core import feconf
from core import utils
from core.domain import draft_upgrade_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import state_domain
from core.domain import translation_domain
from core.tests import test_utils

from typing import Dict, Final


class DraftUpgradeUnitTests(test_utils.GenericTestBase):
    """Test the draft upgrade services module."""

    EXP_ID: Final = 'exp_id'
    USER_ID: Final = 'user_id'
    OTHER_CHANGE_LIST: Final = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
        'property_name': 'title',
        'new_value': 'New title'
    })]
    EXP_MIGRATION_CHANGE_LIST: Final = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'from_version': '0',
        'to_version': str(feconf.CURRENT_STATE_SCHEMA_VERSION)
    })]
    DRAFT_CHANGELIST: Final = [exp_domain.ExplorationChange({
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'Updated title'})]

    def setUp(self) -> None:
        super().setUp()
        self.save_new_valid_exploration(self.EXP_ID, self.USER_ID)

    def test_try_upgrade_with_no_version_difference(self) -> None:
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, 1, self.EXP_ID))

    def test_try_upgrade_raises_exception_if_versions_are_invalid(self) -> None:
        with self.assertRaisesRegex(
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

    def test_try_upgrade_failure_due_to_unsupported_commit_type(self) -> None:
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID, self.OTHER_CHANGE_LIST,
            'Changed exploration title.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, exploration.version, self.EXP_ID))

    def test_try_upgrade_failure_due_to_unimplemented_upgrade_methods(
        self
    ) -> None:
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID, self.EXP_MIGRATION_CHANGE_LIST,
            'Ran Exploration Migration job.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)
        self.assertIsNone(
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                self.DRAFT_CHANGELIST, 1, exploration.version, self.EXP_ID))


class DraftUpgradeUtilUnitTests(test_utils.GenericTestBase):
    """Test the DraftUpgradeUtil module."""

    EXP_ID: Final = 'exp_id'
    USER_ID: Final = 'user_id'
    EXP_MIGRATION_CHANGE_LIST: Final = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'from_version': '36',
        'to_version': '37'
    })]

    def create_and_migrate_new_exploration(
        self,
        current_schema_version: str,
        target_schema_version: str
    ) -> None:
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
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', int(target_schema_version)):

            # Create and migrate the exploration.
            self.save_new_valid_exploration(self.EXP_ID, self.USER_ID)
            exp_services.update_exploration(
                self.USER_ID, self.EXP_ID, exp_migration_change_list,
                'Ran Exploration Migration job.')

            # Assert that the update was applied and that the exploration state
            # schema was successfully updated.
            exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
            self.assertEqual(exploration.version, 2)
            self.assertEqual(
                str(exploration.states_schema_version), target_schema_version)

    def test_convert_to_latest_schema_version_implemented(self) -> None:
        state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        conversion_fn_name = '_convert_states_v%s_dict_to_v%s_dict' % (
            state_schema_version - 1, state_schema_version)
        self.assertTrue(
            hasattr(
                draft_upgrade_services.DraftUpgradeUtil, conversion_fn_name),
            msg='Current schema version is %d but DraftUpgradeUtil.%s is '
            'unimplemented.' % (state_schema_version, conversion_fn_name))

    def test_convert_states_v55_dict_to_v56_dict(self) -> None:
        draft_change_list_v55 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'TextInput'
            })
        ]
        # Migrate exploration to state schema version 56.
        self.create_and_migrate_new_exploration('55', '56')
        migrated_draft_change_list_v56 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v55, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v56 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v55_dict_list = [
            change.to_dict() for change in draft_change_list_v55
        ]
        migrated_draft_change_list_v56_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v56
        ]
        self.assertEqual(
            draft_change_list_v55_dict_list,
            migrated_draft_change_list_v56_dict_list)

    def test_convert_states_v54_dict_to_v55_dict_without_state_changes(
        self
    ) -> None:
        draft_change_list_1_v54 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New Title'
            })
        ]

        self.create_and_migrate_new_exploration('54', '55')
        migrated_draft_change_list_1_v55 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v54, 1, 2, self.EXP_ID))

        self.assertFalse(migrated_draft_change_list_1_v55 is None)

    def test_convert_states_v54_dict_to_v55_dict_with_state_changes(
        self
    ) -> None:
        new_value: Dict[str, str] = {}
        draft_change_list_1_v54 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': new_value
            })
        ]

        # Migrate exploration to state schema version 54.
        self.create_and_migrate_new_exploration('54', '55')
        migrated_draft_change_list_1_v55 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v54, 1, 2, self.EXP_ID))
        # Verify that changes are not upgraded to v54.
        self.assertIsNone(migrated_draft_change_list_1_v55)

    def test_convert_states_v53_dict_to_v54_dict(self) -> None:
        draft_change_list_v53 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'TextInput'
            })
        ]
        # Migrate exploration to state schema version 54.
        self.create_and_migrate_new_exploration('53', '54')
        migrated_draft_change_list_v54 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v53, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v54 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v52_dict_list = [
            change.to_dict() for change in draft_change_list_v53
        ]
        migrated_draft_change_list_v53_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v54
        ]
        self.assertEqual(
            draft_change_list_v52_dict_list,
            migrated_draft_change_list_v53_dict_list)

    def test_convert_states_v52_dict_to_v53_dict(self) -> None:
        ans_group_1 = state_domain.AnswerGroup(
            state_domain.Outcome(
                'state_name', None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Try again</p>'),
                True, [], 'Not None', None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_Equals',
                            'normalizedStrSet': ['Test']
                        }
                    })
            ],
            [],
            'Not None'
        ).to_dict()

        ans_group_2 = state_domain.AnswerGroup(
            state_domain.Outcome(
                'state_name',
                None,
                state_domain.SubtitledHtml('feedback_1', '<p>Feedback</p>'),
                False,
                [],
                None,
                None
            ),
            [],
            [],
            None
        ).to_dict()

        interaction_answer_groups = [
            ans_group_1,
            ans_group_2
        ]

        draft_change_list_v52_1 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state_name',
                'property_name': (
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                'new_value': interaction_answer_groups
            })
        ]

        draft_change_list_v52_2 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'New state',
                'old_value': state_domain.SubtitledHtml(
                    'content', '').to_dict(),
                'new_value': state_domain.SubtitledHtml(
                    'content',
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&quot;abc.png&quot;" caption-with-value="&quot;'
                    '&quot;"></oppia-noninteractive-image>'
                ).to_dict()
            })
        ]

        draft_change_list_v52_3 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'New state',
                'old_value': state_domain.SubtitledHtml(
                    'content', '').to_dict(),
                'new_value': state_domain.SubtitledHtml(
                    'content', (
                    '<oppia-noninteractive-tabs tab_contents-with-value=\"'
                    '[{&amp;quot;title&amp;quot;:&amp;quot;Title1&amp;'
                    'quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p'
                    '&amp;gt;Content1&amp;lt;/p&amp;gt;&amp;quot;},'
                    '{&amp;quot;title&amp;quot;:&amp;quot;Title2&amp;quot;'
                    ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;'
                    'gt;Content2&amp;lt;/p&amp;gt;&amp;lt;'
                    'oppia-noninteractive-image filepath-with-value=\\'
                    '&amp;quot;&amp;amp;amp;quot;s7TabImage.png&amp;amp;'
                    'amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/'
                    'oppia-noninteractive-image&amp;gt;&amp;quot;}]\">'
                    '</oppia-noninteractive-tabs>')).to_dict()
                }
            )
        ]

        draft_change_list_v52_4 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': (
                    exp_domain.DEPRECATED_STATE_PROPERTY_WRITTEN_TRANSLATIONS),
                'state_name': 'New state',
                'old_value': translation_domain.WrittenTranslations({
                    'content': {
                        'en': translation_domain.WrittenTranslation(
                            'html', '', False)
                    }
                }).to_dict(),
                'new_value': translation_domain.WrittenTranslations({
                    'content': {
                        'en': translation_domain.WrittenTranslation(
                            'html',
                            (
                                '<oppia-noninteractive-image '
                                'filepath-with-value="&quot;abc.png&quot;" '
                                'caption-with-value="&quot;&quot;">'
                                '</oppia-noninteractive-image>'
                            ),
                            True
                        )
                    }
                }).to_dict()
            })
        ]

        draft_change_list_v52_5 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'auto_tts_enabled',
                'new_value': True,
            })
        ]

        draft_change_list_v52_6 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': (
                    exp_domain.DEPRECATED_STATE_PROPERTY_WRITTEN_TRANSLATIONS),
                'state_name': 'New state',
                'old_value': translation_domain.WrittenTranslations({
                    'content': {
                        'en': translation_domain.WrittenTranslation(
                            'html', '', False)
                    }
                }).to_dict(),
                'new_value': translation_domain.WrittenTranslations({
                    'content': {
                        'en': translation_domain.WrittenTranslation(
                            'html', ['content'], True
                        )
                    }
                }).to_dict()
            })
        ]

        self.create_and_migrate_new_exploration('52', '53')

        migrated_draft_change_list_v53_1 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v52_1, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v53_1 is None

        migrated_draft_change_list_v53_2 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v52_2, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v53_2 is not None
        self.assertEqual(
            [change.to_dict() for change in draft_change_list_v52_2],
            [change.to_dict() for change in migrated_draft_change_list_v53_2]
        )

        migrated_draft_change_list_v53_3 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v52_3, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v53_3 is not None
        self.assertEqual(
            [change.to_dict() for change in draft_change_list_v52_3],
            [change.to_dict() for change in migrated_draft_change_list_v53_3]
        )

        migrated_draft_change_list_v53_4 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v52_4, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v53_4 is not None
        self.assertEqual(
            [change.to_dict() for change in draft_change_list_v52_4],
            [change.to_dict() for change in migrated_draft_change_list_v53_4]
        )

        migrated_draft_change_list_v53_5 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v52_5, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v53_5 is not None
        self.assertEqual(
            [change.to_dict() for change in draft_change_list_v52_5],
            [change.to_dict() for change in migrated_draft_change_list_v53_5]
        )

        migrated_draft_change_list_v53_6 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v52_6, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v53_6 is None

    def test_convert_states_v51_dict_to_v52_dict(self) -> None:
        draft_change_list_v51_1 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        draft_change_list_v51_2 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'next_content_id_index',
                'new_value': 'new value'
            })
        ]
        draft_change_list_v51_3 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'Intro',
                'content_id': 'content_id',
                'language_code': 'en',
                'content_html': 'content',
                'translation_html': 'content',
                'data_format': 'format_1',
            })
        ]
        self.create_and_migrate_new_exploration('51', '52')

        migrated_draft_change_list_v52_1 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v51_1, 1, 2, self.EXP_ID)
        )
        assert migrated_draft_change_list_v52_1 is not None
        self.assertEqual(
            [change.to_dict() for change in draft_change_list_v51_1],
            [change.to_dict() for change in migrated_draft_change_list_v52_1]
        )

        migrated_draft_change_list_v52_2 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v51_2, 1, 2, self.EXP_ID)
        )
        self.assertIsNone(migrated_draft_change_list_v52_2)

        migrated_draft_change_list_v52_3 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v51_3, 1, 2, self.EXP_ID)
        )
        self.assertIsNone(migrated_draft_change_list_v52_3)

    def test_convert_states_v50_dict_to_v51_dict(self) -> None:
        draft_change_list_v50 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
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
                }]
            })
        ]
        # Version 51 adds the dest_if_really_stuck field.
        expected_draft_change_list_v51 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
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
                        'dest_if_really_stuck': None,
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
                }]
            })
        ]
        # Migrate exploration to state schema version 51.
        self.create_and_migrate_new_exploration('50', '51')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema.
        migrated_draft_change_list_v51 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v50, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v51 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v51_dict_list = [
            change.to_dict() for change in expected_draft_change_list_v51
        ]
        migrated_draft_change_list_v51_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v51
        ]
        self.assertEqual(
            expected_draft_change_list_v51_dict_list,
            migrated_draft_change_list_v51_dict_list)

        draft_change_list_v50_2 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'feedback',
                        'html': '<p>Content</p>'
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                }
            })
        ]
        # Version 51 adds the dest_if_really_stuck field.
        expected_draft_change_list_v51_2 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'feedback',
                        'html': '<p>Content</p>'
                    },
                    'dest': 'Introduction',
                    'dest_if_really_stuck': None,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                }
            })
        ]
        # Migrate exploration to state schema version 51.
        self.create_and_migrate_new_exploration('50', '51')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema.
        migrated_draft_change_list_v51_2 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v50_2, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v51_2 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v51_dict_list_2 = [
            change.to_dict() for change in expected_draft_change_list_v51_2
        ]
        migrated_draft_change_list_v51_dict_list_2 = [
            change.to_dict() for change in migrated_draft_change_list_v51_2
        ]
        self.assertEqual(
            expected_draft_change_list_v51_dict_list_2,
            migrated_draft_change_list_v51_dict_list_2)

    def test_convert_states_v49_dict_to_v50_dict(self) -> None:
        draft_change_list_v49 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 49.
        self.create_and_migrate_new_exploration('49', '50')
        migrated_draft_change_list_v50 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v49, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v50 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v49_dict_list = [
            change.to_dict() for change in draft_change_list_v49
        ]
        migrated_draft_change_list_v50_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v50
        ]
        self.assertEqual(
            draft_change_list_v49_dict_list,
            migrated_draft_change_list_v50_dict_list)

    def test_convert_states_v48_dict_to_v49_dict(self) -> None:
        draft_change_list_v48 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'NumericInput'
            })
        ]
        # Migrate exploration to state schema version 48.
        self.create_and_migrate_new_exploration('48', '49')
        migrated_draft_change_list_v49 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v48, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v49 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v48_dict_list = [
            change.to_dict() for change in draft_change_list_v48
        ]
        migrated_draft_change_list_v49_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v49
        ]
        self.assertEqual(
            draft_change_list_v48_dict_list,
            migrated_draft_change_list_v49_dict_list)

    def test_convert_states_v47_dict_to_v48_dict(self) -> None:
        draft_change_list_v47 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': state_domain.SubtitledHtml(
                    'content',
                    '<p>àãáâäåæçèéêëìíîïóúûýö÷üÕÇÖÑÓÄÀÜ×ßğīĻıİćęąĀ<p>'
                    '<p>İźžśşɛمшصحếở“∉⅘√∈◯–⅖⅔≤€やんもをり北木我是西错õ</p>'
                    '<p>üóäüñıīç×÷öóûؤ¡´</p>'
                    '<p>😕😊😉🙄🙂😊🙂💡😑😊🔖😉😃🤖📷😂📀💿💯💡</p>'
                    '<p>👋😱😑😊🎧🎙🎼📻🤳👌🚦🤗😄👉📡📣📢🔊²</p>'
                ).to_dict()
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Intro',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            state_domain.SubtitledHtml(
                                'ca_choices_0',
                                '<p>àãáâäåæçèéêëìíîïóúûýö÷üÕÇÖÑÓÄÀÜ×ßğīĻıİć<p>'
                                '<p>İźžśşɛمшصحếở“∉⅘√∈◯–⅖⅔≤ęąĀ€やんもをり</p>'
                                '<p>üóäüñıīç×÷öóûؤ¡北木我是西错õ´😕😊😉</p>'
                                '<p>🙄🙂😊🙂💡😑😊🔖😉😃🤖📷😂📀💿💯💡</p>'
                                '<p>👋😱😑😊🎧🎙🎼📻🤳👌🚦🤗😄👉📡📣📢🔊²</p>'
                            ).to_dict()
                        ]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                }
            })
        ]
        # Migrate exploration to state schema version 48.
        self.create_and_migrate_new_exploration('47', '48')
        migrated_draft_change_list_v48 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v47, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v48 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v47_dict_list = [
            change.to_dict() for change in draft_change_list_v47
        ]
        migrated_draft_change_list_v48_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v48
        ]
        self.assertEqual(
            draft_change_list_v47_dict_list,
            migrated_draft_change_list_v48_dict_list)

    def test_convert_states_v46_dict_to_v47_dict(self) -> None:
        draft_change_list_v46 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': state_domain.SubtitledHtml(
                    'content',
                    '<oppia-noninteractive-svgdiagram '
                    'svg_filename-with-value="&amp;quot;img12.svg&amp;quot;"'
                    ' alt-with-value="&amp;quot;Image&amp;quot;">'
                    '</oppia-noninteractive-svgdiagram>'
                    '<oppia-noninteractive-svgdiagram '
                    'svg_filename-with-value="&amp;quot;img2.svg&amp;quot;"'
                    ' alt-with-value="&amp;quot;Image123&amp;quot;">'
                    '</oppia-noninteractive-svgdiagram>'
                    '<oppia-noninteractive-svgdiagram '
                    'alt-with-value="&amp;quot;Image12345&amp;quot;"'
                    ' svg_filename-with-value="&amp;quot;igage.svg&amp;quot;">'
                    '</oppia-noninteractive-svgdiagram>'
                ).to_dict()
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Intro',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [
                            state_domain.SubtitledHtml(
                                'ca_choices_0',
                                '<oppia-noninteractive-svgdiagram '
                                'svg_filename-with-value="&amp;quot;'
                                'img12.svg&amp;quot;" alt-with-value="'
                                '&amp;quot;Image&amp;quot;">'
                                '</oppia-noninteractive-svgdiagram>'
                            ).to_dict()
                        ]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                }
            })
        ]
        # Migrate exploration to state schema version 47.
        self.create_and_migrate_new_exploration('46', '47')
        migrated_draft_change_list_v47 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v46, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v47 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v46_dict_list = [
            change.to_dict() for change in draft_change_list_v46
        ]
        migrated_draft_change_list_v47_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v47
        ]
        self.assertEqual(
            draft_change_list_v46_dict_list,
            migrated_draft_change_list_v47_dict_list)

    def test_convert_states_v45_dict_to_v46_dict(self) -> None:
        draft_change_list_v45 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 46.
        self.create_and_migrate_new_exploration('45', '46')
        migrated_draft_change_list_v46 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v45, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v46 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v45_dict_list = [
            change.to_dict() for change in draft_change_list_v45
        ]
        migrated_draft_change_list_v46_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v46
        ]
        self.assertEqual(
            draft_change_list_v45_dict_list,
            migrated_draft_change_list_v46_dict_list)

    def test_convert_states_v44_dict_to_v45_dict(self) -> None:
        draft_change_list_v44 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 45.
        self.create_and_migrate_new_exploration('44', '45')
        migrated_draft_change_list_v45 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v44, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v45 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v44_dict_list = [
            change.to_dict() for change in draft_change_list_v44
        ]
        migrated_draft_change_list_v45_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v45
        ]
        self.assertEqual(
            draft_change_list_v44_dict_list,
            migrated_draft_change_list_v45_dict_list)

    def test_convert_states_v43_dict_to_v44_dict(self) -> None:
        draft_change_list_v43 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Introduction',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 44.
        self.create_and_migrate_new_exploration('43', '44')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema. In this case there are no change to the
        # draft change list since version 44 adds the
        # card_is_checkpoint boolean variable to the exploration
        # state, for which there should be no changes to drafts.
        migrated_draft_change_list_v44 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v43, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v44 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v43_dict_list = [
            change.to_dict() for change in draft_change_list_v43
        ]
        migrated_draft_change_list_v44_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v44
        ]
        self.assertEqual(
            draft_change_list_v43_dict_list,
            migrated_draft_change_list_v44_dict_list)

    def test_convert_states_v42_dict_to_v43_dict(self) -> None:
        new_value: Dict[str, str] = {}
        draft_change_list_1_v42 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': new_value
            })
        ]
        draft_change_list_2_v42 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            })
        ]
        # Migrate exploration to state schema version 43.
        self.create_and_migrate_new_exploration('42', '43')
        migrated_draft_change_list_1_v43 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v42, 1, 2, self.EXP_ID))
        # Verify that changes which include answer groups are
        # not upgraded to v42.
        self.assertIsNone(migrated_draft_change_list_1_v43)

        migrated_draft_change_list_2_v43 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_2_v42, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_2_v43 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_2_v42_dict_list = [
            change.to_dict() for change in draft_change_list_2_v42
        ]
        migrated_draft_change_list_2_v43_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_2_v43
        ]
        # Verify that changes which do not include answer groups can
        # be upgraded to v43.
        self.assertEqual(
            draft_change_list_2_v42_dict_list,
            migrated_draft_change_list_2_v43_dict_list)

    def test_convert_states_v41_dict_to_v42_dict(self) -> None:
        new_value: Dict[str, str] = {}
        draft_change_list_1_v41 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': new_value
            })
        ]
        draft_change_list_2_v41 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            })
        ]
        # Migrate exploration to state schema version 42.
        self.create_and_migrate_new_exploration('41', '42')
        migrated_draft_change_list_1_v42 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v41, 1, 2, self.EXP_ID))
        # Verify that changes which include answer groups are
        # not upgraded to v41.
        self.assertIsNone(migrated_draft_change_list_1_v42)

        migrated_draft_change_list_2_v42 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_2_v41, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_2_v42 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_2_v41_dict_list = [
            change.to_dict() for change in draft_change_list_2_v41
        ]
        migrated_draft_change_list_2_v42_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_2_v42
        ]
        # Verify that changes which do not include answer groups can
        # be upgraded to v42.
        self.assertEqual(
            draft_change_list_2_v41_dict_list,
            migrated_draft_change_list_2_v42_dict_list)

    def test_convert_states_v40_dict_to_v41_dict(self) -> None:
        new_value: Dict[str, str] = {}
        draft_change_list_1_v40 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': new_value
            })
        ]
        draft_change_list_2_v40 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            })
        ]
        # Migrate exploration to state schema version 41.
        self.create_and_migrate_new_exploration('40', '41')
        migrated_draft_change_list_1_v41 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v40, 1, 2, self.EXP_ID))
        # Verify that changes which include answer groups are
        # not upgraded to v41.
        self.assertIsNone(migrated_draft_change_list_1_v41)

        migrated_draft_change_list_2_v41 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_2_v40, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_2_v41 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_2_v40_dict_list = [
            change.to_dict() for change in draft_change_list_2_v40
        ]
        migrated_draft_change_list_2_v41_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_2_v41
        ]
        # Verify that changes which do not include answer groups can
        # be upgraded to v41.
        self.assertEqual(
            draft_change_list_2_v40_dict_list,
            migrated_draft_change_list_2_v41_dict_list)

    def test_convert_states_v39_dict_to_v40_dict(self) -> None:
        new_value: Dict[str, str] = {}
        draft_change_list_1_v39 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_customization_args',
                'new_value': new_value
            })
        ]
        draft_change_list_2_v39 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            })
        ]
        # Migrate exploration to state schema version 40.
        self.create_and_migrate_new_exploration('39', '40')
        migrated_draft_change_list_1_v40 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v39, 1, 2, self.EXP_ID))
        # Verify that changes which include customization arguments are
        # not upgraded to v40.
        self.assertIsNone(migrated_draft_change_list_1_v40)

        migrated_draft_change_list_2_v40 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_2_v39, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_2_v40 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_2_v39_dict_list = [
            change.to_dict() for change in draft_change_list_2_v39
        ]
        migrated_draft_change_list_2_v40_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_2_v40
        ]
        # Verify that changes which do not include customization arguments can
        # be upgraded to v40.
        self.assertEqual(
            draft_change_list_2_v39_dict_list,
            migrated_draft_change_list_2_v40_dict_list)

    def test_convert_states_v38_dict_to_v39_dict(self) -> None:
        draft_change_list_v38 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 39.
        self.create_and_migrate_new_exploration('38', '39')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema. In this case there are no changes to the
        # draft change list since version 39 adds a customization arg
        # for modifying the placeholder text in the Numeric Expression Input
        # interaction, for which there should be no changes to drafts.
        migrated_draft_change_list_v39 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v38, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v39 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v38_dict_list = [
            change.to_dict() for change in draft_change_list_v38
        ]
        migrated_draft_change_list_v39_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v39
        ]
        self.assertEqual(
            draft_change_list_v38_dict_list,
            migrated_draft_change_list_v39_dict_list)

    def test_convert_states_v37_dict_to_v38_dict(self) -> None:
        draft_change_list_v37 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 38.
        self.create_and_migrate_new_exploration('37', '38')
        # Migrate the draft change list's state schema to the migrated
        # exploration's schema. In this case there are no changes to the
        # draft change list since version 38 adds a customization arg
        # for the "Add" button text in SetInput interaction for the
        # exploration, for which there should be no changes to drafts.
        migrated_draft_change_list_v38 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v37, 1, 2, self.EXP_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v38 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v37_dict_list = [
            change.to_dict() for change in draft_change_list_v37
        ]
        migrated_draft_change_list_v38_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v38
        ]
        self.assertEqual(
            draft_change_list_v37_dict_list,
            migrated_draft_change_list_v38_dict_list)

    def test_convert_states_v36_dict_to_v37_dict(self) -> None:
        draft_change_list_v36 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': [{
                    'rule_specs': [{
                        'rule_type': 'CaseSensitiveEquals',
                        'inputs': {
                            'x': 'test'
                        }
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': '<p>Content</p>'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]
            })
        ]
        draft_change_list_v37 = [
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': [{
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {
                            'x': 'test'
                        }
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': '<p>Content</p>'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]
            })
        ]

        # Migrate exploration to state schema version 37.
        self.create_and_migrate_new_exploration('36', '37')
        migrated_draft_change_list_v37 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_v36, 1, 2, self.EXP_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v37 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_v37_dict_list = [
            change.to_dict() for change in draft_change_list_v37
        ]
        migrated_draft_change_list_v37_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v37
        ]
        self.assertEqual(
            draft_change_list_v37_dict_list,
            migrated_draft_change_list_v37_dict_list)

    def test_convert_states_v35_dict_to_v36_dict(self) -> None:
        new_value: Dict[str, str] = {}
        draft_change_list_1_v35 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_customization_args',
                'new_value': new_value
            })
        ]
        draft_change_list_2_v35 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            })
        ]
        # Migrate exploration to state schema version 36.
        self.create_and_migrate_new_exploration('35', '36')
        migrated_draft_change_list_1_v36 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v35, 1, 2, self.EXP_ID))
        self.assertIsNone(migrated_draft_change_list_1_v36)

        migrated_draft_change_list_2_v36 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_2_v35, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_2_v36 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_2_v35_dict_list = [
            change.to_dict() for change in draft_change_list_2_v35
        ]
        migrated_draft_change_list_2_v36_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_2_v36
        ]
        self.assertEqual(
            draft_change_list_2_v35_dict_list,
            migrated_draft_change_list_2_v36_dict_list)

    def test_convert_states_v34_dict_to_v35_dict(self) -> None:
        draft_change_list_1_v34 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'widget_id',
                'new_value': 'MathExpressionInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'answer_groups',
                'new_value': [{
                    'rule_specs': [{
                        'rule_type': 'IsMathematicallyEquivalentTo',
                        'inputs': {
                            'x': 'x+y/2'
                        }
                    }],
                    'outcome': {
                        'dest': 'Introduction',
                        'feedback': {
                            'content_id': 'feedback',
                            'html': '<p>Content</p>'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]
            })
        ]
        draft_change_list_2_v34 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'content',
                'new_value': 'new value'
            })
        ]
        # Migrate exploration to state schema version 35.
        self.create_and_migrate_new_exploration('34', '35')
        migrated_draft_change_list_1_v35 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_1_v34, 1, 2, self.EXP_ID))
        self.assertIsNone(migrated_draft_change_list_1_v35)

        migrated_draft_change_list_2_v35 = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list_2_v34, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_2_v35 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        draft_change_list_2_v34_dict_list = [
            change.to_dict() for change in draft_change_list_2_v34
        ]
        migrated_draft_change_list_2_v35_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_2_v35
        ]
        self.assertEqual(
            draft_change_list_2_v34_dict_list,
            migrated_draft_change_list_2_v35_dict_list)

    def test_convert_states_v33_dict_to_v34_dict(self) -> None:
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
                        # Here we use MyPy ignore because we are testing convert
                        # function and in convert function we are working with
                        # previous versions of the domain object and in previous
                        # versions of the domain object there are some fields
                        # (eg: html) that are discontinued in the latest domain
                        # object. So, while defining these old keys MyPy throw
                        # an error. To avoid the error, we used ignore here.
                        'content1': {
                            'en': {  # type: ignore[typeddict-item]
                                'html': html_content,
                                'needs_update': True
                            },
                            # Here we use MyPy ignore because here we are
                            # defining 'html' key that was deprecated from
                            # the latest domain object and causing MyPy to
                            # throw an error. Thus, to silence the error,
                            # we used ignore here.
                            'hi': {  # type: ignore[typeddict-item]
                                'html': 'Hey!',
                                'needs_update': False
                            }
                        },
                        'feedback_1': {
                            # Here we use MyPy ignore because here we are
                            # defining 'html' key that was deprecated from
                            # the latest domain object and causing MyPy to
                            # throw an error. Thus, to silence the error,
                            # we used ignore here.
                            'hi': {  # type: ignore[typeddict-item]
                                'html': html_content,
                                'needs_update': False
                            },
                            # Here we use MyPy ignore because here we are
                            # defining 'html' key that was deprecated from
                            # the latest domain object and causing MyPy to
                            # throw an error. Thus, to silence the error,
                            # we used ignore here.
                            'en': {  # type: ignore[typeddict-item]
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

        self.create_and_migrate_new_exploration('33', '34')
        migrated_draft_change_list = (
            draft_upgrade_services.try_upgrading_draft_to_exp_version(
                draft_change_list, 1, 2, self.EXP_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list is not None
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
                        # Here we use MyPy ignore because we are testing convert
                        # function and in convert function we are working with
                        # previous versions of the domain object and in previous
                        # versions of the domain object there are some fields
                        # (eg: html) that are discontinued in the latest domain
                        # object. So, while defining these old keys MyPy throw
                        # an error. To avoid the error, we used ignore here.
                        'content1': {
                            'en': {  # type: ignore[typeddict-item]
                                'html': expected_html_content,
                                'needs_update': True
                            },
                            # Here we use MyPy ignore because here we are
                            # defining 'html' key that was deprecated from
                            # the latest domain object and causing MyPy to
                            # throw an error. Thus, to silence the error,
                            # we used ignore here.
                            'hi': {  # type: ignore[typeddict-item]
                                'html': 'Hey!',
                                'needs_update': False
                            }
                        },
                        'feedback_1': {
                            # Here we use MyPy ignore because here we are
                            # defining 'html' key that was deprecated from
                            # the latest domain object and causing MyPy to
                            # throw an error. Thus, to silence the error,
                            # we used ignore here.
                            'hi': {  # type: ignore[typeddict-item]
                                'html': expected_html_content,
                                'needs_update': False
                            },
                            # Here we use MyPy ignore because here we are
                            # defining 'html' key that was deprecated from
                            # the latest domain object and causing MyPy to
                            # throw an error. Thus, to silence the error,
                            # we used ignore here.
                            'en': {  # type: ignore[typeddict-item]
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

    def test_convert_states_v32_dict_to_v33_dict(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v33 is not None
        # Change draft change lists into a list of dicts so that it is
        # easy to compare the whole draft change list.
        expected_draft_change_list_v33_dict_list = [
            change.to_dict() for change in expected_draft_change_list_v33
        ]
        migrated_draft_change_list_v33_dict_list = [
            change.to_dict() for change in migrated_draft_change_list_v33
        ]
        self.assertItemsEqual(
            expected_draft_change_list_v33_dict_list,
            migrated_draft_change_list_v33_dict_list)

    def test_convert_states_v31_dict_to_v32_dict(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v32 is not None
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

    def test_convert_states_v30_dict_to_v31_dict(self) -> None:
        draft_change_list_v30 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'Intro',
                'property_name': 'recorded_voiceovers',
                'new_value': {
                    'voiceovers_mapping': {
                        'content': {
                            'en': {
                                'file_size_bytes': 100,
                                'filename': 'atest.mp3',
                                'needs_update': False,
                                'duration_secs': 0.0
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
                                'file_size_bytes': 100,
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
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v31 is not None
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

    def test_convert_states_v29_dict_to_v30_dict(self) -> None:
        draft_change_list_v29 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
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
                        'dest_if_really_stuck': None,
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
                }]
            })
        ]
        # Version 30 replaces the tagged_misconception_id in version 29
        # with tagged_skill_misconception_id.
        expected_draft_change_list_v30 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'answer_groups',
                'state_name': 'State 1',
                'new_value': [{
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
                        'dest_if_really_stuck': None,
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
                }]
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
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v30 is not None
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

    def test_convert_states_v28_dict_to_v29_dict(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v29 is not None
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

    def test_convert_states_v27_dict_to_v28_dict(self) -> None:
        draft_change_list_v27 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'content_ids_to_audio_translations',
                'state_name': 'State B',
                'new_value': {
                    'content': {
                        'en': {
                            'file_size_bytes': 100,
                            'filename': 'atest.mp3',
                            'needs_update': False,
                            'duration_secs': 0.0
                        }
                    }
                },
            })
        ]
        # Version 28 adds voiceovers_mapping.
        expected_draft_change_list_v28 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'recorded_voiceovers',
                'state_name': 'State B',
                'new_value': {'voiceovers_mapping': {
                        'content': {
                            'en': {
                                'file_size_bytes': 100,
                                'filename': 'atest.mp3',
                                'needs_update': False,
                                'duration_secs': 0.0
                            }
                        }
                    }
                }
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
        # Ruling out the possibility of None for mypy type checking.
        assert migrated_draft_change_list_v28 is not None
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
