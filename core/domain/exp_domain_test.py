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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import html_cleaner
from core.domain import param_domain
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


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
        self.exploration = exp_services.get_exploration_by_id(self.exp_id)

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
        bad_state = exp_domain.State.create_default_state('/')
        exploration.states = {'/': bad_state}
        self._assert_validation_error(
            exploration, 'Invalid character / in a state name')

        new_state = exp_domain.State.create_default_state('ABC')
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
        default_outcome = init_state.interaction.default_outcome
        default_outcome.dest = exploration.init_state_name
        exploration.validate()

        # Ensure an invalid destination can also be detected for answer groups.
        # Note: The state must keep its default_outcome, otherwise it will
        # trigger a validation error for non-terminal states needing to have a
        # default outcome. To validate the outcome of the answer group, this
        # default outcome must point to a valid state.
        init_state = exploration.states[exploration.init_state_name]
        default_outcome = init_state.interaction.default_outcome
        default_outcome.dest = exploration.init_state_name
        init_state.interaction.answer_groups.append(
            exp_domain.AnswerGroup.from_dict({
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
                'tagged_misconception_id': None
            })
        )

        init_state.update_content_ids_to_audio_translations({
            'content': {},
            'default_outcome': {},
            'feedback_1': {}
        })
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

        outcome.feedback = exp_domain.SubtitledHtml('feedback_1', {})
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
        interaction.default_outcome = None
        self._assert_validation_error(
            exploration,
            'Non-terminal interactions must have a default outcome.')

        interaction.id = 'EndExploration'
        self._assert_validation_error(
            exploration,
            'Terminal interactions must not have any answer groups.')

        # A terminal interaction without a default outcome or answer group is
        # valid. This resets the exploration back to a valid state.
        interaction.answer_groups = []
        exploration.validate()

        # Restore a valid exploration.
        interaction.id = 'TextInput'
        interaction.answer_groups = answer_groups
        interaction.default_outcome = default_outcome
        exploration.validate()

        interaction.hints = {}
        self._assert_validation_error(
            exploration, 'Expected hints to be a list')

        # Validate AnswerGroup.
        answer_group.rule_specs = {}
        self._assert_validation_error(
            exploration, 'Expected answer group rules to be a list')

        answer_group.rule_specs = []
        self._assert_validation_error(
            exploration,
            'There must be at least one rule or training data for each'
            ' answer group.')

        exploration.states = {
            exploration.init_state_name: exp_domain.State.create_default_state(
                exploration.init_state_name)
        }
        exploration.states[exploration.init_state_name].update_interaction_id(
            'TextInput')
        exploration.validate()

        exploration.language_code = 'fake_code'
        self._assert_validation_error(exploration, 'Invalid language_code')
        exploration.language_code = 'English'
        self._assert_validation_error(exploration, 'Invalid language_code')
        # TODO(sll): Remove the next two lines once the App Engine search
        # service supports 3-letter language codes.
        exploration.language_code = 'kab'
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

    def test_hints_validation(self):
        """Test validation of state hints."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        exploration.validate()

        init_state.update_interaction_hints([{
            'hint_content': {
                'content_id': 'hint_1',
                'html': 'hint one'
            },
        }])

        solution = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': 'hello_world is a string'
            },
        }

        init_state.update_content_ids_to_audio_translations({
            'content': {},
            'default_outcome': {},
            'hint_1': {},
            'solution': {}
        })

        init_state.interaction.solution = (
            exp_domain.Solution.from_dict(init_state.interaction.id, solution))
        exploration.validate()

        # Add hint and delete hint.
        init_state.add_hint(exp_domain.SubtitledHtml('hint_2', 'new hint'))
        self.assertEquals(
            init_state.interaction.hints[1].hint_content.html,
            'new hint')
        init_state.add_hint(
            exp_domain.SubtitledHtml('hint_3', 'hint three'))
        init_state.delete_hint(1)
        init_state.update_content_ids_to_audio_translations({
            'content': {},
            'default_outcome': {},
            'hint_1': {},
            'hint_3': {},
            'solution': {}
        })
        self.assertEquals(len(init_state.interaction.hints), 2)
        exploration.validate()

    def test_solution_validation(self):
        """Test validation of state solution."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        exploration.validate()

        # Solution should be set to None as default.
        self.assertEquals(init_state.interaction.solution, None)

        init_state.add_hint(exp_domain.SubtitledHtml('hint_1', {}))
        solution = {
            'answer_is_exclusive': False,
            'correct_answer': [0, 0],
            'explanation': {
                'content_id': 'solution',
                'html': 'hello_world is a string'
            }
        }

        # Object type of answer must match that of correct_answer.
        with self.assertRaises(AssertionError):
            init_state.interaction.solution = (
                exp_domain.Solution.from_dict(
                    init_state.interaction.id, solution))

        solution = {
            'answer_is_exclusive': False,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': 'hello_world is a string'
            }
        }
        init_state.interaction.solution = (
            exp_domain.Solution.from_dict(init_state.interaction.id, solution))
        init_state.update_content_ids_to_audio_translations({
            'content': {},
            'default_outcome': {},
            'hint_1': {},
            'solution': {}
        })
        exploration.validate()

    def test_tag_validation(self):
        """Test validation of exploration tags."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('EndExploration')
        init_state.interaction.default_outcome = None
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
        exploration = exp_services.get_exploration_by_id('exp_id')
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

    def test_audio_translation_validation(self):
        """Test validation of audio translations."""
        audio_translation = exp_domain.AudioTranslation('a.mp3', 20, True)
        audio_translation.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected audio filename to be a string'
            ):
            with self.swap(audio_translation, 'filename', 20):
                audio_translation.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid audio filename'
            ):
            with self.swap(audio_translation, 'filename', '.invalidext'):
                audio_translation.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid audio filename'
            ):
            with self.swap(audio_translation, 'filename', 'justanextension'):
                audio_translation.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid audio filename'
            ):
            with self.swap(audio_translation, 'filename', 'a.invalidext'):
                audio_translation.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected file size to be an int'
            ):
            with self.swap(audio_translation, 'file_size_bytes', 'abc'):
                audio_translation.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid file size'
            ):
            with self.swap(audio_translation, 'file_size_bytes', -3):
                audio_translation.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected needs_update to be a bool'
            ):
            with self.swap(audio_translation, 'needs_update', 'hello'):
                audio_translation.validate()

    def test_content_ids_to_audio_translations_validation(self):
        """Test validation of content_ids_to_audio_translations."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        exploration.validate()

        init_state.add_hint(exp_domain.SubtitledHtml('hint_1', {}))
        self._assert_validation_error(
            exploration,
            r'Expected state content_ids_to_audio_translations to have all '
            r'of the listed content ids \[\'content\', \'default_outcome\', '
            r'\'hint_1\'\]')
        init_state.add_hint(exp_domain.SubtitledHtml('hint_1', {}))
        self._assert_validation_error(
            exploration, 'Found a duplicate content id hint_1')

        init_state.interaction.hints[1].hint_content.content_id = 'hint_2'
        init_state.content_ids_to_audio_translations['hint_1'] = {}
        init_state.content_ids_to_audio_translations['hint_2'] = {}
        exploration.validate()

    def test_subtitled_html_validation(self):
        """Test validation of subtitled HTML."""
        subtitled_html = exp_domain.SubtitledHtml('content_id', 'some html')
        subtitled_html.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid content HTML'
            ):
            with self.swap(subtitled_html, 'html', 20):
                subtitled_html.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected content id to be a string, ' +
            'received 20'):
            with self.swap(subtitled_html, 'content_id', 20):
                subtitled_html.validate()


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
        old_states = exp_services.get_exploration_from_model(
            exploration_model).states
        exploration = exp_services.get_exploration_by_id(exp_id)

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


