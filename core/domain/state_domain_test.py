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

from __future__ import annotations

import contextlib
import copy
import logging
import os
import re

from core import feconf
from core import schema_utils
from core import utils
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import html_validation_service
from core.domain import interaction_registry
from core.domain import rules_registry
from core.domain import state_domain
from core.domain import translatable_object_registry
from core.domain import translation_domain
from core.tests import test_utils
from extensions.interactions import base

from typing import Dict, List, Optional, Tuple, Type, Union


class StateDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on states."""

    def setUp(self) -> None:
        super().setUp()
        translation_dict = {
            'content_id_3': translation_domain.TranslatedContent(
                'My name is Nikhil.', True)
        }
        self.dummy_entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

    def test_get_all_html_in_exploration_with_drag_and_drop_interaction(
        self
    ) -> None:
        """Test the method for extracting all the HTML from a state having
        DragAndDropSortInput interaction.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_customization_args_dict: Dict[
            str, Dict[str, Union[List[Dict[str, str]], bool]]
        ] = {
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
                'value': True
            }
        }
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>State Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [['<p>IsEqualToOrdering rule_spec htmls</p>']]
                    }),
                state_domain.RuleSpec(
                    'HasElementXAtPositionY',
                    {
                        'x': '<p>HasElementXAtPositionY rule_spec '
                             'html</p>',
                        'y': 2
                    }),
                state_domain.RuleSpec(
                    'HasElementXBeforeElementY',
                    {
                        'x': '<p>x input for HasElementXAtPositionY '
                             'rule_spec </p>',
                        'y': '<p>y input for HasElementXAtPositionY '
                             'rule_spec </p>'
                    }),
                state_domain.RuleSpec(
                    'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                    {
                        'x': [[(
                            '<p>IsEqualToOrderingWithOneItemAtIncorrectPos'
                            'ition rule_spec htmls</p>')
                              ]]
                    })
            ],
            [],
            None
        )
        state_solution_dict: state_domain.SolutionDict = {
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
        state_written_translations_dict: (
            state_domain.WrittenTranslationsDict
        ) = {
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
        state.update_next_content_id_index(4)
        state.update_interaction_hints(state_hint_list)

        # Ruling out the possibility of None for mypy type checking.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        state.update_interaction_answer_groups(
            [state_answer_group])
        state.update_written_translations(
            state_domain.WrittenTranslations.from_dict(
                state_written_translations_dict))

        exp_services.save_new_exploration('owner_id', exploration)

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        def mock_get_interaction_by_id(
            cls: Type[interaction_registry.Registry],
            interaction_id: str
        ) -> base.BaseInteraction:
            interaction = copy.deepcopy(cls._interactions[interaction_id]) # pylint: disable=protected-access
            interaction.answer_type = 'ListOfSetsOfHtmlStrings'
            return interaction

        rules_registry_swap = self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs))

        interaction_registry_swap = self.swap(
            interaction_registry.Registry, 'get_interaction_by_id',
            classmethod(mock_get_interaction_by_id))

        with rules_registry_swap, interaction_registry_swap:
            html_list = state.get_all_html_content_strings()

        self.assertItemsEqual(
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

    def test_get_all_html_in_exploration_with_text_input_interaction(
        self
    ) -> None:
        """Test the method for extracting all the HTML from a state having
        TextInput interaction.
        """

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

    def test_get_all_html_in_exploration_with_item_selection_interaction(
        self
    ) -> None:
        """Test the method for extracting all the HTML from a state having
        ItemSelectionInput interaction.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']

        state_content_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_customization_args_dict: Dict[
            str, Dict[str, Union[List[Dict[str, str]], int]]
        ] = {
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
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback', '<p>state outcome html</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>Equals rule_spec html</p>']
                    }),
                state_domain.RuleSpec(
                    'ContainsAtLeastOneOf',
                    {
                        'x': ['<p>ContainsAtLeastOneOf rule_spec html</p>']
                    }),
                state_domain.RuleSpec(
                    'IsProperSubsetOf',
                    {
                        'x': ['<p>IsProperSubsetOf rule_spec html</p>']
                    }),
                state_domain.RuleSpec(
                    'DoesNotContainAtLeastOneOf',
                    {
                        'x': ['<p>DoesNotContainAtLeastOneOf rule_'
                              'spec html</p>']
                    })
            ],
            [],
            None
        )
        state_solution_dict: state_domain.SolutionDict = {
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
        state.update_interaction_answer_groups([state_answer_group])
        state.update_interaction_customization_args(
            state_customization_args_dict)
        state.update_next_content_id_index(4)
        state.update_interaction_hints(state_hint_list)

        # Ruling out the possibility of None for mypy type checking.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        exp_services.save_new_exploration('owner_id', exploration)

        mock_html_field_types_to_rule_specs_dict = (
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        def mock_get_interaction_by_id(
            cls: Type[interaction_registry.Registry],
            interaction_id: str
        ) -> base.BaseInteraction:
            interaction = copy.deepcopy(cls._interactions[interaction_id]) # pylint: disable=protected-access
            interaction.answer_type = 'SetOfHtmlString'
            interaction.can_have_solution = True
            return interaction

        rules_registry_swap = self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs))

        interaction_registry_swap = self.swap(
            interaction_registry.Registry, 'get_interaction_by_id',
            classmethod(mock_get_interaction_by_id))

        with rules_registry_swap, interaction_registry_swap:
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

    def test_rule_spec_with_invalid_html_format(self) -> None:
        """Test the method for extracting all the HTML from a state
        when the rule_spec has invalid html format.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback', '<p>state outcome html</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>Equals rule_spec html</p>']
                    }),
                state_domain.RuleSpec(
                    'ContainsAtLeastOneOf',
                    {
                        'x': ['<p>ContainsAtLeastOneOf rule_spec html</p>']

                    }),
                state_domain.RuleSpec(
                    'IsProperSubsetOf',
                    {
                        'x': ['<p>IsProperSubsetOf rule_spec html</p>']
                    }),
                state_domain.RuleSpec(
                    'DoesNotContainAtLeastOneOf',
                    {
                        'x': ['<p>DoesNotContainAtLeastOneOf rule_'
                              'spec html</p>']
                    })
            ],
            [],
            None
        )

        state.update_interaction_id('ItemSelectionInput')
        state.update_interaction_answer_groups([state_answer_group])

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            html_type_dict['format'] = 'invalid format'

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        with self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs)
        ):
            with self.assertRaisesRegex(
                Exception,
                'The rule spec does not belong to a valid format.'):
                state.get_all_html_content_strings()

    def test_update_customization_args_with_invalid_content_id(self) -> None:
        """Test the method for updating interaction customization arguments
        when a content_id is invalid (set to None).
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_customization_args_dict: Dict[
            str, Dict[str, Union[List[Dict[str, Optional[str]]], int]]
        ] = {
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
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected content id to be a string, received None'
        ):
            state.update_interaction_customization_args(
                state_customization_args_dict)

    def test_rule_spec_with_html_having_invalid_input_variable(self) -> None:
        """Test the method for extracting all the HTML from a state
        when the rule_spec has html but the input variable is invalid.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback', '<p>state outcome html</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>init_state customization arg html 1</p>']
                    })
            ],
            [],
            None
        )
        state_customization_args_dict: Dict[
            str, Dict[str, Union[List[Dict[str, str]], int]]
        ] = {
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
        state.update_interaction_answer_groups([state_answer_group])

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            if html_type_dict['interactionId'] == 'ItemSelectionInput':
                html_type_dict['ruleTypes']['Equals']['htmlInputVariables'] = (
                    ['y'])

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        with self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs)
        ):
            with self.assertRaisesRegex(
                Exception,
                'Rule spec should have at least one valid input variable with '
                'Html in it.'):
                state.get_all_html_content_strings()

    def test_get_all_html_when_solution_has_invalid_answer_type(self) -> None:
        """Test the method for extracting all the HTML from a state
        when the interaction has a solution but the answer_type for the
        corrent_answer is invalid.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state_customization_args_dict: Dict[
            str, Dict[str, Union[List[Dict[str, str]], bool]]
        ] = {
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

        state_solution_dict: state_domain.SolutionDict = {
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
        state.update_next_content_id_index(4)
        state.update_interaction_hints(state_hint_list)
        # Ruling out the possibility of None for mypy type checking.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        exp_services.save_new_exploration('owner_id', exploration)

        interaction = (
            interaction_registry.Registry.get_interaction_by_id(
                'DragAndDropSortInput'))
        interaction.answer_type = 'DragAndDropHtmlString'

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        with self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs)):
            with self.assertRaisesRegex(
                Exception,
                'The solution does not have a valid '
                'correct_answer type.'):
                state.get_all_html_content_strings()

    def test_get_all_html_when_interaction_is_none(self) -> None:
        """Test the method for extracting all the HTML from a state
        when the state has no interaction.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        state_content_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }

        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))

        exp_services.save_new_exploration('owner_id', exploration)
        html_list = state.get_all_html_content_strings()
        self.assertEqual(html_list, ['', '<p>state content html</p>'])

    def test_export_state_to_dict(self) -> None:
        """Test exporting a state to a dict."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['New state'])

        state_dict = exploration.states['New state'].to_dict()
        expected_dict: state_domain.StateDict = {
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
                    'dest_if_really_stuck': None,
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
            'linked_skill_id': None,
            'next_content_id_index': 0,
            'param_changes': [],
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {}
                }
            },
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {}
                }
            }
        }
        self.assertEqual(expected_dict, state_dict)

    def test_can_undergo_classification(self) -> None:
        """Test the can_undergo_classification() function."""
        exploration_id = 'eid'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
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

    def test_get_training_data(self) -> None:
        """Test retrieval of training data."""
        exploration_id = 'eid'
        test_exp_filepath = os.path.join(
            feconf.SAMPLE_EXPLORATIONS_DIR, 'classifier_demo_exploration.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
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

    def test_get_content_html_with_correct_state_name_returns_html(
        self
    ) -> None:
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

    def test_rte_content_validation_for_android(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')

        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': (
                    '<oppia-noninteractive-collapsible content-with-value='
                    '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;'
                    'quot;" heading-with-value="&amp;quot;SubCollapsible&amp;'
                    'quot;"></oppia-noninteractive-collapsible><p>&nbsp;</p>')
            },
        }

        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict
        )
        init_state.update_interaction_solution(solution)
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        solution_dict['explanation']['html'] = ''
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.id is not None
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
            'Introduction', None, state_domain.SubtitledHtml(
                'default_outcome', (
                    '<oppia-noninteractive-collapsible content-with-value='
                    '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;'
                    'quot;" heading-with-value="&amp;quot;Sub&amp;quot;">'
                    '</oppia-noninteractive-collapsible><p>&nbsp;</p>')),
            False, [], None, None
        )

        init_state.update_interaction_default_outcome(default_outcome)
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        default_outcome.feedback.html = ''
        init_state.update_interaction_default_outcome(default_outcome)
        self.assertTrue(init_state.is_rte_content_supported_on_android())

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', (
                        '<oppia-noninteractive-tabs tab_contents-with-value'
                        '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p'
                        '&amp;gt;&amp;lt;i&amp;gt;lorem ipsum&amp;lt;/i&amp;'
                        'gt;&amp;lt;/p&amp;gt;&amp;quot;,&amp;quot;title&amp;'
                        'quot;:&amp;quot;hello&amp;quot;}]\">'
                        '</oppia-noninteractive-tabs>')),
                False, [], None, None),
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
            None
        )

        init_state.update_interaction_answer_groups(
            [state_answer_group])
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        state_answer_group.outcome.feedback.html = (
            '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
            '&amp;quot;" filepath-with-value="&amp;quot;startBlue.png&amp;'
            'quot;" alt-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-image></p>')
        init_state.update_interaction_answer_groups(
            [state_answer_group])
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
        self.assertFalse(init_state.is_rte_content_supported_on_android())
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': (
                    '<p><oppia-noninteractive-skillreview text-with-value="'
                    '&amp;quot;&amp;quot;" skill_id-with-value="&amp;quot;'
                    '&amp;quot;"></oppia-noninteractive-skillreview></p>')
            }))
        self.assertTrue(init_state.is_rte_content_supported_on_android())

    def test_interaction_validation_for_android(self) -> None:
        _checked_interaction_ids = set()

        def _create_init_state_for_interaction_verification(
        ) -> state_domain.State:
            """Creates an init state for interaction verification."""
            exploration = (
                exp_domain.Exploration.create_default_exploration('0'))
            state: state_domain.State = (
                exploration.states[exploration.init_state_name]
            )
            return state

        def _verify_interaction_supports_android(
            self: StateDomainUnitTests, interaction_id: Optional[str]
        ) -> None:
            """Checks that the provided interaction is supported on Android."""
            init_state = _create_init_state_for_interaction_verification()
            init_state.update_interaction_id(interaction_id)
            self.assertTrue(
                init_state.interaction.is_supported_on_android_app())
            _checked_interaction_ids.add(interaction_id)

        def _verify_interaction_does_not_support_android(
            self: StateDomainUnitTests, interaction_id: str
        ) -> None:
            """Checks that the provided interaction is not supported on
            Android.
            """
            init_state = _create_init_state_for_interaction_verification()
            init_state.update_interaction_id(interaction_id)
            self.assertFalse(
                init_state.interaction.is_supported_on_android_app())
            _checked_interaction_ids.add(interaction_id)

        def _verify_all_interaction_ids_checked(
            self: StateDomainUnitTests
        ) -> None:
            """Verifies that all the interaction ids are checked."""
            all_interaction_ids = set(
                interaction_registry.Registry.get_all_interaction_ids())
            missing_interaction_ids = (
                all_interaction_ids - _checked_interaction_ids)
            self.assertFalse(missing_interaction_ids)

        _verify_interaction_supports_android(self, 'AlgebraicExpressionInput')
        _verify_interaction_supports_android(self, 'Continue')
        _verify_interaction_supports_android(self, 'DragAndDropSortInput')
        _verify_interaction_supports_android(self, 'EndExploration')
        _verify_interaction_supports_android(self, 'FractionInput')
        _verify_interaction_supports_android(self, 'ImageClickInput')
        _verify_interaction_supports_android(self, 'ItemSelectionInput')
        _verify_interaction_supports_android(self, 'MathEquationInput')
        _verify_interaction_supports_android(self, 'MultipleChoiceInput')
        _verify_interaction_supports_android(self, 'NumberWithUnits')
        _verify_interaction_supports_android(self, 'NumericInput')
        _verify_interaction_supports_android(self, 'TextInput')
        _verify_interaction_supports_android(self, 'NumericExpressionInput')
        _verify_interaction_supports_android(self, 'RatioExpressionInput')
        _verify_interaction_supports_android(self, None)

        _verify_interaction_does_not_support_android(self, 'CodeRepl')
        _verify_interaction_does_not_support_android(self, 'GraphInput')
        _verify_interaction_does_not_support_android(self, 'InteractiveMap')
        _verify_interaction_does_not_support_android(self, 'MusicNotesInput')
        _verify_interaction_does_not_support_android(self, 'PencilCodeEditor')
        _verify_interaction_does_not_support_android(self, 'SetInput')

        _verify_all_interaction_ids_checked(self)

    def test_get_content_html_with_invalid_content_id_raise_error(self) -> None:
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

        with self.assertRaisesRegex(
            ValueError, 'Content ID Invalid id does not exist'):
            init_state.get_content_html('Invalid id')

    def test_get_content_id_mapping_needing_translations_with_existing_translations(  # pylint: disable=line-too-long
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
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

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'), False, [], None, None),
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
            None
        )

        init_state.update_interaction_answer_groups(
            [state_answer_group])
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
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
        init_state.update_interaction_solution(solution)

        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

        content_id_mapping_needing_translations = (
            init_state.get_content_id_mapping_needing_translations('hi'))
        self.assertEqual(
            content_id_mapping_needing_translations[
                'hint_1'
            ].content,
            '<p>hint one</p>'
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'solution'
            ].content,
            '<p>hello_world is a string</p>'
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'feedback_1'
            ].content,
            '<p>Feedback</p>',
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'default_outcome'
            ].content,
            '<p>The default outcome.</p>'
        )

    def test_get_content_id_mapping_needing_translations_with_interaction_translations(  # pylint: disable=line-too-long
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        init_state.update_interaction_id('TextInput')
        state_interaction_cust_args: Dict[
            str, Dict[str, Union[Dict[str, str], int]]
        ] = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': 'Placeholder'
                }
            },
            'rows': {'value': 1}
        }
        init_state.update_interaction_customization_args(
            state_interaction_cust_args)

        default_outcome = state_domain.Outcome(
            'Introduction', None, state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None
        )

        init_state.update_interaction_default_outcome(default_outcome)
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    })
            ],
            [],
            None
        )

        init_state.update_interaction_answer_groups(
            [state_answer_group])
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
            )
        ]
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
        init_state.update_interaction_solution(solution)

        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {},
                'hint_1': {},
                'default_outcome': {},
                'solution': {},
                'feedback_1': {},
                'ca_placeholder_0': {},
                'rule_input_4': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        init_state.update_written_translations(written_translations)

        content_id_mapping_needing_translations = (
            init_state.get_content_id_mapping_needing_translations('hi'))
        self.assertEqual(
            content_id_mapping_needing_translations[
                'hint_1'
            ].content,
            '<p>hint one</p>'
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'solution'
            ].content,
            '<p>hello_world is a string</p>'
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'feedback_1'
            ].content,
            '<p>Feedback</p>'
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'default_outcome'
            ].content,
            '<p>The default outcome.</p>'
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'content'
            ].content,
            '<p>This is content</p>',
        )
        self.assertEqual(
            content_id_mapping_needing_translations[
                'ca_placeholder_0'
            ].content,
            'Placeholder'
        )
        rule_translatable_item = content_id_mapping_needing_translations[
            'rule_input_4'
        ]
        self.assertEqual(rule_translatable_item.content, ['Input1', 'Input2'])
        self.assertEqual(rule_translatable_item.interaction_id, 'TextInput')
        self.assertEqual(rule_translatable_item.rule_type, 'Contains')

    def test_get_content_id_mapping_needing_translations_for_set_input_rule(
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        init_state.update_interaction_id('SetInput')

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'unicodeStrSet': ['Input1', 'Input2']
                            }
                    })
            ],
            [],
            None
        )
        init_state.update_interaction_answer_groups(
            [state_answer_group])

        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {},
                'feedback_1': {},
                'rule_input_4': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        init_state.update_written_translations(written_translations)

        content_id_mapping_needing_translations = (
            init_state.get_content_id_mapping_needing_translations('hi'))
        rule_translatable_item = content_id_mapping_needing_translations[
            'rule_input_4'
        ]
        self.assertEqual(rule_translatable_item.content, ['Input1', 'Input2'])
        self.assertEqual(rule_translatable_item.interaction_id, 'SetInput')
        self.assertEqual(rule_translatable_item.rule_type, 'Equals')

    def test_get_content_id_mapping_needing_translations_does_not_return_numeric_content(  # pylint: disable=line-too-long
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        init_state = exploration.states[exploration.init_state_name]
        # Set the content.
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))
        # Set the multiple choice interaction.
        init_state.update_interaction_id('MultipleChoiceInput')
        state_interaction_cust_args: state_domain.CustomizationArgsDictType = {
            'showChoicesInShuffledOrder': {
                'value': True
            },
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': '\u003cp\u003eoption 1\u003c/p\u003e'
                    },
                    {
                        'content_id': 'ca_choices_1',
                        'html': '1,000'
                    },
                    {
                        'content_id': 'ca_choices_2',
                        'html': '100'
                    },
                    {
                        'content_id': 'ca_choices_3',
                        'html': '<p>1,000</p>'
                    },
                    {
                        'content_id': 'ca_choices_4',
                        'html': '<p>100</p>'
                    }
                ]
            }
        }
        init_state.update_interaction_customization_args(
            state_interaction_cust_args)
        # Set the default outcome.
        default_outcome = state_domain.Outcome(
            'Introduction', None, state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None
        )
        init_state.update_interaction_default_outcome(default_outcome)
        # Set the translations.
        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {},
                'default_outcome': {},
                'ca_choices_0': {},
                'ca_choices_1': {},
                'ca_choices_2': {},
                'ca_choices_3': {},
                'ca_choices_4': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        init_state.update_written_translations(written_translations)

        # Choice 2 and 4 should not be returned as its value is numeric.
        content_id_mapping_needing_translations = (
            init_state.get_content_id_mapping_needing_translations('hi'))
        self.assertEqual(
            content_id_mapping_needing_translations[
                'content'
            ].content, '<p>This is content</p>')
        self.assertEqual(
            content_id_mapping_needing_translations[
                'default_outcome'
            ].content, '<p>The default outcome.</p>')
        self.assertEqual(
            content_id_mapping_needing_translations[
                'ca_choices_0'
            ].content, '\u003cp\u003eoption 1\u003c/p\u003e')
        self.assertEqual(
            content_id_mapping_needing_translations[
                'ca_choices_1'
            ].content, '1,000')
        self.assertFalse(
            'ca_choices_2' in content_id_mapping_needing_translations)
        self.assertEqual(
            content_id_mapping_needing_translations[
                'ca_choices_3'
            ].content, '<p>1,000</p>')
        self.assertFalse(
            'ca_choices_4' in content_id_mapping_needing_translations)

    def test_content_id_existance_checks_work_correctly(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        init_state = exploration.states[exploration.init_state_name]

        self.assertEqual(init_state.has_content_id('content'), True)
        with self.assertRaisesRegex(
            ValueError, 'Content ID content0 does not exist'):
            init_state.get_content_html('content0')
        self.assertEqual(init_state.has_content_id('content0'), False)

    def test_add_translation_works_correctly(self) -> None:
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

    def test_get_translation_counts_returns_correct_value(self) -> None:
        state = state_domain.State.create_default_state(None)
        state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            }))

        self.set_interaction_for_state(state, 'TextInput')

        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>hint one</p>'))]
        state.update_interaction_hints(hints_list)

        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }

        # Ruling out the possibility of None for mypy type checking.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, solution_dict)

        state.update_interaction_solution(solution)
        state.validate({}, True)
        state.add_translation('hint_1', 'hi', 'Some translation')
        state.add_translation('content', 'hi', 'Some translation')

        self.assertEqual(state.get_translation_counts(), {'hi': 2})

        # Adding interaction placeholder translation won't be reflected in
        # get_translation_counts method.
        state.add_translation('ca_placeholder_0', 'hi', 'Some translation')

        self.assertEqual(state.get_translation_counts(), {'hi': 2})

    def test_state_operations(self) -> None:
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
        with self.assertRaisesRegex(ValueError, 'Duplicate state name'):
            exploration.add_states(['State 2'])
        with self.assertRaisesRegex(ValueError, 'Duplicate state name'):
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
        with self.assertRaisesRegex(ValueError, 'Duplicate state name'):
            exploration.rename_state('State 2', 'END')

        # Ensure the other states are connected to END.
        # Ruling out the possibility of None for mypy type checking.
        assert (
            exploration.states['Renamed state'].interaction.default_outcome is
            not None
        )
        exploration.states[
            'Renamed state'].interaction.default_outcome.dest = 'State 2'
        assert (
            exploration.states['State 2'].interaction.default_outcome is
            not None
        )
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
        with self.assertRaisesRegex(
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

    def test_update_solicit_answer_details(self) -> None:
        """Test updating solicit_answer_details."""
        state = state_domain.State.create_default_state('state_1')
        self.assertEqual(state.solicit_answer_details, False)
        state.update_solicit_answer_details(True)
        self.assertEqual(state.solicit_answer_details, True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_update_solicit_answer_details_with_non_bool_fails(self) -> None:
        """Test updating solicit_answer_details with non bool value."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, False)
        with self.assertRaisesRegex(Exception, (
            'Expected solicit_answer_details to be a boolean, received')):
            init_state.update_solicit_answer_details('abc')  # type: ignore[arg-type]
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, False)

    def test_update_linked_skill_id(self) -> None:
        """Test updating linked_skill_id."""
        state = state_domain.State.create_default_state('state_1')
        self.assertEqual(state.linked_skill_id, None)
        state.update_linked_skill_id('string_2')
        self.assertEqual(state.linked_skill_id, 'string_2')

    def test_update_card_is_checkpoint(self) -> None:
        """Test update card_is_checkpoint."""
        state = state_domain.State.create_default_state('state_1')
        self.assertEqual(state.card_is_checkpoint, False)
        state.update_card_is_checkpoint(True)
        self.assertEqual(state.card_is_checkpoint, True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_update_card_is_checkpoint_with_non_bool_fails(self) -> None:
        """Test updating card_is_checkpoint with non bool value."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.card_is_checkpoint, True)
        with self.assertRaisesRegex(Exception, (
            'Expected card_is_checkpoint to be a boolean, received')):
            init_state.update_card_is_checkpoint('abc')  # type: ignore[arg-type]
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.card_is_checkpoint, True)

    def test_convert_html_fields_in_state_with_drag_and_drop_interaction(
        self
    ) -> None:
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
        written_translations_dict_with_old_math_schema: (
            state_domain.WrittenTranslationsDict
        ) = {
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

        answer_group_dict_with_old_math_schema: state_domain.AnswerGroupDict = {
            'outcome': {
                'dest': 'Introduction',
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
        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'next_content_id_index': 0,
            'written_translations': (
                written_translations_dict_with_old_math_schema)
        }

        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'next_content_id_index': 0,
            'written_translations': (
                written_translations_dict_with_new_math_schema)
        }
        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components,
                state_uses_old_rule_template_schema=True),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_with_item_selection_interaction(
        self
    ) -> None:
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
        answer_group_with_old_math_schema: List[
            state_domain.AnswerGroupDict
        ] = [{
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
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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

        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }

        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }
        interaction_registry.Registry.get_all_specs_for_state_schema_version(
            41)['ItemSelectionInput']['can_have_solution'] = True

        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components,
                state_uses_old_rule_template_schema=True),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_with_text_input_interaction(
        self
    ) -> None:
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
        answer_group_with_old_math_schema: state_domain.AnswerGroupDict = {
            'outcome': {
                'dest': 'Introduction',
                'dest_if_really_stuck': None,
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
                'dest_if_really_stuck': None,
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

        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': html_with_old_math_schema
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }

        state_dict_with_new_math_schema = {
            'content': {
                'content_id': 'content', 'html': html_with_new_math_schema
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }
        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_with_old_written_translations(
        self
    ) -> None:
        """Test the method for converting all the HTML in a state having
        written_translations in the old format. This is needed for converting
        older snapshots (prior to state schema version 35) properly.

        TODO(#11950): Remove this test once old schema migration functions are
        deleted.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        html_with_new_math_schema = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        # Here we use MyPy ignore because we are defining an older version
        # dictionary of WrittenTranslations that contains `html` key, but
        # the type of this dict is defined according to the latest version
        # of WrittenTranslations that do not contain 'html' key. So, due to
        # this conflict in presences of keys MyPy throws an error. Thus to
        # avoid the error, we used ignore here.
        written_translations_dict_with_old_math_schema_and_old_format: (
            state_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content1': {
                    'en': {  # type: ignore[typeddict-item]
                        'html': html_with_old_math_schema,
                        'needs_update': True
                    },
                    # Here we use MyPy ignore because we want to avoid the error
                    # that was generated when we are defining an older version
                    # Dict of WrittenTranslations with deprecated 'html' key.
                    'hi': {  # type: ignore[typeddict-item]
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    # Here we use MyPy ignore because we want to avoid the error
                    # that was generated when we are defining an older version
                    # Dict of WrittenTranslations with deprecated 'html' key.
                    'hi': {  # type: ignore[typeddict-item]
                        'html': html_with_old_math_schema,
                        'needs_update': False
                    },
                    # Here we use MyPy ignore because we want to avoid the error
                    # that was generated when we are defining an older version
                    # Dict of WrittenTranslations with deprecated 'html' key.
                    'en': {  # type: ignore[typeddict-item]
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        # Here we use MyPy ignore because we are defining an older version
        # dictionary of WrittenTranslations that contains `html` key, but
        # the type of this dict is defined according to the latest version
        # of WrittenTranslations that do not contain 'html' key. So, due to
        # this conflict in presences of keys MyPy throws an error. Thus to
        # avoid the error, we used ignore here.
        written_translations_dict_with_new_math_schema_and_old_format: (
            state_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content1': {
                    'en': {  # type: ignore[typeddict-item]
                        'html': html_with_new_math_schema,
                        'needs_update': True
                    },
                    # Here we use MyPy ignore because we want to avoid the error
                    # that was generated when we are defining an older version
                    # Dict of WrittenTranslations with deprecated 'html' key.
                    'hi': {  # type: ignore[typeddict-item]
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    # Here we use MyPy ignore because we want to avoid the error
                    # that was generated when we are defining an older version
                    # Dict of WrittenTranslations with deprecated 'html' key.
                    'hi': {  # type: ignore[typeddict-item]
                        'html': html_with_new_math_schema,
                        'needs_update': False
                    },
                    # Here we use MyPy ignore because we want to avoid the error
                    # that was generated when we are defining an older version
                    # Dict of WrittenTranslations with deprecated 'html' key.
                    'en': {  # type: ignore[typeddict-item]
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        answer_group_dict_with_old_math_schema: state_domain.AnswerGroupDict = {
            'outcome': {
                'dest': 'Introduction',
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
                    'x': [[html_with_old_math_schema]]
                },
                'rule_type': 'IsEqualToOrdering'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        answer_group_dict_with_new_math_schema: state_domain.AnswerGroupDict = {
            'outcome': {
                'dest': 'Introduction',
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
                    'x': [[html_with_new_math_schema]]
                },
                'rule_type': 'IsEqualToOrdering'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'next_content_id_index': 0,
            'written_translations': (
                written_translations_dict_with_old_math_schema_and_old_format)
        }

        state_dict_with_new_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'next_content_id_index': 0,
            'written_translations': (
                written_translations_dict_with_new_math_schema_and_old_format)
        }
        self.assertEqual(
            state_domain.State.convert_html_fields_in_state(
                state_dict_with_old_math_schema,
                html_validation_service.
                add_math_content_to_math_rte_components,
                state_uses_old_rule_template_schema=True),
            state_dict_with_new_math_schema)

    def test_convert_html_fields_in_state_having_rule_spec_with_invalid_format(
        self
    ) -> None:
        """Test the method for converting the HTML in a state
        when the rule_spec has invalid html format.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        answer_group_with_old_math_schema: List[
            state_domain.AnswerGroupDict
        ] = [{
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
                'dest_if_really_stuck': None,
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

        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            html_type_dict['format'] = 'invalid format'

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State],  # pylint: disable=unused-argument
            state_schema_version: Optional[int] = None  # pylint: disable=unused-argument
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        with self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs)):
            with self.assertRaisesRegex(
                Exception,
                'The rule spec does not belong to a valid format.'):
                state_domain.State.convert_html_fields_in_state(
                    state_dict_with_old_math_schema,
                    html_validation_service.
                    add_math_content_to_math_rte_components,
                    state_uses_old_rule_template_schema=True)

    def test_convert_html_fields_in_rule_spec_with_invalid_input_variable(
        self
    ) -> None:
        """Test the method for converting the HTML in a state
        when the rule_spec has invalid input variable.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        answer_group_with_old_math_schema: List[
            state_domain.AnswerGroupDict
        ] = [{
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
                'dest_if_really_stuck': None,
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

        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': 'Hello!'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))
        for html_type_dict in (
                mock_html_field_types_to_rule_specs_dict.values()):
            if html_type_dict['interactionId'] == 'ItemSelectionInput':
                html_type_dict['ruleTypes']['Equals']['htmlInputVariables'] = (
                    ['y'])

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        with self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs)
        ):
            with self.assertRaisesRegex(
                Exception,
                'Rule spec should have at least one valid input variable with '
                'Html in it.'):
                state_domain.State.convert_html_fields_in_state(
                    state_dict_with_old_math_schema,
                    html_validation_service.
                    add_math_content_to_math_rte_components)

    def test_convert_html_fields_in_rule_spec_with_invalid_correct_answer(
        self
    ) -> None:
        """Test the method for converting the HTML in a state when the
        interaction solution has invalid answer type.
        """
        html_with_old_math_schema = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        old_solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
            'html': html_with_old_math_schema
            }
        }

        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': html_with_old_math_schema
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
            'classifier_model_id': None,
            'interaction': {
                'solution': old_solution_dict,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_with_old_math_schema
                    },
                    'dest': 'Introduction',
                    'dest_if_really_stuck': None,
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }

        mock_html_field_types_to_rule_specs_dict = copy.deepcopy(
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))
        mock_html_field_types_to_rule_specs_dict['NormalizedString'] = (
            mock_html_field_types_to_rule_specs_dict.pop('SetOfHtmlString'))

        def mock_get_html_field_types_to_rule_specs(
            unused_cls: Type[state_domain.State]
        ) -> Dict[str, rules_registry.RuleSpecsExtensionDict]:
            return mock_html_field_types_to_rule_specs_dict

        with self.swap(
            rules_registry.Registry, 'get_html_field_types_to_rule_specs',
            classmethod(mock_get_html_field_types_to_rule_specs)
        ):
            with self.assertRaisesRegex(
                Exception,
                'The solution does not have a valid '
                'correct_answer type.'):
                state_domain.State.convert_html_fields_in_state(
                    state_dict_with_old_math_schema,
                    html_validation_service.
                    add_math_content_to_math_rte_components)

    def test_convert_html_fields_in_state_when_interaction_is_none(
        self
    ) -> None:
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

        state_dict_with_old_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': html_with_old_math_schema
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {},
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }

        state_dict_with_new_math_schema: state_domain.StateDict = {
            'content': {
                'content_id': 'content', 'html': html_with_new_math_schema
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
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
                    'dest_if_really_stuck': None,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {},
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
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'next_content_id_index': 0
        }
        solution_dict: state_domain.SolutionDict = {
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
        # Here we use MyPy ignore because for testing purposes here we are
        # not defining BaseInteractionDict's Key.
        self.assertEqual(
            state_domain.Solution.convert_html_in_solution(
                None, solution_dict,
                html_validation_service.
                add_math_content_to_math_rte_components,
                rules_registry.Registry.get_html_field_types_to_rule_specs(),
                {}  # type: ignore[typeddict-item]
            ), solution_dict)

    def test_subtitled_html_validation_with_invalid_html_type(self) -> None:
        """Test validation of subtitled HTML with invalid html type."""
        subtitled_html = state_domain.SubtitledHtml(
            'content_id', '<p>some html</p>')
        subtitled_html.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid content HTML'
            ):
            with self.swap(subtitled_html, 'html', 20):
                subtitled_html.validate()

    def test_subtitled_html_validation_with_invalid_content(self) -> None:
        """Test validation of subtitled HTML with invalid content."""
        subtitled_html = state_domain.SubtitledHtml(
            'content_id', '<p>some html</p>')
        subtitled_html.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected content id to be a string, ' +
            'received 20'):
            with self.swap(subtitled_html, 'content_id', 20):
                subtitled_html.validate()

    def test_subtitled_unicode_validation_with_invalid_html_type(self) -> None:
        """Test validation of subtitled unicode with invalid unicode type."""
        subtitled_unicode = state_domain.SubtitledUnicode(
            'content_id', 'some string')
        subtitled_unicode.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid content unicode'
            ):
            with self.swap(subtitled_unicode, 'unicode_str', 20):
                subtitled_unicode.validate()

    def test_subtitled_unicode_validation_with_invalid_content(self) -> None:
        """Test validation of subtitled unicode with invalid content."""
        subtitled_unicode = state_domain.SubtitledUnicode(
            'content_id', 'some html string')
        subtitled_unicode.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected content id to be a string, ' +
            'received 20'):
            with self.swap(subtitled_unicode, 'content_id', 20):
                subtitled_unicode.validate()

    def test_voiceover_validation(self) -> None:
        """Test validation of voiceover."""
        audio_voiceover = state_domain.Voiceover('a.mp3', 20, True, 24.5)
        audio_voiceover.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected audio filename to be a string'
        ):
            with self.swap(audio_voiceover, 'filename', 20):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid audio filename'
        ):
            with self.swap(audio_voiceover, 'filename', '.invalidext'):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid audio filename'
        ):
            with self.swap(audio_voiceover, 'filename', 'justanextension'):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid audio filename'
        ):
            with self.swap(audio_voiceover, 'filename', 'a.invalidext'):
                audio_voiceover.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected file size to be an int'
        ):
            with self.swap(audio_voiceover, 'file_size_bytes', 'abc'):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid file size'
        ):
            with self.swap(audio_voiceover, 'file_size_bytes', -3):
                audio_voiceover.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected needs_update to be a bool'
        ):
            with self.swap(audio_voiceover, 'needs_update', 'hello'):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected duration_secs to be a float'
        ):
            with self.swap(audio_voiceover, 'duration_secs', 'test'):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected duration_secs to be a float'
        ):
            with self.swap(audio_voiceover, 'duration_secs', '10'):
                audio_voiceover.validate()
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected duration_secs to be positive number, '
            'or zero if not yet specified'
        ):
            with self.swap(audio_voiceover, 'duration_secs', -3.45):
                audio_voiceover.validate()

    def test_written_translation_validation(self) -> None:
        """Test validation of translation script."""
        written_translation = state_domain.WrittenTranslation(
            'html', 'Test.', True)
        written_translation.validate()

        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode HTML string, received 30'):
            with self.swap(written_translation, 'translation', 30):
                written_translation.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected needs_update to be a bool'
        ):
            with self.swap(written_translation, 'needs_update', 20):
                written_translation.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid data_format'
        ):
            with self.swap(written_translation, 'data_format', 'int'):
                written_translation.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid data_format'
        ):
            with self.swap(written_translation, 'data_format', 2):
                written_translation.validate()

    def test_hints_validation(self) -> None:
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
        init_state.update_next_content_id_index(4)

        self.assertEqual(len(init_state.interaction.hints), 2)
        exploration.validate()

    def test_update_customization_args_with_non_unique_content_ids(
        self
    ) -> None:
        """Test that update customization args throws an error when passed
        customization args with non-unique content ids.
        """
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'MultipleChoiceInput')
        with self.assertRaisesRegex(
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

    def test_solution_validation(self) -> None:
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

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': [0, 0],  # type: ignore[typeddict-item]
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }

        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.id is not None
        # Object type of answer must match that of correct_answer.
        with self.assertRaisesRegex(
            AssertionError,
            re.escape('Expected unicode string, received [0, 0]')
        ):
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

    def test_validate_state_unique_content_ids(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('MultipleChoiceInput')
        init_state.update_interaction_customization_args({
            'choices': {
                'value': [{
                    'content_id': '',
                    'html': 'one'
                }]
            },
            'showChoicesInShuffledOrder': {'value': True}
        })

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected all content_ids to be unique, received'
        ):
            value = init_state.interaction.customization_args['choices'].value
            # Ruling out the possibility of any other type for mypy type
            # checking.
            assert isinstance(value, list)
            with self.swap(
                value[0],
                'content_id',
                'content'
            ):
                exploration.validate()

    def test_validate_state_content_id_indexes(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('MultipleChoiceInput')
        init_state.update_interaction_customization_args({
            'choices': {
                'value': [{
                    'content_id': 'ca_choices_10',
                    'html': 'one'
                }]
            },
            'showChoicesInShuffledOrder': {'value': True}
        })
        init_state.update_next_content_id_index(9)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected all content id indexes to be less than the "next '
            'content id index"'
        ):
            exploration.validate()

    def test_validate_state_solicit_answer_details(self) -> None:
        """Test validation of solicit_answer_details."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.solicit_answer_details, False)
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected solicit_answer_details to be ' +
            'a boolean, received'):
            with self.swap(init_state, 'solicit_answer_details', 'abc'):
                exploration.validate()
        self.assertEqual(init_state.solicit_answer_details, False)
        self.set_interaction_for_state(init_state, 'Continue')
        self.assertEqual(init_state.interaction.id, 'Continue')
        exploration.validate()
        with self.assertRaisesRegex(
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

    def test_validate_state_linked_skill_id(self) -> None:
        """Test validation of linked_skill_id."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.linked_skill_id, None)
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected linked_skill_id to be ' +
            'a str, received 12.'):
            with self.swap(init_state, 'linked_skill_id', 12):
                exploration.validate()
        self.assertEqual(init_state.linked_skill_id, None)

    def test_validate_state_card_is_checkpoint(self) -> None:
        """Test validation of card_is_checkpoint."""
        exploration = exp_domain.Exploration.create_default_exploration('eid')
        init_state = exploration.states[exploration.init_state_name]
        self.assertEqual(init_state.card_is_checkpoint, True)
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected card_is_checkpoint to be ' +
            'a boolean, received'):
            with self.swap(init_state, 'card_is_checkpoint', 'abc'):
                exploration.validate()
        self.assertEqual(init_state.card_is_checkpoint, True)

    def test_validate_solution_answer_is_exclusive(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        # Solution should be set to None as default.
        self.assertEqual(exploration.init_state.interaction.solution, None)

        solution_dict: state_domain.SolutionDict = {
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
        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(solution)
        exploration.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        solution_dict = {
            'answer_is_exclusive': 1,  # type: ignore[typeddict-item]
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_solution(solution)
        with self.assertRaisesRegex(
            Exception, 'Expected answer_is_exclusive to be bool, received 1'):
            exploration.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_list_param_changes(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        exploration.init_state.param_changes = 0  # type: ignore[assignment]

        with self.assertRaisesRegex(
            Exception, 'Expected state param_changes to be a list, received 0'):
            exploration.init_state.validate({}, True)

    def test_validate_duplicate_content_id_with_answer_group_feedback(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_Contains',
                            'normalizedStrSet': ['Test']
                            }
                    })
            ],
            [],
            None
        )

        exploration.init_state.update_interaction_answer_groups(
            [state_answer_group])
        exploration.init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'feedback_1',
                'html': '<p>Feedback</p>'
            }))

        with self.assertRaisesRegex(
            Exception, 'Found a duplicate content id feedback_1'):
            exploration.init_state.validate({}, True)

    def test_validate_duplicate_content_id_with_answer_group_rules(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_Contains',
                            'normalizedStrSet': ['Test']
                            }
                    }),
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_Contains',
                            'normalizedStrSet': ['Temp']
                            }
                    })
            ],
            [],
            None
        )

        exploration.init_state.update_interaction_answer_groups(
            [state_answer_group])

        with self.assertRaisesRegex(
            Exception, 'Found a duplicate content id rule_input_Contains'):
            exploration.init_state.validate({}, True)

    def test_validate_duplicate_content_id_with_default_outcome(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        default_outcome = state_domain.Outcome(
            'Introduction', None,
            state_domain.SubtitledHtml('default_outcome', ''),
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

        with self.assertRaisesRegex(
            Exception, 'Found a duplicate content id default_outcome'):
            exploration.init_state.validate({}, True)

    def test_validate_duplicate_content_id_with_hints(self) -> None:
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

        with self.assertRaisesRegex(
            Exception, 'Found a duplicate content id hint_1'):
            exploration.init_state.validate({}, True)

    def test_validate_duplicate_content_id_with_solution(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        subtitled_html = state_domain.SubtitledHtml('content_id', 'some html')

        hints_list = [state_domain.Hint(subtitled_html)]

        exploration.init_state.interaction.hints = hints_list
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': 'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            }
        }
        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_solution(solution)
        exploration.init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'solution',
                'html': ''
                }))

        with self.assertRaisesRegex(
            Exception, 'Found a duplicate content id solution'):
            exploration.init_state.validate({}, True)

    def test_cannot_convert_state_dict_to_yaml_with_invalid_state_dict(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with contextlib.ExitStack() as stack:
            captured_logs = stack.enter_context(
                self.capture_logging(min_level=logging.ERROR))
            stack.enter_context(
                self.assertRaisesRegex(
                    Exception, 'string indices must be integers')
            )

            exploration.init_state.convert_state_dict_to_yaml(
                'invalid_state_dict', 10)  # type: ignore[arg-type]

        self.assertEqual(len(captured_logs), 1)
        self.assertIn('Bad state dict: invalid_state_dict', captured_logs[0])

    def test_cannot_update_hints_with_content_id_not_in_written_translations(
        self
    ) -> None:
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

        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

        with self.assertRaisesRegex(
            Exception,
            'The content_id hint_1 does not exist in written_translations'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_hints_with_content_id_not_in_recorded_voiceovers(
        self
    ) -> None:
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

        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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

        with self.assertRaisesRegex(
            Exception,
            'The content_id hint_1 does not exist in recorded_voiceovers'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_hints_with_new_content_id_in_written_translations(
        self
    ) -> None:
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

        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

        with self.assertRaisesRegex(
            Exception,
            'The content_id hint_2 already exists in written_translations'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_hints_with_new_content_id_in_recorded_voiceovers(
        self
    ) -> None:
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

        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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

        with self.assertRaisesRegex(
            Exception,
            'The content_id hint_2 already exists in recorded_voiceovers'):
            exploration.init_state.update_interaction_hints(new_hints_list)

    def test_cannot_update_interaction_solution_with_non_dict_solution(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>Hello, this is html1 for state2</p>')
            )
        ]
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': u'hello_world!',
            'explanation': {
                'content_id': 'solution',
                'html': u'<p>hello_world is a string</p>'
            }
        }
        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            exploration.init_state.interaction.id, solution_dict)
        exploration.init_state.update_interaction_hints(hints_list)
        exploration.init_state.update_interaction_solution(solution)

        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.solution is not None
        self.assertEqual(
            exploration.init_state.interaction.solution.to_dict(),
            solution_dict)

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception, 'Expected solution to be a Solution object,'
            'received test string'):
            exploration.init_state.update_interaction_solution('test string')  # type: ignore[arg-type]

    def test_update_interaction_solution_with_no_solution(self) -> None:
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

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_cannot_update_interaction_hints_with_non_list_hints(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegex(
            Exception, 'Expected hints_list to be a list'):
            exploration.init_state.update_interaction_hints({})  # type: ignore[arg-type]

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_cannot_update_non_list_interaction_confirmed_unclassified_answers(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegex(
            Exception, 'Expected confirmed_unclassified_answers to be a list'):
            (
                exploration.init_state
                .update_interaction_confirmed_unclassified_answers({}))  # type: ignore[arg-type]

    def test_update_interaction_confirmed_unclassified_answers(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': 'Test'
                    })
            ],
            [],
            None
        )

        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            [])

        (
            exploration.init_state
            .update_interaction_confirmed_unclassified_answers(
                [state_answer_group])
        )

        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            [state_answer_group])

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_cannot_update_non_list_interaction_answer_groups(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')

        with self.assertRaisesRegex(
            Exception, 'Expected interaction_answer_groups to be a list'):
            exploration.init_state.update_interaction_answer_groups(
                'invalid_answer_groups')  # type: ignore[arg-type]

    def test_cannot_update_answer_groups_with_non_dict_rule_inputs(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains', {}
                    )
            ],
            [],
            None
        )
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        state_answer_group.rule_specs[0].inputs = []  # type: ignore[assignment]

        with self.assertRaisesRegex(
            Exception,
            re.escape('Expected rule_inputs to be a dict, received []')
        ):
            exploration.init_state.update_interaction_answer_groups(
                [state_answer_group])

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_cannot_update_answer_groups_with_non_list_rule_specs(self) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'), False, [], None, None
            ), [], [], None
        )
        state_answer_group.rule_specs = {}  # type: ignore[assignment]

        with self.assertRaisesRegex(
            Exception, 'Expected answer group rule specs to be a list'):
            exploration.init_state.update_interaction_answer_groups(
                [state_answer_group])

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_cannot_update_answer_groups_with_invalid_rule_input_value(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        test_inputs: Dict[str, Dict[str, Union[str, List[str]]]] = {
            'x': {
                'contentId': 'rule_input_Equals',
                'normalizedStrSet': [[]]  # type: ignore[list-item]
                }
            }
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    test_inputs
                )
            ],
            [],
            None
        )

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Value has the wrong type. It should be a TranslatableSetOf'
                'NormalizedString. The value is'
            )
        ):
            exploration.init_state.update_interaction_answer_groups(
                [state_answer_group])

    def test_validate_rule_spec(self) -> None:
        observed_log_messages: List[str] = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'warning', _mock_logging_function)

        exploration = self.save_new_valid_exploration('exp_id', 'owner_id')
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
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
            None
        )
        exploration.init_state.update_interaction_answer_groups(
            [state_answer_group])

        with logging_swap, self.assertRaisesRegex(KeyError, '\'x\''):
            (
                exploration.init_state.interaction.answer_groups[0]
                .rule_specs[0].validate([], {})
            )

        self.assertEqual(
            observed_log_messages,
            [
                'RuleSpec \'Contains\' has inputs which are not recognized '
                'parameter names: {\'x\'}'
            ]
        )

    def test_get_all_translatable_content_for_state_content(self) -> None:
        """Get all translatable fields for state content."""
        state = state_domain.State.create_default_state('state_1')
        state_content_dict: state_domain.SubtitledHtmlDict = {
            'content_id': 'content',
            'html': '<p>state content html</p>'
        }
        state.update_content(
            state_domain.SubtitledHtml.from_dict(state_content_dict))
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            state.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, ['<p>state content html</p>']
        )

    def test_get_all_translatable_content_for_text_input_answer_groups(
        self
    ) -> None:
        """Get all the translatable fields for answer group."""
        state = state_domain.State.create_default_state('state_1')
        state_answer_group: List[state_domain.AnswerGroup] = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'destination', None, state_domain.SubtitledHtml(
                        'feedback_1', '<p>state outcome html</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Equals', {
                            'x': {
                                'contentId': 'rule_input_1',
                                'normalizedStrSet': ['Test rule spec.']
                                }})
                ],
                [],
                None
            )
        ]
        state.update_interaction_id('TextInput')
        state.update_interaction_answer_groups(state_answer_group)
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            state.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, [
                '<p>state outcome html</p>',
                ['Test rule spec.']]
        )

    def test_get_all_translatable_content_for_set_input_answer_groups(
        self
    ) -> None:
        """Get all the translatable fields for answer group."""
        state = state_domain.State.create_default_state('state_1')
        state_answer_group = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'destination', None, state_domain.SubtitledHtml(
                        'feedback', '<p>Feedback</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'Equals',
                        {
                            'x': {
                                'contentId': 'rule_input_2',
                                'unicodeStrSet': ['Input1', 'Input2']
                                }
                        })
                ],
                [],
                None
            )
        ]
        state.update_interaction_id('SetInput')
        state.update_interaction_answer_groups(state_answer_group)
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            state.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, [
                '<p>Feedback</p>',
                ['Input1', 'Input2']
            ]
        )

    def test_get_all_translatable_content_for_solution(self) -> None:
        """Get all translatable fields for solution."""
        state = state_domain.State.create_default_state('state_1')
        state_solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': 'Answer1',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state_1</p>'
            }
        }
        state.update_interaction_id('TextInput')
        # Ruling out the possibility of None for mypy type checking.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, state_solution_dict)
        state.update_interaction_solution(solution)
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            state.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, ['<p>This is solution for state_1</p>'])

    def test_test_get_all_translatable_content_for_unicode_cust_args(
        self
    ) -> None:
        """Get all the translatable fields for customization args."""
        state = state_domain.State.create_default_state('state_1')
        state_interaction_cust_args: state_domain.CustomizationArgsDictType = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': 'Translatable cust args.'
                }
            },
            'rows': {'value': 1}
        }
        state.update_interaction_id('TextInput')
        state.update_interaction_customization_args(state_interaction_cust_args)
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            state.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, ['Translatable cust args.'])

    def test_get_all_translatable_content_for_html_in_cust_args(self) -> None:
        state = state_domain.State.create_default_state('state_1')
        state.update_interaction_id('MultipleChoiceInput')
        state_interaction_cust_args: state_domain.CustomizationArgsDictType = {
            'showChoicesInShuffledOrder': {
                'value': True
            },
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': 'Hello world!'
                    }
                ]
            }
        }
        state.update_interaction_customization_args(state_interaction_cust_args)
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            state.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, ['Hello world!'])

    def test_get_all_translatable_content_for_hints(self) -> None:
        """Get all translatable fields for hints."""
        hint = state_domain.Hint(state_domain.SubtitledHtml(
            'hint_1', '<p>Hello, this is html1 for state_1</p>'))
        translatable_contents = [
            translatable_content.content_value
            for translatable_content in
            hint.get_all_contents_which_need_translations(
                self.dummy_entity_translations)
        ]

        self.assertItemsEqual(
            translatable_contents, [
                '<p>Hello, this is html1 for state_1</p>'
            ])


