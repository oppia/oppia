# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Python configuration for MultipleChoiceInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import state_pb2


class MultipleChoiceInput(base.BaseInteraction):
    """Interaction for multiple choice input."""

    name = 'Multiple Choice'
    description = (
        'Allows learners to select one of a list of multiple-choice options.')
    display_mode = base.DISPLAY_MODE_INLINE
    _dependency_ids = []
    answer_type = 'NonnegativeInt'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    # Radio buttons get unselected when specifying a solution. This needs to be
    # fixed before solution feature can support this interaction.
    can_have_solution = False
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'choices',
        'description': 'Multiple Choice options',
        'schema': {
            'type': 'list',
            'validators': [{
                'id': 'has_length_at_least',
                'min_value': 1,
            }],
            'items': {
                'type': 'custom',
                'obj_type': 'SubtitledHtml',
                'replacement_ui_config': {
                    'html': {
                        'hide_complex_extensions': True,
                        'placeholder': (
                            'Enter an option for the learner to select'),
                    }
                }
            },
            'ui_config': {
                'add_element_text': 'Add multiple choice option',
            }
        },
        'default_value': [{
            'content_id': None,
            'html': ''
        }],
    }, {
        'name': 'showChoicesInShuffledOrder',
        'description': 'Shuffle answer choices',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }]

    _answer_visualization_specs = [{
        'id': 'SortedTiles',
        'options': {'header': 'Top answers', 'use_percentages': True},
        'calculation_id': 'AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]

    @classmethod
    def to_proto(
        cls, default_outcome, customization_args, hints, answer_groups
    ):
        """Creates a MultipleChoiceInputInstance proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            MultipleChoiceInputInstance. The proto object.
        """
        customization_args_proto = (
            cls._to_customization_args_proto(customization_args)
        )
        outcome_proto = default_outcome.to_proto()
        hints_proto_list = cls.get_hint_proto(cls, hints)
        answer_groups_proto = cls._to_answer_groups_proto(answer_groups)

        return state_pb2.MultipleChoiceInputInstance(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
        for MultipleChoiceInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The proto object.
        """
        choices_list_proto = [
            value.to_proto() for value in customization_args['choices'].value
        ]

        return state_pb2.MultipleChoiceInputInstance.CustomizationArgs(
            choices=choices_list_proto
        )

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
        for MultipleChoiceInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []
        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            rules_spec_proto = cls._to_multiple_input_specs_proto(
                answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.MultipleChoiceInputInstance.AnswerGroup(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _to_multiple_input_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_func_mapping = {
            'Equals': cls._to_equal_to_proto
        }
        rule_type_to_proto_mapping = {
             'Equals': lambda x: (
                state_pb2.MultipleChoiceInputInstance.RuleSpec(
                    equals=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_func_mapping[rule_type](
                    rule_spec.inputs['x']
                )
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _to_equal_to_proto(cls, equal):
        """Creates a proto object for EqualsSpec.

        Args:
            equal: int. The input to match with.

        Returns:
            EqualsSpec. The proto object.
        """
        return state_pb2.MultipleChoiceInputInstance.RuleSpec.EqualsSpec(
            input=equal)
