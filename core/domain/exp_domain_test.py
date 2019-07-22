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

import copy
import os
import re

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import html_validation_service
from core.domain import param_domain
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


def mock_get_filename_with_dimensions(filename, unused_exp_id):
    return html_validation_service.regenerate_image_filename_using_dimensions(
        filename, 490, 120)


class ExplorationChangeTests(test_utils.GenericTestBase):

    def test_exp_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            exp_domain.ExplorationChange({'invalid': 'data'})

    def test_exp_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            exp_domain.ExplorationChange({'cmd': 'invalid'})

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
        new_state.update_interaction_id('TextInput')

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
            r'There is no state in \[\'ABC\'\] corresponding to '
            'the exploration\'s initial state name initname.')

        # Test whether a default outcome to a non-existing state is invalid.
        exploration.states = {exploration.init_state_name: new_state}
        self._assert_validation_error(
            exploration, 'destination ABC is not a valid')

        # Restore a valid exploration.
        init_state = exploration.states[exploration.init_state_name]
        default_outcome_dict = init_state.interaction.default_outcome.to_dict()
        default_outcome_dict['dest'] = exploration.init_state_name
        init_state.update_interaction_default_outcome(default_outcome_dict)
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
                    'x': 'Test'
                },
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_misconception_id': None
        })

        init_state.update_interaction_answer_groups(old_answer_groups)

        exploration.validate()

        interaction = init_state.interaction
        answer_groups = interaction.answer_groups
        answer_group = answer_groups[0]
        answer_group.outcome.dest = 'DEF'
        self._assert_validation_error(
            exploration, 'destination DEF is not a valid')

        # Restore a valid exploration.
        exploration.states[exploration.init_state_name].update_interaction_id(
            'TextInput')
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

        rule_spec.inputs = {'x': 15}
        rule_spec.rule_type = 'Contains'
        with self.assertRaisesRegexp(
            Exception, 'Expected unicode string, received 15'
            ):
            exploration.validate()

        rule_spec.inputs = {'x': '{{ExampleParam}}'}
        self._assert_validation_error(
            exploration,
            'RuleSpec \'Contains\' has an input with name \'x\' which refers '
            'to an unknown parameter within the exploration: ExampleParam')

        # Restore a valid exploration.
        exploration.param_specs['ExampleParam'] = param_domain.ParamSpec(
            'UnicodeString')
        exploration.validate()

        # Validate Outcome.
        outcome = answer_group.outcome
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

        interaction.id = 'TextInput'
        exploration.validate()

        interaction.customization_args = []
        self._assert_validation_error(
            exploration, 'Expected customization args to be a dict')

        interaction.customization_args = {15: ''}
        self._assert_validation_error(
            exploration, 'Invalid customization arg name')

        interaction.customization_args = {'placeholder': ''}
        exploration.validate()

        interaction.answer_groups = {}
        self._assert_validation_error(
            exploration, 'Expected answer groups to be a list')

        interaction.answer_groups = answer_groups
        interaction.id = 'EndExploration'
        self._assert_validation_error(
            exploration,
            'Terminal interactions must not have a default outcome.')

        interaction.id = 'TextInput'
        init_state.update_interaction_default_outcome(None)
        self._assert_validation_error(
            exploration,
            'Non-terminal interactions must have a default outcome.')

        interaction.id = 'EndExploration'
        self._assert_validation_error(
            exploration,
            'Terminal interactions must not have any answer groups.')

        # A terminal interaction without a default outcome or answer group is
        # valid. This resets the exploration back to a valid state.
        init_state.update_interaction_answer_groups([])
        exploration.validate()

        # Restore a valid exploration.
        interaction.id = 'TextInput'
        answer_groups_list = [
            answer_group.to_dict() for answer_group in answer_groups]
        init_state.update_interaction_answer_groups(answer_groups_list)
        init_state.update_interaction_default_outcome(default_outcome.to_dict())
        exploration.validate()

        init_state.update_interaction_solution({
            'answer_is_exclusive': True,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': 'hello_world is a string'
                }
        })
        self._assert_validation_error(
            exploration,
            re.escape('Hint(s) must be specified if solution is specified'))

        interaction.solution = None
        interaction.hints = {}
        self._assert_validation_error(
            exploration, 'Expected hints to be a list')
        interaction.hints = []

        # Validate AnswerGroup.
        answer_groups_dict = {
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': 'Feedback'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': 'Test'
                },
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_misconception_id': 'invalid_tagged_misconception_id'
        }
        init_state.update_interaction_answer_groups([answer_groups_dict])

        self._assert_validation_error(
            exploration,
            'Expected tagged misconception id to be an int, received '
            'invalid_tagged_misconception_id')

        init_state.interaction.answer_groups[0].rule_specs = {}
        self._assert_validation_error(
            exploration, 'Expected answer group rules to be a list')

        init_state.interaction.answer_groups[0].tagged_misconception_id = None
        init_state.interaction.answer_groups[0].rule_specs = []
        self._assert_validation_error(
            exploration,
            'There must be at least one rule or training data for each'
            ' answer group.')

        exploration.states = {
            exploration.init_state_name: (
                state_domain.State.create_default_state(
                    exploration.init_state_name))
        }
        exploration.states[exploration.init_state_name].update_interaction_id(
            'TextInput')
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
        init_state.update_interaction_id('EndExploration')
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

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = exp_domain.Exploration.create_default_exploration('0')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = exp_domain.Exploration.create_default_exploration('a')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = exp_domain.Exploration.create_default_exploration('abcd')
        self.assertEqual(notdemo2.is_demo, False)

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

        default_outcome_dict = {
            'dest': 'DEF',
            'feedback': {
                'content_id': 'default_outcome',
                'html': '<p>Default outcome for state1</p>'
            },
            'param_changes': [],
            'labelled_as_correct': False,
            'refresher_exploration_id': 'refresher_exploration_id',
            'missing_prerequisite_skill_id': None
        }
        exploration.init_state.update_interaction_default_outcome(
            default_outcome_dict)

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

        param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'ParamChange',
            'generator_id': 'RandomSelector'
        }]

        answer_groups = [{
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': 'Feedback'
                },
                'labelled_as_correct': False,
                'param_changes': param_changes,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': 'Test'
                },
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_misconception_id': None
        }]

        exploration.init_state.update_interaction_answer_groups(answer_groups)
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
        end_state.update_interaction_id('EndExploration')
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

        (exploration.init_state.interaction.default_outcome
         .labelled_as_correct) = True

        (exploration.init_state.interaction.default_outcome
         .dest) = exploration.init_state_name

        with self.assertRaisesRegexp(
            Exception,
            'The default outcome for state Introduction is labelled '
            'correct but is a self-loop'):
            exploration.validate(strict=True)


class ExplorationSummaryTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationSummaryTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration(owner_id, exploration)
        self.exp_summary = exp_fetchers.get_exploration_summary_by_id('eid')

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


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of explorations from YAML files."""

    EXP_ID = 'An exploration_id'

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

        # Verify SAMPLE_UNTITLED_YAML_CONTENT can be converted to an exploration
        # without error.
        exp_domain.Exploration.from_untitled_yaml(
            'exp4', 'Title', 'Category', self.SAMPLE_UNTITLED_YAML_CONTENT)

        with self.assertRaises(Exception):
            exp_domain.Exploration.from_yaml('exp3', 'No_initial_state_name')

        with self.assertRaises(Exception):
            exp_domain.Exploration.from_yaml(
                'exp4', 'Invalid\ninit_state_name:\nMore stuff')

        with self.assertRaises(Exception):
            exp_domain.Exploration.from_yaml(
                'exp4', 'State1:\n(\nInvalid yaml')

        with self.assertRaisesRegexp(
            Exception, 'Expected a YAML version >= 10, received: 9'
            ):
            exp_domain.Exploration.from_yaml(
                'exp4', self.SAMPLE_UNTITLED_YAML_CONTENT)

        with self.assertRaisesRegexp(
            Exception, 'Expected a YAML version <= 9'
            ):
            exp_domain.Exploration.from_untitled_yaml(
                'exp4', 'Title', 'Category', self.SAMPLE_YAML_CONTENT)


class SchemaMigrationMethodsUnitTests(test_utils.GenericTestBase):
    """Tests the presence of appropriate schema migration methods in the
    Exploration domain object class.
    """

    def test_correct_states_schema_conversion_methods_exist(self):
        """Test that the right states schema conversion methods exist."""
        current_states_schema_version = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        for version_num in range(current_states_schema_version):
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

        for version_num in range(1, current_exp_schema_version):
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

    YAML_CONTENT_V1 = ("""default_skin: conversation_v1
