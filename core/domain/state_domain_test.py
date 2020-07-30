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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import functools
import json
import logging
import os
import re

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import html_validation_service
from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils
import feconf
import utils


def mock_get_filename_with_dimensions(filename, unused_exp_id):
    return html_validation_service.regenerate_image_filename_using_dimensions(
        filename, 490, 120)


class StateDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on states."""

    def test_get_all_html_in_exploration_with_drag_and_drop_interaction(self):
        """Test the method for extracting all the HTML from a state having
        DragAndDropSortInput interaction.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_customization_args_dict = {
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': '<p>state customization arg html 1</p>'
                    }, {
                        'content_id': 'ca_choices_1',
                        'html': '<p>state customization arg html 2</p>'
                    }, {
                        'content_id': 'ca_choices_2',
                        'html': '<p>state customization arg html 3</p>'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': '<p>state customization arg html 4</p>'
                    }
                ]
            },
            'allowMultipleItemsInSamePosition': {
                'value': False
            }
        }

        state_answer_group_dict = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>State Feedback</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': [['<p>IsEqualToOrdering rule_spec htmls</p>']]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': '<p>HasElementXAtPositionY rule_spec html</p>',
                    'y': 2
                }
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': '<p>x input for HasElementXAtPositionY rule_spec </p>',
                    'y': '<p>y input for HasElementXAtPositionY rule_spec </p>'
                }
            }, {
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': [[(
                        '<p>IsEqualToOrderingWithOneItemAtIncorrectPosition r'
                        'ule_spec htmls</p>')]]
                }
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        state_solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': [
                '<p>state customization arg html 1</p>',
                '<p>state customization arg html 2</p>',
                '<p>state customization arg html 3</p>',
                '<p>state customization arg html 4</p>'
            ],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        state_written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation content-en</p>',
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation content-hi</p>',
                        'needs_update': False
                    }
                },
                'ca_choices_0': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_0-hi'
                                '</p>'
                            ),
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_0'
                                '-en</p>'
                            ),
                        'needs_update': False
                    }
                },
                'ca_choices_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_1-hi'
                                '</p>'
                            ),
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_1-en'
                                '</p>'
                            ),
                        'needs_update': False
                    }
                },
                'ca_choices_2': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_2-hi'
                                '</p>'
                            ),
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_2-en'
                                '</p>'
                            ),
                        'needs_update': False
                    }
                },
                'ca_choices_3': {
                    'hi': {
                        'data_format': 'html',
                        'translation': (
                            '<p>state written_translation ca_choices_3-hi'
                            '</p>'
                        ),
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            (
                                '<p>state written_translation ca_choices_3-en'
                                '</p>'
                            ),
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation outcome-hi</p>',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation outcome-en</p>',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation feedback-hi</p>',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation feedback-en</p>',
                        'needs_update': False
                    }
                },
                'hint_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation hint_1-hi</p>',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation hint_1-en</p>',
                        'needs_update': False
                    }
                },
                'solution': {
                    'hi': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation solution-hi</p>',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation':
                            '<p>state written_translation solution-en</p>',
                        'needs_update': False
                    }
                }
            }
        }
        state_hint_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for hint 1</p>'
                )
            )
        ]

        state_solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': [
                ['<p>state customization arg html 1</p>'],
                ['<p>state customization arg html 2</p>'],
                ['<p>state customization arg html 3</p>'],
                ['<p>state customization arg html 4</p>']
            ],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }

        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))
        state.update_interaction_id('DragAndDropSortInput')
        state.update_interaction_customization_args(
            state_customization_args_dict)
        state.update_interaction_hints(state_hint_list)

        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        state.update_interaction_answer_groups(
            [state_answer_group_dict])
        state.update_written_translations(
            state_domain.WrittenTranslations.from_dict(
                state_written_translations_dict))

        exp_services.save_new_exploration('owner_id', exploration)

        html_list = state.get_all_html_content_strings()
        self.assertEqual(
            html_list,
            [
                '<p>state written_translation solution-hi</p>',
                '<p>state written_translation solution-en</p>',
                '<p>state written_translation content-hi</p>',
                '<p>state written_translation content-en</p>',
                '<p>state written_translation feedback-hi</p>',
                '<p>state written_translation feedback-en</p>',
                '<p>state written_translation hint_1-hi</p>',
                '<p>state written_translation hint_1-en</p>',
                '<p>state written_translation outcome-hi</p>',
                '<p>state written_translation outcome-en</p>',
                '<p>state written_translation ca_choices_0-hi</p>',
                '<p>state written_translation ca_choices_0-en</p>',
                '<p>state written_translation ca_choices_1-hi</p>',
                '<p>state written_translation ca_choices_1-en</p>',
                '<p>state written_translation ca_choices_2-hi</p>',
                '<p>state written_translation ca_choices_2-en</p>',
                '<p>state written_translation ca_choices_3-hi</p>',
                '<p>state written_translation ca_choices_3-en</p>',
                '<p>State Feedback</p>',
                '<p>IsEqualToOrdering rule_spec htmls</p>',
                '<p>HasElementXAtPositionY rule_spec html</p>',
                '<p>y input for HasElementXAtPositionY rule_spec </p>',
                '<p>x input for HasElementXAtPositionY rule_spec </p>',
                (
                    '<p>IsEqualToOrderingWithOneItemAtIncorrectPosition rule_s'
                    'pec htmls</p>'),
                '',
                '<p>Hello, this is html1 for hint 1</p>',
                '<p>This is solution for state1</p>',
                '<p>state customization arg html 1</p>',
                '<p>state customization arg html 2</p>',
                '<p>state customization arg html 3</p>',
                '<p>state customization arg html 4</p>',
                '<p>state customization arg html 1</p>',
                '<p>state customization arg html 2</p>',
                '<p>state customization arg html 3</p>',
                '<p>state customization arg html 4</p>',
                '<p>state content html</p>'])

    def test_get_all_html_in_exploration_with_text_input_interaction(self):
        """Test the method for extracting all the HTML from a state having
        TextInput interaction.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']

        state_content_dict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_answer_group_dict = {
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>state outcome html</p>'
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
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        state_default_outcome = state_domain.Outcome(
            'State1', state_domain.SubtitledHtml(
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
        state_solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        state_interaction_cust_args = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'rows': {'value': 1}
        }

        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))
        state.update_interaction_id('TextInput')
        state.update_interaction_customization_args(state_interaction_cust_args)
        state.update_interaction_answer_groups(
            [state_answer_group_dict])
        state.update_interaction_default_outcome(state_default_outcome)
        state.update_interaction_hints(state_hint_list)
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)

        exp_services.save_new_exploration('owner_id', exploration)
        html_list = state.get_all_html_content_strings()
        self.assertEqual(
            html_list,
            [
                '<p>state outcome html</p>',
                '<p>Default outcome for State1</p>',
                '<p>Hello, this is html1 for state1</p>',
                '<p>Hello, this is html2 for state1</p>',
                '<p>This is solution for state1</p>',
                '<p>state content html</p>'])

    def test_get_all_html_in_exploration_with_item_selection_interaction(self):
        """Test the method for extracting all the HTML from a state having
        ItemSelectionInput interaction.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']

        state_content_dict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_customization_args_dict = {
            'maxAllowableSelectionCount': {
                'value': 1
            },
            'minAllowableSelectionCount': {
                'value': 1
            },
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': '<p>init_state customization arg html 1</p>'
                    }, {
                        'content_id': 'ca_choices_1',
                        'html': '<p>init_state customization arg html 2</p>'
                    }, {
                        'content_id': 'ca_choices_2',
                        'html': '<p>init_state customization arg html 3</p>'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': '<p>init_state customization arg html 4</p>'
                    },
                ]
            }
        }
        state_answer_groups = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': ['<p>Equals rule_spec html</p>']
                }
            }, {
                'rule_type': 'ContainsAtLeastOneOf',
                'inputs': {
                    'x': ['<p>ContainsAtLeastOneOf rule_spec html</p>']
                }
            }, {
                'rule_type': 'IsProperSubsetOf',
                'inputs': {
                    'x': ['<p>IsProperSubsetOf rule_spec html</p>']
                }
            }, {
                'rule_type': 'DoesNotContainAtLeastOneOf',
                'inputs': {
                    'x': ['<p>DoesNotContainAtLeastOneOf rule_spec html</p>']
                }
            }],
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>state outcome html</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]
        state_solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': [
                '<p>state customization arg html 1</p>',
                '<p>state customization arg html 2</p>',
                '<p>state customization arg html 3</p>',
                '<p>state customization arg html 4</p>'
            ],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        state_hint_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for hint 1</p>'
                )
            )
        ]

        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))
        state.update_interaction_id('ItemSelectionInput')
        state.update_interaction_answer_groups(state_answer_groups)
        state.update_interaction_customization_args(
            state_customization_args_dict)
        state.update_interaction_hints(state_hint_list)

        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        exp_services.save_new_exploration('owner_id', exploration)

        interaction = (
            interaction_registry.Registry.get_interaction_by_id(
                'ItemSelectionInput'))
        interaction.can_have_solution = True
        html_list = state.get_all_html_content_strings()
        self.assertEqual(
            html_list,
            [
                '<p>state outcome html</p>',
                '<p>Equals rule_spec html</p>',
                '<p>ContainsAtLeastOneOf rule_spec html</p>',
                '<p>IsProperSubsetOf rule_spec html</p>',
                '<p>DoesNotContainAtLeastOneOf rule_spec html</p>', '',
                '<p>Hello, this is html1 for hint 1</p>',
                '<p>This is solution for state1</p>',
                '<p>state customization arg html 1</p>',
                '<p>state customization arg html 2</p>',
                '<p>state customization arg html 3</p>',
                '<p>state customization arg html 4</p>',
                '<p>init_state customization arg html 1</p>',
                '<p>init_state customization arg html 2</p>',
                '<p>init_state customization arg html 3</p>',
                '<p>init_state customization arg html 4</p>',
                '<p>state content html</p>'])

    def test_rule_spec_with_invalid_html_format(self):
        """Test the method for extracting all the HTML from a state
        when the rule_spec has invalid html format.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_answer_groups = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': ['<p>Equals rule_spec html</p>']
                }
            }, {
                'rule_type': 'ContainsAtLeastOneOf',
                'inputs': {
                    'x': ['<p>ContainsAtLeastOneOf rule_spec html</p>']
                }
            }, {
                'rule_type': 'IsProperSubsetOf',
                'inputs': {
                    'x': ['<p>IsProperSubsetOf rule_spec html</p>']
                }
            }, {
                'rule_type': 'DoesNotContainAtLeastOneOf',
                'inputs': {
                    'x': ['<p>DoesNotContainAtLeastOneOf rule_spec html</p>']
                }
            }],
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>state outcome html</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state.update_interaction_id('ItemSelectionInput')
        state.update_interaction_answer_groups(state_answer_groups)
        mock_html_field_types_to_rule_specs_dict = json.loads(
            utils.get_file_contents(
                feconf.HTML_FIELD_TYPES_TO_RULE_SPECS_FILE_PATH))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            html_type_dict['format'] = 'invalid format'

        def mock_get_file_contents(unused_file_path):
            return json.dumps(mock_html_field_types_to_rule_specs_dict)

        with self.swap(utils, 'get_file_contents', mock_get_file_contents):
            with self.assertRaisesRegexp(
                Exception,
                'The rule spec does not belong to a valid format.'):
                state.get_all_html_content_strings()

    def test_update_customization_args_with_invalid_content_id(self):
        """Test the method for updating interaction customization arguments
        when a content_id is invalid (set to None).
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_customization_args_dict = {
            'maxAllowableSelectionCount': {
                'value': 1
            },
            'minAllowableSelectionCount': {
                'value': 1
            },
            'choices': {
                'value': [
                    {
                        'content_id': None,
                        'html': '<p>init_state customization arg html 1</p>'
                    }, {
                        'content_id': 'ca_choices_1',
                        'html': '<p>init_state customization arg html 2</p>'
                    }
                ]
            }
        }

        state.update_interaction_id('ItemSelectionInput')
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected content id to be a string, received None'
        ):
            state.update_interaction_customization_args(
                state_customization_args_dict)

    def test_rule_spec_with_html_having_invalid_input_variable(self):
        """Test the method for extracting all the HTML from a state
        when the rule_spec has html but the input variable is invalid.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_answer_groups = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': ['<p>init_state customization arg html 1</p>']
                }
            }],
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>state outcome html</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]
        state_customization_args_dict = {
            'maxAllowableSelectionCount': {
                'value': 1
            },
            'minAllowableSelectionCount': {
                'value': 1
            },
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': '<p>init_state customization arg html 1</p>'
                    }, {
                        'content_id': 'ca_choices_1',
                        'html': '<p>init_state customization arg html 2</p>'
                    }, {
                        'content_id': 'ca_choices_2',
                        'html': '<p>init_state customization arg html 3</p>'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': '<p>init_state customization arg html 4</p>'
                    }
                ]
            }
        }

        state.update_interaction_id('ItemSelectionInput')
        state.update_interaction_customization_args(
            state_customization_args_dict)
        state.update_interaction_answer_groups(state_answer_groups)

        mock_html_field_types_to_rule_specs_dict = json.loads(
            utils.get_file_contents(
                feconf.HTML_FIELD_TYPES_TO_RULE_SPECS_FILE_PATH))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            if html_type_dict['interactionId'] == 'ItemSelectionInput':
                html_type_dict['ruleTypes']['Equals']['htmlInputVariables'] = (
                    ['y'])

        def mock_get_file_contents(unused_file_path):
            return json.dumps(mock_html_field_types_to_rule_specs_dict)

        with self.swap(utils, 'get_file_contents', mock_get_file_contents):
            with self.assertRaisesRegexp(
                Exception,
                'Rule spec should have at least one valid input variable with '
                'Html in it.'):
                state.get_all_html_content_strings()

    def test_get_all_html_when_solution_has_invalid_answer_type(self):
        """Test the method for extracting all the HTML from a state
        when the interaction has a solution but the answer_type for the
        corrent_answer is invalid.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_customization_args_dict = {
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': '<p>state customization arg html 1</p>'
                    }, {
                        'content_id': 'ca_choices_1',
                        'html': '<p>state customization arg html 2</p>'
                    }, {
                        'content_id': 'ca_choices_2',
                        'html': '<p>state customization arg html 3</p>'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': '<p>state customization arg html 4</p>'
                    }
                ]
            },
            'allowMultipleItemsInSamePosition': {
                'value': False
            }
        }

        state_hint_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for hint 1</p>'
                )
            )
        ]

        state_solution_dict = {
            'interaction_id': '',
            'answer_is_exclusive': True,
            'correct_answer': [
                ['<p>state customization arg html 1</p>'],
                ['<p>state customization arg html 2</p>'],
                ['<p>state customization arg html 3</p>'],
                ['<p>state customization arg html 4</p>']
            ],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }

        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))
        state.update_interaction_id('DragAndDropSortInput')
        state.update_interaction_customization_args(
            state_customization_args_dict)
        state.update_interaction_hints(state_hint_list)
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        exp_services.save_new_exploration('owner_id', exploration)

        interaction = (
            interaction_registry.Registry.get_interaction_by_id(
                'DragAndDropSortInput'))
        interaction.answer_type = 'DragAndDropHtmlString'
        with self.assertRaisesRegexp(
            Exception,
            'The solution does not have a valid '
            'correct_answer type.'):
            state.get_all_html_content_strings()

    def test_get_all_html_when_interaction_is_none(self):
        """Test the method for extracting all the HTML from a state
        when the state has no interaction.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }

        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))

        exp_services.save_new_exploration('owner_id', exploration)
        html_list = state.get_all_html_content_strings()
        self.assertEqual(html_list, ['', '<p>state content html</p>'])

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
            'next_content_id_index': 0,
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

    def test_get_content_html_with_correct_state_name_returns_html(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')

        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            init_state.get_content_html('hint_1'), '<p>hint one</p>')

        hints_list[0].hint_content.html = '<p>Changed hint one</p>'
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            init_state.get_content_html('hint_1'), '<p>Changed hint one</p>')

    def test_rte_content_validation_for_android(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')

        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': (
                    '<p>Value</p><oppia-noninteractive-math math_content-with'
                    '-value="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,'
                    '+&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
                    ';&amp;quot;}"></oppia-noninteractive-math>')
            },
        }

        solution = state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict
        )
        init_state.update_interaction_solution(solution)
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        solution_dict['explanation']['html'] = ''
        init_state.update_interaction_solution(state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict))
        self.assertTrue(init_state.is_rte_content_supported_on_android())

        hints_list = []
        hints_list.append(
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1',
                    '<oppia-noninteractive-collapsible content-with-value='
                    '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;'
                    'quot;" heading-with-value="&amp;quot;SubCollapsible&amp;'
                    'quot;"></oppia-noninteractive-collapsible><p>&nbsp;</p>'
                )
            )
        )
        init_state.update_interaction_hints(hints_list)
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        hints_list[0].hint_content.html = ''
        init_state.update_interaction_hints(hints_list)
        self.assertTrue(init_state.is_rte_content_supported_on_android())

        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', (
                    '<p>Value</p><oppia-noninteractive-math math_content-with'
                    '-value="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,'
                    '+&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
                    ';&amp;quot;}"></oppia-noninteractive-math>')),
            False, [], None, None
        )

        init_state.update_interaction_default_outcome(default_outcome)
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        default_outcome.feedback.html = ''
        init_state.update_interaction_default_outcome(default_outcome)
        self.assertTrue(init_state.is_rte_content_supported_on_android())

        answer_group_dict = {
            'outcome': {
                'dest': exploration.init_state_name,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': (
                        '<oppia-noninteractive-tabs tab_contents-with-value'
                        '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p'
                        '&amp;gt;&amp;lt;i&amp;gt;lorem ipsum&amp;lt;/i&amp;'
                        'gt;&amp;lt;/p&amp;gt;&amp;quot;,&amp;quot;title&amp;'
                        'quot;:&amp;quot;hello&amp;quot;}]\">'
                        '</oppia-noninteractive-tabs>')
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
            'tagged_skill_misconception_id': None
        }

        init_state.update_interaction_answer_groups(
            [answer_group_dict])
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        answer_group_dict['outcome']['feedback']['html'] = (
            '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
            '&amp;quot;" filepath-with-value="&amp;quot;startBlue.png&amp;'
            'quot;" alt-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-image></p>')
        init_state.update_interaction_answer_groups(
            [answer_group_dict])
        self.assertTrue(init_state.is_rte_content_supported_on_android())

        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': (
                    '<oppia-noninteractive-tabs tab_contents-with-value'
                    '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p'
                    '&amp;gt;&amp;lt;i&amp;gt;lorem ipsum&amp;lt;/i&amp;'
                    'gt;&amp;lt;/p&amp;gt;&amp;quot;,&amp;quot;title&amp;'
                    'quot;:&amp;quot;hello&amp;quot;}]\">'
                    '</oppia-noninteractive-tabs>')
            }))
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': (
                    '<p><oppia-noninteractive-link text-with-value="'
                    '&amp;quot;What is a link?&amp;quot;" url-with-'
                    'value="&amp;quot;htt://link.com&amp'
                    ';quot;"></oppia-noninteractive-link></p>')
            }))
        self.assertTrue(init_state.is_rte_content_supported_on_android())
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': (
                    '<p><oppia-noninteractive-skillreview text-with-value="'
                    '&amp;quot;&amp;quot;" skill_id-with-value="&amp;quot;'
                    '&amp;quot;"></oppia-noninteractive-skillreview></p>')
            }))
        self.assertTrue(init_state.is_rte_content_supported_on_android())

    def test_interaction_validation_for_android(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')

        init_state = exploration.states[exploration.init_state_name]
        # Valid interactions.
        init_state.update_interaction_id('Continue')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('DragAndDropSortInput')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('EndExploration')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('FractionInput')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('ItemSelectionInput')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('MultipleChoiceInput')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('NumberWithUnits')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('NumericInput')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('TextInput')
        self.assertTrue(init_state.interaction.is_supported_on_android_app())

        # Invalid interactions.
        init_state.update_interaction_id('CodeRepl')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('GraphInput')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('ImageClickInput')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('InteractiveMap')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('LogicProof')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('MathExpressionInput')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('MusicNotesInput')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('PencilCodeEditor')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())
        init_state.update_interaction_id('SetInput')
        self.assertFalse(init_state.interaction.is_supported_on_android_app())

    def test_get_content_html_with_invalid_content_id_raise_error(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            init_state.get_content_html('hint_1'), '<p>hint one</p>')

        with self.assertRaisesRegexp(
            ValueError, 'Content ID Invalid id does not exist'):
            init_state.get_content_html('Invalid id')

    def test_get_content_id_mapping_needing_translations_with_existing_translations(self): # pylint: disable=line-too-long
        exploration = exp_domain.Exploration.create_default_exploration('0')
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
            'tagged_skill_misconception_id': None
        }

        init_state.update_interaction_answer_groups(
            [answer_group_dict])
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
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
        init_state.update_interaction_solution(solution)


        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>hello!</p>',
                        'needs_update': False
                    }
                },
                'hint_1': {},
                'default_outcome': {},
                'solution': {},
                'feedback_1': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        init_state.update_written_translations(written_translations)

        self.assertEqual(
            init_state.get_content_id_mapping_needing_translations('hi'), {
                'hint_1': '<p>hint one</p>',
                'solution': '<p>hello_world is a string</p>',
                'feedback_1': '<p>Feedback</p>',
                'default_outcome': '<p>The default outcome.</p>'
            })

    def test_add_translation_works_correctly(self):
        exploration = exp_domain.Exploration.create_default_exploration('0')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))

        self.assertEqual(init_state.get_translation_counts(), {})

        init_state.add_translation('content', 'hi', '<p>Translated text</p>')

        self.assertEqual(init_state.get_translation_counts(), {'hi': 1})

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
        self.set_interaction_for_state(
            exploration.states['Renamed state'], 'TextInput')
        self.set_interaction_for_state(
            exploration.states['State 2'], 'TextInput')

        # Other miscellaneous requirements for validation.
        exploration.title = 'Title'
        exploration.category = 'Category'
        exploration.objective = 'Objective'

        # The exploration should NOT be terminable even though it has a state
        # called 'END' and everything else is connected to it.
        with self.assertRaisesRegexp(
            Exception,
            'This state does not have any interaction specified.'):
            exploration.validate(strict=True)

        # Renaming the node to something other than 'END' and giving it an
        # EndExploration is enough to validate it, though it cannot have a
        # default outcome or answer groups.
        exploration.rename_state('END', 'AnotherEnd')
        another_end_state = exploration.states['AnotherEnd']
        self.set_interaction_for_state(another_end_state, 'EndExploration')
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
                'customization_args': {
                    'choices': {
                        'value': [{
                            'html': 'hello',
                            'content_id': 'ca_choices_0'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                },
                'confirmed_unclassified_answers': [],
                'id': 'MultipleChoiceInput',
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
                'customization_args': {
                    'choices': {
                        'value': [{
                            'html': '<p>hello</p>',
                            'content_id': 'ca_choices_0'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                },
                'confirmed_unclassified_answers': [],
                'id': 'MultipleChoiceInput',
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
                'customization_args': {
                    'choices': {
                        'value': [{
                            'html': '<p>hello</p>',
                            'content_id': 'ca_choices_0'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                },
                'confirmed_unclassified_answers': [],
                'id': 'MultipleChoiceInput',
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
                'customization_args': {
                    'choices': {
                        'value': [{
                            'html': '<p>hello</p>',
                            'content_id': 'ca_choices_0'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                },
                'confirmed_unclassified_answers': [],
                'id': 'MultipleChoiceInput',
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

    def test_convert_html_fields_in_state_with_drag_and_drop_interaction(self):
        """Test the method for converting all the HTML in a state having
        DragAndDropSortInput interaction.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        html_with_new_math_schema = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        written_translations_dict_with_old_math_schema = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': html_with_old_math_schema,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': html_with_old_math_schema,
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        written_translations_dict_with_new_math_schema = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': html_with_new_math_schema,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': html_with_new_math_schema,
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }


        answer_group_dict_with_old_math_schema = {
            'outcome': {
                'dest': 'Introduction',
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
                    'x': [[html_with_old_math_schema]]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': html_with_old_math_schema,
                    'y': 2
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {
                    'x': [[html_with_old_math_schema]]
                }
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': html_with_old_math_schema,
                    'y': html_with_old_math_schema
                }
            }, {
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': [[html_with_old_math_schema]]
                }
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        answer_group_dict_with_new_math_schema = {
            'outcome': {
                'dest': 'Introduction',
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
                    'x': [[html_with_new_math_schema]]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': html_with_new_math_schema,
                    'y': 2
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {
                    'x': [[html_with_new_math_schema]]
                }
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': html_with_new_math_schema,
                    'y': html_with_new_math_schema
                }
            }, {
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': [[html_with_new_math_schema]]
                }
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'answer_groups': [answer_group_dict_with_old_math_schema],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': (
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
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': html_with_old_math_schema
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': '<p>2</p>'
                        }, {
                            'content_id': 'ca_choices_2',
                            'html': '<p>3</p>'
                        }, {
                            'content_id': 'ca_choices_3',
                            'html': '<p>4</p>'
                        }]
                    },
                    'allowMultipleItemsInSamePosition': {'value': True}
                },
                'confirmed_unclassified_answers': [],
                'id': 'DragAndDropSortInput',
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_old_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_old_math_schema
                        }
                    }
                ],
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        [html_with_old_math_schema],
                        ['<p>2</p>'],
                        ['<p>3</p>'],
                        ['<p>4</p>']
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                }

            },
            'written_translations': (
                written_translations_dict_with_old_math_schema)
        }

        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'answer_groups': [answer_group_dict_with_new_math_schema],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': (
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
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': html_with_new_math_schema
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': '<p>2</p>'
                        }, {
                            'content_id': 'ca_choices_2',
                            'html': '<p>3</p>'
                        }, {
                            'content_id': 'ca_choices_3',
                            'html': '<p>4</p>'
                        }]
                    },
                    'allowMultipleItemsInSamePosition': {'value': True}
                },
                'confirmed_unclassified_answers': [],
                'id': 'DragAndDropSortInput',
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_new_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_new_math_schema
                        }
                    }
                ],
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        [html_with_new_math_schema],
                        ['<p>2</p>'],
                        ['<p>3</p>'],
                        ['<p>4</p>']
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                }

            },
            'written_translations': (
                written_translations_dict_with_new_math_schema)
        }
        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_with_item_selection_interaction(self):
        """Test the method for converting all the HTML in a state having
        ItemSelection interaction.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        html_with_new_math_schema = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        answer_group_with_old_math_schema = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }, {
                'rule_type': 'ContainsAtLeastOneOf',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }, {
                'rule_type': 'IsProperSubsetOf',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }, {
                'rule_type': 'DoesNotContainAtLeastOneOf',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': html_with_old_math_schema
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        answer_group_with_new_math_schema = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': [html_with_new_math_schema]
                }
            }, {
                'rule_type': 'ContainsAtLeastOneOf',
                'inputs': {
                    'x': [html_with_new_math_schema]
                }
            }, {
                'rule_type': 'IsProperSubsetOf',
                'inputs': {
                    'x': [html_with_new_math_schema]
                }
            }, {
                'rule_type': 'DoesNotContainAtLeastOneOf',
                'inputs': {
                    'x': [html_with_new_math_schema]
                }
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': html_with_new_math_schema
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        html_with_old_math_schema,
                        '<p>state customization arg html 2</p>',
                        '<p>state customization arg html 3</p>',
                        '<p>state customization arg html 4</p>'
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                },
                'answer_groups': answer_group_with_old_math_schema,
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': (
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
                'customization_args': {
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    },
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>init_state customization arg html 1</p>'
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': html_with_old_math_schema
                        }, {
                            'content_id': 'ca_choices_2',
                            'html': '<p>init_state customization arg html 3</p>'
                        }, {
                            'content_id': 'ca_choices_3',
                            'html': '<p>init_state customization arg html 4</p>'
                        }]
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'ItemSelectionInput',
                'hints': []
            }
        }

        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': [
                        html_with_new_math_schema,
                        '<p>state customization arg html 2</p>',
                        '<p>state customization arg html 3</p>',
                        '<p>state customization arg html 4</p>'
                    ],
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is solution for state1</p>'
                    }
                },
                'answer_groups': answer_group_with_new_math_schema,
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': (
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
                'customization_args': {
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    },
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>init_state customization arg html 1</p>'
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': html_with_new_math_schema
                        }, {
                            'content_id': 'ca_choices_2',
                            'html': '<p>init_state customization arg html 3</p>'
                        }, {
                            'content_id': 'ca_choices_3',
                            'html': '<p>init_state customization arg html 4</p>'
                        }]
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'ItemSelectionInput',
                'hints': []
            }
        }
        interaction = (
            interaction_registry.Registry.get_interaction_by_id(
                'ItemSelectionInput'))
        interaction.can_have_solution = True

        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_with_text_input_interaction(self):
        """Test the method for converting all the HTML in a state having
        TextInput interaction.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        html_with_new_math_schema = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        answer_group_with_old_math_schema = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': html_with_old_math_schema
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
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        answer_group_with_new_math_schema = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': html_with_new_math_schema
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
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }

        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': html_with_old_math_schema
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': 'Answer1',
                    'explanation': {
                        'content_id': 'solution',
                        'html': html_with_old_math_schema
                    }
                },
                'answer_groups': [answer_group_with_old_math_schema],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_with_old_math_schema
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {
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
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_old_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_old_math_schema
                        }
                    }]
            }
        }


        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': html_with_new_math_schema
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': 'Answer1',
                    'explanation': {
                        'content_id': 'solution',
                        'html': html_with_new_math_schema
                    }
                },
                'answer_groups': [answer_group_with_new_math_schema],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_with_new_math_schema
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {
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
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_new_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_new_math_schema
                        }
                    }]
            }
        }
        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_having_rule_spec_with_invalid_format(
            self):
        """Test the method for converting the HTML in a state
        when the rule_spec has invalid html format.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        answer_group_with_old_math_schema = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }, {
                'rule_type': 'ContainsAtLeastOneOf',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': html_with_old_math_schema
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': answer_group_with_old_math_schema,
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': (
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
                'customization_args': {
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    },
                    'choices': {
                        'value': [
                            '<p>init_state customization arg html 1</p>',
                            html_with_old_math_schema,
                            '<p>init_state customization arg html 3</p>',
                            '<p>init_state customization arg html 4</p>'
                        ]
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'ItemSelectionInput',
                'hints': []
            }
        }

        mock_html_field_types_to_rule_specs_dict = json.loads(
            utils.get_file_contents(
                feconf.HTML_FIELD_TYPES_TO_RULE_SPECS_FILE_PATH))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            html_type_dict['format'] = 'invalid format'

        def mock_get_file_contents(unused_file_path):
            return json.dumps(mock_html_field_types_to_rule_specs_dict)

        with self.swap(utils, 'get_file_contents', mock_get_file_contents):
            with self.assertRaisesRegexp(
                Exception,
                'The rule spec does not belong to a valid format.'):
                state_domain.State.convert_html_fields_in_state(
                    state_dict_with_old_math_schema,
                    html_validation_service.
                    add_math_content_to_math_rte_components)

    def test_convert_html_fields_in_rule_spec_with_invalid_input_variable(self):
        """Test the method for converting the HTML in a state
        when the rule_spec has invalid input variable.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        answer_group_with_old_math_schema = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }, {
                'rule_type': 'ContainsAtLeastOneOf',
                'inputs': {
                    'x': [html_with_old_math_schema]
                }
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': html_with_old_math_schema
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': answer_group_with_old_math_schema,
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': (
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
                'customization_args': {
                    'maxAllowableSelectionCount': {
                        'value': 1
                    },
                    'minAllowableSelectionCount': {
                        'value': 1
                    },
                    'choices': {
                        'value': [
                            '<p>init_state customization arg html 1</p>',
                            html_with_old_math_schema,
                            '<p>init_state customization arg html 3</p>',
                            '<p>init_state customization arg html 4</p>'
                        ]
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'ItemSelectionInput',
                'hints': []
            }
        }

        mock_html_field_types_to_rule_specs_dict = json.loads(
            utils.get_file_contents(
                feconf.HTML_FIELD_TYPES_TO_RULE_SPECS_FILE_PATH))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            if html_type_dict['interactionId'] == 'ItemSelectionInput':
                html_type_dict['ruleTypes']['Equals']['htmlInputVariables'] = (
                    ['y'])

        def mock_get_file_contents(unused_file_path):
            return json.dumps(mock_html_field_types_to_rule_specs_dict)

        with self.swap(utils, 'get_file_contents', mock_get_file_contents):
            with self.assertRaisesRegexp(
                Exception,
                'Rule spec should have at least one valid input variable with '
                'Html in it.'):
                state_domain.State.convert_html_fields_in_state(
                    state_dict_with_old_math_schema,
                    html_validation_service.
                    add_math_content_to_math_rte_components)

    def test_convert_html_fields_in_rule_spec_with_invalid_correct_answer(self):
        """Test the method for converting the HTML in a state when the
        interaction solution has invalid answer type.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': html_with_old_math_schema
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': {
                    'interaction_id': '',
                    'answer_is_exclusive': True,
                    'correct_answer': 'Answer1',
                    'explanation': {
                        'content_id': 'solution',
                        'html': html_with_old_math_schema
                    }
                },
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_with_old_math_schema
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {
                    'rows': {
                        'value': 1
                    },
                    'placeholder': {
                        'value': ''
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_old_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_old_math_schema
                        }
                    }
                ]
            }
        }

        mock_html_field_types_to_rule_specs_dict = json.loads(
            utils.get_file_contents(
                feconf.HTML_FIELD_TYPES_TO_RULE_SPECS_FILE_PATH))
        mock_html_field_types_to_rule_specs_dict['NormalizedString'] = (
            mock_html_field_types_to_rule_specs_dict.pop('SetOfHtmlString'))

        def mock_get_file_contents(unused_file_path):
            return json.dumps(mock_html_field_types_to_rule_specs_dict)

        with self.swap(utils, 'get_file_contents', mock_get_file_contents):
            with self.assertRaisesRegexp(
                Exception,
                'The solution does not have a valid '
                'correct_answer type.'):
                state_domain.State.convert_html_fields_in_state(
                    state_dict_with_old_math_schema,
                    html_validation_service.
                    add_math_content_to_math_rte_components)

    def test_convert_html_fields_in_state_when_interaction_is_none(self):
        """Test the method for converting all the HTML in a state having
        no interaction.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        html_with_new_math_schema = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        state_dict_with_old_math_schema = {
            'content': {
                'content_id': 'content', 'html': html_with_old_math_schema
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_with_old_math_schema
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': None,
                'confirmed_unclassified_answers': [],
                'id': None,
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_old_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_old_math_schema
                        }
                    }]
            }
        }

        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': html_with_new_math_schema
            },
            'param_changes': [],
            'content_ids_to_audio_translations': {'content': {}},
            'solicit_answer_details': False,
            'classifier_model_id': None,
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_with_new_math_schema
                    },
                    'dest': 'Introduction',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': None,
                'confirmed_unclassified_answers': [],
                'id': None,
                'hints': [
                    {
                        'hint_content': {
                            'content_id': 'hint_1',
                            'html': html_with_new_math_schema
                        }
                    },
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': html_with_new_math_schema
                        }
                    }]
            }
        }
        solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': html_with_old_math_schema
            }
        }
        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components),
            state_dict_with_new_math_schema)
        # Assert that no action is performed on a solution dict when the
        # interaction ID is None.
        self.assertEqual(
            state_domain.Solution.convert_html_in_solution(
                None, solution_dict,
                html_validation_service.
                add_math_content_to_math_rte_components), solution_dict)

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

    def test_subtitled_unicode_validation_with_invalid_html_type(self):
        """Test validation of subtitled unicode with invalid unicode type."""
        subtitled_unicode = state_domain.SubtitledUnicode(
            'content_id', 'some string')
        subtitled_unicode.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid content unicode'
            ):
            with self.swap(subtitled_unicode, 'unicode_str', 20):
                subtitled_unicode.validate()

    def test_subtitled_unicode_validation_with_invalid_content(self):
        """Test validation of subtitled unicode with invalid content."""
        subtitled_unicode = state_domain.SubtitledUnicode(
            'content_id', 'some html string')
        subtitled_unicode.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected content id to be a string, ' +
            'received 20'):
            with self.swap(subtitled_unicode, 'content_id', 20):
                subtitled_unicode.validate()

    def test_voiceover_validation(self):
        """Test validation of voiceover."""
        audio_voiceover = state_domain.Voiceover('a.mp3', 20, True, 24.5)
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
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected duration_secs to be a float'
            ):
            with self.swap(audio_voiceover, 'duration_secs', 'test'):
                audio_voiceover.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected duration_secs to be a float'
            ):
            with self.swap(audio_voiceover, 'duration_secs', 10):
                audio_voiceover.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected duration_secs to be positive number, '
            'or zero if not yet specified'
            ):
            with self.swap(audio_voiceover, 'duration_secs', -3.45):
                audio_voiceover.validate()

    def test_written_translation_validation(self):
        """Test validation of translation script."""
        written_translation = state_domain.WrittenTranslation(
            'html', 'Test.', True)
        written_translation.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid translation'):
            with self.swap(written_translation, 'translation', 30):
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
        self.set_interaction_for_state(init_state, 'TextInput')
        exploration.validate()

        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
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
            init_state.interaction.id, solution_dict
        )
        init_state.update_interaction_solution(solution)
        exploration.validate()

        hints_list.append(
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_2', '<p>new hint</p>')
            )
        )
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(
            init_state.interaction.hints[1].hint_content.html,
            '<p>new hint</p>')

        hints_list.append(
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_3', '<p>hint three</p>')
            )
        )
        init_state.update_interaction_hints(hints_list)

        del hints_list[1]
        init_state.update_interaction_hints(hints_list)

        self.assertEqual(len(init_state.interaction.hints), 2)
        exploration.validate()

    def test_update_customization_args_with_non_unique_content_ids(self):
        """Test that update customization args throws an error when passed
        customization args with non-unique content ids.
        """
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'MultipleChoiceInput')
        with self.assertRaisesRegexp(
            Exception,
            'All customization argument content_ids should be unique.'
        ):
            init_state.update_interaction_customization_args({
                'choices': {
                    'value': [{
                        'content_id': 'non-unique-content-id',
                        'html': '1'
                    }, {
                        'content_id': 'non-unique-content-id',
                        'html': '2'
                    }]
                },
                'showChoicesInShuffledOrder': {'value': True}
            })

    def test_solution_validation(self):
        """Test validation of state solution."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        exploration.objective = 'Objective'
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'TextInput')
        exploration.validate()

        # Solution should be set to None as default.
        self.assertEqual(init_state.interaction.solution, None)

        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '')
            )
        ]
        init_state.update_interaction_hints(hints_list)
        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': [0, 0],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }

        # Object type of answer must match that of correct_answer.
        with self.assertRaisesRegexp(
            AssertionError, r'Expected unicode string, received \[0, 0\]'):
            init_state.interaction.solution = (
                state_domain.Solution.from_dict(
                    init_state.interaction.id, solution_dict))

        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        init_state.update_interaction_solution(
            state_domain.Solution.from_dict(
                init_state.interaction.id, solution_dict))
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
        self.set_interaction_for_state(init_state, 'Continue')
        self.assertEqual(init_state.interaction.id, 'Continue')
        exploration.validate()
        with self.assertRaisesRegexp(
            utils.ValidationError, 'The Continue interaction does not ' +
            'support soliciting answer details from learners.'):
            with self.swap(init_state, 'solicit_answer_details', True):
                exploration.validate()
        self.set_interaction_for_state(init_state, 'TextInput')
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

        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '')
            )
        ]
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(solution)
        exploration.validate()

        solution_dict = {
            'answer_is_exclusive': 1,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
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
            'tagged_skill_misconception_id': None
        }

        exploration.init_state.update_interaction_answer_groups(
            [answer_group_dict])
        exploration.init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'feedback_1',
                'html': '<p>Feedback</p>'
            }))

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id feedback_1'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_default_outcome(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml('default_outcome', ''),
            False, [], None, None
        )
        exploration.init_state.update_interaction_default_outcome(
            default_outcome
        )
        exploration.init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'default_outcome',
                'html': ''
            }))

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id default_outcome'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_hints(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>some html</p>')
            )
        ]

        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'hint_1',
                'html': ''
            }))

        with self.assertRaisesRegexp(
            Exception, 'Found a duplicate content id hint_1'):
            exploration.init_state.validate(None, True)

    def test_validate_duplicate_content_id_with_solution(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        subtitled_html = state_domain.SubtitledHtml('content_id', 'some html')

        hints_list = [state_domain.Hint(subtitled_html)]

        exploration.init_state.interaction.hints = hints_list
        solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_solution(solution)
        exploration.init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'solution',
                'html': ''
                }))

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
        old_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>')
            )
        ]
        new_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state2</p>')
            )
        ]

        exploration.init_state.update_interaction_hints(old_hints_list)

        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Test!</p>',
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
        old_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>')
            )
        ]
        new_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state2</p>')
            )
        ]

        exploration.init_state.update_interaction_hints(old_hints_list)

        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 8.1
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
        old_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>')
            )
        ]
        new_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state2</p>')
            )
        ]

        exploration.init_state.update_interaction_hints(old_hints_list)

        written_translations_dict = {
            'translations_mapping': {
                'hint_2': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Test!</p>',
                        'needs_update': True
                    }
                },
                'hint_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>Test1!</p>',
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
        old_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>')
            )
        ]
        new_hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state2</p>')
            )
        ]

        exploration.init_state.update_interaction_hints(old_hints_list)

        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'hint_1': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 6.1
                    }
                },
                'hint_2': {
                    'en': {
                        'filename': 'filename4.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 7.5
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
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>')
            )
        ]
        solution_dict = {
            'answer_is_exclusive': True,
            'correct_answer': u'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': u'<p>hello_world is a string</p>'
            }
        }
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(solution)

        self.assertEqual(
            exploration.init_state.interaction.solution.to_dict(),
            solution_dict)

        with self.assertRaisesRegexp(
            Exception, 'Expected solution to be a Solution object,'
            'recieved test string'):
            exploration.init_state.update_interaction_solution('test string')

    def test_update_interaction_solution_with_no_solution(self):
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>'
                )
            )
        ]

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
            'tagged_skill_misconception_id': None
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
            'tagged_skill_misconception_id': None
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
            'tagged_skill_misconception_id': None
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
            'tagged_skill_misconception_id': None
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
            'tagged_skill_misconception_id': None
        }]
        exploration.init_state.update_interaction_answer_groups(answer_groups)

        with logging_swap, self.assertRaisesRegexp(KeyError, 'u\'x\''):
            (
                exploration.init_state.interaction.answer_groups[0]
                .rule_specs[0].validate([], {})
            )

        self.assertEqual(
            observed_log_messages,
            [
                'RuleSpec \'Contains\' has inputs which are not recognized '
                'parameter names: set([u\'x\'])'
            ]
        )


class WrittenTranslationsDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on written transcripts."""

    def test_from_and_to_dict_wroks_correctly(self):
        written_translations_dict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello',
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
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

    def test_get_translated_content_in_non_existing_language_raise_error(self):
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': '<p> In English.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        translated_content = written_translations.get_translated_content(
            'content', 'en')
        self.assertEqual(translated_content, '<p> In English.</p>')

        with self.assertRaisesRegexp(
            Exception, 'Translation for the given content_id content does not '
            'exist in hi language code'):
            written_translations.get_translated_content('content', 'hi')

    def test_get_translated_content_for_invalid_content_id_raise_error(self):
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': '<p> In English.</p>',
                        'needs_update': False
                    }
                }
            }
        })
        translated_content = written_translations.get_translated_content(
            'content', 'en')
        self.assertEqual(translated_content, '<p> In English.</p>')

        with self.assertRaisesRegexp(
            Exception, 'Invalid content_id: invalid_id'):
            written_translations.get_translated_content('invalid_id', 'hi')

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
                        'data_format': 'html',
                        'translation': 'hello!',
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
                        'data_format': 'html',
                        'translation': 'hello!',
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

    def test_validation_with_invalid_type_language_code_raise_error(self):
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    123: {
                        'data_format': 'html',
                        'translation': 'hello!',
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

    def test_validation_with_unknown_language_code_raise_error(self):
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'ed': {
                        'data_format': 'html',
                        'translation': 'hello!',
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
                        'data_format': 'html',
                        'translation': '<p>hello!</p>',
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
            written_translations.validate([b'invalid_content'])

    def test_get_content_ids_that_are_correctly_translated(self):
        written_translations_dict = {
            'translations_mapping': {
                'content': {},
                'hint_1': {}
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        self.assertEqual(
            written_translations.get_content_ids_that_are_correctly_translated(
                'hi'), [])

    def test_get_content_ids_that_are_correctly_translated_with_some_existing_translations(self): # pylint: disable=line-too-long
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>hello!</p>',
                        'needs_update': False
                    }
                },
                'hint_1': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        self.assertEqual(
            written_translations.get_content_ids_that_are_correctly_translated(
                'hi'), ['content'])

    def test_get_content_ids_that_are_correctly_translated_with_some_existing_translations_needs_update(self): # pylint: disable=line-too-long
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>hello!</p>',
                        'needs_update': True
                    }
                },
                'hint_1': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        self.assertEqual(
            written_translations.get_content_ids_that_are_correctly_translated(
                'hi'), [])


class RecordedVoiceoversDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on recorded voiceovers."""

    def test_from_and_to_dict_wroks_correctly(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content1': {
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': True,
                        'duration_secs': 1.1
                    },
                    'hi': {
                        'filename': 'abc.mp3',
                        'file_size_bytes': 1234,
                        'needs_update': False,
                        'duration_secs': 1.3
                    }
                },
                'feedback_1': {
                    'hi': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False,
                        'duration_secs': 1.1
                    },
                    'en': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False,
                        'duration_secs': 1.3
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
                        'needs_update': False,
                        'duration_secs': 1.1
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
                        'needs_update': False,
                        'duration_secs': 1.1
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

    def test_validation_with_invalid_type_language_code_raise_error(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    123: {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False,
                        'duration_secs': 1.1
                    }
                }
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)

        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be a string, '):
            recorded_voiceovers.validate(['content'])

    def test_validation_with_unknown_language_code_raise_error(self):
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'ed': {
                        'filename': 'xyz.mp3',
                        'file_size_bytes': 123,
                        'needs_update': False,
                        'duration_secs': 1.1
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
                        'needs_update': False,
                        'duration_secs': 1.1
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
            recorded_voiceovers.validate([b'invalid_content'])


class VoiceoverDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(VoiceoverDomainTests, self).setUp()
        self.voiceover = state_domain.Voiceover('filename.mp3', 10, False, 15.0)

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
                'extensions: %s'
                % list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()))):
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

    def test_validate_float_duration_secs(self):
        self.voiceover.validate()
        self.voiceover.duration_secs = 'duration_secs'
        with self.assertRaisesRegexp(
            Exception, 'Expected duration_secs to be a float'):
            self.voiceover.validate()

    def test_validate_int_duration_secs(self):
        self.voiceover.validate()
        self.voiceover.duration_secs = 10
        with self.assertRaisesRegexp(
            Exception, 'Expected duration_secs to be a float'):
            self.voiceover.validate()

    def test_validate_negative_duration_seconds(self):
        self.voiceover.validate()
        self.voiceover.duration_secs = -1.45
        with self.assertRaisesRegexp(
            Exception, 'Expected duration_secs to be positive number, '
            'or zero if not yet specified'):
            self.voiceover.validate()
