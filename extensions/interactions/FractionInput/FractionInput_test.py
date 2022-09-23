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

"""Unit tests for FractionInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.FractionInput import FractionInput # pylint: disable=unused-import # isort: skip


class FractionInputTests(test_utils.GenericTestBase):

    def test_fraction_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'id': 'FractionInput',
            'customization_args': {
                'requireSimplestForm': {
                     'value': False
                },
                'allowImproperFraction': {
                    'value': True
                },
                'allowNonzeroIntegerPart': {
                    'value': True
                },
                'customPlaceholder': {
                    'value': {
                        'content_id': 'ca_customPlaceholder_2',
                        'unicode_str': '😍😍😍😍'
                    }
                },
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
                    'rule_type': 'IsExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
                    }
                }, {
                    'rule_type': 'IsEquivalentTo',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
                    }
                }, {
                    'rule_type': 'IsEquivalentToAndInSimplestForm',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
                    }
                }, {
                    'rule_type': 'IsLessThan',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
                    }
                }, {
                    'rule_type': 'IsGreaterThan',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
                    }
                }, {
                    'rule_type': 'HasNumeratorEqualTo',
                    'inputs': {
                        'x': 5
                    }
                }, {
                    'rule_type': 'HasDenominatorEqualTo',
                    'inputs': {
                        'x': 10
                    }
                }, {
                    'rule_type': 'HasIntegerPartEqualTo',
                    'inputs': {
                        'x': 10
                    }
                }, {
                    'rule_type': 'HasNoFractionalPart',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
                    }
                }, {
                    'rule_type': 'HasFractionalPartExactlyEqualTo',
                    'inputs': {
                        'f': {
                            'denominator': 5,
                            'isNegative': False,
                            'numerator': 2,
                            'wholeNumber': 0
                        }
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
                'correct_answer': {
                    'denominator': 5,
                    'isNegative': False,
                    'numerator': 2,
                    'wholeNumber': 0
                },
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>This is solution for fraction.</p>'
                }
            }
        }
        fraction_input = (
            interaction_registry.Registry.get_interaction_by_id('FractionInput')
        )
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(interaction_dict))
        fraction_input_proto = fraction_input.to_android_fraction_input_proto(
            interaction_domain.default_outcome,
            interaction_domain.customization_args,
            interaction_domain.hints,
            interaction_domain.solution,
            interaction_domain.answer_groups)

        fraction_input_customization_args = (
            fraction_input_proto.customization_args)
        self.assertFalse(
            fraction_input_customization_args.requires_simplest_form)
        self.assertTrue(
            fraction_input_customization_args.allow_improper_fractions)
        self.assertTrue(
            fraction_input_customization_args.allow_nonzero_integer_part)
        self.assertEqual(
            fraction_input_customization_args.placeholder.content_id,
            'ca_customPlaceholder_2')
        self.assertEqual(
            fraction_input_customization_args.placeholder.text,
            '😍😍😍😍')

        fraction_input_outcome = fraction_input_proto.default_outcome
        self.assertEqual(
            fraction_input_outcome.destination_state,
            'Introduction')
        self.assertEqual(
            fraction_input_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            fraction_input_outcome.feedback.text,
            '<p> introduce </p>')
        self.assertFalse(
            fraction_input_outcome.labelled_as_correct)

        self.assertEqual(
            fraction_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            fraction_input_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            fraction_input_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            fraction_input_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        fraction_input_correct_ans = (
            fraction_input_proto.solution.correct_answer)
        self.assertFalse(fraction_input_correct_ans.is_negative)
        self.assertEqual(fraction_input_correct_ans.whole_number, 0)
        self.assertEqual(fraction_input_correct_ans.numerator, 2)
        self.assertEqual(fraction_input_correct_ans.denominator, 5)

        self.assertEqual(
            fraction_input_proto.solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            fraction_input_proto.solution.base_solution.explanation.text,
            '<p>This is solution for fraction.</p>')

        fraction_input_answer_group = (
            fraction_input_proto.answer_groups[0].base_answer_group.outcome)
        self.assertEqual(
            fraction_input_answer_group.destination_state,
            'Number With Units')
        self.assertFalse(fraction_input_answer_group.labelled_as_correct)
        self.assertEqual(
            fraction_input_answer_group.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            fraction_input_answer_group.feedback.text,
            '<p>Yes, well done!</p>')

        fraction_input_tagged_mis_skill = (
            fraction_input_proto.answer_groups[0]
                .base_answer_group.tagged_skill_misconception)
        self.assertEqual(fraction_input_tagged_mis_skill.skill_id, 'skill_id')
        self.assertEqual(
            fraction_input_tagged_mis_skill.misconception_id,
            'misconception_id')

        fraction_input_answer_group = fraction_input_proto.answer_groups[0]
        fraction_input_rule_specs = (
            fraction_input_answer_group.rule_specs[0]
                .is_exactly_equal_to)
        self.assertEqual(
            fraction_input_rule_specs.input.denominator, 5)
        self.assertEqual(
            fraction_input_rule_specs.input.numerator, 2)
        self.assertEqual(
            fraction_input_rule_specs.input.whole_number, 0)
        self.assertFalse(fraction_input_rule_specs.input.is_negative)

        fraction_input_rule_specs = (
            fraction_input_answer_group.rule_specs[1].is_equivalent_to)
        self.assertEqual(
            fraction_input_rule_specs.input.denominator, 5)
        self.assertEqual(
            fraction_input_rule_specs.input.numerator, 2)
        self.assertEqual(
            fraction_input_rule_specs.input.whole_number, 0)
        self.assertFalse(fraction_input_rule_specs.input.is_negative)

        fraction_input_rule_specs = (
            fraction_input_answer_group.rule_specs[2]
                .is_equivalent_to_and_in_simplest_form)
        self.assertEqual(
            fraction_input_rule_specs.input.denominator, 5)
        self.assertEqual(
            fraction_input_rule_specs.input.numerator, 2)
        self.assertEqual(
            fraction_input_rule_specs.input.whole_number, 0)
        self.assertFalse(fraction_input_rule_specs.input.is_negative)

        fraction_input_rule_specs = (
            fraction_input_answer_group.rule_specs[3].is_less_than)
        self.assertEqual(
            fraction_input_rule_specs.input.denominator, 5)
        self.assertEqual(
            fraction_input_rule_specs.input.numerator, 2)
        self.assertEqual(
            fraction_input_rule_specs.input.whole_number, 0)
        self.assertFalse(fraction_input_rule_specs.input.is_negative)

        fraction_input_rule_specs = (
            fraction_input_answer_group.rule_specs[4].is_greater_than)
        self.assertEqual(
            fraction_input_rule_specs.input.denominator, 5)
        self.assertEqual(
            fraction_input_rule_specs.input.numerator, 2)
        self.assertEqual(
            fraction_input_rule_specs.input.whole_number, 0)
        self.assertFalse(fraction_input_rule_specs.input.is_negative)

        self.assertEqual(
            fraction_input_answer_group.rule_specs[5]
                .has_numerator_equal_to.input, 5)

        self.assertEqual(
            fraction_input_answer_group.rule_specs[6]
                .has_denominator_equal_to.input, 10)

        self.assertEqual(
            fraction_input_answer_group.rule_specs[7]
                .has_integer_part_equal_to.input, 10)

        fraction_input_rule_specs = (
            fraction_input_answer_group.rule_specs[9]
                .has_fractional_part_exactly_equal_to)
        self.assertEqual(
            fraction_input_rule_specs.input.denominator, 5)
        self.assertEqual(
            fraction_input_rule_specs.input.numerator, 2)
        self.assertEqual(
            fraction_input_rule_specs.input.whole_number, 0)
        self.assertFalse(fraction_input_rule_specs.input.is_negative)
