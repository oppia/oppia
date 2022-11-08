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

from __future__ import annotations

import copy
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import exp_services_test
from core.domain import param_domain
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import translation_domain
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class ExplorationChangeTests(test_utils.GenericTestBase):

    def test_exp_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            exp_domain.ExplorationChange({'invalid': 'data'})

    def test_exp_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            exp_domain.ExplorationChange({'cmd': 'invalid'})

    def test_exp_change_object_with_deprecated_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.DeprecatedCommandError, 'Command clone is deprecated'):
            exp_domain.ExplorationChange({
                'cmd': 'clone',
                'property_name': 'content',
                'old_value': 'old_value'
            })

    def test_exp_change_object_with_deprecated_cmd_argument(self) -> None:
        with self.assertRaisesRegex(
            utils.DeprecatedCommandError,
            'Value for property_name in cmd edit_state_property: '
            'fallbacks is deprecated'):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'Introduction',
                'property_name': 'fallbacks',
                'new_value': 'foo',
            })

    def test_exp_change_object_with_missing_attribute_in_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value')):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'old_value': 'old_value'
            })

    def test_exp_change_object_with_extra_attribute_in_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            exp_domain.ExplorationChange({
                'cmd': 'rename_state',
                'old_state_name': 'old_state_name',
                'new_state_name': 'new_state_name',
                'invalid': 'invalid'
            })

    def test_exp_change_object_with_invalid_exploration_property(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for property_name in cmd edit_exploration_property: '
                'invalid is not allowed')):
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_exp_change_object_with_invalid_state_property(self) -> None:
        with self.assertRaisesRegex(
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

    def test_exp_change_object_with_create_new(self) -> None:
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'create_new',
            'category': 'category',
            'title': 'title'
        })

        self.assertEqual(exp_change_object.cmd, 'create_new')
        self.assertEqual(exp_change_object.category, 'category')
        self.assertEqual(exp_change_object.title, 'title')

    def test_exp_change_object_with_add_state(self) -> None:
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'state_name',
        })

        self.assertEqual(exp_change_object.cmd, 'add_state')
        self.assertEqual(exp_change_object.state_name, 'state_name')

    def test_exp_change_object_with_rename_state(self) -> None:
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'old_state_name',
            'new_state_name': 'new_state_name'
        })

        self.assertEqual(exp_change_object.cmd, 'rename_state')
        self.assertEqual(exp_change_object.old_state_name, 'old_state_name')
        self.assertEqual(exp_change_object.new_state_name, 'new_state_name')

    def test_exp_change_object_with_delete_state(self) -> None:
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'state_name',
        })

        self.assertEqual(exp_change_object.cmd, 'delete_state')
        self.assertEqual(exp_change_object.state_name, 'state_name')

    def test_exp_change_object_with_edit_state_property(self) -> None:
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

    def test_exp_change_object_with_edit_exploration_property(self) -> None:
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
        self
    ) -> None:
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'migrate_states_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version',
        })

        self.assertEqual(
            exp_change_object.cmd, 'migrate_states_schema_to_latest_version')
        self.assertEqual(exp_change_object.from_version, 'from_version')
        self.assertEqual(exp_change_object.to_version, 'to_version')

    def test_exp_change_object_with_revert_commit(self) -> None:
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
            'version_number': 'version_number'
        })

        self.assertEqual(
            exp_change_object.cmd,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT)
        self.assertEqual(exp_change_object.version_number, 'version_number')

    def test_to_dict(self) -> None:
        exp_change_dict = {
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category'
        }
        exp_change_object = exp_domain.ExplorationChange(exp_change_dict)
        self.assertEqual(exp_change_object.to_dict(), exp_change_dict)


class ExplorationVersionsDiffDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration versions difference domain object."""

    def setUp(self) -> None:
        super().setUp()
        self.exp_id = 'exp_id1'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, self.exp_id,
            assets_list)
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)

    def test_correct_creation_of_version_diffs(self) -> None:
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

    def test_cannot_create_exploration_change_with_invalid_change_dict(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Missing cmd key in change dict'):
            exp_domain.ExplorationChange({
                'invalid_cmd': 'invalid'
            })

    def test_cannot_create_exploration_change_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Command invalid_cmd is not allowed'):
            exp_domain.ExplorationChange({
                'cmd': 'invalid_cmd'
            })

    def test_cannot_create_exploration_change_with_invalid_state_property(
        self
    ) -> None:
        exp_change = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'state_name': '',
            'new_value': ''
        })
        self.assertTrue(isinstance(exp_change, exp_domain.ExplorationChange))

        with self.assertRaisesRegex(
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
        self
    ) -> None:
        exp_change = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': ''
        })
        self.assertTrue(isinstance(exp_change, exp_domain.ExplorationChange))

        with self.assertRaisesRegex(
            Exception,
            'Value for property_name in cmd edit_exploration_property: '
            'invalid_property is not allowed'):
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'invalid_property',
                'new_value': ''
            })

    def test_revert_exploration_commit(self) -> None:
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

    def test_create_exp_version_reference_object(self) -> None:
        exp_version_reference = exp_domain.ExpVersionReference('exp_id', 1)

        self.assertEqual(
            exp_version_reference.to_dict(), {
                'exp_id': 'exp_id',
                'version': 1
            })

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exp_version(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Expected version to be an int, received invalid_version'):
            exp_domain.ExpVersionReference('exp_id', 'invalid_version')  # type: ignore[arg-type]

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exp_id(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Expected exp_id to be a str, received 0'):
            exp_domain.ExpVersionReference(0, 1)  # type: ignore[arg-type]


class TransientCheckpointUrlTests(test_utils.GenericTestBase):
    """Testing TransientCheckpointUrl domain object."""

    def setUp(self) -> None:
        super().setUp()
        self.transient_checkpoint_url = exp_domain.TransientCheckpointUrl(
            'exp_id', 'frcs_name', 1, 'mrrcs_name', 1)

    def test_initialization(self) -> None:
        """Testing init method."""

        self.assertEqual(self.transient_checkpoint_url.exploration_id, 'exp_id')
        self.assertEqual(
            self.transient_checkpoint_url
            .furthest_reached_checkpoint_state_name,
            'frcs_name')
        self.assertEqual(
            self.transient_checkpoint_url.
            furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            self.transient_checkpoint_url
            .most_recently_reached_checkpoint_state_name, 'mrrcs_name')
        self.assertEqual(
            self.transient_checkpoint_url
            .most_recently_reached_checkpoint_exp_version, 1)

    def test_to_dict(self) -> None:
        logged_out_learner_progress_dict = {
            'exploration_id': 'exploration_id',
            'furthest_reached_checkpoint_exp_version': 1,
            'furthest_reached_checkpoint_state_name': (
                'furthest_reached_checkpoint_state_name'),
            'most_recently_reached_checkpoint_exp_version': 1,
            'most_recently_reached_checkpoint_state_name': (
                'most_recently_reached_checkpoint_state_name')
        }
        logged_out_learner_progress_object = exp_domain.TransientCheckpointUrl(
            'exploration_id',
            'furthest_reached_checkpoint_state_name', 1,
            'most_recently_reached_checkpoint_state_name', 1
        )
        self.assertEqual(
            logged_out_learner_progress_object.to_dict(),
            logged_out_learner_progress_dict)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_exploration_id_incorrect_type(self) -> None:
        self.transient_checkpoint_url.exploration_id = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected exploration_id to be a str'
        ):
            self.transient_checkpoint_url.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_furthest_reached_checkpoint_state_name_incorrect_type(
        self
    ) -> None:
        self.transient_checkpoint_url.furthest_reached_checkpoint_state_name = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected furthest_reached_checkpoint_state_name to be a str'
        ):
            self.transient_checkpoint_url.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_furthest_reached_checkpoint_exp_version_incorrect_type(
        self
    ) -> None:
        self.transient_checkpoint_url.furthest_reached_checkpoint_exp_version = 'invalid_version'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected furthest_reached_checkpoint_exp_version to be an int'
        ):
            self.transient_checkpoint_url.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_most_recently_reached_checkpoint_state_name_incorrect_type(
        self
    ) -> None:
        self.transient_checkpoint_url.most_recently_reached_checkpoint_state_name = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected most_recently_reached_checkpoint_state_name to be a str'
        ):
            self.transient_checkpoint_url.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_most_recently_reached_checkpoint_exp_version_incorrect_type(
        self
    ) -> None:
        self.transient_checkpoint_url.most_recently_reached_checkpoint_exp_version = 'invalid_version'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected most_recently_reached_checkpoint_exp_version to be an int'
        ):
            self.transient_checkpoint_url.validate()


class ExplorationCheckpointsUnitTests(test_utils.GenericTestBase):
    """Test checkpoints validations in an exploration. """

    def setUp(self) -> None:
        super().setUp()
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

    def test_init_state_with_card_is_checkpoint_false_is_invalid(self) -> None:
        self.init_state.update_card_is_checkpoint(False)
        with self.assertRaisesRegex(
            Exception, 'Expected card_is_checkpoint of first state to '
            'be True but found it to be False'):
            self.exploration.validate(strict=True)
        self.init_state.update_card_is_checkpoint(True)

    def test_end_state_with_card_is_checkpoint_true_is_invalid(self) -> None:
        default_outcome = self.init_state.interaction.default_outcome
        # Ruling out the possibility of None for mypy type checking.
        assert default_outcome is not None
        default_outcome.dest = self.exploration.init_state_name
        self.init_state.update_interaction_default_outcome(default_outcome)

        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }
        self.end_state.update_card_is_checkpoint(True)
        with self.assertRaisesRegex(
            Exception, 'Expected card_is_checkpoint of terminal state '
            'to be False but found it to be True'):
            self.exploration.validate(strict=True)
        self.end_state.update_card_is_checkpoint(False)

    def test_init_state_checkpoint_with_end_exp_interaction_is_valid(
        self
    ) -> None:
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

    def test_checkpoint_count_with_count_outside_range_is_invalid(self) -> None:
        self.exploration.init_state_name = 'Introduction'
        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }

        for i in range(8):
            self.exploration.add_states(['State%s' % i])
            self.exploration.states['State%s' % i].card_is_checkpoint = True
            self.set_interaction_for_state(
                self.exploration.states['State%s' % i],
                'Continue')
        with self.assertRaisesRegex(
            Exception, 'Expected checkpoint count to be between 1 and 8 '
            'inclusive but found it to be 9'
            ):
            self.exploration.validate(strict=True)
        self.exploration.states = {
            self.exploration.init_state_name: self.new_state,
            'End': self.end_state
        }

    def test_bypassable_state_with_card_is_checkpoint_true_is_invalid(
        self
    ) -> None:
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
                    'Second', None, state_domain.SubtitledHtml(
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
                    'Third', None, state_domain.SubtitledHtml(
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
                    'End', None, state_domain.SubtitledHtml(
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
        with self.assertRaisesRegex(
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
                    'End', None, state_domain.SubtitledHtml(
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
                    'A', None, state_domain.SubtitledHtml(
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
                    'B', None, state_domain.SubtitledHtml(
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
                    'C', None, state_domain.SubtitledHtml(
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
                    'D', None, state_domain.SubtitledHtml(
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
                    'End', None, state_domain.SubtitledHtml(
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
        with self.assertRaisesRegex(
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
                    'D', None, state_domain.SubtitledHtml(
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
                    'D', None, state_domain.SubtitledHtml(
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
                    'End 2', None, state_domain.SubtitledHtml(
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

        with self.assertRaisesRegex(
            Exception, 'Cannot make D a checkpoint as it is bypassable'
            ):
            self.exploration.validate(strict=True)
        d_state.update_card_is_checkpoint(False)


class ExplorationDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration domain object."""

    def setUp(self) -> None:
        super().setUp()
        translation_dict = {
            'content_id_3': translation_domain.TranslatedContent(
                'My name is Nikhil.', True)
        }
        self.dummy_entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)
        self.new_exploration = (
            exp_domain.Exploration.create_default_exploration('test_id'))
        self.state = self.new_exploration.states['Introduction']
        self.set_interaction_for_state(self.state, 'Continue')

    def test_image_rte_tag(self) -> None:
        """Validate image tag."""
        self.state.content.html = (
            '<oppia-noninteractive-image></oppia-noninteractive-image>')
        self._assert_validation_error(
            self.new_exploration, 'Image tag does not have \'alt-with-value\' '
            'attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-image alt-with-value="&quot;Image&quot;" '
            'caption-with-value=\"&amp;quot;aaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            'aaaaaa&amp;quot;\"></oppia-noninteractive-image>')
        self._assert_validation_error(
            self.new_exploration, 'Image tag \'caption-with-value\' attribute '
                'should not be greater than 500 characters.')

        self.state.content.html = (
            '<oppia-noninteractive-image alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>')
        self._assert_validation_error(
            self.new_exploration, 'Image tag does not have \'caption-with'
            '-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-image filepath-with-value="&quot;&quot;'
            '" caption-with-value="&quot;&quot;" alt-with-value="&quot;'
            'Image&quot;"></oppia-noninteractive-image>')
        self._assert_validation_error(
            self.new_exploration, 'Image tag \'filepath-with-value\' attribute '
            'should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-image caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;"></oppia-noninteractive-image>')
        self._assert_validation_error(
            self.new_exploration, 'Image tag does not have \'filepath-with'
            '-value\' attribute.')

    def test_skill_review_rte_tag(self) -> None:
        """Validate SkillReview tag."""
        self.state.content.html = (
            '<oppia-noninteractive-skillreview skill_id-with-value='
            '\"&amp;quot;&amp;quot;\" ></oppia-noninteractive-skillreview>'
        )
        self._assert_validation_error(
            self.new_exploration, 'SkillReview tag does not have \'text-with'
            '-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-skillreview skill_id-with-value='
            '\"&amp;quot;&amp;quot;\" text-with-value=\"&amp;quot;'
            '&amp;quot;\"></oppia-noninteractive-skillreview>'
        )
        self._assert_validation_error(
            self.new_exploration, 'SkillReview tag \'text-with-value\' '
            'attribute should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-skillreview text-with-value=\"&amp;quot;'
            'text&amp;quot;\"></oppia-noninteractive-skillreview>'
        )
        self._assert_validation_error(
            self.new_exploration, 'SkillReview tag does not have '
            '\'skill_id-with-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-skillreview skill_id-with-value='
            '\"&amp;quot;&amp;quot;\" text-with-value=\"&amp;quot;'
            'text&amp;quot;\"></oppia-noninteractive-skillreview>'
        )
        self._assert_validation_error(
            self.new_exploration, 'SkillReview tag \'skill_id-with-value\' '
            'attribute should not be empty.')

    def test_video_rte_tag(self) -> None:
        """Validate Video tag."""
        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"11\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag does not have \'start-with'
            '-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"11\" start-with-value=\"\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag \'start-with-value\' attribute '
            'should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'start-with-value=\"13\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag does not have \'end-with-value\' '
            'attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"\" start-with-value=\"13\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag \'end-with-value\' attribute '
            'should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"11\" start-with-value=\"13\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Start value should not be greater than End '
            'value in Video tag.')

        self.state.content.html = (
            '<oppia-noninteractive-video '
            'end-with-value=\"11\" start-with-value=\"9\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag does not have \'autoplay-with'
            '-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"not valid\" '
            'end-with-value=\"11\" start-with-value=\"9\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag \'autoplay-with-value\' attribute '
            'should be a boolean value.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"11\" start-with-value=\"9\">'
            '</oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag does not have \'video_id-with'
            '-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"11\" start-with-value=\"9\"'
            ' video_id-with-value=\"&amp;quot;&amp;'
            'quot;\"></oppia-noninteractive-video>')
        self._assert_validation_error(
            self.new_exploration, 'Video tag \'video_id-with-value\' attribute '
            'should not be empty.')

    def test_link_rte_tag(self) -> None:
        """Validate Link tag."""
        self.state.content.html = (
            '<oppia-noninteractive-link '
            'url-with-value=\"&amp;quot;http://www.example.com&amp;quot;\">'
            '</oppia-noninteractive-link>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Link tag does not have \'text-with-value\' '
            'attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-link'
            ' text-with-value=\"&amp;quot;something&amp;quot;\">'
            '</oppia-noninteractive-link>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Link tag does not have \'url-with-value\' '
            'attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-link'
            ' text-with-value=\"&amp;quot;something&amp;quot;\"'
            ' url-with-value=\"\"></oppia-noninteractive-link>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Link tag \'url-with-value\' attribute '
            'should not be empty.')

        self.state.content.html = (
          '<oppia-noninteractive-link text-with-value="&amp;quot;Google'
          '&amp;quot;" url-with-value="&amp;quot;http://www.google.com&amp;'
          'quot;"></oppia-noninteractive-link>'
        )
        self._assert_validation_error(
          self.new_exploration, (
            'Link should be prefix with acceptable schemas '
            'which are \\[\'https\', \'\']')
        )

    def test_math_rte_tag(self) -> None:
        """Validate Math tag."""
        self.state.content.html = (
            '<oppia-noninteractive-math></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag does not have '
            '\'math_content-with-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-math'
            ' math_content-with-value=\"\"></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag \'math_content-with-value\' '
            'attribute should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-math math_content-with-value='
            '\"{&amp;quot;svg_filename&amp;quot;:&amp;quot;'
            'mathImg.svgas&amp;quot;}\"></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag does not have \'raw_latex-with'
            '-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-math math_content-with-value='
            '\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;'
            '&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;'
            'mathImg.svgas&amp;quot;}\"></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag \'raw_latex-with-value\' attribute '
            'should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-math math_content-with-value='
            '\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;not empty'
            '&amp;quot;}\"></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag does not have '
            '\'svg_filename-with-value\' attribute.')

        self.state.content.html = (
            '<oppia-noninteractive-math math_content-with-value='
            '\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;something'
            '&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;'
            '&amp;quot;}\"></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag \'svg_filename-with-value\' '
            'attribute should not be empty.')

        self.state.content.html = (
            '<oppia-noninteractive-math math_content-with-value='
            '\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;something'
            '&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;'
            'image.png&amp;quot;}\"></oppia-noninteractive-math>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Math tag \'svg_filename-with-value\' '
            'attribute should have svg extension.')

    def test_tabs_rte_tag(self) -> None:
        """Validate Tabs tag."""
        self.state.content.html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[]\'>'
            '</oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No tabs are present inside the tabs tag.')

        self.state.content.html = (
            '<oppia-noninteractive-tabs></oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No content attribute is present inside '
            'the tabs tag.')

        self.state.content.html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[{&amp;quot;'
            '&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;content'
            '&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;hint&amp;lt;/p&amp;gt;&amp;'
            'quot;}]\'></oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No title attribute is present inside '
            'the tabs tag.')

        self.state.content.html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[{&amp;quot;'
            'title&amp;quot;:&amp;quot;&amp;quot;,&amp;quot;content&amp;quot;:'
            '&amp;quot;&amp;lt;p&amp;gt;hint&amp;lt;/p&amp;gt;&amp;quot;}]\'>'
            '</oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'title present inside tabs tag is empty.')

        self.state.content.html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[{&amp;quot;'
            'title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;'
            '&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;hint&amp;lt;/p&amp;gt;&amp;'
            'quot;}]\'></oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No content attribute is present inside '
            'the tabs tag.')

        self.state.content.html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[{&amp;quot;'
            'title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;'
            'content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;&amp;lt;/p&amp;gt;'
            '&amp;quot;}]\'></oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'content present inside tabs tag is empty.')

        self.state.content.html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[{&amp;quot;'
            'title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;'
            'content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;&amp;lt;oppia-'
            'noninteractive-tabs&amp;gt;&amp;lt;/oppia-noninteractive-tabs'
            '&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;}]\'>'
            '</oppia-noninteractive-tabs>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Tabs tag should not be present inside '
            'another Tabs or Collapsible tag.')

    def test_collapsible_rte_tag(self) -> None:
        """Validate Collapsible tag."""
        self.state.content.html = (
            '<oppia-noninteractive-collapsible '
            'content-with-value=\'&amp;quot;&amp;quot;\' heading-with-value='
            '\'&amp;quot;&amp;quot;\'></oppia-noninteractive-collapsible>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No collapsible content is present '
            'inside the tag.')

        self.state.content.html = (
            '<oppia-noninteractive-collapsible heading-with-value='
            '\'&amp;quot;head&amp;quot;\'></oppia-noninteractive-collapsible>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No content attribute present in '
            'collapsible tag.')

        self.state.content.html = (
            '<oppia-noninteractive-collapsible content-with-value='
            '\'&amp;quot;Content&amp;quot;\' heading-with-value='
            '\'&amp;quot;&amp;quot;\'></oppia-noninteractive-collapsible>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Heading attribute inside the collapsible '
            'tag is empty.')

        self.state.content.html = (
            '<oppia-noninteractive-collapsible content-with-value=\'&amp;'
            'quot;Content&amp;quot;\'></oppia-noninteractive-collapsible>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No heading attribute present in '
            'collapsible tag.')

        self.state.content.html = (
            '<oppia-noninteractive-collapsible content-with-value='
            '\'&amp;quot;<oppia-noninteractive-collapsible>'
            '</oppia-noninteractive-collapsible>&amp;quot;\' heading-with-value'
            '=\'&amp;quot;heading&amp;quot;\'>'
            '</oppia-noninteractive-collapsible>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Collapsible tag should not be present '
            'inside another Tabs or Collapsible tag.')
        self.state.content.html = 'Valid content'

    def test_written_translations(self) -> None:
        """Validate WrittenTranslations."""
        cust_args = (
            self.state.interaction.customization_args['buttonText'].value)
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(cust_args, state_domain.SubtitledUnicode)
        content_id_of_continue_button_text = cust_args.content_id

        self.state.written_translations.add_translation(
            content_id_of_continue_button_text,
            'en',
            '<oppia-noninteractive-image></oppia-noninteractive-image>'
        )
        self._assert_validation_error(
            self.new_exploration, 'Image tag does not have \'alt-with-value\' '
            'attribute.')

        self.state.written_translations.translations_mapping[
            content_id_of_continue_button_text]['en'].translation = (
            '<oppia-noninteractive-collapsible '
            'content-with-value=\'&amp;quot;&amp;quot;\' heading-with-value='
            '\'&amp;quot;&amp;quot;\'></oppia-noninteractive-collapsible>'
        )
        self._assert_validation_error(
            self.new_exploration, 'No collapsible content is present '
            'inside the tag.')

        self.state.written_translations.translations_mapping[
            content_id_of_continue_button_text]['en'].translation = (
            'valid value')

    def test_continue_interaction(self) -> None:
        """Tests Continue interaction."""
        self.set_interaction_for_state(self.state, 'Continue')
        self.state.interaction.customization_args[
          'buttonText'].value.unicode_str = 'Continueeeeeeeeeeeeeeeeee'
        self._assert_validation_error(
          self.new_exploration, (
            'The `continue` interaction text length should be atmost '
            '20 characters.')
        )

    def test_end_interaction(self) -> None:
        """Tests End interaction."""
        self.set_interaction_for_state(self.state, 'EndExploration')
        self.state.interaction.customization_args[
          'recommendedExplorationIds'].value = ['id1', 'id2', 'id3', 'id4']
        self.state.update_interaction_default_outcome(None)
        self._assert_validation_error(
          self.new_exploration, (
            'The total number of recommended explorations inside End '
            'interaction should be atmost 3.')
          )

    def test_numeric_interaction(self) -> None:
        """Tests Numeric interaction."""
        self.set_interaction_for_state(self.state, 'NumericInput')
        test_ans_group_for_numeric_interaction = [
            state_domain.AnswerGroup.from_dict({
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
                    'rule_type': 'IsWithinTolerance',
                    'inputs': {
                        'x': 1,
                        'tol': -1
                    }
                },
                {
                    'rule_type': 'IsInclusivelyBetween',
                    'inputs': {
                        'a': 8,
                        'b': 8
                    }
                },
                {
                    'rule_type': 'IsLessThanOrEqualTo',
                    'inputs': {
                        'x': 7
                    }
                },
                {
                    'rule_type': 'IsGreaterThanOrEqualTo',
                    'inputs': {
                        'x': 10
                    }
                },
                {
                    'rule_type': 'IsGreaterThanOrEqualTo',
                    'inputs': {
                        'x': 15
                    }
                }
            ],
            'outcome': {
                'dest': 'EXP_1_STATE_1',
                'feedback': {
                    'content_id': 'feedback_0',
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
            })
        ]
        self.state.interaction.answer_groups = (
            test_ans_group_for_numeric_interaction)
        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule \'1\' from answer group \'0\' will '
            'never be matched because it is made redundant by the above rules'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs = self.state.interaction.answer_groups[0].rule_specs
        rule_specs.remove(rule_specs[1])

        self._assert_validation_error(
            self.new_exploration, 'The rule \'1\' of answer group \'0\' having '
            'rule type \'IsWithinTolerance\' have \'tol\' value less than or '
            'equal to zero in NumericInput interaction.')
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' '
            'having rule type \'IsInclusivelyBetween\' have `a` value greater '
            'than `b` value in NumericInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' of '
            'NumericInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule \'2\' from answer group \'0\' will '
            'never be matched because it is made redundant by the above rules'
        ):
            self.new_exploration.validate(strict=True)

        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'feedback_0')
        self.state.written_translations.add_content_id_for_translation(
            'feedback_0')

    def test_fraction_interaction(self) -> None:
        """Tests Fraction interaction."""
        state = self.new_exploration.states['Introduction']
        self.set_interaction_for_state(state, 'FractionInput')
        test_ans_group_for_fraction_interaction = [
            state_domain.AnswerGroup.from_dict({
            'rule_specs': [
                {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 2,
                            'denominator': 3
                        }
                    }
                },
                {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 2,
                            'denominator': 3
                        }
                    }
                },
                {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 4,
                            'denominator': 6
                        }
                    }
                },
                {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 1,
                            'numerator': 3,
                            'denominator': 2
                        }
                    }
                },
                {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 3,
                            'denominator': 2
                        }
                    }
                },
                {
                    'rule_type': 'IsExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 2,
                            'numerator': 2,
                            'denominator': 3
                        }
                    }
                },
                {
                    'rule_type': 'IsGreaterThan',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 10,
                            'denominator': 3
                        }
                    }
                },
                {
                    'rule_type': 'IsExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 27,
                            'denominator': 2
                        }
                    }
                },
                {
                    'rule_type': 'HasDenominatorEqualTo',
                    'inputs': {
                        'x': 4
                    }
                },
                {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 9,
                            'denominator': 4
                        }
                    }
                },
                {
                    'rule_type': 'IsLessThan',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 7,
                            'denominator': 2
                        }
                    }
                },
                {
                    'rule_type': 'IsLessThan',
                    'inputs': {
                        'f': {
                            'isNegative': False,
                            'wholeNumber': 0,
                            'numerator': 5,
                            'denominator': 2
                        }
                    }
                }
            ],
            'outcome': {
                'dest': 'EXP_1_STATE_1',
                'feedback': {
                    'content_id': 'feedback_0',
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
            })
        ]
        state.interaction.answer_groups = (
            test_ans_group_for_fraction_interaction)
        state.interaction.customization_args[
            'allowNonzeroIntegerPart'].value = False
        state.interaction.customization_args[
            'allowImproperFraction'].value = False
        state.interaction.customization_args[
            'requireSimplestForm'].value = True
        rule_specs = state.interaction.answer_groups[0].rule_specs

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' of '
            'FractionInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' do '
            'not have value in simple form '
            'in FractionInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' do '
            'not have value in proper fraction '
            'in FractionInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' do '
            'not have value in proper fraction '
            'in FractionInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        state.interaction.customization_args[
            'allowImproperFraction'].value = True
        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' has '
            'non zero integer part in FractionInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule \'2\' from answer group \'0\' of '
            'FractionInput interaction will never be matched because it is '
            'made redundant by the above rules'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        self._assert_validation_error(
            self.new_exploration, 'Rule \'3\' from answer group \'0\' of '
            'FractionInput interaction having rule type HasFractionalPart'
            'ExactlyEqualTo will never be matched because it is '
            'made redundant by the above rules')
        rule_specs.remove(rule_specs[1])
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule \'3\' from answer group \'0\' of '
            'FractionInput interaction will never be matched because it is '
            'made redundant by the above rules'
        ):
            self.new_exploration.validate(strict=True)

        state.recorded_voiceovers.add_content_id_for_voiceover('feedback_0')
        state.written_translations.add_content_id_for_translation('feedback_0')

    def test_number_with_units_interaction(self) -> None:
        """Tests NumberWithUnits interaction."""
        self.set_interaction_for_state(self.state, 'NumberWithUnits')
        test_ans_group_for_number_with_units_interaction = [
            state_domain.AnswerGroup.from_dict({
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
                },
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
                },
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
                'dest': 'EXP_1_STATE_1',
                'feedback': {
                    'content_id': 'feedback_0',
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
            })
        ]
        self.state.update_interaction_answer_groups(
            test_ans_group_for_number_with_units_interaction)
        rule_specs = self.state.interaction.answer_groups[0].rule_specs
        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' has '
            'rule type equal is coming after rule type equivalent having '
            'same value in FractionInput interaction.'
        ):
            self.new_exploration.validate(strict=True)

        rule_specs.remove(rule_specs[1])
        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' of '
            'NumberWithUnitsInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)

    def test_multiple_choice_interaction(self) -> None:
        """Tests MultipleChoice interaction."""
        self.set_interaction_for_state(self.state, 'MultipleChoiceInput')
        test_ans_group_for_multiple_choice_interaction = [
            state_domain.AnswerGroup.from_dict({
            'rule_specs': [
                {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': 0
                    }
                },
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
                    'content_id': 'feedback_0',
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
            })
        ]
        self.state.update_interaction_answer_groups(
            test_ans_group_for_multiple_choice_interaction)
        rule_specs = self.state.interaction.answer_groups[0].rule_specs
        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>'),
            state_domain.SubtitledHtml('ca_choices_1', '<p>2</p>'),
            state_domain.SubtitledHtml('ca_choices_2', '<p>3</p>')
        ]

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' of '
            'MultipleChoiceInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)

        rule_specs.remove(rule_specs[1])
        self.state.interaction.customization_args[
            'choices'].value[2].html = '<p>2</p>'

    def test_item_selection_choice_interaction(self) -> None:
        """Tests ItemSelection interaction."""
        self.set_interaction_for_state(self.state, 'ItemSelectionInput')
        self.state.interaction.customization_args[
            'minAllowableSelectionCount'].value = 1
        self.state.interaction.customization_args[
            'maxAllowableSelectionCount'].value = 3
        test_ans_group_for_item_selection_interaction = [
            state_domain.AnswerGroup.from_dict({
            'rule_specs': [
                {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': ['ca_choices_0', 'ca_choices_1', 'ca_choices_2']
                    }
                },
                {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': ['ca_choices_0', 'ca_choices_1', 'ca_choices_2']
                    }
                }
            ],
            'outcome': {
                'dest': 'EXP_1_STATE_1',
                'feedback': {
                    'content_id': 'feedback_0',
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
            })
        ]
        self.state.update_interaction_answer_groups(
            test_ans_group_for_item_selection_interaction)
        rule_specs = self.state.interaction.answer_groups[0].rule_specs
        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>'),
            state_domain.SubtitledHtml('ca_choices_1', '<p>2</p>'),
            state_domain.SubtitledHtml('ca_choices_2', '<p>3</p>')
        ]
        self.state.interaction.customization_args[
            'minAllowableSelectionCount'].value = 3
        self.state.interaction.customization_args[
            'maxAllowableSelectionCount'].value = 1

        self._assert_validation_error(
            self.new_exploration, 'Min value which is 3 is greater than max '
            'value which is 1 in ItemSelectionInput interaction.'
        )

        self.state.interaction.customization_args[
            'minAllowableSelectionCount'].value = 4
        self.state.interaction.customization_args[
            'maxAllowableSelectionCount'].value = 4
        self._assert_validation_error(
            self.new_exploration, 'Number of choices which is 3 is lesser '
                'than the min value selection which is 4 in ItemSelectionInput '
                'interaction.')

        self.state.interaction.customization_args[
            'minAllowableSelectionCount'].value = 1
        self.state.interaction.customization_args[
            'maxAllowableSelectionCount'].value = 3
        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule 1 of answer group 0 of '
            'ItemSelectionInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        self.state.interaction.customization_args[
            'minAllowableSelectionCount'].value = 1
        self.state.interaction.customization_args[
            'maxAllowableSelectionCount'].value = 2
        with self.assertRaisesRegex(
            utils.ValidationError, 'Selected choices of rule \'0\' of answer '
            'group \'0\' either less than min_selection_value or greater than '
            'max_selection_value in ItemSelectionInput interaction.'
        ):
            self.new_exploration.validate(strict=True)

        self.state.interaction.customization_args[
            'minAllowableSelectionCount'].value = 1
        self.state.interaction.customization_args[
            'maxAllowableSelectionCount'].value = 3

    def test_drag_and_drop_interaction(self) -> None:
        """Tests DragAndDrop interaction."""
        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'ca_choices_2')
        self.state.written_translations.add_content_id_for_translation(
            'ca_choices_2')
        self.set_interaction_for_state(self.state, 'DragAndDropSortInput')
        empty_list: List[str] = []
        test_ans_group_for_drag_and_drop_interaction = [
            state_domain.AnswerGroup.from_dict({
            'rule_specs': [
                {
                    'rule_type': 'HasElementXAtPositionY',
                    'inputs': {
                        'x': 'ca_choices_0',
                        'y': 4
                    }
                },
                {
                    'rule_type': 'IsEqualToOrdering',
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_0', 'ca_choices_1', 'ca_choices_2'
                            ],
                            [
                            'ca_choices_3'
                            ]
                        ]
                    }
                },
                {
                    'rule_type': (
                        'IsEqualToOrderingWithOneItemAtIncorrectPosition'),
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_0'
                            ],
                            [
                            'ca_choices_1', 'ca_choices_2'
                            ],
                            [
                            'ca_choices_3'
                            ]
                        ]
                    }
                },
                {
                    'rule_type': 'IsEqualToOrdering',
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_0'
                            ],
                            [
                            'ca_choices_1', 'ca_choices_2'
                            ],
                            [
                            'ca_choices_3'
                            ]
                        ]
                    }
                },
                {
                    'rule_type': 'HasElementXBeforeElementY',
                    'inputs': {
                    'x': 'ca_choices_0',
                    'y': 'ca_choices_0'
                    }
                },
                {
                    'rule_type': 'IsEqualToOrdering',
                    'inputs': {
                        'x': empty_list
                    }
                },
                {
                    'rule_type': 'HasElementXAtPositionY',
                    'inputs': {
                        'x': 'ca_choices_0',
                        'y': 1
                    }
                },
                {
                    'rule_type': 'IsEqualToOrdering',
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_0'
                            ],
                            [
                            'ca_choices_1', 'ca_choices_2'
                            ],
                            [
                            'ca_choices_3'
                            ]
                        ]
                    }
                },
                {
                    'rule_type': (
                        'IsEqualToOrderingWithOneItemAtIncorrectPosition'),
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_1', 'ca_choices_3'
                            ],
                            [
                            'ca_choices_0'
                            ],
                            [
                            'ca_choices_2'
                            ]
                        ]
                    }
                },
                {
                    'rule_type': 'IsEqualToOrdering',
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_1'
                            ],
                            [
                            'ca_choices_0'
                            ],
                            [
                            'ca_choices_2', 'ca_choices_3'
                            ]
                        ]
                    }
                },
                {
                    'rule_type': 'IsEqualToOrdering',
                    'inputs': {
                        'x': [
                            [
                            'ca_choices_3'
                            ],
                            [
                            'ca_choices_2'
                            ],
                            [
                            'ca_choices_1'
                            ],
                            [
                            'ca_choices_0'
                            ]
                        ]
                    }
                }
            ],
            'outcome': {
                'dest': 'EXP_1_STATE_1',
                'feedback': {
                    'content_id': 'feedback_0',
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
            })
        ]
        self.state.interaction.answer_groups = (
            test_ans_group_for_drag_and_drop_interaction)
        rule_specs = self.state.interaction.answer_groups[0].rule_specs

        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>')
        ]
        self._assert_validation_error(
            self.new_exploration, (
              'There should be atleast 2 values inside DragAndDrop '
              'interaction.')
        )

        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>'),
            state_domain.SubtitledHtml('ca_choices_1', '<p> </p>'),
            state_domain.SubtitledHtml('ca_choices_2', '')
        ]
        self.state.interaction.customization_args[
            'allowMultipleItemsInSamePosition'].value = False

        self._assert_validation_error(
            self.new_exploration, 'Choices should be non empty.'
        )
        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>'),
            state_domain.SubtitledHtml('ca_choices_1', '<p>2</p>'),
            state_domain.SubtitledHtml('ca_choices_2', '')
        ]

        self._assert_validation_error(
            self.new_exploration, 'Choices should be non empty.'
        )
        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>'),
            state_domain.SubtitledHtml('ca_choices_1', '<p>2</p>'),
            state_domain.SubtitledHtml('ca_choices_2', '<p>2</p>')
        ]

        self._assert_validation_error(
            self.new_exploration, 'Choices should be unique.'
        )
        self.state.interaction.customization_args['choices'].value = [
            state_domain.SubtitledHtml('ca_choices_0', '<p>1</p>'),
            state_domain.SubtitledHtml('ca_choices_1', '<p>2</p>'),
            state_domain.SubtitledHtml('ca_choices_2', '<p>3</p>')
        ]

        self.state.interaction.customization_args[
            'allowMultipleItemsInSamePosition'].value = True

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - 1 of answer group 0 '
            'does not have the enough position to match for the '
            'HasElementXAtPositionY rule above.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])
        rule_specs.remove(rule_specs[0])

        self.state.interaction.customization_args[
            'allowMultipleItemsInSamePosition'].value = False

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'0\' of answer group \'0\' '
            'having rule type - IsEqualToOrderingWithOneItemAtIncorrectPosition'
            ' should not be there when the multiple items in same position '
            'setting is turned off in DragAndDropSortInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'0\' of answer group \'0\' '
            'have multiple items at same place when multiple items in same '
            'position settings is turned off in DragAndDropSortInput '
            'interaction.'
        ):
            self.new_exploration.validate(strict=True)

        self.state.interaction.customization_args[
            'allowMultipleItemsInSamePosition'].value = True
        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\', '
            'the value 1 and value 2 cannot be same when rule type is '
            'HasElementXBeforeElementY of DragAndDropSortInput interaction.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

        self._assert_validation_error(
            self.new_exploration, 'The rule \'1\'of answer group \'0\', '
            'having rule type IsEqualToOrdering should not have empty values.')
        rule_specs.remove(rule_specs[1])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'2\' of answer group \'0\' of '
            'DragAndDropInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - 1 of answer group 0 '
            'will never be match because it is made redundant by the '
            'HasElementXAtPositionY rule above.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - 1 of answer group 0 will never '
            'be match because it is made redundant by the '
            'IsEqualToOrderingWithOneItemAtIncorrectPosition rule above.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[1])

    def test_text_interaction(self) -> None:
        """Tests Text interaction."""
        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'feedback_0')
        self.state.written_translations.add_content_id_for_translation(
            'feedback_0')
        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'rule_input_27')
        self.state.written_translations.add_content_id_for_translation(
            'rule_input_27')
        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'ca_choices_0')
        self.state.written_translations.add_content_id_for_translation(
            'ca_choices_0')
        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'ca_choices_1')
        self.state.written_translations.add_content_id_for_translation(
            'ca_choices_1')
        self.state.recorded_voiceovers.add_content_id_for_voiceover(
            'ca_choices_2')
        self.state.written_translations.add_content_id_for_translation(
            'ca_choices_2')
        self.set_interaction_for_state(self.state, 'TextInput')
        test_ans_group_for_text_interaction = [
            state_domain.AnswerGroup.from_dict({
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
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'helloooooo'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'exci'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'excitement'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'he'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'hello'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'he'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'hello'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'he'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'hello'
                            ]
                        }
                    }
                },
                {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_27',
                            'normalizedStrSet': [
                                'hello'
                            ]
                        }
                    }
                }
            ],
            'outcome': {
                'dest': 'EXP_1_STATE_1',
                'feedback': {
                'content_id': 'feedback_0',
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
            })
        ]
        self.state.interaction.answer_groups = (
            test_ans_group_for_text_interaction)
        rule_specs = self.state.interaction.answer_groups[0].rule_specs

        self.state.interaction.customization_args['rows'].value = 15
        with self.assertRaisesRegex(
            utils.ValidationError, 'Rows value in Text interaction should '
            'be between 1 and 10.'
        ):
            self.new_exploration.validate()

        self.state.interaction.customization_args['rows'].value = 5
        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - \'1\' of answer group - \'0\' '
            'having rule type \'Contains\' will never be matched because it '
            'is made redundant by the above \'contains\' rule.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - \'1\' of answer group - \'0\' '
            'having rule type \'StartsWith\' will never be matched because it '
            'is made redundant by the above \'StartsWith\' rule.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - \'1\' of answer group - \'0\' '
            'having rule type \'StartsWith\' will never be matched because it '
            'is made redundant by the above \'contains\' rule.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - \'1\' of answer group - \'0\' '
            'having rule type \'Equals\' will never be matched because it '
            'is made redundant by the above \'contains\' rule.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'Rule - \'1\' of answer group - \'0\' '
            'having rule type \'Equals\' will never be matched because it '
            'is made redundant by the above \'StartsWith\' rule.'
        ):
            self.new_exploration.validate(strict=True)
        rule_specs.remove(rule_specs[0])

        with self.assertRaisesRegex(
            utils.ValidationError, 'The rule \'1\' of answer group \'0\' of '
            'TextInput interaction is already present.'
        ):
            self.new_exploration.validate(strict=True)

    # TODO(bhenning): The validation tests below should be split into separate
    # unit tests. Also, all validation errors should be covered in the tests.
    def test_validation(self) -> None:
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
        second_state = state_domain.State.create_default_state('BCD')
        self.set_interaction_for_state(new_state, 'TextInput')
        self.set_interaction_for_state(second_state, 'TextInput')

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

        exploration.states = {
            'ABC': new_state,
            'BCD': second_state
        }

        self._assert_validation_error(
            exploration, 'has no initial state name')

        exploration.init_state_name = 'initname'

        self._assert_validation_error(
            exploration,
            r'There is no state in \[\'ABC\'\, \'BCD\'\] corresponding to '
            'the exploration\'s initial state name initname.')

        # Test whether a default outcome to a non-existing state is invalid.
        exploration.states = {
            exploration.init_state_name: new_state,
            'BCD': second_state
        }
        self._assert_validation_error(
            exploration, 'destination ABC is not a valid')

        # Restore a valid exploration.
        init_state = exploration.states[exploration.init_state_name]
        default_outcome = init_state.interaction.default_outcome
        # Ruling out the possibility of None for mypy type checking.
        assert default_outcome is not None
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
        # Ruling out the possibility of None for mypy type checking.
        assert default_outcome is not None
        default_outcome.dest = exploration.init_state_name
        old_answer_groups: List[state_domain.AnswerGroupDict] = [
            {
                'outcome': {
                    'dest': exploration.init_state_name,
                    'dest_if_really_stuck': None,
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
            }
        ]

        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_group)
            for answer_group in old_answer_groups
        ]
        init_state.update_interaction_answer_groups(new_answer_groups)

        exploration.validate()

        interaction = init_state.interaction
        answer_groups = interaction.answer_groups
        answer_group = answer_groups[0]

        default_outcome.dest_if_really_stuck = 'ABD'
        self._assert_validation_error(
            exploration, 'The destination for the stuck learner '
            'ABD is not a valid state')

        default_outcome.dest_if_really_stuck = None

        answer_group.outcome.dest = 'DEF'
        self._assert_validation_error(
            exploration, 'destination DEF is not a valid')
        answer_group.outcome.dest = exploration.init_state_name

        answer_group.outcome.dest_if_really_stuck = 'XYZ'
        self._assert_validation_error(
            exploration, 'The destination for the stuck learner '
            'XYZ is not a valid state')

        answer_group.outcome.dest_if_really_stuck = None

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

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        rule_spec.inputs = 'Inputs string'  # type: ignore[assignment]
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
        with self.assertRaisesRegex(
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
            state_domain.AnswerGroup.from_dict(answer_group)
            for answer_group in old_answer_groups
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

        outcome.dest = destination

        default_outcome = init_state.interaction.default_outcome
        # Ruling out the possibility of None for mypy type checking.
        assert default_outcome is not None

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        default_outcome.dest_if_really_stuck = 20  # type: ignore[assignment]

        self._assert_validation_error(
            exploration, 'Expected dest_if_really_stuck to be a string')

        default_outcome.dest_if_really_stuck = None

        # Try setting the outcome destination to something other than a string.
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.dest = 15  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected outcome dest to be a string')

        outcome.dest = destination

        outcome.feedback = state_domain.SubtitledHtml('feedback_1', '')
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.labelled_as_correct = 'hello'  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'The "labelled_as_correct" field should be a boolean')

        # Test that labelled_as_correct must be False for self-loops, and that
        # this causes a strict validation failure but not a normal validation
        # failure.
        outcome.labelled_as_correct = True
        with self.assertRaisesRegex(
            Exception, 'is labelled correct but is a self-loop.'
        ):
            exploration.validate(strict=True)
        exploration.validate()

        outcome.labelled_as_correct = False
        exploration.validate()

        # Try setting the outcome destination if stuck to something other
        # than a string.
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.dest_if_really_stuck = 30  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected dest_if_really_stuck to be a string')

        outcome.dest_if_really_stuck = 'BCD'
        outcome.dest = 'BCD'

        # Test that no destination for the stuck learner is specified when
        # the outcome is labelled correct.
        outcome.labelled_as_correct = True

        with self.assertRaisesRegex(
            Exception, 'The outcome for the state is labelled '
            'correct but a destination for the stuck learner '
            'is specified.'
        ):
            exploration.validate(strict=True)
        exploration.validate()

        outcome.labelled_as_correct = False
        exploration.validate()

        outcome.dest = destination
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.param_changes = 'Changes'  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected outcome param_changes to be a list')

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.param_changes = [param_domain.ParamChange(
            0, 'generator_id', {})]  # type: ignore[arg-type]
        self._assert_validation_error(
            exploration,
            'Expected param_change name to be a string, received 0')

        outcome.param_changes = []
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.refresher_exploration_id = 12345  # type: ignore[assignment]
        self._assert_validation_error(
            exploration,
            'Expected outcome refresher_exploration_id to be a string')

        outcome.refresher_exploration_id = None
        exploration.validate()

        outcome.refresher_exploration_id = 'valid_string'
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        outcome.missing_prerequisite_skill_id = 12345  # type: ignore[assignment]
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
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        interaction.id = 15  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected interaction id to be a string')

        interaction.id = 'SomeInteractionTypeThatDoesNotExist'
        self._assert_validation_error(exploration, 'Invalid interaction id')
        interaction.id = 'PencilCodeEditor'

        self.set_interaction_for_state(init_state, 'TextInput')
        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_group)
            for answer_group in old_answer_groups
        ]
        init_state.update_interaction_answer_groups(new_answer_groups)
        valid_text_input_cust_args = init_state.interaction.customization_args
        rule_spec.inputs = {'x': {
            'contentId': 'rule_input_Equals',
            'normalizedStrSet': ['Test']
        }}
        rule_spec.rule_type = 'Contains'
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        interaction.customization_args = []  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected customization args to be a dict')

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        interaction.customization_args = {15: ''}  # type: ignore[dict-item]
        self._assert_validation_error(
            exploration,
            (
                'Expected customization arg value to be a '
                'InteractionCustomizationArg'
            )
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        interaction.customization_args = {
            15: state_domain.InteractionCustomizationArg('', {  # type: ignore[dict-item, no-untyped-call]
                'type': 'unicode'
            })
        }
        self._assert_validation_error(
            exploration, 'Invalid customization arg name')

        interaction.customization_args = valid_text_input_cust_args
        self.set_interaction_for_state(init_state, 'TextInput')
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        interaction.answer_groups = {}  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected answer groups to be a list')

        new_answer_groups = [
            state_domain.AnswerGroup.from_dict(answer_group)
            for answer_group in old_answer_groups
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
        init_state.interaction.answer_groups = answer_groups
        self._assert_validation_error(
            exploration,
            'Terminal interactions must not have any answer groups.')

        init_state.interaction.answer_groups = []
        self.set_interaction_for_state(init_state, 'Continue')
        init_state.interaction.answer_groups = answer_groups
        init_state.update_interaction_default_outcome(default_outcome)
        self._assert_validation_error(
            exploration,
            'Linear interactions must not have any answer groups.')

        # A terminal interaction without a default outcome or answer group is
        # valid. This resets the exploration back to a valid state.
        init_state.interaction.answer_groups = []
        exploration.validate()

        # Restore a valid exploration.
        self.set_interaction_for_state(init_state, 'TextInput')
        init_state.update_interaction_answer_groups(answer_groups)
        init_state.update_interaction_default_outcome(default_outcome)
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        interaction.hints = {}  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected hints to be a list')
        interaction.hints = []

        # Validate AnswerGroup.
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
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
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            1  # type: ignore[arg-type]
        )
        init_state.update_interaction_answer_groups([state_answer_group])

        self._assert_validation_error(
            exploration,
            'Expected tagged skill misconception id to be None, received 1')
        with self.assertRaisesRegex(
            Exception,
            'Expected tagged skill misconception id to be None, received 1'
        ):
            exploration.init_state.validate(
                exploration.param_specs,
                allow_null_interaction=False,
                tagged_skill_misconception_id_required=False)
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
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
            'Expected tagged skill misconception id to be None, received '
            'invalid_tagged_skill_misconception_id')

        with self.assertRaisesRegex(
            Exception,
            'Expected tagged skill misconception id to be None, received '
            'invalid_tagged_skill_misconception_id'
        ):
            exploration.init_state.validate(
                exploration.param_specs,
                allow_null_interaction=False,
                tagged_skill_misconception_id_required=False)

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        init_state.interaction.answer_groups[0].rule_specs = {}  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected answer group rules to be a list')

        first_answer_group = init_state.interaction.answer_groups[0]
        first_answer_group.tagged_skill_misconception_id = None
        first_answer_group.rule_specs = []
        self._assert_validation_error(
            exploration,
            'There must be at least one rule for each answer group.')
        with self.assertRaisesRegex(
            Exception,
            'There must be at least one rule for each answer group.'
        ):
            exploration.init_state.validate(
                exploration.param_specs,
                allow_null_interaction=False,
                tagged_skill_misconception_id_required=False)

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

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        exploration.param_specs = 'A string'  # type: ignore[assignment]
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

    def test_tag_validation(self) -> None:
        """Test validation of exploration tags."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        exploration.tags = 'this should be a list'  # type: ignore[assignment]
        self._assert_validation_error(
            exploration, 'Expected \'tags\' to be a list')

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        exploration.tags = [123]  # type: ignore[list-item]
        self._assert_validation_error(exploration, 'to be a string')
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        exploration.tags = ['abc', 123]  # type: ignore[list-item]
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

    def test_title_category_and_objective_validation(self) -> None:
        """Test that titles, categories and objectives are validated only in
        'strict' mode.
        """
        self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        exploration.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'title must be specified'
            ):
            exploration.validate(strict=True)
        exploration.title = 'A title'

        with self.assertRaisesRegex(
            utils.ValidationError, 'category must be specified'
            ):
            exploration.validate(strict=True)
        exploration.category = 'A category'

        with self.assertRaisesRegex(
            utils.ValidationError, 'objective must be specified'
            ):
            exploration.validate(strict=True)

        exploration.objective = 'An objective'

        exploration.validate(strict=True)

    def test_get_trainable_states_dict(self) -> None:
        """Test the get_trainable_states_dict() method."""
        exp_id = 'exp_id1'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)

        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True)
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
                'Renamed state', 'New state'],
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
                'Renamed state', 'New state3'
            ],
            'state_names_with_unchanged_answer_groups': []
        }
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        actual_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        self.assertEqual(actual_dict, expected_dict)

    def test_get_languages_with_complete_translation(self) -> None:
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

    def test_get_translation_counts_with_no_needs_update(self) -> None:
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
            'Introduction', None, state_domain.SubtitledHtml(
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
            'Introduction', None, state_domain.SubtitledHtml(
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

    def test_get_translation_counts_with_needs_update(self) -> None:
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
            'Introduction', None, state_domain.SubtitledHtml(
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

    def test_get_translation_counts_with_translation_in_multiple_lang(
        self
    ) -> None:
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
            'Introduction', None, state_domain.SubtitledHtml(
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

    def test_get_content_count(self) -> None:
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
                exploration.init_state_name, None, state_domain.SubtitledHtml(
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

        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict)
        # Adds 1 to content count to exploration (solution).
        init_state.update_interaction_solution(solution)

        self.assertEqual(exploration.get_content_count(), 6)

    def test_get_metadata(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        actual_metadata_dict = exploration.get_metadata().to_dict()
        expected_metadata_dict = {
            'title': exploration.title,
            'category': exploration.category,
            'objective': exploration.objective,
            'language_code': exploration.language_code,
            'tags': exploration.tags,
            'blurb': exploration.blurb,
            'author_notes': exploration.author_notes,
            'states_schema_version': exploration.states_schema_version,
            'init_state_name': exploration.init_state_name,
            'param_specs': {},
            'param_changes': [],
            'auto_tts_enabled': exploration.auto_tts_enabled,
            'correctness_feedback_enabled': (
                exploration.correctness_feedback_enabled),
            'edits_allowed': exploration.edits_allowed
        }

        self.assertEqual(actual_metadata_dict, expected_metadata_dict)

    def test_get_content_with_correct_state_name_returns_html(self) -> None:
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

    def test_get_content_with_incorrect_state_name_raise_error(self) -> None:
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

        with self.assertRaisesRegex(
            ValueError, 'State Invalid state does not exist'):
            exploration.get_content_html('Invalid state', 'hint_1')

    def test_is_demo_property(self) -> None:
        """Test the is_demo property."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = exp_domain.Exploration.create_default_exploration('a')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = exp_domain.Exploration.create_default_exploration('abcd')
        self.assertEqual(notdemo2.is_demo, False)

    def test_has_state_name(self) -> None:
        """Test for has_state_name."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        state_names = list(demo.states.keys())
        self.assertEqual(state_names, ['Introduction'])
        self.assertEqual(demo.has_state_name('Introduction'), True)
        self.assertEqual(demo.has_state_name('Fake state name'), False)

    def test_get_interaction_id_by_state_name(self) -> None:
        """Test for get_interaction_id_by_state_name."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(
            demo.get_interaction_id_by_state_name('Introduction'), None)

    def test_exploration_export_import(self) -> None:
        """Test that to_dict and from_dict preserve all data within an
        exploration.
        """
        demo = exp_domain.Exploration.create_default_exploration('0')
        demo_dict = demo.to_dict()
        exp_from_dict = exp_domain.Exploration.from_dict(demo_dict)
        self.assertEqual(exp_from_dict.to_dict(), demo_dict)

    def test_interaction_with_none_id_is_not_terminal(self) -> None:
        """Test that an interaction with an id of None leads to is_terminal
        being false.
        """
        # Default exploration has a default interaction with an ID of None.
        demo = exp_domain.Exploration.create_default_exploration('0')
        init_state = demo.states[feconf.DEFAULT_INIT_STATE_NAME]
        self.assertFalse(init_state.interaction.is_terminal)

    def test_cannot_create_demo_exp_with_invalid_param_changes(self) -> None:
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
        with self.assertRaisesRegex(
            Exception,
            'Parameter myParam was used in a state but not '
            'declared in the exploration param_specs.'):
            exp_domain.Exploration.from_dict(demo_dict)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_category(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.category = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected category to be a string, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_objective(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.objective = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected objective to be a string, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_blurb(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.blurb = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected blurb to be a string, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_language_code(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.language_code = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected language_code to be a string, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_author_notes(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.author_notes = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected author_notes to be a string, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_states(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.states = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected states to be a dict, received 1'):
            exploration.validate()

    def test_validate_exploration_outcome_dest(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.default_outcome is not None
        exploration.init_state.interaction.default_outcome.dest = None
        with self.assertRaisesRegex(
            Exception, 'Every outcome should have a destination.'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_outcome_dest_type(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.default_outcome is not None
        exploration.init_state.interaction.default_outcome.dest = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected outcome dest to be a string, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_states_schema_version(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.states_schema_version = None  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'This exploration has no states schema version.'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_auto_tts_enabled(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.auto_tts_enabled = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected auto_tts_enabled to be a bool, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_correctness_feedback_enabled(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.correctness_feedback_enabled = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception,
            'Expected correctness_feedback_enabled to be a bool, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_edits_allowed(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.edits_allowed = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception,
            'Expected edits_allowed to be a bool, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validate_exploration_param_specs(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.param_specs = {
            1: param_domain.ParamSpec.from_dict(  # type: ignore[dict-item]
                {'obj_type': 'UnicodeString'})
        }
        with self.assertRaisesRegex(
            Exception, 'Expected parameter name to be a string, received 1'):
            exploration.validate()

    def test_validate_exploration_param_changes_type(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
        exploration.param_changes = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected param_changes to be a list, received 1'):
            exploration.validate()

    def test_validate_exploration_param_name(self) -> None:
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
        with self.assertRaisesRegex(
            Exception,
            'No parameter named \'invalid\' exists in this '
            'exploration'):
            exploration.validate()

    def test_validate_exploration_reserved_param_name(self) -> None:
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
        with self.assertRaisesRegex(
            Exception,
            'The exploration-level parameter with name \'all\' is '
            'reserved. Please choose a different name.'):
            exploration.validate()

    def test_validate_exploration_is_non_self_loop(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='', category='',
            objective='', end_state_name='End')
        exploration.validate()

        exploration.add_states(['DEF'])

        default_outcome = state_domain.Outcome(
            'DEF', None, state_domain.SubtitledHtml(
                'default_outcome', '<p>Default outcome for state1</p>'),
            False, [], 'refresher_exploration_id', None,
        )
        exploration.init_state.update_interaction_default_outcome(
            default_outcome
        )

        with self.assertRaisesRegex(
            Exception,
            'The default outcome for state Introduction has a refresher '
            'exploration ID, but is not a self-loop.'):
            exploration.validate()

    def test_validate_exploration_answer_group_parameter(self) -> None:
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
                exploration.init_state_name, None, state_domain.SubtitledHtml(
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
        with self.assertRaisesRegex(
            Exception,
            'The parameter ParamChange was used in an answer group, '
            'but it does not exist in this exploration'):
            exploration.validate()

    def test_verify_all_states_reachable(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'owner_id')
        exploration.validate()

        exploration.add_states(['End'])
        end_state = exploration.states['End']
        self.set_interaction_for_state(end_state, 'EndExploration')
        end_state.update_interaction_default_outcome(None)

        with self.assertRaisesRegex(
            Exception,
            'Please fix the following issues before saving this exploration: '
            '1. The following states are not reachable from the initial state: '
            'End 2. It is impossible to complete the exploration from the '
            'following states: Introduction'):
            exploration.validate(strict=True)

    def test_update_init_state_name_with_invalid_state(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='title', category='category',
            objective='objective', end_state_name='End')

        exploration.update_init_state_name('End')
        self.assertEqual(exploration.init_state_name, 'End')

        with self.assertRaisesRegex(
            Exception,
            'Invalid new initial state name: invalid_state;'):
            exploration.update_init_state_name('invalid_state')

    def test_rename_state_with_invalid_state(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='title', category='category',
            objective='objective', end_state_name='End')

        self.assertTrue(exploration.states.get('End'))
        self.assertFalse(exploration.states.get('new state name'))

        exploration.rename_state('End', 'new state name')
        self.assertFalse(exploration.states.get('End'))
        self.assertTrue(exploration.states.get('new state name'))

        with self.assertRaisesRegex(
            Exception, 'State invalid_state does not exist'):
            exploration.rename_state('invalid_state', 'new state name')

    def test_default_outcome_is_labelled_incorrect_for_self_loop(self) -> None:
        exploration = self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='title', category='category',
            objective='objective', end_state_name='End')
        exploration.validate(strict=True)
        # Ruling out the possibility of None for mypy type checking.
        assert (
            exploration.init_state.interaction.default_outcome is not None
        )

        (
            exploration.init_state.interaction.default_outcome
            .labelled_as_correct) = True

        (
            exploration.init_state.interaction.default_outcome
            .dest) = exploration.init_state_name

        with self.assertRaisesRegex(
            Exception,
            'The default outcome for state Introduction is labelled '
            'correct but is a self-loop'):
            exploration.validate(strict=True)

    def test_serialize_and_deserialize_returns_unchanged_exploration(
        self
    ) -> None:
        """Checks that serializing and then deserializing a default exploration
        works as intended by leaving the exploration unchanged.
        """
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        self.assertEqual(
            exploration.to_dict(),
            exp_domain.Exploration.deserialize(
                exploration.serialize()).to_dict())

    def test_get_all_translatable_content_for_exp(self) -> None:
        """Get all translatable fields from exploration."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_answer_group = [state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>state outcome html</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals', {
                        'x': {
                            'contentId': 'rule_input_Equals',
                            'normalizedStrSet': ['Test']
                            }})
            ],
            [],
            None
        )]
        state_default_outcome = state_domain.Outcome(
            'State1', None, state_domain.SubtitledHtml(
                'default_outcome', '<p>Default outcome for State1</p>'),
            False, [], None, None
        )
        state_hint_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state1</p>'
                )
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state1</p>'
                )
            ),
        ]
        state_solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        state_interaction_cust_args: Dict[
            str, Dict[str, Union[Dict[str, str], int]]
        ] = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'rows': {'value': 1}
        }
        state.update_next_content_id_index(3)
        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))
        state.update_interaction_id('TextInput')
        state.update_interaction_customization_args(state_interaction_cust_args)
        state.update_interaction_answer_groups(
            state_answer_group)
        state.update_interaction_default_outcome(state_default_outcome)
        state.update_interaction_hints(state_hint_list)
        # Ruling out the possibility of None for mypy type checking.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            exploration.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents,
            [
                '<p>state outcome html</p>',
                '<p>Default outcome for State1</p>',
                '<p>Hello, this is html1 for state1</p>',
                ['Test'],
                '<p>Hello, this is html2 for state1</p>',
                '<p>This is solution for state1</p>',
                '<p>state content html</p>'
            ])


class ExplorationSummaryTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration(self.owner_id, exploration)
        self.exp_summary = exp_fetchers.get_exploration_summary_by_id('eid')
        self.exp_summary.editor_ids = ['editor_id']
        self.exp_summary.voice_artist_ids = ['voice_artist_id']
        self.exp_summary.viewer_ids = ['viewer_id']
        self.exp_summary.contributor_ids = ['contributor_id']

    def test_validation_passes_with_valid_properties(self) -> None:
        self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_title(self) -> None:
        self.exp_summary.title = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected title to be a string, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_category(self) -> None:
        self.exp_summary.category = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected category to be a string, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_objective(self) -> None:
        self.exp_summary.objective = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected objective to be a string, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_language_code(self) -> None:
        self.exp_summary.language_code = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected language_code to be a string, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_unallowed_language_code(self) -> None:
        self.exp_summary.language_code = 'invalid'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid language_code: invalid'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_tags(self) -> None:
        self.exp_summary.tags = 'tags'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected \'tags\' to be a list, received tags'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_tag_in_tags(self) -> None:
        self.exp_summary.tags = ['tag', 2]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each tag in \'tags\' to be a string, received \'2\''):
            self.exp_summary.validate()

    def test_validation_fails_with_empty_tag_in_tags(self) -> None:
        self.exp_summary.tags = ['', 'abc']
        with self.assertRaisesRegex(
            utils.ValidationError, 'Tags should be non-empty'):
            self.exp_summary.validate()

    def test_validation_fails_with_unallowed_characters_in_tag(self) -> None:
        self.exp_summary.tags = ['123', 'abc']
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Tags should only contain lowercase '
                'letters and spaces, received \'123\'')):
            self.exp_summary.validate()

    def test_validation_fails_with_whitespace_in_tag_start(self) -> None:
        self.exp_summary.tags = [' ab', 'abc']
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Tags should not start or end with whitespace, received \' ab\''):
            self.exp_summary.validate()

    def test_validation_fails_with_whitespace_in_tag_end(self) -> None:
        self.exp_summary.tags = ['ab ', 'abc']
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Tags should not start or end with whitespace, received \'ab \''):
            self.exp_summary.validate()

    def test_validation_fails_with_adjacent_whitespace_in_tag(self) -> None:
        self.exp_summary.tags = ['a   b', 'abc']
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Adjacent whitespace in tags should '
                'be collapsed, received \'a   b\'')):
            self.exp_summary.validate()

    def test_validation_fails_with_duplicate_tags(self) -> None:
        self.exp_summary.tags = ['abc', 'abc', 'ab']
        with self.assertRaisesRegex(
            utils.ValidationError, 'Some tags duplicate each other'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_rating_type(self) -> None:
        self.exp_summary.ratings = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected ratings to be a dict, received 0'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_rating_keys(self) -> None:
        self.exp_summary.ratings = {'1': 0, '10': 1}
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected ratings to have keys: 1, 2, 3, 4, 5, received 1, 10'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_value_type_for_ratings(self) -> None:
        self.exp_summary.ratings = {'1': 0, '2': 'one', '3': 0, '4': 0, '5': 0}  # type: ignore[dict-item]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected value to be int, received one'):
            self.exp_summary.validate()

    def test_validation_fails_with_invalid_value_for_ratings(self) -> None:
        self.exp_summary.ratings = {'1': 0, '2': -1, '3': 0, '4': 0, '5': 0}
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected value to be non-negative, received -1'):
            self.exp_summary.validate()

    def test_validation_passes_with_int_scaled_average_rating(self) -> None:
        self.exp_summary.scaled_average_rating = 1
        self.exp_summary.validate()
        self.assertEqual(self.exp_summary.scaled_average_rating, 1)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_scaled_average_rating(self) -> None:
        self.exp_summary.scaled_average_rating = 'one'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected scaled_average_rating to be float, received one'
        ):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_status(self) -> None:
        self.exp_summary.status = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected status to be string, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_community_owned(self) -> None:
        self.exp_summary.community_owned = '1'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected community_owned to be bool, received 1'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_contributors_summary(self) -> None:
        self.exp_summary.contributors_summary = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected contributors_summary to be dict, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_owner_ids_type(self) -> None:
        self.exp_summary.owner_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected owner_ids to be list, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_owner_id_in_owner_ids(self) -> None:
        self.exp_summary.owner_ids = ['1', 2, '3']  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in owner_ids to be string, received 2'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_editor_ids_type(self) -> None:
        self.exp_summary.editor_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected editor_ids to be list, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_editor_id_in_editor_ids(
        self
    ) -> None:
        self.exp_summary.editor_ids = ['1', 2, '3']  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in editor_ids to be string, received 2'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_voice_artist_ids_type(self) -> None:
        self.exp_summary.voice_artist_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected voice_artist_ids to be list, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_voice_artist_id_in_voice_artists_ids(
        self
    ) -> None:
        self.exp_summary.voice_artist_ids = ['1', 2, '3']  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in voice_artist_ids to be string, received 2'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_viewer_ids_type(self) -> None:
        self.exp_summary.viewer_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected viewer_ids to be list, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_viewer_id_in_viewer_ids(
        self
    ) -> None:
        self.exp_summary.viewer_ids = ['1', 2, '3']  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in viewer_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_validation_fails_with_duplicate_user_role(self) -> None:
        self.exp_summary.owner_ids = ['1']
        self.exp_summary.editor_ids = ['2', '3']
        self.exp_summary.voice_artist_ids = ['4']
        self.exp_summary.viewer_ids = ['2']
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Users should not be assigned to multiple roles at once, '
                'received users: 1, 2, 3, 4, 2')
        ):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_contributor_ids_type(self) -> None:
        self.exp_summary.contributor_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected contributor_ids to be list, received 0'):
            self.exp_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_contributor_id_in_contributor_ids(
        self
    ) -> None:
        self.exp_summary.contributor_ids = ['1', 2, '3']  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in contributor_ids to be string, received 2'):
            self.exp_summary.validate()

    def test_is_private(self) -> None:
        self.assertTrue(self.exp_summary.is_private())
        self.exp_summary.status = constants.ACTIVITY_STATUS_PUBLIC
        self.assertFalse(self.exp_summary.is_private())

    def test_is_solely_owned_by_user_one_owner(self) -> None:
        self.assertTrue(self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('other_id'))
        self.exp_summary.owner_ids = ['other_id']
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertTrue(self.exp_summary.is_solely_owned_by_user('other_id'))

    def test_is_solely_owned_by_user_multiple_owners(self) -> None:
        self.assertTrue(self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('other_id'))
        self.exp_summary.owner_ids = [self.owner_id, 'other_id']
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user(self.owner_id))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('other_id'))

    def test_is_solely_owned_by_user_other_users(self) -> None:
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('editor_id'))
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user('voice_artist_id'))
        self.assertFalse(self.exp_summary.is_solely_owned_by_user('viewer_id'))
        self.assertFalse(
            self.exp_summary.is_solely_owned_by_user('contributor_id'))

    def test_add_new_contribution_for_user_adds_user_to_contributors(
        self
    ) -> None:
        self.exp_summary.add_contribution_by_user('user_id')
        self.assertIn('user_id', self.exp_summary.contributors_summary)
        self.assertEqual(self.exp_summary.contributors_summary['user_id'], 1)
        self.assertIn('user_id', self.exp_summary.contributor_ids)

    def test_add_new_contribution_for_user_increases_score_in_contributors(
        self
    ) -> None:
        self.exp_summary.add_contribution_by_user('user_id')
        self.exp_summary.add_contribution_by_user('user_id')
        self.assertIn('user_id', self.exp_summary.contributors_summary)
        self.assertEqual(self.exp_summary.contributors_summary['user_id'], 2)

    def test_add_new_contribution_for_user_does_not_add_system_user(
        self
    ) -> None:
        self.exp_summary.add_contribution_by_user(
            feconf.SYSTEM_COMMITTER_ID)
        self.assertNotIn(
            feconf.SYSTEM_COMMITTER_ID, self.exp_summary.contributors_summary)
        self.assertNotIn(
            feconf.SYSTEM_COMMITTER_ID, self.exp_summary.contributor_ids)


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of explorations from YAML files."""

    YAML_CONTENT_INVALID_SCHEMA_VERSION: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    EXP_ID: Final = 'An exploration_id'

    def test_creation_with_invalid_yaml_schema_version(self) -> None:
        """Test that a schema version that is too big is detected."""
        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v46 to v[0-9]+ exploration YAML files '
            'at present.'):
            exp_domain.Exploration.from_yaml(
                'bad_exp', self.YAML_CONTENT_INVALID_SCHEMA_VERSION)

    def test_yaml_import_and_export(self) -> None:
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

        with self.assertRaisesRegex(
            Exception, 'Please ensure that you are uploading a YAML text file, '
            'not a zip file. The YAML parser returned the following error: '):
            exp_domain.Exploration.from_yaml('exp3', 'No_initial_state_name')

        with self.assertRaisesRegex(
            Exception,
            'Please ensure that you are uploading a YAML text file, not a zip'
            ' file. The YAML parser returned the following error: mapping '
            'values are not allowed here'):
            exp_domain.Exploration.from_yaml(
                'exp4', 'Invalid\ninit_state_name:\nMore stuff')

        with self.assertRaisesRegex(
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

    def test_correct_states_schema_conversion_methods_exist(self) -> None:
        """Test that the right states schema conversion methods exist."""
        current_states_schema_version = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        for version_num in range(
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

    def test_correct_exploration_schema_conversion_methods_exist(self) -> None:
        """Test that the right exploration schema conversion methods exist."""
        current_exp_schema_version = (
            exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION)

        for version_num in range(
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

    YAML_CONTENT_V46: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    YAML_CONTENT_V47: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    YAML_CONTENT_V48: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    YAML_CONTENT_V49: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    YAML_CONTENT_V50: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    YAML_CONTENT_V51: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

    YAML_CONTENT_V52: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 52
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
states_schema_version: 47
tags: []
title: Title
""")

    YAML_CONTENT_V53: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 53
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
states_schema_version: 48
tags: []
title: Title
""")

    YAML_CONTENT_V54: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 54
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
            x: 6
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: False
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
      id: NumericInput
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
        requireNonnegativeInput:
          value: False
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
      id: NumericInput
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
states_schema_version: 49
tags: []
title: Title
""")

    YAML_CONTENT_V55: Final = (
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
schema_version: 55
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
            x: 6
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: False
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
      id: NumericInput
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
        requireNonnegativeInput:
          value: False
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
      id: NumericInput
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
states_schema_version: 50
tags: []
title: Title
""")

    YAML_CONTENT_V56: Final = (
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
schema_version: 56
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
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 6
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: False
      default_outcome:
        dest: (untitled state)
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: NumericInput
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
        dest_if_really_stuck: null
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
states_schema_version: 51
tags: []
title: Title
""")

    _LATEST_YAML_CONTENT: Final = YAML_CONTENT_V56

    def test_load_from_v46_with_item_selection_input_interaction(self) -> None:
        """Tests the migration of ItemSelectionInput rule inputs."""
        sample_yaml_content: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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
          dest_if_really_stuck: null
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
        dest_if_really_stuck: null
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

        latest_sample_yaml_content: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
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
          dest_if_really_stuck: null
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
          value: 3
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: (untitled state)
        dest_if_really_stuck: null
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
states_schema_version: 53
tags: []
title: Title
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content)
        self.assertEqual(exploration.to_yaml(), latest_sample_yaml_content)

    def test_load_from_v46_with_drag_and_drop_sort_input_interaction(
        self
    ) -> None:
        """Tests the migration of DragAndDropSortInput rule inputs."""
        sample_yaml_content: str = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

        latest_sample_yaml_content: str = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
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
          dest_if_really_stuck: null
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
        dest_if_really_stuck: null
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
states_schema_version: 53
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content)
        self.assertEqual(exploration.to_yaml(), latest_sample_yaml_content)

    def test_load_from_v46_with_invalid_unicode_written_translations(
        self
    ) -> None:
        """Tests the migration of unicode written translations rule inputs."""
        sample_yaml_content: str = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
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

        latest_sample_yaml_content: str = (
            """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
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
        dest_if_really_stuck: null
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
states_schema_version: 53
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content)
        self.assertEqual(exploration.to_yaml(), latest_sample_yaml_content)

    def test_fixing_invalid_labeled_as_correct_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests if the answer group's destination is state itself then
        `labelled_as_correct` should be false. Migrates the invalid data.
        """

        sample_yaml_content_for_lab_as_correct: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_2
            html: <p>fdfdf</p>
          labelled_as_correct: true
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 25.0
          rule_type: Equals
        - inputs:
            x: 25.0
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: NumericInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 7
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_2: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content:
          hi:
            data_format: html
            translation:
            - <p>choicewa</p>
            needs_update: false
        default_outcome: {}
        feedback_2: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_lab_as_correct: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_2
            html: <p>fdfdf</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 25.0
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: NumericInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 7
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_2: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content:
          hi:
            data_format: html
            needs_update: false
            translation:
            - <p>choicewa</p>
        default_outcome: {}
        feedback_2: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_lab_as_correct)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_lab_as_correct)

    def test_fixing_of_rte_content_by_migrating_to_v_58(
        self
    ) -> None:
        """Tests the fixing of RTE content data from version less than 58."""

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        sample_yaml_content_for_rte: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: '<p>Content of RTE</p>

        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-link text-with-value="&amp;quotLink;&amp;quot;" url-with-value="&amp;quot;mailto:example@example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;Google&amp;quot;" url-with-value="&amp;quot;http://www.google.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;&amp;quot;" url-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link url-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;Link value&amp;quot;" url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;&amp;quot;" url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-math></oppia-noninteractive-math>
        <oppia-noninteractive-math math_content-with-value=""></oppia-noninteractive-math>
        <oppia-noninteractive-math math_content-with-value="{&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20220923_043725_4riv8t66q8_height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}"></oppia-noninteractive-math>
        <oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_latex&amp;quot;:&amp;quot;&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20220923_043725_4riv8t66q8_height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}"></oppia-noninteractive-math>
        <oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\frac{x}{y}&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20220923_043725_4riv8t66q8_height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}"></oppia-noninteractive-math>
        <oppia-noninteractive-skillreview skill_id-with-value="&amp;quot;skill id&amp;quot;" text-with-value="&amp;quot;concept card&amp;quot;"></oppia-noninteractive-skillreview>
        <oppia-noninteractive-skillreview skill_id-with-value="&amp;quot;&amp;quot;" text-with-value="&amp;quot;concept card&amp;quot;"></oppia-noninteractive-skillreview>
        <oppia-noninteractive-skillreview skill_id-with-value="&amp;quot;&amp;quot;" text-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-skillreview>
        <oppia-noninteractive-skillreview skill_id-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-skillreview>
        <oppia-noninteractive-skillreview text-with-value="&amp;quot;concept card&amp;quot;"></oppia-noninteractive-skillreview>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0" start-with-value="0" video_id-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0" start-with-value="0"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="5" start-with-value="10" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0" start-with-value="0" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="&amp;quot;&amp;quot;" end-with-value="&amp;quot;&amp;quot;" start-with-value="&amp;quot;&amp;quot;" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;lt;p&amp;gt;You have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-video _nghost-ovd-c35=\\&amp;quot;\\&amp;quot; autoplay-with-value=\\&amp;quot;true\\&amp;quot; end-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; ng-version=\\&amp;quot;11.2.14\\&amp;quot; start-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; video_id-with-value=\\&amp;quot;&amp;amp;amp;quot;hfnv-dfbv5h&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-video&amp;gt;&amp;quot;\" heading-with-value=\\"&amp;quot;&amp;quot;\\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;lt;oppia-noninteractive-tabs&amp;gt;&amp;lt;/oppia-noninteractive-tabs&amp;gt;&amp;quot;\" heading-with-value=\"&amp;quot;heading&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;lt;p&amp;gt;You have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-video _nghost-ovd-c35=\\&amp;quot;\\&amp;quot; autoplay-with-value=\\&amp;quot;true\\&amp;quot; end-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; ng-version=\\&amp;quot;11.2.14\\&amp;quot; start-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; video_id-with-value=\\&amp;quot;&amp;amp;amp;quot;hfnv-dfbv5h&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-video&amp;gt;&amp;quot;\" heading-with-value=\"&amp;quot;heading&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;lt;p&amp;gt;You have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-video _nghost-ovd-c35=\\&amp;quot;\\&amp;quot; autoplay-with-value=\\&amp;quot;true\\&amp;quot; end-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; ng-version=\\&amp;quot;11.2.14\\&amp;quot; start-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; video_id-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-video&amp;gt;&amp;quot;\" heading-with-value=\"&amp;quot;heading&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;lt;oppia-noninteractive-video _nghost-ovd-c35=\\&amp;quot;\\&amp;quot; autoplay-with-value=\\&amp;quot;true\\&amp;quot; end-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; ng-version=\\&amp;quot;11.2.14\\&amp;quot; start-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; video_id-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-video&amp;gt;&amp;quot;\" heading-with-value=\"&amp;quot;heading&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;lt;p&amp;gt;You have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-video _nghost-ovd-c35=\\&amp;quot;\\&amp;quot; autoplay-with-value=\\&amp;quot;true\\&amp;quot; end-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; ng-version=\\&amp;quot;11.2.14\\&amp;quot; start-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; video_id-with-value=\\&amp;quot;&amp;amp;amp;quot;hfnv-dfbv5h&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-video&amp;gt;&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible heading-with-value=\"&amp;quot;heading&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value=\"&amp;quot;&amp;quot;\" heading-with-value=\"&amp;quot;heading&amp;quot;\"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-tabs tab_contents-with-value=\"[{&amp;quot;title&amp;quot;:&amp;quot;Title1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;Content1&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;:&amp;quot;Title2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;Content2&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-image filepath-with-value=\\&amp;quot;&amp;amp;amp;quot;s7TabImage.png&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;}]\"></oppia-noninteractive-tabs>
        <oppia-noninteractive-tabs tab_contents-with-value=\"[{&amp;quot;title&amp;quot;:&amp;quot;Title2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;oppia-noninteractive-image filepath-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;}]\"></oppia-noninteractive-tabs>
        <oppia-noninteractive-tabs></oppia-noninteractive-tabs>
        <oppia-noninteractive-tabs tab_contents-with-value=\"[{&amp;quot;title&amp;quot;:&amp;quot;Title2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;oppia-noninteractive-collapsible&amp;gt;&amp;lt;/oppia-noninteractive-collapsible&amp;gt;&amp;quot;}]\"></oppia-noninteractive-tabs>
        <oppia-noninteractive-tabs tab_contents-with-value=\"[]\"></oppia-noninteractive-tabs>
        <oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
        &amp;quot;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint introduction&amp;quot;},
        {&amp;quot;content&amp;quot;: &amp;quot;&amp;quot;,
        &amp;quot;title&amp;quot;: &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;:
        &amp;quot;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint
        #2&amp;quot;}]"></oppia-noninteractive-tabs>'
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText_0
            unicode_str: Continueeeeeeeeeeeeeeeeeeeeeee
      default_outcome:
        dest: end
        dest_if_really_stuck: null
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
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText_0:
          hi:
            filename: default_outcome-hi-en-7hl9iw3az8.mp3
            file_size_bytes: 37198
            needs_update: false
            duration_secs: 2.324875
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText_0:
          hi:
            data_format: html
            translation: '<p><oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image></p>'
            needs_update: false
        content: {}
        default_outcome: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value:
          - id1
          - id2
          - id3
          - id4
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
states_schema_version: 52
tags: []
title: ''
""")

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
# pylint: disable=anomalous-backslash-in-string
        latest_sample_yaml_content_for_rte: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: '<p>Content of RTE</p>

        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"
        filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"
        filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"
        filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image>
        <oppia-noninteractive-link text-with-value="&amp;quot;Google&amp;quot;" url-with-value="&amp;quot;https://www.google.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;Link value&amp;quot;"
        url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;https://www.example.com&amp;quot;"
        url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-link text-with-value="&amp;quot;https://www.example.com&amp;quot;"
        url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link>
        <oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\frac{x}{y}&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20220923_043725_4riv8t66q8_height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}"></oppia-noninteractive-math>
        <oppia-noninteractive-skillreview skill_id-with-value="&amp;quot;skill id&amp;quot;"
        text-with-value="&amp;quot;concept card&amp;quot;"></oppia-noninteractive-skillreview>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0"
        start-with-value="0" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0"
        start-with-value="0" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0"
        start-with-value="0" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>
        <oppia-noninteractive-video autoplay-with-value="false" end-with-value="0"
        start-with-value="0" video_id-with-value="&amp;quot;mhlEfHv-LHo&amp;quot;"></oppia-noninteractive-video>   <oppia-noninteractive-collapsible
        content-with-value="&amp;quot;&amp;lt;p&amp;gt;You have opened the collapsible
        block.&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-video _nghost-ovd-c35=\&amp;quot;\&amp;quot;
        autoplay-with-value=\&amp;quot;true\&amp;quot; end-with-value=\&amp;quot;0\&amp;quot;
        ng-version=\&amp;quot;11.2.14\&amp;quot; start-with-value=\&amp;quot;0\&amp;quot;
        video_id-with-value=\&amp;quot;&amp;amp;amp;quot;hfnv-dfbv5h&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-video&amp;gt;&amp;quot;"
        heading-with-value="&amp;quot;heading&amp;quot;"></oppia-noninteractive-collapsible>
        <oppia-noninteractive-collapsible content-with-value="&amp;quot;&amp;lt;p&amp;gt;You
        have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;quot;" heading-with-value="&amp;quot;heading&amp;quot;"></oppia-noninteractive-collapsible>     <oppia-noninteractive-tabs
        tab_contents-with-value="[{&amp;quot;title&amp;quot;: &amp;quot;Title1&amp;quot;,
        &amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;Content1&amp;lt;/p&amp;gt;&amp;quot;},
        {&amp;quot;title&amp;quot;: &amp;quot;Title2&amp;quot;, &amp;quot;content&amp;quot;:
        &amp;quot;&amp;lt;p&amp;gt;Content2&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-image
        alt-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot;
        caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot;
        filepath-with-value=\&amp;quot;&amp;amp;amp;quot;s7TabImage.png&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;}]"></oppia-noninteractive-tabs>     '
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText_0
            unicode_str: Continue
      default_outcome:
        dest: end
        dest_if_really_stuck: null
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
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText_0:
          hi:
            duration_secs: 2.324875
            file_size_bytes: 37198
            filename: default_outcome-hi-en-7hl9iw3az8.mp3
            needs_update: true
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText_0:
          hi:
            data_format: html
            needs_update: true
            translation: <p><oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;"
              caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image></p>
        content: {}
        default_outcome: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value:
          - id1
          - id2
          - id3
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_rte)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_rte)

    def test_fixing_invalid_continue_and_end_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid continue and end exploration data
        from version less than 58.
        """

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        sample_yaml_content_for_cont_and_end_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Continue and End interaction validation</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText_0
            unicode_str: Continueeeeeeeeeeeeeeeeeeeeeee
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
            &amp;quot;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint introduction&amp;quot;},
            {&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;A noun is a person,
            place, or thing.  A noun can also be an animal.  &amp;lt;/p&amp;gt;&amp;quot;,
            &amp;quot;title&amp;quot;: &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;:
            &amp;quot;&amp;lt;p&amp;gt;One of these words is an animal.  Which word
            is the noun?&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint
            #2&amp;quot;}]"></oppia-noninteractive-tabs>'
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: Continue
      solution: null
    linked_skill_id: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText_0:
          hi:
            filename: default_outcome-hi-en-7hl9iw3az8.mp3
            file_size_bytes: 37198
            needs_update: false
            duration_secs: 2.324875
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText_0:
          hi:
            data_format: html
            translation: <p>choicewa</p>
            needs_update: false
        content: {}
        default_outcome: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value:
          - id1
          - id2
          - id3
          - id4
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
states_schema_version: 52
tags: []
title: ''
""")

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        latest_sample_yaml_content_for_cont_and_end_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Continue and End interaction validation</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText_0
            unicode_str: Continue
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
            &amp;quot;&amp;lt;p&amp;gt;A noun is a person, place, or thing.  A noun
            can also be an animal.  &amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;:
            &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;One
            of these words is an animal.  Which word is the noun?&amp;lt;/p&amp;gt;&amp;quot;,
            &amp;quot;title&amp;quot;: &amp;quot;Hint #2&amp;quot;}]"></oppia-noninteractive-tabs>'
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: Continue
      solution: null
    linked_skill_id: null
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText_0:
          hi:
            duration_secs: 2.324875
            file_size_bytes: 37198
            filename: default_outcome-hi-en-7hl9iw3az8.mp3
            needs_update: true
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText_0:
          hi:
            data_format: html
            needs_update: true
            translation: <p>choicewa</p>
        content: {}
        default_outcome: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value:
          - id1
          - id2
          - id3
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_cont_and_end_interac_1)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_cont_and_end_interac_1)

        sample_yaml_content_for_cont_and_end_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: hi
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Continue and End interaction validation</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText_0
            unicode_str: Continueeeeeeeeeeeeeeeeeeeeeee
      default_outcome:
        dest: end
        dest_if_really_stuck: null
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
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText_0: {}
        content: {}
        default_outcome: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value:
          - id1
          - id2
          - id3
          - id4
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_cont_and_end_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: hi
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Continue and End interaction validation</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText_0
            unicode_str: Continue
      default_outcome:
        dest: end
        dest_if_really_stuck: null
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
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_buttonText_0: {}
        content: {}
        default_outcome: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value:
          - id1
          - id2
          - id3
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_cont_and_end_interac_2)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_cont_and_end_interac_2)

    def test_fixing_invalid_numeric_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid NumericInput interaction exploration
        data from version less than 58.
        """

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        sample_yaml_content_for_numeric_interac: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_1
            html: <p>fdfdf</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 25.0
          rule_type: Equals
        - inputs:
            x: 25.0
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_2
            html: '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
            &amp;quot;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint introduction&amp;quot;},
            {&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;A noun is a person,
            place, or thing.  A noun can also be an animal.  &amp;lt;/p&amp;gt;&amp;quot;,
            &amp;quot;title&amp;quot;: &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;:
            &amp;quot;&amp;lt;p&amp;gt;One of these words is an animal.  Which word
            is the noun?&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint
            #2&amp;quot;}]"></oppia-noninteractive-tabs>'
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            a: 18.0
            b: 18.0
          rule_type: IsInclusivelyBetween
        - inputs:
            x: 25.0
          rule_type: Equals
        - inputs:
            tol: -5.0
            x: 5.0
          rule_type: IsWithinTolerance
        - inputs:
            a: 30.0
            b: 39.0
          rule_type: IsInclusivelyBetween
        - inputs:
            a: 17.0
            b: 15.0
          rule_type: IsInclusivelyBetween
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_3
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 25.0
          rule_type: IsLessThanOrEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_4
            html: <p>cc</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 15.0
          rule_type: IsLessThanOrEqualTo
        - inputs:
            x: 10.0
          rule_type: Equals
        - inputs:
            x: 5.0
          rule_type: IsLessThan
        - inputs:
            a: 9.0
            b: 5.0
          rule_type: IsInclusivelyBetween
        - inputs:
            tol: 2.0
            x: 5.0
          rule_type: IsWithinTolerance
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_5
            html: <p>cv</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 40.0
          rule_type: IsGreaterThanOrEqualTo
        - inputs:
            x: 50.0
          rule_type: Equals
        - inputs:
            x: 40.0
          rule_type: IsGreaterThan
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_6
            html: <p>vb</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: string
          rule_type: IsLessThanOrEqualTo
        - inputs:
            x: string
          rule_type: Equals
        - inputs:
            x: string
          rule_type: IsLessThan
        - inputs:
            a: string
            b: 9.0
          rule_type: IsInclusivelyBetween
        - inputs:
            tol: string
            x: 5.0
          rule_type: IsWithinTolerance
        - inputs:
            x: string
          rule_type: IsGreaterThanOrEqualTo
        - inputs:
            x: string
          rule_type: IsGreaterThan
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_7
            html: <p>vb</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            tol: string
            x: 60.0
          rule_type: IsWithinTolerance
        - inputs:
            a: string
            b: 10.0
          rule_type: IsInclusivelyBetween
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
        - hint_content:
            content_id: hint
            html: '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
              &amp;quot;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint introduction&amp;quot;},
              {&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;A noun is a person,
              place, or thing.  A noun can also be an animal.  &amp;lt;/p&amp;gt;&amp;quot;,
              &amp;quot;title&amp;quot;: &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;:
              &amp;quot;&amp;lt;p&amp;gt;One of these words is an animal.  Which word
              is the noun?&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: &amp;quot;Hint
              #2&amp;quot;}]"></oppia-noninteractive-tabs>'
        - hint_content:
            content_id: hint_2
            html: '<oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;"
              caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
      id: NumericInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 7
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        hint: {}
        hint_2: {}
        feedback_1: {}
        feedback_2: {}
        feedback_3: {}
        feedback_4: {}
        feedback_5: {}
        feedback_6: {}
        feedback_7: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        hint: {}
        hint_2: {}
        feedback_1: {}
        feedback_2: {}
        feedback_3: {}
        feedback_4: {}
        feedback_5: {}
        feedback_6: {}
        feedback_7: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        latest_sample_yaml_content_for_numeric_interac: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_2
            html: '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
              &amp;quot;&amp;lt;p&amp;gt;A noun is a person, place, or thing.  A noun
              can also be an animal.  &amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;:
              &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;One
              of these words is an animal.  Which word is the noun?&amp;lt;/p&amp;gt;&amp;quot;,
              &amp;quot;title&amp;quot;: &amp;quot;Hint #2&amp;quot;}]"></oppia-noninteractive-tabs>'
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 18.0
          rule_type: Equals
        - inputs:
            x: 25.0
          rule_type: Equals
        - inputs:
            tol: 5.0
            x: 5.0
          rule_type: IsWithinTolerance
        - inputs:
            a: 30.0
            b: 39.0
          rule_type: IsInclusivelyBetween
        - inputs:
            a: 15.0
            b: 17.0
          rule_type: IsInclusivelyBetween
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_3
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 25.0
          rule_type: IsLessThanOrEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_5
            html: <p>cv</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 40.0
          rule_type: IsGreaterThanOrEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        requireNonnegativeInput:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
      - hint_content:
          content_id: hint
          html: '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;content&amp;quot;:
            &amp;quot;&amp;lt;p&amp;gt;A noun is a person, place, or thing.  A noun
            can also be an animal.  &amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;:
            &amp;quot;Hint #1&amp;quot;}, {&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;One
            of these words is an animal.  Which word is the noun?&amp;lt;/p&amp;gt;&amp;quot;,
            &amp;quot;title&amp;quot;: &amp;quot;Hint #2&amp;quot;}]"></oppia-noninteractive-tabs>'
      id: NumericInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 7
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_2: {}
        feedback_3: {}
        feedback_5: {}
        hint: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_2: {}
        feedback_3: {}
        feedback_5: {}
        hint: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_numeric_interac)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_numeric_interac)

    def test_fixing_invalid_fraction_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid FractionInput interaction exploration
        data from version less than 58.
        """

        sample_yaml_content_for_fraction_interac: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_8
            html: <p>jj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 17
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 17
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_9
            html: <p>dfd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 17
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_10
            html: <p>hj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 11
              wholeNumber: 0
          rule_type: IsGreaterThan
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 14
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_11
            html: <p>hj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 11
              wholeNumber: 0
          rule_type: IsLessThan
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 7
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_12
            html: <p>ll</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 3
          rule_type: HasDenominatorEqualTo
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 11
              wholeNumber: 0
          rule_type: HasFractionalPartExactlyEqualTo
        - inputs:
            x: string
          rule_type: HasDenominatorEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_13
            html: <p>hj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 19
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowImproperFraction:
          value: true
        allowNonzeroIntegerPart:
          value: true
        customPlaceholder:
          value:
            content_id: ca_customPlaceholder_7
            unicode_str: ''
        requireSimplestForm:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: FractionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 14
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_10: {}
        feedback_11: {}
        feedback_12: {}
        feedback_13: {}
        feedback_8: {}
        feedback_9: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_10: {}
        feedback_11: {}
        feedback_12: {}
        feedback_13: {}
        feedback_8: {}
        feedback_9: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_fraction_interac: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_8
            html: <p>jj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 17
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_10
            html: <p>hj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 11
              wholeNumber: 0
          rule_type: IsGreaterThan
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_11
            html: <p>hj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 11
              wholeNumber: 0
          rule_type: IsLessThan
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_12
            html: <p>ll</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 3
          rule_type: HasDenominatorEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowImproperFraction:
          value: true
        allowNonzeroIntegerPart:
          value: true
        customPlaceholder:
          value:
            content_id: ca_customPlaceholder_7
            unicode_str: ''
        requireSimplestForm:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: FractionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 14
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_10: {}
        feedback_11: {}
        feedback_12: {}
        feedback_8: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_10: {}
        feedback_11: {}
        feedback_12: {}
        feedback_8: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_fraction_interac)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_fraction_interac)

        sample_yaml_content_for_fraction_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_8
            html: <p>jj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 3
              isNegative: false
              numerator: 17
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        - inputs:
            f:
              denominator: 17
              isNegative: false
              numerator: 3
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowImproperFraction:
          value: false
        allowNonzeroIntegerPart:
          value: true
        customPlaceholder:
          value:
            content_id: ca_customPlaceholder_7
            unicode_str: ''
        requireSimplestForm:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: FractionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 14
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_10: {}
        feedback_11: {}
        feedback_12: {}
        feedback_8: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_10: {}
        feedback_11: {}
        feedback_12: {}
        feedback_8: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_fraction_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_8
            html: <p>jj</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            f:
              denominator: 17
              isNegative: false
              numerator: 3
              wholeNumber: 0
          rule_type: IsExactlyEqualTo
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowImproperFraction:
          value: false
        allowNonzeroIntegerPart:
          value: true
        customPlaceholder:
          value:
            content_id: ca_customPlaceholder_7
            unicode_str: ''
        requireSimplestForm:
          value: false
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: FractionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 14
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_8: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_customPlaceholder_7: {}
        content: {}
        default_outcome: {}
        feedback_8: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_fraction_interac_2)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_fraction_interac_2)

    def test_fixing_invalid_multiple_choice_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid MultipleChoice interaction exploration
        data from version less than 58.
        """

        sample_yaml_content_for_multiple_choice_interac: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_17
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 0
          rule_type: Equals
        - inputs:
            x: 0
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_18
            html: <p>a</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 2
          rule_type: Equals
        - inputs:
            x: 0
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_19
            html: <p>aa</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 3
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_13
            html: ''
          - content_id: ca_choices_14
            html: ''
          - content_id: ca_choices_15
            html: <p>1</p>
          - content_id: ca_choices_16
            html: <p>1</p>
          - content_id: ca_choices_17
            html: <p>Choice 2</p>
        showChoicesInShuffledOrder:
          value: true
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: MultipleChoiceInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 20
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_13:
          hi:
            filename: default_outcome-hi-en-7hl9iw3az8.mp3
            file_size_bytes: 37198
            needs_update: false
            duration_secs: 2.324875
        ca_choices_14: {}
        ca_choices_15: {}
        ca_choices_16: {}
        ca_choices_17: {}
        content: {}
        default_outcome: {}
        feedback_17: {}
        feedback_18: {}
        feedback_19: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_13:
          hi:
            data_format: html
            translation: <p>choicewa</p>
            needs_update: false
        ca_choices_14: {}
        ca_choices_15: {}
        ca_choices_16: {}
        ca_choices_17: {}
        content: {}
        default_outcome: {}
        feedback_17: {}
        feedback_18: {}
        feedback_19: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_multiple_choice_interac: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_17
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 0
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_18
            html: <p>a</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 2
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_13
            html: <p>Choice 1</p>
          - content_id: ca_choices_15
            html: <p>1</p>
          - content_id: ca_choices_17
            html: <p>Choice 2</p>
        showChoicesInShuffledOrder:
          value: true
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: MultipleChoiceInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 20
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_13:
          hi:
            duration_secs: 2.324875
            file_size_bytes: 37198
            filename: default_outcome-hi-en-7hl9iw3az8.mp3
            needs_update: true
        ca_choices_15: {}
        ca_choices_17: {}
        content: {}
        default_outcome: {}
        feedback_17: {}
        feedback_18: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_13:
          hi:
            data_format: html
            needs_update: true
            translation: <p>choicewa</p>
        ca_choices_15: {}
        ca_choices_17: {}
        content: {}
        default_outcome: {}
        feedback_17: {}
        feedback_18: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_multiple_choice_interac)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_multiple_choice_interac)

    def test_fixing_invalid_item_selec_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid ItemSelection interaction exploration
        data from version less than 58.
        """

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        sample_yaml_content_for_item_selection_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_24
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
            - ca_choices_21
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_22
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_20
          rule_type: ContainsAtLeastOneOf
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_25
            html: <p>gg</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_20
            - ca_choices_21
            - ca_choices_22
            - ca_choices_23
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1<oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;&amp;quot;"></oppia-noninteractive-image></p>
          - content_id: ca_choices_21
            html: <p>2<oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image></p>
          - content_id: ca_choices_22
            html: <p>3</p>
          - content_id: ca_choices_23
            html: <p>4</p>
        maxAllowableSelectionCount:
          value: 2
        minAllowableSelectionCount:
          value: 3
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution:
        answer_is_exclusive: true
        correct_answer:
          - <p>1</p>
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 26
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        solution: {}
        feedback_24: {}
        feedback_25: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        solution: {}
        feedback_24: {}
        feedback_25: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

