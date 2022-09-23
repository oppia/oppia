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
    def to_android_numeric_input_proto(
            cls, default_outcome, solution, hints, answer_groups
    ):
        """Creates a NumericInputInstanceDto proto object.

        Args:
            default_outcome: Outcome. The domain object.
            solution: Solution. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            NumericInputInstanceDto. The proto object.
        """
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.NumericInputInstanceDto(
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a SolutionDto proto object
        for NumericInputInstanceDto.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = state_pb2.NumericInputInstanceDto.SolutionDto(
                base_solution=solution.to_android_solution_proto(),
                correct_answer=solution.correct_answer
            )

        return solution_proto

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for NumericInputInstanceDto.

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
                state_pb2.NumericInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _convert_rule_specs_to_proto(cls, rule_specs_list):
        """Creates a RuleSpecDto proto object list.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list(RuleSpecDto). The proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_fun_mapping = {
            'Equals': cls._convert_equals_rule_spec_to_proto,
            'IsLessThan': cls._convert_is_less_than_rule_spec_to_proto,
            'IsGreaterThan': cls._convert_is_greater_than_rule_spec_to_proto,
            'IsLessThanOrEqualTo': (
                cls._convert_is_less_than_or_equal_rule_spec_to_proto),
            'IsGreaterThanOrEqualTo': (
                cls._convert_is_greater_than_or_equal_rule_spec_to_proto),
            'IsInclusivelyBetween': (
                cls._convert_is_inclusively_between_rule_spec_to_proto),
            'IsWithinTolerance': (
                cls._convert_is_within_tolerance_rule_spec_to_proto)
        }
        rule_type_to_proto_mapping = {
            'Equals': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    equals=x)),
            'IsLessThan': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    is_less_than=x)),
            'IsGreaterThan': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    is_greater_than=x)),
            'IsLessThanOrEqualTo': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    is_less_than_or_equal_to=x)),
            'IsGreaterThanOrEqualTo': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    is_greater_than_or_equal_to=x)),
            'IsInclusivelyBetween': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    is_inclusively_between=x)),
            'IsWithinTolerance': lambda x: (
                state_pb2.NumericInputInstanceDto.RuleSpecDto(
                    is_within_tolerance=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_fun_mapping[rule_type](
                    rule_spec.inputs
                )
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _convert_equals_rule_spec_to_proto(cls, inputs):
        """Creates a EqualsSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            EqualsSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        equals_to_proto = {}
        x = inputs['x']
        if isinstance(x, (int, float)):
            equals_to_proto = numeric_rule_spec.EqualsSpecDto(input=x)

        return equals_to_proto

    @classmethod
    def _convert_is_less_than_rule_spec_to_proto(cls, inputs):
        """Creates a IsLessThanSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            IsLessThanSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        is_less_than_proto = {}
        x = inputs['x']
        if isinstance(x, (int, float)):
            is_less_than_proto = numeric_rule_spec.IsLessThanSpecDto(input=x)

        return is_less_than_proto

    @classmethod
    def _convert_is_greater_than_rule_spec_to_proto(cls, inputs):
        """Creates a IsGreaterThanSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            IsGreaterThanSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        is_greater_than_proto = {}
        x = inputs['x']
        if isinstance(x, (int, float)):
            is_greater_than_proto = (
                numeric_rule_spec.IsGreaterThanSpecDto(input=x)
            )

        return is_greater_than_proto

    @classmethod
    def _convert_is_less_than_or_equal_rule_spec_to_proto(cls, inputs):
        """Creates a IsLessThanOrEqualToSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            IsLessThanOrEqualToSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        is_less_than_or_equal_to_proto = {}
        x = inputs['x']
        if isinstance(x, (int, float)):
            is_less_than_or_equal_to_proto = (
                numeric_rule_spec.IsLessThanOrEqualToSpecDto(input=x)
            )

        return is_less_than_or_equal_to_proto

    @classmethod
    def _convert_is_greater_than_or_equal_rule_spec_to_proto(cls, inputs):
        """Creates a IsGreaterThanOrEqualToSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            IsGreaterThanOrEqualToSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        is_greater_than_or_equal_to_proto = {}
        x = inputs['x']
        if isinstance(x, (int, float)):
            is_greater_than_or_equal_to_proto = (
                numeric_rule_spec.IsGreaterThanOrEqualToSpecDto(input=x)
            )

        return is_greater_than_or_equal_to_proto

    @classmethod
    def _convert_is_inclusively_between_rule_spec_to_proto(cls, inputs):
        """Creates a IsInclusivelyBetweenSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            IsInclusivelyBetweenSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        is_inclusively_between_proto = {}
        a = inputs['a']
        b = inputs['b']
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            is_inclusively_between_proto = (
                numeric_rule_spec.IsInclusivelyBetweenSpecDto(
                    inputLowerInclusive=a,
                    inputUpperInclusive=b
                )
            )

        return is_inclusively_between_proto

    @classmethod
    def _convert_is_within_tolerance_rule_spec_to_proto(cls, inputs):
        """Creates a IsWithinToleranceSpecDto proto object.

        Args:
            inputs: dict. The input dict.

        Returns:
            IsWithinToleranceSpecDto. The proto object.
        """
        numeric_rule_spec = state_pb2.NumericInputInstanceDto.RuleSpecDto
        is_within_tolerance_proto = {}
        x = inputs['x']
        tol = inputs['tol']
        is_within_tolerance_proto = (
            numeric_rule_spec.IsWithinToleranceSpecDto(
                inputTolerance=tol,
                inputComparedValue=x
            )
        )

        return is_within_tolerance_proto
