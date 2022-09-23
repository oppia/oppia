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

"""Unit tests for ImageClickInput.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.domain import state_domain
from core.tests import test_utils

from extensions.interactions.ImageClickInput import ImageClickInput # pylint: disable=unused-import # isort: skip


class ImageClickInputTests(test_utils.GenericTestBase):

    def test_image_click_input_converted_to_proto_correctly(self):
        interaction_dict = {
            'answer_groups': [{
                'outcome': {
                    'dest': 'Image Region',
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>That the class definition. Try again.</p>'
                    },
                    'labelled_as_correct': False,
                    'missing_prerequisite_skill_id': None,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                },
                'rule_specs': [{
                    'inputs': {
                        'x': 'classdef'
                    },
                    'rule_type': 'IsInRegion'
                }],
                'tagged_skill_misconception_id': 'skill_id-misconception_id',
                'training_data': []
            }],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'highlightRegionsOnHover': {'value': True},
                'imageAndRegions': {
                    'value': {
                        'imagePath': 's1ImagePath.png',
                        'labeledRegions': [{
                            'label': 'classdef',
                            'region': {
                                'area': [
                                    [
                                        0.004291845493562232,
                                        0.004692192192192192
                                    ], [
                                        0.40987124463519314,
                                        0.05874624624624625
                                    ]
                                ],
                                'regionType': 'Rectangle'
                            }
                        }]
                    }
                }
            },
            'default_outcome': {
                'dest': 'Image Region',
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p> Default Outcome </p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a copyright character ©.</p>'
                }
            }],
            'id': 'ImageClickInput',
            'solution': None
        }
        image_click_input = (
            interaction_registry.Registry.get_interaction_by_id(
                'ImageClickInput'))
        interaction_domain = (
            state_domain.InteractionInstance.from_dict(
                interaction_dict))
        image_click_input_proto = (
            image_click_input.to_android_image_click_input_proto(
                interaction_domain.default_outcome,
                interaction_domain.customization_args,
                interaction_domain.hints,
                interaction_domain.answer_groups))

        image_click_input_customization_args = (
            image_click_input_proto.customization_args.image_and_regions)
        self.assertEqual(
            image_click_input_customization_args.image_file_path,
            's1ImagePath.png')
        self.assertEqual(
            image_click_input_customization_args.labeled_regions[0]
                .label,
            'classdef')
        self.assertEqual(
            image_click_input_customization_args.labeled_regions[0]
                .normalized_rectangle_2d.top_left.x,
            0.004291845493562232)
        self.assertEqual(
            image_click_input_customization_args.labeled_regions[0]
                .normalized_rectangle_2d.bottom_right.y,
            0.05874624624624625)
        self.assertEqual(
            image_click_input_customization_args.labeled_regions[0]
                .normalized_rectangle_2d.top_left.y,
            0.004692192192192192)
        self.assertEqual(
            image_click_input_customization_args.labeled_regions[0]
                .normalized_rectangle_2d.bottom_right.x,
            0.40987124463519314)

        image_click_input_answer_group = (
            image_click_input_proto.answer_groups[0].base_answer_group.outcome)
        self.assertEqual(
            image_click_input_answer_group.destination_state,
            'Image Region')
        self.assertFalse(image_click_input_answer_group.labelled_as_correct)
        self.assertEqual(
            image_click_input_answer_group.feedback.content_id,
            'feedback_1')
        self.assertEqual(
            image_click_input_answer_group.feedback.text,
            '<p>That the class definition. Try again.</p>')

        self.assertEqual(
            image_click_input_proto.answer_groups[0].rule_specs[0]
                .is_in_region.input_region,
            'classdef')

        self.assertEqual(
            image_click_input_proto.default_outcome.destination_state,
            'Image Region')
        self.assertEqual(
            image_click_input_proto.default_outcome.feedback.content_id,
            'default_outcome')
        self.assertEqual(
            image_click_input_proto.default_outcome.feedback.text,
            '<p> Default Outcome </p>')
        self.assertFalse(
            image_click_input_proto.default_outcome.labelled_as_correct,
            False)

        self.assertEqual(
            image_click_input_proto.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            image_click_input_proto.hints[0].hint_content.text,
            '<p>This is a copyright character ©.</p>')
