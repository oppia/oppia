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

"""Unit tests for NumericInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.NumericInput import NumericInput # pylint: disable=unused-import # isort: skip


class NumericInputTests(test_utils.GenericTestBase):

    def test_numeric_input_converted_to_proto_correctly(self):
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
                        'x': 5.0
                    },
                    'rule_type': 'Equals'
                }, {
                    'inputs': {
                        'x': 5.0
                    },
                    'rule_type': 'IsLessThan'
                }, {
                    'inputs': {
                        'x': 5.0
                    },
                    'rule_type': 'IsGreaterThan'
                }, {
                    'inputs': {
                        'x': 5.0
                    },
                    'rule_type': 'IsLessThanOrEqualTo'
                }, {
                    'inputs': {
                        'x': 5.0
                    },
                    'rule_type': 'IsGreaterThanOrEqualTo'
                }, {
                    'inputs': {
                        'a': 5.0,
                        'b': 10.0
                    },
                    'rule_type': 'IsInclusivelyBetween'
                }, {
                    'inputs': {
                        'x': 5.0,
                        'tol': 5.0
                    },
                    'rule_type': 'IsWithinTolerance'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': None
            }],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'requireNonnegativeInput': {
                    'value': False
                },
                'rows': {'value': 1}
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
                    'html': '<p>This is solution for numeric input.</p>'
                },
                'correct_answer': 1.0
            },
            'id': 'NumericInput'
        }
        numeric_input = interaction_registry.Registry.get_interaction_by_id(
            'NumericInput')
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        numeric_input_proto = (
            numeric_input.to_android_numeric_input_proto(
                interaction_domain.default_outcome,
                interaction_domain.solution,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        self.assertEqual(
            numeric_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            numeric_input_proto.hints[0].hint_content.text,
            '<p>This is a copyright character ©.</p>')

        numeric_input_default_outcome = (
            numeric_input_proto.default_outcome)
        self.assertEqual(
            numeric_input_default_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            numeric_input_default_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            numeric_input_default_outcome.feedback.text,
            '<p> Default Outcome </p>')
        self.assertFalse(numeric_input_default_outcome.labelled_as_correct)

        self.assertEqual(
            numeric_input_proto.solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            numeric_input_proto.solution.base_solution.explanation.text,
            '<p>This is solution for numeric input.</p>')
        self.assertEqual(
            numeric_input_proto.solution.correct_answer,
            1.0)

        numeric_input_answer_group = (
            numeric_input_proto.answer_groups[0]
                .base_answer_group.outcome)
        self.assertEqual(
            numeric_input_answer_group.destination_state,
            'abc')
        self.assertTrue(numeric_input_answer_group.labelled_as_correct)
        self.assertEqual(
            numeric_input_answer_group.feedback.content_id,
            'feedback_2')
        self.assertEqual(
            numeric_input_answer_group.feedback.text,
            '<p>Feedback</p>')

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[0].equals)
        self.assertEqual(
            numeric_input_rule_spec.input,
            5.0)

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[1].is_less_than)
        self.assertEqual(
           numeric_input_rule_spec.input,
            5.0)

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[2].is_greater_than)
        self.assertEqual(
            numeric_input_rule_spec.input,
            5.0)

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[3].is_less_than_or_equal_to)
        self.assertEqual(
            numeric_input_rule_spec.input,
            5.0)

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[4].is_greater_than_or_equal_to)
        self.assertEqual(
            numeric_input_rule_spec.input,
            5.0)

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[5].is_inclusively_between)
        self.assertEqual(
            numeric_input_rule_spec.inputLowerInclusive,
            5.0)
        self.assertEqual(
            numeric_input_rule_spec.inputUpperInclusive,
            10.0)

        numeric_input_rule_spec = (
            numeric_input_proto.answer_groups[0]
                .rule_specs[6].is_within_tolerance)
        self.assertEqual(
            numeric_input_rule_spec.inputTolerance,
            5.0)
        self.assertEqual(
            numeric_input_rule_spec.inputComparedValue,
            5.0)