# pylint: disable=single-line-pragma
# pylint: disable=line-too-long
        latest_sample_yaml_content_for_item_selection_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_24
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
            - ca_choices_21
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_20
          rule_type: ContainsAtLeastOneOf
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_25
            html: <p>gg</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_20
            - ca_choices_21
            - ca_choices_22
            - ca_choices_23
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2<oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;"
              caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;img_20220923_043536_g7mr3k59oa_height_374_width_490.svg&amp;quot;"></oppia-noninteractive-image></p>
          - content_id: ca_choices_22
            html: <p>3</p>
          - content_id: ca_choices_23
            html: <p>4</p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution:
        answer_is_exclusive: true
        correct_answer:
        - <p>1</p>
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 26
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
        feedback_25: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
        feedback_25: {}
        solution: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_item_selection_interac_1)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_item_selection_interac_1)

        sample_yaml_content_for_item_selection_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_24
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_22
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_25
            html: <p>gg</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_22
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_21
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_26
            html: <p>gg</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_22
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_27
            html: <p>gg</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_23
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2</p>
          - content_id: ca_choices_22
            html: <p>3</p>
          - content_id: ca_choices_23
            html: <p>  </p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 2
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution:
        answer_is_exclusive: true
        correct_answer:
          - <p>  </p>
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 28
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        solution: {}
        feedback_24: {}
        feedback_25: {}
        feedback_26: {}
        feedback_27: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        solution: {}
        feedback_24: {}
        feedback_25: {}
        feedback_26: {}
        feedback_27: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_item_selection_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_25
            html: <p>gg</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_22
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        - inputs:
            x:
            - ca_choices_21
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2</p>
          - content_id: ca_choices_22
            html: <p>3</p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 28
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        content: {}
        default_outcome: {}
        feedback_25: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        content: {}
        default_outcome: {}
        feedback_25: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_item_selection_interac_2)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_item_selection_interac_2)

        sample_yaml_content_for_item_selection_interac_3: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_24
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_23
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_25
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
            - ca_choices_21
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2</p>
          - content_id: ca_choices_22
            html: <p>3</p>
          - content_id: ca_choices_23
            html: <p>4</p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 2
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 26
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
        feedback_25: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
        feedback_25: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_item_selection_interac_3: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_25
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
            - ca_choices_21
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2</p>
          - content_id: ca_choices_22
            html: <p>3</p>
          - content_id: ca_choices_23
            html: <p>4</p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 2
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 26
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        feedback_25: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        ca_choices_22: {}
        ca_choices_23: {}
        content: {}
        default_outcome: {}
        feedback_25: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_item_selection_interac_3)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_item_selection_interac_3)

        sample_yaml_content_for_item_selection_interac_4: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_24
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2</p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 3
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 26
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_item_selection_interac_4: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_24
            html: <p>dff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - ca_choices_20
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - content_id: ca_choices_20
            html: <p>1</p>
          - content_id: ca_choices_21
            html: <p>2</p>
        maxAllowableSelectionCount:
          value: 4
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 26
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_20: {}
        ca_choices_21: {}
        content: {}
        default_outcome: {}
        feedback_24: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_item_selection_interac_4)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_item_selection_interac_4)

    def test_fixing_invalid_drag_and_drop_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid DragAndDrop interaction exploration
        data from version less than 58.
        """

        sample_yaml_content_for_drag_and_drop_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_30
            html: <p>as</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - ca_choices_26
              - ca_choices_27
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrdering
        - inputs:
            x:
            - - ca_choices_26
              - ca_choices_27
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_31
            html: <p>ff</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: ca_choices_26
            y: ca_choices_26
          rule_type: HasElementXBeforeElementY
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_32
            html: <p>a</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: []
          rule_type: IsEqualToOrdering
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: ca_choices_27
            y: 2
          rule_type: HasElementXAtPositionY
        - inputs:
            x:
            - - ca_choices_26
            - - ca_choices_27
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrdering
        - inputs:
            x:
            - - ca_choices_26
            - []
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrdering
        - inputs:
            x:
            - - ca_choices_29
            - - ca_choices_28
            - - ca_choices_27
            - - ca_choices_26
          rule_type: IsEqualToOrdering
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: ca_choices_27
            y: 4
          rule_type: HasElementXAtPositionY
        - inputs:
            x:
            - - ca_choices_29
            - - ca_choices_28
          rule_type: IsEqualToOrdering
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: false
        choices:
          value:
          - content_id: ca_choices_26
            html: <p>1</p>
          - content_id: ca_choices_27
            html: <p>2</p>
          - content_id: ca_choices_28
            html: <p>3</p>
          - content_id: ca_choices_29
            html: <p>4</p>
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 34
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_30: {}
        feedback_31: {}
        feedback_32: {}
        feedback_33: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_30: {}
        feedback_31: {}
        feedback_32: {}
        feedback_33: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_drag_and_drop_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: ca_choices_27
            y: 2
          rule_type: HasElementXAtPositionY
        - inputs:
            x:
            - - ca_choices_29
            - - ca_choices_28
            - - ca_choices_27
            - - ca_choices_26
          rule_type: IsEqualToOrdering
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: ca_choices_27
            y: 4
          rule_type: HasElementXAtPositionY
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: false
        choices:
          value:
          - content_id: ca_choices_26
            html: <p>1</p>
          - content_id: ca_choices_27
            html: <p>2</p>
          - content_id: ca_choices_28
            html: <p>3</p>
          - content_id: ca_choices_29
            html: <p>4</p>
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 34
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_drag_and_drop_interac_1)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_drag_and_drop_interac_1)

        sample_yaml_content_for_drag_and_drop_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - ca_choices_29
              - ca_choices_28
            - - ca_choices_27
            - - ca_choices_26
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x:
            - - ca_choices_26
            - - ca_choices_27
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x:
            - - ca_choices_29
            - - ca_choices_27
              - ca_choices_28
            - - ca_choices_26
          rule_type: IsEqualToOrdering
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_26
            html: <p>1</p>
          - content_id: ca_choices_27
            html: <p>2</p>
          - content_id: ca_choices_28
            html: <p>3</p>
          - content_id: ca_choices_29
            html: <p>4</p>
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 34
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_drag_and_drop_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - ca_choices_29
              - ca_choices_28
            - - ca_choices_27
            - - ca_choices_26
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x:
            - - ca_choices_26
            - - ca_choices_27
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_26
            html: <p>1</p>
          - content_id: ca_choices_27
            html: <p>2</p>
          - content_id: ca_choices_28
            html: <p>3</p>
          - content_id: ca_choices_29
            html: <p>4</p>
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 34
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_drag_and_drop_interac_2)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_drag_and_drop_interac_2)

        sample_yaml_content_for_drag_and_drop_interac_3: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 57
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - ca_choices_26
            - - ca_choices_27
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x:
            - - ca_choices_29
            - - ca_choices_27
              - ca_choices_28
            - - ca_choices_26
          rule_type: IsEqualToOrdering
        - inputs:
            x: ca_choices_28
            y: ca_choices_26
          rule_type: HasElementXBeforeElementY
        - inputs:
            x: ca_choices_26
            y: ca_choices_28
          rule_type: HasElementXBeforeElementY
        - inputs:
            x: ca_choices_27
            y: 2
          rule_type: HasElementXAtPositionY
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_26
            html: <p></p>
          - content_id: ca_choices_27
            html: <p>  </p>
          - content_id: ca_choices_28
            html: <p>1</p>
          - content_id: ca_choices_29
            html: <p>2</p>
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution:
        answer_is_exclusive: true
        correct_answer:
        - - ca_choices_29
        - - ca_choices_27
          - ca_choices_28
        - - ca_choices_26
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 34
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        solution: {}
        default_outcome: {}
        feedback_33: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_26: {}
        ca_choices_27: {}
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        solution: {}
        default_outcome: {}
        feedback_33: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_drag_and_drop_interac_3: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_33
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - ca_choices_28
            - - ca_choices_29
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x:
            - - ca_choices_29
            - - ca_choices_28
          rule_type: IsEqualToOrdering
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_28
            html: <p>1</p>
          - content_id: ca_choices_29
            html: <p>2</p>
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution:
        answer_is_exclusive: true
        correct_answer:
        - - ca_choices_29
        - - ca_choices_28
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    linked_skill_id: null
    next_content_id_index: 34
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_28: {}
        ca_choices_29: {}
        content: {}
        default_outcome: {}
        feedback_33: {}
        solution: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_drag_and_drop_interac_3)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_drag_and_drop_interac_3)

    def test_fixing_invalid_text_exp_data_by_migrating_to_v58(
        self
    ) -> None:
        """Tests the migration of invalid TextInput interaction exploration
        data from version less than 58.
        """

        sample_yaml_content_for_text_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 53
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_35
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_36
              normalizedStrSet:
              - and
              - drop
          rule_type: Contains
        - inputs:
            x:
              contentId: rule_input_37
              normalizedStrSet:
              - Draganddrop
          rule_type: Contains
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_38
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_39
              normalizedStrSet:
              - ze
          rule_type: StartsWith
        - inputs:
            x:
              contentId: rule_input_40
              normalizedStrSet:
              - zebra
          rule_type: StartsWith
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_41
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_42
              normalizedStrSet:
              - he
          rule_type: Contains
        - inputs:
            x:
              contentId: rule_input_43
              normalizedStrSet:
              - hello
          rule_type: StartsWith
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_44
            html: <p>ssd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_45
              normalizedStrSet:
              - abc
          rule_type: Contains
        - inputs:
            x:
              contentId: rule_input_46
              normalizedStrSet:
              - abcd
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_47
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_48
              normalizedStrSet:
              - dog
          rule_type: StartsWith
        - inputs:
            x:
              contentId: rule_input_49
              normalizedStrSet:
              - dogs
          rule_type: Equals
        - inputs:
            x:
              contentId: rule_input_50
              normalizedStrSet:
              - beautiful
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_48
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_51
              normalizedStrSet:
              - doggies
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_34
            unicode_str: ''
        rows:
          value: 15
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 50
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        feedback_38: {}
        feedback_41: {}
        feedback_44: {}
        feedback_47: {}
        feedback_48: {}
        rule_input_36: {}
        rule_input_37: {}
        rule_input_39: {}
        rule_input_40: {}
        rule_input_42: {}
        rule_input_43: {}
        rule_input_45: {}
        rule_input_46: {}
        rule_input_48: {}
        rule_input_49: {}
        rule_input_50: {}
        rule_input_51: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        feedback_38: {}
        feedback_41: {}
        feedback_44: {}
        feedback_47: {}
        feedback_48: {}
        rule_input_36: {}
        rule_input_37: {}
        rule_input_39: {}
        rule_input_40: {}
        rule_input_42: {}
        rule_input_43: {}
        rule_input_45: {}
        rule_input_46: {}
        rule_input_48: {}
        rule_input_49: {}
        rule_input_50: {}
        rule_input_51: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_text_interac_1: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_35
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_36
              normalizedStrSet:
              - and
              - drop
          rule_type: Contains
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_38
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_39
              normalizedStrSet:
              - ze
          rule_type: StartsWith
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_41
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_42
              normalizedStrSet:
              - he
          rule_type: Contains
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_44
            html: <p>ssd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_45
              normalizedStrSet:
              - abc
          rule_type: Contains
        tagged_skill_misconception_id: null
        training_data: []
      - outcome:
          dest: Introduction
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_47
            html: <p>sd</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_48
              normalizedStrSet:
              - dog
          rule_type: StartsWith
        - inputs:
            x:
              contentId: rule_input_50
              normalizedStrSet:
              - beautiful
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_34
            unicode_str: ''
        rows:
          value: 10
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 50
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        feedback_38: {}
        feedback_41: {}
        feedback_44: {}
        feedback_47: {}
        rule_input_36: {}
        rule_input_39: {}
        rule_input_42: {}
        rule_input_45: {}
        rule_input_48: {}
        rule_input_50: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        feedback_38: {}
        feedback_41: {}
        feedback_44: {}
        feedback_47: {}
        rule_input_36: {}
        rule_input_39: {}
        rule_input_42: {}
        rule_input_45: {}
        rule_input_48: {}
        rule_input_50: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_text_interac_1)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_text_interac_1)

        sample_yaml_content_for_text_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 53
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_35
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_36
              normalizedStrSet:
              - and
              - drop
          rule_type: Contains
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_34
            unicode_str: ''
        rows:
          value: 0
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 50
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        rule_input_36: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        rule_input_36: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 52
tags: []
title: ''
""")

        latest_sample_yaml_content_for_text_interac_2: str = (
            """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: ''
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 58
states:
  Introduction:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Numeric interaction validation</p>
    interaction:
      answer_groups:
      - outcome:
          dest: end
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_35
            html: ''
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_36
              normalizedStrSet:
              - and
              - drop
          rule_type: Contains
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_34
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: end
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: <p>df</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 50
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        rule_input_36: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_34: {}
        content: {}
        default_outcome: {}
        feedback_35: {}
        rule_input_36: {}
  end:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: <p>End interaction</p>
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
states_schema_version: 53
tags: []
title: ''
""")

        exploration = exp_domain.Exploration.from_yaml(
            'eid', sample_yaml_content_for_text_interac_2)
        self.assertEqual(
            exploration.to_yaml(),
            latest_sample_yaml_content_for_text_interac_2)


