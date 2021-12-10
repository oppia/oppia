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
        'name': 'customOskLetters',
        'description': (
            'Shortcut variables that the learner can access in the on-screen '
            'keyboard. (The order of these variables will be reflected in the '
            'learner\'s keyboard)'),
        'schema': {
            'type': 'custom',
            'obj_type': 'CustomOskLetters',
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
    def to_proto(
        cls, default_outcome, customization_args, solution, hints, answer_groups
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
            cls._to_customization_args_proto(customization_args)
        )
        outcome_proto = default_outcome.to_proto()
        hints_proto_list = cls.get_hint_proto(cls, hints)
        solution_proto = cls._to_solution_proto(solution)
        answer_groups_proto = cls._to_answer_groups_proto(answer_groups)

        return state_pb2.AlgebraicExpressionInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
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
            list(customization_args['customOskLetters'].value))

        frac_for_division = customization_args['useFractionForDivision'].value

        algebric_expression_dto = state_pb2.AlgebraicExpressionInputInstanceDto
        return algebric_expression_dto.CustomizationArgsDto(
            custom_osk_letters=custom_osk_letters_proto,
            use_fraction_for_division=frac_for_division
        )

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
        for AlgebraicExpressionInputInstanceDto.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []
        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            rules_spec_proto = cls._to_rule_specs_proto(answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.AlgebraicExpressionInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _to_rule_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_func_mapping = {
            'MatchesExactlyWith': cls._to_matches_exactly_to_proto,
            'IsEquivalentTo': cls._to_is_equivalent_to_proto,
            'ContainsSomeOf': cls._to_contains_some_proto,
            'OmitsSomeOf': cls._to_omit_some_proto,
            'MatchesWithGeneralForm': cls._to_matches_with_form_proto
        }

        rule_type_to_proto_mapping = {
            'MatchesExactlyWith': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    matches_exactly_with=x)),
            'IsEquivalentTo': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    is_equivalent_to=x)),
            'ContainsSomeOf': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    contains_some_of=x)),
            'OmitsSomeOf': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    omits_some_of=x)),
            'MatchesWithGeneralForm': lambda x: (
                state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto(
                    matches_with_general_form=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_func_mapping[rule_type](
                    rule_spec.inputs
                )
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _to_matches_exactly_to_proto(cls, inputs):
        """Creates a proto object for MatchesExactlyWithSpecDto.

        Args:
            inputs: dict. The input items.

        Returns:
            MatchesExactlyWithSpecDto. The proto object.
        """
        rule_spec = state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.MatchesExactlyWithSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _to_is_equivalent_to_proto(cls, inputs):
        """Creates a proto object for IsEquivalentToSpecDto.

        Args:
            inputs: dict. The input items.

        Returns:
            IsEquivalentToSpecDto. The proto object.
        """
        rule_spec = state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.IsEquivalentToSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _to_contains_some_proto(cls, inputs):
        """Creates a proto object for ContainsSomeOfSpecDto.

        Args:
            inputs: dict. The input items.

        Returns:
            ContainsSomeOfSpecDto. The proto object.
        """
        rule_spec = state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.ContainsSomeOfSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _to_omit_some_proto(cls, inputs):
        """Creates a proto object for OmitsSomeOfSpecDto.

        Args:
            inputs: dict. The input items.

        Returns:
            OmitsSomeOfSpecDto. The proto object.
        """
        rule_spec = state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto

        return rule_spec.OmitsSomeOfSpecDto(
            algebraic_expression=inputs['x']
        )

    @classmethod
    def _to_matches_with_form_proto(cls, inputs):
        """Creates a proto object for MatchesWithGeneralFormSpecDto.

        Args:
            inputs: dict. The input items.

        Returns:
            MatchesWithGeneralFormSpecDto. The proto object.
        """
        rule_spec = state_pb2.AlgebraicExpressionInputInstanceDto.RuleSpecDto

        set_of_algebraic_identifier = list(inputs['y'])

        return rule_spec.MatchesWithGeneralFormSpecDto(
            algebraic_expression=inputs['x'],
            set_of_algebraic_identifier=set_of_algebraic_identifier
        )

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object
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
                    base_solution=solution.to_proto(),
                    correct_answer=solution.correct_answer
                )
            )

        return solution_proto
