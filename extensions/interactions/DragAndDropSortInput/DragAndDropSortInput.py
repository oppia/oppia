# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
"""Python configuration for DragAndDropSortInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import objects_pb2
from proto_files import state_pb2

RULE_SPEC_DTO = state_pb2.DragAndDropSortInputInstanceDto.RuleSpecDto


class DragAndDropSortInput(base.BaseInteraction):
    """Interaction for Drag and Drop Sorting."""

    name = 'Drag And Drop Sort'
    description = 'Allows learners to drag and drop items for sorting.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable = False
    _dependency_ids = []
    answer_type = 'ListOfSetsOfTranslatableHtmlContentIds'
    instructions = 'I18N_INTERACTIONS_DRAG_AND_DROP_INSTRUCTION'
    narrow_instructions = 'I18N_INTERACTIONS_DRAG_AND_DROP_INSTRUCTION'
    needs_summary = True
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'choices',
        'description': 'Items for drag and drop',
        'schema': {
            'type': 'list',
            'validators': [{
                'id': 'has_length_at_least',
                # NOTE: There is slightly stricter validation of the number of
                # minimum choices in frontend. It should be at least 2 from the
                # frontend perspective but we can't impose it here as min_value
                # in the customization schema determines the number of RTEs that
                # appear in the customization modal initially that needs to be
                # 1. Here min_value: 2 and default_value: [''] aren't allowed as
                # default_value needs to be at least of same length as min_value
                # else schema tests for customization args will fail.
                'min_value': 1
            }],
            'items': {
                'type': 'custom',
                'obj_type': 'SubtitledHtml',
                'replacement_ui_config': {
                    'html': {
                        'hide_complex_extensions': True,
                        'placeholder': (
                            'Enter an option for the learner to drag and drop.')
                    }
                }
            },
            'ui_config': {
                'add_element_text': 'Add a new item',
            }
        },
        'default_value': [{
            'content_id': None,
            'html': ''
        }],
    }, {
        'name': 'allowMultipleItemsInSamePosition',
        'description': 'Allow multiple sort items in the same position',
        'schema': {
            'type': 'bool'
        },
        'default_value': False
    }]

    _answer_visualization_specs = []

    @classmethod
    def to_android_drag_and_drop_sort_input_proto(
            cls, default_outcome, customization_args,
            solution, hints, answer_groups
    ):
        """Creates a DragAndDropSortInputInstanceDto proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            solution: Solution. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            DragAndDropSortInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args))
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.DragAndDropSortInputInstanceDto(
            customization_args=customization_args_proto,
            hints=hints_proto_list,
            default_outcome=outcome_proto,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for DragAndDropSortInputInstanceDto.

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
            rules_spec_proto = (
                cls._convert_rule_specs_to_proto(answer_group.rule_specs))
            answer_group_list_proto.append(
                state_pb2.DragAndDropSortInputInstanceDto.AnswerGroupDto(
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
            'IsEqualToOrdering': cls._convert_equal_rule_spec_to_proto,
            'IsEqualToOrderingWithOneItemAtIncorrectPosition': (
                cls._convert_equal_one_incorrect_rule_spec_to_proto),
            'HasElementXAtPositionY': (
                cls._convert_has_element_x_at_rule_spec_to_proto),
            'HasElementXBeforeElementY': (
                cls._convert_has_element_x_before_rule_spec_to_proto)
        }

        rule_type_to_proto_mapping = {
            'IsEqualToOrdering': lambda x: (
                state_pb2.DragAndDropSortInputInstanceDto.RuleSpecDto(
                    is_equal_to_ordering=x)),
            'IsEqualToOrderingWithOneItemAtIncorrectPosition': lambda x: (
                state_pb2.DragAndDropSortInputInstanceDto.RuleSpecDto(
                    is_equal_to_ordering_with_one_item_at_incorrect_position=x)
            ),
            'HasElementXAtPositionY': lambda x: (
                state_pb2.DragAndDropSortInputInstanceDto.RuleSpecDto(
                    has_element_x_at_position_y=x)),
            'HasElementXBeforeElementY': lambda x: (
                state_pb2.DragAndDropSortInputInstanceDto.RuleSpecDto(
                    has_element_x_before_element_y=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_func_mapping[rule_type](rule_spec.inputs)
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _convert_equal_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsEqualToOrderingSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsEqualToOrderingSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsEqualToOrderingSpecDto(
            input=cls._convert_list_of_set_of_translatable_html_content_ids_to_proto(# pylint: disable=line-too-long
                input_dict['x'])
        )

    @classmethod
    def _convert_equal_one_incorrect_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object
        for IsEqualToOrderingWithOneItemAtIncorrectPositionSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsEqualToOrderingWithOneItemAtIncorrectPositionSpecDto.
            The proto object.
        """
        return RULE_SPEC_DTO.IsEqualToOrderingWithOneItemAtIncorrectPositionSpecDto( # pylint: disable=line-too-long
            input=cls._convert_list_of_set_of_translatable_html_content_ids_to_proto( # pylint: disable=line-too-long
                input_dict['x'])
        )

    @classmethod
    def _convert_has_element_x_at_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsEqualToOrderingSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsEqualToOrderingSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.HasElementXAtPositionYSpecDto(
            element=cls._convert_translatable_html_content_id_to_proto(
                input_dict['x']),
            position=input_dict['y']
        )

    @classmethod
    def _convert_has_element_x_before_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsEqualToOrderingSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsEqualToOrderingSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.HasElementXBeforeElementYSpecDto(
            considered_element=(
                cls._convert_translatable_html_content_id_to_proto(
                    input_dict['x'])),
            later_element=cls._convert_translatable_html_content_id_to_proto(
                input_dict['y'])
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a Solution proto object
        for DragAndDropSortInputInstanceDto.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = (
                state_pb2.DragAndDropSortInputInstanceDto.SolutionDto(
                    base_solution=solution.to_android_solution_proto(),
                    correct_answer=(
                        cls._convert_list_of_set_of_translatable_html_content_ids_to_proto( # pylint: disable=line-too-long
                            solution.correct_answer)
                    )
                )
            )

        return solution_proto

    @classmethod
    def _convert_list_of_set_of_translatable_html_content_ids_to_proto(
            cls, correct_answer
    ):
        """Creates a ListOfSetsOfTranslatableHtmlContentIdsDto proto object.

        Args:
            correct_answer: list(list(str)). A list of set
                of TranslatableHtmlContentId.

        Returns:
            ListOfSetsOfTranslatableHtmlContentIdsDto. The proto object.
        """
        content_id_lists_proto = [
            cls._convert_set_of_translatable_html_content_ids_to_proto(
                set_of_content_id
            ) for set_of_content_id in correct_answer
        ]

        return objects_pb2.ListOfSetsOfTranslatableHtmlContentIdsDto(
            content_id_sets=content_id_lists_proto
        )

    @classmethod
    def _convert_set_of_translatable_html_content_ids_to_proto(
            cls, set_of_content_id
    ):
        """Creates a SetOfTranslatableHtmlContentIdsDto proto object.

        Args:
            set_of_content_id: list(str). A list of
                TranslatableHtmlContentId.

        Returns:
            SetOfTranslatableHtmlContentIdsDto. The proto object.
        """
        content_id_lists_proto = [
            cls._convert_translatable_html_content_id_to_proto(
                translatable_html_content_id
            ) for translatable_html_content_id in set_of_content_id
        ]

        return objects_pb2.SetOfTranslatableHtmlContentIdsDto(
            content_ids=content_id_lists_proto
        )

    @classmethod
    def _convert_translatable_html_content_id_to_proto(
            cls, translatable_html_content_id
    ):
        """Creates a TranslatableHtmlContentIdDto proto object.

        Args:
            translatable_html_content_id: str. A
                TranslatableHtml content id.

        Returns:
            TranslatableHtmlContentIdDto. The proto object.
        """
        return objects_pb2.TranslatableHtmlContentIdDto(
            content_id=translatable_html_content_id
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
            for DragAndDropSortInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgsDto. The CustomizationArgsDto proto object.
        """
        choices_list_proto = [
            value.to_android_content_proto()
            for value in customization_args['choices'].value
        ]

        return state_pb2.DragAndDropSortInputInstanceDto.CustomizationArgsDto(
            choices=choices_list_proto,
            allowMultipleItemsInSamePosition=(
                customization_args['allowMultipleItemsInSamePosition'].value
            )
        )
