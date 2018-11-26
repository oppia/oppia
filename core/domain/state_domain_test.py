# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for state domain objects and methods defined on them."""

import functools
import os

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import html_validation_service
from core.domain import state_domain
from core.tests import test_utils
import feconf
import utils


def mock_get_filename_with_dimensions(filename, unused_exp_id):
    return html_validation_service.regenerate_image_filename_using_dimensions(
        filename, 490, 120)


class StateDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on states."""

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

        state_dict_with_image_dimensions = {
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
                            u'<p><oppia-noninteractive-image '
                            'caption-with-value="&amp;quot;&amp;quot;" '
                            'filepath-with-value="&amp;quot;'
                            'random_height_490_width_120.png&amp;'
                            'quot;"></oppia-noninteractive-image>Hello this '
                            'is test case to check image tag inside p tag</p>'
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
            state_domain.State.convert_html_fields_in_state(
                state_dict,
                html_validation_service.convert_to_textangular),
            state_dict_in_textangular)

        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict,
                html_validation_service.add_caption_attr_to_image),
            state_dict_with_image_caption)

        add_dimensions_to_image_tags = functools.partial(
            html_validation_service.add_dimensions_to_image_tags,
            'eid')

        with self.swap(
            html_validation_service, 'get_filename_with_dimensions',
            mock_get_filename_with_dimensions):

            self.assertEqual(
                state_domain.State.convert_html_fields_in_state(
                    state_dict, add_dimensions_to_image_tags),
                state_dict_with_image_dimensions)

    def test_subtitled_html_validation(self):
        """Test validation of subtitled HTML."""
        subtitled_html = state_domain.SubtitledHtml('content_id', 'some html')
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

    def test_audio_translation_validation(self):
        """Test validation of audio translations."""
        audio_translation = state_domain.AudioTranslation('a.mp3', 20, True)
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
            state_domain.Solution.from_dict(
                init_state.interaction.id, solution))
        exploration.validate()

        # Add hint and delete hint.
        init_state.add_hint(state_domain.SubtitledHtml('hint_2', 'new hint'))
        self.assertEqual(
            init_state.interaction.hints[1].hint_content.html,
            'new hint')
        init_state.add_hint(
            state_domain.SubtitledHtml('hint_3', 'hint three'))
        init_state.delete_hint(1)
        init_state.update_content_ids_to_audio_translations({
            'content': {},
            'default_outcome': {},
            'hint_1': {},
            'hint_3': {},
            'solution': {}
        })
        self.assertEqual(len(init_state.interaction.hints), 2)
        exploration.validate()

    def test_solution_validation(self):
        """Test validation of state solution."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        exploration.validate()

        # Solution should be set to None as default.
        self.assertEqual(init_state.interaction.solution, None)

        init_state.add_hint(state_domain.SubtitledHtml('hint_1', {}))
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
                state_domain.Solution.from_dict(
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
            state_domain.Solution.from_dict(
                init_state.interaction.id, solution))
        init_state.update_content_ids_to_audio_translations({
            'content': {},
            'default_outcome': {},
            'hint_1': {},
            'solution': {}
        })
        exploration.validate()
