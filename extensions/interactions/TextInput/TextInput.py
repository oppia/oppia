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
from proto_files import objects_pb2
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
    def to_proto(
        cls, default_outcome, customization_args,
        solution, hints, answer_groups
    ):
        """Creates a TextInputInstance proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            solution: Solution. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            TextInputInstance. The TextInputInstance proto object.
        """
        customization_args_proto = cls._to_customization_args_proto(
            customization_args
        )
        outcome_proto = default_outcome.to_proto()
        hints_proto_list = cls.get_hint_proto(cls, hints)
        solution_proto = cls._to_solution_proto(solution)
        answer_groups_proto = cls._to_answer_groups_proto(answer_groups)

        return state_pb2.TextInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

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
            rules_spec_proto = cls._to_text_input_rule_specs_proto(
                answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.TextInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _to_text_input_rule_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_func_mapping = {
            'Equals': cls._to_equal_to_proto,
            'StartsWith': cls._to_starts_with_to_proto,
            'Contains': (
                cls._to_contains_proto),
            'FuzzyEquals': cls._to_fuzzy_equals_proto
        }
        rule_type_to_proto_mapping = {
            'Equals': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(
                    equals=x)),
            'StartsWith': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(
                    starts_with=x)),
            'Contains': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(
                    contains=x)),
            'FuzzyEquals': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(
                    fuzzy_equals=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
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
    def _to_equal_to_proto(cls, input_dict):
        """Creates a proto object for EqualsSpec.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            EqualsSpec. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.EqualsSpec(
            input=cls._to_translatable_normalized_string_set(
                input_dict)
        )

    @classmethod
    def _to_starts_with_to_proto(cls, input_dict):
        """Creates a proto object for StartsWithSpec.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            StartsWithSpec. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.StartsWithSpec(
            input=cls._to_translatable_normalized_string_set(
                input_dict)
        )

    @classmethod
    def _to_contains_proto(cls, input_dict):
        """Creates a proto object for ContainsSpec.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            ContainsSpec. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.ContainsSpec(
            input=cls._to_translatable_normalized_string_set(
                input_dict)
        )

    @classmethod
    def _to_fuzzy_equals_proto(cls, input_dict):
        """Creates a proto object for FuzzyEqualsSpec.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            FuzzyEqualsSpec. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.FuzzyEqualsSpec(
            input=cls._to_translatable_normalized_string_set(
                input_dict)
        )

    @classmethod
    def _to_translatable_normalized_string_set(
        cls, input_dict
    ):
        """Creates a TranslatableHtmlContentId proto object.

        Args:
            input_dict: str. A TranslatableHtml content id.

        Returns:
            TranslatableHtmlContentId. The proto object.
        """
        normalized_strings_set = list(input_dict['normalizedStrSet'])

        return objects_pb2.TranslatableSetOfNormalizedStringDto(
            content_id=input_dict['contentId'],
            normalized_strings=normalized_strings_set
        )

    @classmethod
    def _to_solution_proto(cls, solution):
        """Creates a Solution proto object
        for TextInputInstance.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            Solution. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = state_pb2.TextInputInstanceDto.SolutionDto(
                base_solution=solution.to_proto(),
                correct_answer=solution.correct_answer
            )

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
            CustomizationArgs. The proto object.
        """
        placeholder_proto = (
            customization_args['placeholder'].value.to_proto())

        return state_pb2.TextInputInstanceDto.CustomizationArgsDto(
            placeholder=placeholder_proto,
            rows=customization_args['rows'].value
        )
