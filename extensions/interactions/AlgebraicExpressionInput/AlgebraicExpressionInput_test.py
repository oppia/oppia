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

"""Unit tests for AlgebraicExpressionInput.py"""

from __future__ import annotations

from core.domain import interaction_registry, state_domain
from core.tests import test_utils
from extensions.interactions.AlgebraicExpressionInput import AlgebraicExpressionInput # pylint: disable=unused-import, line-too-long # isort: skip


class AlgebraicExpressionInputTests(test_utils.GenericTestBase):

    def test_algebraic_expression_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'id': 'AlgebraicExpressionInput',
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
                        'x': 'pi*r^2'
                    }
                }, {
                    'rule_type': 'IsEquivalentTo',
                    'inputs': {
                        'x': 'pi*r^2'
                    }
                }, {
                    'rule_type': 'MatchesUpToTrivialManipulations',
                    'inputs': {
                        'x': 'pi*r^2'
                    }
                }, {
                    'rule_type': 'ContainsSomeOf',
                    'inputs': {
                        'x': 'pi*r^2'
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
                'correct_answer': 'Correct Answer',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>This is solution for algebraic.</p>'
                }
            }
        }
        registry = interaction_registry.Registry
        algebraic_expression_input_interaction = (
            registry.get_interaction_by_id('AlgebraicExpressionInput')
        )
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(interaction_dict))

        algebraic_expression_proto = (
            algebraic_expression_input_interaction.to_android_algebraic_expression_proto( # pylint: disable=line-too-long
                interaction_domain.default_outcome,
                interaction_domain.customization_args,
                interaction_domain.solution,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        algebraic_expression_customization_args = (
            algebraic_expression_proto.customization_args)
        self.assertEqual(
            algebraic_expression_customization_args.custom_osk_letters[0],
            '\u03C0'
        )
        self.assertFalse(
            algebraic_expression_customization_args.use_fraction_for_division)

        algebraic_expression_outcome = (
            algebraic_expression_proto.default_outcome)
        self.assertEqual(
            algebraic_expression_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            algebraic_expression_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            algebraic_expression_outcome.feedback.text,
            '<p> introduce </p>')
        self.assertFalse(
            algebraic_expression_outcome.labelled_as_correct)

        self.assertEqual(
            algebraic_expression_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            algebraic_expression_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            algebraic_expression_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            algebraic_expression_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        algebraic_expression_solution = algebraic_expression_proto.solution
        self.assertEqual(
            algebraic_expression_solution.correct_answer, 'Correct Answer')

        self.assertEqual(
            algebraic_expression_solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            algebraic_expression_solution.base_solution.explanation.text,
            '<p>This is solution for algebraic.</p>')

        algebraic_expression_answer_group = (
            algebraic_expression_proto.answer_groups[0]
                .base_answer_group.outcome)
        self.assertEqual(
            algebraic_expression_answer_group.destination_state,
            'Number With Units')
        self.assertFalse(algebraic_expression_answer_group.labelled_as_correct)
        self.assertEqual(
            algebraic_expression_answer_group.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            algebraic_expression_answer_group.feedback.text,
            '<p>Yes, well done!</p>')

        algebraic_expression_tagged_mis_skill = (
            algebraic_expression_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(
            algebraic_expression_tagged_mis_skill.skill_id, 'skill_id')
        self.assertEqual(
            algebraic_expression_tagged_mis_skill.misconception_id,
            'misconception_id')

        algebraic_expression_answer_group = (
            algebraic_expression_proto.answer_groups[0])
        algebraic_expression_rule_specs = (
            algebraic_expression_answer_group.rule_specs[0]
                .matches_exactly_with)
        self.assertEqual(
            algebraic_expression_rule_specs.algebraic_expression,
            'pi*r^2')

        algebraic_expression_rule_specs = (
            algebraic_expression_answer_group.rule_specs[1].is_equivalent_to)
        self.assertEqual(
            algebraic_expression_rule_specs.algebraic_expression,
            'pi*r^2')

        algebraic_expression_rule_specs = (
            algebraic_expression_answer_group.rule_specs[2])
        matches_trivial_rule = (
            algebraic_expression_rule_specs.matches_upTo_trivial_manipulations)
        self.assertEqual(
            matches_trivial_rule.algebraic_expression,
            'pi*r^2')
