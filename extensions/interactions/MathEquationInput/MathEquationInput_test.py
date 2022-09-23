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

"""Unit tests for MathEquationInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.MathEquationInput import MathEquationInput # pylint: disable=unused-import, line-too-long # isort: skip


class MathEquationInputTests(test_utils.GenericTestBase):

    def test_math_equation_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'id': 'MathEquationInput',
            'customization_args': {
                'allowedVariables': {
                     'value': ['\u03C0', '\u03C0']
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
                        'x': 'a+b=c',
                        'y': 'both'
                    }
                }, {
                    'rule_type': 'IsEquivalentTo',
                    'inputs': {
                        'x': 'a+b=c'
                    }
                }, {
                    'rule_type': 'MatchesUpToTrivialManipulations',
                    'inputs': {
                        'x': 'a+b=c'
                    }
                }, {
                    'rule_type': 'ContainsSomeOf',
                    'inputs': {
                        'x': 'a+b=c'
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
                'correct_answer': 'a+b=c',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>This is solution for math equation.</p>'
                }
            }
        }
        registry = interaction_registry.Registry
        math_equation_input = registry.get_interaction_by_id(
            'MathEquationInput')

        interaction_domain = (
            state_domain.InteractionInstance.from_dict(interaction_dict))
        math_equation_input_proto = (
            math_equation_input.to_android_math_equation_input_proto(
                interaction_domain.default_outcome,
                interaction_domain.customization_args,
                interaction_domain.solution,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        math_equation_input_customization_args = (
            math_equation_input_proto.customization_args)
        self.assertEqual(
            math_equation_input_customization_args.custom_osk_letters[0],
            '\u03C0'
        )
        self.assertFalse(
            math_equation_input_customization_args.use_fraction_for_division)

        math_equation_input_outcome = math_equation_input_proto.default_outcome
        self.assertEqual(
            math_equation_input_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            math_equation_input_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            math_equation_input_outcome.feedback.text,
            '<p> introduce </p>')
        self.assertFalse(
            math_equation_input_outcome.labelled_as_correct)

        self.assertEqual(
            math_equation_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            math_equation_input_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            math_equation_input_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            math_equation_input_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        math_equation_input_solution = math_equation_input_proto.solution
        self.assertEqual(math_equation_input_solution.correct_answer, 'a+b=c')
        self.assertEqual(
            math_equation_input_solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            math_equation_input_solution.base_solution.explanation.text,
            '<p>This is solution for math equation.</p>')

        math_equation_input_answer_group = (
            math_equation_input_proto.answer_groups[0]
                .base_answer_group.outcome)
        self.assertEqual(
            math_equation_input_answer_group.destination_state,
            'Number With Units')
        self.assertFalse(math_equation_input_answer_group.labelled_as_correct)
        self.assertEqual(
            math_equation_input_answer_group.feedback.content_id, 'feedback_1')
        self.assertEqual(
            math_equation_input_answer_group.feedback.text,
            '<p>Yes, well done!</p>')

        math_equation_tagged_mis_skill = (
            math_equation_input_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(math_equation_tagged_mis_skill.skill_id, 'skill_id')
        self.assertEqual(
            math_equation_tagged_mis_skill.misconception_id, 'misconception_id')

        math_equation_input_answer_group = (
            math_equation_input_proto.answer_groups[0])
        math_equation_input_rule_specs = (
            math_equation_input_answer_group.rule_specs[0].matches_exactly_with)
        self.assertEqual(math_equation_input_rule_specs.math_equation, 'a+b=c')
        self.assertEqual(
            math_equation_input_rule_specs.position_of_terms, 'both')

        math_equation_input_rule_specs = (
            math_equation_input_answer_group.rule_specs[1].is_equivalent_to)
        self.assertEqual(math_equation_input_rule_specs.math_equation, 'a+b=c')

        math_equation_input_rule_specs = (
            math_equation_input_answer_group.rule_specs[2]
                .matches_upTo_trivial_manipulations)
        self.assertEqual(math_equation_input_rule_specs.math_equation, 'a+b=c')
