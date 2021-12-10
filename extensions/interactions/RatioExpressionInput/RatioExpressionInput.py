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

"""Python configuration for RatioExpressionInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import objects_pb2
from proto_files import state_pb2


class RatioExpressionInput(base.BaseInteraction):
    """Interaction for ratio input."""

    name = 'Ratio Expression Input'
    description = 'Allow learners to enter ratios.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = []
    answer_type = 'RatioExpression'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'placeholder',
        'description': 'Custom placeholder text (optional)',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': ''
        }
    }, {
        'name': 'numberOfTerms',
        'description': (
            'The number of elements that the answer must have.'
            ' If set to 0, a ratio of any length will be accepted.'
            ' The number of elements should not be greater than 10.'),
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0,
            }, {
                'id': 'is_at_most',
                'max_value': 10,
            }],
        },
        'default_value': 0,
    }]

    _answer_visualization_specs = []

    @classmethod
    def to_proto(
        cls, default_outcome, customization_args,
        solution, hints, answer_groups
    ):
        """Creates a RatioExpressionInputInstance proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            solution: Solution. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            RatioExpressionInputInstance. The proto object.
        """
        customization_args_proto = (
            cls._to_customization_args_proto(customization_args)
        )
        outcome_proto = default_outcome.to_proto()
        hints_proto_list = cls.get_hint_proto(cls, hints)
        solution_proto = cls._to_solution_proto(solution)
        answer_groups_proto = cls._to_ratio_expression_answer_groups_proto(
            answer_groups)

        return state_pb2.RatioExpressionInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            solution=solution_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _to_ratio_expression_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
        for RatioExpressionInputInstance.

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
            answer_group_list_proto.append(
                state_pb2.RatioExpressionInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

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

        rule_type_to_proto_fun_mapping = {
            'Equals': cls._to_ratio_equals_to_proto,
            'IsEquivalent': cls._to_ratio_is_equivalent_proto,
            'HasNumberOfTermsEqualTo': (
                cls._to_ratio_has_numer_of_terms_equal_to_proto),
            'HasSpecificTermEqualTo': (
                cls._to_ratio_has_specific_terms_equal_to_proto)
        }
        rule_type_to_proto_mapping = {
            'Equals': lambda x: (
                state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto(
                    equals=x)),
            'IsEquivalent': lambda x: (
                state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto(
                    is_equivalent=x)),
            'HasNumberOfTermsEqualTo': lambda x: (
                state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto(
                    has_number_of_terms_equal_to=x)),
            'HasSpecificTermEqualTo': lambda x: (
                state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto(
                    has_specific_term_equal_to=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_fun_mapping[rule_type](
                    rule_spec.inputs['x']
                )
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _to_ratio_equals_to_proto(cls, ratio):
        """Creates a EqualsSpec proto object.

        Args:
            ratio: Ratio. The Ratio domain object.

        Returns:
            EqualsSpec. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        return ratio_rule_spec.EqualsSpec(
            input=cls._to_ratio_expression_proto(ratio)
        )

    @classmethod
    def _to_ratio_is_equivalent_proto(cls, ratio):
        """Creates a IsEquivalentSpec proto object.

        Args:
            ratio: Ratio. The Ratio domain object.

        Returns:
            IsEquivalentSpec. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        return ratio_rule_spec.IsEquivalentSpec(
            input=cls._to_ratio_expression_proto(ratio)
        )

    @classmethod
    def _to_ratio_has_numer_of_terms_equal_to_proto(cls, input_term_count):
        """Creates a HasNumberOfTermsEqualToSpec proto object.

        Args:
            input_term_count: int. The number of terms.

        Returns:
            HasNumberOfTermsEqualToSpec. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        return ratio_rule_spec.HasNumberOfTermsEqualToSpec(
            input_term_count=input_term_count
        )

    @classmethod
    def _to_ratio_has_specific_terms_equal_to_proto(
        cls, input_dict
    ):
        """Creates a HasSpecificTermEqualToSpec proto object.

        Args:
            input_dict: int. The number of terms.

        Returns:
            HasSpecificTermEqualToSpec. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        return ratio_rule_spec.HasSpecificTermEqualToSpec(
            input_term_index=input_dict[0],
            input_expected_term_value=input_dict[1]
        )

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object
            for RatioExpressionInputInstance.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            Solution. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = (
                state_pb2.RatioExpressionInputInstanceDto.SolutionDto(
                    base_solution=solution.to_proto(),
                    correct_answer=(
                        cls._to_ratio_expression_proto(
                            solution.correct_answer)
                    )
                )
            )

        return solution_proto

    @classmethod
    def _to_ratio_expression_proto(cls, ratio_list):
        """Creates a RatioExpression proto object.

        Args:
            ratio_list: list. The list of ratios.

        Returns:
            RatioExpression. The proto object.
        """
        return objects_pb2.RatioExpressionDto(
            components=list(ratio_list)
        )

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
        for RatioExpressionInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The proto object.
        """
        placeholder_proto = (
            customization_args['placeholder'].value.to_proto())

        return state_pb2.RatioExpressionInputInstanceDto.CustomizationArgsDto(
            placeholder=placeholder_proto,
            number_of_terms=customization_args['numberOfTerms'].value
        )
