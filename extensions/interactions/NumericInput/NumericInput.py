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

"""Python configuration for NumericInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import state_pb2


class NumericInput(base.BaseInteraction):
    """Interaction for numeric input."""

    name = 'Number Input'
    description = (
        'Allows learners to enter integers and floating point numbers.')
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = []
    answer_type = 'Real'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'requireNonnegativeInput',
        'description': (
            'Allow only input greater than or equal to zero.'),
        'schema': {
            'type': 'bool'
        },
        'default_value': False
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 10 answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]

    @classmethod
    def to_proto(cls, interaction):
        """Creates a NumericInputInstance proto object.

        Args:
            interaction: InteractionInstance. The interaction instance
                associated with this state.

        Returns:
            NumericInputInstance. The NumericInputInstance proto object.
        """
        outcome_proto = interaction.default_outcome.to_proto()

        hints_proto_list = []
        for hint in interaction.hints:
            hint_proto = hint.to_proto()
            hints_proto_list.append(hint_proto)

        solution_proto = cls._to_solution_proto(
            interaction.solution)

        answer_groups_proto = cls._to_answer_groups_proto(
            interaction.answer_groups)

        numeric_interaction_proto = state_pb2.NumericInputInstance(
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto)

        return numeric_interaction_proto

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object
            for NumericInputInstance.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            Solution. The Solution proto object.
        """
        solution_proto = None
        if solution is not None:
            solution_proto = state_pb2.NumericInputInstance.Solution(
                base_solution=solution.to_proto(),
                correct_answer=solution.correct_answer)

        return solution_proto

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
            for NumericInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []

        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            rules_spec_proto = cls._to_rule_specs_proto(
                answer_group.rule_specs)
            answer_group_proto = state_pb2.NumericInputInstance.AnswerGroup(
                base_answer_group=base_answer_group_proto,
                rule_specs=rules_spec_proto)
            answer_group_list_proto.append(answer_group_proto)

        return answer_group_list_proto

    @classmethod
    def _to_rule_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object list.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []
        rules_specs_proto = {}

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            if rule_type == 'Equals':
                equals_to_proto = cls._to_numeric_equals_to_proto(
                    rule_spec.inputs['x'])
                rules_specs_proto = state_pb2.NumericInputInstance.RuleSpec(
                    equals=equals_to_proto)

            if rule_type == 'IsLessThan':
                is_less_than_proto = cls._to_numeric_is_less_than_proto(
                    rule_spec.inputs['x'])
                rules_specs_proto = state_pb2.NumericInputInstance.RuleSpec(
                    is_less_than=is_less_than_proto)

            if rule_type == 'IsGreaterThan':
                is_greater_than_proto = cls._to_numeric_is_greater_than_proto(
                    rule_spec.inputs['x'])
                rules_specs_proto = state_pb2.NumericInputInstance.RuleSpec(
                    is_greater_than=is_greater_than_proto)

            if rule_type == 'IsLessThanOrEqualTo':
                is_less_than_or_equal_to_proto = (
                    cls._to_numeric_is_less_than_or_equal_to_proto(
                        rule_spec.inputs['x']))
                rules_specs_proto = (
                    state_pb2.NumericInputInstance.RuleSpec(
                        is_less_than_or_equal_to=(
                            is_less_than_or_equal_to_proto)))

            if rule_type == 'IsGreaterThanOrEqualTo':
                is_greater_than_or_equal_to_proto = (
                    cls._to_numeric_is_greater_than_or_equal_to_proto(
                        rule_spec.inputs['x']))
                rules_specs_proto = (
                    state_pb2.NumericInputInstance.RuleSpec(
                        is_greater_than_or_equal_to=(
                            is_greater_than_or_equal_to_proto)))

            if rule_type == 'IsInclusivelyBetween':
                is_inclusively_between_proto = (
                    cls._to_numeric_is_inclusively_between_proto(
                        rule_spec.inputs['a'], rule_spec.inputs['b']))
                rules_specs_proto = (
                    state_pb2.NumericInputInstance.RuleSpec(
                        is_inclusively_between=is_inclusively_between_proto))

            if rule_type == 'IsWithinToleranceSpec':
                is_within_tolerance_proto = (
                    cls._to_numeric_is_within_tolerance_proto(
                        rule_spec.inputs['x']))
                rules_specs_proto = state_pb2.NumericInputInstance.RuleSpec(
                    is_within_tolerance=is_within_tolerance_proto)

            rule_specs_list_proto.append(rules_specs_proto)

        return rule_specs_list_proto

    @classmethod
    def _to_numeric_equals_to_proto(cls, x):
        """Creates a EqualsSpec proto object.

        Args:
            x: int|float. The number to check equality.

        Returns:
            EqualsSpec. The EqualsSpec proto object.
        """
        equals_to_proto = {}
        if isinstance(x, (int, float)):
            equals_to_proto = (
                state_pb2.NumericInputInstance.RuleSpec.EqualsSpec(
                    input=x))

        return equals_to_proto

    @classmethod
    def _to_numeric_is_less_than_proto(cls, x):
        """Creates a IsLessThanSpec proto object.

        Args:
            x: int|float. The number to check less than.

        Returns:
            IsLessThanSpec. The IsLessThanSpec proto object.
        """
        is_less_than_proto = {}
        if isinstance(x, (int, float)):
            is_less_than_proto = (
                state_pb2.NumericInputInstance.RuleSpec.IsLessThanSpec(
                    input=x))

        return is_less_than_proto

    @classmethod
    def _to_numeric_is_greater_than_proto(cls, x):
        """Creates a IsGreaterThanSpec proto object.

        Args:
            x: int|float. The number to check greater than.

        Returns:
            IsGreaterThanSpec. The IsGreaterThanSpec proto object.
        """
        is_greater_than_proto = {}
        if isinstance(x, (int, float)):
            is_greater_than_proto = (
                state_pb2.NumericInputInstance.RuleSpec.IsGreaterThanSpec(
                    input=x))

        return is_greater_than_proto

    @classmethod
    def _to_numeric_is_less_than_or_equal_to_proto(cls, x):
        """Creates a IsLessThanOrEqualToSpec proto object.

        Args:
            x: int|float. The number to check less than or equal to.

        Returns:
            IsLessThanOrEqualToSpec. The
            IsLessThanOrEqualToSpec proto object.
        """
        is_less_than_or_equal_to_proto = {}
        if isinstance(x, (int, float)):
            is_less_than_or_equal_to_proto = (
                state_pb2.NumericInputInstance
                .RuleSpec.IsLessThanOrEqualToSpec(
                    input=x))

        return is_less_than_or_equal_to_proto

    @classmethod
    def _to_numeric_is_greater_than_or_equal_to_proto(cls, x):
        """Creates a IsGreaterThanOrEqualToSpec proto object.

        Args:
            x: int|float. The number to check greater than or equal to.

        Returns:
            IsGreaterThanOrEqualToSpec. The
            IsGreaterThanOrEqualToSpec proto object.
        """
        is_greater_than_or_equal_to_proto = {}
        if isinstance(x, (int, float)):
            is_greater_than_or_equal_to_proto = (
                state_pb2.NumericInputInstance
                .RuleSpec.IsGreaterThanOrEqualToSpec(
                    input=x))

        return is_greater_than_or_equal_to_proto

    @classmethod
    def _to_numeric_is_inclusively_between_proto(cls, a, b):
        """Creates a IsInclusivelyBetweenSpec proto object.

        Args:
            a: int|float. The lower range.
            b: int|float. The upper range.

        Returns:
            IsInclusivelyBetweenSpec. The
            IsInclusivelyBetweenSpec proto object.
        """
        is_inclusively_between_proto = {}
        if (isinstance(a, (int, float))) and (isinstance(b, (int, float))):
            is_inclusively_between_proto = (
                state_pb2.NumericInputInstance
                .RuleSpec.IsInclusivelyBetweenSpec(
                    inputLowerInclusive=a,
                    inputUpperInclusive=b))

        return is_inclusively_between_proto

    @classmethod
    def _to_numeric_is_within_tolerance_proto(cls, x):
        """Creates a IsWithinToleranceSpec proto object.

        Args:
            x: list. The list of range.

        Returns:
            IsWithinToleranceSpec. The
            IsWithinToleranceSpec proto object.
        """
        is_within_tolerance_proto = (
            state_pb2.NumericInputInstance
            .RuleSpec.IsWithinToleranceSpec(
                inputTolerance=x[0],
                inputComparedValue=x[1]))

        return is_within_tolerance_proto
