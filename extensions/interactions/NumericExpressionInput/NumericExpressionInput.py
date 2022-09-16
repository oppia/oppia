# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Python configuration for NumericExpressionInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import state_pb2


class NumericExpressionInput(base.BaseInteraction):
    """Interaction for numeric expression input."""

    name = 'Numeric Expression Input'
    description = 'Allows learners to enter numeric expressions.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = ['guppy', 'nerdamer']
    answer_type = 'NumericExpression'
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'placeholder',
        'description': 'Placeholder text',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': 'Type an expression here, using only numbers.'
        }
    }, {
        'name': 'useFractionForDivision',
        'description': (
            'Represent division using fractions (rather than ÷).'),
        'schema': {
            'type': 'bool'
        },
        'default_value': False
    }]

    @classmethod
    def to_android_numeric_expression_proto(
            cls, default_outcome, customization_args, solution, hints,
            answer_groups
    ):
        """Creates a NumericExpressionInputInstanceDto proto object.
        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            solution: Solution. The domain object.
            answer_groups: AnswerGroups. The domain object.
        Returns:
            NumericExpressionInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.NumericExpressionInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
        for NumericExpressionInputInstanceDto.
        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
        Returns:
            CustomizationArgsDto. The proto object.
        """
        placeholder_proto = (
            customization_args['placeholder'].value.to_android_content_proto())

        frac_for_division = customization_args['useFractionForDivision'].value

        numeraic_expression_dto = state_pb2.NumericExpressionInputInstanceDto
        return numeraic_expression_dto.CustomizationArgsDto(
            placeholder=placeholder_proto,
            use_fraction_for_division=frac_for_division
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
        for NumericExpressionInputInstanceDto.
        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.
        Returns:
            list(AnswerGroup). The proto object list.
        """
        answer_group_list_proto = []
        for answer_group in answer_groups:
            base_answer_group_proto = (
                answer_group.to_android_answer_group_proto())
            rules_spec_proto = cls._convert_rule_specs_to_proto(
                answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.NumericExpressionInputInstanceDto.AnswerGroupDto(
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
            'MatchesExactlyWith': (
                cls._convert_matches_exactly_rule_spec_to_proto),
            'IsEquivalentTo': cls._convert_is_equivalent_rule_spec_to_proto,
            'MatchesUpToTrivialManipulations': (
                cls._convert_matches_up_to_trivial_manipulation_rule_spec_to_proto
            # pylint: disable=line-too-long
            )
        }

        rule_type_to_proto_mapping = {
            'MatchesExactlyWith': lambda x: (
                state_pb2.NumericExpressionInputInstanceDto.RuleSpecDto(
                    matches_exactly_with=x)),
            'IsEquivalentTo': lambda x: (
                state_pb2.NumericExpressionInputInstanceDto.RuleSpecDto(
                    is_equivalent_to=x)),
            'MatchesUpToTrivialManipulations': lambda x: (
                state_pb2.NumericExpressionInputInstanceDto.RuleSpecDto(
                    matches_upTo_trivial_manipulations=x))
        }

        # As NumericExpressionInputInstanceDto does not contain all the
        # rules, a check is necessary to create proto for only those rules
        # which are required in proto creation.
        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            if rule_type in rule_type_to_proto_func_mapping:
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
    def _convert_matches_exactly_rule_spec_to_proto(cls, numeric_expression):
        """Creates a proto object for MatchesExactlyWithSpecDto.
        Args:
            numeric_expression: str. The numeric expression.
        Returns:
            MatchesExactlyWithSpecDto. The proto object.
        """
        rule_spec = state_pb2.NumericExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.MatchesExactlyWithSpecDto(
            numeric_expression=numeric_expression
        )

    @classmethod
    def _convert_is_equivalent_rule_spec_to_proto(cls, numeric_expression):
        """Creates a proto object for IsEquivalentToSpecDto.
        Args:
            numeric_expression: str. The numeric expression.
        Returns:
            IsEquivalentToSpecDto. The proto object.
        """
        rule_spec = state_pb2.NumericExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.IsEquivalentToSpecDto(
            numeric_expression=numeric_expression
        )

    @classmethod
    def _convert_matches_up_to_trivial_manipulation_rule_spec_to_proto(
            cls, numeric_expression
    ):
        """Creates a proto object for MatchesUpToTrivialManipulationsSpecDto.
        Args:
            numeric_expression: str. The numeric expression.
        Returns:
            MatchesUpToTrivialManipulationsSpecDto. The proto object.
        """
        rule_spec = state_pb2.NumericExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.MatchesUpToTrivialManipulationsSpecDto(
            numeric_expression=numeric_expression
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a Solution proto object
        for NumericExpressionInputInstanceDto.
        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.
        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = (
                state_pb2.NumericExpressionInputInstanceDto.SolutionDto(
                    base_solution=solution.to_android_solution_proto(),
                    correct_answer=solution.correct_answer
                )
            )

        return solution_proto
