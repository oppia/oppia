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

"""Unit tests for NumericExpressionInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.NumericExpressionInput import NumericExpressionInput # pylint: disable=unused-import, line-too-long # isort: skip


class NumericExpressionInputTests(test_utils.GenericTestBase):

    def test_numeric_expression_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'id': 'NumericExpressionInput',
            'customization_args': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_customPlaceholder_2',
                        'unicode_str': '😍😍😍😍'
                    }
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'answer_groups': [{
                'outcome': {
                    'dest': 'Number With Units',
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Yes, well done!</p>'
                    },
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'rule_type': 'MatchesExactlyWith',
                    'inputs': {
                        'x': '1000 + 200 + 30 + 4 + 0.5 + 0.06'
                    }
                }, {
                    'rule_type': 'IsEquivalentTo',
                    'inputs': {
                        'x': '1000 + 200 + 30 + 4 + 0.5 + 0.06'
                    }
                }, {
                    'rule_type': 'MatchesUpToTrivialManipulations',
                    'inputs': {
                        'x': '1000 + 200 + 30 + 4 + 0.5 + 0.06'
                    }
                }, {
                    'rule_type': 'ContainsSomeOf',
                    'inputs': {
                        'x': '1000 + 200 + 30 + 4 + 0.5 + 0.06'
                    }
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skill_id-misconception_id'
            }],
            'default_outcome': {
                'dest': 'Introduction',
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p> introduce </p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'confirmed_unclassified_answers': [],
            'hints': [{
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
            'solution': {
                'answer_is_exclusive': True,
                'correct_answer': '1000 + 200 + 30 + 4 + 0.5 + 0.06',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>This is solution for algebraic.</p>'
                }
            }
        }
        registry = interaction_registry.Registry
        numeric_instance = (
            registry.get_interaction_by_id('NumericExpressionInput'))

        interaction_domain = (
            state_domain.InteractionInstance.from_dict(interaction_dict))
        numeric_proto = numeric_instance.to_android_numeric_expression_proto(
            interaction_domain.default_outcome,
            interaction_domain.customization_args,
            interaction_domain.solution,
            interaction_domain.hints,
            interaction_domain.answer_groups)

        numeric_customization_args = numeric_proto.customization_args
        self.assertEqual(
            numeric_customization_args.placeholder.content_id,
            'ca_customPlaceholder_2')
        self.assertEqual(
            numeric_customization_args.placeholder.text,
            '😍😍😍😍')
        self.assertFalse(numeric_customization_args.use_fraction_for_division)

        numeric_outcome = numeric_proto.default_outcome
        self.assertEqual(
            numeric_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            numeric_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            numeric_outcome.feedback.text,
            '<p> introduce </p>')
        self.assertFalse(
            numeric_outcome.labelled_as_correct)

        self.assertEqual(
            numeric_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            numeric_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            numeric_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            numeric_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        numeric_solution = numeric_proto.solution
        self.assertEqual(
            numeric_solution.correct_answer,
            '1000 + 200 + 30 + 4 + 0.5 + 0.06')

        self.assertEqual(
            numeric_proto.solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            numeric_proto.solution.base_solution.explanation.text,
            '<p>This is solution for algebraic.</p>')

        numeric_answer_group = (
            numeric_proto.answer_groups[0].base_answer_group.outcome)
        self.assertEqual(
            numeric_answer_group.destination_state,
            'Number With Units')
        self.assertFalse(numeric_answer_group.labelled_as_correct)
        self.assertEqual(numeric_answer_group.feedback.content_id, 'feedback_1')
        self.assertEqual(
            numeric_answer_group.feedback.text,
            '<p>Yes, well done!</p>')

        numeric_mis_skill = (
            numeric_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(numeric_mis_skill.skill_id, 'skill_id')
        self.assertEqual(
            numeric_mis_skill.misconception_id, 'misconception_id')

        numeric_answer_group = numeric_proto.answer_groups[0]
        math_rule_specs = (
            numeric_answer_group.rule_specs[0].matches_exactly_with)
        self.assertEqual(
            math_rule_specs.numeric_expression,
            '1000 + 200 + 30 + 4 + 0.5 + 0.06')

        math_rule_specs = (
            numeric_answer_group.rule_specs[1].is_equivalent_to)
        self.assertEqual(
            math_rule_specs.numeric_expression,
            '1000 + 200 + 30 + 4 + 0.5 + 0.06')

        math_rule_specs = numeric_answer_group.rule_specs[2]
        matches_trivial_rule = (
            math_rule_specs.matches_upTo_trivial_manipulations)
        self.assertEqual(
            matches_trivial_rule.numeric_expression,
            '1000 + 200 + 30 + 4 + 0.5 + 0.06')
