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

"""Tests for exploration domain objects and methods defined on them."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import os
import re

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import exp_services_test
from core.domain import param_domain
from core.domain import rights_manager
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class ExplorationChangeTests(test_utils.GenericTestBase):

    def test_exp_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            exp_domain.ExplorationChange({'invalid': 'data'})

    def test_exp_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            exp_domain.ExplorationChange({'cmd': 'invalid'})

    def test_exp_change_object_with_deprecated_cmd(self):
        with self.assertRaisesRegexp(
            utils.DeprecatedCommandError, 'Command clone is deprecated'):
            exp_domain.ExplorationChange({
                'cmd': 'clone',
                'property_name': 'content',
                'old_value': 'old_value'
            })

    def test_exp_change_object_with_deprecated_cmd_argument(self):
        with self.assertRaisesRegexp(
            utils.DeprecatedCommandError,
            'Value for property_name in cmd edit_state_property: '
            'fallbacks is deprecated'):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Introduction',
                'property_name': 'fallbacks',
                'new_value': 'foo',
            })

    def test_exp_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value')):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'old_value': 'old_value'
            })

    def test_exp_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            exp_domain.ExplorationChange({
                'cmd': 'rename_state',
                'old_state_name': 'old_state_name',
                'new_state_name': 'new_state_name',
                'invalid': 'invalid'
            })

    def test_exp_change_object_with_invalid_exploration_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd edit_exploration_property: '
                'invalid is not allowed')):
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_exp_change_object_with_invalid_state_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd edit_state_property: '
                'invalid is not allowed')):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'state_name',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_exp_change_object_with_create_new(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'create_new',
            'category': 'category',
            'title': 'title'
        })

        self.assertEqual(exp_change_object.cmd, 'create_new')
        self.assertEqual(exp_change_object.category, 'category')
        self.assertEqual(exp_change_object.title, 'title')

    def test_exp_change_object_with_add_state(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'state_name',
        })

        self.assertEqual(exp_change_object.cmd, 'add_state')
        self.assertEqual(exp_change_object.state_name, 'state_name')

    def test_exp_change_object_with_rename_state(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'old_state_name',
            'new_state_name': 'new_state_name'
        })

        self.assertEqual(exp_change_object.cmd, 'rename_state')
        self.assertEqual(exp_change_object.old_state_name, 'old_state_name')
        self.assertEqual(exp_change_object.new_state_name, 'new_state_name')

    def test_exp_change_object_with_delete_state(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'state_name',
        })

        self.assertEqual(exp_change_object.cmd, 'delete_state')
        self.assertEqual(exp_change_object.state_name, 'state_name')

    def test_exp_change_object_with_edit_state_property(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'state_name',
            'property_name': 'content',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(exp_change_object.cmd, 'edit_state_property')
        self.assertEqual(exp_change_object.state_name, 'state_name')
        self.assertEqual(exp_change_object.property_name, 'content')
        self.assertEqual(exp_change_object.new_value, 'new_value')
        self.assertEqual(exp_change_object.old_value, 'old_value')

    def test_exp_change_object_with_edit_exploration_property(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(exp_change_object.cmd, 'edit_exploration_property')
        self.assertEqual(exp_change_object.property_name, 'title')
        self.assertEqual(exp_change_object.new_value, 'new_value')
        self.assertEqual(exp_change_object.old_value, 'old_value')

    def test_exp_change_object_with_migrate_states_schema_to_latest_version(
            self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'migrate_states_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version',
        })

        self.assertEqual(
            exp_change_object.cmd, 'migrate_states_schema_to_latest_version')
        self.assertEqual(exp_change_object.from_version, 'from_version')
        self.assertEqual(exp_change_object.to_version, 'to_version')

    def test_exp_change_object_with_revert_commit(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
            'version_number': 'version_number'
        })

        self.assertEqual(
            exp_change_object.cmd,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT)
        self.assertEqual(exp_change_object.version_number, 'version_number')

    def test_to_dict(self):
        exp_change_dict = {
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category'
        }
        exp_change_object = exp_domain.ExplorationChange(exp_change_dict)
        self.assertEqual(exp_change_object.to_dict(), exp_change_dict)


class ExplorationVersionsDiffDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration versions difference domain object."""

    def setUp(self):
        super(ExplorationVersionsDiffDomainUnitTests, self).setUp()
        self.exp_id = 'exp_id1'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, self.exp_id,
            assets_list)
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)

    def test_correct_creation_of_version_diffs(self):
        # Rename a state.
        self.exploration.rename_state('Home', 'Renamed state')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'Home',
            'new_state_name': 'Renamed state'
        })]

        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        self.assertEqual(exp_versions_diff.added_state_names, [])
        self.assertEqual(exp_versions_diff.deleted_state_names, [])
        self.assertEqual(
            exp_versions_diff.old_to_new_state_names, {
                'Home': 'Renamed state'
            })
        self.exploration.version += 1

        # Add a state.
        self.exploration.add_states(['New state'])
        self.exploration.states['New state'] = copy.deepcopy(
            self.exploration.states['Renamed state'])
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state',
        })]

        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        self.assertEqual(exp_versions_diff.added_state_names, ['New state'])
        self.assertEqual(exp_versions_diff.deleted_state_names, [])
        self.assertEqual(exp_versions_diff.old_to_new_state_names, {})
        self.exploration.version += 1

        # Delete state.
        self.exploration.delete_state('New state')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'New state'
        })]

        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        self.assertEqual(exp_versions_diff.added_state_names, [])
        self.assertEqual(exp_versions_diff.deleted_state_names, ['New state'])
        self.assertEqual(exp_versions_diff.old_to_new_state_names, {})
        self.exploration.version += 1

        # Test addition and multiple renames.
        self.exploration.add_states(['New state'])
        self.exploration.states['New state'] = copy.deepcopy(
            self.exploration.states['Renamed state'])
        self.exploration.rename_state('New state', 'New state2')
        self.exploration.rename_state('New state2', 'New state3')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state',
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state',
            'new_state_name': 'New state2'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state2',
            'new_state_name': 'New state3'
        })]

        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        self.assertEqual(exp_versions_diff.added_state_names, ['New state3'])
        self.assertEqual(exp_versions_diff.deleted_state_names, [])
        self.assertEqual(exp_versions_diff.old_to_new_state_names, {})
        self.exploration.version += 1

        # Test addition, rename and deletion.
        self.exploration.add_states(['New state 2'])
        self.exploration.rename_state('New state 2', 'Renamed state 2')
        self.exploration.delete_state('Renamed state 2')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state 2'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'Renamed state 2'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'Renamed state 2'
        })]

        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        self.assertEqual(exp_versions_diff.added_state_names, [])
        self.assertEqual(exp_versions_diff.deleted_state_names, [])
        self.assertEqual(exp_versions_diff.old_to_new_state_names, {})
        self.exploration.version += 1

        # Test multiple renames and deletion.
        self.exploration.rename_state('New state3', 'Renamed state 3')
        self.exploration.rename_state('Renamed state 3', 'Renamed state 4')
        self.exploration.delete_state('Renamed state 4')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state3',
            'new_state_name': 'Renamed state 3'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'Renamed state 3',
            'new_state_name': 'Renamed state 4'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'Renamed state 4'
        })]

        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        self.assertEqual(exp_versions_diff.added_state_names, [])
        self.assertEqual(
            exp_versions_diff.deleted_state_names, ['New state3'])
        self.assertEqual(exp_versions_diff.old_to_new_state_names, {})
        self.exploration.version += 1

    def test_cannot_create_exploration_change_with_invalid_change_dict(self):
        with self.assertRaisesRegexp(
            Exception, 'Missing cmd key in change dict'):
            exp_domain.ExplorationChange({
                'invalid_cmd': 'invalid'
            })

    def test_cannot_create_exploration_change_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            Exception, 'Command invalid_cmd is not allowed'):
            exp_domain.ExplorationChange({
                'cmd': 'invalid_cmd'
            })

    def test_cannot_create_exploration_change_with_invalid_state_property(self):
        exp_change = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'state_name': '',
            'new_value': ''
        })
        self.assertTrue(isinstance(exp_change, exp_domain.ExplorationChange))

        with self.assertRaisesRegexp(
            Exception,
            'Value for property_name in cmd edit_state_property: '
            'invalid_property is not allowed'):
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': 'invalid_property',
                'state_name': '',
                'new_value': ''
            })

    def test_cannot_create_exploration_change_with_invalid_exploration_property(
            self):
        exp_change = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': ''
        })
        self.assertTrue(isinstance(exp_change, exp_domain.ExplorationChange))

        with self.assertRaisesRegexp(
            Exception,
            'Value for property_name in cmd edit_exploration_property: '
            'invalid_property is not allowed'):
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'invalid_property',
                'new_value': ''
            })

    def test_revert_exploration_commit(self):
        exp_change = exp_domain.ExplorationChange({
            'cmd': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
            'version_number': 1
        })

        self.assertEqual(exp_change.version_number, 1)

        exp_change = exp_domain.ExplorationChange({
            'cmd': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
            'version_number': 2
        })

        self.assertEqual(exp_change.version_number, 2)


class ExpVersionReferenceTests(test_utils.GenericTestBase):

    def test_create_exp_version_reference_object(self):
        exp_version_reference = exp_domain.ExpVersionReference('exp_id', 1)

        self.assertEqual(
            exp_version_reference.to_dict(), {
                'exp_id': 'exp_id',
                'version': 1
            })

    def test_validate_exp_version(self):
        with self.assertRaisesRegexp(
            Exception,
            'Expected version to be an int, received invalid_version'):
            exp_domain.ExpVersionReference('exp_id', 'invalid_version')

    def test_validate_exp_id(self):
        with self.assertRaisesRegexp(
            Exception, 'Expected exp_id to be a str, received 0'):
            exp_domain.ExpVersionReference(0, 1)


