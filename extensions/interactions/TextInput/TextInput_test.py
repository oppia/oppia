# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for TextInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.TextInput import TextInput # pylint: disable=unused-import # isort: skip


class TextInputTests(test_utils.GenericTestBase):

    def test_text_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a copyright character ©.</p>'
                }
            }],
            'confirmed_unclassified_answers': [],
            'solution': {
                'correct_answer': 'Solution',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Solution explanation</p>',
                },
                'answer_is_exclusive': False,
            },
            'id': 'TextInput',
            'customization_args': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': '😍😍😍😍'
                    }
                }
            },
            'default_outcome': {
                'param_changes': [],
                'refresher_exploration_id': None,
                'dest': 'Introduction',
                'dest_if_really_stuck': None,
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p> Default Outcome </p>'
                },
                'labelled_as_correct': False
            },
            'answer_groups': [{
                'training_data': [],
                'outcome': {
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'dest': 'Introduction',
                    'dest_if_really_stuck': None,
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': '<p>This is great! ®®</p>'
                    },
                    'labelled_as_correct': False
                },
                'rule_specs': [{
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['®®']
                        }
                    }
                }, {
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_1',
                            'normalizedStrSet': ['®®']
                        }
                    }
                }, {
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_1',
                            'normalizedStrSet': ['®®']
                        }
                    }
                }, {
                    'rule_type': 'FuzzyEquals',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_1',
                            'normalizedStrSet': ['®®']
                        }
                    }
                }],
                'tagged_skill_misconception_id': 'skill_id-misconception_id'
            }]
        }
        text_input = (
            interaction_registry.Registry.get_interaction_by_id(
                'TextInput'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        text_input_proto = text_input.to_android_text_input_proto(
            interaction_domain.default_outcome,
            interaction_domain.customization_args,
            interaction_domain.solution,
            interaction_domain.hints,
            interaction_domain.answer_groups)

        self.assertEqual(
            text_input_proto.customization_args.placeholder.content_id,
            'ca_placeholder_0')
        self.assertEqual(
            text_input_proto.customization_args.placeholder.text,
            '😍😍😍😍')
        self.assertEqual(
            text_input_proto.customization_args.rows,
            1)

        self.assertEqual(
            text_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            text_input_proto.hints[0].hint_content.text,
            '<p>This is a copyright character ©.</p>')

        self.assertEqual(
            text_input_proto.default_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            text_input_proto.default_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            text_input_proto.default_outcome.feedback.text,
            '<p> Default Outcome </p>')
        self.assertFalse(text_input_proto.default_outcome.labelled_as_correct)

        text_input_answer_group = (
            text_input_proto.answer_groups[0]
                .base_answer_group.outcome)
        self.assertEqual(
            text_input_answer_group.destination_state,
            'Introduction')
        self.assertFalse(text_input_answer_group.labelled_as_correct)
        self.assertEqual(
            text_input_answer_group.feedback.content_id,
            'feedback_2')
        self.assertEqual(
            text_input_answer_group.feedback.text,
            '<p>This is great! ®®</p>')

        text_input_tagged_mis_skill = (
            text_input_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(
            text_input_tagged_mis_skill.skill_id,
            'skill_id')
        self.assertEqual(
            text_input_tagged_mis_skill.misconception_id,
            'misconception_id')

        self.assertEqual(
            text_input_proto.solution.correct_answer, 'Solution')
        self.assertEqual(
            text_input_proto.solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            text_input_proto.solution.base_solution.explanation.text,
            '<p>Solution explanation</p>')

        text_input_rule_spec = (
            text_input_proto.answer_groups[0]
                .rule_specs[0].contains.input)
        self.assertEqual(
            text_input_rule_spec.content_id,
            'rule_input_4')
        self.assertEqual(
            text_input_rule_spec.normalized_strings[0],
            '®®')

        text_input_rule_spec = (
            text_input_proto.answer_groups[0]
                .rule_specs[1].equals.input)
        self.assertEqual(
            text_input_rule_spec.content_id,
            'rule_input_1')
        self.assertEqual(
            text_input_rule_spec.normalized_strings[0],
            '®®')

        text_input_rule_spec = (
            text_input_proto.answer_groups[0]
                .rule_specs[2].starts_with.input)
        self.assertEqual(
            text_input_rule_spec.content_id,
            'rule_input_1')
        self.assertEqual(
            text_input_rule_spec.normalized_strings[0],
            '®®')

        text_input_rule_spec = (
            text_input_proto.answer_groups[0]
                .rule_specs[3].fuzzy_equals.input)
        self.assertEqual(
            text_input_rule_spec.content_id,
            'rule_input_1')
        self.assertEqual(
            text_input_rule_spec.normalized_strings[0],
            '®®')
