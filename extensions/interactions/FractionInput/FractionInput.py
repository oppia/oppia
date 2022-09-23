# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Python configuration for FractionInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import objects_pb2
from proto_files import state_pb2

RULE_SPEC_DTO = state_pb2.FractionInputInstanceDto.RuleSpecDto


class FractionInput(base.BaseInteraction):
    """Interaction for fraction input."""

    name = 'Fraction Input'
    description = 'Allows learners to enter integers and fractions.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = []
    answer_type = 'Fraction'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'requireSimplestForm',
        'description': 'Require the learner\'s answer to be in simplest form',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }, {
        'name': 'allowImproperFraction',
        'description': 'Allow improper fractions in the learner\'s answer',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'allowNonzeroIntegerPart',
        'description': 'Allow the answer to contain an integer part',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'customPlaceholder',
        'description': 'Custom placeholder text (optional)',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': ''
        }
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
    }]

    @classmethod
    def to_android_fraction_input_proto(
            cls, default_outcome, customization_args, hints, solution,
            answer_groups
    ):
        """Creates a FractionInputInstanceDto proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            solution: Solution. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            FractionInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(
            answer_groups)

        return state_pb2.FractionInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for FractionInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgsDto. The proto object.
        """
        content = customization_args['customPlaceholder'].value
        placeholder_proto = content.to_android_content_proto()

        return state_pb2.FractionInputInstanceDto.CustomizationArgsDto(
            requires_simplest_form=(
                customization_args['requireSimplestForm'].value
            ),
            allow_improper_fractions=(
                customization_args['allowImproperFraction'].value
            ),
            allow_nonzero_integer_part=(
                customization_args['allowNonzeroIntegerPart'].value
            ),
            placeholder=placeholder_proto
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a SolutionDto proto object for FractionInputInstanceDto.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = state_pb2.FractionInputInstanceDto.SolutionDto(
                base_solution=solution.to_android_solution_proto(),
                correct_answer=cls._convert_fraction_to_proto(
                    solution.correct_answer)
            )

        return solution_proto

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object for FractionInputInstanceDto.

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
                state_pb2.FractionInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _convert_fraction_to_proto(cls, fraction):
        """Creates a FractionDto proto object.

        Args:
            fraction: dict. The fraction domain dict.

        Returns:
            FractionDto. The proto object.
        """
        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return objects_pb2.FractionDto(
            is_negative=fraction['isNegative'],
            whole_number=int(fraction['wholeNumber']),
            numerator=int(fraction['numerator']),
            denominator=int(fraction['denominator']))

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
            'IsExactlyEqualTo': (
                cls._convert_is_exactly_equal_rule_spec_to_proto),
            'IsEquivalentTo': cls._convert_is_equivalent_rule_spec_to_proto,
            'IsEquivalentToAndInSimplestForm': (
                cls._convert_is_equivalent_to_and_in_simplest_form_rule_spec_to_proto), # pylint: disable=line-too-long
            'IsLessThan': cls._convert_is_less_than_rule_spec_to_proto,
            'IsGreaterThan': (
                cls._convert_is_greater_than_rule_spec_to_proto),
            'HasNumeratorEqualTo': (
                cls._convert_has_numerator_equal_rule_spec_to_proto),
            'HasDenominatorEqualTo': (
                cls._convert_has_denominator_equal_rule_spec_to_proto),
            'HasIntegerPartEqualTo': (
                cls._convert_has_integer_part_equal_rule_spec_to_proto),
            'HasNoFractionalPart': (
                cls._convert_has_no_fractional_part_rule_spec_to_proto),
            'HasFractionalPartExactlyEqualTo': (
                cls._convert_has_fractional_part_exactly_equal_rule_spec_to_proto)   # pylint: disable=line-too-long
        }
        rule_type_to_proto_mapping = {
            'IsExactlyEqualTo': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    is_exactly_equal_to=x)),
            'IsEquivalentTo': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    is_equivalent_to=x)),
            'IsEquivalentToAndInSimplestForm': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    is_equivalent_to_and_in_simplest_form=x)),
            'IsLessThan': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    is_less_than=x)),
            'IsGreaterThan': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    is_greater_than=x)),
            'HasNumeratorEqualTo': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    has_numerator_equal_to=x)),
            'HasDenominatorEqualTo': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    has_denominator_equal_to=x)),
            'HasIntegerPartEqualTo': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    has_integer_part_equal_to=x)),
            'HasNoFractionalPart': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    has_no_fractional_part=x)),
            'HasFractionalPartExactlyEqualTo': lambda x: (
                state_pb2.FractionInputInstanceDto.RuleSpecDto(
                    has_fractional_part_exactly_equal_to=x))
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
    def _convert_is_exactly_equal_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsExactlyEqualToSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsExactlyEqualToSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsExactlyEqualToSpecDto(
            input=cls._convert_fraction_to_proto(input_dict['f'])
        )

    @classmethod
    def _convert_is_equivalent_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsEquivalentToSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsEquivalentToSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsEquivalentToSpecDto(
            input=cls._convert_fraction_to_proto(input_dict['f'])
        )

    @classmethod
    def _convert_is_equivalent_to_and_in_simplest_form_rule_spec_to_proto(
            cls, input_dict
    ):
        """Creates a proto object for IsEquivalentToAndInSimplestFormSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsEquivalentToAndInSimplestFormSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsEquivalentToAndInSimplestFormSpecDto(
            input=cls._convert_fraction_to_proto(input_dict['f'])
        )

    @classmethod
    def _convert_is_less_than_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsLessThanSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsLessThanSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsLessThanSpecDto(
            input=cls._convert_fraction_to_proto(input_dict['f'])
        )

    @classmethod
    def _convert_is_greater_than_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for IsGreaterThanSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            IsGreaterThanSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.IsGreaterThanSpecDto(
            input=cls._convert_fraction_to_proto(input_dict['f'])
        )

    @classmethod
    def _convert_has_numerator_equal_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for HasNumeratorEqualToSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            HasNumeratorEqualToSpecDto. The proto object.
        """
        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return RULE_SPEC_DTO.HasNumeratorEqualToSpecDto(
            input=int(input_dict['x'])
        )

    @classmethod
    def _convert_has_denominator_equal_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for HasDenominatorEqualToSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            HasDenominatorEqualToSpecDto. The proto object.
        """
        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return RULE_SPEC_DTO.HasDenominatorEqualToSpecDto(
            input=int(input_dict['x'])
        )

    @classmethod
    def _convert_has_integer_part_equal_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for HasIntegerPartEqualToSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            HasIntegerPartEqualToSpecDto. The proto object.
        """
        # TODO(#15176): Investigate on how to found problematic exploration
        # and remove the type casting.
        return RULE_SPEC_DTO.HasIntegerPartEqualToSpecDto(
            input=int(input_dict['x'])
        )

    @classmethod
    def _convert_has_no_fractional_part_rule_spec_to_proto(
            cls, input_dict):  # pylint: disable=unused-argument
        """Creates a proto object for HasNoFractionalPartSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            HasNoFractionalPartSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.HasNoFractionalPartSpecDto()

    @classmethod
    def _convert_has_fractional_part_exactly_equal_rule_spec_to_proto(
            cls, input_dict
    ):
        """Creates a proto object for HasFractionalPartExactlyEqualToSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            HasFractionalPartExactlyEqualToSpecDto. The proto object.
        """
        return RULE_SPEC_DTO.HasFractionalPartExactlyEqualToSpecDto(
            input=cls._convert_fraction_to_proto(input_dict['f'])
        )
