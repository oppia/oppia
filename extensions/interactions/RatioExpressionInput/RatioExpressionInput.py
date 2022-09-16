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
    def to_android_ratio_expression_input_proto(
            cls, default_outcome, customization_args,
            solution, hints, answer_groups
    ):
        """Creates a RatioExpressionInputInstanceDto proto object.
        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            solution: Solution. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.
        Returns:
            RatioExpressionInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(
            answer_groups)

        return state_pb2.RatioExpressionInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            solution=solution_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for RatioExpressionInputInstanceDto.
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
                state_pb2.RatioExpressionInputInstanceDto.AnswerGroupDto(
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
            'IsEquivalent': cls._convert_is_equivalent_rule_spec_to_proto,
            'HasNumberOfTermsEqualTo': (
                cls._convert_has_number_of_terms_equal_rule_spec_to_proto),
            'HasSpecificTermEqualTo': (
                cls._convert_has_specific_terms_equal_rule_spec_to_proto)
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
                    rule_spec.inputs
                )
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _convert_equals_rule_spec_to_proto(cls, input_dict):
        """Creates a EqualsSpecDto proto object.
        Args:
            input_dict: dict. The rule dict.
        Returns:
            EqualsSpecDto. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        return ratio_rule_spec.EqualsSpecDto(
            input=cls._to_ratio_expression_proto(input_dict['x'])
        )

    @classmethod
    def _convert_is_equivalent_rule_spec_to_proto(cls, input_dict):
        """Creates a IsEquivalentSpecDto proto object.
        Args:
            input_dict: dict. The rule dict.
        Returns:
            IsEquivalentSpecDto. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        return ratio_rule_spec.IsEquivalentSpecDto(
            input=cls._to_ratio_expression_proto(input_dict['x'])
        )

    @classmethod
    def _convert_has_number_of_terms_equal_rule_spec_to_proto(
            cls, input_dict
    ):
        """Creates a HasNumberOfTermsEqualToSpecDto proto object.
        Args:
            input_dict: dict. The rule dict.
        Returns:
            HasNumberOfTermsEqualToSpecDto. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return ratio_rule_spec.HasNumberOfTermsEqualToSpecDto(
            input_term_count=int(input_dict['y'])
        )

    @classmethod
    def _convert_has_specific_terms_equal_rule_spec_to_proto(
            cls, input_dict
    ):
        """Creates a HasSpecificTermEqualToSpecDto proto object.
        Args:
            input_dict: dict. The rule dict.
        Returns:
            HasSpecificTermEqualToSpecDto. The proto object.
        """
        ratio_rule_spec = state_pb2.RatioExpressionInputInstanceDto.RuleSpecDto

        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return ratio_rule_spec.HasSpecificTermEqualToSpecDto(
            input_term_index=int(input_dict['x']),
            input_expected_term_value=int(input_dict['y'])
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a Solution proto object
            for RatioExpressionInputInstanceDto.
        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.
        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = (
                state_pb2.RatioExpressionInputInstanceDto.SolutionDto(
                    base_solution=solution.to_android_solution_proto(),
                    correct_answer=(
                        cls._to_ratio_expression_proto(
                            solution.correct_answer)
                    )
                )
            )

        return solution_proto

    @classmethod
    def _to_ratio_expression_proto(cls, ratio_list):
        """Creates a RatioExpressionDto proto object.
        Args:
            ratio_list: list(int). The list of ratios.
        Returns:
            RatioExpressionDto. The proto object.
        """
        return objects_pb2.RatioExpressionDto(components=ratio_list)

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for RatioExpressionInputInstance.
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

        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return state_pb2.RatioExpressionInputInstanceDto.CustomizationArgsDto(
            placeholder=placeholder_proto,
            number_of_terms=int(customization_args['numberOfTerms'].value)
        )