class InteractionCustomizationArgDomainTests(test_utils.GenericTestBase):
    """Test methods for InteractionCustomizationArg domain object."""

    def test_traverse_by_schema_and_convert(self) -> None:
        html: List[str] = []
        def extract_html(
            value: state_domain.SubtitledHtml,
            unused_schema_obj_type: str
        ) -> List[str]:
            """Extracts html from SubtitledHtml values.

            Args:
                value: SubtitledHtml|SubtitledUnicode. The value in the
                    customization argument value to be converted.
                unused_schema_obj_type: str. The schema obj_type for the
                    customization argument value, which is one of
                    'SubtitledUnicode' or 'SubtitledHtml'.

            Returns:
                SubtitledHtml|SubtitledUnicode. The converted SubtitledHtml
                object, if schema_type is 'SubititledHtml', otherwise the
                unmodified SubtitledUnicode object.
            """
            html.append(value.html)
            return html

        schema = {
            'type': 'dict',
            'properties': [{
                'name': 'content',
                'schema': {
                    'type': 'custom',
                    'obj_type': 'SubtitledHtml',
                }
            }]
        }
        value = {
            'content': state_domain.SubtitledHtml('id', '<p>testing</p>')
        }

        state_domain.InteractionCustomizationArg.traverse_by_schema_and_convert(
            schema, value, extract_html)

        self.assertEqual(html, ['<p>testing</p>'])

    def test_traverse_by_schema_and_get(self) -> None:
        html = []

        schema = {
            'type': 'dict',
            'properties': [{
                'name': 'content',
                'schema': {
                    'type': 'custom',
                    'obj_type': 'SubtitledHtml',
                }
            }]
        }
        value = {
            'content': state_domain.SubtitledHtml('id', '<p>testing</p>')
        }

        html = (
            state_domain.InteractionCustomizationArg.traverse_by_schema_and_get(
                schema,
                value,
                [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML],
                lambda x: x.html)
        )

        self.assertEqual(html, ['<p>testing</p>'])


