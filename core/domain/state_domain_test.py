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
import logging
import os
import re

from core.domain import exp_domain
from core.domain import exp_fetchers
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
            }
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

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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
        another_end_state.update_interaction_default_outcome(None)
        exploration.validate(strict=True)

        # Name it back for final tests.
        exploration.rename_state('AnotherEnd', 'END')

        # Should be able to successfully delete it.
        exploration.delete_state('END')
        self.assertNotIn('END', exploration.states)

    def test_update_solicit_answer_details(self):
        """Test updating solicit_answer_details."""
        state = state_domain.State.create_default_state('state_1')
        self.assertEqual(state.solicit_answer_details, False)
        state.update_solicit_answer_details(True)
        self.assertEqual(state.solicit_answer_details, True)

    def test_update_solicit_answer_details_with_non_bool_fails(self):
        """Test updating solicit_answer_details with non bool value."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, False)
        with self.assertRaisesRegexp(Exception, (
            'Expected solicit_answer_details to be a boolean, received')):
            init_state.update_solicit_answer_details('abc')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, False)

    def test_convert_html_fields_in_state(self):
        """Test conversion of html strings in state."""
        state_dict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
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
            'solicit_answer_details': False,
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
            'solicit_answer_details': False,
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
            'solicit_answer_details': False,
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

    def test_subtitled_html_validation_with_invalid_html_type(self):
        """Test validation of subtitled HTML with invalid html type."""
        subtitled_html = state_domain.SubtitledHtml(
            'content_id', '<p>some html</p>')
        subtitled_html.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid content HTML'
            ):
            with self.swap(subtitled_html, 'html', 20):
                subtitled_html.validate()

    def test_subtitled_html_validation_with_invalid_content(self):
        """Test validation of subtitled HTML with invalid content."""
        subtitled_html = state_domain.SubtitledHtml(
            'content_id', '<p>some html</p>')
        subtitled_html.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected content id to be a string, ' +
            'received 20'):
            with self.swap(subtitled_html, 'content_id', 20):
                subtitled_html.validate()

    def test_voiceover_validation(self):
        """Test validation of voiceover."""
        audio_voiceover = state_domain.Voiceover('a.mp3', 20, True)
        audio_voiceover.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected audio filename to be a string'
            ):
            with self.swap(audio_voiceover, 'filename', 20):
                audio_voiceover.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid audio filename'
            ):
            with self.swap(audio_voiceover, 'filename', '.invalidext'):
                audio_voiceover.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid audio filename'
            ):
            with self.swap(audio_voiceover, 'filename', 'justanextension'):
                audio_voiceover.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid audio filename'
            ):
            with self.swap(audio_voiceover, 'filename', 'a.invalidext'):
                audio_voiceover.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected file size to be an int'
            ):
            with self.swap(audio_voiceover, 'file_size_bytes', 'abc'):
                audio_voiceover.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid file size'
            ):
            with self.swap(audio_voiceover, 'file_size_bytes', -3):
                audio_voiceover.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected needs_update to be a bool'
            ):
            with self.swap(audio_voiceover, 'needs_update', 'hello'):
                audio_voiceover.validate()

    def test_written_translation_validation(self):
        """Test validation of translation script."""
        written_translation = state_domain.WrittenTranslation('Test.', True)
        written_translation.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid content HTML'):
            with self.swap(written_translation, 'html', 30):
                written_translation.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected needs_update to be a bool'
            ):
            with self.swap(written_translation, 'needs_update', 20):
                written_translation.validate()

    def test_hints_validation(self):
        """Test validation of state hints."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        exploration.validate()

        hints_list = []
        hints_list.append({
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>hint one</p>'
            },
        })
        init_state.update_interaction_hints(hints_list)

        solution = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }

        init_state.update_interaction_solution(solution)
        exploration.validate()

        hints_list.append({
            'hint_content': {
                'content_id': 'hint_2',
                'html': '<p>new hint</p>'
            }
        })
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            init_state.interaction.hints[1].hint_content.html,
            '<p>new hint</p>')

        hints_list.append({
            'hint_content': {
                'content_id': 'hint_3',
                'html': '<p>hint three</p>'
            }
        })
        init_state.update_interaction_hints(hints_list)

        del hints_list[1]
        init_state.update_interaction_hints(hints_list)

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

        hints_list = []
        hints_list.append({
            'hint_content': {
                'content_id': 'hint_1',
                'html': ''
            },
        })
        init_state.update_interaction_hints(hints_list)
        solution = {
            'answer_is_exclusive': False,
            'correct_answer': [0, 0],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
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
                'html': '<p>hello_world is a string</p>'
            }
        }
        init_state.update_interaction_solution(solution)
        exploration.validate()

    def test_validate_state_solicit_answer_details(self):
        """Test validation of solicit_answer_details."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, False)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected solicit_answer_details to be ' +
            'a boolean, received'):
            with self.swap(init_state, 'solicit_answer_details', 'abc'):
                exploration.validate()
        self.assertEqual(init_state.solicit_answer_details, False)
        init_state.update_interaction_id('Continue')
        self.assertEqual(init_state.interaction.id, 'Continue')
        exploration.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'The Continue interaction does not ' +
            'support soliciting answer details from learners.'):
            with self.swap(init_state, 'solicit_answer_details', True):
                exploration.validate()
        init_state.update_interaction_id('TextInput')
        self.assertEqual(init_state.interaction.id, 'TextInput')
        self.assertEqual(init_state.solicit_answer_details, False)
        exploration.validate()
        init_state.solicit_answer_details = True
        self.assertEqual(init_state.solicit_answer_details, True)
        exploration.validate()
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, True)

    def test_validate_solution_answer_is_exclusive(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        # Solution should be set to None as default.
        self.assertEqual(exploration.init_state.interaction.solution, None)

        hints_list = []
        solution = {
            'answer_is_exclusive': False,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        hints_list.append({
            'hint_content': {
                'content_id': 'hint_1',
                'html': ''
            },
        })
        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(solution)
        exploration.validate()

        solution = {
            'answer_is_exclusive': 1,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }

        exploration.init_state.update_interaction_solution(solution)
        with self.assertRaisesRegexp(
            Exception, 'Expected answer_is_exclusive to be bool, received 1'):
            exploration.validate()

    def test_validate_non_list_param_changes(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        exploration.init_state.param_changes = 0

        with self.assertRaisesRegexp(
            Exception, 'Expected state param_changes to be a list, received 0'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_answer_groups(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        answer_group_dict = {
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
        }

        exploration.init_state.update_interaction_answer_groups(
            [answer_group_dict])
        exploration.init_state.update_content({
            'content_id': 'feedback_1',
            'html': '<p>Feedback</p>'
        })

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id feedback_1'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_default_outcome(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        default_outcome_dict = {
            'dest': 'Introduction',
            'feedback': {
                'content_id': 'default_outcome',
                'html': ''},
            'labelled_as_correct': False,
            'missing_prerequisite_skill_id': None,
            'param_changes': [],
            'refresher_exploration_id': None
        }

        exploration.init_state.update_interaction_default_outcome(
            default_outcome_dict)
        exploration.init_state.update_content({
            'content_id': 'default_outcome',
            'html': ''
        })

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id default_outcome'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_hints(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>some html</p>'
            }
        }]

        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_content({
            'content_id': 'hint_1',
            'html': ''
        })

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id hint_1'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_solution(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        subtitled_html = state_domain.SubtitledHtml('content_id', 'some html')

        hints_list = [state_domain.Hint(subtitled_html)]

        exploration.init_state.interaction.hints = hints_list
        solution = {
            'answer_is_exclusive': True,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }

        exploration.init_state.update_interaction_solution(solution)
        exploration.init_state.update_content({
            'content_id': 'solution',
            'html': ''
        })

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id solution'):
            exploration.init_state.validate(None, True)

    def test_cannot_convert_state_dict_to_yaml_with_invalid_state_dict(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'info', _mock_logging_function)
        invalid_state_dict_assert_raises = self.assertRaisesRegexp(
            Exception, 'Could not convert state dict to YAML')

        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with logging_swap, invalid_state_dict_assert_raises:
            exploration.init_state.convert_state_dict_to_yaml(
                'invalid_state_dict', 10)

        self.assertEqual(
            observed_log_messages, ['Bad state dict: invalid_state_dict'])

    def test_cannot_update_hints_with_content_id_not_in_written_translations(
            self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        old_hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]
        new_hints_list = [{
            'hint_content': {
                'content_id': 'hint_2',
                'html': '<p>Hello, this is html2 for state2</p>'
            }
        }]

        exploration.init_state.update_interaction_hints(old_hints_list)

        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'html': '<p>Test!</p>',
                        'needs_update': True
                    }
                },
                'default_outcome': {}
            }
        }
        written_translations = (
            state_domain.WrittenTranslations.from_dict(
                written_translations_dict))

        exploration.init_state.update_written_translations(written_translations)

        with self.assertRaisesRegexp(
            Exception,
            'The content_id hint_1 does not exist in written_translations'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_hints_with_content_id_not_in_recorded_voiceovers(
            self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        old_hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]
        new_hints_list = [{
            'hint_content': {
                'content_id': 'hint_2',
                'html': '<p>Hello, this is html2 for state2</p>'
            }
        }]

        exploration.init_state.update_interaction_hints(old_hints_list)

        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False
                    }
                },
                'default_outcome': {}
            }
        }
        recorded_voiceovers = (
            state_domain.RecordedVoiceovers.from_dict(recorded_voiceovers_dict))

        exploration.init_state.update_recorded_voiceovers(recorded_voiceovers)

        with self.assertRaisesRegexp(
            Exception,
            'The content_id hint_1 does not exist in recorded_voiceovers'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_hints_with_new_content_id_in_written_translations(
            self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        old_hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]
        new_hints_list = [{
            'hint_content': {
                'content_id': 'hint_2',
                'html': '<p>Hello, this is html2 for state2</p>'
            }
        }]

        exploration.init_state.update_interaction_hints(old_hints_list)

        written_translations_dict = {
            'translations_mapping': {
                'hint_2': {
                    'hi': {
                        'html': '<p>Test!</p>',
                        'needs_update': True
                    }
                },
                'hint_1': {
                    'hi': {
                        'html': '<p>Test1!</p>',
                        'needs_update': True
                    }
                },
                'default_outcome': {}
            }
        }
        written_translations = (
            state_domain.WrittenTranslations.from_dict(
                written_translations_dict))

        exploration.init_state.update_written_translations(written_translations)

        with self.assertRaisesRegexp(
            Exception,
            'The content_id hint_2 already exists in written_translations'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_hints_with_new_content_id_in_recorded_voiceovers(
            self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        old_hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]
        new_hints_list = [{
            'hint_content': {
                'content_id': 'hint_2',
                'html': '<p>Hello, this is html2 for state2</p>'
            }
        }]

        exploration.init_state.update_interaction_hints(old_hints_list)

        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'hint_1': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False
                    }
                },
                'hint_2': {
                    'en': {
                        'filename': 'filename4.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False
                    }
                },
                'default_outcome': {}
            }
        }
        recorded_voiceovers = (
            state_domain.RecordedVoiceovers.from_dict(recorded_voiceovers_dict))

        exploration.init_state.update_recorded_voiceovers(recorded_voiceovers)

        with self.assertRaisesRegexp(
            Exception,
            'The content_id hint_2 already exists in recorded_voiceovers'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_interaction_solution_with_non_dict_solution(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]
        solution = {
            'answer_is_exclusive': True,
            'correct_answer': u'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': u'<p>hello_world is a string</p>'
            }
        }

        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(solution)

        self.assertEqual(
            exploration.init_state.interaction.solution.to_dict(), solution)

        with self.assertRaisesRegexp(
            Exception, 'Expected solution to be a dict'):
            exploration.init_state.update_interaction_solution([])

    def test_update_interaction_solution_with_no_solution(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        hints_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]

        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(None)

        self.assertIsNone(exploration.init_state.interaction.solution)

    def test_cannot_update_interaction_hints_with_non_list_hints(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegexp(
            Exception, 'Expected hints_list to be a list'):
            exploration.init_state.update_interaction_hints({})

    def test_cannot_update_non_list_interaction_confirmed_unclassified_answers(
            self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegexp(
            Exception, 'Expected confirmed_unclassified_answers to be a list'):
            (
                exploration.init_state
                .update_interaction_confirmed_unclassified_answers({}))

    def test_update_interaction_confirmed_unclassified_answers(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        answer_groups_list = [{
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
        }]

        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            [])

        (
            exploration.init_state
            .update_interaction_confirmed_unclassified_answers(
                answer_groups_list)
        )

        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            answer_groups_list)

    def test_cannot_update_non_dict_interaction_default_outcome(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegexp(
            Exception, 'Expected default_outcome_dict to be a dict'):
            exploration.init_state.update_interaction_default_outcome(
                'invalid_default_outcome')

    def test_cannot_update_non_list_interaction_answer_groups(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegexp(
            Exception, 'Expected interaction_answer_groups to be a list'):
            exploration.init_state.update_interaction_answer_groups(
                'invalid_answer_groups')

    def test_cannot_update_answer_groups_with_non_dict_rule_inputs(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        answer_groups_list = [{
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
                'inputs': [],
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_misconception_id': None
        }]

        with self.assertRaisesRegexp(
            Exception, 'Expected rule_inputs to be a dict'):
            exploration.init_state.update_interaction_answer_groups(
                answer_groups_list)

    def test_cannot_update_answer_groups_with_non_list_rule_specs(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        answer_groups_list = [{
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
            'rule_specs': {},
            'training_data': [],
            'tagged_misconception_id': None
        }]

        with self.assertRaisesRegexp(
            Exception, 'Expected answer group rule specs to be a list'):
            exploration.init_state.update_interaction_answer_groups(
                answer_groups_list)

    def test_cannot_update_answer_groups_with_invalid_rule_input_value(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        answer_groups_list = [{
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
                    'x': []
                },
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_misconception_id': None
        }]

        with self.assertRaisesRegexp(
            Exception,
            re.escape(
                '[] has the wrong type. It should be a NormalizedString.')):
            exploration.init_state.update_interaction_answer_groups(
                answer_groups_list)

    def test_validate_rule_spec(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'warning', _mock_logging_function)

        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        answer_groups = [{
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
        }]
        exploration.init_state.update_interaction_answer_groups(answer_groups)

        with logging_swap, self.assertRaises(KeyError):
            (
                exploration.init_state.interaction.answer_groups[0]
                .rule_specs[0].validate([], {})
            )

        self.assertEqual(
            observed_log_messages,
            [
                'RuleSpec \'Contains\' has inputs which are not recognized '
                'parameter names: set([\'x\'])'
            ]
        )


class WrittenTranslationsDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on written transcripts."""

    def test_from_and_to_dict_wroks_correctly(self):
        written_translations_dict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'html': 'hello',
                        'needs_update': True
                    },
                    'hi': {
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'html': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        self.assertEqual(
            written_translations.to_dict(), written_translations_dict)

    def test_get_content_ids_for_text_translation_return_correct_list_of_content_id(self): # pylint: disable=line-too-long
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })
        self.assertEqual(
            written_translations.get_content_ids_for_text_translation(), [])

        written_translations.add_content_id_for_translation('feedback_1')
        written_translations.add_content_id_for_translation('feedback_2')
        self.assertEqual(
            written_translations.get_content_ids_for_text_translation(), [
                'feedback_2', 'feedback_1'])

    def test_add_content_id_for_translations_adds_content_id(self):
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })

        self.assertEqual(
            len(written_translations.get_content_ids_for_text_translation()), 0)

        new_content_id = 'content_id'
        written_translations.add_content_id_for_translation(new_content_id)

        self.assertEqual(
            len(written_translations.get_content_ids_for_text_translation()), 1)
        self.assertEqual(
            written_translations.get_content_ids_for_text_translation(),
            ['content_id'])

    def test_add_content_id_for_translation_with_invalid_content_id_raise_error(
            self):
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })
        invalid_content_id = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected content_id to be a string, received 123'):
            written_translations.add_content_id_for_translation(
                invalid_content_id)

    def test_add_content_id_for_translation_with_existing_content_id_raise_error( # pylint: disable=line-too-long
            self):
        written_translations_dict = {
            'translations_mapping': {
                'feedback_1': {
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        existing_content_id = 'feedback_1'
        with self.assertRaisesRegexp(
            Exception, 'The content_id feedback_1 already exist.'):
            written_translations.add_content_id_for_translation(
                existing_content_id)

    def test_delete_content_id_for_translations_deletes_content_id(self):
        old_written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            old_written_translations_dict)
        self.assertEqual(
            len(written_translations.get_content_ids_for_text_translation()), 1)

        written_translations.delete_content_id_for_translation('content')

        self.assertEqual(
            len(written_translations.get_content_ids_for_text_translation()), 0)

    def test_delete_content_id_for_translation_with_nonexisting_content_id_raise_error(self): # pylint: disable=line-too-long
        written_translations_dict = {
            'translations_mapping': {
                'content': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        nonexisting_content_id_to_delete = 'feedback_1'
        with self.assertRaisesRegexp(
            Exception, 'The content_id feedback_1 does not exist.'):
            written_translations.delete_content_id_for_translation(
                nonexisting_content_id_to_delete)

    def test_delete_content_id_for_translation_with_invalid_content_id_raise_error(self): # pylint: disable=line-too-long
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })
        invalid_content_id_to_delete = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected content_id to be a string, '):
            written_translations.delete_content_id_for_translation(
                invalid_content_id_to_delete)

    def test_validation_with_invalid_content_id_raise_error(self):
        written_translations_dict = {
            'translations_mapping': {
                123: {}
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegexp(
            Exception, 'Expected content_id to be a string, '):
            written_translations.validate([123])

    def test_validate_non_dict_language_code_to_written_translation(self):
        written_translations = state_domain.WrittenTranslations({
            'en': []
        })

        with self.assertRaisesRegexp(
            Exception,
            re.escape('Expected content_id value to be a dict, received []')):
            written_translations.validate(None)

    def test_validation_with_invalid_type_langauge_code_raise_error(self):
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    123: {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be a string, '):
            written_translations.validate(['content'])

    def test_validation_with_unknown_langauge_code_raise_error(self):
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'ed': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegexp(Exception, 'Invalid language_code: ed'):
            written_translations.validate(['content'])

    def test_validation_with_invalid_content_id_list(self):
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'html': '<p>hello!</p>',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegexp(
            Exception,
            re.escape(
                'Expected state written_translations to match the listed '
                'content ids [\'invalid_content\']')):
            written_translations.validate(['invalid_content'])


class RecordedVoiceoversDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on recorded voiceovers."""

    def test_from_and_to_dict_wroks_correctly(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content1': {
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': True
                    },
                    'hi': {
                        'filename': 'abc.mp3',
                        'file_size_bytes': 1234,
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    },
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)
        self.assertEqual(
            recorded_voiceovers.to_dict(), recorded_voiceovers_dict)

    def test_get_content_ids_for_voiceovers_return_correct_list_of_content_id(self): # pylint: disable=line-too-long
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })
        self.assertEqual(
            recorded_voiceovers.get_content_ids_for_voiceovers(), [])

        recorded_voiceovers.add_content_id_for_voiceover('feedback_1')
        recorded_voiceovers.add_content_id_for_voiceover('feedback_2')
        self.assertEqual(recorded_voiceovers.get_content_ids_for_voiceovers(), [
            'feedback_2', 'feedback_1'])

    def test_add_content_id_for_voiceovers_adds_content_id(self):
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })

        self.assertEqual(
            len(recorded_voiceovers.get_content_ids_for_voiceovers()), 0)

        new_content_id = 'content_id'
        recorded_voiceovers.add_content_id_for_voiceover(new_content_id)

        self.assertEqual(
            len(recorded_voiceovers.get_content_ids_for_voiceovers()), 1)
        self.assertEqual(
            recorded_voiceovers.get_content_ids_for_voiceovers(),
            ['content_id'])

    def test_add_content_id_for_voiceover_with_invalid_content_id_raise_error(
            self):
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })
        invalid_content_id = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected content_id to be a string, received 123'):
            recorded_voiceovers.add_content_id_for_voiceover(
                invalid_content_id)

    def test_add_content_id_for_voiceover_with_existing_content_id_raise_error( # pylint: disable=line-too-long
            self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'feedback_1': {
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)
        existing_content_id = 'feedback_1'
        with self.assertRaisesRegexp(
            Exception, 'The content_id feedback_1 already exist.'):
            recorded_voiceovers.add_content_id_for_voiceover(
                existing_content_id)

    def test_delete_content_id_for_voiceovers_deletes_content_id(self):
        old_recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            old_recorded_voiceovers_dict)
        self.assertEqual(
            len(recorded_voiceovers.get_content_ids_for_voiceovers()), 1)

        recorded_voiceovers.delete_content_id_for_voiceover('content')

        self.assertEqual(
            len(recorded_voiceovers.get_content_ids_for_voiceovers()), 0)

    def test_delete_content_id_for_voiceover_with_nonexisting_content_id_raise_error(self): # pylint: disable=line-too-long
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {}
            }
        }
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)
        nonexisting_content_id_to_delete = 'feedback_1'
        with self.assertRaisesRegexp(
            Exception, 'The content_id feedback_1 does not exist.'):
            recorded_voiceovers.delete_content_id_for_voiceover(
                nonexisting_content_id_to_delete)

    def test_delete_content_id_for_voiceover_with_invalid_content_id_raise_error(self): # pylint: disable=line-too-long
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })
        invalid_content_id_to_delete = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected content_id to be a string, '):
            recorded_voiceovers.delete_content_id_for_voiceover(
                invalid_content_id_to_delete)

    def test_validation_with_invalid_content_id_raise_error(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                123: {}
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)

        with self.assertRaisesRegexp(
            Exception, 'Expected content_id to be a string, '):
            recorded_voiceovers.validate([123])

    def test_validate_non_dict_language_code_to_voiceover(self):
        recorded_voiceovers = state_domain.RecordedVoiceovers({
            'en': []
        })

        with self.assertRaisesRegexp(
            Exception,
            re.escape('Expected content_id value to be a dict, received []')):
            recorded_voiceovers.validate(None)

    def test_validation_with_invalid_type_langauge_code_raise_error(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    123: {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)

        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be a string, '):
            recorded_voiceovers.validate(['content'])

    def test_validation_with_unknown_langauge_code_raise_error(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'ed': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)

        with self.assertRaisesRegexp(Exception, 'Invalid language_code: ed'):
            recorded_voiceovers.validate(['content'])

    def test_validation_with_invalid_content_id_list(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)

        with self.assertRaisesRegexp(
            Exception,
            re.escape(
                'Expected state recorded_voiceovers to match the listed '
                'content ids [\'invalid_content\']')):
            recorded_voiceovers.validate(['invalid_content'])


class VoiceoverDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(VoiceoverDomainTests, self).setUp()
        self.voiceover = state_domain.Voiceover('filename.mp3', 10, False)

    def test_validate_non_str_filename(self):
        self.voiceover.validate()
        self.voiceover.filename = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected audio filename to be a string'):
            self.voiceover.validate()

    def test_validate_filename(self):
        self.voiceover.validate()
        self.voiceover.filename = 'invalid_filename'
        with self.assertRaisesRegexp(Exception, 'Invalid audio filename'):
            self.voiceover.validate()

    def test_validate_audio_extension(self):
        self.voiceover.validate()
        self.voiceover.filename = 'filename.png'
        with self.assertRaisesRegexp(
            Exception,
            re.escape(
                'Invalid audio filename: it should have one of the following '
                'extensions: %s' % feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())):
            self.voiceover.validate()

    def test_validate_non_int_file_size_bytes(self):
        self.voiceover.validate()
        self.voiceover.file_size_bytes = 'file_size_bytes'
        with self.assertRaisesRegexp(
            Exception, 'Expected file size to be an int'):
            self.voiceover.validate()

    def test_validate_negative_file_size_bytes(self):
        self.voiceover.validate()
        self.voiceover.file_size_bytes = -1
        with self.assertRaisesRegexp(Exception, 'Invalid file size'):
            self.voiceover.validate()

    def test_validate_non_bool_needs_update(self):
        self.voiceover.validate()
        self.voiceover.needs_update = 'needs_update'
        with self.assertRaisesRegexp(
            Exception, 'Expected needs_update to be a bool'):
            self.voiceover.validate()
