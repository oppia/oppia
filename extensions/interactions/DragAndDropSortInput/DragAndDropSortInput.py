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


class DragAndDropSortInput(base.BaseInteraction):
    """Interaction for Drag and Drop Sorting."""

    name = 'Drag And Drop Sort'
    description = 'Allows learners to drag and drop items for sorting.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable = False
    _dependency_ids = []
    answer_type = 'ListOfSetsOfTranslatableHtmlContentIds'
    instructions = 'Drag and drop items'
    narrow_instructions = 'Drag and drop items'
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
    def to_proto(cls, interaction):
        """Creates a DragAndDropSortInputInstance proto object.

        Args:
            interaction: InteractionInstance. The interaction instance
                associated with this state.

        Returns:
            DragAndDropSortInputInstance. The
            DragAndDropSortInputInstance proto object.
        """
        customization_args_proto = (
            cls._to_customization_args_proto(
                interaction.customization_args)
        )

        outcome_proto = interaction.default_outcome.to_proto()

        hints_proto_list = cls.get_hint_proto(cls, interaction.hints)

        solution_proto = cls._to_solution_proto(
            interaction.solution)

        answer_groups_proto = (
            cls._to_answer_groups_proto(
                interaction.answer_groups)
        )

        drag_and_drop_interaction_proto = (
            state_pb2.DragAndDropSortInputInstance(
                customization_args=customization_args_proto,
                hints=hints_proto_list,
                default_outcome=outcome_proto,
                solution=solution_proto,
                answer_groups=answer_groups_proto
            )
        )

        return drag_and_drop_interaction_proto

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
            for DragAndDropSortInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []

        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            answer_group_proto = (
                state_pb2.DragAndDropSortInputInstance.AnswerGroup(
                    base_answer_group=base_answer_group_proto
                )
            )
            answer_group_list_proto.append(answer_group_proto)

        return answer_group_list_proto

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object
            for DragAndDropSortInputInstance.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            Solution. The Solution proto object.
        """
        solution_proto = None
        if solution is not None:
            solution_proto = (
                state_pb2.DragAndDropSortInputInstance.Solution(
                    base_solution=solution.to_proto(),
                    correct_answer=(
                        cls._to_list_of_set_of_translatable_html_content_ids(
                            solution.correct_answer)
                    )
                )
            )

        return solution_proto

    @classmethod
    def _to_list_of_set_of_translatable_html_content_ids(
        cls, correct_answer
    ):
        """Creates a ListOfSetsOfTranslatableHtmlContentIds proto object.

        Args:
            correct_answer: list. A list of set of
                TranslatableHtmlContentId.

        Returns:
            ListOfSetsOfTranslatableHtmlContentIds. The
            ListOfSetsOfTranslatableHtmlContentIds proto object.
        """
        content_id_lists_proto = []

        for set_of_content_id in correct_answer:
            translatable_html_content_id_proto = (
                cls._to_set_of_translatable_html_content_ids_proto(
                    set_of_content_id)
            )
            content_id_lists_proto.append(translatable_html_content_id_proto)

        list_of_set_of_translatable_html_content_ids_proto = (
            objects_pb2.ListOfSetsOfTranslatableHtmlContentIds(
                content_id_sets=content_id_lists_proto)
        )

        return list_of_set_of_translatable_html_content_ids_proto

    @classmethod
    def _to_set_of_translatable_html_content_ids_proto(cls, set_of_content_id):
        """Creates a SetOfTranslatableHtmlContentIds proto object.

        Args:
            set_of_content_id: list. A list of
                TranslatableHtmlContentId.

        Returns:
            SetOfTranslatableHtmlContentIds. The
            SetOfTranslatableHtmlContentIds proto object.
        """
        content_id_lists_proto = []

        for translatable_html_content_id in set_of_content_id:
            translatable_html_content_id_proto = (
                cls._to_translatable_html_content_id_proto(
                    translatable_html_content_id)
            )
            content_id_lists_proto.append(translatable_html_content_id_proto)

        set_of_translatable_html_content_ids_proto = (
            objects_pb2.SetOfTranslatableHtmlContentIds(
                content_ids=content_id_lists_proto)
        )

        return set_of_translatable_html_content_ids_proto

    @classmethod
    def _to_translatable_html_content_id_proto(
        cls, translatable_html_content_id
    ):
        """Creates a TranslatableHtmlContentId proto object.

        Args:
            translatable_html_content_id: str. A
                TranslatableHtml content id.

        Returns:
            TranslatableHtmlContentId. The
            TranslatableHtmlContentId proto object.
        """
        translatable_html_content_id_proto = (
            objects_pb2.TranslatableHtmlContentId(
                content_id=translatable_html_content_id)
        )

        return translatable_html_content_id_proto

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
            for DragAndDropSortInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The CustomizationArgs proto object.
        """
        choices_list_proto = [
            value.to_proto() for value in customization_args['choices'].value
        ]

        customization_arg_proto = (
            state_pb2.DragAndDropSortInputInstance.CustomizationArgs(
                choices=choices_list_proto,
                allowMultipleItemsInSamePosition=(
                    customization_args['allowMultipleItemsInSamePosition'].value
                )
            )
        )

        return customization_arg_proto
