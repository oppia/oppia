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
    def to_android_text_input_proto(
            cls, default_outcome, customization_args,
            solution, hints, answer_groups
    ):
        """Creates a TextInputInstanceDto proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            solution: Solution. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            TextInputInstanceDto. The proto object.
        """
        customization_args_proto = cls._convert_customization_args_to_proto(
            customization_args
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        solution_proto = cls._convert_solution_to_proto(solution)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.TextInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            solution=solution_proto,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for TextInputInstanceDto.

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
                state_pb2.TextInputInstanceDto.AnswerGroupDto(
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
            'Equals': cls._convert_equals_rule_spec_to_proto,
            'StartsWith': cls._convert_starts_with_rule_spec_to_proto,
            'Contains': cls._to_contains_proto,
            'FuzzyEquals': cls._convert_fuzzy_equals_rule_spec_to_proto
        }
        rule_type_to_proto_mapping = {
            'Equals': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(equals=x)),
            'StartsWith': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(starts_with=x)),
            'Contains': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(contains=x)),
            'FuzzyEquals': lambda x: (
                state_pb2.TextInputInstanceDto.RuleSpecDto(fuzzy_equals=x))
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
    def _convert_equals_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for EqualsSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            EqualsSpecDto. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.EqualsSpecDto(
            input=cls._convert_translatable_normalized_string_set_to_proto(
                input_dict)
        )

    @classmethod
    def _convert_starts_with_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for StartsWithSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            StartsWithSpecDto. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.StartsWithSpecDto(
            input=cls._convert_translatable_normalized_string_set_to_proto(
                input_dict)
        )

    @classmethod
    def _to_contains_proto(cls, input_dict):
        """Creates a proto object for ContainsSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            ContainsSpecDto. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.ContainsSpecDto(
            input=cls._convert_translatable_normalized_string_set_to_proto(
                input_dict)
        )

    @classmethod
    def _convert_fuzzy_equals_rule_spec_to_proto(cls, input_dict):
        """Creates a proto object for FuzzyEqualsSpecDto.

        Args:
            input_dict: dict. The rule dict.

        Returns:
            FuzzyEqualsSpecDto. The proto object.
        """
        text_rule_spec = state_pb2.TextInputInstanceDto.RuleSpecDto

        return text_rule_spec.FuzzyEqualsSpecDto(
            input=cls._convert_translatable_normalized_string_set_to_proto(
                input_dict)
        )

    @classmethod
    def _convert_translatable_normalized_string_set_to_proto(
            cls, input_dict
    ):
        """Creates a TranslatableHtmlContentIdDto proto object.

        Args:
            input_dict: str. A TranslatableHtml content id.

        Returns:
            TranslatableHtmlContentIdDto. The proto object.
        """
        normalized_strings_set = list(input_dict['normalizedStrSet'])

        return objects_pb2.TranslatableSetOfNormalizedStringDto(
            content_id=input_dict['contentId'],
            normalized_strings=normalized_strings_set
        )

    @classmethod
    def _convert_solution_to_proto(cls, solution):
        """Creates a SolutionDto proto object
        for TextInputInstanceDto.

        Args:
            solution: Solution. A possible solution
                for the question asked in this interaction.

        Returns:
            SolutionDto. The proto object.
        """
        solution_proto = {}
        if solution is not None:
            solution_proto = state_pb2.TextInputInstanceDto.SolutionDto(
                base_solution=solution.to_android_solution_proto(),
                correct_answer=solution.correct_answer
            )

        return solution_proto

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for TextInputInstance.

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
        return state_pb2.TextInputInstanceDto.CustomizationArgsDto(
            placeholder=placeholder_proto,
            rows=int(customization_args['rows'].value)
        )
