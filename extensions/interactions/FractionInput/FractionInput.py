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
    def to_proto(
        cls, default_outcome, customization_args, solution, answer_groups
    ):
        """Creates a FractionInputInstance proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            solution: Solution. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            FractionInputInstance. The proto object.
        """
        customization_args_proto = (
            cls._to_customization_args_proto(
                customization_args)
        )
        outcome_proto = default_outcome.to_proto()
        solution_proto = cls._to_solution_proto(solution)
        answer_groups_proto = cls._to_answer_groups_proto(
            answer_groups)

        return state_pb2.FractionInputInstance(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
        for FractionInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The proto object.
        """
        return state_pb2.FractionInputInstance.CustomizationArgs(
            requires_simplest_form=(
                customization_args['requireSimplestForm'].value
            ),
            allow_improper_fractions=(
                customization_args['allowImproperFraction'].value
            ),
            allow_nonzero_integer_part=(
                customization_args['allowNonzeroIntegerPart'].value
            )
        )

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object for FractionInputInstance.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            Solution. The proto object.
        """
        solution_proto = None
        if solution is not None:
            solution_proto = state_pb2.FractionInputInstance.Solution(
                base_solution=solution.to_proto(),
                correct_answer=cls._to_fraction_proto(solution.correct_answer)
            )

        return solution_proto

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a Solution proto object
        for FractionInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []

        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            rules_spec_proto = cls._to_fraction_rule_specs_proto(
                answer_group.rule_specs)
            answer_group_proto = state_pb2.FractionInputInstance.AnswerGroup(
                base_answer_group=base_answer_group_proto,
                rule_specs=rules_spec_proto
            )
            answer_group_list_proto.append(answer_group_proto)

        return answer_group_list_proto

    @classmethod
    def _to_fraction_proto(cls, fraction):
        """Creates a Fraction proto object.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            Fraction. The proto object.
        """
        return objects_pb2.Fraction(
            is_negative=fraction['isNegative'],
            whole_number=fraction['wholeNumber'],
            numerator=fraction['numerator'],
            denominator=fraction['denominator'])

    @classmethod
    def _to_fraction_rule_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []
        rules_specs_proto = {}

        rule_type_to_proto_func_mapping = {
            'IsExactlyEqualTo': cls._to_is_exactly_equal_to_proto,
            'IsEquivalentTo': cls._to_is_equivalent_to_proto,
            'IsEquivalentToAndInSimplestForm': (
                cls._to_is_equivalent_to_and_in_simplest_form_proto),
            'IsLessThan': cls._to_is_less_than_proto,
            'IsGreaterThanSpec': cls._to_is_greater_than_proto,
            'HasNumeratorEqualTo': cls._to_has_numerator_equal_to_proto,
            'HasDenominatorEqualTo': cls._to_has_denominator_equal_to_proto,
            'HasIntegerPartEqualTo': cls._to_has_integer_part_equal_to_proto,
            'HasNoFractionalPart': cls._to_has_no_fractional_part_proto,
            'HasFractionalPartExactlyEqualTo': (
                cls._to_has_fractional_part_exactly_equal_to_proto)
        }
        rule_type_to_proto_mapping = {
            'IsExactlyEqualTo': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    is_exactly_equal_to=x)),
            'IsEquivalentTo': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    is_equivalent_to=x)),
            'IsEquivalentToAndInSimplestForm': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    is_equivalent_to_and_in_simplest_form=x)),
            'IsLessThan': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    is_less_than=x)),
            'IsGreaterThanSpec': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    to_is_greater_than=x)),
            'HasNumeratorEqualTo': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    has_numerator_equal_to=x)),
            'HasDenominatorEqualTo': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    has_denominator_equal_to=x)),
            'HasIntegerPartEqualTo': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    has_integer_part_equal_to=x)),
            'HasNoFractionalPart': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    has_no_fractional_part=x)),
            'HasFractionalPartExactlyEqualTo': lambda x: (
                state_pb2.FractionInputInstance.RuleSpec(
                    has_fractional_part_exactly_equal_to=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_func_mapping[rule_type](
                    rule_spec.inputs['f']
                )
            )
            rules_specs_proto = (
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )
            rule_specs_list_proto.append(rules_specs_proto)

        return rule_specs_list_proto

    @classmethod
    def _to_is_exactly_equal_to_proto(cls, fraction):
        """Creates a proto object for IsExactlyEqualToSpec.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            IsExactlyEqualToSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.IsExactlyEqualToSpec(
            input=cls._to_fraction_proto(fraction)
        )

    @classmethod
    def _to_is_equivalent_to_proto(cls, fraction):
        """Creates a proto object for IsEquivalentToSpec.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            IsEquivalentToSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.IsEquivalentToSpec(
            input=cls._to_fraction_proto(fraction)
        )

    @classmethod
    def _to_is_equivalent_to_and_in_simplest_form_proto(cls, fraction):
        """Creates a proto object for IsEquivalentToAndInSimplestFormSpec.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            IsEquivalentToAndInSimplestFormSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.IsEquivalentToAndInSimplestFormSpec( # pylint: disable=line-too-long
            input=cls._to_fraction_proto(fraction)
        )

    @classmethod
    def _to_is_less_than_proto(cls, fraction):
        """Creates a proto object for IsLessThanSpec.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            IsLessThanSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.IsLessThanSpec(
            input=cls._to_fraction_proto(fraction)
        )

    @classmethod
    def _to_is_greater_than_proto(cls, fraction):
        """Creates a proto object for IsGreaterThanSpec.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            IsGreaterThanSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.IsGreaterThanSpec(
            input=cls._to_fraction_proto(fraction)
        )

    @classmethod
    def _to_has_numerator_equal_to_proto(cls, numerator):
        """Creates a proto object for HasNumeratorEqualToSpec.

        Args:
            numerator: int. The expected numerator.

        Returns:
            HasNumeratorEqualToSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.HasNumeratorEqualToSpec(
            input=numerator
        )

    @classmethod
    def _to_has_denominator_equal_to_proto(cls, denominator):
        """Creates a proto object for HasDenominatorEqualToSpec.

        Args:
            denominator: int. The expected denominator.

        Returns:
            HasDenominatorEqualToSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.HasDenominatorEqualToSpec( # pylint: disable=line-too-long
            input=denominator
        )

    @classmethod
    def _to_has_integer_part_equal_to_proto(cls, interger_part):
        """Creates a proto object for HasIntegerPartEqualToSpec.

        Args:
            interger_part: int. The expected integer part.

        Returns:
            HasIntegerPartEqualToSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.HasIntegerPartEqualToSpec( # pylint: disable=line-too-long
            input=interger_part
        )

    @classmethod
    def _to_has_no_fractional_part_proto(cls):
        """Creates a proto object for HasNoFractionalPartSpec.

        Returns:
            HasNoFractionalPartSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.HasNoFractionalPartSpec() # pylint: disable=line-too-long

    @classmethod
    def _to_has_fractional_part_exactly_equal_to_proto(cls, fraction):
        """Creates a proto object for HasFractionalPartExactlyEqualToSpec.

        Args:
            fraction: Fraction. The fraction domain object.

        Returns:
            HasFractionalPartExactlyEqualToSpec. The proto object.
        """
        return state_pb2.FractionInputInstance.RuleSpec.HasFractionalPartExactlyEqualToSpec( # pylint: disable=line-too-long
            input=cls._to_fraction_proto(fraction)
        )