class ExplorationCheckpointsUnitTests(test_utils.GenericTestBase):
    """Test checkpoints validations in an exploration. """

    def setUp(self):
        super(ExplorationCheckpointsUnitTests, self).setUp()
        self.exploration = (
            exp_domain.Exploration.create_default_exploration('eid'))
        self.new_state = state_domain.State.create_default_state(
            'Introduction', is_initial_state=True)
        self.set_interaction_for_state(self.new_state, 'TextInput')
        self.exploration.init_state_name = 'Introduction'
        self.exploration.states = {
            self.exploration.init_state_name: self.new_state
        }
        self.set_interaction_for_state(
            self.exploration.states[self.exploration.init_state_name],
            'TextInput')
        self.init_state = (
            self.exploration.states[self.exploration.init_state_name])
        self.end_state = state_domain.State.create_default_state('End')
        self.set_interaction_for_state(self.end_state, 'EndExploration')

        self.end_state.update_interaction_default_outcome(None)

    def test_init_state_with_card_is_checkpoint_false_is_invalid(self):
        self.init_state.update_card_is_checkpoint(False)
        with self.assertRaisesRegexp(
            Exception, 'Expected card_is_checkpoint of first state to '
            'be True but found it to be False'):
            self.exploration.validate(strict=True)
        self.init_state.update_card_is_checkpoint(True)

    def test_end_state_with_card_is_checkpoint_true_is_invalid(self):
        default_outcome = self.init_state.interaction.default_outcome
        default_outcome.dest = self.exploration.init_state_name
        self.init_state.update_interaction_default_outcome(default_outcome)

        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }
        self.end_state.update_card_is_checkpoint(True)
        with self.assertRaisesRegexp(
            Exception, 'Expected card_is_checkpoint of terminal state '
            'to be False but found it to be True'):
            self.exploration.validate(strict=True)
        self.end_state.update_card_is_checkpoint(False)

    def test_init_state_checkpoint_with_end_exp_interaction_is_valid(self):
        self.exploration.init_state_name = 'End'
        self.exploration.states = {
            self.exploration.init_state_name: self.end_state
        }
        self.exploration.objective = 'Objective'
        self.exploration.title = 'Title'
        self.exploration.category = 'Category'
        self.end_state.update_card_is_checkpoint(True)
        self.exploration.validate(strict=True)
        self.end_state.update_card_is_checkpoint(False)

    def test_checkpoint_count_with_count_outside_range_is_invalid(self):
        self.exploration.init_state_name = 'Introduction'
        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }

        for i in python_utils.RANGE(8):
            self.exploration.add_states(['State%s' % i])
            self.exploration.states['State%s' % i].card_is_checkpoint = True
            self.set_interaction_for_state(
                self.exploration.states['State%s' % i],
                'Continue')
        with self.assertRaisesRegexp(
            Exception, 'Expected checkpoint count to be between 1 and 8 '
            'inclusive but found it to be 9'
            ):
            self.exploration.validate(strict=True)
        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }

    def test_bypassable_state_with_card_is_checkpoint_true_is_invalid(self):
        # Note: In the graphs below, states with the * symbol are checkpoints.

        # Exploration to test a checkpoint state which has no outcome.
        #       ┌────────────────┐
        #       │  Introduction* │
        #       └──┬───────────┬─┘
        #          │           │
        #          │           │
        # ┌────────┴──┐      ┌─┴─────────┐
        # │   Second* │      │   Third   │
        # └───────────┘      └─┬─────────┘
        #                      │
        #        ┌─────────────┴─┐
        #        │      End      │
        #        └───────────────┘.

        second_state = state_domain.State.create_default_state('Second')
        self.set_interaction_for_state(second_state, 'TextInput')
        third_state = state_domain.State.create_default_state('Third')
        self.set_interaction_for_state(third_state, 'TextInput')

        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state,
            'Second': second_state,
            'Third': third_state,
        }

        # Answer group dicts to connect init_state to second_state and
        # third_state.
        init_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Second', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            ), state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Third', state_domain.SubtitledHtml(
                        'feedback_1', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_1',
                                'normalizedStrSet': ['Test1']
                            }
                        })
                ],
                [],
                None
            )
        ]

        # Answer group dict to connect third_state to end_state.
        third_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'End', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            )
        ]
        self.init_state.update_interaction_answer_groups(
            init_state_answer_groups)
        third_state.update_interaction_answer_groups(
            third_state_answer_groups)

        # The exploration can be completed via third_state. Hence, making
        # second_state a checkpoint raises a validation error.
        second_state.card_is_checkpoint = True
        with self.assertRaisesRegexp(
            Exception, 'Cannot make Second a checkpoint as it is'
            ' bypassable'
            ):
            self.exploration.validate(strict=True)
        second_state.card_is_checkpoint = False

        # Exploration to test a checkpoint state when the state in the other
        # path has no outcome.
        #       ┌────────────────┐
        #       │  Introduction* │
        #       └──┬───────────┬─┘
        #          │           │
        #          │           │
        # ┌────────┴──┐      ┌─┴─────────┐
        # │  Second*  │      │   Third   │
        # └────────┬──┘      └───────────┘
        #          │
        #        ┌─┴─────────────┐
        #        │      End      │
        #        └───────────────┘.

        # Answer group dicts to connect second_state to end_state.
        second_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'End', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            )
        ]

        second_state.update_interaction_answer_groups(
            second_state_answer_groups)

        # Reset the answer group dicts of third_state.
        third_state.update_interaction_answer_groups([])

        # As second_state is now connected to end_state and third_state has no
        # outcome, second_state has become non-bypassable.
        second_state.update_card_is_checkpoint(True)
        self.exploration.validate()

        # Reset the exploration.
        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }

        # Exploration to test a bypassable state.
        #                ┌────────────────┐
        #                │ Introduction*  │
        #                └─┬─────┬──────┬─┘
        # ┌───────────┐    │     │      │     ┌────────────┐
        # │    A      ├────┘     │      └─────┤      C     │
        # └────┬──────┘          │            └─────┬──────┘
        #      │            ┌────┴─────┐            │
        #      │            │    B     │            │
        #      │            └──┬───────┘            │
        #      └─────────┐     │                    │
        #         ┌──────┴─────┴─┐    ┌─────────────┘
        #         │      D*      │    │
        #         └─────────────┬┘    │
        #                       │     │
        #                    ┌──┴─────┴──┐
        #                    │    End    │
        #                    └───────────┘.

        a_state = state_domain.State.create_default_state('A')
        self.set_interaction_for_state(a_state, 'TextInput')
        b_state = state_domain.State.create_default_state('B')
        self.set_interaction_for_state(b_state, 'TextInput')
        c_state = state_domain.State.create_default_state('C')
        self.set_interaction_for_state(c_state, 'TextInput')
        d_state = state_domain.State.create_default_state('D')
        self.set_interaction_for_state(d_state, 'TextInput')

        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'A': a_state,
            'B': b_state,
            'C': c_state,
            'D': d_state,
            'End': self.end_state
        }

        # Answer group dicts to connect init_state to a_state, b_state and
        # c_state.
        init_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'A', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            ), state_domain.AnswerGroup(
                state_domain.Outcome(
                    'B', state_domain.SubtitledHtml(
                        'feedback_1', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_1',
                                'normalizedStrSet': ['Test1']
                            }
                        })
                ],
                [],
                None
            ), state_domain.AnswerGroup(
                state_domain.Outcome(
                    'C', state_domain.SubtitledHtml(
                        'feedback_2', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_2',
                                'normalizedStrSet': ['Test2']
                            }
                        })
                ],
                [],
                None
            )
        ]

        # Answer group dict to connect a_state and b_state to d_state.
        a_and_b_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'D', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            )
        ]

        # Answer group dict to connect c_state and d_state to end_state.
        c_and_d_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'End', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            )
        ]

        self.init_state.update_interaction_answer_groups(
            init_state_answer_groups)
        a_state.update_interaction_answer_groups(
            a_and_b_state_answer_groups)
        b_state.update_interaction_answer_groups(
            a_and_b_state_answer_groups)
        c_state.update_interaction_answer_groups(
            c_and_d_state_answer_groups)
        d_state.update_interaction_answer_groups(
            c_and_d_state_answer_groups)

        # As a user can complete the exploration by going through c_state,
        # d_state becomes bypassable. Hence, making d_state a checkpoint raises
        # validation error.
        d_state.update_card_is_checkpoint(True)
        with self.assertRaisesRegexp(
            Exception, 'Cannot make D a checkpoint as it is bypassable'
            ):
            self.exploration.validate(strict=True)
        d_state.update_card_is_checkpoint(False)

        # Modifying the graph to make D non-bypassable.
        #                ┌────────────────┐
        #                │ Introduction*  │
        #                └─┬─────┬──────┬─┘
        # ┌───────────┐    │     │      │     ┌────────────┐
        # │    A      ├────┘     │      └─────┤      C     │
        # └────┬──────┘          │            └──────┬─────┘
        #      │            ┌────┴─────┐             │
        #      │            │    B     │             │
        #      │            └────┬─────┘             │
        #      │                 │                   │
        #      │          ┌──────┴───────┐           │
        #      └──────────┤      D*      ├───────────┘
        #                 └──────┬───────┘
        #                        │
        #                  ┌─────┴─────┐
        #                  │    End    │
        #                  └───────────┘.

        # Answer group dict to connect c_state to d_state. Hence, making d_state
        # non-bypassable.
        c_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'D', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            )
        ]
        c_state.update_interaction_answer_groups(
            c_state_answer_groups)

        d_state.update_card_is_checkpoint(True)
        self.exploration.validate()

        # Modifying the graph to add another EndExploration state.
        #                ┌────────────────┐
        #                │ Introduction*  │
        #                └─┬─────┬──────┬─┘
        # ┌───────────┐    │     │      │     ┌────────────┐
        # │    A      ├────┘     │      └─────┤      C     │
        # └────┬──────┘          │            └──────┬───┬─┘
        #      │            ┌────┴─────┐             │   │
        #      │            │    B     │             │   │
        #      │            └────┬─────┘             │   │
        #      │                 │                   │   │
        #      │          ┌──────┴───────┐           │   │
        #      └──────────┤      D*      ├───────────┘   │
        #                 └──────┬───────┘               │
        #                        │                       │
        #                  ┌─────┴─────┐           ┌─────┴─────┐
        #                  │    End    │           │    End 2  │
        #                  └───────────┘           └───────────┘.

        new_end_state = state_domain.State.create_default_state('End 2')
        self.set_interaction_for_state(new_end_state, 'EndExploration')
        new_end_state.update_interaction_default_outcome(None)

        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'A': a_state,
            'B': b_state,
            'C': c_state,
            'D': d_state,
            'End': self.end_state,
            'End 2': new_end_state
        }

        # Answer group dicts to connect c_state to d_state and new_end_state,
        # making d_state bypassable.
        c_state_answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'D', state_domain.SubtitledHtml(
                        'feedback_0', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_0',
                                'normalizedStrSet': ['Test0']
                            }
                        })
                ],
                [],
                None
            ), state_domain.AnswerGroup(
                state_domain.Outcome(
                    'End 2', state_domain.SubtitledHtml(
                        'feedback_1', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Contains',
                        {
                            'x':
                            {
                                'contentId': 'rule_input_1',
                                'normalizedStrSet': ['Test1']
                            }
                        })
                ],
                [],
                None
            )
        ]
        c_state.update_interaction_answer_groups(
            c_state_answer_groups)

        with self.assertRaisesRegexp(
            Exception, 'Cannot make D a checkpoint as it is bypassable'
            ):
            self.exploration.validate(strict=True)
        d_state.update_card_is_checkpoint(False)


class ExplorationDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration domain object."""

    # TODO(bhenning): The validation tests below should be split into separate
    # unit tests. Also, all validation errors should be covered in the tests.
    def test_validation(self):
        """Test validation of explorations."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.init_state_name = ''
        exploration.states = {}

        exploration.title = 'Hello #'
        self._assert_validation_error(exploration, 'Invalid character #')

        exploration.title = 'Title'
        exploration.category = 'Category'

        # Note: If '/' ever becomes a valid state name, ensure that the rule
        # editor frontend tenplate is fixed -- it currently uses '/' as a
        # sentinel for an invalid state name.
        bad_state = state_domain.State.create_default_state('/')
        exploration.states = {'/': bad_state}
        self._assert_validation_error(
            exploration, 'Invalid character / in a state name')

        new_state = state_domain.State.create_default_state('ABC')
        self.set_interaction_for_state(new_state, 'TextInput')

        # The 'states' property must be a non-empty dict of states.
        exploration.states = {}
        self._assert_validation_error(
            exploration, 'exploration has no states')
        exploration.states = {'A string #': new_state}
        self._assert_validation_error(
            exploration, 'Invalid character # in a state name')
        exploration.states = {'A string _': new_state}
        self._assert_validation_error(
            exploration, 'Invalid character _ in a state name')

        exploration.states = {'ABC': new_state}

        self._assert_validation_error(
            exploration, 'has no initial state name')

        exploration.init_state_name = 'initname'

        self._assert_validation_error(
            exploration,
            r'There is no state in \[u\'ABC\'\] corresponding to '
            'the exploration\'s initial state name initname.')

        # Test whether a default outcome to a non-existing state is invalid.
        exploration.states = {exploration.init_state_name: new_state}
        self._assert_validation_error(
            exploration, 'destination ABC is not a valid')

        # Restore a valid exploration.
        init_state = exploration.states[exploration.init_state_name]
        default_outcome = init_state.interaction.default_outcome
        default_outcome.dest = exploration.init_state_name
        init_state.update_interaction_default_outcome(default_outcome)
        init_state.update_card_is_checkpoint(True)
        exploration.validate()

        # Ensure an invalid destination can also be detected for answer groups.
        # Note: The state must keep its default_outcome, otherwise it will
        # trigger a validation error for non-terminal states needing to have a
        # default outcome. To validate the outcome of the answer group, this
        # default outcome must point to a valid state.
        init_state = exploration.states[exploration.init_state_name]
        default_outcome = init_state.interaction.default_outcome
        default_outcome.dest = exploration.init_state_name
        old_answer_groups = copy.deepcopy(init_state.interaction.answer_groups)
        old_answer_groups.append({
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': {
                        'contentId': 'rule_input_Equals',
                        'normalizedStrSet': ['Test']
                    }
                },
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        })

        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_groups)
            for answer_groups in old_answer_groups
            ]
        init_state.update_interaction_answer_groups(new_answer_groups)

        exploration.validate()

        interaction = init_state.interaction
        answer_groups = interaction.answer_groups
        answer_group = answer_groups[0]
        answer_group.outcome.dest = 'DEF'
        self._assert_validation_error(
            exploration, 'destination DEF is not a valid')

        # Restore a valid exploration.
        self.set_interaction_for_state(
            init_state, 'TextInput')
        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_groups)
            for answer_groups in old_answer_groups
            ]
        init_state.update_interaction_answer_groups(new_answer_groups)
        answer_groups = interaction.answer_groups
        answer_group = answer_groups[0]
        answer_group.outcome.dest = exploration.init_state_name
        exploration.validate()

        # Validate RuleSpec.
        rule_spec = answer_group.rule_specs[0]
        rule_spec.inputs = {}
        self._assert_validation_error(
            exploration, 'RuleSpec \'Contains\' is missing inputs')

        rule_spec.inputs = 'Inputs string'
        self._assert_validation_error(
            exploration, 'Expected inputs to be a dict')

        rule_spec.inputs = {'x': 'Test'}
        rule_spec.rule_type = 'FakeRuleType'
        self._assert_validation_error(exploration, 'Unrecognized rule type')

        rule_spec.inputs = {'x': {
            'contentId': 'rule_input_Equals',
            'normalizedStrSet': 15
        }}
        rule_spec.rule_type = 'Contains'
        with self.assertRaisesRegexp(
            AssertionError, 'Expected list, received 15'
            ):
            exploration.validate()

        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name],
            'PencilCodeEditor')
        temp_rule = old_answer_groups[0]['rule_specs'][0]
        old_answer_groups[0]['rule_specs'][0] = {
            'rule_type': 'ErrorContains',
            'inputs': {'x': '{{ExampleParam}}'}
        }
        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_groups)
            for answer_groups in old_answer_groups
            ]
        init_state.update_interaction_answer_groups(new_answer_groups)
        old_answer_groups[0]['rule_specs'][0] = temp_rule

        self._assert_validation_error(
            exploration,
            'RuleSpec \'ErrorContains\' has an input with name \'x\' which '
            'refers to an unknown parameter within the exploration: '
            'ExampleParam')

        # Restore a valid exploration.
        exploration.param_specs['ExampleParam'] = param_domain.ParamSpec(
            'UnicodeString')
        exploration.validate()

        # Validate Outcome.
        outcome = init_state.interaction.answer_groups[0].outcome
        destination = exploration.init_state_name
        outcome.dest = None
        self._assert_validation_error(
            exploration, 'Every outcome should have a destination.')

        # Try setting the outcome destination to something other than a string.
        outcome.dest = 15
        self._assert_validation_error(
            exploration, 'Expected outcome dest to be a string')

        outcome.dest = destination

        outcome.feedback = state_domain.SubtitledHtml('feedback_1', '')
        exploration.validate()

        outcome.labelled_as_correct = 'hello'
        self._assert_validation_error(
            exploration, 'The "labelled_as_correct" field should be a boolean')

        # Test that labelled_as_correct must be False for self-loops, and that
        # this causes a strict validation failure but not a normal validation
        # failure.
        outcome.labelled_as_correct = True
        with self.assertRaisesRegexp(
            Exception, 'is labelled correct but is a self-loop.'
            ):
            exploration.validate(strict=True)
        exploration.validate()

        outcome.labelled_as_correct = False
        exploration.validate()

        outcome.param_changes = 'Changes'
        self._assert_validation_error(
            exploration, 'Expected outcome param_changes to be a list')

        outcome.param_changes = [param_domain.ParamChange(
            0, 'generator_id', {})]
        self._assert_validation_error(
            exploration,
            'Expected param_change name to be a string, received 0')

        outcome.param_changes = []
        exploration.validate()

        outcome.refresher_exploration_id = 12345
        self._assert_validation_error(
            exploration,
            'Expected outcome refresher_exploration_id to be a string')

        outcome.refresher_exploration_id = None
        exploration.validate()

        outcome.refresher_exploration_id = 'valid_string'
        exploration.validate()

        outcome.missing_prerequisite_skill_id = 12345
        self._assert_validation_error(
            exploration,
            'Expected outcome missing_prerequisite_skill_id to be a string')

        outcome.missing_prerequisite_skill_id = None
        exploration.validate()

        outcome.missing_prerequisite_skill_id = 'valid_string'
        exploration.validate()

        # Test that refresher_exploration_id must be None for non-self-loops.
        new_state_name = 'New state'
        exploration.add_states([new_state_name])

        outcome.dest = new_state_name
        outcome.refresher_exploration_id = 'another_string'
        self._assert_validation_error(
            exploration,
            'has a refresher exploration ID, but is not a self-loop')

        outcome.refresher_exploration_id = None
        exploration.validate()
        exploration.delete_state(new_state_name)

        # Validate InteractionInstance.
        interaction.id = 15
        self._assert_validation_error(
            exploration, 'Expected interaction id to be a string')

        interaction.id = 'SomeInteractionTypeThatDoesNotExist'
        self._assert_validation_error(exploration, 'Invalid interaction id')
        interaction.id = 'PencilCodeEditor'

        self.set_interaction_for_state(init_state, 'TextInput')
        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_groups)
            for answer_groups in old_answer_groups
            ]
        init_state.update_interaction_answer_groups(new_answer_groups)
        valid_text_input_cust_args = init_state.interaction.customization_args
        rule_spec.inputs = {'x': {
            'contentId': 'rule_input_Equals',
            'normalizedStrSet': ['Test']
        }}
        rule_spec.rule_type = 'Contains'
        exploration.validate()

        interaction.customization_args = []
        self._assert_validation_error(
            exploration, 'Expected customization args to be a dict')

        interaction.customization_args = {15: ''}
        self._assert_validation_error(
            exploration,
            (
                'Expected customization arg value to be a '
                'InteractionCustomizationArg'
            )
        )

        interaction.customization_args = {
            15: state_domain.InteractionCustomizationArg('', {
                'type': 'unicode'
            })
        }
        self._assert_validation_error(
            exploration, 'Invalid customization arg name')

        interaction.customization_args = valid_text_input_cust_args
        self.set_interaction_for_state(init_state, 'TextInput')
        exploration.validate()

        interaction.answer_groups = {}
        self._assert_validation_error(
            exploration, 'Expected answer groups to be a list')

        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_groups)
            for answer_groups in old_answer_groups
            ]
        init_state.update_interaction_answer_groups(new_answer_groups)
        self.set_interaction_for_state(init_state, 'EndExploration')
        self._assert_validation_error(
            exploration,
            'Terminal interactions must not have a default outcome.')

        self.set_interaction_for_state(init_state, 'TextInput')
        init_state.update_interaction_default_outcome(None)
        self._assert_validation_error(
            exploration,
            'Non-terminal interactions must have a default outcome.')

        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.interaction.answer_groups = [answer_groups]
        self._assert_validation_error(
            exploration,
            'Terminal interactions must not have any answer groups.')

        # A terminal interaction without a default outcome or answer group is
        # valid. This resets the exploration back to a valid state.
        init_state.interaction.answer_groups = []
        exploration.validate()

        # Restore a valid exploration.
        self.set_interaction_for_state(init_state, 'TextInput')
        answer_groups_list = [
            state_domain.AnswerGroup.from_dict(answer_group)
            for answer_group in [answer_groups]
            ]
        init_state.update_interaction_answer_groups(answer_groups_list)
        init_state.update_interaction_default_outcome(default_outcome)
        exploration.validate()
        solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': 'hello_world is a string'
                }
        }
        solution = state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict)
        init_state.update_interaction_solution(solution)
        self._assert_validation_error(
            exploration,
            re.escape('Hint(s) must be specified if solution is specified'))

        init_state.update_interaction_solution(None)
        interaction.hints = {}
        self._assert_validation_error(
            exploration, 'Expected hints to be a list')
        interaction.hints = []

        # Validate AnswerGroup.
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', 'Feedback'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x':
                        {
                            'contentId': 'rule_input_Contains',
                            'normalizedStrSet': ['Test']
                        }
                    })
            ],
            [],
            1
        )
        init_state.update_interaction_answer_groups([state_answer_group])

        self._assert_validation_error(
            exploration,
            'Expected tagged skill misconception id to be a str, received 1')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', 'Feedback'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x':
                        {
                            'contentId': 'rule_input_Contains',
                            'normalizedStrSet': ['Test']
                        }
                    })
            ],
            [],
            'invalid_tagged_skill_misconception_id'
        )
        init_state.update_interaction_answer_groups([state_answer_group])

        self._assert_validation_error(
            exploration,
            'Expected the format of tagged skill misconception id '
            'to be <skill_id>-<misconception_id>, received '
            'invalid_tagged_skill_misconception_id')

        init_state.interaction.answer_groups[0].rule_specs = {}
        self._assert_validation_error(
            exploration, 'Expected answer group rules to be a list')

        first_answer_group = init_state.interaction.answer_groups[0]
        first_answer_group.tagged_skill_misconception_id = None
        first_answer_group.rule_specs = []
        self._assert_validation_error(
            exploration,
            'There must be at least one rule or training data for each'
            ' answer group.')

        exploration.states = {
            exploration.init_state_name: (
                state_domain.State.create_default_state(
                    exploration.init_state_name, is_initial_state=True))
        }
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'TextInput')
        exploration.validate()

        exploration.language_code = 'fake_code'
        self._assert_validation_error(exploration, 'Invalid language_code')
        exploration.language_code = 'English'
        self._assert_validation_error(exploration, 'Invalid language_code')
        exploration.language_code = 'en'
        exploration.validate()

        exploration.param_specs = 'A string'
        self._assert_validation_error(exploration, 'param_specs to be a dict')

        exploration.param_specs = {
            '@': param_domain.ParamSpec.from_dict({
                'obj_type': 'UnicodeString'
            })
        }
        self._assert_validation_error(
            exploration, 'Only parameter names with characters')

        exploration.param_specs = {
            'notAParamSpec': param_domain.ParamSpec.from_dict(
                {'obj_type': 'UnicodeString'})
        }
        exploration.validate()

    def test_tag_validation(self):
        """Test validation of exploration tags."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exploration.validate()

        exploration.tags = 'this should be a list'
        self._assert_validation_error(
            exploration, 'Expected \'tags\' to be a list')

        exploration.tags = [123]
        self._assert_validation_error(exploration, 'to be a string')
        exploration.tags = ['abc', 123]
        self._assert_validation_error(exploration, 'to be a string')

        exploration.tags = ['']
        self._assert_validation_error(exploration, 'Tags should be non-empty')

        exploration.tags = ['123']
        self._assert_validation_error(
            exploration, 'should only contain lowercase letters and spaces')
        exploration.tags = ['ABC']
        self._assert_validation_error(
            exploration, 'should only contain lowercase letters and spaces')

        exploration.tags = [' a b']
        self._assert_validation_error(
            exploration, 'Tags should not start or end with whitespace')
        exploration.tags = ['a b ']
        self._assert_validation_error(
            exploration, 'Tags should not start or end with whitespace')

        exploration.tags = ['a    b']
        self._assert_validation_error(
            exploration, 'Adjacent whitespace in tags should be collapsed')

        exploration.tags = ['abc', 'abc']
        self._assert_validation_error(
            exploration, 'Some tags duplicate each other')

        exploration.tags = ['computer science', 'analysis', 'a b c']
        exploration.validate()

    def test_title_category_and_objective_validation(self):
        """Test that titles, categories and objectives are validated only in
        'strict' mode.
        """
        self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        exploration.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'title must be specified'
            ):
            exploration.validate(strict=True)
        exploration.title = 'A title'

        with self.assertRaisesRegexp(
            utils.ValidationError, 'category must be specified'
            ):
            exploration.validate(strict=True)
        exploration.category = 'A category'

        with self.assertRaisesRegexp(
            utils.ValidationError, 'objective must be specified'
            ):
            exploration.validate(strict=True)

        exploration.objective = 'An objective'

        exploration.validate(strict=True)

    def test_get_trainable_states_dict(self):
        """Test the get_trainable_states_dict() method."""
        exp_id = 'exp_id1'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)

        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=False)
        old_states = exp_fetchers.get_exploration_from_model(
            exploration_model).states
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        # Rename a state to add it in unchanged answer group.
        exploration.rename_state('Home', 'Renamed state')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'Home',
            'new_state_name': 'Renamed state'
        })]

        expected_dict = {
            'state_names_with_changed_answer_groups': [],
            'state_names_with_unchanged_answer_groups': ['Renamed state']
        }
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        actual_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        self.assertEqual(actual_dict, expected_dict)

        # Modify answer groups to trigger change in answer groups.
        state = exploration.states['Renamed state']
        exploration.states['Renamed state'].interaction.answer_groups.insert(
            3, state.interaction.answer_groups[3])
        answer_groups = []
        for answer_group in state.interaction.answer_groups:
            answer_groups.append(answer_group.to_dict())
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Renamed state',
            'property_name': 'answer_groups',
            'new_value': answer_groups
        })]

        expected_dict = {
            'state_names_with_changed_answer_groups': ['Renamed state'],
            'state_names_with_unchanged_answer_groups': []
        }
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        actual_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        self.assertEqual(actual_dict, expected_dict)

        # Add new state to trigger change in answer groups.
        exploration.add_states(['New state'])
        exploration.states['New state'] = copy.deepcopy(
            exploration.states['Renamed state'])
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state',
        })]

        expected_dict = {
            'state_names_with_changed_answer_groups': [
                'New state', 'Renamed state'],
            'state_names_with_unchanged_answer_groups': []
        }
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        actual_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        self.assertEqual(actual_dict, expected_dict)

        # Delete state.
        exploration.delete_state('New state')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'New state'
        })]

        expected_dict = {
            'state_names_with_changed_answer_groups': ['Renamed state'],
            'state_names_with_unchanged_answer_groups': []
        }
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        actual_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        self.assertEqual(actual_dict, expected_dict)

        # Test addition and multiple renames.
        exploration.add_states(['New state'])
        exploration.states['New state'] = copy.deepcopy(
            exploration.states['Renamed state'])
        exploration.rename_state('New state', 'New state2')
        exploration.rename_state('New state2', 'New state3')
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state',
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state',
            'new_state_name': 'New state2'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state2',
            'new_state_name': 'New state3'
        })]

        expected_dict = {
            'state_names_with_changed_answer_groups': [
                'Renamed state', 'New state3'],
            'state_names_with_unchanged_answer_groups': []
        }
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        actual_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        self.assertEqual(actual_dict, expected_dict)

    def test_get_languages_with_complete_translation(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(
            exploration.get_languages_with_complete_translation(), [])
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME].update_written_translations(
                written_translations)

        self.assertEqual(
            exploration.get_languages_with_complete_translation(), ['hi'])

    def test_get_translation_counts_with_no_needs_update(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(
            exploration.get_translation_counts(), {})

        init_state = exploration.states[exploration.init_state_name]
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        init_state.update_interaction_id('TextInput')
        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None
        )

        init_state.update_interaction_default_outcome(default_outcome)

        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        init_state.update_written_translations(written_translations)

        exploration.add_states(['New state'])
        new_state = exploration.states['New state']
        new_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        new_state.update_interaction_id('TextInput')
        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None)
        new_state.update_interaction_default_outcome(default_outcome)

        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>New state translation in Hindi.</p>',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>New State translation in Hindi.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        new_state.update_written_translations(written_translations)

        self.assertEqual(
            exploration.get_translation_counts(), {'hi': 4})

    def test_get_translation_counts_with_needs_update(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(
            exploration.get_translation_counts(), {})

        init_state = exploration.states[feconf.DEFAULT_INIT_STATE_NAME]
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        init_state.update_interaction_id('TextInput')
        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None
        )
        init_state.update_interaction_default_outcome(default_outcome)

        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': True
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        init_state.update_written_translations(written_translations)

        self.assertEqual(
            exploration.get_translation_counts(), {'hi': 1})

    def test_get_translation_counts_with_translation_in_multiple_lang(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(
            exploration.get_translation_counts(), {})
        init_state = exploration.states[feconf.DEFAULT_INIT_STATE_NAME]
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        init_state.update_interaction_id('TextInput')
        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None
        )

        init_state.update_interaction_default_outcome(default_outcome)

        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'hi-en': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Translation in Hindi.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        init_state.update_written_translations(written_translations)

        self.assertEqual(
            exploration.get_translation_counts(), {
                'hi': 2,
                'hi-en': 1
            })

    def test_get_content_count(self):
        # Adds 1 to content count to exploration (content, default_outcome).
        exploration = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(exploration.get_content_count(), 1)

        # Adds 2 to content count to exploration (content default_outcome).
        exploration.add_states(['New state'])
        init_state = exploration.states[exploration.init_state_name]

        # Adds 1 to content count to exploration (ca_placeholder_0)
        self.set_interaction_for_state(init_state, 'TextInput')

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', 'Feedback'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x':
                        {
                            'contentId': 'rule_input_5',
                            'normalizedStrSet': ['Test']
                        }
                    })
            ],
            [],
            None
        )
        # Adds 1 to content count to exploration (feedback_1).
        init_state.update_interaction_answer_groups([state_answer_group])

        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
        # Adds 1 to content count to exploration (hint_1).
        init_state.update_interaction_hints(hints_list)

        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }
        solution = state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict)
        # Adds 1 to content count to exploration (solution).
        init_state.update_interaction_solution(solution)

        self.assertEqual(exploration.get_content_count(), 5)

    def test_get_content_with_correct_state_name_returns_html(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')

        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'TextInput')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            exploration.get_content_html(exploration.init_state_name, 'hint_1'),
            '<p>hint one</p>')

        hints_list[0].hint_content.html = '<p>Changed hint one</p>'
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            exploration.get_content_html(exploration.init_state_name, 'hint_1'),
            '<p>Changed hint one</p>')

    def test_get_content_with_incorrect_state_name_raise_error(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')

        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'TextInput')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            exploration.get_content_html(exploration.init_state_name, 'hint_1'),
            '<p>hint one</p>')

        with self.assertRaisesRegexp(
            ValueError, 'State Invalid state does not exist'):
            exploration.get_content_html('Invalid state', 'hint_1')

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = exp_domain.Exploration.create_default_exploration('a')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = exp_domain.Exploration.create_default_exploration('abcd')
        self.assertEqual(notdemo2.is_demo, False)

    def test_has_state_name(self):
        """Test for has_state_name."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        state_names = list(demo.states.keys())
        self.assertEqual(state_names, ['Introduction'])
        self.assertEqual(demo.has_state_name('Introduction'), True)
        self.assertEqual(demo.has_state_name('Fake state name'), False)

    def test_get_interaction_id_by_state_name(self):
        """Test for get_interaction_id_by_state_name."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(
            demo.get_interaction_id_by_state_name('Introduction'), None)

    def test_exploration_export_import(self):
        """Test that to_dict and from_dict preserve all data within an
        exploration.
        """
        demo = exp_domain.Exploration.create_default_exploration('0')
        demo_dict = demo.to_dict()
        exp_from_dict = exp_domain.Exploration.from_dict(demo_dict)
        self.assertEqual(exp_from_dict.to_dict(), demo_dict)

    def test_interaction_with_none_id_is_not_terminal(self):
        """Test that an interaction with an id of None leads to is_terminal
        being false.
        """
        # Default exploration has a default interaction with an ID of None.
        demo = exp_domain.Exploration.create_default_exploration('0')
        init_state = demo.states[feconf.DEFAULT_INIT_STATE_NAME]
        self.assertFalse(init_state.interaction.is_terminal)

    def test_cannot_create_demo_exp_with_invalid_param_changes(self):
        demo_exp = exp_domain.Exploration.create_default_exploration('0')
        demo_dict = demo_exp.to_dict()
        new_state = state_domain.State.create_default_state('new_state_name')
        new_state.param_changes = [param_domain.ParamChange.from_dict({
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector'
        })]

        demo_dict['states']['new_state_name'] = new_state.to_dict()
        demo_dict['param_specs'] = {
            'ParamSpec': {'obj_type': 'UnicodeString'}
        }
        with self.assertRaisesRegexp(
            Exception,
            'Parameter myParam was used in a state but not '
            'declared in the exploration param_specs.'):
            exp_domain.Exploration.from_dict(demo_dict)

    def test_validate_exploration_category(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.category = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected category to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_objective(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.objective = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected objective to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_blurb(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.blurb = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected blurb to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_language_code(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.language_code = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_author_notes(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.author_notes = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected author_notes to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_states(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.states = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected states to be a dict, received 1'):
            exploration.validate()

    def test_validate_exploration_outcome_dest(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.init_state.interaction.default_outcome.dest = None
        with self.assertRaisesRegexp(
            Exception, 'Every outcome should have a destination.'):
            exploration.validate()

    def test_validate_exploration_outcome_dest_type(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.init_state.interaction.default_outcome.dest = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected outcome dest to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_states_schema_version(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.states_schema_version = None
        with self.assertRaisesRegexp(
            Exception, 'This exploration has no states schema version.'):
            exploration.validate()

    def test_validate_exploration_auto_tts_enabled(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.auto_tts_enabled = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected auto_tts_enabled to be a bool, received 1'):
            exploration.validate()

    def test_validate_exploration_correctness_feedback_enabled(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.correctness_feedback_enabled = 1
        with self.assertRaisesRegexp(
            Exception,
            'Expected correctness_feedback_enabled to be a bool, received 1'):
            exploration.validate()

    def test_validate_exploration_param_specs(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.param_specs = {
            1: param_domain.ParamSpec.from_dict(
                {'obj_type': 'UnicodeString'})
        }
        with self.assertRaisesRegexp(
            Exception, 'Expected parameter name to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_param_changes_type(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.param_changes = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected param_changes to be a list, received 1'):
            exploration.validate()

    def test_validate_exploration_param_name(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.param_changes = [param_domain.ParamChange.from_dict({
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'invalid',
            'generator_id': 'RandomSelector'
        })]
        with self.assertRaisesRegexp(
            Exception,
            'No parameter named \'invalid\' exists in this '
            'exploration'):
            exploration.validate()

    def test_validate_exploration_reserved_param_name(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.param_changes = [param_domain.ParamChange.from_dict({
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'all',
            'generator_id': 'RandomSelector'
        })]
        with self.assertRaisesRegexp(
            Exception,
            'The exploration-level parameter with name \'all\' is '
            'reserved. Please choose a different name.'):
            exploration.validate()

    def test_validate_exploration_is_non_self_loop(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.add_states(['DEF'])

        default_outcome = state_domain.Outcome(
            'DEF', state_domain.SubtitledHtml(
                'default_outcome', '<p>Default outcome for state1</p>'),
            False, [], 'refresher_exploration_id', None,
        )
        exploration.init_state.update_interaction_default_outcome(
            default_outcome
        )

        with self.assertRaisesRegexp(
            Exception,
            'The default outcome for state Introduction has a refresher '
            'exploration ID, but is not a self-loop.'):
            exploration.validate()

    def test_validate_exploration_answer_group_parameter(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        param_changes = [param_domain.ParamChange(
            'ParamChange', 'RandomSelector', {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            }
        )]
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', 'Feedback'),
                False, param_changes, None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x':
                        {
                            'contentId': 'rule_input_Equals',
                            'normalizedStrSet': ['Test']
                        }
                    })
            ],
            [],
            None
        )
        exploration.init_state.update_interaction_answer_groups(
            [state_answer_group])
        with self.assertRaisesRegexp(
            Exception,
            'The parameter ParamChange was used in an answer group, '
            'but it does not exist in this exploration'):
            exploration.validate()

    def test_verify_all_states_reachable(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'owner_id')
        exploration.validate()

        exploration.add_states(['End'])
        end_state = exploration.states['End']
        self.set_interaction_for_state(end_state, 'EndExploration')
        end_state.update_interaction_default_outcome(None)

        with self.assertRaisesRegexp(
            Exception,
            'Please fix the following issues before saving this exploration: '
            '1. The following states are not reachable from the initial state: '
            'End 2. It is impossible to complete the exploration from the '
            'following states: Introduction'):
            exploration.validate(strict=True)

    def test_update_init_state_name_with_invalid_state(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='title', category='category',
            objective='objective', end_state_name='End')

        exploration.update_init_state_name('End')
        self.assertEqual(exploration.init_state_name, 'End')

        with self.assertRaisesRegexp(
            Exception,
            'Invalid new initial state name: invalid_state;'):
            exploration.update_init_state_name('invalid_state')

    def test_rename_state_with_invalid_state(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='title', category='category',
            objective='objective', end_state_name='End')

        self.assertTrue(exploration.states.get('End'))
        self.assertFalse(exploration.states.get('new state name'))

        exploration.rename_state('End', 'new state name')
        self.assertFalse(exploration.states.get('End'))
        self.assertTrue(exploration.states.get('new state name'))

        with self.assertRaisesRegexp(
            Exception, 'State invalid_state does not exist'):
            exploration.rename_state('invalid_state', 'new state name')

    def test_default_outcome_is_labelled_incorrect_for_self_loop(self):
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='title', category='category',
            objective='objective', end_state_name='End')
        exploration.validate(strict=True)

        (
            exploration.init_state.interaction.default_outcome
            .labelled_as_correct) = True

        (
            exploration.init_state.interaction.default_outcome
            .dest) = exploration.init_state_name

        with self.assertRaisesRegexp(
            Exception,
            'The default outcome for state Introduction is labelled '
            'correct but is a self-loop'):
            exploration.validate(strict=True)

    def test_serialize_and_deserialize_returns_unchanged_exploration(self):
        """Checks that serializing and then deserializing a default exploration
        works as intended by leaving the exploration unchanged.
        """
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        self.assertEqual(
            exploration.to_dict(),
            exp_domain.Exploration.deserialize(
                exploration.serialize()).to_dict())


class ExplorationSummaryTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationSummaryTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration(self.owner_id, exploration)
        self.exp_summary = exp_fetchers.get_exploration_summary_by_id('eid')
        self.exp_summary.editor_ids = ['editor_id']
        self.exp_summary.voice_artist_ids = ['voice_artist_id']
        self.exp_summary.viewer_ids = ['viewer_id']
        self.exp_summary.contributor_ids = ['contributor_id']

    def test_validation_passes_with_valid_properties(self):
        self.exp_summary.validate()

    def test_validation_fails_with_invalid_title(self):
        self.exp_summary.title = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected title to be a string, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_category(self):
        self.exp_summary.category = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected category to be a string, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_objective(self):
        self.exp_summary.objective = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected objective to be a string, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_language_code(self):
        self.exp_summary.language_code = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected language_code to be a string, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_unallowed_language_code(self):
        self.exp_summary.language_code = 'invalid'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid language_code: invalid'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_tags(self):
        self.exp_summary.tags = 'tags'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected \'tags\' to be a list, received tags'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_tag_in_tags(self):
        self.exp_summary.tags = ['tag', 2]
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected each tag in \'tags\' to be a string, received \'2\''):
            self.exp_summary.validate()

    def test_validation_fails_with_empty_tag_in_tags(self):
        self.exp_summary.tags = ['', 'abc']
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Tags should be non-empty'):
            self.exp_summary.validate()

    def test_validation_fails_with_unallowed_characters_in_tag(self):
        self.exp_summary.tags = ['123', 'abc']
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Tags should only contain lowercase '
                'letters and spaces, received \'123\'')):
            self.exp_summary.validate()

    def test_validation_fails_with_whitespace_in_tag_start(self):
        self.exp_summary.tags = [' ab', 'abc']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Tags should not start or end with whitespace, received \' ab\''):
            self.exp_summary.validate()

    def test_validation_fails_with_whitespace_in_tag_end(self):
        self.exp_summary.tags = ['ab ', 'abc']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Tags should not start or end with whitespace, received \'ab \''):
            self.exp_summary.validate()

    def test_validation_fails_with_adjacent_whitespace_in_tag(self):
        self.exp_summary.tags = ['a   b', 'abc']
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Adjacent whitespace in tags should '
                'be collapsed, received \'a   b\'')):
            self.exp_summary.validate()

    def test_validation_fails_with_duplicate_tags(self):
        self.exp_summary.tags = ['abc', 'abc', 'ab']
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Some tags duplicate each other'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_rating_type(self):
        self.exp_summary.ratings = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected ratings to be a dict, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_rating_keys(self):
        self.exp_summary.ratings = {'1': 0, '10': 1}
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected ratings to have keys: 1, 2, 3, 4, 5, received 1, 10'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_value_type_for_ratings(self):
        self.exp_summary.ratings = {'1': 0, '2': 'one', '3': 0, '4': 0, '5': 0}
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected value to be int, received one'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_value_for_ratings(self):
        self.exp_summary.ratings = {'1': 0, '2': -1, '3': 0, '4': 0, '5': 0}
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected value to be non-negative, received -1'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_scaled_average_rating(self):
        self.exp_summary.scaled_average_rating = 'one'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected scaled_average_rating to be float, received one'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_status(self):
        self.exp_summary.status = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected status to be string, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_community_owned(self):
        self.exp_summary.community_owned = '1'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected community_owned to be bool, received 1'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_contributors_summary(self):
        self.exp_summary.contributors_summary = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected contributors_summary to be dict, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_owner_ids_type(self):
        self.exp_summary.owner_ids = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected owner_ids to be list, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_owner_id_in_owner_ids(self):
        self.exp_summary.owner_ids = ['1', 2, '3']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected each id in owner_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_editor_ids_type(self):
        self.exp_summary.editor_ids = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected editor_ids to be list, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_editor_id_in_editor_ids(self):
        self.exp_summary.editor_ids = ['1', 2, '3']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected each id in editor_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_voice_artist_ids_type(self):
        self.exp_summary.voice_artist_ids = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected voice_artist_ids to be list, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_voice_artist_id_in_voice_artists_ids(
            self):
        self.exp_summary.voice_artist_ids = ['1', 2, '3']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected each id in voice_artist_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_viewer_ids_type(self):
        self.exp_summary.viewer_ids = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected viewer_ids to be list, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_viewer_id_in_viewer_ids(self):
        self.exp_summary.viewer_ids = ['1', 2, '3']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected each id in viewer_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_contributor_ids_type(self):
        self.exp_summary.contributor_ids = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected contributor_ids to be list, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_contributor_id_in_contributor_ids(
            self):
        self.exp_summary.contributor_ids = ['1', 2, '3']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected each id in contributor_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_is_private(self):
        self.assertTrue(self.exp_summary.is_private())
        self.exp_summary.status = constants.ACTIVITY_STATUS_PUBLIC
        self.assertFalse(self.exp_summary.is_private())

    def test_is_solely_owned_by_user_one_owner(self):
        self.assertTrue(self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('other_id'))
        self.exp_summary.owner_ids = ['other_id']
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertTrue(self.exp_summary.is_solely_owned_by_user('other_id'))

    def test_is_solely_owned_by_user_multiple_owners(self):
        self.assertTrue(self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('other_id'))
        self.exp_summary.owner_ids = [self.owner_id, 'other_id']
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('other_id'))

    def test_is_solely_owned_by_user_other_users(self):
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('editor_id'))
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user('voice_artist_id'))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('viewer_id'))
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user('contributor_id'))

    def test_add_new_contribution_for_user_adds_user_to_contributors(self):
        self.exp_summary.add_contribution_by_user('user_id')
        self.assertIn('user_id', self.exp_summary.contributors_summary)
        self.assertEqual(self.exp_summary.contributors_summary['user_id'], 1)
        self.assertIn('user_id', self.exp_summary.contributor_ids)

    def test_add_new_contribution_for_user_increases_score_in_contributors(
            self):
        self.exp_summary.add_contribution_by_user('user_id')
        self.exp_summary.add_contribution_by_user('user_id')
        self.assertIn('user_id', self.exp_summary.contributors_summary)
        self.assertEqual(self.exp_summary.contributors_summary['user_id'], 2)

    def test_add_new_contribution_for_user_does_not_add_system_user(self):
        self.exp_summary.add_contribution_by_user(
            feconf.SYSTEM_COMMITTER_ID)
        self.assertNotIn(
            feconf.SYSTEM_COMMITTER_ID, self.exp_summary.contributors_summary)
        self.assertNotIn(
            feconf.SYSTEM_COMMITTER_ID, self.exp_summary.contributor_ids)


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of explorations from YAML files."""

    YAML_CONTENT_INVALID_SCHEMA_VERSION = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 10000
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 10000
tags: []
title: Title
""")

    EXP_ID = 'An exploration_id'

    def test_creation_with_invalid_yaml_schema_version(self):
        """Test that a schema version that is too big is detected."""
        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v46 to v[0-9]+ exploration YAML files '
            'at present.'):
            exp_domain.Exploration.from_yaml(
                'bad_exp', self.YAML_CONTENT_INVALID_SCHEMA_VERSION)

    def test_yaml_import_and_export(self):
        """Test the from_yaml() and to_yaml() methods."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='Title', category='Category')
        exploration.add_states(['New state'])
        self.assertEqual(len(exploration.states), 2)

        exploration.validate()

        yaml_content = exploration.to_yaml()
        self.assertEqual(yaml_content, self.SAMPLE_YAML_CONTENT)

        exploration2 = exp_domain.Exploration.from_yaml('exp2', yaml_content)
        self.assertEqual(len(exploration2.states), 2)
        yaml_content_2 = exploration2.to_yaml()
        self.assertEqual(yaml_content_2, yaml_content)

        with self.assertRaisesRegexp(
            Exception, 'Please ensure that you are uploading a YAML text file, '
            'not a zip file. The YAML parser returned the following error: '):
            exp_domain.Exploration.from_yaml('exp3', 'No_initial_state_name')

        with self.assertRaisesRegexp(
            Exception,
            'Please ensure that you are uploading a YAML text file, not a zip'
            ' file. The YAML parser returned the following error: mapping '
            'values are not allowed here'):
            exp_domain.Exploration.from_yaml(
                'exp4', 'Invalid\ninit_state_name:\nMore stuff')

        with self.assertRaisesRegexp(
            Exception,
            'Please ensure that you are uploading a YAML text file, not a zip'
            ' file. The YAML parser returned the following error: while '
            'scanning a simple key'):
            exp_domain.Exploration.from_yaml(
                'exp4', 'State1:\n(\nInvalid yaml')