param_changes: []
param_specs: {}
schema_version: 1
states:
- content:
  - type: text
    value: ''
  name: (untitled state)
  param_changes: []
  widget:
    customization_args: {}
    handlers:
    - name: submit
      rule_specs:
      - definition:
          inputs:
            x: InputString
          name: Equals
          rule_type: atomic
        dest: END
        feedback:
          - Correct!
        param_changes: []
      - definition:
          rule_type: default
        dest: (untitled state)
        feedback: []
        param_changes: []
    sticky: false
    widget_id: TextInput
- content:
  - type: text
    value: ''
  name: New state
  param_changes: []
  widget:
    customization_args: {}
    handlers:
    - name: submit
      rule_specs:
      - definition:
          rule_type: default
        dest: END
        feedback: []
        param_changes: []
    sticky: false
    widget_id: TextInput
""")

    YAML_CONTENT_V2 = ("""default_skin: conversation_v1
init_state_name: (untitled state)
param_changes: []
param_specs: {}
schema_version: 2
states:
  (untitled state):
    content:
    - type: text
      value: ''
    param_changes: []
    widget:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
  New state:
    content:
    - type: text
      value: ''
    param_changes: []
    widget:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
""")

    YAML_CONTENT_V3 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 3
skill_tags: []
states:
  (untitled state):
    content:
    - type: text
      value: ''
    param_changes: []
    widget:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
  New state:
    content:
    - type: text
      value: ''
    param_changes: []
    widget:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
""")

    YAML_CONTENT_V4 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 4
skill_tags: []
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
""")

    YAML_CONTENT_V5 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 5
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
    widget:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
tags: []
""")

    YAML_CONTENT_V6 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""")

    YAML_CONTENT_V7 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 7
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      id: EndExploration
      triggers: []
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 4
tags: []
""")

    YAML_CONTENT_V8 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 8
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      id: EndExploration
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
states_schema_version: 5
tags: []
""")

    YAML_CONTENT_V9 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 9
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      id: EndExploration
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
        language:
          value: ''
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      id: CodeRepl
    param_changes: []
states_schema_version: 6
tags: []
""")

    YAML_CONTENT_V10 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 10
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      id: EndExploration
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
states_schema_version: 7
tags: []
title: Title
""")
    YAML_CONTENT_V11 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 11
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    classifier_model_id: null
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
  END:
    classifier_model_id: null
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      id: EndExploration
    param_changes: []
  New state:
    classifier_model_id: null
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
states_schema_version: 8
tags: []
title: Title
""")
    YAML_CONTENT_V12 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 12
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    classifier_model_id: null
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
    param_changes: []
  END:
    classifier_model_id: null
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      id: EndExploration
    param_changes: []
  New state:
    classifier_model_id: null
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks:
      - outcome:
          dest: END
          feedback:
          - Correct!
      id: TextInput
    param_changes: []
states_schema_version: 9
tags: []
title: Title
""")

    YAML_CONTENT_V13 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 13
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    classifier_model_id: null
    content:
    - type: text
      value: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      hints: []
      id: TextInput
      solution: {}
    param_changes: []
  END:
    classifier_model_id: null
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      hints: []
      id: EndExploration
      solution: {}
    param_changes: []
  New state:
    classifier_model_id: null
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      hints: []
      id: TextInput
      solution: {}
    param_changes: []
states_schema_version: 10
tags: []
title: Title
""")

    YAML_CONTENT_V14 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 14
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: []
      html: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      hints: []
      id: TextInput
      solution: {}
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: []
      html: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      hints: []
      id: EndExploration
      solution: {}
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: []
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      hints: []
      id: TextInput
      solution: {}
    param_changes: []
