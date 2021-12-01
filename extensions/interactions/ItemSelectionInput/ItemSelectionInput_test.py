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

"""Tests for ItemSelectionInput objects and methods defined on them."""

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

class ItemSelectionInputInteractionTests(test_utils.GenericTestBase):

    def test_to_proto(self):
        interaction_dict = {
            'answer_groups': [{
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
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': ['<p>Choice 1</p>', '<p>Choice 2</p>']
                    }
                }, {
                    'rule_type': 'ContainsAtLeastOneOf',
                    'inputs': {
                        'x': ['<p>Choice 1</p>', '<p>Choice 2</p>']
                    }
                }, {
                    'rule_type': 'DoesNotContainAtLeastOneOf',
                    'inputs': {
                        'x': ['<p>Choice 1</p>', '<p>Choice 2</p>']
                    }
                }, {
                    'rule_type': 'IsProperSubsetOf',
                    'inputs': {
                        'x': ['<p>Choice 1</p>', '<p>Choice 2</p>']
                    }
                }],
                'training_data': [],
                'tagged_skill_misconception_id': None
            }],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'choices': {
                    'value': [{
                        'content_id': 'ca_choices_2',
                        'html': '<p>Choice 1</p>'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': '<p>Choice 2</p>'
                    }]
                },
                'maxAllowableSelectionCount': {
                    'value': 2
                },
                'minAllowableSelectionCount': {
                    'value': 1
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
                'correct_answer': ['<p>Choice 1</p>'],
                'explanation': {
                    'content_id': 'solution',
                    'html': 'This is <i>solution</i> for state1'
                }
            },
            'id': 'ItemSelectionInput'
        }
        item_selection_input_instance = (
            interaction_registry.Registry.get_interaction_by_id(
                'ItemSelectionInput'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        item_selection_proto = item_selection_input_instance.to_proto(
            interaction_domain.default_outcome,
            interaction_domain.customization_args,
            interaction_domain.hints,
            interaction_domain.answer_groups)

        item_customization_args = (
            item_selection_proto.customization_args)
        self.assertEqual(
            item_customization_args.max_allowable_selection_count, 
            2)
        self.assertEqual(
            item_customization_args.min_allowable_selection_count, 
            1)
        self.assertEqual(
            item_customization_args.choices[0].content_id,
            'ca_choices_2')
        self.assertEqual(
            item_customization_args.choices[1].content_id,
            'ca_choices_3')
        self.assertEqual(
            item_customization_args.choices[0].text,
            '<p>Choice 1</p>')
        self.assertEqual(
            item_customization_args.choices[1].text,
            '<p>Choice 2</p>')

        item_default_outcome = item_selection_proto.default_outcome
        self.assertEqual(
            item_default_outcome.destination_state,
            'abc')
        self.assertEqual(
            item_default_outcome.feedback.text,
            'Correct Answer')
        self.assertEqual(
            item_default_outcome.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            item_default_outcome.labelled_as_correct,
            True)

        self.assertEqual(
            item_selection_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            item_selection_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            item_selection_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            item_selection_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        item_answer_group = (
            item_selection_proto.answer_groups[0]
                .base_answer_group.outcome)
        self.assertEqual(
            item_answer_group.destination_state,
            'abc')
        self.assertEqual(
            item_answer_group.labelled_as_correct,
            True)
        self.assertEqual(
            item_answer_group.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            item_answer_group.feedback.text,
            '<p>Feedback</p>')

        item_rule_spec = (
            item_selection_proto.answer_groups[0]
                .rule_specs[0].equals.input)
        self.assertEqual(
            item_rule_spec.content_ids[0].content_id,
            '<p>Choice 1</p>')
        self.assertEqual(
            item_rule_spec.content_ids[1].content_id,
            '<p>Choice 2</p>')

        item_rule_spec = (
            item_selection_proto.answer_groups[0]
                .rule_specs[1].contains_at_least_one_of.input)
        self.assertEqual(
            item_rule_spec.content_ids[0].content_id, 
            '<p>Choice 1</p>')
        self.assertEqual(
            item_rule_spec.content_ids[1].content_id,
            '<p>Choice 2</p>')

        item_rule_spec = (
            item_selection_proto.answer_groups[0]
                .rule_specs[2].does_not_contain_at_least_one_of.input)
        self.assertEqual(
            item_rule_spec.content_ids[0].content_id, 
            '<p>Choice 1</p>')
        self.assertEqual(
            item_rule_spec.content_ids[1].content_id,
            '<p>Choice 2</p>')

        item_rule_spec = (
            item_selection_proto.answer_groups[0]
                .rule_specs[3].is_proper_subset_of.input)
        self.assertEqual(
            item_rule_spec.content_ids[0].content_id, 
            '<p>Choice 1</p>')
        self.assertEqual(
            item_rule_spec.content_ids[1].content_id,
            '<p>Choice 2</p>')