class SchemaMigrationMethodsUnitTests(test_utils.GenericTestBase):
    """Tests the presence of appropriate schema migration methods in the
    Exploration domain object class.
    """

    def test_correct_states_schema_conversion_methods_exist(self):
        """Test that the right states schema conversion methods exist."""
        current_states_schema_version = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        for version_num in python_utils.RANGE(
                feconf.EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION,
                current_states_schema_version):
            self.assertTrue(hasattr(
                exp_domain.Exploration,
                '_convert_states_v%s_dict_to_v%s_dict' % (
                    version_num, version_num + 1)))

        self.assertFalse(hasattr(
            exp_domain.Exploration,
            '_convert_states_v%s_dict_to_v%s_dict' % (
                current_states_schema_version,
                current_states_schema_version + 1)))

    def test_correct_exploration_schema_conversion_methods_exist(self):
        """Test that the right exploration schema conversion methods exist."""
        current_exp_schema_version = (
            exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION)

        for version_num in python_utils.RANGE(
                exp_domain.Exploration.EARLIEST_SUPPORTED_EXP_SCHEMA_VERSION,
                current_exp_schema_version):
            self.assertTrue(hasattr(
                exp_domain.Exploration,
                '_convert_v%s_dict_to_v%s_dict' % (
                    version_num, version_num + 1)))

        self.assertFalse(hasattr(
            exp_domain.Exploration,
            '_convert_v%s_dict_to_v%s_dict' % (
                current_exp_schema_version, current_exp_schema_version + 1)))


