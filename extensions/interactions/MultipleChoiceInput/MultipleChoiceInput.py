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
    def to_android_multiple_choice_input_proto(
            cls, default_outcome, customization_args, hints, answer_groups
    ):
        """Creates a MultipleChoiceInputInstanceDto proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            MultipleChoiceInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.MultipleChoiceInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for MultipleChoiceInputInstanceDto.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgsDto. The proto object.
        """
        choices_list_proto = [
            value.to_android_content_proto()
            for value in customization_args['choices'].value
        ]

        return state_pb2.MultipleChoiceInputInstanceDto.CustomizationArgsDto(
            choices=choices_list_proto
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for MultipleChoiceInputInstanceDto.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list(AnswerGroupDto). The proto object list.
        """
        answer_group_list_proto = []
        for answer_group in answer_groups:
            base_answer_group_proto = (
                answer_group.to_android_answer_group_proto())
            rules_spec_proto = cls._convert_rule_specs_to_proto(
                answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.MultipleChoiceInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _convert_rule_specs_to_proto(cls, rule_specs_list):
        """Creates a RuleSpecDto proto object.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list(RuleSpecDto). The proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_func_mapping = {
            'Equals': cls._convert_equals_rule_spec_to_proto
        }
        rule_type_to_proto_mapping = {
            'Equals': lambda x: (
                state_pb2.MultipleChoiceInputInstanceDto.RuleSpecDto(
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
    def _convert_equals_rule_spec_to_proto(cls, equal):
        """Creates a proto object for EqualsSpecDto.

        Args:
            equal: int. The input to match with.

        Returns:
            EqualsSpecDto. The proto object.
        """
        multiple_choice_dto = state_pb2.MultipleChoiceInputInstanceDto

        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return multiple_choice_dto.RuleSpecDto.EqualsSpecDto(
            input=int(equal)
        )
