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

"""Tests for DragAndDropSortInput objects and methods defined on them."""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils


class DragAndDropSortInputInteractionTests(test_utils.GenericTestBase):

    def test_drag_and_drop_sort_input_converted_to_proto_correctly(self):
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': True,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': [['<p>Choice 1</p>', '<p>Choice 2</p>']]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'inputs': {
                    'x': [['<p>Choice 1</p>']]
                },
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition'
            }, {
                'inputs': {
                    'x': '<p>Choice 1</p>',
                    'y': 1
                },
                'rule_type': 'HasElementXAtPositionY'
            }, {
                'inputs': {
                    'x': '<p>Choice 1</p>',
                    'y': '<p>Choice 2</p>'
                },
                'rule_type': 'HasElementXBeforeElementY'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        interaction_dict = {
            'answer_groups': [answer_group],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'allowMultipleItemsInSamePosition': {
                    'value': True
                },
                'choices': {
                    'value': [{
                        'content_id': 'ca_choices_2',
                        'html': '<p>Choice 1</p>'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': '<p>Choice 2</p>'
                    }]
                }
            },
            'default_outcome': {
                'dest': 'abc',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a copyright character ©.</p>'
                }
            }],
            'solution': {
                'answer_is_exclusive': True,
                'correct_answer': [['<p>Choice 1</p>', '<p>Choice 2</p>']],
                'explanation': {
                    'content_id': 'solution',
                    'html': 'This is <i>solution</i> for state1'
                }
            },
            'id': 'DragAndDropSortInput'
        }
        drag_and_drop_instance = (
            interaction_registry.Registry.get_interaction_by_id(
                'DragAndDropSortInput'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        drag_and_drop_proto = (
            drag_and_drop_instance.to_android_drag_drop_input_proto(
                interaction_domain.default_outcome,
                interaction_domain.customization_args,
                interaction_domain.solution,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        self.assertEqual(
            drag_and_drop_proto.default_outcome.destination_state,
            'abc')
        self.assertEqual(
            drag_and_drop_proto.default_outcome.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            drag_and_drop_proto.default_outcome.feedback.text,
            'Correct Answer')
        self.assertTrue(drag_and_drop_proto.default_outcome.labelled_as_correct)

        self.assertEqual(
            drag_and_drop_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            drag_and_drop_proto.hints[0].hint_content.text,
            '<p>This is a copyright character ©.</p>')

        self.assertEqual(
            drag_and_drop_proto.solution.base_solution.explanation.content_id,
            'solution')
        self.assertEqual(
            drag_and_drop_proto.solution.base_solution.explanation.text,
            'This is <i>solution</i> for state1')

        self.assertEqual(
            drag_and_drop_proto.solution.correct_answer.content_id_sets[0]
                .content_ids[0].content_id,
            '<p>Choice 1</p>')

        drag_input_rule_spec = (
            drag_and_drop_proto.answer_groups[0].rule_specs[0]
                .is_equal_to_ordering.input)
        self.assertEqual(
            drag_input_rule_spec.content_id_sets[0].content_ids[0]
                .content_id,
            '<p>Choice 1</p>')
        self.assertEqual(
            drag_input_rule_spec.content_id_sets[0].content_ids[1]
                .content_id,
            '<p>Choice 2</p>')

        drag_input_rule_spec = (
            drag_and_drop_proto.answer_groups[0].rule_specs[1]
                .is_equal_to_ordering_with_one_item_at_incorrect_position.input)
        self.assertEqual(
            drag_input_rule_spec.content_id_sets[0].content_ids[0]
                .content_id,
            '<p>Choice 1</p>')

        drag_input_rule_spec = (
            drag_and_drop_proto.answer_groups[0].rule_specs[2]
                .has_element_x_at_position_y)
        self.assertEqual(
            drag_input_rule_spec.element.content_id,
            '<p>Choice 1</p>')
        self.assertEqual(
            drag_input_rule_spec.position,
            1)

        drag_input_rule_spec = (
            drag_and_drop_proto.answer_groups[0].rule_specs[3]
                .has_element_x_before_element_y)
        self.assertEqual(
            drag_input_rule_spec.considered_element.content_id,
            '<p>Choice 1</p>')
        self.assertEqual(
            drag_input_rule_spec.later_element.content_id,
            '<p>Choice 2</p>')