class SchemaMigrationUnitTests(test_utils.GenericTestBase):
    """Test migration methods for yaml content."""

    YAML_CONTENT_V46 = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 46
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 41
tags: []
title: Title
""")

    YAML_CONTENT_V47 = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 47
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 42
tags: []
title: Title
""")

    YAML_CONTENT_V48 = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 48
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 43
tags: []
title: Title
""")

    YAML_CONTENT_V49 = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 49
states:
  (untitled state):
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 44
tags: []
title: Title
""")

    YAML_CONTENT_V50 = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 50
states:
  (untitled state):
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 45
tags: []
title: Title
""")

    YAML_CONTENT_V51 = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 51
states:
  (untitled state):
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        rule_input_3: {}
  END:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: 46
tags: []
title: Title
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V51

    def test_load_from_v46_with_item_selection_input_interaction(self):
        """Tests the migration of ItemSelectionInput rule inputs."""
        sample_yaml_content = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 46
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - <p>Choice 1</p>
            - <p>Choice 2</p>
            - <p>Choice Invalid</p>
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_2
            html: <p>Choice 1</p>
          - content_id: ca_choices_3
            html: <p>Choice 2</p>
        maxAllowableSelectionCount:
          value: 2
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution:
        answer_is_exclusive: true
        correct_answer:
          - <p>Choice 1</p>
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 41
tags: []
title: Title
""")

        latest_sample_yaml_content = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 51
states:
  (untitled state):
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_2
            - ca_choices_3
            - invalid_content_id
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_2
            html: <p>Choice 1</p>
          - content_id: ca_choices_3
            html: <p>Choice 2</p>
        maxAllowableSelectionCount:
          value: 2
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution:
        answer_is_exclusive: true
        correct_answer:
        - ca_choices_2
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
  END:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 46
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content)
        self.assertEqual(exploration.to_yaml(), latest_sample_yaml_content)

    def test_load_from_v46_with_drag_and_drop_sort_input_interaction(self):
        """Tests the migration of DragAndDropSortInput rule inputs."""
        sample_yaml_content = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 46
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - <p>Choice 1</p>
              - <p>Choice 2</p>
          rule_type: IsEqualToOrdering
        - inputs:
            x:
            - - <p>Choice 1</p>
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x: <p>Choice 1</p>
            y: 1
          rule_type: HasElementXAtPositionY
        - inputs:
            x: <p>Choice 1</p>
            y: <p>Choice 2</p>
          rule_type: HasElementXBeforeElementY
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_2
            html: <p>Choice 1</p>
          - content_id: ca_choices_3
            html: <p>Choice 2</p>
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution:
        answer_is_exclusive: true
        correct_answer:
        - - <p>Choice 1</p>
          - <p>Choice 2</p>
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 41
tags: []
title: Title
""")

        latest_sample_yaml_content = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 51
states:
  (untitled state):
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - ca_choices_2
              - ca_choices_3
          rule_type: IsEqualToOrdering
        - inputs:
            x:
            - - ca_choices_2
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x: ca_choices_2
            y: 1
          rule_type: HasElementXAtPositionY
        - inputs:
            x: ca_choices_2
            y: ca_choices_3
          rule_type: HasElementXBeforeElementY
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_2
            html: <p>Choice 1</p>
          - content_id: ca_choices_3
            html: <p>Choice 2</p>
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution:
        answer_is_exclusive: true
        correct_answer:
        - - ca_choices_2
          - ca_choices_3
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
  END:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 46
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content)
        self.assertEqual(exploration.to_yaml(), latest_sample_yaml_content)

    def test_load_from_v46_with_invalid_unicode_written_translations(self):
        """Tests the migration of unicode written translations rule inputs."""
        sample_yaml_content = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 46
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText
            unicode_str: Continue
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: Continue
      solution: null
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText:
          bn:
            data_format: html
            needs_update: false
            translation: <p>hello</p>
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 41
tags: []
title: Title
""")

        latest_sample_yaml_content = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 51
states:
  (untitled state):
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText
            unicode_str: Continue
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: Continue
      solution: null
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText:
          bn:
            data_format: unicode
            needs_update: false
            translation: hello
        content: {}
        default_outcome: {}
        feedback_1: {}
        solution: {}
  END:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 46
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content)
        self.assertEqual(exploration.to_yaml(), latest_sample_yaml_content)


