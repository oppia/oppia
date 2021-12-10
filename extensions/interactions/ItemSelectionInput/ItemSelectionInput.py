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

"""Python configuration for ItemSelectionInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import objects_pb2
from proto_files import state_pb2


class ItemSelectionInput(base.BaseInteraction):
    """Interaction for item selection input."""

    name = 'Item Selection'
    description = (
        'Allows learners to select various options.')
    display_mode = base.DISPLAY_MODE_INLINE
    _dependency_ids = []
    answer_type = 'SetOfTranslatableHtmlContentIds'
    # Radio buttons get unselected when specifying a solution. This needs to be
    # fixed before solution feature can support this interaction.
    can_have_solution = False
    # ItemSelectionInput's submit button is dynamic and is handled
    # separately.
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'minAllowableSelectionCount',
        'description': 'Minimum number of selections permitted.',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0,
            }],
        },
        'default_value': 1,
    }, {
        'name': 'maxAllowableSelectionCount',
        'description': 'Maximum number of selections permitted',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1,
            }],
        },
        'default_value': 1,
    }, {
        'name': 'choices',
        'description': 'Items for selection',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'custom',
                'obj_type': 'SubtitledHtml',
                'replacement_ui_config': {
                    'html': {
                        'hide_complex_extensions': True,
                        'placeholder': 'Sample item answer',
                    }
                }
            },
            'ui_config': {
                'add_element_text': 'Add item for selection',
            }
        },
        'default_value': [{
            'content_id': None,
            'html': ''
        }],
    }]

    _answer_visualization_specs = [{
        # Table with keyed answer counts for top N answers.
        'id': 'EnumeratedFrequencyTable',
        'options': {
            'column_headers': ['Answer (click to expand/collapse)', 'Count'],
            'title': 'Top answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]

    @classmethod
    def to_proto(
        cls, default_outcome, customization_args, hints, answer_groups
    ):
        """Creates a ItemSelectionInputInstance proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            ItemSelectionInputInstance. The proto object.
        """
        customization_arg_proto = (
            cls._to_customization_args_proto(customization_args)
        )
        outcome_proto = default_outcome.to_proto()
        hints_proto_list = cls.get_hint_proto(cls, hints)
        answer_groups_proto = cls._to_answer_groups_proto(answer_groups)

        return state_pb2.ItemSelectionInputInstanceDto(
            customization_args=customization_arg_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
        for ItemSelectionInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The proto object.
        """
        choices_list_proto = [
            value.to_proto() for value in customization_args['choices'].value
        ]

        return state_pb2.ItemSelectionInputInstanceDto.CustomizationArgsDto(
            min_allowable_selection_count=(
                customization_args['minAllowableSelectionCount'].value
            ),
            max_allowable_selection_count=(
                customization_args['maxAllowableSelectionCount'].value
            ),
            choices=choices_list_proto
        )

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
        for ItemSelectionInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []
        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            rules_spec_proto = cls._to_item_selection_rule_specs_proto(
                answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.ItemSelectionInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _to_item_selection_rule_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_func_mapping = {
            'Equals': cls._to_is_equal_to_proto,
            'ContainsAtLeastOneOf': cls._to_contains_at_least_one_of_to_proto,
            'IsProperSubsetOf': cls._to_is_proper_subset_of_to_proto,
            'DoesNotContainAtLeastOneOf': (
                cls._to_does_not_contains_at_least_one_of_to_proto),
        }

        rule_type_to_proto_mapping = {
            'Equals': lambda x: (
                state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto(equals=x)),
            'ContainsAtLeastOneOf': lambda x: (
                state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto(
                    contains_at_least_one_of=x)),
            'DoesNotContainAtLeastOneOf': lambda x: (
                state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto(
                    does_not_contain_at_least_one_of=x)),
            'IsProperSubsetOf': lambda x: (
                state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto(
                    is_proper_subset_of=x))
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
    def _to_is_equal_to_proto(cls, choice_list):
        """Creates a proto object for EqualsSpec.

        Args:
            choice_list: list. Choice list to select from.

        Returns:
            EqualsSpec. The proto object.
        """
        item_rule_spec = state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto

        return item_rule_spec.EqualsSpec(
            input=cls._to_set_of_translatable_html_content_ids_proto(
                choice_list)
        )

    @classmethod
    def _to_contains_at_least_one_of_to_proto(cls, choice_list):
        """Creates a proto object for ContainsAtLeastOneOfSpec.

        Args:
            choice_list: list. Choice list to select from.

        Returns:
            ContainsAtLeastOneOfSpec. The proto object.
        """
        item_rule_spec = state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto

        return item_rule_spec.ContainsAtLeastOneOfSpec(
            input=cls._to_set_of_translatable_html_content_ids_proto(
                choice_list)
        )

    @classmethod
    def _to_is_proper_subset_of_to_proto(cls, choice_list):
        """Creates a proto object for IsProperSubsetOfSpec.

        Args:
            choice_list: list. Choice list to select from.

        Returns:
            IsProperSubsetOfSpec. The proto object.
        """
        item_rule_spec = state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto

        return item_rule_spec.IsProperSubsetOfSpec(
            input=cls._to_set_of_translatable_html_content_ids_proto(
                choice_list)
        )

    @classmethod
    def _to_does_not_contains_at_least_one_of_to_proto(
        cls, choice_list
    ):
        """Creates a proto object for DoesNotContainAtLeastOneOfSpec.

        Args:
            choice_list: list. Choice list to select from.

        Returns:
            DoesNotContainAtLeastOneOfSpec. The proto object.
        """
        item_rule_spec = state_pb2.ItemSelectionInputInstanceDto.RuleSpecDto

        return item_rule_spec.DoesNotContainAtLeastOneOfSpec(
            input=cls._to_set_of_translatable_html_content_ids_proto(
                choice_list)
        )

    @classmethod
    def _to_set_of_translatable_html_content_ids_proto(
        cls, set_of_content_id
    ):
        """Creates a SetOfTranslatableHtmlContentIds proto object.

        Args:
            set_of_content_id: list. A list of
                TranslatableHtmlContentId.

        Returns:
            SetOfTranslatableHtmlContentIds. The proto object.
        """
        content_id_lists_proto = [
            cls._to_translatable_html_content_id_proto(
                translatable_html_content_id
            ) for translatable_html_content_id in set_of_content_id
        ]

        return objects_pb2.SetOfTranslatableHtmlContentIds(
            content_ids=content_id_lists_proto
        )

    @classmethod
    def _to_translatable_html_content_id_proto(
        cls, translatable_html_content_id
    ):
        """Creates a TranslatableHtmlContentId proto object.

        Args:
            translatable_html_content_id: str. A
                TranslatableHtml content id.

        Returns:
            TranslatableHtmlContentId. The proto object.
        """
        return objects_pb2.TranslatableHtmlContentId(
            content_id=translatable_html_content_id
        )
