# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Validation jobs for checks which required to delete invalid rule"""

from __future__ import annotations

from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
from typing import Any, Dict, List, Optional, Tuple
from typing_extensions import TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

datastore_services = models.Registry.import_datastore_services()


(exp_models, opportunity_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.opportunity])


class RangeVariable(TypedDict):
    """Dictionary representing the range variable for the NumericInput
    interaction
    """

    ans_group_index: int
    rule_spec_index: int
    lower_bound: None
    upper_bound: None
    lb_inclusive: bool
    ub_inclusive: bool


class MatchedDenominator(TypedDict):
    """Dictionary representing the matched denominator variable for the
    FractionInput interaction
    """

    ans_group_index: int
    rule_spec_index: int
    denominator: int


class ExpAuditRuleChecksJob(base_jobs.JobBase):
    """Job that filters out the explorations which contains only one answer
    group and one rule spec which is invalid according to our validation checks
    , removing them will result in the disconnected state. Returns the language
    codes of the exploration that have `Continue` interaction text value more
    than 20. Also returns the curated explorations that do not have the
    alt-with-value attribute inside the image RTE component
    """

    @staticmethod
    def _filter_invalid_drag_ans_group(
        answer_group: state_domain.AnswerGroup,
        multi_item_value: bool,
        rule_specs_till_now: List[state_domain.RuleSpecDict],
        ele_x_at_y_rules: List[Dict[str, int]],
        equal_ordering_one_at_incorec_posn: List[Any]
    ) -> bool:
        """Helper function to check if the answer group is valid or not.
        It will check if the number of invalid rules are equal to the
        number of rules present inside the answer group, which is if
        all the rules inside the answer group are invalid. Validates the
        following -
            - All rules should be unique
            - `X` and `Y` should not be equal in HasElementXBeforeElementY rule
            - `==` should come before == +/- 1 if they are off by at
            most 1 value
            - `IsEqualToOrdering` rule should not have empty values
            - `==` should come before idx(a) == b if it satisfies
            that condition
            - Multiple items can be in the same place iff the
            setting is turned on
            - `== +/- 1` should never be an option if the
            "multiple items in same place" option is turned off

        Args:
            answer_group: state_domain.AnswerGroup. The answer group.
            multi_item_value: bool. If multiple items at same place are
                allowed or not.
            rule_specs_till_now: List[state_domain.RuleSpecDict]. The list of
                rule specs seen before the current answer_group.
            ele_x_at_y_rules: List[Dict[str, int]]. List of dictionary
                containing the element as the key and its position as the
                value in rule type HasElementXAtPositionY.
            equal_ordering_one_at_incorec_posn: List[str|int]. All the rule
                values of rule type `IsEqualToOrderingWithOneItemAt
                IncorrectPosition` to check if `Equals` rule come before.

        Returns:
            bool. Returns True if all the rules inside the answer_group is
            invalid.
        """
        invalid_rules = []
        for rule_spec in answer_group.rule_specs:
            # All rules should be unique.
            if rule_spec.to_dict() in rule_specs_till_now:
                invalid_rules.append(rule_spec)
            # `X` and `Y` should not be equal in HasElementXBeforeElementY
            # rule.
            if (
                rule_spec.rule_type == 'HasElementXBeforeElementY' and
                rule_spec.inputs['x'] == rule_spec.inputs['y']
            ):
                invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'HasElementXAtPositionY':
                element = rule_spec.inputs['x']
                position = rule_spec.inputs['y']
                ele_x_at_y_rules.append(
                    {'element': element, 'position': position}
                )

            if (
                rule_spec.rule_type ==
                'IsEqualToOrderingWithOneItemAtIncorrectPosition'
            ):
                equal_ordering_one_at_incorec_posn.append(
                    rule_spec.inputs['x']
                )

            if rule_spec.rule_type == 'IsEqualToOrdering':
                # `IsEqualToOrdering` rule should not have empty values.
                if len(rule_spec.inputs['x']) <= 0:
                    invalid_rules.append(rule_spec)
                else:
                    # `==` should come before idx(a) == b if it satisfies
                    # that condition.
                    for ele in ele_x_at_y_rules:
                        ele_position = ele['position']
                        ele_element = ele['element']
                        rule_choice = rule_spec.inputs['x'][ele_position - 1]

                        for choice in rule_choice:
                            if choice == ele_element:
                                invalid_rules.append(rule_spec)
                    # `==` should come before == +/- 1 if they are off by
                    # at most 1 value.
                    dictionary = {}
                    for layer_idx, layer in enumerate(rule_spec.inputs['x']):
                        for item in layer:
                            dictionary[item] = layer_idx

                    for ele in equal_ordering_one_at_incorec_posn:
                        wrong_positions = 0
                        for layer_idx, layer in enumerate(ele):
                            for item in layer:
                                if layer_idx != dictionary[item]:
                                    wrong_positions += 1
                        if wrong_positions <= 1:
                            invalid_rules.append(rule_spec)

            if not multi_item_value:
                # Multiple items can be in the same place iff the
                # setting is turned on.
                for ele in rule_spec.inputs['x']:
                    if len(ele) > 1:
                        invalid_rules.append(rule_spec)

                # `== +/- 1` should never be an option if the
                # "multiple items in same place" option is turned off.
                if (
                    rule_spec.rule_type ==
                    'IsEqualToOrderingWithOneItemAtIncorrectPosition'
                ):
                    invalid_rules.append(rule_spec)

        return len(set(invalid_rules)) == len(answer_group.rule_specs)

    @staticmethod
    def invalid_drag_drop_interactions(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """DragAndDropInput interaction contains some invalid rules
        which we plan to remove. Need to check if all the rules inside
        the answer group is invalid and after removing it should not
        result in disconnection of current state to any other state.
        We will perform this by checking the number of invalid answer groups
        having valid destination and the total number of answer groups having
        valid destination, if they both are same then the state will get
        disconnected and we will return the details for that

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            invalid_states: List[Dict[str, str]]. List of invalid states with
            the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            multi_item_value = bool(
                state.interaction.customization_args
                ['allowMultipleItemsInSamePosition'].value
            )
            answer_groups = state.interaction.answer_groups
            invalid_ans_group_count = 0
            valid_dest_ans_group_count = 0
            invalid_ans_group_idxs = []
            rule_specs_till_now: List[state_domain.RuleSpecDict] = []
            ele_x_at_y_rules: List[Dict[str, int]] = []
            equal_ordering_one_at_incorec_posn: List[Any] = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                can_delete_ans_group = (
                    ExpAuditRuleChecksJob._filter_invalid_drag_ans_group(
                        answer_group, multi_item_value, rule_specs_till_now,
                        ele_x_at_y_rules, equal_ordering_one_at_incorec_posn)
                )
                for rule_spec in answer_group.rule_specs:
                    rule_specs_till_now.append(rule_spec.to_dict())

                if answer_group.outcome.dest != state_name:
                    valid_dest_ans_group_count += 1
                    if can_delete_ans_group:
                        invalid_ans_group_count += 1
                        invalid_ans_group_idxs.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        'ans_group_idx': invalid_ans_group_idxs
                    }
                )

        return invalid_states

    @staticmethod
    def filter_invalid_continue_interaction_exps(
        states_dict: Dict[str, state_domain.State]
    ) -> bool:
        """Continue interaction having text value should not exceed 20,
        if it does we plan to set the default value. This function returns
        the language codes of the errored states

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            invalid_found: bool. Returns True if the exploration is invalid.
        """
        for state in states_dict.values():
            if state.interaction.id != 'Continue':
                continue
            text_value = (
                state.interaction.customization_args # type: ignore[union-attr]
                ['buttonText'].value.unicode_str
            )
            if len(text_value) > 20:
                return True
        return False

    @staticmethod
    def _get_invalid_choices_indexes(
        choices: List[state_domain.SubtitledHtml]
    ) -> Tuple[List[int], List[str]]:
        """Helper function to calculate empty and duplicate choices for
        MultipleInput and ItemSelection interaction. It returns the invalid
        choices indexes and the content ids of the invalid choices

        Args:
            choices: List[Dict[str, str]]. Choices of MultipleChoiceInput
                or ItemSelectionInput interaction.

        Returns:
            Tuple[List[int], List[str]]. Tuple containing the list of invalid
            choices index and invalid choices content ids.
        """
        empty_choices = []
        seen_choices = []
        invalid_choices_index = []
        invalid_choices_content_ids = []
        for choice in choices:
            if choice.html.strip() in ('<p></p>', ''):
                empty_choices.append(choice)

        # Only one choice is empty.
        if len(empty_choices) == 1:
            invalid_choices_index.append(choices.index(empty_choices[0]))
            invalid_choices_content_ids.append(empty_choices[0].content_id)

        # Multiple choices are empty.
        else:
            for idx, empty_choice in enumerate(empty_choices):
                empty_choice.html = (
                    '<p>' + 'Choice ' + str(idx + 1) + '</p>'
                )

        # Duplicate choices.
        for choice in choices:
            if choice.html not in seen_choices:
                seen_choices.append(choice.html)
            else:
                invalid_choices_index.append(choices.index(choice))
                invalid_choices_content_ids.append(choice.content_id)

        return (invalid_choices_index, invalid_choices_content_ids)

    @staticmethod
    def item_selec_invalid_values(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """ItemSelection interaction having rule type `Equals` should
        have value between the minimum allowed selection and maximum
        allowed selection if it is not we need to remove the rule
        and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state. Validates
        the following -
            - All rules should be unique
            - Choices should be unique and non empty

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[Dict[str, str]]. List of invalid
            states with the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'ItemSelectionInput':
                continue
            choices = (
                state.interaction.customization_args['choices'].value)

            _, invalid_choices_content_ids = (
                ExpAuditRuleChecksJob.
                _get_invalid_choices_indexes(choices) # type: ignore[arg-type]
            )

            invalid_ans_group_idxs = []
            # Mark the rules invalid whose choice has been deleted.
            answer_groups = state.interaction.answer_groups
            valid_dest_ans_group_count = 0
            invalid_ans_group_count = 0
            rule_spec_till_now = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                invalid_rules = []
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.to_dict() in rule_spec_till_now:
                        invalid_rules.append(rule_spec)
                    rule_spec_till_now.append(rule_spec.to_dict())

                    rule_values = rule_spec.inputs['x']
                    check = any(
                        item in rule_values for item in
                        invalid_choices_content_ids
                    )
                    if check:
                        invalid_rules.append(rule_spec)

                if answer_group.outcome.dest != state_name:
                    valid_dest_ans_group_count += 1
                    if (
                        len(invalid_rules) > 0 and
                        len(set(invalid_rules)) == len(answer_group.rule_specs)
                    ):
                        invalid_ans_group_count += 1
                        invalid_ans_group_idxs.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        'ans_group_idx': invalid_ans_group_idxs
                    }
                )

        return invalid_states

    @staticmethod
    def _set_lower_and_upper_bounds(
        range_var: RangeVariable,
        lower_bound: float | None,
        upper_bound: float | None,
        lb_inclusive: bool,
        ub_inclusive: bool
    ) -> None:
        """Sets the lower and upper bounds for the range_var, mainly
        we need to set the range so to keep track if any other rule's
        range lies in between or not to prevent redundancy

        Args:
            range_var: RangeVariable. To keep track of each rule's
                ans group index, rule spec index, lower bound, upper bound,
                lb inclusive, ub inclusive.
            lower_bound: float. The lower range to set for the rule.
            upper_bound: float. The upper range to set for the rule.
            lb_inclusive: bool. If lower bound is inclusive.
            ub_inclusive: bool. If upper bound is inclusive.
        """
        range_var['lower_bound'] = lower_bound # type: ignore[arg-type]
        range_var['upper_bound'] = upper_bound # type: ignore[arg-type]
        range_var['lb_inclusive'] = lb_inclusive
        range_var['ub_inclusive'] = ub_inclusive

    @staticmethod
    def _is_enclosed_by(
        range_compare_of: RangeVariable,
        range_compare_with: RangeVariable
    ) -> bool:
        """Checks whether the ranges of rules enclosed or not

        Args:
            range_compare_of: dict[str, Any]. To keep track of each rule's
                ans group index, rule spec index, lower bound, upper bound,
                lb inclusive, ub inclusive, It represents the variable for
                which we have to check the range.
            range_compare_with: dict[str, Any]. To keep track of other rule's
                ans group index, rule spec index, lower bound, upper bound,
                lb inclusive, ub inclusive, It is the variable to which the
                range is compared.

        Returns:
            is_enclosed: bool. Returns True if both rule's ranges are enclosed.
        """
        if (
            range_compare_with['lower_bound'] is None or
            range_compare_of['lower_bound'] is None or
            range_compare_with['upper_bound'] is None or
            range_compare_of['upper_bound'] is None
        ):
            return False
        lb_satisfied = (
            range_compare_with['lower_bound'] < range_compare_of[
                'lower_bound'] or
            (
                range_compare_with['lower_bound'] == range_compare_of[
                    'lower_bound'] and
                (
                    not range_compare_of['lb_inclusive'] or
                    range_compare_with['lb_inclusive']
                )
            )
        )
        ub_satisfied = (
            range_compare_with['upper_bound'] > range_compare_of[
                'upper_bound'] or
            (
                range_compare_with['upper_bound'] == range_compare_of[
                    'upper_bound'] and
                (
                    not range_compare_of['ub_inclusive'] or
                    range_compare_with['ub_inclusive']
                )
            )
        )
        is_enclosed = lb_satisfied and ub_satisfied
        return is_enclosed

    @staticmethod
    def _filter_invalid_numeric_ans_group(
        answer_group: state_domain.AnswerGroup,
        rule_spec_till_now: List[state_domain.RuleSpecDict],
        ans_group_index: int,
        ranges: List[RangeVariable]
    ) -> bool:
        """Helper function to check if the answer group is valid or not.
        It will check if the number of invalid rules are equal to the
        number of rules present inside the answer group, which is if
        all the rules inside the answer group are invalid. Rules will be
        invalid if -
            - Range of the current rule intersects with the range of the
            previous rules
            - Rule value cannot be converted to float, means if it has
            string value
            - Rule is duplicate
            - If the `tol` value from IsWithinTolerance rule is 0

        Args:
            answer_group: state_domain.AnswerGroup. The answer group.
            rule_spec_till_now: List[state_domain.RuleSpecDict]. The list
                of rule specs till now.
            ans_group_index: int. The answer group index.
            ranges: List[RangeVariable]. The list of range variables to keep
                track of rules ranges uptil now.

        Returns:
            bool. Returns True if all the rules inside the answer_group is
            invalid
        """
        invalid_rules = []
        lower_infinity = float('-inf')
        upper_infinity = float('inf')
        for rule_spec_index, rule_spec in enumerate(answer_group.rule_specs):
            if rule_spec.to_dict() in rule_spec_till_now:
                invalid_rules.append(rule_spec)

            range_var: RangeVariable = {
                'ans_group_index': int(ans_group_index),
                'rule_spec_index': int(rule_spec_index),
                'lower_bound': None,
                'upper_bound': None,
                'lb_inclusive': False,
                'ub_inclusive': False
            }
            if rule_spec.rule_type == 'IsLessThanOrEqualTo':
                try:
                    rule_value = float(rule_spec.inputs['x'])
                    (
                        ExpAuditRuleChecksJob.
                        _set_lower_and_upper_bounds(
                            range_var, lower_infinity,
                            rule_value, False, True
                        )
                    )
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsGreaterThanOrEqualTo':
                try:
                    rule_value = float(rule_spec.inputs['x'])
                    ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, rule_value,
                        upper_infinity, True, False
                    )
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'Equals':
                try:
                    rule_value = float(rule_spec.inputs['x'])
                    ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, rule_value,
                        rule_value, True, True
                    )
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsLessThan':
                try:
                    rule_value = float(rule_spec.inputs['x'])
                    ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, lower_infinity,
                        rule_value, False, False
                    )
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsWithinTolerance':
                try:
                    rule_value_x = float(rule_spec.inputs['x'])
                    rule_value_tol = float(rule_spec.inputs['tol'])

                    if rule_value_tol == 0.0:

                        rule_spec_dict: state_domain.RuleSpecDict = {
                            'rule_type': 'Equals',
                            'inputs': {
                                'x': rule_spec.inputs['x']
                            }
                        }
                        rule_spec = state_domain.RuleSpec.from_dict(
                            rule_spec_dict)

                        # Rule will be invalid if it already exists in our list.
                        if rule_spec.to_dict() in rule_spec_till_now:
                            invalid_rules.append(rule_spec)
                        else:
                            rule_spec_till_now.append(rule_spec.to_dict())
                            rule_value = float(rule_spec.inputs['x'])
                            ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                                range_var, rule_value,
                                rule_value, True, True
                            )
                    else:
                        ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                            range_var, rule_value_x - rule_value_tol,
                            rule_value_x + rule_value_tol, True, True
                        )
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsGreaterThan':
                try:
                    rule_value = float(rule_spec.inputs['x'])
                    ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, rule_value,
                        upper_infinity, False, False
                    )
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsInclusivelyBetween':
                try:
                    rule_value_a = float(rule_spec.inputs['a'])
                    rule_value_b = float(rule_spec.inputs['b'])
                    ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, rule_value_a,
                        rule_value_b, True, True
                    )
                except Exception:
                    invalid_rules.append(rule_spec)

            for range_ele in ranges:
                if ExpAuditRuleChecksJob._is_enclosed_by(
                    range_var, range_ele):
                    invalid_rules.append(rule_spec)
            ranges.append(range_var)

        return len(set(invalid_rules)) == len(answer_group.rule_specs)

    @staticmethod
    def numeric_input_invalid_values(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """NumericInput interaction contains some invalid rules
        which we plan to remove. Need to check if all the rules inside
        the answer group is invalid and after removing it should not
        result in disconnection of current state to any other state.
        We will perform this by checking the number of invalid answer
        groups and the number of answer groups having destination other than
        try again are equal then we will store the state name and ans group

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            invalid_states: List[Dict[str, object]]. List of invalid states
            with the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'NumericInput':
                continue
            answer_groups = state.interaction.answer_groups
            invalid_ans_group_count = 0
            valid_dest_ans_group_count = 0
            invalid_ans_group_idxs = []
            rule_spec_till_now: List[state_domain.RuleSpecDict] = []
            ranges: List[RangeVariable] = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                can_delete_ans_group = (
                    ExpAuditRuleChecksJob.
                    _filter_invalid_numeric_ans_group(
                        answer_group, rule_spec_till_now, ans_group_idx,
                        ranges
                    )
                )

                for rule_spec in answer_group.rule_specs:
                    rule_spec_till_now.append(rule_spec.to_dict())

                if answer_group.outcome.dest != state_name:
                    valid_dest_ans_group_count += 1
                    if can_delete_ans_group:
                        invalid_ans_group_count += 1
                        invalid_ans_group_idxs.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        'ans_group_idx': invalid_ans_group_idxs
                    }
                )

        return invalid_states

    @staticmethod
    def _should_check_range_criteria(
        earlier_rule: state_domain.RuleSpec,
        later_rule: state_domain.RuleSpec
    ) -> bool:
        """Checks the range criteria between two rules by comparing their
        rule type

        Args:
            earlier_rule: state_domain.RuleSpec. Previous rule.
            later_rule: state_domain.RuleSpec. Current rule.

        Returns:
            bool. Returns True if the rules passes the range criteria check.
        """
        if earlier_rule.rule_type != 'IsExactlyEqualTo':
            return True
        return later_rule.rule_type not in (
            'IsExactlyEqualTo', 'IsEquivalentTo',
            'IsEquivalentToAndInSimplestForm'
        )

    @staticmethod
    def _get_rule_value_f(
        rule_spec: state_domain.RuleSpec
    ) -> Any:
        """Return rule values from the rule_spec

        Args:
            rule_spec: state_domain.RuleSpec. Rule spec of an answer group.

        Returns:
            rule_value_f: Any. The value of the rule spec.
        """
        rule_value_f = rule_spec.inputs['f']
        if rule_value_f['wholeNumber'] == 0:
            rule_value_f = float(
                rule_value_f['numerator'] / rule_value_f['denominator']
            )
        else:
            rule_value_f = float(
                rule_value_f['wholeNumber'] +
                rule_value_f['numerator'] / rule_value_f['denominator']
            )

        return rule_value_f

    @staticmethod
    def _filter_invalid_fraction_ans_group(
        answer_group: state_domain.AnswerGroup,
        rule_spec_till_now: List[state_domain.RuleSpecDict],
        ans_group_index: int,
        ranges: List[RangeVariable],
        matched_denominator_list: List[MatchedDenominator],
        answer_groups: List[state_domain.AnswerGroup]
    ) -> bool:
        """Helper function to check if the answer group is valid or not.
        It will check if the number of invalid rules are equal to the
        number of rules present inside the answer group, which is if
        all the rules inside the answer group are invalid. Rules will be
        invalid if -
            - Range of the current rule intersects with the range of the
            previous rules
            - Rule value cannot be converted to float, means if it has
            string value
            - Rule is duplicate

        Args:
            answer_group: state_domain.AnswerGroup. The answer group to
                validate.
            rule_spec_till_now: List[state_domain.RuleSpecDict]. The list of
                rule specs uptil now.
            ans_group_index: int. The index of the current answer group.
            ranges: List[RangeVariable]. The list of range variables of
                rules uptil now.
            matched_denominator_list: List[MatchedDenominator]. The list of
                matched denominators rules variables, to keep track of
                denominators.
            answer_groups: List[state_domain.AnswerGroup]. The list of the
                complete answer groups.

        Returns:
            bool. Returns True if all the rules inside the answer_group is
            invalid
        """
        invalid_rules = []
        lower_infinity = float('-inf')
        upper_infinity = float('inf')
        for rule_spec in answer_group.rule_specs:
            if rule_spec.to_dict() in rule_spec_till_now:
                invalid_rules.append(rule_spec)

            rule_spec_index = str(answer_group.rule_specs.index(
                rule_spec))
            range_var: RangeVariable = {
                'ans_group_index': int(ans_group_index),
                'rule_spec_index': int(rule_spec_index),
                'lower_bound': None,
                'upper_bound': None,
                'lb_inclusive': False,
                'ub_inclusive': False
            }
            matched_denominator: MatchedDenominator = {
                'ans_group_index': int(ans_group_index),
                'rule_spec_index': int(rule_spec_index),
                'denominator': 0
            }

            if rule_spec.rule_type in (
                'IsEquivalentTo', 'IsExactlyEqualTo',
                'IsEquivalentToAndInSimplestForm'
            ):
                rule_value_f = ExpAuditRuleChecksJob._get_rule_value_f(
                    rule_spec)

                ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, rule_value_f,
                        rule_value_f, True, True
                )

            if rule_spec.rule_type == 'IsGreaterThan':
                rule_value_f = ExpAuditRuleChecksJob._get_rule_value_f(
                    rule_spec)

                ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, rule_value_f,
                        upper_infinity, False, False
                )

            if rule_spec.rule_type == 'IsLessThan':
                rule_value_f = ExpAuditRuleChecksJob._get_rule_value_f(
                    rule_spec)

                ExpAuditRuleChecksJob._set_lower_and_upper_bounds(
                        range_var, lower_infinity,
                        rule_value_f, False, False
                )

            if rule_spec.rule_type == 'HasDenominatorEqualTo':
                try:
                    rule_value_x = int(rule_spec.inputs['x'])
                    matched_denominator['denominator'] = rule_value_x
                except Exception:
                    invalid_rules.append(rule_spec)
                    continue

            for range_ele in ranges:
                earlier_rule = (
                    answer_groups[range_ele['ans_group_index']]
                    .rule_specs[range_ele['rule_spec_index']]
                )
                if ExpAuditRuleChecksJob._should_check_range_criteria(
                    earlier_rule, rule_spec
                ):
                    if ExpAuditRuleChecksJob._is_enclosed_by(
                        range_var, range_ele
                    ):
                        invalid_rules.append(rule_spec)

            for den in matched_denominator_list:
                if (
                    rule_spec.rule_type ==
                    'HasFractionalPartExactlyEqualTo'
                ):
                    if (
                        den['denominator'] ==
                        rule_spec.inputs['f']['denominator']
                    ):
                        invalid_rules.append(rule_spec)

            ranges.append(range_var)
            matched_denominator_list.append(matched_denominator)

        return len(set(invalid_rules)) == len(answer_group.rule_specs)

    @staticmethod
    def fraction_input_invalid_values(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """FraactionInput interaction contains some invalid rules
        which we plan to remove. Need to check if all the rules inside
        the answer group is invalid and after removing it should not
        result in disconnection of current state to any other state.
        We will perform this by checking the number of invalid answer
        groups and the number of answer groups having destination other than
        try again are equal then we will store the state name and ans group

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            invalid_states: List[Dict[str, object]]. List of invalid states
            with the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'FractionInput':
                continue
            answer_groups = state.interaction.answer_groups
            invalid_ans_group_count = 0
            valid_dest_ans_group_count = 0
            invalid_ans_group_idxs = []
            rule_spec_till_now: List[state_domain.RuleSpecDict] = []
            ranges: List[RangeVariable] = []
            matched_denominator_list: List[MatchedDenominator] = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                can_delete_ans_group = (
                    ExpAuditRuleChecksJob.
                    _filter_invalid_fraction_ans_group(
                        answer_group, rule_spec_till_now, ans_group_idx,
                        ranges, matched_denominator_list, answer_groups
                    )
                )

                for rule_spec in answer_group.rule_specs:
                    rule_spec_till_now.append(rule_spec.to_dict())

                if answer_group.outcome.dest != state_name:
                    valid_dest_ans_group_count += 1
                    if can_delete_ans_group:
                        invalid_ans_group_count += 1
                        invalid_ans_group_idxs.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        'ans_group_idx': invalid_ans_group_idxs
                    }
                )

        return invalid_states

    @staticmethod
    def image_tag_alt_with_value_attribute_missing(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """Image tag should contain alt-with-value attribute even if
        it is empty, this function specefically checks for the curated
        explorations

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. The list of states that do
            not have alt-with-value as an attribute.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            soup = bs4.BeautifulSoup(state.content.html, 'html.parser')
            links = soup.find_all('oppia-noninteractive-image')
            for link in links:
                if link.get('alt-with-value') is None:
                    if state_name not in states_with_errored_values:
                        states_with_errored_values.append(state_name)
        return states_with_errored_values

    @staticmethod
    def multiple_choice_invalid_values(
        states_dict: Dict[str, state_domain.State]
    ) -> Tuple[List[Dict[str, object]], List[str]]:
        """Checks the following in the MultipleChoiceInput interaction
            - If one choice empty or we have duplicates then we can remove
            those choices from the rules, checks if removing them results in
            disconnection of current state to any connected state
            - If the invalid choices that we have to report is less than 4,
            then we report the state. We only use this value for the curated
            explorations
            - If the rule is duplicate

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            Tuple[List[Dict[str, object]]] | Tuple[None]. The errored states
            or None if the interaction is not MultipleChoiceInput.
        """
        invalid_states = []
        invalid_states_for_choices_less_than_4 = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'MultipleChoiceInput':
                continue
            choices = (
                state.interaction.customization_args['choices'].value)
            invalid_choices_index, _ = (
                ExpAuditRuleChecksJob.
                _get_invalid_choices_indexes(choices) # type: ignore[arg-type]
            )

            invalid_ans_group_idxs = []
            # Remove rules whose choice has been deleted.
            answer_groups = state.interaction.answer_groups
            valid_dest_ans_group_count = 0
            invalid_ans_group_count = 0
            rule_spec_till_now: List[state_domain.RuleSpecDict] = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                invalid_rules = []
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'Equals':
                        if rule_spec.inputs['x'] in invalid_choices_index:
                            invalid_rules.append(rule_spec)
                    if rule_spec.to_dict() in rule_spec_till_now:
                        invalid_rules.append(rule_spec)
                    rule_spec_till_now.append(rule_spec.to_dict())

                if answer_group.outcome.dest != state_name:
                    valid_dest_ans_group_count += 1
                    if (
                        len(invalid_rules) > 0 and
                        len(set(invalid_rules)) == len(answer_group.rule_specs)
                    ):
                        invalid_ans_group_count += 1
                        invalid_ans_group_idxs.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        'ans_group_idx': invalid_ans_group_idxs
                    }
                )

            choices_less_than_4 = len(choices) - len(invalid_choices_index) < 4
            if choices_less_than_4:
                invalid_states_for_choices_less_than_4.append(state_name)

        return (invalid_states, invalid_states_for_choices_less_than_4)

    @staticmethod
    def text_input_invalid_values(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """Checks the following in the MultipleChoiceInput interaction
            - `Contains` should always come after `Equals` and `Startswith`
            rules
            - `Startswith` should always come after the `Equals` rule
            - Rule is duplicate

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            invalid_states: List[Dict[str, object]]. List of invalid states
            with the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'TextInput':
                continue
            seen_strings_contains = []
            seen_strings_startswith = []
            rule_spec_till_now = []
            invalid_ans_group_idxs = []
            valid_dest_ans_group_count = 0
            invalid_ans_group_count = 0
            answer_groups = state.interaction.answer_groups
            for ans_group_idx, answer_group in enumerate(answer_groups):
                invalid_rules = []
                for rule_spec in answer_group.rule_specs:
                    # Rule is duplicate.
                    if rule_spec.to_dict() in rule_spec_till_now:
                        invalid_rules.append(rule_spec)
                    else:
                        rule_spec_till_now.append(rule_spec.to_dict())

                    if rule_spec.rule_type == 'Contains':
                        seen_strings_contains.append(
                            rule_spec.inputs['x']['normalizedStrSet'])

                    if rule_spec.rule_type == 'StartsWith':
                        # `Contains` should always come after `Equals` and
                        # `Startswith` rules.
                        rule_values = rule_spec.inputs['x']['normalizedStrSet']
                        seen_strings_startswith.append(rule_values)
                        for contain_rule_ele in seen_strings_contains:
                            for contain_rule_string in contain_rule_ele:
                                for rule_value in rule_values:
                                    if contain_rule_string in rule_value:
                                        invalid_rules.append(rule_spec)

                    if rule_spec.rule_type == 'Equals':
                        # `Contains` should always come after `Equals` and
                        # `Startswith` rules.
                        rule_values = rule_spec.inputs['x']['normalizedStrSet']
                        for contain_rule_ele in seen_strings_contains:
                            for contain_rule_string in contain_rule_ele:
                                for rule_value in rule_values:
                                    if contain_rule_string in rule_value:
                                        invalid_rules.append(rule_spec)

                        # `Startswith` should always come after the `Equals`
                        # rule.
                        for start_with_rule_ele in seen_strings_startswith:
                            for start_with_rule_string in start_with_rule_ele:
                                for rule_value in rule_values:
                                    if rule_value.startswith(
                                        start_with_rule_string):
                                        invalid_rules.append(rule_spec)

                if answer_group.outcome.dest != state_name:
                    valid_dest_ans_group_count += 1
                    if (
                        len(invalid_rules) > 0 and
                        len(set(invalid_rules)) == len(answer_group.rule_specs)
                    ):
                        invalid_ans_group_count += 1
                        invalid_ans_group_idxs.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        'ans_group_idx': invalid_ans_group_idxs
                    }
                )

        return invalid_states

    @staticmethod
    def get_exploration_from_models(
        model: Tuple[Any, Any] | Any
    ) -> None | exp_domain.Exploration:
        """Returns the exploration domain object

        Args:
            model: tuple|Any. The pair of exp and
                opportunity models or just exp model.

        Returns:
            exp_models.ExplorationModel. Returns the exp domain object.
        """
        if isinstance(model, tuple):
            try:
                return exp_fetchers.get_exploration_from_model(model[0])
            except Exception:
                return None
        else:
            try:
                return exp_fetchers.get_exploration_from_model(model)
            except Exception:
                return None

    @staticmethod
    def convert_into_model_pair(
        models_list_pair: Tuple[
          List[exp_models.ExplorationModel],
          List[opportunity_models.ExplorationOpportunitySummaryModel]
    ]) -> Tuple[
        Optional[exp_models.ExplorationModel],
        Optional[opportunity_models.ExplorationOpportunitySummaryModel]
    ]:
        """Returns the pair of exp and opportunity models.

        Args:
            models_list_pair: tuple. The pair of models list.

        Returns:
            tuple. The pair of exp and opportunity models.
        """
        exp_model = None
        opportunity_model = None
        if len(models_list_pair[0]) == 1:
            exp_model = models_list_pair[0][0]
        if len(models_list_pair[1]) == 1:
            opportunity_model = models_list_pair[1][0]
        model_pair = (exp_model, opportunity_model)
        return model_pair

    @staticmethod
    def filter_curated_explorations(model_pair: Tuple[
        Optional[exp_models.ExplorationModel],
        Optional[opportunity_models.ExplorationOpportunitySummaryModel]
    ]) -> bool:
        """Returns whether the exp model is curated or not.

        Args:
            model_pair: tuple. The pair of exp and opportunity models.

        Returns:
            bool. Returns whether the exp model is curated or not.
        """
        return (model_pair[0] is not None) and (model_pair[1] is not None)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_model_pipeline = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
        )

        all_explorations = (
            exp_model_pipeline
            | 'Get exploration from model' >> beam.Map(
                self.get_exploration_from_models)
            | 'Filter valid explorations' >> beam.Filter(
                lambda exp: exp is not None)
        )

        combine_exp_ids_and_states = (
            all_explorations
            | 'Combine exp id and states' >> beam.Map(
                lambda exp: (exp.id, exp.states, exp.created_on)
            )
        )

        exps_with_id_and_models = (
            exp_model_pipeline
            | 'Map id and exp model' >> beam.Map(
                lambda exp: (exp.id, exp)
            )
        )

        all_exp_opportunities = (
            exps_with_id_and_models
            | 'Get all ExplorationOpportunitySummaryModels' >>
                ndb_io.GetModels(
                    opportunity_models.ExplorationOpportunitySummaryModel
                        .get_all(include_deleted=False))
            | 'Create key-value pairs for opportunity models' >> beam.Map(
                lambda exp_opportunity_model: (
                    exp_opportunity_model.id, exp_opportunity_model))
        )

        all_explorations_summaries = (
            self.pipeline
            | 'Get all exp summary models' >> ndb_io.GetModels(
            exp_models.ExpSummaryModel.get_all(include_deleted=False))
            | 'Get exp summary from model' >> beam.Map(
            exp_fetchers.get_exploration_summary_from_model)
            | 'Filter valid exploration summaries' >> beam.Filter(
                lambda exp_summ: exp_summ is not None)
        )

        exp_public_summ_models = (
            all_explorations_summaries
            | 'Get public explorations' >> beam.Filter(
                lambda exp: exp.status == constants.ACTIVITY_STATUS_PUBLIC)
            | 'Map public exp with id' >> beam.Map(
                lambda exp_public: exp_public.id
            )
        )

        # PCollection of public explorations.
        exp_public_explorations = (
            all_explorations
            | 'Filter public exps' >> beam.Filter(
                lambda exp, public_exp_list: exp.id in public_exp_list,
                    public_exp_list=beam.pvalue.AsList(
                        exp_public_summ_models)
            )
            | 'Map public exp id, states, created date' >> beam.Map(
                lambda exp: (exp.id, exp.states, exp.created_on)
            )
        )

        # Curated exp code is taken from the PR #15298.
        curated_explorations = (
            (exps_with_id_and_models, all_exp_opportunities)
            | 'Combine the PCollections s' >> beam.CoGroupByKey()
            | 'Drop off the exp ids' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Get tuple pairs from both models' >> beam.Map(
                self.convert_into_model_pair)
            | 'Filter curated explorations' >> beam.Filter(
                self.filter_curated_explorations)
            | 'Get exploration from the model' >> beam.Map(
                self.get_exploration_from_models)
            | 'Filter valid curated explorations' >> beam.Filter(
                lambda exp: exp is not None)
            | 'Combine curated exp id and states' >> beam.Map(
                lambda exp: (exp.id, exp.states, exp.created_on))
        )

        # DragAndDrop invalid rules.
        filter_invalid_drag_drop_rules = (
            combine_exp_ids_and_states
            | 'Get invalid drag drop rules' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.invalid_drag_drop_interactions(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values drag drop rule' >> beam.Filter(
                lambda exp: len(exp[1]) > 0)
        )

        report_count_invalid_drag_drop_rules = (
            filter_invalid_drag_drop_rules
            | 'Report count for invalid drag drop rules' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID DRAG DROP RULES')
            )
        )

        report_invalid_drag_drop_rules = (
            filter_invalid_drag_drop_rules
            | 'Show info for drag drop' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'drag drop states are {exp_drag_errors}'
                    )
                )
            )
        )

        # DragAndDrop invalid public rules.
        filter_invalid_public_drag_drop_rules = (
            exp_public_explorations
            | 'Get invalid public drag drop rules' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.invalid_drag_drop_interactions(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values public drag drop rule' >> beam.Filter(
                lambda exp: len(exp[1]) > 0)
        )

        report_count_invalid_public_drag_drop_rules = (
            filter_invalid_public_drag_drop_rules
            | 'Report count for invalid public drag drop rules' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID DRAG DROP RULES')
            )
        )

        report_invalid_public_drag_drop_rules = (
            filter_invalid_public_drag_drop_rules
            | 'Show info for public drag drop' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public drag drop states are {exp_drag_errors}'
                    )
                )
            )
        )

        # DragAndDrop invalid curated rules.
        filter_invalid_curated_drag_drop_rules = (
            curated_explorations
            | 'Get invalid curated drag drop rules' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.invalid_drag_drop_interactions(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values curated drag drop rule' >> beam.Filter(
                lambda exp: len(exp[1]) > 0)
        )

        report_count_invalid_curated_drag_drop_rules = (
            filter_invalid_curated_drag_drop_rules
            | 'Report count for invalid curated drag drop rules' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID DRAG DROP RULES')
            )
        )

        report_invalid_curated_drag_drop_rules = (
            filter_invalid_curated_drag_drop_rules
            | 'Show info for curated drag drop' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated drag drop states are {exp_drag_errors}'
                    )
                )
            )
        )

        # Continue Text should be non-empty and have a max-length of 20,
        # it returns the language code of invalid explorations.
        filter_invalid_continue_text_values = (
            all_explorations
            | 'Filter invalid continue interaction explorations'
            >> beam.Filter(
                lambda exp: self.filter_invalid_continue_interaction_exps(
                    exp.states)
            )
            | 'Map language code' >> beam.Map(
                lambda exp: exp.language_code
            )
            | 'Combine globally' >> beam.Distinct() # pylint: disable=no-value-for-parameter
        )

        report_continue_text_language_code_values = (
            filter_invalid_continue_text_values
            | 'Show info for continue invalid values' >> beam.Map(
                lambda exp_language_codes: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The invalid language codes are {exp_language_codes}'
                    )
                )
            )
        )

        # ItemSelection interaction invalid values.
        filter_invalid_item_selec_invalid_values = (
            combine_exp_ids_and_states
            | 'Get invalid item selection invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.item_selec_invalid_values(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values item selec invalid values'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_item_selec_invalid_values = (
            filter_invalid_item_selec_invalid_values
            | 'Report count for invalid item selec values' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID ITEM SELECTION')
            )
        )

        report_invalid_item_selec_invalid_values = (
            filter_invalid_item_selec_invalid_values
            | 'Show info for item selec invalid value' >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'item selection states are {exp_item_errors}'
                    )
                )
            )
        )

        # ItemSelection public invalid values.
        filter_public_item_selec_invalid_values = (
            exp_public_explorations
            | 'Get public item selection invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.item_selec_invalid_values(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty public item selection invalid values'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_public_item_selec_invalid_values = (
            filter_public_item_selec_invalid_values
            | 'Report count for public item selec values' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID PUBLIC ITEM SELECTION')
            )
        )

        report_public_item_selec_invalid_values = (
            filter_public_item_selec_invalid_values
            | 'Show info for public item selec invalid value' >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public item selection states are {exp_item_errors}'
                    )
                )
            )
        )

        # ItemSelection curated invalid values.
        filter_curated_item_selec_invalid_values = (
            curated_explorations
            | 'Get curated item selection invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.item_selec_invalid_values(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty curated values for item selec invalid values'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_curated_item_selec_invalid_values = (
            filter_curated_item_selec_invalid_values
            | 'Report count for curated item selec values' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID CURATED ITEM SELECTION')
            )
        )

        report_curated_item_selec_invalid_values = (
            filter_curated_item_selec_invalid_values
            | 'Show info for curated item selec invalid value' >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated item selection states are {exp_item_errors}'
                    )
                )
            )
        )

        # NumericInput invalid rules.
        filter_invalid_numeric_input_values = (
            combine_exp_ids_and_states
            | 'Get invalid numeric input invalid values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values numeric input' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_numeric_input_values = (
            filter_invalid_numeric_input_values
            | 'Report count for invalid numeric input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC INPUT RULES')
            )
        )

        report_invalid_numeric_input_values = (
            filter_invalid_numeric_input_values
            | 'Show info for numeric input' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'numeric input states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # NumericInput public invalid rules.
        filter_invalid_public_numeric_input_values = (
            exp_public_explorations
            | 'Get invalid public numeric input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty public values numeric input' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_public_numeric_input_values = (
            filter_invalid_public_numeric_input_values
            | 'Report count for invalid public numeric input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC INPUT PUBLIC RULES')
            )
        )

        report_invalid_public_numeric_input_values = (
            filter_invalid_public_numeric_input_values
            | 'Show info for public numeric input' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public numeric input states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # NumericInput curated invalid rules.
        filter_invalid_curated_numeric_input_values = (
            curated_explorations
            | 'Get invalid curated numeric input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty curated values numeric input' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_curated_numeric_input_values = (
            filter_invalid_curated_numeric_input_values
            | 'Report count for invalid curated numeric input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC INPUT CURATED RULES')
            )
        )

        report_invalid_curated_numeric_input_values = (
            filter_invalid_curated_numeric_input_values
            | 'Show info for curated numeric input' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated numeric input states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # Alt-with-value should be an attribute present inside the image tag.
        filter_invalid_rte_image_alt_value = (
            curated_explorations
            | 'Get invalid rte image alt value'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.image_tag_alt_with_value_attribute_missing(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values rte image alt' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_rte_image_alt_value = (
            filter_invalid_rte_image_alt_value
            | 'Report count for invalid rte image' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID RTE IMAGE')
            )
        )

        report_invalid_rte_image_alt_value = (
            filter_invalid_rte_image_alt_value
            | 'Show info for RTE image' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'RTE image states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # MultipleChoiceInput invalid rules.
        filter_invalid_multiple_choice_input_values = (
            combine_exp_ids_and_states
            | 'Get invalid multiple choice input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.multiple_choice_invalid_values(exp_states)[0],
                    exp_created_on.date()
                )
            )
            | 'Remove empty values multiple choice input' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_multiple_choice_input_values = (
            filter_invalid_multiple_choice_input_values
            | 'Report count for invalid multiple choice input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID MULTIPLE CHOICE INPUT')
            )
        )

        report_invalid_multiple_choice_input_values = (
            filter_invalid_multiple_choice_input_values
            | 'Show info for multiplr choice input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'multiple choice input '
                       f'states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Curated MultipleChoiceInput invalid rules.
        filter_invalid_curated_multiple_choice_input_values = (
            curated_explorations
            | 'Get invalid curated multiple choice input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.multiple_choice_invalid_values(exp_states)[0],
                    exp_created_on.date()
                )
            )
            | 'Remove empty values curated multiple choice input'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_curated_multiple_choice_input_values = (
            filter_invalid_curated_multiple_choice_input_values
            | 'Report count for invalid curated multiple choice input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID CURATED '
                    'MULTIPLE CHOICE INPUT')
            )
        )

        report_invalid_curated_multiple_choice_input_values = (
            filter_invalid_curated_multiple_choice_input_values
            | 'Show info for curated multiple choice input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated multiple choice input '
                       f'states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Public MultipleChoiceInput invalid rules.
        filter_invalid_public_multiple_choice_input_values = (
            exp_public_explorations
            | 'Get invalid public multiple choice input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.multiple_choice_invalid_values(exp_states)[0],
                    exp_created_on.date()
                )
            )
            | 'Remove empty values public multiple choice input'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_public_multiple_choice_input_values = (
            filter_invalid_public_multiple_choice_input_values
            | 'Report count for invalid public multiple choice input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID PUBLIC '
                    'MULTIPLE CHOICE INPUT')
            )
        )

        report_invalid_public_multiple_choice_input_values = (
            filter_invalid_public_multiple_choice_input_values
            | 'Show info for public multiple choice input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public multiple choice input '
                       f'states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Curated exps with multiple choice input having choices less than 4.
        filter_invalid_curated_multiple_choice_have_choices_less_than_4 = (
            curated_explorations
            | 'Get invalid curated multiple choice interaction have '
            'choices less than 4' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.multiple_choice_invalid_values(exp_states)[1],
                    exp_created_on.date()
                )
            )
            | 'Remove curated values which are correct'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_curated_multi_interac_choices_less_than_4 = (
            filter_invalid_curated_multiple_choice_have_choices_less_than_4
            | 'Report count for invalid curated multiple choice input '
            'interaction having choices less than 4' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID CURATED '
                    'MULTIPLE CHOICE INPUT INTERACTION CHOICES LESS THAN 4')
            )
        )

        report_invalid_curated_multiple_interac_choices_less_than_4 = (
            filter_invalid_curated_multiple_choice_have_choices_less_than_4
            | 'Show info for curated multiple choice input interac '
            'having choices less than 4' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated multiple choice interaction having '
                       f'choices less than 4 are {exp_multi_errors}'
                    )
                )
            )
        )

        # FractionInput invalid rules.
        filter_invalid_fraction_input_values = (
            combine_exp_ids_and_states
            | 'Get invalid fraction input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.fraction_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values from fraction input' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_fraction_input_values = (
            filter_invalid_fraction_input_values
            | 'Report count for invalid fraction input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID FRACTION INPUT')
            )
        )

        report_invalid_fraction_input_values = (
            filter_invalid_fraction_input_values
            | 'Show info for fraction input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'fraction input states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Public FractionInput invalid rules.
        filter_invalid_public_fraction_input_values = (
            exp_public_explorations
            | 'Get invalid public fraction input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.fraction_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values public fraction input'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_public_fraction_input_values = (
            filter_invalid_public_fraction_input_values
            | 'Report count for invalid public fraction input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID PUBLIC '
                    'FRACTION INPUT')
            )
        )

        report_invalid_public_fraction_input_values = (
            filter_invalid_public_fraction_input_values
            | 'Show info for public fraction input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public fraction input states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Curated FractionInput invalid rules.
        filter_invalid_curated_fraction_input_values = (
            curated_explorations
            | 'Get invalid curated fraction input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.fraction_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values curated fraction input'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_curated_fraction_input_values = (
            filter_invalid_curated_fraction_input_values
            | 'Report count for invalid curated fraction input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID CURATED '
                    'FRACTION INPUT')
            )
        )

        report_invalid_curated_fraction_input_values = (
            filter_invalid_curated_fraction_input_values
            | 'Show info for curated fraction input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated fraction input states are {exp_multi_errors}'
                    )
                )
            )
        )

        # TextInput invalid rules.
        filter_invalid_text_input_values = (
            combine_exp_ids_and_states
            | 'Get invalid text input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.text_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values from text input' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_text_input_values = (
            filter_invalid_text_input_values
            | 'Report count for invalid text input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID TEXT INPUT')
            )
        )

        report_invalid_text_input_values = (
            filter_invalid_text_input_values
            | 'Show info for text input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'text input states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Public TextInput invalid rules.
        filter_invalid_public_text_input_values = (
            curated_explorations
            | 'Get invalid public text input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.text_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values public text input'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_public_text_input_values = (
            filter_invalid_public_text_input_values
            | 'Report count for invalid public text input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID PUBLIC '
                    'TEXT INPUT')
            )
        )

        report_invalid_public_text_input_values = (
            filter_invalid_public_text_input_values
            | 'Show info for public text input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public text input states are {exp_multi_errors}'
                    )
                )
            )
        )

        # Curated TextInput invalid rules.
        filter_invalid_curated_text_input_values = (
            curated_explorations
            | 'Get invalid curated text input invalid values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.text_input_invalid_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values curated text input'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_curated_text_input_values = (
            filter_invalid_curated_text_input_values
            | 'Report count for invalid curated text input' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID CURATED '
                    'TEXT INPUT')
            )
        )

        report_invalid_curated_text_input_values = (
            filter_invalid_curated_text_input_values
            | 'Show info for curated text input' >> beam.MapTuple(
                lambda exp_id, exp_multi_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated text input states are {exp_multi_errors}'
                    )
                )
            )
        )

        return (
            (
                report_count_invalid_drag_drop_rules,
                report_invalid_drag_drop_rules,

                report_count_invalid_public_drag_drop_rules,
                report_invalid_public_drag_drop_rules,

                report_count_invalid_curated_drag_drop_rules,
                report_invalid_curated_drag_drop_rules,

                report_continue_text_language_code_values,

                report_count_invalid_item_selec_invalid_values,
                report_invalid_item_selec_invalid_values,

                report_count_public_item_selec_invalid_values,
                report_public_item_selec_invalid_values,

                report_count_curated_item_selec_invalid_values,
                report_curated_item_selec_invalid_values,

                report_count_invalid_numeric_input_values,
                report_invalid_numeric_input_values,

                report_count_invalid_public_numeric_input_values,
                report_invalid_public_numeric_input_values,

                report_count_invalid_curated_numeric_input_values,
                report_invalid_curated_numeric_input_values,

                report_count_invalid_rte_image_alt_value,
                report_invalid_rte_image_alt_value,

                report_count_invalid_multiple_choice_input_values,
                report_invalid_multiple_choice_input_values,

                report_count_invalid_public_multiple_choice_input_values,
                report_invalid_public_multiple_choice_input_values,

                report_count_invalid_curated_multiple_choice_input_values,
                report_invalid_curated_multiple_choice_input_values,

                report_count_invalid_curated_multi_interac_choices_less_than_4,
                report_invalid_curated_multiple_interac_choices_less_than_4,

                report_count_invalid_fraction_input_values,
                report_invalid_fraction_input_values,

                report_count_invalid_public_fraction_input_values,
                report_invalid_public_fraction_input_values,

                report_count_invalid_curated_fraction_input_values,
                report_invalid_curated_fraction_input_values,

                report_count_invalid_text_input_values,
                report_invalid_text_input_values,

                report_count_invalid_public_text_input_values,
                report_invalid_public_text_input_values,

                report_count_invalid_curated_text_input_values,
                report_invalid_curated_text_input_values
            )
            | 'Combine results' >> beam.Flatten()
        )