class StateExportUnitTests(test_utils.GenericTestBase):
    """Test export of states."""

    def test_export_state_to_dict(self):
        """Test exporting a state to a dict."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['New state'])

        state_dict = exploration.states['New state'].to_dict()
        expected_dict = {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': ''
            },
            'content_ids_to_audio_translations': {
                'content': {},
                'default_outcome': {}
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'New state',
                    'feedback': {
                        'content_id': 'default_outcome',
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
        self.assertEqual(expected_dict, state_dict)


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
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
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
      default_outcome:
        dest: END
        feedback: []
        param_changes: []
      fallbacks: []
      id: TextInput
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
      fallbacks: []
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
      hints: []
      id: TextInput
      solution: null
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
      id: TextInput
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
states_schema_version: 24
tags: []
title: Title
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V29

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
        exploration = exp_domain.Exploration.from_untitled_yaml(
            'eid', 'Title', 'Category', self.YAML_CONTENT_V9)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

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
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V12)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

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
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V18)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

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
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V21)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

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
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V29)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)


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
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: outcome
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
            content_id: outcome
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
          content_id: hints
          html: <p>Hello, this is<div> html1<b> for </b></div>state2</p>
      - hint_content:
          content_id: hints
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
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: outcome
            html: Here is the image1 <i><oppia-noninteractive-image
                filepath-with-value="amp;quot;startBlue.png&amp;quot;">
                </oppia-noninteractive-image></i>Here is the image2
                <div><oppia-noninteractive-image filepath-with-value="
                amp;quot;startBlue.png&amp;quot;">
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
    YAML_CONTENT_V29_CKEDITOR = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: category
correctness_feedback_enabled: false
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 29
states:
  Introduction:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    content_ids_to_audio_translations:
      content: {}
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
  state2:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Hello, </p><p>this <em>is </em>state2</p>
    content_ids_to_audio_translations:
      content: {}
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: outcome
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
            content_id: outcome
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
          content_id: hints
          html: <p>Hello, this is</p><p> html1<strong> for </strong></p><p>state2</p>
      - hint_content:
          content_id: hints
          html: <p>Here is link 2 <oppia-noninteractive-link text-with-value="&amp;quot;discussion
            forum&amp;quot;" url-with-value="&amp;quot;https://groups.google.com/
            forum/?fromgroups#!forum/oppia&amp;quot;"> </oppia-noninteractive-link></p>
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
    interaction:
      answer_groups:
      - outcome:
          dest: state1
          feedback:
            content_id: outcome
            html: <p>Here is the image1 </p><oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;"
              filepath-with-value="amp;quot;startBlue.png&amp;quot;"> </oppia-noninteractive-image><p>Here
              is the image2 </p><oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;"
              filepath-with-value=" amp;quot;startBlue.png&amp;quot;"> </oppia-noninteractive-image>
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
states_schema_version: 24
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
      html: <p><oppia-noninteractive-image filepath-with-value="&amp;quot;random.png
            &amp;quot;"></oppia-noninteractive-image>Hello this
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

    YAML_CONTENT_V29_WITH_IMAGE_CAPTION = ("""author_notes: ''
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
      html: <oppia-noninteractive-image caption-with-value="&amp;quot;&amp;quot;"
        filepath-with-value="&amp;quot;random.png &amp;quot;"></oppia-noninteractive-image><p>Hello
        this is test case to check image tag inside p tag</p>
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
states_schema_version: 24
tags: []
title: Title
""")
# pylint: enable=line-too-long

    def test_load_from_v26_textangular(self):
        """Test direct loading from a v26 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V26_TEXTANGULAR)
        self.assertEqual(exploration.to_yaml(), self.YAML_CONTENT_V29_CKEDITOR)

    def test_load_from_v27_without_image_caption(self):
        """Test direct loading from a v27 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', self.YAML_CONTENT_V27_WITHOUT_IMAGE_CAPTION)
        self.assertEqual(
            exploration.to_yaml(), self.YAML_CONTENT_V29_WITH_IMAGE_CAPTION)


class ConversionUnitTests(test_utils.GenericTestBase):
    """Test conversion methods."""

    def test_convert_exploration_to_player_dict(self):
        exp_title = 'Title'
        second_state_name = 'first state'

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title=exp_title, category='Category')
        exploration.add_states([second_state_name])

        def _get_default_state_dict(content_str, dest_name):
            return {
                'classifier_model_id': None,
                'content': {
                    'content_id': 'content',
                    'html': content_str,
                },
                'content_ids_to_audio_translations': {
                    'content': {},
                    'default_outcome': {}
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

    def test_can_undergo_classification(self):
        """Test the can_undergo_classification() function."""
        exploration_id = 'eid'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
            assets_list)

        exploration = exp_services.get_exploration_by_id(exploration_id)
        state_with_training_data = exploration.states['Home']
        state_without_training_data = exploration.states['End']

        # A state with 786 training examples.
        self.assertTrue(
            state_with_training_data.can_undergo_classification())

        # A state with no training examples.
        self.assertFalse(
            state_without_training_data.can_undergo_classification())

    def test_get_training_data(self):
        """Test retrieval of training data."""
        exploration_id = 'eid'
        test_exp_filepath = os.path.join(
            feconf.SAMPLE_EXPLORATIONS_DIR, 'classifier_demo_exploration.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
            assets_list)

        exploration = exp_services.get_exploration_by_id(exploration_id)
        state = exploration.states['text']

        expected_training_data = [{
            'answer_group_index': 1,
            'answers': [u'cheerful', u'merry', u'ecstatic', u'glad',
                        u'overjoyed', u'pleased', u'thrilled', u'smile']}]

        observed_training_data = state.get_training_data()

        self.assertEqual(observed_training_data, expected_training_data)

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

    def test_state_operations(self):
        """Test adding, updating and checking existence of states."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        self.assertNotIn('invalid_state_name', exploration.states)

        self.assertEqual(len(exploration.states), 1)

        default_state_name = exploration.init_state_name
        exploration.rename_state(default_state_name, 'Renamed state')
        self.assertEqual(len(exploration.states), 1)
        self.assertEqual(exploration.init_state_name, 'Renamed state')

        # Add a new state.
        exploration.add_states(['State 2'])
        self.assertEqual(len(exploration.states), 2)

        # It is OK to rename a state to the same name.
        exploration.rename_state('State 2', 'State 2')

        # But it is not OK to add or rename a state using a name that already
        # exists.
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exploration.add_states(['State 2'])
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exploration.rename_state('State 2', 'Renamed state')

        # And it is OK to rename a state to 'END' (old terminal pseudostate). It
        # is tested throughout this test because a lot of old behavior used to
        # be specific to states named 'END'. These tests validate that is no
        # longer the situation.
        exploration.rename_state('State 2', 'END')

        # Should successfully be able to name it back.
        exploration.rename_state('END', 'State 2')

        # The exploration now has exactly two states.
        self.assertNotIn(default_state_name, exploration.states)
        self.assertIn('Renamed state', exploration.states)
        self.assertIn('State 2', exploration.states)

        # Can successfully add 'END' state.
        exploration.add_states(['END'])

        # Should fail to rename like any other state.
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exploration.rename_state('State 2', 'END')

        # Ensure the other states are connected to END.
        exploration.states[
            'Renamed state'].interaction.default_outcome.dest = 'State 2'
        exploration.states['State 2'].interaction.default_outcome.dest = 'END'

        # Ensure the other states have interactions.
        exploration.states['Renamed state'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')

        # Other miscellaneous requirements for validation.
        exploration.title = 'Title'
        exploration.category = 'Category'
        exploration.objective = 'Objective'

        # The exploration should NOT be terminable even though it has a state
        # called 'END' and everything else is connected to it.
        with self.assertRaises(Exception):
            exploration.validate(strict=True)

        # Renaming the node to something other than 'END' and giving it an
        # EndExploration is enough to validate it, though it cannot have a
        # default outcome or answer groups.
        exploration.rename_state('END', 'AnotherEnd')
        another_end_state = exploration.states['AnotherEnd']
        another_end_state.update_interaction_id('EndExploration')
        another_end_state.interaction.default_outcome = None
        exploration.validate(strict=True)

        # Name it back for final tests.
        exploration.rename_state('AnotherEnd', 'END')

        # Should be able to successfully delete it.
        exploration.delete_state('END')
        self.assertNotIn('END', exploration.states)

    def test_convert_html_fields_in_state(self):
        """Test conversion of html strings in state."""
        state_dict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [], 'feedback': {
                        'content_id': 'default_outcome', 'html': (
                            '<p><oppia-noninteractive-image filepath'
                            '-with-value="&amp;quot;random.png&amp;'
                            'quot;"></oppia-noninteractive-image>'
                            'Hello this is test case to check '
                            'image tag inside p tag</p>'
                        )
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {},
                'confirmed_unclassified_answers': [],
                'id': None,
                'hints': []
            }
        }

        state_dict_in_textangular = {
            'content': {
                'content_id': 'content', 'html': '<p>Hello!</p>'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [], 'feedback': {
                        'content_id': 'default_outcome', 'html': (
                            '<p><oppia-noninteractive-image filepath'
                            '-with-value="&amp;quot;random.png&amp;'
                            'quot;"></oppia-noninteractive-image>'
                            'Hello this is test case to check '
                            'image tag inside p tag</p>'
                        )
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {},
                'confirmed_unclassified_answers': [],
                'id': None,
                'hints': []
            }
        }

        state_dict_with_image_caption = {
            'content': {
                'content_id': 'content', 'html': '<p>Hello!</p>'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [], 'feedback': {
                        'content_id': 'default_outcome', 'html': (
                            '<p><oppia-noninteractive-image caption-'
                            'with-value="&amp;quot;&amp;quot;" filepath'
                            '-with-value="&amp;quot;random.png&amp;'
                            'quot;"></oppia-noninteractive-image>'
                            'Hello this is test case to check '
                            'image tag inside p tag</p>'
                        )
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {},
                'confirmed_unclassified_answers': [],
                'id': None,
                'hints': []
            }
        }

        self.assertEqual(
            exp_domain.State.convert_html_fields_in_state(
                state_dict,
                html_cleaner.convert_to_textangular),
            state_dict_in_textangular)

        self.assertEqual(
            exp_domain.State.convert_html_fields_in_state(
                state_dict,
                html_cleaner.add_caption_attr_to_image),
            state_dict_with_image_caption)


class StateIdMappingTests(test_utils.GenericTestBase):
    """Tests for StateIdMapping domain class."""

    EXP_ID = 'eid'

    EXPLORATION_CONTENT_1 = ("""default_skin: conversation_v1
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

    EXPLORATION_CONTENT_2 = ("""default_skin: conversation_v1
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
        dest: New state
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
        dest: New state
        feedback: []
        param_changes: []
    sticky: false
    widget_id: TextInput
""")

    def setUp(self):
        """Initialize owner and store default exploration before each
        test case.
        """
        super(StateIdMappingTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a default exploration.
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            self.exploration = self.save_new_valid_exploration(
                self.EXP_ID, self.owner_id)

        self.mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, self.exploration.version)

    def test_that_correct_mapping_is_stored_for_new_exp(self):
        """Test that initial state id mapping is correct."""
        expected_mapping = {
            self.exploration.init_state_name: 0
        }

        self.assertEqual(self.mapping.exploration_id, self.EXP_ID)
        self.assertEqual(self.mapping.exploration_version, 1)
        self.assertEqual(
            self.mapping.largest_state_id_used, 0)
        self.assertDictEqual(self.mapping.state_names_to_ids, expected_mapping)

    def test_that_mapping_remains_same_when_exp_params_changes(self):
        """Test that state id mapping is unchanged when exploration params are
        changed.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title'
                })], 'Changes.')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 0)

    def test_that_mapping_is_correct_when_new_state_is_added(self):
        """Test that new state id is added in state id mapping when new state is
        added in exploration.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                })], 'Add state name')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0,
            'new state': 1
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 1)

    def test_that_mapping_is_correct_when_old_state_is_deleted(self):
        """Test that state id is removed from state id mapping when the
        state is removed from exploration.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                })], 'Add state name')

            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_DELETE_STATE,
                    'state_name': 'new state',
                })], 'delete state')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 1)

    def test_that_mapping_remains_when_state_is_renamed(self):
        """Test that state id mapping is changed accordingly when a state
        is renamed in exploration.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                })], 'Add state name')

            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': 'new state',
                    'new_state_name': 'state',
                })], 'Change state name')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0,
            'state': 1
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 1)

    def test_that_mapping_is_changed_when_interaction_id_is_changed(self):
        """Test that state id mapping is changed accordingly when interaction
        id of state is changed.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': self.exploration.init_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput'
                })], 'Update interaction.')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 1,
        }

        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 1)

    def test_that_mapping_is_correct_for_series_of_changes(self):
        """Test that state id mapping is changed accordingly for series
        of add, rename, remove and update state changes.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': 'new state',
                    'new_state_name': 'state'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'extra state'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'state',
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'extra state',
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'TextInput'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'new state',
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'TextInput'
                })], 'Heavy changes')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0,
            'extra state': 1,
            'new state': 2,
            'state': 3,
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 3)

        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_DELETE_STATE,
                    'state_name': 'state',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': 'extra state',
                    'new_state_name': 'state'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'state',
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'extra state'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'extra state',
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'TextInput'
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': 'new state',
                    'new_state_name': 'other state'
                })], 'Heavy changes 2')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0,
            'other state': 2,
            'extra state': 4,
            'state': 5
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertDictEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 5)

    def test_correct_mapping_is_generated_for_exp_with_old_states_schema(self):
        """Test that correct state id mapping is generated for explorations
        having old states schema version.
        """

        # Make sure that END is present in generated state id mapping if
        # exploration contains rules which have END as their destination state
        # but exploration itself does not have END state.
        exploration = exp_domain.Exploration.from_untitled_yaml(
            self.EXP_ID, 'Title', 'Category', self.EXPLORATION_CONTENT_1)
        expected_mapping = {
            '(untitled state)': 0,
            'New state': 1,
            'END': 2
        }
        state_id_map = (
            exp_domain.StateIdMapping.create_mapping_for_new_exploration(
                exploration))
        self.assertDictEqual(state_id_map.state_names_to_ids, expected_mapping)
        self.assertEqual(state_id_map.largest_state_id_used, 2)

    def test_mapping_for_exp_with_no_end_reference(self):
        """Test that correct mapping is generated when old exploration has
        END state references but new exploration does not have END
        references.
        """

        old_exploration = exp_domain.Exploration.from_untitled_yaml(
            self.EXP_ID, 'Title', 'Category', self.EXPLORATION_CONTENT_1)
        state_id_map = (
            exp_domain.StateIdMapping.create_mapping_for_new_exploration(
                old_exploration))

        # Make sure that END is not present in generated state id mapping, even
        # though END state may be present in state id mapping of previous
        # version, if exploration does not contain any rule which has END
        # as its destination state.
        new_exploration = exp_domain.Exploration.from_untitled_yaml(
            self.EXP_ID, 'Title', 'Category', self.EXPLORATION_CONTENT_2)
        expected_mapping = {
            '(untitled state)': 0,
            'New state': 1
        }
        state_id_map = state_id_map.create_mapping_for_new_version(
            old_exploration, new_exploration, [])
        self.assertDictEqual(
            state_id_map.state_names_to_ids, expected_mapping)
        self.assertEqual(state_id_map.largest_state_id_used, 2)

    def test_mapping_for_exploration_with_end_references(self):
        """Test that correct mapping is generated when old exploration does not
        have END state reference but new exploration does.
        """

        old_exploration = exp_domain.Exploration.from_untitled_yaml(
            self.EXP_ID, 'Title', 'Category', self.EXPLORATION_CONTENT_2)
        state_id_map = (
            exp_domain.StateIdMapping.create_mapping_for_new_exploration(
                old_exploration))

        # Make sure that END is not present in generated state id mapping, even
        # though END state may be present in state id mapping of previous
        # version, if exploration does not contain any rule which has END
        # as its destination state.
        new_exploration = exp_domain.Exploration.from_untitled_yaml(
            self.EXP_ID, 'Title', 'Category', self.EXPLORATION_CONTENT_1)
        expected_mapping = {
            '(untitled state)': 0,
            'New state': 1,
            'END': 2
        }
        state_id_map = state_id_map.create_mapping_for_new_version(
            old_exploration, new_exploration, [])
        self.assertDictEqual(
            state_id_map.state_names_to_ids, expected_mapping)
        self.assertEqual(state_id_map.largest_state_id_used, 2)

    def test_validation(self):
        """Test validation checks for state id mapping domain object."""

        state_names_to_ids = {
            'first': 0,
            'second': 0
        }
        largest_state_id_used = 0
        state_id_mapping = exp_domain.StateIdMapping(
            'exp_id', 0, state_names_to_ids, largest_state_id_used)
        with self.assertRaisesRegexp(
            Exception, 'Assigned state ids should be unique.'):
            state_id_mapping.validate()

        state_names_to_ids = {
            'first': 0,
            'second': 1
        }
        largest_state_id_used = 0
        state_id_mapping = exp_domain.StateIdMapping(
            'exp_id', 0, state_names_to_ids, largest_state_id_used)
        with self.assertRaisesRegexp(
            Exception,
            'Assigned state ids should be smaller than last state id used.'):
            state_id_mapping.validate()

        state_names_to_ids = {
            'first': 0,
            'second': None
        }
        largest_state_id_used = 0
        state_id_mapping = exp_domain.StateIdMapping(
            'exp_id', 0, state_names_to_ids, largest_state_id_used)
        with self.assertRaisesRegexp(
            Exception, 'Assigned state ids should be integer values'):
            state_id_mapping.validate()


class HtmlCollectionTests(test_utils.GenericTestBase):
    """Test method to obtain all html strings."""

    def test_all_html_strings_are_collected(self):

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title='title', category='category')
        exploration.add_states(['state1', 'state2', 'state3'])
        state1 = exploration.states['state1']
        state2 = exploration.states['state2']
        state3 = exploration.states['state3']
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
        state1.update_content(content1_dict)
        state2.update_content(content2_dict)
        state3.update_content(content3_dict)

        state1.update_interaction_id('TextInput')
        state2.update_interaction_id('MultipleChoiceInput')
        state3.update_interaction_id('ItemSelectionInput')

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
        state1.update_interaction_customization_args(customization_args_dict1)
        state2.update_interaction_customization_args(customization_args_dict2)
        state3.update_interaction_customization_args(customization_args_dict3)

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
            '<p>This is value3 for ItemSelection</p>'
        ]

        actual_outcome_list = exploration.get_all_html_content_strings()

        self.assertEqual(actual_outcome_list, expected_html_list)
