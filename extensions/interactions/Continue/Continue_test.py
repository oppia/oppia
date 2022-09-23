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

"""Unit tests for Continue.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.Continue import Continue # pylint: disable=unused-import # isort: skip


class ContinueTests(test_utils.GenericTestBase):

    def test_continue_interaction_converted_to_proto_correctly(self):
        interaction_dict = {
            'answer_groups': [],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Click me!',
                    },
                },
            },
            'default_outcome': {
                'dest': 'end_state_name',
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>html outcome</p>',
                },
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'param_changes': [],
                'refresher_exploration_id': None,
            },
            'hints': [],
            'id': 'Continue',
            'solution': None,
        }
        continue_instance = (
            interaction_registry.Registry.get_interaction_by_id('Continue'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(interaction_dict))
        continue_proto = continue_instance.to_android_continue_proto(
            interaction_domain.default_outcome,
            interaction_domain.customization_args)

        self.assertEqual(
            continue_proto.customization_args.button_text.content_id,
            'ca_placeholder_0')
        self.assertEqual(
            continue_proto.customization_args.button_text.text,
            'Click me!')
        self.assertEqual(
            continue_proto.default_outcome.destination_state,
            'end_state_name')
        self.assertFalse(continue_proto.default_outcome.labelled_as_correct)
        self.assertEqual(
            continue_proto.default_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            continue_proto.default_outcome.feedback.text,
            '<p>html outcome</p>')