states_schema_version: 11
tags: []
title: Title
""")

    YAML_CONTENT_V15 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 15
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      fallbacks: []
      hints: []
      id: TextInput
      solution: {}
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      fallbacks: []
      hints: []
      id: EndExploration
      solution: {}
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      hints: []
      id: TextInput
      solution: {}
    param_changes: []
states_schema_version: 12
tags: []
title: Title
""")

    YAML_CONTENT_V16 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 16
skin_customizations:
  panels_contents:
    bottom: []
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 13
tags: []
title: Title
""")

    YAML_CONTENT_V17 = ("""author_notes: ''
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 17
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 13
tags: []
title: Title
""")

    YAML_CONTENT_V18 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 18
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
          - Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback: []
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      hints:
      - hint_text: ''
      id: TextInput
      solution:
        explanation: ''
        answer_is_exclusive: False
        correct_answer: Answer
    param_changes: []
states_schema_version: 13
tags: []
title: Title
""")

    YAML_CONTENT_V19 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 19
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - correct: false
        outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 14
tags: []
title: Title
""")

    YAML_CONTENT_V20 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 20
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - labelled_as_correct: false
        outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          param_changes: []
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        param_changes: []
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 15
tags: []
title: Title
""")

    YAML_CONTENT_V21 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 21
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - labelled_as_correct: false
        outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: FractionInput
      solution: null
    param_changes: []
states_schema_version: 16
tags: []
title: Title
""")

    YAML_CONTENT_V22 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 22
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          labelled_as_correct: false
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 17
tags: []
title: Title
""")
    YAML_CONTENT_V23 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 23
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          labelled_as_correct: false
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 18
tags: []
title: Title
""")

    YAML_CONTENT_V24 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 24
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          labelled_as_correct: false
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 19
tags: []
title: Title
""")

    YAML_CONTENT_V25 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 25
states:
  (untitled state):
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            audio_translations: {}
            html: Correct!
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: (untitled state)
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  END:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: Congratulations, you have finished!
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: END
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: 20
tags: []
title: Title
""")

    YAML_CONTENT_V26 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 26
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: Correct!
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: Congratulations, you have finished!
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
states_schema_version: 21
tags: []
title: Title
""")

    YAML_CONTENT_V27 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 27
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
states_schema_version: 22
tags: []
title: Title
""")

    YAML_CONTENT_V28 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 28
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
states_schema_version: 23
tags: []
title: Title
""")

    YAML_CONTENT_V29 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 29
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
        imageAndRegions:
          value:
            imagePath: s1ImagePath.png
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
      id: ImageClickInput
      solution: null
    param_changes: []