class ConversionUnitTests(test_utils.GenericTestBase):
    """Test conversion methods."""

    def test_convert_exploration_to_player_dict(self):
        exp_title = 'Title'
        second_state_name = 'first state'

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title=exp_title, category='Category')
        exploration.add_states([second_state_name])

        def _get_default_state_dict(content_str, dest_name, is_init_state):
            """Gets the default state dict of the exploration."""
            return {
                'linked_skill_id': None,
                'next_content_id_index': 0,
                'classifier_model_id': None,
                'content': {
                    'content_id': 'content',
                    'html': content_str,
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                },
                'solicit_answer_details': False,
                'card_is_checkpoint': is_init_state,
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                },
                'interaction': {
                    'answer_groups': [],
                    'confirmed_unclassified_answers': [],
                    'customization_args': {},
                    'default_outcome': {
                        'dest': dest_name,
                        'feedback': {
                            'content_id': feconf.DEFAULT_OUTCOME_CONTENT_ID,
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'hints': [],
                    'id': None,
                    'solution': None,
                },
                'param_changes': [],
            }

        self.assertEqual(exploration.to_player_dict(), {
            'init_state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'title': exp_title,
            'objective': feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            'states': {
                feconf.DEFAULT_INIT_STATE_NAME: _get_default_state_dict(
                    feconf.DEFAULT_INIT_STATE_CONTENT_STR,
                    feconf.DEFAULT_INIT_STATE_NAME, True),
                second_state_name: _get_default_state_dict(
                    '', second_state_name, False),
            },
            'param_changes': [],
            'param_specs': {},
            'language_code': 'en',
            'correctness_feedback_enabled': False,
        })


class StateOperationsUnitTests(test_utils.GenericTestBase):
    """Test methods operating on states."""

    def test_delete_state(self):
        """Test deletion of states."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.add_states(['first state'])

        with self.assertRaisesRegexp(
            ValueError, 'Cannot delete initial state'
            ):
            exploration.delete_state(exploration.init_state_name)

        exploration.add_states(['second state'])
        exploration.delete_state('second state')

        with self.assertRaisesRegexp(ValueError, 'fake state does not exist'):
            exploration.delete_state('fake state')


class HtmlCollectionTests(test_utils.GenericTestBase):
    """Test method to obtain all html strings."""

    def test_all_html_strings_are_collected(self):

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title='title', category='category')
        exploration.add_states(['state1', 'state2', 'state3', 'state4'])
        state1 = exploration.states['state1']
        state2 = exploration.states['state2']
        state3 = exploration.states['state3']
        state4 = exploration.states['state4']
        content1_dict = {
            'content_id': 'content',
            'html': '<blockquote>Hello, this is state1</blockquote>'
        }
        content2_dict = {
            'content_id': 'content',
            'html': '<pre>Hello, this is state2</pre>'
        }
        content3_dict = {
            'content_id': 'content',
            'html': '<p>Hello, this is state3</p>'
        }
        content4_dict = {
            'content_id': 'content',
            'html': '<p>Hello, this is state4</p>'
        }
        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content1_dict))
        state2.update_content(
            state_domain.SubtitledHtml.from_dict(content2_dict))
        state3.update_content(
            state_domain.SubtitledHtml.from_dict(content3_dict))
        state4.update_content(
            state_domain.SubtitledHtml.from_dict(content4_dict))

        self.set_interaction_for_state(state1, 'TextInput')
        self.set_interaction_for_state(state2, 'MultipleChoiceInput')
        self.set_interaction_for_state(state3, 'ItemSelectionInput')
        self.set_interaction_for_state(state4, 'DragAndDropSortInput')

        customization_args_dict1 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': 'Enter here.'
                }
            },
            'rows': {'value': 1}
        }
        customization_args_dict2 = {
            'choices': {'value': [
                {
                    'content_id': 'ca_choices_0',
                    'html': '<p>This is value1 for MultipleChoice</p>'
                },
                {
                    'content_id': 'ca_choices_1',
                    'html': '<p>This is value2 for MultipleChoice</p>'
                }
            ]},
            'showChoicesInShuffledOrder': {'value': True}
        }
        customization_args_dict3 = {
            'choices': {'value': [
                {
                    'content_id': 'ca_choices_0',
                    'html': '<p>This is value1 for ItemSelection</p>'
                },
                {
                    'content_id': 'ca_choices_1',
                    'html': '<p>This is value2 for ItemSelection</p>'
                },
                {
                    'content_id': 'ca_choices_2',
                    'html': '<p>This is value3 for ItemSelection</p>'
                }
            ]},
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 2}
        }
        customization_args_dict4 = {
            'choices': {'value': [
                {
                    'content_id': 'ca_choices_0',
                    'html': '<p>This is value1 for DragAndDropSortInput</p>'
                },
                {
                    'content_id': 'ca_choices_1',
                    'html': '<p>This is value2 for DragAndDropSortInput</p>'
                }
            ]},
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        state1.update_interaction_customization_args(customization_args_dict1)
        state2.update_interaction_customization_args(customization_args_dict2)
        state3.update_interaction_customization_args(customization_args_dict3)
        state4.update_interaction_customization_args(customization_args_dict4)

        default_outcome = state_domain.Outcome(
            'state2', state_domain.SubtitledHtml(
                'default_outcome', '<p>Default outcome for state1</p>'),
            False, [], None, None
        )
        state1.update_interaction_default_outcome(default_outcome)

        hint_list2 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>'
                )
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state2</p>'
                )
            ),
        ]
        state2.update_interaction_hints(hint_list2)

        solution_dict = {
            'interaction_id': '',
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        solution = state_domain.Solution.from_dict(
            state1.interaction.id, solution_dict)
        state1.update_interaction_solution(solution)

        state_answer_group_list2 = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'state1', state_domain.SubtitledHtml(
                        'feedback_1', '<p>Outcome2 for state2</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Equals',
                        {
                            'x': 0
                        }),
                    state_domain.RuleSpec(
                        'Equals',
                        {
                            'x': 1
                        })
                ],
                [],
                None),
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'state3', state_domain.SubtitledHtml(
                        'feedback_2', '<p>Outcome1 for state2</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Equals',
                        {
                            'x': 0
                        })
                ],
                [],
                None
            )]
        state_answer_group_list3 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'state1', state_domain.SubtitledHtml(
                    'feedback_1', '<p>Outcome for state3</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['ca_choices_0']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['ca_choices_2']
                    })
            ],
            [],
            None
        )]
        state2.update_interaction_answer_groups(state_answer_group_list2)
        state3.update_interaction_answer_groups(state_answer_group_list3)

        expected_html_list = [
            '',
            '',
            '<pre>Hello, this is state2</pre>',
            '<p>Outcome1 for state2</p>',
            '<p>Outcome2 for state2</p>',
            '',
            '<p>Hello, this is html1 for state2</p>',
            '<p>Hello, this is html2 for state2</p>',
            '<p>This is value1 for MultipleChoice</p>',
            '<p>This is value2 for MultipleChoice</p>',
            '<blockquote>Hello, this is state1</blockquote>',
            '<p>Default outcome for state1</p>',
            '<p>This is solution for state1</p>',
            '<p>Hello, this is state3</p>',
            '<p>Outcome for state3</p>',
            '',
            '<p>This is value1 for ItemSelection</p>',
            '<p>This is value2 for ItemSelection</p>',
            '<p>This is value3 for ItemSelection</p>',
            '<p>Hello, this is state4</p>',
            '',
            '<p>This is value1 for DragAndDropSortInput</p>',
            '<p>This is value2 for DragAndDropSortInput</p>'
        ]

        actual_outcome_list = exploration.get_all_html_content_strings()

        self.assertEqual(set(actual_outcome_list), set(expected_html_list))


class ExplorationChangesMergeabilityUnitTests(
        exp_services_test.ExplorationServicesUnitTests,
        test_utils.EmailTestBase):
    """Test methods related to exploration changes mergeability."""

    def test_changes_are_mergeable_when_content_changes_do_not_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'First title'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed title.')

        # Making changes to properties except content.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': None,
            'old_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {},
            'old_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'Continue',
            'old_value': None
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'old_value': {}
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2, 'Changed Interaction.')

        # Changing content of second state.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Congratulations, you have finished!</p>',
                'content_id': 'content'
            }
        })]

        # Checking that the changes can be applied when
        # changing to same version.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Changed content of End state.')

        # Changing content of first state.
        change_list_4 = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Introduction',
            'new_state_name': 'Renamed state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Renamed state',
            'new_state_name': 'Renamed state again'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Renamed state again',
            'new_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Hello</p>',
                'content_id': 'content'
            }
        })]

        # Checking for the mergability of the fourth change list.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

        # Checking for the mergability when working on latest version.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

    def test_changes_are_not_mergeable_when_content_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Making changes to content of the first state.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Content 1.</p>',
                'content_id': 'content'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed Content.')

        # Changing content of the same state to check that
        # changes are not mergeable.
        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Content 2.</p>',
                'content_id': 'content'
            }
        })]

        # Checking for the mergability of the second change list.
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_interaction_id_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Making changes in the properties which are
        # not related to the interaction id.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_2',
                    'html': '<p>This is the second hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {},
            'state_name': 'Introduction',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': 'Continue',
            'state_name': 'Introduction',
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'state_name': 'Introduction',
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_3 here because they already covers
        # the changes related to interaction in first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_3, 'Changed Interaction')

        # Changes related to interaction in the second state
        # to check for mergeability.
        change_list_4 = [exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': None,
            'old_value': 'EndExploration',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {},
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': 'NumericInput',
            'old_value': None,
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None,
                'dest': 'End',
                'labelled_as_correct': False,
                'param_changes': [],
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                }
            },
            'old_value': None,
            'property_name': 'default_outcome'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': 1,
            'old_value': 0,
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': [{
                'outcome': {
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'feedback': {
                        'html': '<p>Feedback</p>',
                        'content_id': 'feedback_0'
                    }
                },
                'rule_specs': [{
                    'inputs': {
                        'x': 60
                    },
                    'rule_type': 'IsLessThanOrEqualTo'
                }],
                'tagged_skill_misconception_id': None,
                'training_data': []
            }],
            'old_value': [],
            'property_name': 'answer_groups'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'End',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]
        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 1, change_list_4)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_interaction_id_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {},
            'state_name': 'Introduction',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': 'Continue',
            'state_name': 'Introduction',
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'state_name': 'Introduction',
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself again
        # to check that changes are not mergeable.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {},
            'state_name': 'Introduction',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': 'Continue',
            'state_name': 'Introduction',
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'state_name': 'Introduction',
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_customization_args_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes in the properties which aren't affected by
        # customization args or doesn't affects customization_args.
        change_list = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_2',
                    'html': '<p>This is the second hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 3,
            'state_name': 'Introduction',
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changed Contents and Hints')

        # Changes to the properties affecting customization_args
        # or are affected by customization_args in the same state.
        # This includes changes related to renaming a state in
        # order to check that changes are applied even if states
        # are renamed.
        change_list_2 = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'new_state_name': 'Intro-rename',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 'Introduction',
            'property_name': 'init_state_name',
            'new_value': 'Intro-rename',
            'cmd': 'edit_exploration_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 'TextInput',
            'property_name': 'widget_id',
            'new_value': None,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'property_name': 'widget_customization_args',
            'new_value': {},
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 1,
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': None,
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 3,
            'property_name': 'next_content_id_index',
            'new_value': 4,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': [],
            'property_name': 'answer_groups',
            'new_value':
            [
                {
                    'rule_specs':
                    [
                        {
                            'inputs':
                            {
                                'x': 50
                            },
                            'rule_type': 'IsLessThanOrEqualTo'
                        }
                    ],
                    'training_data': [],
                    'tagged_skill_misconception_id': None,
                    'outcome':
                    {
                        'feedback':
                        {
                            'content_id': 'feedback_3',
                            'html': '<p>Next</p>'
                        },
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': False
                    }
                }
            ],
            'cmd': 'edit_state_property'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_2 here because they already covers
        # the changes related to customization args in first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_2,
            'Changed Interactions and Customization_args in One State')

        # Changes to the properties related to the customization args
        # in the second state to check for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'old_value': 'EndExploration',
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': None
        }), exp_domain.ExplorationChange({
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {}
        }), exp_domain.ExplorationChange({
            'old_value': 0,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': 'ItemSelectionInput'
        }), exp_domain.ExplorationChange({
            'old_value': {},
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {
                'minAllowableSelectionCount': {
                    'value': 1
                },
                'choices': {
                    'value': [{
                        'html': '<p>A</p>',
                        'content_id': 'ca_choices_0'
                    }, {
                        'html': '<p>B</p>',
                        'content_id': 'ca_choices_1'
                    }, {
                        'html': '<p>C</p>',
                        'content_id': 'ca_choices_2'
                    }, {
                        'html': '<p>D</p>',
                        'content_id': 'ca_choices_3'
                    }]
                },
                'maxAllowableSelectionCount': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'default_outcome',
            'cmd': 'edit_state_property',
            'new_value': {
                'refresher_exploration_id': None,
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                },
                'param_changes': [],
                'labelled_as_correct': False
            }
        }), exp_domain.ExplorationChange({
            'old_value': 4,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 5
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'state_name': 'End',
            'property_name': 'answer_groups',
            'cmd': 'edit_state_property',
            'new_value':
            [
                {
                    'training_data': [],
                    'tagged_skill_misconception_id': None,
                    'outcome':
                    {
                        'refresher_exploration_id': None,
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback':
                        {
                            'html': '<p>Good</p>',
                            'content_id': 'feedback_4'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False
                    },
                    'rule_specs':
                    [
                        {
                            'rule_type': 'Equals',
                            'inputs':
                            {
                                'x':
                                [
                                    'ca_choices_1'
                                ]
                            }
                        }
                    ]
                }
            ]
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 1, change_list_3)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_customization_args_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes in the properties which affected by or affecting
        # customization_args.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'new_state_name': 'Intro-rename',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 'Introduction',
            'property_name': 'init_state_name',
            'new_value': 'Intro-rename',
            'cmd': 'edit_exploration_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 'TextInput',
            'property_name': 'widget_id',
            'new_value': None,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'property_name': 'widget_customization_args',
            'new_value': {},
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 1,
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': None,
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 3,
            'property_name': 'next_content_id_index',
            'new_value': 4,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': [],
            'property_name': 'answer_groups',
            'new_value':
            [
                {
                    'rule_specs':
                    [
                        {
                            'inputs':
                            {
                                'x': 50
                            },
                            'rule_type': 'IsLessThanOrEqualTo'
                        }
                    ],
                    'training_data': [],
                    'tagged_skill_misconception_id': None,
                    'outcome':
                    {
                        'feedback':
                        {
                            'content_id': 'feedback_3',
                            'html': '<p>Next</p>'
                        },
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': False
                    }
                }
            ],
            'cmd': 'edit_state_property'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changed Customization Args and related properties again')

        # Changes to the customization_args in same
        # state again to check that changes are not mergeable.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value': {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text 2.'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'cmd': 'edit_state_property'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_answer_groups_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding answer_groups and solutions to the existing state.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': ['Hello', 'Hola']
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the properties that are not related to
        # the answer_groups. These changes are done to check
        # when the changes are made in unrelated properties,
        # they can be merged easily.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_4',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 5,
            'state_name': 'Introduction',
            'old_value': 4,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        # Changes to the answer_groups and the properties that
        # affects or are affected by answer_groups.
        change_list_4 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': [
                                'Hello',
                                'Hola',
                                'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_2 and change_list_3 here
        # because they already covers the changes related to
        # the answer_groups in the first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_2,
            'Added Answer Group and Solution in One state')

        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_3,
            'Changed Answer Groups and Solutions in One State')

        # Changes to the properties related to the answer_groups
        # in the second state to check for mergeability.
        change_list_5 = [exp_domain.ExplorationChange({
            'old_value': 'EndExploration',
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': None
        }), exp_domain.ExplorationChange({
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {}
        }), exp_domain.ExplorationChange({
            'old_value': 0,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': 'ItemSelectionInput'
        }), exp_domain.ExplorationChange({
            'old_value': {},
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {
                'minAllowableSelectionCount': {
                    'value': 1
                },
                'choices': {
                    'value': [{
                        'html': '<p>A</p>',
                        'content_id': 'ca_choices_0'
                    }, {
                        'html': '<p>B</p>',
                        'content_id': 'ca_choices_1'
                    }, {
                        'html': '<p>C</p>',
                        'content_id': 'ca_choices_2'
                    }, {
                        'html': '<p>D</p>',
                        'content_id': 'ca_choices_3'
                    }]
                },
                'maxAllowableSelectionCount': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'default_outcome',
            'cmd': 'edit_state_property',
            'new_value': {
                'refresher_exploration_id': None,
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                },
                'param_changes': [],
                'labelled_as_correct': False
            }
        }), exp_domain.ExplorationChange({
            'old_value': 4,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 5
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'state_name': 'End',
            'property_name': 'answer_groups',
            'cmd': 'edit_state_property',
            'new_value': [{
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'refresher_exploration_id': None,
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'html': '<p>Good</p>',
                        'content_id': 'feedback_4'
                    },
                    'param_changes': [],
                    'labelled_as_correct': False
                },
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': ['ca_choices_1']
                    }
                }]
            }]
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 2, change_list_5)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_answer_groups_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding answer_groups and solutions to the existing state.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': ['Hello', 'Hola']
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the answer_groups and the properties that
        # affects or are affected by answer_groups.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': [
                                'Hello',
                                'Hola',
                                'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Answer Groups and related properties')

        # Changes to the answer group in same state again
        # to check that changes are not mergeable.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': [
                                'Hello',
                                'Hola',
                                'Hey'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        })]
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_solutions_changes_do_not_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding new answer_groups and solutions.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the properties unrelated to the solutions.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_4',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 5,
            'state_name': 'Introduction',
            'old_value': 4,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        # Changes to the solutions and the properties that affects
        # solutions to check for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': False
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_2 and change_list_3 here
        # because they already covers the changes related to
        # the solutions in the first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_2,
            'Added Answer Group and Solution in One state')

        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_3,
            'Changed Answer Groups and Solutions in One State')

        # Changes to the properties related to the solutions
        # in the second state to check for mergeability.
        change_list_4 = [exp_domain.ExplorationChange({
            'old_value': 'EndExploration',
            'new_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'new_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'new_value': {
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': 0,
            'new_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'new_value': [{
                'outcome': {
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None,
                    'feedback': {
                        'html': '<p>Good</p>',
                        'content_id': 'feedback_0'
                    }
                },
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'rule_specs': [{
                    'rule_type': 'IsGreaterThanOrEqualTo',
                    'inputs': {
                        'x': 20
                    }
                }]
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1. State 2.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'new_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'new_value': {
                'correct_answer': 30,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'correct_answer': 30,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False
            },
            'new_value': {
                'correct_answer': 10,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'state_name': 'End'
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 2, change_list_4)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_solutions_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding new answer_groups and solutions.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the solutions and the properties that affects
        # solutions to check for mergeability.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Solutions and affected properties')

        # Change to the solution of same state again
        # to check that changes are not mergeable.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Changed Explanation.</p>'
                }
            }
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_hints_changes_do_not_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        # Adding hints to the existing state.
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'property_name': 'hints',
            'cmd': 'edit_state_property',
            'old_value': []
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 2,
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'correct_answer': 'Hello'
            },
            'property_name': 'solution',
            'cmd': 'edit_state_property',
            'old_value': None
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added Hint and Solution in Introduction state')

        # Changes to all state propeties other than the hints.
        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Content in Introduction.</p>',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 'Hello'
            },
            'new_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_id',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': 'TextInput',
            'new_value': None
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
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
            'new_value': {}
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman'
            },
            'new_value': None
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_id',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': None,
            'new_value': 'NumericInput'
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': 2,
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'property_name': 'answer_groups',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': [],
            'new_value': [{
                'rule_specs': [{
                    'inputs': {
                        'x': 46
                    },
                    'rule_type': 'IsLessThanOrEqualTo'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'feedback': {
                        'html': '',
                        'content_id': 'feedback_2'
                    },
                    'param_changes': []
                }
            }]
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': None,
            'new_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 42
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Congratulations, you have finished!</p>',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'First Title'
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 42
            },
            'new_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 40
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Made changes in interaction, contents, solutions, answer_groups in both states') # pylint: disable=line-too-long

        # Changes to the old hints and also deleted and added
        # new hints to take all the cases to check for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 2.</p>',
                        'content_id': 'hint_2'
                    }
                }, {
                    'hint_content': {
                        'html': '<p>Changed hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                }
            ],
            'state_name': 'Introduction'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

    def test_changes_are_not_mergeable_when_hints_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        # Adding hints to the existing state.
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'property_name': 'hints',
            'cmd': 'edit_state_property',
            'old_value': []
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 2,
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'correct_answer': 'Hello'
            },
            'property_name': 'solution',
            'cmd': 'edit_state_property',
            'old_value': None
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added Hint and Solution in Introduction state')

        # Changes to the old hints and also deleted and added
        # new hints to take all the cases to check for mergeability.
        change_list_2 = [exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 2.</p>',
                        'content_id': 'hint_2'
                    }
                }, {
                    'hint_content': {
                        'html': '<p>Changed hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                }
            ],
            'state_name': 'Introduction'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changes in the hints again.')

        change_list_3 = [exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Changed Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'state_name': 'Introduction'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_exploration_properties_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to all the properties of both states other than
        # exploration properties i.e. title, category, objective etc.
        # Also included rename states changes to check that
        # renaming states doesn't affect anything.
        change_list = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'html': '<p>Content</p>',
                'content_id': 'content'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'old_value': {
                'html': '',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                }
            ],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [

            ]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'old_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'old_value': None
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 3,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 2
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [
                {
                    'outcome': {
                        'refresher_exploration_id': None,
                        'feedback': {
                            'html': '<p>Good.</p>',
                            'content_id': 'feedback_2'
                        },
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': False,
                        'dest': 'End',
                        'param_changes': []
                    },
                    'training_data': [],
                    'rule_specs': [
                        {
                            'inputs': {
                                'x': 50
                            },
                            'rule_type': 'IsLessThanOrEqualTo'
                        }
                    ],
                    'tagged_skill_misconception_id': None
                }
            ],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [

            ]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '<p>Try Again.</p>',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'End',
                'param_changes': []
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'old_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'End',
                'param_changes': [

                ]
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '<p>Try Again.</p>',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'Introduction',
                'param_changes': [

                ]
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'old_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '<p>Try Again.</p>',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'End',
                'param_changes': [

                ]
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Made changes in interaction, contents, solutions, answer_groups in introduction state.') # pylint: disable=line-too-long

        # Changes to properties of second state.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 25,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                },
                {
                    'hint_content': {
                        'html': '<p>Hint 2.</p>',
                        'content_id': 'hint_3'
                    }
                }
            ],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 4,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'new_value': {
                'html': '<p>Congratulations, you have finished!</p>',
                'content_id': 'content'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'old_value': {
                'html': '',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'new_state_name': 'End-State',
            'cmd': 'rename_state',
            'old_state_name': 'End'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Made changes in solutions in introduction state and content, state_name in end state.') # pylint: disable=line-too-long

        # Changes to the exploration properties to check
        # for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'A changed title.'
        }), exp_domain.ExplorationChange({
            'property_name': 'objective',
            'cmd': 'edit_exploration_property',
            'old_value': 'An objective',
            'new_value': 'A changed objective.'
        }), exp_domain.ExplorationChange({
            'property_name': 'category',
            'cmd': 'edit_exploration_property',
            'old_value': 'A category',
            'new_value': 'A changed category'
        }), exp_domain.ExplorationChange({
            'property_name': 'auto_tts_enabled',
            'cmd': 'edit_exploration_property',
            'old_value': True,
            'new_value': False
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [

            ],
            'new_value': [
                'new'
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [
                'new'
            ],
            'new_value': [
                'new',
                'skill'
            ]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'language_code',
            'new_value': 'bn',
            'old_value': 'en'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'author_notes',
            'new_value': 'author_notes'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'blurb',
            'new_value': 'blurb'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'init_state_name',
            'new_value': 'End',
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'init_state_name',
            'new_value': 'Introduction',
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'auto_tts_enabled',
            'new_value': False
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'correctness_feedback_enabled',
            'new_value': True
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'confirmed_unclassified_answers',
            'state_name': 'Introduction',
            'new_value': ['test']
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'linked_skill_id',
            'new_value': 'string_1'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'card_is_checkpoint',
            'new_value': True
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

    def test_changes_are_not_mergeable_when_exploration_properties_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the exploration properties to check
        # for mergeability.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'A changed title.'
        }), exp_domain.ExplorationChange({
            'property_name': 'objective',
            'cmd': 'edit_exploration_property',
            'old_value': 'An objective',
            'new_value': 'A changed objective.'
        }), exp_domain.ExplorationChange({
            'property_name': 'category',
            'cmd': 'edit_exploration_property',
            'old_value': 'A category',
            'new_value': 'A changed category'
        }), exp_domain.ExplorationChange({
            'property_name': 'auto_tts_enabled',
            'cmd': 'edit_exploration_property',
            'old_value': True,
            'new_value': False
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [

            ],
            'new_value': [
                'new'
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [
                'new'
            ],
            'new_value': [
                'new',
                'skill'
            ]
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changes in the Exploration Properties.')

        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'A new title.'
        }), exp_domain.ExplorationChange({
            'property_name': 'objective',
            'cmd': 'edit_exploration_property',
            'old_value': 'An objective',
            'new_value': 'A new objective.'
        }), exp_domain.ExplorationChange({
            'property_name': 'category',
            'cmd': 'edit_exploration_property',
            'old_value': 'A category',
            'new_value': 'A new category'
        }), exp_domain.ExplorationChange({
            'property_name': 'auto_tts_enabled',
            'cmd': 'edit_exploration_property',
            'old_value': True,
            'new_value': False
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [

            ],
            'new_value': [
                'new'
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [
                'new'
            ],
            'new_value': [
                'new',
                'skill'
            ]
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_translations_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # translations can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [

            ],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        change_list_2 = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added answer group.')

        # Adding some translations to the first state.
        change_list_3 = [exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'content',
            'translation_html': '<p>Translation Content.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'default_outcome',
            'translation_html': '<p>Translation Feedback 1.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'cmd': 'mark_written_translations_as_needing_update',
            'state_name': 'Introduction',
            'content_id': 'default_outcome'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Added some translations.')

        # Adding translations again to the different contents
        # of same state to check that they can be merged.
        change_list_4 = [exp_domain.ExplorationChange({
            'new_state_name': 'Intro-Rename',
            'cmd': 'rename_state',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': 'Placeholder Translation.',
            'state_name': 'Intro-Rename',
            'language_code': 'de',
            'content_id': 'ca_placeholder_0',
            'cmd': 'add_written_translation',
            'data_format': 'unicode'
        }), exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': '<p>Hints Translation.</p>',
            'state_name': 'Intro-Rename',
            'language_code': 'de',
            'content_id': 'hint_1',
            'cmd': 'add_written_translation',
            'data_format': 'html'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'rule_input_2',
            'translation_html': '<p>Translation Rule Input.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'feedback_1',
            'translation_html': '<p>Translation Feedback.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'solution',
            'translation_html': '<p>Translation Solution.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'Introduction',
            'cmd': 'rename_state',
            'old_state_name': 'Intro-Rename'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

        # Adding translations to the second state to check
        # that they can be merged even in the same property.
        change_list_5 = [exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': '<p>State 2 Content Translation.</p>',
            'state_name': 'End',
            'language_code': 'de',
            'content_id': 'content',
            'cmd': 'add_written_translation',
            'data_format': 'html'
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_5)
        self.assertEqual(changes_are_mergeable_1, True)

        # Add changes to the different content of first state to
        # check that translation changes to some properties doesn't
        # affects the changes of content of other properties.
        change_list_6 = [exp_domain.ExplorationChange({
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder Changed.',
                        'content_id': 'ca_placeholder_0'
                    }
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': 'Feedback 1.'
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 2.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Customization Args Placeholder in First State.')
        changes_are_mergeable_3 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_5)
        self.assertEqual(changes_are_mergeable_3, True)

    def test_changes_are_not_mergeable_when_translations_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # translations can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [

            ],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        # Adding some translations to the first state.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed First State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'content',
            'translation_html': '<p>Translation Content.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'default_outcome',
            'translation_html': '<p>Translation Feedback 1.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'ca_placeholder_0',
            'translation_html': '<p>Translation Placeholder.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'hint_1',
            'translation_html': '<p>Translation Hint.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'solution',
            'translation_html': '<p>Translation Solution.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'rule_input_2',
            'translation_html': '<p>Translation Rule Input.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'Intro-Rename',
            'cmd': 'rename_state',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'feedback_1',
            'translation_html': '<p>Translation Feedback.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'Introduction',
            'cmd': 'rename_state',
            'old_state_name': 'Intro-Rename'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added some translations.')

        # Adding translations again to the same contents
        # of same state to check that they can not be
        # merged.
        change_list_3 = [exp_domain.ExplorationChange({
            'language_code': 'bn',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'content',
            'translation_html': '<p>Translation Content.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'bn',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'default_outcome',
            'translation_html': '<p>Translation Feedback 1.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

        # Changes to the content of second state to check that
        # the changes to the translations can not be made in
        # same state if the property which can be translated is
        # changed.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed Second State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Changing Content in Second State.')

        # Adding translations to the same property in
        # second state to check that they can not be merged.
        change_list_4 = [exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': '<p>State 2 Content Translation.</p>',
            'state_name': 'End',
            'language_code': 'de',
            'content_id': 'content',
            'cmd': 'add_written_translation',
            'data_format': 'html'
        })]
        changes_are_not_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_not_mergeable_1, False)

    def test_changes_are_mergeable_when_voiceovers_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # voiceovers can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        # Adding change to the field which is neither
        # affected by nor affects voiceovers.
        change_list_2 = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'card_is_checkpoint',
            'new_value': True
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added single unrelated change.')

        # Adding some voiceovers to the first state.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {}
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {
                        'en': {
                            'needs_update': False,
                            'filename': 'ca_placeholder_0-en-mfy5l6logg.mp3',
                            'file_size_bytes': 175542,
                            'duration_secs': 10.971375
                        }
                    },
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Added some voiceovers.')

        # Adding voiceovers again to the same first state
        # to check if they can be applied. They will not
        # be mergeable as the changes are in the same property
        # i.e. recorded_voiceovers.
        change_list_4 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'cmd': 'edit_state_property',
            'old_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'new_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {
                        'en': {
                            'needs_update': False,
                            'duration_secs': 30.0669375,
                            'filename': 'hint_1-en-ajclkw0cnz.mp3',
                            'file_size_bytes': 481071
                        }
                    }
                }
            },
            'state_name': 'Introduction'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_mergeable, False)

        # Adding voiceovers to the second state to check
        # if they can be applied. They can be mergead as
        # the changes are in the different states.
        change_list_5 = [exp_domain.ExplorationChange({
            'old_value': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'property_name': 'recorded_voiceovers',
            'cmd': 'edit_state_property',
            'new_value': {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'duration_secs': 10.3183125,
                            'filename': 'content-en-ar9zhd7edl.mp3',
                            'file_size_bytes': 165093,
                            'needs_update': False
                        }
                    }
                }
            },
            'state_name': 'End'
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_5)
        self.assertEqual(changes_are_mergeable_1, True)

        # Changes to the content of first state to check
        # that the changes in the contents of first state
        # doesn't affects the changes to the voiceovers in
        # second state.
        change_list_6 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed First State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Content in First State.')
        changes_are_mergeable_3 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_5)
        self.assertEqual(changes_are_mergeable_3, True)

        # Changes to the content of second state to check that
        # the changes to the voiceovers can not be made in
        # same state if the property which can be recorded is
        # changed.
        change_list_6 = [exp_domain.ExplorationChange({
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed Second State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Content in Second State.')

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_4)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_not_mergeable_when_voiceovers_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # voiceovers can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        # Adding some voiceovers to the first state.
        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {}
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {
                        'en': {
                            'needs_update': False,
                            'filename': 'ca_placeholder_0-en-mfy5l6logg.mp3',
                            'file_size_bytes': 175542,
                            'duration_secs': 10.971375
                        }
                    },
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added some voiceovers.')

        # Adding voiceovers again to the same first state
        # to check if they can be applied. They will not
        # be mergeable as the changes are in the same property
        # i.e. recorded_voiceovers.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'cmd': 'edit_state_property',
            'old_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'new_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {
                        'en': {
                            'needs_update': False,
                            'duration_secs': 30.0669375,
                            'filename': 'hint_1-en-ajclkw0cnz.mp3',
                            'file_size_bytes': 481071
                        }
                    }
                }
            },
            'state_name': 'Introduction'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, False)

    def test_changes_are_not_mergeable_when_state_added_or_deleted(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the various properties of the first and
        # second state.
        change_list = [exp_domain.ExplorationChange({
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': None,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
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
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {},
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'new_value': [
                {
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [
                        {
                            'rule_type': 'IsLessThanOrEqualTo',
                            'inputs': {
                                'x': 50
                            }
                        }
                    ],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_2',
                        'html': '<p>Hint.</p>'
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'new_value': {
                'content_id': 'content',
                'html': '<p>2Congratulations, you have finished!</p>'
            },
            'state_name': 'End'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changed various properties in both states.')

        # Change to the unrelated property to check that
        # it can be merged.
        change_list_2 = [exp_domain.ExplorationChange({
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Hello Aryaman!</p>',
                'content_id': 'content'
            },
            'state_name': 'Introduction',
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_mergeable, True)

        # Deleting and Adding states to check that when any
        # state is deleted or added, then the changes can not be
        # merged.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_state_name': 'End-State',
            'cmd': 'rename_state',
            'old_state_name': 'End'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'End-State'
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'End-State',
            'cmd': 'rename_state',
            'old_state_name': 'End'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'End',
            'cmd': 'rename_state',
            'old_state_name': 'End-State'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'tagged_skill_misconception_id': None,
                'rule_specs': [{
                    'rule_type': 'IsLessThanOrEqualTo',
                    'inputs': {
                        'x': 50
                    }
                }],
                'training_data': [],
                'outcome': {
                    'param_changes': [],
                    'dest': 'Introduction',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'new_value': [{
                'tagged_skill_misconception_id': None,
                'rule_specs': [{
                    'rule_type': 'IsLessThanOrEqualTo',
                    'inputs': {
                        'x': 50
                    }
                }],
                'training_data': [],
                'outcome': {
                    'param_changes': [],
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'param_changes': [],
                'dest': 'Introduction',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'new_value': {
                'param_changes': [],
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'new_value': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'
            },
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'EndExploration',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'param_changes': [],
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'new_value': None,
            'state_name': 'End'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Added and deleted states.')

        # Checking that old changes that could be
        # merged previously can not be merged after
        # addition or deletion of state.
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_not_mergeable_when_frontend_version_exceeds_backend_version(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the various properties of the first and
        # second state.
        change_list = [exp_domain.ExplorationChange({
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': None,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
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
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {},
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'new_value': [
                {
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [
                        {
                            'rule_type': 'IsLessThanOrEqualTo',
                            'inputs': {
                                'x': 50
                            }
                        }
                    ],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_2',
                        'html': '<p>Hint.</p>'
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'new_value': {
                'content_id': 'content',
                'html': '<p>2Congratulations, you have finished!</p>'
            },
            'state_name': 'End'
        })]

        # Changes are mergeable when updating the same version.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list)
        self.assertEqual(changes_are_mergeable, True)

        # Changes are not mergeable when updating from version
        # more than that on the backend.
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_email_is_sent_to_admin_in_case_of_adding_deleting_state_changes(
            self):
        self.login(self.OWNER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                self.ADMIN_EMAIL)
            self.assertEqual(len(messages), 0)
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, end_state_name='End')

            rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

            # Changes to the various properties of the first and
            # second state.
            change_list = [exp_domain.ExplorationChange({
                'old_value': 'TextInput',
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': None,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
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
                'cmd': 'edit_state_property',
                'property_name': 'widget_customization_args',
                'new_value': {},
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': None,
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': 'NumericInput',
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': 1,
                'cmd': 'edit_state_property',
                'property_name': 'next_content_id_index',
                'new_value': 2,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': [],
                'cmd': 'edit_state_property',
                'property_name': 'answer_groups',
                'new_value': [
                    {
                        'tagged_skill_misconception_id': None,
                        'rule_specs': [
                            {
                                'rule_type': 'IsLessThanOrEqualTo',
                                'inputs': {
                                    'x': 50
                                }
                            }
                        ],
                        'training_data': [],
                        'outcome': {
                            'param_changes': [],
                            'dest': 'End',
                            'missing_prerequisite_skill_id': None,
                            'feedback': {
                                'content_id': 'feedback_1',
                                'html': ''
                            },
                            'labelled_as_correct': False,
                            'refresher_exploration_id': None
                        }
                    }
                ],
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': [],
                'cmd': 'edit_state_property',
                'property_name': 'hints',
                'new_value': [
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': '<p>Hint.</p>'
                        }
                    }
                ],
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': 2,
                'cmd': 'edit_state_property',
                'property_name': 'next_content_id_index',
                'new_value': 3,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'content_id': 'content',
                    'html': 'Congratulations, you have finished!'
                },
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': '<p>2Congratulations, you have finished!</p>'
                },
                'state_name': 'End'
            })]

            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list,
                'Changed various properties in both states.')

            change_list_2 = [exp_domain.ExplorationChange({
                'new_state_name': 'End-State',
                'cmd': 'rename_state',
                'old_state_name': 'End'
            }), exp_domain.ExplorationChange({
                'cmd': 'delete_state',
                'state_name': 'End-State'
            }), exp_domain.ExplorationChange({
                'cmd': 'add_state',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'cmd': 'delete_state',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'cmd': 'add_state',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'new_state_name': 'End-State',
                'cmd': 'rename_state',
                'old_state_name': 'End'
            }), exp_domain.ExplorationChange({
                'new_state_name': 'End',
                'cmd': 'rename_state',
                'old_state_name': 'End-State'
            }), exp_domain.ExplorationChange({
                'old_value': [{
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [{
                        'rule_type': 'IsLessThanOrEqualTo',
                        'inputs': {
                            'x': 50
                        }
                    }],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'Introduction',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }],
                'cmd': 'edit_state_property',
                'property_name': 'answer_groups',
                'new_value': [{
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [{
                        'rule_type': 'IsLessThanOrEqualTo',
                        'inputs': {
                            'x': 50
                        }
                    }],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }],
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'param_changes': [],
                    'dest': 'Introduction',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'cmd': 'edit_state_property',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'content_id': 'content',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': 'Congratulations, you have finished!'
                },
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'old_value': None,
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': 'EndExploration',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'old_value': {},
                'cmd': 'edit_state_property',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'recommendedExplorationIds': {
                        'value': []
                    }
                },
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'param_changes': [],
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'cmd': 'edit_state_property',
                'property_name': 'default_outcome',
                'new_value': None,
                'state_name': 'End'
            })]

            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list_2,
                'Added and deleted states.')
            change_list_3 = [exp_domain.ExplorationChange({
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>Hello Aryaman!</p>',
                    'content_id': 'content'
                },
                'state_name': 'Introduction',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            })]
            changes_are_not_mergeable = exp_services.are_changes_mergeable(
                self.EXP_0_ID, 1, change_list_3)
            self.assertEqual(changes_are_not_mergeable, False)

            change_list_3_dict = [{
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>Hello Aryaman!</p>',
                    'content_id': 'content'
                },
                'state_name': 'Introduction',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            }]
            expected_email_html_body = (
                '(Sent from dummy-cloudsdk-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_3_dict, 1, 3))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                expected_email_html_body,
                messages[0].html.decode())

    def test_email_is_sent_to_admin_in_case_of_state_renames_changes_conflict(
            self):
        self.login(self.OWNER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                self.ADMIN_EMAIL)
            self.assertEqual(len(messages), 0)
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, end_state_name='End')

            rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
            change_list = [exp_domain.ExplorationChange({
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>End State</p>',
                    'content_id': 'content'
                },
                'state_name': 'End',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            })]
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list,
                'Changed various properties in both states.')

            # State name changed.
            change_list_2 = [exp_domain.ExplorationChange({
                'new_state_name': 'End-State',
                'cmd': 'rename_state',
                'old_state_name': 'End'
            })]

            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list_2,
                'Changed various properties in both states.')

            change_list_3 = [exp_domain.ExplorationChange({
                'old_value': {
                    'html': 'End State',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>End State Changed</p>',
                    'content_id': 'content'
                },
                'state_name': 'End',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            })]
            changes_are_not_mergeable = exp_services.are_changes_mergeable(
                self.EXP_0_ID, 2, change_list_3)
            self.assertEqual(changes_are_not_mergeable, False)

            change_list_3_dict = [{
                'old_value': {
                    'html': 'End State',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>End State Changed</p>',
                    'content_id': 'content'
                },
                'state_name': 'End',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            }]
            expected_email_html_body = (
                '(Sent from dummy-cloudsdk-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_3_dict, 2, 3))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                expected_email_html_body,
                messages[0].html.decode())

            # Add a translation after state renames.
            change_list_4 = [exp_domain.ExplorationChange({
                'content_html': 'N/A',
                'translation_html': '<p>State 2 Content Translation.</p>',
                'state_name': 'End',
                'language_code': 'de',
                'content_id': 'content',
                'cmd': 'add_written_translation',
                'data_format': 'html'
            })]
            changes_are_not_mergeable_2 = exp_services.are_changes_mergeable(
                self.EXP_0_ID, 2, change_list_4)
            self.assertEqual(changes_are_not_mergeable_2, False)

            change_list_4_dict = [{
                'cmd': 'add_written_translation',
                'state_name': 'End',
                'translation_html': '<p>State 2 Content Translation.</p>',
                'data_format': 'html',
                'language_code': 'de',
                'content_id': 'content',
                'content_html': 'N/A'}]
            expected_email_html_body_2 = (
                '(Sent from dummy-cloudsdk-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_4_dict, 2, 3))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 2)
            self.assertEqual(
                expected_email_html_body_2,
                messages[1].html.decode())