class SubtitledUnicodeDomainUnitTests(test_utils.GenericTestBase):
    """Test SubtitledUnicode domain object methods."""

    def test_from_and_to_dict(self) -> None:
        subtitled_unicode_dict: state_domain.SubtitledUnicodeDict = {
            'content_id': 'id',
            'unicode_str': ''
        }
        subtitled_unicode = state_domain.SubtitledUnicode.from_dict(
            subtitled_unicode_dict)
        self.assertEqual(subtitled_unicode.to_dict(), subtitled_unicode_dict)

    def test_create_default(self) -> None:
        subtitled_unicode = (
            state_domain.SubtitledUnicode.create_default_subtitled_unicode(
                'id')
        )
        self.assertEqual(subtitled_unicode.to_dict(), {
            'content_id': 'id',
            'unicode_str': ''
        })


class WrittenTranslationsDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on written transcripts."""

    def test_data_formats_are_correct_and_complete(self) -> None:
        translatable_class_names_in_data_formats = sorted(
            state_domain.WrittenTranslation.
            DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE.values())
        self.assertEqual(
            translatable_class_names_in_data_formats,
            translatable_object_registry.Registry.get_all_class_names())

    def test_from_and_to_dict_works_correctly(self) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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
                    },
                    'fr': {
                        'data_format': 'set_of_normalized_string',
                        'translation': ['test1', 'test2'],
                        'needs_update': False
                    },
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
                    },
                    'fr': {
                        'data_format': 'set_of_normalized_string',
                        'translation': ['test1', 'test2'],
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        self.assertEqual(
            written_translations.to_dict(), written_translations_dict)

    def test_get_content_ids_for_text_translation_return_correct_list_of_content_id(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })
        self.assertEqual(
            written_translations.get_content_ids_for_text_translation(), [])

        written_translations.add_content_id_for_translation('feedback_1')
        written_translations.add_content_id_for_translation('feedback_2')
        self.assertItemsEqual(
            written_translations.get_content_ids_for_text_translation(), [
                'feedback_2', 'feedback_1'])

    def test_get_translated_content_in_non_existing_language_raise_error(
        self
    ) -> None:
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

        with self.assertRaisesRegex(
            Exception, 'Translation for the given content_id content does not '
            'exist in hi language code'):
            written_translations.get_translated_content('content', 'hi')

    def test_get_translated_content_for_invalid_content_id_raise_error(
        self
    ) -> None:
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

        with self.assertRaisesRegex(
            Exception, 'Invalid content_id: invalid_id'):
            written_translations.get_translated_content('invalid_id', 'hi')

    def test_add_content_id_for_translations_adds_content_id(self) -> None:
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

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_add_content_id_for_translation_with_invalid_content_id_raise_error(
        self
    ) -> None:
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })
        invalid_content_id = 123
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, received 123'):
            written_translations.add_content_id_for_translation(
                invalid_content_id)  # type: ignore[arg-type]

    def test_add_content_id_for_translation_with_existing_content_id_raise_error( # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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
        with self.assertRaisesRegex(
            Exception, 'The content_id feedback_1 already exist.'):
            written_translations.add_content_id_for_translation(
                existing_content_id)

    def test_delete_content_id_for_translations_deletes_content_id(
        self
    ) -> None:
        old_written_translations_dict: state_domain.WrittenTranslationsDict = {
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

    def test_delete_content_id_for_translation_with_nonexisting_content_id_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        nonexisting_content_id_to_delete = 'feedback_1'
        with self.assertRaisesRegex(
            Exception, 'The content_id feedback_1 does not exist.'):
            written_translations.delete_content_id_for_translation(
                nonexisting_content_id_to_delete)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_delete_content_id_for_translation_with_invalid_content_id_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations = state_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        })
        invalid_content_id_to_delete = 123
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, '):
            written_translations.delete_content_id_for_translation(
                invalid_content_id_to_delete)  # type: ignore[arg-type]

    def test_validation_with_invalid_content_id_raise_error(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                123: {}  # type: ignore[dict-item]
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, '):
            written_translations.validate([123])  # type: ignore[list-item]

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_dict_language_code_to_written_translation(
        self
    ) -> None:
        written_translations = state_domain.WrittenTranslations({
            'en': []  # type: ignore[dict-item]
        })

        with self.assertRaisesRegex(
            Exception,
            re.escape('Expected content_id value to be a dict, received []')):
            written_translations.validate(None)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_invalid_type_language_code_raise_error(
        self
    ) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {
                    123: {  # type: ignore[dict-item]
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegex(
            Exception, 'Expected language_code to be a string, '):
            written_translations.validate(['content'])

    def test_validation_with_unknown_language_code_raise_error(self) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

        with self.assertRaisesRegex(Exception, 'Invalid language_code: ed'):
            written_translations.validate(['content'])

    def test_validation_with_invalid_content_id_list(self) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Expected state written_translations to match the listed '
                'content ids [\'invalid_content\']')):
            written_translations.validate(['invalid_content'])

    def test_get_content_ids_that_are_correctly_translated(self) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

    def test_get_content_ids_that_are_correctly_translated_with_some_existing_translations(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

    def test_get_content_ids_that_are_correctly_translated_with_some_existing_translations_needs_update(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
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

    def test_from_and_to_dict_wroks_correctly(self) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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

    def test_get_content_ids_for_voiceovers_return_correct_list_of_content_id(
        self
    ) -> None:
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })
        self.assertEqual(
            recorded_voiceovers.get_content_ids_for_voiceovers(), [])

        recorded_voiceovers.add_content_id_for_voiceover('feedback_1')
        recorded_voiceovers.add_content_id_for_voiceover('feedback_2')
        self.assertItemsEqual(
            recorded_voiceovers.get_content_ids_for_voiceovers(),
            ['feedback_2', 'feedback_1'])

    def test_add_content_id_for_voiceovers_adds_content_id(self) -> None:
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

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_add_content_id_for_voiceover_with_invalid_content_id_raise_error(
        self
    ) -> None:
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })
        invalid_content_id = 123
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, received 123'):
            recorded_voiceovers.add_content_id_for_voiceover(
                invalid_content_id)  # type: ignore[arg-type]

    def test_add_content_id_for_voiceover_with_existing_content_id_raise_error( # pylint: disable=line-too-long
        self
    ) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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
        with self.assertRaisesRegex(
            Exception, 'The content_id feedback_1 already exist.'):
            recorded_voiceovers.add_content_id_for_voiceover(
                existing_content_id)

    def test_delete_content_id_for_voiceovers_deletes_content_id(self) -> None:
        old_recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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

    def test_delete_content_id_for_voiceover_with_nonexisting_content_id_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content': {}
            }
        }
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)
        nonexisting_content_id_to_delete = 'feedback_1'
        with self.assertRaisesRegex(
            Exception, 'The content_id feedback_1 does not exist.'):
            recorded_voiceovers.delete_content_id_for_voiceover(
                nonexisting_content_id_to_delete)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_delete_content_id_for_voiceover_with_invalid_content_id_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict({
            'voiceovers_mapping': {}
        })
        invalid_content_id_to_delete = 123
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, '):
            recorded_voiceovers.delete_content_id_for_voiceover(
                invalid_content_id_to_delete)  # type: ignore[arg-type]

    def test_validation_with_invalid_content_id_raise_error(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                123: {}  # type: ignore[dict-item]
            }
        }

        recorded_voiceovers = state_domain.RecordedVoiceovers.from_dict(
            recorded_voiceovers_dict)

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, '):
            recorded_voiceovers.validate([123])  # type: ignore[list-item]

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_dict_language_code_to_voiceover(self) -> None:
        recorded_voiceovers = state_domain.RecordedVoiceovers({
            'en': []  # type: ignore[dict-item]
        })

        with self.assertRaisesRegex(
            Exception,
            re.escape('Expected content_id value to be a dict, received []')):
            recorded_voiceovers.validate(None)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_invalid_type_language_code_raise_error(
        self
    ) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content': {
                    123: {  # type: ignore[dict-item]
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

        with self.assertRaisesRegex(
            Exception, 'Expected language_code to be a string, '):
            recorded_voiceovers.validate(['content'])

    def test_validation_with_unknown_language_code_raise_error(self) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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

        with self.assertRaisesRegex(Exception, 'Invalid language_code: ed'):
            recorded_voiceovers.validate(['content'])

    def test_validation_with_invalid_content_id_list(self) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
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

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Expected state recorded_voiceovers to match the listed '
                'content ids [\'invalid_content\']')):
            recorded_voiceovers.validate(['invalid_content'])


class VoiceoverDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.voiceover = state_domain.Voiceover('filename.mp3', 10, False, 15.0)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_filename(self) -> None:
        self.voiceover.validate()
        self.voiceover.filename = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected audio filename to be a string'):
            self.voiceover.validate()

    def test_validate_filename(self) -> None:
        self.voiceover.validate()
        self.voiceover.filename = 'invalid_filename'
        with self.assertRaisesRegex(Exception, 'Invalid audio filename'):
            self.voiceover.validate()

    def test_validate_audio_extension(self) -> None:
        self.voiceover.validate()
        self.voiceover.filename = 'filename.png'
        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Invalid audio filename: it should have one of the following '
                'extensions: %s'
                % list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()))):
            self.voiceover.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_int_file_size_bytes(self) -> None:
        self.voiceover.validate()
        self.voiceover.file_size_bytes = 'file_size_bytes'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected file size to be an int'):
            self.voiceover.validate()

    def test_validate_negative_file_size_bytes(self) -> None:
        self.voiceover.validate()
        self.voiceover.file_size_bytes = -1
        with self.assertRaisesRegex(Exception, 'Invalid file size'):
            self.voiceover.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_bool_needs_update(self) -> None:
        self.voiceover.validate()
        self.voiceover.needs_update = 'needs_update'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected needs_update to be a bool'):
            self.voiceover.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_str_duration_secs(self) -> None:
        self.voiceover.validate()
        self.voiceover.duration_secs = 'duration_secs'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected duration_secs to be a float'):
            self.voiceover.validate()

    def test_validate_int_duration_secs(self) -> None:
        self.voiceover.validate()
        self.voiceover.duration_secs = 10
        self.voiceover.validate()
        self.assertEqual(self.voiceover.duration_secs, 10)

    def test_validate_float_duration_secs(self) -> None:
        self.voiceover.validate()
        self.voiceover.duration_secs = 10.5
        self.voiceover.validate()
        self.assertEqual(self.voiceover.duration_secs, 10.5)

    def test_validate_negative_duration_seconds(self) -> None:
        self.voiceover.validate()
        self.voiceover.duration_secs = -1.45
        with self.assertRaisesRegex(
            Exception, 'Expected duration_secs to be positive number, '
            'or zero if not yet specified'):
            self.voiceover.validate()


class StateVersionHistoryDomainUnitTests(test_utils.GenericTestBase):

    def test_state_version_history_gets_created(self) -> None:
        expected_dict: state_domain.StateVersionHistoryDict = {
            'previously_edited_in_version': 1,
            'state_name_in_previous_version': 'state 1',
            'committer_id': 'user_1'
        }
        actual_dict = state_domain.StateVersionHistory(
            1, 'state 1', 'user_1').to_dict()

        self.assertEqual(
            expected_dict, actual_dict)

    def test_state_version_history_gets_created_from_dict(self) -> None:
        state_version_history_dict: state_domain.StateVersionHistoryDict = {
            'previously_edited_in_version': 1,
            'state_name_in_previous_version': 'state 1',
            'committer_id': 'user_1'
        }
        state_version_history = state_domain.StateVersionHistory.from_dict(
            state_version_history_dict)

        self.assertEqual(
            state_version_history.previously_edited_in_version,
            state_version_history_dict['previously_edited_in_version'])
        self.assertEqual(
            state_version_history.state_name_in_previous_version,
            state_version_history_dict['state_name_in_previous_version'])
        self.assertEqual(
            state_version_history.to_dict(), state_version_history_dict)