states_schema_version: 24
tags: []
title: Title
""")

    YAML_CONTENT_V30 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 30
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
states_schema_version: 25
tags: []
title: Title
""")

    YAML_CONTENT_V31 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 31
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      new_content: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
states_schema_version: 26
tags: []
title: Title
""")

    YAML_CONTENT_V32 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 32
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
    written_translations:
      translations_mapping:
        content: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 27
tags: []
title: Title
""")

    YAML_CONTENT_V33 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 33
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
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
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 28
tags: []
title: Title
""")

    YAML_CONTENT_V34 = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 29
tags: []
title: Title
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V34

    def test_load_from_v1(self):
        """Test direct loading from a v1 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V1)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v2(self):
        """Test direct loading from a v2 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V2)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v3(self):
        """Test direct loading from a v3 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V3)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v4(self):
        """Test direct loading from a v4 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V4)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v5(self):
        """Test direct loading from a v5 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V5)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v6(self):
        """Test direct loading from a v6 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V6)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_cannot_load_from_v6_with_invalid_handler_name(self):
        invalid_yaml_content_v6 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: invalid_handler_name
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""")
        with self.assertRaisesRegexp(
            Exception,
            'Error: Can only convert rules with a name '
            '\'submit\' in states v3 to v4 conversion process. '):
            exp_domain.Exploration.from_untitled_yaml(
                'eid', 'Title', 'Category', invalid_yaml_content_v6)

    def test_cannot_load_from_v6_with_invalid_rule(self):
        invalid_yaml_content_v6 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: invalid_rule
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""")
        with self.assertRaisesRegexp(
            Exception,
            'Error: Can only convert default and atomic '
            'rules in states v3 to v4 conversion process.'):
            exp_domain.Exploration.from_untitled_yaml(
                'eid', 'Title', 'Category', invalid_yaml_content_v6)

    def test_cannot_load_from_v6_with_invalid_subject(self):
        invalid_yaml_content_v6 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
            subject: invalid_subject
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""")
        with self.assertRaisesRegexp(
            Exception,
            'Error: Can only convert rules with an \'answer\' '
            'subject in states v3 to v4 conversion process.'):
            exp_domain.Exploration.from_untitled_yaml(
                'eid', 'Title', 'Category', invalid_yaml_content_v6)

    def test_cannot_load_from_v6_with_invalid_interaction_id(self):
        invalid_yaml_content_v6 = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: invalid_id
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""")
        with self.assertRaisesRegexp(
            Exception,
            'Trying to migrate exploration containing non-existent '
            'interaction ID'):
            exp_domain.Exploration.from_untitled_yaml(
                'eid', 'Title', 'Category', invalid_yaml_content_v6)

    def test_load_from_v7(self):
        """Test direct loading from a v7 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V7)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v8(self):
        """Test direct loading from a v8 yaml file."""
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V8)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v9(self):
        """Test direct loading from a v9 yaml file."""
        latest_yaml_content = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
        language:
          value: python
        placeholder:
          value: ''
        postCode:
          value: ''
        preCode:
          value: ''
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
      id: CodeRepl
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 29
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V9)
        self.assertEqual(exploration.to_yaml(), latest_yaml_content)

    def test_load_from_v10(self):
        """Test direct loading from a v10 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V10)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v11(self):
        """Test direct loading from a v11 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V11)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v12(self):
        """Test direct loading from a v12 yaml file."""
        latest_yaml_content = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
          value: ''
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
      hints:
      - hint_content:
          content_id: hint_1
          html: <p>Correct!</p>
      id: TextInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        hint_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        hint_1: {}
states_schema_version: 29
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V12)
        self.assertEqual(exploration.to_yaml(), latest_yaml_content)

    def test_load_from_v13(self):
        """Test direct loading from a v13 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V13)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v14(self):
        """Test direct loading from a v14 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V14)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v15(self):
        """Test direct loading from a v15 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V15)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v16(self):
        """Test direct loading from a v16 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V16)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v17(self):
        """Test direct loading from a v17 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V17)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v18(self):
        """Test direct loading from a v18 yaml file."""
        latest_yaml_content = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
          value: ''
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
      hints:
      - hint_content:
          content_id: hint_1
          html: ''
      id: TextInput
      solution:
        answer_is_exclusive: false
        correct_answer: Answer
        explanation:
          content_id: solution
          html: ''
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        hint_1: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        hint_1: {}
        solution: {}
states_schema_version: 29
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V18)
        self.assertEqual(exploration.to_yaml(), latest_yaml_content)

    def test_load_from_v19(self):
        """Test direct loading from a v19 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V19)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v20(self):
        """Test direct loading from a v20 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V20)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v21(self):
        """Test direct loading from a v21 yaml file."""
        latest_yaml_content = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
        allowImproperFraction:
          value: true
        allowNonzeroIntegerPart:
          value: true
        customPlaceholder:
          value: ''
        placeholder:
          value: ''
        requireSimplestForm:
          value: false
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
      id: FractionInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 29
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V21)
        self.assertEqual(exploration.to_yaml(), latest_yaml_content)

    def test_load_from_v22(self):
        """Test direct loading from a v22 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V22)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v23(self):
        """Test direct loading from a v23 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V23)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v24(self):
        """Test direct loading from a v24 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V24)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v25(self):
        """Test direct loading from a v25 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V25)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v26(self):
        """Test direct loading from a v26 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V26)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v27(self):
        """Test direct loading from a v27 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V27)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v28(self):
        """Test direct loading from a v28 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V28)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v29(self):
        """Test direct loading from a v29 yaml file."""
        latest_yaml_content = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
        highlightRegionsOnHover:
          value: false
        imageAndRegions:
          value:
            imagePath: s1ImagePath_height_120_width_120.png
        placeholder:
          value: ''
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
      id: ImageClickInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 29