class ConversionUnitTests(test_utils.GenericTestBase):
    """Test conversion methods."""

    def test_convert_exploration_to_player_dict(self) -> None:
        exp_title = 'Title'
        second_state_name = 'first state'

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title=exp_title, category='Category')
        exploration.add_states([second_state_name])

        def _get_default_state_dict(
            content_str: str,
            dest_name: str,
            is_init_state: bool
        ) -> state_domain.StateDict:
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
                        'dest_if_really_stuck': None,
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
            'correctness_feedback_enabled': True,
        })


class StateOperationsUnitTests(test_utils.GenericTestBase):
    """Test methods operating on states."""

    def test_delete_state(self) -> None:
        """Test deletion of states."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.add_states(['first state'])

        with self.assertRaisesRegex(
            ValueError, 'Cannot delete initial state'
            ):
            exploration.delete_state(exploration.init_state_name)

        exploration.add_states(['second state'])

        interaction = exploration.states['first state'].interaction

        default_outcome_for_first_state = interaction.default_outcome
        assert default_outcome_for_first_state is not None
        default_outcome_for_first_state.dest_if_really_stuck = 'second state'

        exploration.delete_state('second state')
        self.assertEqual(
            default_outcome_for_first_state.dest_if_really_stuck, 'first state')

        with self.assertRaisesRegex(ValueError, 'fake state does not exist'):
            exploration.delete_state('fake state')


class HtmlCollectionTests(test_utils.GenericTestBase):
    """Test method to obtain all html strings."""

    def test_all_html_strings_are_collected(self) -> None:

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title='title', category='category')
        exploration.add_states(['state1', 'state2', 'state3', 'state4'])
        state1 = exploration.states['state1']
        state2 = exploration.states['state2']
        state3 = exploration.states['state3']
        state4 = exploration.states['state4']
        content1_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<blockquote>Hello, this is state1</blockquote>'
        }
        content2_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<pre>Hello, this is state2</pre>'
        }
        content3_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>Hello, this is state3</p>'
        }
        content4_dict: state_domain.SubtitledHtmlDict = {
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

        customization_args_dict1: Dict[
            str, Dict[str, Union[Dict[str, str], int]]
        ] = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': 'Enter here.'
                }
            },
            'rows': {'value': 1}
        }
        customization_args_dict2: Dict[
            str, Dict[str, Union[List[Dict[str, str]], bool]]
        ] = {
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
        customization_args_dict3: Dict[
            str, Dict[str, Union[List[Dict[str, str]], int]]
        ] = {
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
        customization_args_dict4: Dict[
            str, Dict[str, Union[List[Dict[str, str]], bool]]
        ] = {
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
            'state2', None, state_domain.SubtitledHtml(
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

        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        # Ruling out the possibility of None for mypy type checking.
        assert state1.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state1.interaction.id, solution_dict)
        state1.update_interaction_solution(solution)

        state_answer_group_list2 = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'state1', None, state_domain.SubtitledHtml(
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
                    'state3', None, state_domain.SubtitledHtml(
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
                'state1', None, state_domain.SubtitledHtml(
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

        self.assertItemsEqual(set(actual_outcome_list), set(expected_html_list))


class ExplorationChangesMergeabilityUnitTests(
        exp_services_test.ExplorationServicesUnitTests,
        test_utils.EmailTestBase):
    """Test methods related to exploration changes mergeability."""

    def test_changes_are_mergeable_when_content_changes_do_not_conflict(
        self
    ) -> None:
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

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict,
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
            'old_value': test_dict
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

    def test_changes_are_not_mergeable_when_content_changes_conflict(
        self
    ) -> None:
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

    def test_changes_are_mergeable_when_interaction_id_changes_do_not_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value'],
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

        test_dict: Dict[str, str] = {}
        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': test_dict,
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
            'old_value': test_dict,
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
            'new_value': test_dict,
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
                'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
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

    def test_changes_are_not_mergeable_when_interaction_id_changes_conflict(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        test_dict: Dict[str, str] = {}
        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': test_dict,
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
            'old_value': test_dict,
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
            'new_value': test_dict,
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
            'old_value': test_dict,
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_customization_args_changes_do_not_conflict(  # pylint: disable=line-too-long
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        test_dict: Dict[str, str] = {}
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
            'old_value': ['old_value'],
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
            'new_value': test_dict,
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
            'old_value':
            {
                'requireNonnegativeInput':
                {
                    'value': True
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'requireNonnegativeInput':
                {
                    'value': False
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 3,
            'property_name': 'next_content_id_index',
            'new_value': 4,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': ['old_value'],
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
                        'dest_if_really_stuck': None,
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
            'new_value': test_dict
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
            'old_value': test_dict,
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
                'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
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
                        'dest_if_really_stuck': None,
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

    def test_changes_are_not_mergeable_when_customization_args_changes_conflict(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict,
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
            'old_value':
            {
                'requireNonnegativeInput':
                {
                    'value': True
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'requireNonnegativeInput':
                {
                    'value': False
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 3,
            'property_name': 'next_content_id_index',
            'new_value': 4,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': ['old_value'],
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
                        'dest_if_really_stuck': None,
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

    def test_changes_are_mergeable_when_answer_groups_changes_do_not_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': ['old_value'],
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict
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
            'old_value': test_dict,
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
                'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
            'state_name': 'End',
            'property_name': 'answer_groups',
            'cmd': 'edit_state_property',
            'new_value': [{
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'refresher_exploration_id': None,
                    'dest': 'End',
                    'dest_if_really_stuck': None,
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

    def test_changes_are_not_mergeable_when_answer_groups_changes_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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

    def test_changes_are_mergeable_when_solutions_changes_do_not_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict,
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
                'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
            'new_value': [{
                'outcome': {
                    'dest': 'End',
                    'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
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

    def test_changes_are_not_mergeable_when_solutions_changes_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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

    def test_changes_are_mergeable_when_hints_changes_do_not_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value']
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

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict
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
            'state_name': 'Introduction',
            'old_value':
            {
                'requireNonnegativeInput':
                {
                    'value': True
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'requireNonnegativeInput':
                {
                    'value': False
                }
            },
            'cmd': 'edit_state_property'
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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

    def test_changes_are_not_mergeable_when_hints_changes_conflict(
        self
    ) -> None:
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
            'old_value': ['old_value']
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

    def test_changes_are_mergeable_when_exploration_properties_changes_do_not_conflict(  # pylint: disable=line-too-long
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        test_dict: Dict[str, str] = {}
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
            'old_value': ['old_value']
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
            'new_value': test_dict,
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
            'old_value':
            {
                'requireNonnegativeInput':
                {
                    'value': True
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'requireNonnegativeInput':
                {
                    'value': False
                }
            },
            'cmd': 'edit_state_property'
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
                        'dest_if_really_stuck': None,
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
            'old_value': ['old_value']
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
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

    def test_changes_are_not_mergeable_when_exploration_properties_changes_conflict(  # pylint: disable=line-too-long
        self
    ) -> None:
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
            'old_value': ['old_value'],
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
            'old_value': ['old_value'],
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

    def test_changes_are_mergeable_when_translations_changes_do_not_conflict(
        self
    ) -> None:
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
                'param_changes': [],
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': ['old_value'],
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
                'dest': 'End'
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Customization Args Placeholder in First State.')
        changes_are_mergeable_3 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_5)
        self.assertEqual(changes_are_mergeable_3, True)

    def test_changes_are_not_mergeable_when_translations_changes_conflict(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # translations can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': ['old_value'],
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

    def test_changes_are_mergeable_when_voiceovers_changes_do_not_conflict(
        self
    ) -> None:
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': ['old_value'],
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

    def test_changes_are_not_mergeable_when_voiceovers_changes_conflict(
        self
    ) -> None:
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': ['old_value'],
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

    def test_changes_are_not_mergeable_when_state_added_or_deleted(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value':
            {
                'requireNonnegativeInput':
                {
                    'value': True
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'requireNonnegativeInput':
                {
                    'value': False
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': ['old_value'],
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
                        'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': 'End',
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
            'old_value': test_dict,
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
                'dest_if_really_stuck': None,
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

    def test_changes_are_not_mergeable_when_frontend_version_exceeds_backend_version(  # pylint: disable=line-too-long
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        test_dict: Dict[str, str] = {}
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
            'new_value': test_dict,
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
            'old_value': ['old_value'],
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
                        'dest_if_really_stuck': None,
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
            'old_value': ['old_value'],
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
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, end_state_name='End')

            rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

            test_dict: Dict[str, str] = {}
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
                'new_value': test_dict,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': None,
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': 'NumericInput',
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'state_name': 'Introduction',
                'old_value':
                {
                    'requireNonnegativeInput':
                    {
                        'value': True
                    }
                },
                'property_name': 'widget_customization_args',
                'new_value':
                {
                    'requireNonnegativeInput':
                    {
                        'value': False
                    }
                },
                'cmd': 'edit_state_property'
            }), exp_domain.ExplorationChange({
                'old_value': 1,
                'cmd': 'edit_state_property',
                'property_name': 'next_content_id_index',
                'new_value': 2,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': ['old_value'],
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
                            'dest_if_really_stuck': None,
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
                'old_value': ['old_value'],
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
                        'dest_if_really_stuck': None,
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
                        'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                    'dest_if_really_stuck': None,
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
                'old_value': test_dict,
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
                    'dest_if_really_stuck': None,
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
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'state_name': 'Introduction',
                'new_value': {
                    'html': '<p>Hello Aryaman!</p>',
                    'content_id': 'content'
                },
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
            }]

            expected_email_html_body = (
                '(Sent from dev-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_3_dict, 1, 3)
            )
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

    def test_email_is_sent_to_admin_in_case_of_state_renames_changes_conflict(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
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
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'state_name': 'End',
                'new_value': {
                    'html': '<p>End State Changed</p>',
                    'content_id': 'content'
                },
                'old_value': {
                    'html': 'End State',
                    'content_id': 'content'
                },
            }]
            expected_email_html_body = (
                '(Sent from dev-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_3_dict, 2, 3)
            )
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(expected_email_html_body, messages[0].html)

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
                'content_id': 'content',
                'language_code': 'de',
                'content_html': 'N/A',
                'translation_html': '<p>State 2 Content Translation.</p>',
                'data_format': 'html'
            }]
            expected_email_html_body_2 = (
                '(Sent from dev-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_4_dict, 2, 3)
            )
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 2)
            self.assertEqual(expected_email_html_body_2, messages[1].html)


class ExplorationMetadataDomainUnitTests(test_utils.GenericTestBase):

    def _require_metadata_properties_to_be_synced(self) -> None:
        """Raises error if there is a new metadata property in the Exploration
        object and it is not added in the ExplorationMetadata domain object.

        Raises:
            Exception. All the metadata properties are not synced.
        """
        exploration = exp_domain.Exploration.create_default_exploration('0')
        exploration_dict = exploration.to_dict()
        for key in exploration_dict:
            if (
                key not in constants.NON_METADATA_PROPERTIES and
                key not in constants.METADATA_PROPERTIES
            ):
                raise Exception(
                    'Looks like a new property %s was added to the Exploration'
                    ' domain object. Please include this property in '
                    'constants.METADATA_PROPERTIES if you want to use this '
                    'as a metadata property. Otherwise, add this in the '
                    'constants.NON_METADATA_PROPERTIES if you don\'t want '
                    'to use this as a metadata property.' % (key)
                )

        exploration_metadata = exploration.get_metadata()
        exploration_metadata_dict = exploration_metadata.to_dict()
        for metadata_property in constants.METADATA_PROPERTIES:
            if metadata_property not in exploration_metadata_dict:
                raise Exception(
                    'A new metadata property %s was added to the Exploration '
                    'domain object but not included in the '
                    'ExplorationMetadata domain object. Please include this '
                    'new property in the ExplorationMetadata domain object '
                    'also.' % (metadata_property)
                )

    def test_exploration_metadata_gets_created(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        exploration.update_param_specs({
            'ExampleParamOne': (
                param_domain.ParamSpec('UnicodeString').to_dict())
        })
        exploration.update_param_changes([
            param_domain.ParamChange(
                'ParamChange', 'RandomSelector', {
                    'list_of_values': ['3', '4'],
                    'parse_with_jinja': True
                }
            ),
            param_domain.ParamChange(
                'ParamChange', 'RandomSelector', {
                    'list_of_values': ['5', '6'],
                    'parse_with_jinja': True
                }
            )
        ])
        actual_metadata_dict = exp_domain.ExplorationMetadata(
            exploration.title, exploration. category, exploration.objective,
            exploration.language_code, exploration.tags, exploration.blurb,
            exploration.author_notes, exploration.states_schema_version,
            exploration.init_state_name, exploration.param_specs,
            exploration.param_changes, exploration.auto_tts_enabled,
            exploration.correctness_feedback_enabled, exploration.edits_allowed
        ).to_dict()
        expected_metadata_dict = {
            'title': exploration.title,
            'category': exploration.category,
            'objective': exploration.objective,
            'language_code': exploration.language_code,
            'tags': exploration.tags,
            'blurb': exploration.blurb,
            'author_notes': exploration.author_notes,
            'states_schema_version': exploration.states_schema_version,
            'init_state_name': exploration.init_state_name,
            'param_specs': {
                'ExampleParamOne': (
                    param_domain.ParamSpec('UnicodeString').to_dict())
            },
            'param_changes': [
                param_domain.ParamChange(
                    'ParamChange', 'RandomSelector', {
                        'list_of_values': ['3', '4'],
                        'parse_with_jinja': True
                    }
                ).to_dict(),
                param_domain.ParamChange(
                    'ParamChange', 'RandomSelector', {
                        'list_of_values': ['5', '6'],
                        'parse_with_jinja': True
                    }
                ).to_dict()
            ],
            'auto_tts_enabled': exploration.auto_tts_enabled,
            'correctness_feedback_enabled': (
                exploration.correctness_feedback_enabled),
            'edits_allowed': exploration.edits_allowed
        }

        self.assertEqual(actual_metadata_dict, expected_metadata_dict)

    def test_metadata_properties_are_synced(self) -> None:
        self._require_metadata_properties_to_be_synced()

        swapped_metadata_properties = self.swap(
            constants, 'METADATA_PROPERTIES', [
                'title', 'category', 'objective', 'language_code',
                'blurb', 'author_notes', 'states_schema_version',
                'init_state_name', 'param_specs', 'param_changes',
                'auto_tts_enabled', 'correctness_feedback_enabled',
                'edits_allowed'
            ]
        )
        error_message = (
            'Looks like a new property tags was added to the Exploration'
            ' domain object. Please include this property in '
            'constants.METADATA_PROPERTIES if you want to use this '
            'as a metadata property. Otherwise, add this in the '
            'constants.NON_METADATA_PROPERTIES if you don\'t want '
            'to use this as a metadata property.'
        )
        with swapped_metadata_properties, self.assertRaisesRegex(
            Exception, error_message
        ):
            self._require_metadata_properties_to_be_synced()

        swapped_metadata_properties = self.swap(
            constants, 'METADATA_PROPERTIES', [
                'title', 'category', 'objective', 'language_code', 'tags',
                'blurb', 'author_notes', 'states_schema_version',
                'init_state_name', 'param_specs', 'param_changes',
                'auto_tts_enabled', 'correctness_feedback_enabled',
                'edits_allowed', 'new_property'
            ]
        )
        error_message = (
            'A new metadata property %s was added to the Exploration '
            'domain object but not included in the '
            'ExplorationMetadata domain object. Please include this '
            'new property in the ExplorationMetadata domain object '
            'also.' % ('new_property')
        )
        with swapped_metadata_properties, self.assertRaisesRegex(
            Exception, error_message
        ):
            self._require_metadata_properties_to_be_synced()


class MetadataVersionHistoryDomainUnitTests(test_utils.GenericTestBase):

    def test_metadata_version_history_gets_created(self) -> None:
        expected_dict = {
            'last_edited_version_number': 1,
            'last_edited_committer_id': 'user_1'
        }
        actual_dict = exp_domain.MetadataVersionHistory(1, 'user_1').to_dict()

        self.assertEqual(expected_dict, actual_dict)

    def test_metadata_version_history_gets_created_from_dict(self) -> None:
        metadata_version_history_dict: exp_domain.MetadataVersionHistoryDict = {
            'last_edited_version_number': 1,
            'last_edited_committer_id': 'user_1'
        }
        metadata_version_history = (
            exp_domain.MetadataVersionHistory.from_dict(
                metadata_version_history_dict))

        self.assertEqual(
            metadata_version_history.last_edited_version_number,
            metadata_version_history_dict['last_edited_version_number'])
        self.assertEqual(
            metadata_version_history.last_edited_committer_id,
            metadata_version_history_dict['last_edited_committer_id'])


class ExplorationVersionHistoryUnitTests(test_utils.GenericTestBase):

    def test_exploration_version_history_gets_created(self) -> None:
        state_version_history_dict = {
            'state 1': state_domain.StateVersionHistory(
                1, 'state 1', 'user1'
            ).to_dict()
        }
        metadata_version_history = exp_domain.MetadataVersionHistory(
            None, 'user1'
        )
        expected_dict = {
            'exploration_id': 'exp_1',
            'exploration_version': 2,
            'state_version_history': state_version_history_dict,
            'metadata_version_history': metadata_version_history.to_dict(),
            'committer_ids': ['user1']
        }
        actual_dict = exp_domain.ExplorationVersionHistory(
            'exp_1', 2, state_version_history_dict,
            metadata_version_history.last_edited_version_number,
            metadata_version_history.last_edited_committer_id,
            ['user1']
        ).to_dict()

        self.assertEqual(actual_dict, expected_dict)
