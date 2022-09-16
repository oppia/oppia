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

"""Unit tests for MultipleChoiceInput.py"""

from __future__ import annotations

from core.domain import interaction_registry, state_domain
from core.tests import test_utils
from extensions.interactions.MultipleChoiceInput import MultipleChoiceInput # pylint: disable=unused-import, line-too-long # isort: skip


class MultipleChoiceInputTests(test_utils.GenericTestBase):

    def test_multiple_choice_input_converted_to_proto_correctly(self):
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                    'x': 5
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        interaction_dict = {
            'answer_groups': [answer_group],
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
                'showChoicesInShuffledOrder': {'value': True}
            },
            'default_outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': False,
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
                'answer_is_exclusive': False,
                'correct_answer': 1,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>This is a solution.</p>'
                }
            },
            'id': 'MultipleChoiceInput'
        }
        multiple_choice_input = (
            interaction_registry.Registry.get_interaction_by_id(
                'MultipleChoiceInput'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        multiple_choice_input_proto = (
            multiple_choice_input.to_android_multiple_choice_input_proto(
                interaction_domain.default_outcome,
                interaction_domain.customization_args,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        multiple_choice_input_customization_args = (
            multiple_choice_input_proto.customization_args)
        self.assertEqual(
            multiple_choice_input_customization_args.choices[0].content_id,
            'ca_choices_2')
        self.assertEqual(
            multiple_choice_input_customization_args.choices[1].content_id,
            'ca_choices_3')
        self.assertEqual(
            multiple_choice_input_customization_args.choices[0].text,
            '<p>Choice 1</p>')
        self.assertEqual(
            multiple_choice_input_customization_args.choices[1].text,
            '<p>Choice 2</p>')

        mutliple_choice_input_default_outcome = (
            multiple_choice_input_proto.default_outcome)
        self.assertEqual(
            mutliple_choice_input_default_outcome.destination_state,
            'abc')
        self.assertFalse(
            mutliple_choice_input_default_outcome.labelled_as_correct)
        self.assertEqual(
            mutliple_choice_input_default_outcome.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            mutliple_choice_input_default_outcome.feedback.text,
            'Correct Answer')

        self.assertEqual(
            multiple_choice_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            multiple_choice_input_proto.hints[1].hint_content.content_id,
            'hint_2')
        self.assertEqual(
            multiple_choice_input_proto.hints[0].hint_content.text,
            '<p>This is a first hint.</p>')
        self.assertEqual(
            multiple_choice_input_proto.hints[1].hint_content.text,
            '<p>This is the second hint.</p>')

        self.assertEqual(
            multiple_choice_input_proto.answer_groups[0].rule_specs[0]
                .equals.input,
            5)
