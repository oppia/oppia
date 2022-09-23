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

"""Unit tests for RatioExpressionInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.RatioExpressionInput import RatioExpressionInput # pylint: disable=unused-import, line-too-long # isort: skip


class RatioExpressionInputTests(test_utils.GenericTestBase):

    def test_ratio_expression_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'answer_groups': [{
                'outcome': {
                    'dest': 'abc',
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': '<p>Feedback</p>'
                    },
                    'labelled_as_correct': True,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'inputs': {
                        'x': [1, 2]
                    },
                    'rule_type': 'Equals'
                }, {
                    'inputs': {
                        'x': [1, 2]
                    },
                    'rule_type': 'IsEquivalent'
                }, {
                    'inputs': {
                        'y': 1
                    },
                    'rule_type': 'HasNumberOfTermsEqualTo'
                }, {
                    'inputs': {
                        'x': 1,
                        'y': 2
                    },
                    'rule_type': 'HasSpecificTermEqualTo'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skill_id-misconception_id'
            }],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': '😍😍😍😍'
                    }
                },
                'numberOfTerms': {
                    'value': 1
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
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a copyright character ©.</p>'
                }
            }],
            'solution': {
                'answer_is_exclusive': True,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>This is solution for ratio input.</p>'
                },
                'correct_answer': [1, 2]
            },
            'id': 'RatioExpressionInput'
        }
        ratio_expression_input = (
            interaction_registry.Registry.get_interaction_by_id(
                'RatioExpressionInput'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        ratio_expression_input_proto = (
            ratio_expression_input.to_android_ratio_expression_input_proto(
                interaction_domain.default_outcome,
                interaction_domain.customization_args,
                interaction_domain.solution,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        ratio_expression_input_customization_args = (
            ratio_expression_input_proto.customization_args)
        self.assertEqual(
            ratio_expression_input_customization_args.placeholder.content_id,
            'ca_placeholder_0')
        self.assertEqual(
            ratio_expression_input_customization_args.placeholder.text,
            '😍😍😍😍')
        self.assertEqual(
            ratio_expression_input_customization_args.number_of_terms,
            1)

        self.assertEqual(
            ratio_expression_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            ratio_expression_input_proto.hints[0].hint_content.text,
            '<p>This is a copyright character ©.</p>')

        self.assertEqual(
            ratio_expression_input_proto.default_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            ratio_expression_input_proto.default_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            ratio_expression_input_proto.default_outcome.feedback.text,
            '<p> Default Outcome </p>')
        self.assertFalse(
            ratio_expression_input_proto.default_outcome.labelled_as_correct)

        ratio_expression_input_tagged_mis_skill = (
            ratio_expression_input_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(
            ratio_expression_input_tagged_mis_skill.skill_id,
            'skill_id')
        self.assertEqual(
            ratio_expression_input_tagged_mis_skill.misconception_id,
            'misconception_id')

        ratio_expression_input_answer_group = (
            ratio_expression_input_proto.answer_groups[0]
                .base_answer_group.outcome)
        self.assertEqual(
            ratio_expression_input_answer_group.destination_state,
            'abc')
        self.assertTrue(ratio_expression_input_answer_group.labelled_as_correct)
        self.assertEqual(
            ratio_expression_input_answer_group.feedback.content_id,
            'feedback_2')
        self.assertEqual(
            ratio_expression_input_answer_group.feedback.text,
            '<p>Feedback</p>')

        ratio_expression_input_solution = (
            ratio_expression_input_proto.solution.base_solution)
        self.assertEqual(
            ratio_expression_input_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            ratio_expression_input_solution.explanation.text,
            '<p>This is solution for ratio input.</p>')

        self.assertEqual(
            ratio_expression_input_proto.solution.correct_answer.components[0],
            1)
        self.assertEqual(
            ratio_expression_input_proto.solution.correct_answer.components[1],
            2)

        ratio_expression_input_rule_spec = (
            ratio_expression_input_proto.answer_groups[0]
                .rule_specs[0].equals.input)
        self.assertEqual(
            ratio_expression_input_rule_spec.components[0],
            1)
        self.assertEqual(
            ratio_expression_input_rule_spec.components[1],
            2)

        ratio_expression_input_rule_spec = (
            ratio_expression_input_proto.answer_groups[0]
                .rule_specs[1].is_equivalent.input)
        self.assertEqual(
            ratio_expression_input_rule_spec.components[0],
            1)
        self.assertEqual(
            ratio_expression_input_rule_spec.components[1],
            2)

        ratio_expression_input_rule_spec = (
            ratio_expression_input_proto.answer_groups[0]
                .rule_specs[2].has_number_of_terms_equal_to)
        self.assertEqual(
            ratio_expression_input_rule_spec.input_term_count,
            1)

        ratio_expression_input_rule_spec = (
            ratio_expression_input_proto.answer_groups[0]
                .rule_specs[3].has_specific_term_equal_to)
        self.assertEqual(
            ratio_expression_input_rule_spec.input_term_index,
            1)
        self.assertEqual(
            ratio_expression_input_rule_spec.input_expected_term_value,
            2)
