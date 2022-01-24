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

"""Tests for AlgebraicExpressionInput objects and methods defined on them."""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils


class AlgebraicExpressionInputInteractionTests(test_utils.GenericTestBase):

    def test_algebric_expression_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'id': 'AlgebraicExpressionInput',
            'customization_args': {
                'customOskLetters': {
                     'value': ['\u03C0', '\u03C0']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'answer_groups': [{
                'outcome': {
                    'dest': 'Number With Units',
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
                    'rule_type': 'ContainsSomeOf',
                    'inputs': {
                        'x': 'pi*r^2'
                    }
                }, {
                    'rule_type': 'OmitsSomeOf',
                    'inputs': {
                        'x': 'pi*r^2'
                    }
                }, {
                    'rule_type': 'MatchesWithGeneralForm',
                    'inputs': {
                        'x': 'pi*r^2',
                        'y': ['pi*r^2', 'pi*r^2']
                    }
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skill_id-misconception_id'
            }],
            'default_outcome': {
                'dest': 'Introduction',
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
                    'html': '<p>This is solution for algebric.</p>'
                }
            }
        }
        registery = interaction_registry.Registry
        algebric_instance = (
            registery.get_interaction_by_id('AlgebraicExpressionInput')
        )
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(interaction_dict))
        algebric_proto = algebric_instance.to_android_algebric_expression_proto(
            interaction_domain.default_outcome,
            interaction_domain.customization_args,
            interaction_domain.solution,
            interaction_domain.hints,
            interaction_domain.answer_groups)

        algebric_customization_args = algebric_proto.customization_args
        self.assertEqual(
            algebric_customization_args.custom_osk_letters[0],
            '\u03C0'
        )
        self.assertFalse(algebric_customization_args.use_fraction_for_division)

        algebric_outcome = algebric_proto.default_outcome
        self.assertEqual(
            algebric_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            algebric_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            algebric_outcome.feedback.text,
            '<p> introduce </p>')
        self.assertFalse(
            algebric_outcome.labelled_as_correct)

        self.assertEqual(
            algebric_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            algebric_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            algebric_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            algebric_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        algebric_solution = algebric_proto.solution
        self.assertEqual(algebric_solution.correct_answer, 'Correct Answer')

        self.assertEqual(
            algebric_proto.solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            algebric_proto.solution.base_solution.explanation.text,
            '<p>This is solution for algebric.</p>')

        algebric_answer_group = (
            algebric_proto.answer_groups[0].base_answer_group.outcome)
        self.assertEqual(
            algebric_answer_group.destination_state,
            'Number With Units')
        self.assertFalse(algebric_answer_group.labelled_as_correct)
        self.assertEqual(
            algebric_answer_group.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            algebric_answer_group.feedback.text,
            '<p>Yes, well done!</p>')

        algebric_mis_skill = (
            algebric_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(algebric_mis_skill.skill_id, 'skill_id')
        self.assertEqual(
            algebric_mis_skill.misconception_id, 'misconception_id')

        algebric_answer_group = algebric_proto.answer_groups[0]
        algebric_rule_specs = (
            algebric_answer_group.rule_specs[0]
                .matches_exactly_with)
        self.assertEqual(
            algebric_rule_specs.algebraic_expression,
            'pi*r^2')

        algebric_rule_specs = (
            algebric_answer_group.rule_specs[1].is_equivalent_to)
        self.assertEqual(
            algebric_rule_specs.algebraic_expression,
            'pi*r^2')

        algebric_rule_specs = (
            algebric_answer_group.rule_specs[2]
                .contains_some_of)
        self.assertEqual(
            algebric_rule_specs.algebraic_expression,
            'pi*r^2')

        algebric_rule_specs = (
            algebric_answer_group.rule_specs[3].omits_some_of)
        self.assertEqual(
            algebric_rule_specs.algebraic_expression,
            'pi*r^2')

        algebric_rule_specs = (
            algebric_answer_group.rule_specs[4].matches_with_general_form)
        self.assertEqual(
            algebric_rule_specs.algebraic_expression,
            'pi*r^2')
        self.assertEqual(
            algebric_rule_specs.set_of_algebraic_identifier[0],
            'pi*r^2')
