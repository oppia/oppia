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

"""Python configuration for TextInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import state_pb2


class TextInput(base.BaseInteraction):
    """Interaction for entering text strings."""

    name = 'Text Input'
    description = 'Allows learners to enter arbitrary text strings.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = True
    _dependency_ids = []
    answer_type = 'NormalizedString'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    # NB: There used to be an integer-typed parameter here called 'columns'
    # that was removed in revision 628942010573. Some text interactions in
    # older explorations may have this customization parameter still set
    # in the exploration definition, so, in order to minimize the possibility
    # of collisions, do not add a new parameter with this name to this list.
    # TODO(sll): Migrate old definitions which still contain the 'columns'
    # parameter.
    _customization_arg_specs = [{
        'name': 'placeholder',
        'description': 'Placeholder text (optional)',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': ''
        }
    }, {
        'name': 'rows',
        'description': 'Height (in rows)',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1,
            }, {
                'id': 'is_at_most',
                'max_value': 10,
            }]
        },
        'default_value': 1,
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }, {
        # Table with answer counts for top N unresolved answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top unresolved answers',
        },
        'calculation_id': 'TopNUnresolvedAnswersByFrequency',
        'addressed_info_is_supported': True,
    }]

    @classmethod
    def to_proto(cls, interaction):
        """Creates a TextInputInstance proto object.

        Args:
            interaction: InteractionInstance. The interaction instance
                associated with this state.

        Returns:
            TextInputInstance. The TextInputInstance proto object.
        """
        customization_args_proto = cls._to_customization_args_proto(
            interaction.customization_args)

        outcome_proto = interaction.default_outcome.to_proto()

        hints_proto_list = []
        for hint in interaction.hints:
            hint_proto = hint.to_proto()
            hints_proto_list.append(hint_proto)

        solution_proto = cls._to_solution_proto(interaction.solution)

        answer_groups_proto = cls._to_answer_groups_proto(
            interaction.answer_groups)

        text_input_interaction_proto = state_pb2.TextInputInstance(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto)

        return text_input_interaction_proto

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
            for TextInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []

        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            answer_group_proto = state_pb2.TextInputInstance.AnswerGroup(
                base_answer_group=base_answer_group_proto)
            answer_group_list_proto.append(answer_group_proto)
        return answer_group_list_proto

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object
            for TextInputInstance.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            Solution. The Solution proto object.
        """
        solution_proto = None
        if solution is not None:
            solution_proto = state_pb2.TextInputInstance.Solution(
                base_solution=solution.to_proto(),
                correct_answer=solution.correct_answer)

        return solution_proto

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
            for TextInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The CustomizationArgs proto object.
        """

        customization_arg_proto = state_pb2.TextInputInstance.CustomizationArgs(
            rows=customization_args['rows'].value)

        return customization_arg_proto