tags: []
title: Title
""")
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V29)
        self.assertEqual(exploration.to_yaml(), latest_yaml_content)

    def test_load_from_v30(self):
        """Test direct loading from a v30 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V30)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v31(self):
        """Test direct loading from a v31 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V31)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v32(self):
        """Test direct loading from a v32 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V32)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v33(self):
        """Test direct loading from a v33 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V33)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_cannot_load_from_yaml_with_no_schema_version(self):
        sample_yaml_content = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
    widget:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
tags: []
""")
        with self.assertRaisesRegexp(
            Exception, 'Invalid YAML file: no schema version specified.'):
            exp_domain.Exploration.from_untitled_yaml(
                'eid', 'Title', 'Category', sample_yaml_content)

    def test_cannot_load_from_yaml_with_invalid_schema_version(self):
        sample_yaml_content = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 0
skin_customizations:
  panels_contents: {}
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            inputs:
              x: InputString
            name: Equals
            rule_type: atomic
          dest: END
          feedback:
            - Correct!
          param_changes: []
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
    widget:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
    param_changes: []
tags: []
""")
        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1 to v%s exploration YAML files '
            'at present.' % exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION):
            exp_domain.Exploration.from_untitled_yaml(
                'eid', 'Title', 'Category', sample_yaml_content)


class HTMLMigrationUnitTests(test_utils.GenericTestBase):
    """Test HTML migration."""

    YAML_CONTENT_V26_TEXTANGULAR = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: category
correctness_feedback_enabled: false
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 26
states:
  Introduction:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: Introduction
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    param_changes: []
  state1:
    classifier_model_id: null
    content:
      content_id: content
      html: <blockquote><p>Hello, this is state1</p></blockquote>
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      solution: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: state2
        feedback:
          content_id: default_outcome
          html: Default <p>outcome</p> for state1
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution:
        answer_is_exclusive: true
        correct_answer: Answer1
        explanation:
          content_id: solution
          html: This is <i>solution</i> for state1
    param_changes: []
  state2:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Hello, </p>this <i>is </i>state2
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
      feedback_2: {}
      hint_1: {}
      hint_2: {}
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: feedback_1
            html: <div>Outcome1 for state2</div>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 0
          rule_type: Equals
        - inputs:
            x: 1
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      - outcome:
          dest: state3
          feedback:
            content_id: feedback_2
            html: <pre>Outcome2 <br>for state2</pre>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 0
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - <p>This is </p>value1 <br>for MultipleChoice
          - This is value2<span> for <br>MultipleChoice</span>
      default_outcome:
        dest: state2
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
      - hint_content:
          content_id: hint_1
          html: <p>Hello, this is<div> html1<b> for </b></div>state2</p>
      - hint_content:
          content_id: hint_2
          html: Here is link 2 <oppia-noninteractive-link
                text-with-value="&amp;quot;discussion forum&amp;quot;"
                url-with-value="&amp;quot;https://groups.google.com/
                forum/?fromgroups#!forum/oppia&amp;quot;">
                </oppia-noninteractive-link>
      id: MultipleChoiceInput
      solution: null
    param_changes: []
  state3:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Hello, this is state3</p>
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: feedback_1
            html: Here is the image1 <i><oppia-noninteractive-image
                caption-with-value="&amp;quot;&amp;quot;"
                filepath-with-value="&amp;quot;startBlue.png&amp;quot;"
                alt-with-value="&amp;quot;&amp;quot;">
                </oppia-noninteractive-image></i>Here is the image2
                <div><oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;"
                filepath-with-value="&amp;quot;startBlue.png&amp;quot;"
                alt-with-value="&amp;quot;&amp;quot;">
                </oppia-noninteractive-image></div>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - This <span>is value1 for </span>ItemSelectionInput
          rule_type: Equals
        - inputs:
            x:
            - This is value3 for ItemSelectionInput
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - This <span>is value1 for </span>ItemSelection
          - This <code>is value2</code> for ItemSelection
          - This is value3 for ItemSelection
        maxAllowableSelectionCount:
          value: 1
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: state3
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    param_changes: []
states_schema_version: 21
tags: []
title: title
""")

# pylint: disable=line-too-long
    YAML_CONTENT_V34_IMAGE_DIMENSIONS = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: category
