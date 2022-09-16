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

"""Python configuration for AlgebraicExpressionInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import state_pb2

RULE_SPEC_DTO = state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto


class AlgebraicExpressionInput(base.BaseInteraction):
    """Interaction for algebraic expression input."""

    name = 'Algebraic Expression Input'
    description = 'Allows learners to enter algebraic expressions.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = ['guppy', 'nerdamer']
    answer_type = 'AlgebraicExpression'
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'allowedVariables',
        'description': (
            'Shortcut variables that the learner can access in the on-screen '
            'keyboard. (The order of these variables will be reflected in the '
            'learner\'s keyboard)'),
        'schema': {
            'type': 'custom',
            'obj_type': 'AllowedVariables',
        },
        'default_value': []
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
    def to_android_algebraic_expression_proto(
            cls, default_outcome, customization_args, solution, hints,
            answer_groups
    ):
        """Creates a AlgebraicExpressionInputInstanceDto proto object.
        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            solution: Solution. The domain object.
            answer_groups: AnswerGroups. The domain object.
        Returns:
            AlgebraicExpressionInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.AlgebraicExpressionInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for AlgebraicExpressionInputInstanceDto.
        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
        Returns:
            CustomizationArgsDto. The proto object.
        """
        custom_osk_letters_proto = (
            list(customization_args['allowedVariables'].value))
        frac_for_division = customization_args['useFractionForDivision'].value
        algebraic_expression_dto = state_pb2.AlgebraicExpressionInputInstanceDto

        return algebraic_expression_dto.CustomizationArgsDto(
            custom_osk_letters=custom_osk_letters_proto,
            use_fraction_for_division=frac_for_division
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for AlgebraicExpressionInputInstanceDto.
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
                state_pb2.AlgebraicExpressionInputInstanceDto.AnswerGroupDto(
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
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    matches_exactly_with=x)),
            'IsEquivalentTo': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    is_equivalent_to=x)),
            'MatchesUpToTrivialManipulations': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    matches_upTo_trivial_manipulations=x))
        }

        # As AlgebraicExpressionInputInstanceDto does not contain all the
        # rules, a check is necessary to create proto for only those rules
        # which are required in proto creation.
        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            if rule_type in rule_type_to_proto_func_mapping:
                rule_proto = (
                    rule_type_to_proto_func_mapping[rule_type](rule_spec.inputs)
                )
                rule_specs_list_proto.append(
                    rule_type_to_proto_mapping[rule_type](rule_proto)
                )

        return rule_specs_list_proto

    @classmethod
    def _convert_matches_exactly_rule_spec_to_proto(cls, inputs):
        """Creates a proto object for MatchesExactlyWithSpecDto.
        Args:
            inputs: dict. The input items.
        Returns:
            MatchesExactlyWithSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.MatchesExactlyWithSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _convert_is_equivalent_rule_spec_to_proto(cls, inputs):
        """Creates a proto object for IsEquivalentToSpecDto.
        Args:
            inputs: dict. The input items.
        Returns:
            IsEquivalentToSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsEquivalentToSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _convert_matches_up_to_trivial_manipulation_rule_spec_to_proto(
            cls, inputs
    ):
        """Creates a proto object for MatchesUpToTrivialManipulationsSpecDto.
        Args:
            inputs: dict. The input items.
        Returns:
            MatchesUpToTrivialManipulationsSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.MatchesUpToTrivialManipulationsSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a SolutionDto proto object
        for AlgebraicExpressionInputInstanceDto.
        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.
        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = (
                state_pb2.AlgebraicExpressionInputInstanceDto.SolutionDto(
                    base_solution=solution.to_android_solution_proto(),
                    correct_answer=solution.correct_answer
                )
            )

        return solution_proto