correctness_feedback_enabled: false
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
states:
  Introduction:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: Introduction
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
  state1:
    classifier_model_id: null
    content:
      content_id: content
      html: <blockquote><p>Hello, this is state1</p></blockquote>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: state2
        feedback:
          content_id: default_outcome
          html: <p>Default </p><p>outcome</p><p> for state1</p>
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution:
        answer_is_exclusive: true
        correct_answer: Answer1
        explanation:
          content_id: solution
          html: <p>This is <em>solution</em> for state1</p>
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        solution: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        solution: {}
  state2:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Hello, </p><p>this <em>is </em>state2</p>
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: feedback_1
            html: <p>Outcome1 for state2</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 0
          rule_type: Equals
        - inputs:
            x: 1
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      - outcome:
          dest: state3
          feedback:
            content_id: feedback_2
            html: "<pre>Outcome2 \\nfor state2</pre>"
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: 0
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - <p>This is </p><p>value1 <br>for MultipleChoice</p>
          - <p>This is value2 for <br>MultipleChoice</p>
      default_outcome:
        dest: state2
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
      - hint_content:
          content_id: hint_1
          html: <p>Hello, this is</p><p> html1<strong> for </strong></p><p>state2</p>
      - hint_content:
          content_id: hint_2
          html: <p>Here is link 2 <oppia-noninteractive-link text-with-value="&amp;quot;discussion
            forum&amp;quot;" url-with-value="&amp;quot;https://groups.google.com/
            forum/?fromgroups#!forum/oppia&amp;quot;"> </oppia-noninteractive-link></p>
      id: MultipleChoiceInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
        feedback_2: {}
        hint_1: {}
        hint_2: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
        feedback_2: {}
        hint_1: {}
        hint_2: {}
  state3:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Hello, this is state3</p>
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: feedback_1
            html: <p>Here is the image1 </p><oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;"
              caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;startBlue_height_490_width_120.png&amp;quot;">
              </oppia-noninteractive-image><p>Here is the image2 </p><oppia-noninteractive-image
              alt-with-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"
              filepath-with-value="&amp;quot;startBlue_height_490_width_120.png&amp;quot;">
              </oppia-noninteractive-image>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - <p>This is value1 for ItemSelectionInput</p>
          rule_type: Equals
        - inputs:
            x:
            - <p>This is value3 for ItemSelectionInput</p>
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        choices:
          value:
          - <p>This is value1 for ItemSelection</p>
          - <p>This is value2 for ItemSelection</p>
          - <p>This is value3 for ItemSelection</p>
        maxAllowableSelectionCount:
          value: 1
        minAllowableSelectionCount:
          value: 1
      default_outcome:
        dest: state3
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: ItemSelectionInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
states_schema_version: 29
tags: []
title: title
""")

    YAML_CONTENT_V27_WITHOUT_IMAGE_CAPTION = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 27
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: <p><oppia-noninteractive-image filepath-with-value="&amp;quot;random.png&amp;quot;"></oppia-noninteractive-image>Hello this
            is test case to check image tag inside p tag</p>
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
      feedback_1: {}
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    content_ids_to_audio_translations:
      content: {}
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
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
      default_outcome: {}
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
states_schema_version: 22
tags: []
title: Title
""")

    YAML_CONTENT_V34_WITH_IMAGE_CAPTION = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 34
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: <oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;"
        filepath-with-value="&amp;quot;random_height_490_width_120.png&amp;quot;"></oppia-noninteractive-image><p>Hello
        this is test case to check image tag inside p tag</p>
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
            x: InputString
          rule_type: Equals
        tagged_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        feedback_1: {}
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
          value: ''
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
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 29
tags: []
title: Title
""")

# pylint: enable=line-too-long


    def test_load_from_v26_textangular(self):
        """Test direct loading from a v26 yaml file."""
        mock_get_filename_with_dimensions_context = self.swap(
            html_validation_service, 'get_filename_with_dimensions',
            mock_get_filename_with_dimensions)

        with mock_get_filename_with_dimensions_context:
            exploration = exp_domain.Exploration.from_yaml(
                'eid', self.YAML_CONTENT_V26_TEXTANGULAR)
        self.assertEqual(
            exploration.to_yaml(), self.YAML_CONTENT_V34_IMAGE_DIMENSIONS)


    def test_load_from_v27_without_image_caption(self):
        """Test direct loading from a v27 yaml file."""
        mock_get_filename_with_dimensions_context = self.swap(
            html_validation_service, 'get_filename_with_dimensions',
            mock_get_filename_with_dimensions)

        with mock_get_filename_with_dimensions_context:
            exploration = exp_domain.Exploration.from_yaml(
                'eid', self.YAML_CONTENT_V27_WITHOUT_IMAGE_CAPTION)
        self.assertEqual(
            exploration.to_yaml(), self.YAML_CONTENT_V34_WITH_IMAGE_CAPTION)


class ConversionUnitTests(test_utils.GenericTestBase):
    """Test conversion methods."""

    def test_convert_exploration_to_player_dict(self):
        exp_title = 'Title'
        second_state_name = 'first state'

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title=exp_title, category='Category')
        exploration.add_states([second_state_name])

        def _get_default_state_dict(content_str, dest_name):
            """Gets the default state dict of the exploration."""
            return {
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
                    feconf.DEFAULT_INIT_STATE_NAME),
                second_state_name: _get_default_state_dict(
                    '', second_state_name),
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
        state1.update_content(content1_dict)
        state2.update_content(content2_dict)
        state3.update_content(content3_dict)
        state4.update_content(content4_dict)

        state1.update_interaction_id('TextInput')
        state2.update_interaction_id('MultipleChoiceInput')
        state3.update_interaction_id('ItemSelectionInput')
        state4.update_interaction_id('DragAndDropSortInput')

        customization_args_dict1 = {
            'placeholder': {'value': ''},
            'rows': {'value': 1}
        }
        customization_args_dict2 = {
            'choices': {'value': [
                '<p>This is value1 for MultipleChoice</p>',
                '<p>This is value2 for MultipleChoice</p>'
            ]}
        }
        customization_args_dict3 = {
            'choices': {'value': [
                '<p>This is value1 for ItemSelection</p>',
                '<p>This is value2 for ItemSelection</p>',
                '<p>This is value3 for ItemSelection</p>'
            ]}
        }
        customization_args_dict4 = {
            'choices': {'value': [
                '<p>This is value1 for DragAndDropSortInput</p>',
                '<p>This is value2 for DragAndDropSortInput</p>',
            ]}
        }

        state1.update_interaction_customization_args(customization_args_dict1)
        state2.update_interaction_customization_args(customization_args_dict2)
        state3.update_interaction_customization_args(customization_args_dict3)
        state4.update_interaction_customization_args(customization_args_dict4)

        default_outcome_dict1 = {
            'dest': 'state2',
            'feedback': {
                'content_id': 'default_outcome',
                'html': '<p>Default outcome for state1</p>'
            },
            'param_changes': [],
            'labelled_as_correct': False,
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        }
        state1.update_interaction_default_outcome(default_outcome_dict1)

        hint_list2 = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }, {
            'hint_content': {
                'content_id': 'hint_2',
                'html': '<p>Hello, this is html2 for state2</p>'
            }
        }]
        state2.update_interaction_hints(hint_list2)

        solution_dict1 = {
            'interaction_id': '',
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }

        state1.update_interaction_solution(solution_dict1)

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 0}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': 1}
            }],
            'outcome': {
                'dest': 'state1',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Outcome1 for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_misconception_id': None
        }, {
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 0}
            }],
            'outcome': {
                'dest': 'state3',
                'feedback': {
                    'content_id': 'feedback_2',
                    'html': '<p>Outcome2 for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_misconception_id': None
        }]
        answer_group_list3 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value1 for ItemSelectionInput</p>'
                ]}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value3 for ItemSelectionInput</p>'
                ]}
            }],
            'outcome': {
                'dest': 'state1',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Outcome for state3</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_misconception_id': None
        }]
        state2.update_interaction_answer_groups(answer_group_list2)
        state3.update_interaction_answer_groups(answer_group_list3)

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
            '<p>This is value1 for ItemSelectionInput</p>',
            '<p>This is value3 for ItemSelectionInput</p>',
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

        self.assertEqual(actual_outcome_list, expected_html_list)
