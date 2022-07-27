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

"""Validation jobs for state interactions and some RTE checks."""

from __future__ import annotations

import html
import json

from core.domain import exp_fetchers
from core.domain import rte_component_registry
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
from typing import Dict, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

datastore_services = models.Registry.import_datastore_services()


(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class ExpStateInteractionValidationJob(base_jobs.JobBase):
    """Job that tests the general state interaction validation"""

    @staticmethod
    def _get_rte_components(html_string: str):
        """Extracts the RTE components from an HTML string.

        Args:
            html_string: str. An HTML string.

        Returns:
            list(dict). A list of dictionaries, each representing an
            RTE component.
            Each dict in the list contains:
            - id: str. The name of the component, i.e.
            'oppia-noninteractive-link'.
            - customization_args: dict. Customization arg specs for
            the component.
        """
        components = []
        soup = bs4.BeautifulSoup(html_string, 'html.parser')
        oppia_custom_tag_attrs = (
            rte_component_registry.Registry.get_tag_list_with_attrs())  # type: ignore[no-untyped-call]
        for tag_name, tag_attrs in oppia_custom_tag_attrs.items():
            component_tags = soup.find_all(name=tag_name)
            for component_tag in component_tags:
                customization_args = {}
                for attr in tag_attrs:
                    try:
                        # Unescape special HTML characters such as '&quot;'.
                        attr_val = html.unescape(component_tag[attr])
                        customization_args[attr] = json.loads(attr_val)
                    except Exception:
                        customization_args[attr] = 'Not found'

                component = {
                    'id': tag_name,
                    'customization_args': customization_args
                }
                components.append(component)
        return components

    @staticmethod
    def filter_invalid_state_rte_values(
        states_dict: dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state RTE values, validates the following -
        - Image tags attributes exists.
        - Math tags attributes exists.
        - Skillreview tags attributes exists.
        - Video tags attributes exists.
        - Link tags attributes exists.

        Args:
            states_dict: dict[str, state_domain.State]. The dictionary
                containing state name as key and State object as value.

        Returns:
            states_with_values: List[Dict[str, List[Dict[str, List[str]]]]].
            The list of dictionaries containing the errored values.
        """
        states_with_values = []
        for key, value in states_dict.items():
            rte_components_errors = []
            rte_components = (
                ExpStateInteractionValidationJob._get_rte_components(
                value.content.html)
            )
            for rte_component in rte_components:
                # Validates image tag attributes exists.
                if rte_component['id'] == 'oppia-noninteractive-image':
                    if (
                        'caption-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'caption-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE image tag do not '
                            f'have cap-with-value attribute'
                        )

                    if (
                        'alt-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'alt-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE image tag do not '
                            f'have alt-with-value attribute'
                        )

                    if (
                        'filepath-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'filepath-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE image tag do not '
                            f'have filepath-with-value attribute'
                        )

                # Validates math tag attributes exists.
                elif rte_component['id'] == 'oppia-noninteractive-math':

                    if (
                        rte_component['customization_args'][
                            'math_content-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE math tag do not '
                            f'have math_content-with-value attribute'
                        )
                    else:
                        if (
                            'svg_filename' not in
                            rte_component['customization_args'][
                                'math_content-with-value'] or
                            rte_component['customization_args'][
                                'math_content-with-value'][
                                    'svg_filename'] == 'Not found'
                        ):
                            rte_components_errors.append(
                                f'State - {key} having RTE math tag do not '
                                f'have svg-filename attribute'
                            )

                        if (
                            'raw_latex' not in
                            rte_component['customization_args'][
                                'math_content-with-value'] or
                            rte_component['customization_args'][
                                'math_content-with-value'][
                                    'raw_latex'] == 'Not found'
                        ):
                            rte_components_errors.append(
                                f'State - {key} having RTE math tag do not '
                                f'have raw-latex attribute'
                            )

                # Validates skillreview tag attributes exists.
                elif (
                    rte_component['id'] ==
                    'oppia-noninteractive-skillreview'
                ):
                    if (
                        'text-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'text-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE skillreview tag do not '
                            f'have text-with-value attribute'
                        )

                    if (
                        'skill_id-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'skill_id-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE skillreview tag do not '
                            f'have skill_id-with-value attribute'
                        )

                # Validates video tag attributes exists.
                elif rte_component['id'] == 'oppia-noninteractive-video':
                    if (
                        'start-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'start-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE video tag do not '
                            f'have start-with-value attribute'
                        )

                    if (
                        'end-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'end-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE video tag do not '
                            f'have end-with-value attribute'
                        )

                    if (
                        'video_id-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'video_id-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE video tag do not '
                            f'have video_id-with-value attribute'
                        )

                    if (
                        'autoplay-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'autoplay-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE video tag do not '
                            f'have autoplay-with-value attribute'
                        )

                # Validates link tag attributes exists.
                elif rte_component['id'] == 'oppia-noninteractive-link':
                    if (
                        'text-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'text-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE link tag do not '
                            f'have text-with-value attribute'
                        )

                    if (
                        'url-with-value' not in
                        rte_component['customization_args'] or
                        rte_component['customization_args'][
                            'url-with-value'] == 'Not found'
                    ):
                        rte_components_errors.append(
                            f'State - {key} having RTE link tag do not '
                            f'have url-with-value attribute'
                        )

            if len(rte_components_errors) > 0:
                states_with_values.append(
                    {
                        'state_name': key,
                        'rte_components_errors': rte_components_errors
                    }
                )
        return states_with_values

    @staticmethod
    def _set_lower_and_upper_bounds(
        range_var, lower_bound, upper_bound,
        lb_inclusive, ub_inclusive
    ) -> None:
        """Sets the lower and upper bounds for the range_var, mainly
        we need to set the range so to keep track if any other rule's
        range lies in between or not to prevent redundancy

        Args:
            range_var: dict[str, Any]. To keep track of each rule's
                ans group index, rule spec index, lower bound, upper bound,
                lb inclusive, ub inclusive.

            lower_bound: float. The lower bound.

            upper_bound: float. The upper bound.

            lb_inclusive: bool. If lower bound is inclusive.

            ub_inclusive: bool. If upper bound is inclusive.
        """
        range_var['lower_bound'] = lower_bound
        range_var['upper_bound'] = upper_bound
        range_var['lb_inclusive'] = lb_inclusive
        range_var['ub_inclusive'] = ub_inclusive

    @staticmethod
    def _is_enclosed_by(range_compare_to, range_compare_with) -> bool:
        """Checks whether the ranges of rules enclosed or not

        Args:
            range_compare_to: dict[str, Any]. To keep track of each rule's
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
            range_compare_to['lower_bound'] is None or
            range_compare_with['upper_bound'] is None or
            range_compare_to['upper_bound'] is None
        ):
            return False
        lb_satisfied = (
            range_compare_with['lower_bound'] < range_compare_to[
                'lower_bound'] or
            (
                range_compare_with['lower_bound'] == range_compare_to[
                    'lower_bound'] and
                (
                    not range_compare_to['lb_inclusive'] or
                    range_compare_with['lb_inclusive']
                )
            )
        )
        ub_satisfied = (
            range_compare_with['upper_bound'] > range_compare_to[
                'upper_bound'] or
            (
                range_compare_with['upper_bound'] == range_compare_to[
                    'upper_bound'] and
                (
                    not range_compare_to['ub_inclusive'] or
                    range_compare_with['ub_inclusive']
                )
            )
        )
        is_enclosed = lb_satisfied and ub_satisfied
        return is_enclosed

    @staticmethod
    def _should_check_range_criteria(earlier_rule, later_rule) -> bool:
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
        return later_rule.rule_type in (
            'IsExactlyEqualTo', 'IsEquivalentTo',
            'IsEquivalentToAndInSimplestForm'
        )

    @staticmethod
    def filter_invalid_numeric_input_interaction(
        exp_states: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values for numeric input interaction,
        validates

            - Each answer group should not be a subset of any answer
            group that comes before it.

        Args:
            exp_states: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        lower_infinity = float('-inf')
        upper_infinity = float('inf')

        for state_name, state in exp_states.items():
            if state.interaction.id == 'NumericInput':
                numeric_input_interaction_values = []
                answer_groups = state.interaction.answer_groups
                ranges = []
                for answer_group in answer_groups:
                    ans_group_index = str(answer_groups.index(answer_group))
                    for rule_spec in answer_group.rule_specs:
                        rule_spec_index = str(answer_group.rule_specs.index(
                            rule_spec))
                        range_var = {
                            'ans_group_index': int(ans_group_index),
                            'rule_spec_index': int(rule_spec_index),
                            'lower_bound': 0,
                            'upper_bound': 0,
                            'lb_inclusive': False,
                            'ub_inclusive': False
                        }
                        if rule_spec.rule_type == 'IsLessThanOrEqualTo':
                            rule_value = float(rule_spec.inputs['x'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, lower_infinity,
                                    rule_value, False, True
                                )
                            )

                        if rule_spec.rule_type == 'IsGreaterThanOrEqualTo':
                            rule_value = float(rule_spec.inputs['x'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, rule_value,
                                    upper_infinity, True, False
                                )
                            )

                        if rule_spec.rule_type == 'Equals':
                            rule_value = float(rule_spec.inputs['x'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, rule_value,
                                    rule_value, True, True
                                )
                            )

                        if rule_spec.rule_type == 'IsLessThan':
                            rule_value = float(rule_spec.inputs['x'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, lower_infinity,
                                    rule_value, False, False
                                )
                            )

                        if rule_spec.rule_type == 'IsWithinTolerance':
                            rule_value_x = float(rule_spec.inputs['x'])
                            rule_value_tol = float(rule_spec.inputs['tol'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, rule_value_x - rule_value_tol,
                                    rule_value_x + rule_value_tol, True, True
                                )
                            )

                        if rule_spec.rule_type == 'IsGreaterThan':
                            rule_value = float(rule_spec.inputs['x'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, rule_value,
                                    upper_infinity, False, False
                                )
                            )

                        if rule_spec.rule_type == 'IsInclusivelyBetween':
                            rule_value_a = float(rule_spec.inputs['a'])
                            rule_value_b = float(rule_spec.inputs['b'])
                            (
                                ExpStateInteractionValidationJob.
                                _set_lower_and_upper_bounds(
                                    range_var, rule_value_a,
                                    rule_value_b, True, True
                                )
                            )
                        for range_ele in ranges:
                            if (
                                ExpStateInteractionValidationJob.
                                _is_enclosed_by(range_var, range_ele)
                            ):
                                numeric_input_interaction_values.append(
                                    f'Rule {rule_spec_index} from answer '
                                    f'group {ans_group_index} will never be '
                                    f'matched because it is made redundant '
                                    f'by the above rules'
                                )
                        ranges.append(range_var)

                if len(numeric_input_interaction_values) > 0:
                    states_with_values.append(
                        {
                            'state_name': state_name,
                            'numeric_input_interaction_values': (
                                numeric_input_interaction_values)
                        }
                    )

        return states_with_values

    @staticmethod
    def _get_rule_value_f(rule_spec):
        """Return rule values from the rule_spec

        Args:
            rule_spec: (state_domain.RuleSpec). Rule spec of an answer group.

        Returns:
            rule_value_f: float. The value of the rule spec.
        """
        rule_value_f = rule_spec.inputs['f']
        if rule_value_f['wholeNumber'] == 0:
            rule_value_f = float(
                rule_value_f['numerator']/rule_value_f['denominator']
            )
        else:
            rule_value_f = float(
                rule_value_f['wholeNumber'] +
                rule_value_f['numerator']/rule_value_f['denominator']
            )

        return rule_value_f

    @staticmethod
    def filter_invalid_fraction_input_interaction(
        exp_states: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values for fraction input interaction,
        validates

            - All rules should have solutions that do not match previous
            rules' solutions

        Args:
            exp_states: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in exp_states.items():
            if state.interaction.id != 'FractionInput':
                continue
            fraction_input_interaction_values = []
            lower_infinity = float('-inf')
            upper_infinity = float('inf')
            answer_groups = state.interaction.answer_groups
            ranges = []
            matched_denominator_list = []
            for answer_group in answer_groups:
                ans_group_index = str(answer_groups.index(answer_group))
                for rule_spec in answer_group.rule_specs:
                    rule_spec_index = str(answer_group.rule_specs.index(
                        rule_spec))
                    range_var = {
                        'ans_group_index': int(ans_group_index),
                        'rule_spec_index': int(rule_spec_index),
                        'lower_bound': None,
                        'upper_bound': None,
                        'lb_inclusive': False,
                        'ub_inclusive': False
                    }
                    matched_denominator = {
                        'ans_group_index': int(ans_group_index),
                        'rule_spec_index': int(rule_spec_index),
                        'denominator': 0
                    }

                    if (
                        rule_spec.rule_type in (
                            'IsEquivalentTo', 'IsExactlyEqualTo',
                            'IsEquivalentToAndInSimplestForm'
                        )
                    ):
                        rule_value_f = (
                            ExpStateInteractionValidationJob.
                            _get_rule_value_f(rule_spec)
                        )

                        (
                            ExpStateInteractionValidationJob.
                            _set_lower_and_upper_bounds(
                                range_var, rule_value_f,
                                rule_value_f, True, True
                            )
                        )

                    if rule_spec.rule_type == 'IsGreaterThan':
                        rule_value_f = (
                            ExpStateInteractionValidationJob.
                            _get_rule_value_f(rule_spec)
                        )

                        (
                            ExpStateInteractionValidationJob.
                            _set_lower_and_upper_bounds(
                                range_var, rule_value_f,
                                upper_infinity, False, False
                            )
                        )

                    if rule_spec.rule_type == 'IsLessThan':
                        rule_value_f = (
                            ExpStateInteractionValidationJob.
                            _get_rule_value_f(rule_spec)
                        )

                        (
                            ExpStateInteractionValidationJob.
                            _set_lower_and_upper_bounds(
                                range_var, lower_infinity,
                                rule_value_f, False, False
                            )
                        )

                    if rule_spec.rule_type == 'HasDenominatorEqualTo':
                        rule_value_x = int(rule_spec.inputs['x'])
                        matched_denominator['denominator'] = rule_value_x

                    for range_ele in ranges:
                        if (
                            ExpStateInteractionValidationJob.
                            _is_enclosed_by(range_var, range_ele)
                        ):
                            earlier_rule = (
                                answer_groups[range_ele['ans_group_index']]
                                .rule_specs[range_ele['rule_spec_index']]
                            )
                            if (
                                ExpStateInteractionValidationJob.
                                _should_check_range_criteria(
                                    earlier_rule, rule_spec
                                )
                            ):
                                fraction_input_interaction_values.append(
                                    f'Rule {rule_spec_index} from answer '
                                    f'group {ans_group_index} of '
                                    f'FractionInput interaction will '
                                    f'never be matched because it is '
                                    f'made redundant by the above rules'
                                )

                    for den in matched_denominator_list:
                        if (
                            den is not None and rule_spec.rule_type ==
                            'HasFractionalPartExactlyEqualTo'
                        ):
                            if (
                                den['denominator'] ==
                                rule_spec.inputs['f']['denominator']
                            ):
                                fraction_input_interaction_values.append(
                                    f'Rule {rule_spec_index} from answer '
                                    f'group {ans_group_index} of '
                                    f'FractionInput interaction having '
                                    f'rule type HasFractionalPart'
                                    f'ExactlyEqualTo will '
                                    f'never be matched because it is '
                                    f'made redundant by the above rules'
                                )

                    ranges.append(range_var)
                    matched_denominator_list.append(matched_denominator)

            if len(fraction_input_interaction_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'fraction_input_interaction_values': (
                            fraction_input_interaction_values)
                    }
                )

        return states_with_values

    @staticmethod
    def filter_invalid_item_selec_input_interaction(
        exp_states: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values for item selec interaction,
        validates

            - None of the answer groups should be the same

        Args:
            exp_states: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        for state_name, state in exp_states.items():
            if state.interaction.id != 'ItemSelectionInput':
                continue
            # None of the answer groups should be the same.
            item_selec_interaction_values = []
            equals_rule_values = []
            answer_groups = state.interaction.answer_groups
            for answer_group in answer_groups:
                ans_group_index = str(answer_groups.index(answer_group))
                for rule_spec in answer_group.rule_specs:
                    rule_spec_index = str(answer_group.rule_specs.index(
                        rule_spec))
                    if rule_spec.rule_type == 'Equals':
                        rule_spec_x = rule_spec.inputs['x']
                        if rule_spec_x in equals_rule_values:
                            item_selec_interaction_values.append(
                                f'Rule {rule_spec_index} from answer '
                                f'group {ans_group_index} of '
                                f'ItemSelectionInput have same rules.'
                            )
                        else:
                            equals_rule_values.append(rule_spec_x)

            if len(item_selec_interaction_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'item_selec_interaction_values': (
                            item_selec_interaction_values)
                    }
                )

        return states_with_values

    @staticmethod
    def _equals_should_come_before_idx_rule(
        state: state_domain.State
    ):
        """Returns the errored state drag and drop interaction value of

            - `==` should come before `idx(a) == b` if it satisfies
            that condition

        Args:
            state: state_domain.State. The exploration state.

        Returns:
            drag_drop_interaction_values: list[str]. The list of invalid drag
            and drop input interactions with in the state.
        """
        drag_drop_interaction_values = []
        ele_x_at_y_rules = []
        answer_groups = state.interaction.answer_groups
        for answer_group in answer_groups:
            ans_group_index = str(answer_groups.index(answer_group))
            for rule_spec in answer_group.rule_specs:
                rule_spec_index = str(answer_group.rule_specs.index(
                    rule_spec))

                if rule_spec.rule_type == 'HasElementXAtPositionY':
                    element = rule_spec.inputs['x']
                    position = rule_spec.inputs['y']
                    ele_x_at_y_rules.append(
                        {'element': element, 'position': position}
                    )

                if rule_spec.rule_type == 'IsEqualToOrdering':
                    for ele in ele_x_at_y_rules:
                        ele_position = ele['position']
                        ele_element = ele['element']
                        rule_choice = rule_spec.inputs['x'][ele_position - 1]

                        if len(rule_choice) > 1:
                            for choice in rule_choice:
                                if choice == ele_element:
                                    drag_drop_interaction_values.append(
                                        f'Rule - {rule_spec_index} of '
                                        f'answer group {ans_group_index} '
                                        f'will never be match '
                                        f'because it is made redundant by the '
                                        f'HasElementXAtPositionY rule above.'
                                    )
                        else:
                            if rule_choice[0] == ele_element:
                                drag_drop_interaction_values.append(
                                    f'Rule - {rule_spec_index} of answer group '
                                    f'{ans_group_index} will never be match '
                                    f'because it is made redundant by the '
                                    f'HasElementXAtPositionY rule above.'
                                )
        return drag_drop_interaction_values

    @staticmethod
    def _equals_should_come_before_misplace_by_one_rule(
        state: state_domain.State
    ):
        """Returns the errored state drag and drop interaction value of

            - `==` should come before `== +/- 1` if they are off by
            at most 1 value

        Args:
            state: state_domain.State. The exploration state.

        Returns:
            drag_drop_interaction_values: list[str]. The list of invalid drag
            and drop input interactions with in the state.
        """
        drag_drop_interaction_values = []
        equal_ordering_one_at_incorec_posn = []
        answer_groups = state.interaction.answer_groups
        for answer_group in answer_groups:
            ans_group_index = str(answer_groups.index(answer_group))
            for rule_spec in answer_group.rule_specs:
                rule_spec_index = str(answer_group.rule_specs.index(
                    rule_spec))

                if (
                        rule_spec.rule_type ==
                        'IsEqualToOrderingWithOneItemAtIncorrectPosition'
                ):
                    equal_ordering_one_at_incorec_posn.append(
                        rule_spec.inputs['x']
                    )

                if rule_spec.rule_type == 'IsEqualToOrdering':
                    dictionary = {}
                    for layer_idx, layer in enumerate(
                        rule_spec.inputs['x']
                    ):
                        for item in layer:
                            dictionary[item] = layer_idx

                    for ele in equal_ordering_one_at_incorec_posn:
                        wrong_positions = 0
                        for layer_idx, layer in enumerate(ele):
                            for item in layer:
                                if layer_idx != dictionary[item]:
                                    wrong_positions += 1
                        if wrong_positions <= 1:
                            drag_drop_interaction_values.append(
                                f'Rule - {rule_spec_index} of answer group '
                                f'{ans_group_index} will never be match '
                                f'because it is made redundant by the '
                                f'IsEqualToOrderingWithOneItemAtIncorrect'
                                f'Position rule above.'
                            )

        return drag_drop_interaction_values

    @staticmethod
    def filter_invalid_drag_drop_input_interaction(
        exp_states: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values for drag and drop interaction,
        validates

            - `==` should come before `idx(a) == b` if it satisfies
            that condition

            - `==` should come before `== +/- 1` if they are off by
            at most 1 value

        Args:
            exp_states: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        for state_name, state in exp_states.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            drag_drop_interaction_values = []

            # `==` should come before `idx(a) == b`.
            drag_drop_interaction_values += (
                ExpStateInteractionValidationJob.
                _equals_should_come_before_idx_rule(state)
            )

            # `==` should come before `== +/- 1`.
            drag_drop_interaction_values += (
                ExpStateInteractionValidationJob.
                _equals_should_come_before_misplace_by_one_rule(state)
            )

            if len(drag_drop_interaction_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'drag_drop_interaction_values': (
                            drag_drop_interaction_values)
                    }
                )

        return states_with_values

    @staticmethod
    def _contains_should_come_after(state):
        """Returns the errored state text interaction value of

            - `contains` should always come after any other rule where
            the `contains` string is a substring of the other rule's string

        Args:
            state: state_domain.State. The exploration state.

        Returns:
            text_input_interaction_values: list[str]. The list of invalid text
            input interactions with in the state.
        """
        text_input_interaction_values = []
        seen_strings_contains = []
        answer_groups = state.interaction.answer_groups
        for answer_group in answer_groups:
            ans_group_index = str(answer_groups.index(answer_group))
            for rule_spec in answer_group.rule_specs:
                rule_spec_index = str(answer_group.rule_specs.index(
                    rule_spec))

                if rule_spec.rule_type == 'Contains':
                    seen_strings_contains.append(
                        rule_spec.inputs['x']['normalizedStrSet'])
                else:
                    rule_values = rule_spec.inputs['x']['normalizedStrSet']
                    for contain_ele in seen_strings_contains:
                        for item in contain_ele:
                            for ele in rule_values:
                                if item in ele:
                                    text_input_interaction_values.append(
                                        f'Rule - {rule_spec_index} of answer '
                                        f'group - {ans_group_index} having '
                                        f'rule type {rule_spec.rule_type} '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'contains rule.'
                                    )

        return text_input_interaction_values

    @staticmethod
    def _starts_with_should_come_after(state: state_domain.State):
        """Returns the errored state text interaction value of

            - `starts with` should always come after any other rule where
            a `starts with` string is a prefix of the other rule's string

        Args:
            state: state_domain.State. The exploration state.

        Returns:
            text_input_interaction_values: list[str]. The list of invalid text
            input interactions with in the state.
        """
        text_input_interaction_values = []
        seen_strings_startswith = []
        answer_groups = state.interaction.answer_groups
        for answer_group in answer_groups:
            ans_group_index = str(answer_groups.index(answer_group))
            for rule_spec in answer_group.rule_specs:
                rule_spec_index = str(answer_group.rule_specs.index(
                    rule_spec))

                if rule_spec.rule_type == 'StartsWith':
                    seen_strings_startswith.append(
                        rule_spec.inputs['x']['normalizedStrSet']
                    )
                else:
                    rule_values = rule_spec.inputs['x']['normalizedStrSet']
                    for start_with_ele in seen_strings_startswith:
                        for item in start_with_ele:
                            for ele in rule_values:
                                if ele.startswith(item):
                                    text_input_interaction_values.append(
                                        f'Rule - {rule_spec_index} of answer '
                                        f'group - {ans_group_index} having '
                                        f'rule type {rule_spec.rule_type} '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'starts with rule.'
                                    )
        return text_input_interaction_values

    @staticmethod
    def filter_invalid_text_input_interaction(
        exp_states: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values for text interaction, validates

            - Text Input height should be between integer between
            1 and 10, inclusive

            - `contains` should always come after any other rule where
            the `contains` string is a substring of the other rule's string

            - `starts with` should always come after any other rule where
            a `starts with` string is a prefix of the other rule's string

        Args:
            exp_states: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in exp_states.items():
            if state.interaction.id != 'TextInput':
                continue
            text_input_interaction_values = []

            # Text input height >= 1 and <= 10.
            rows_value = int(
                state.interaction.customization_args['rows'].value
            )
            if rows_value < 1 or rows_value > 10:
                text_input_interaction_values.append(
                    f'Rows having value {rows_value} is either '
                    f'less than 1 or greater than 10.'
                )

            # Contains should come after other rule where its a substring.
            text_input_interaction_values += (
                ExpStateInteractionValidationJob.
                _contains_should_come_after(state)
            )

            # Starts with should come after other rule where its a prefix.
            text_input_interaction_values += (
                ExpStateInteractionValidationJob.
                _starts_with_should_come_after(state)
            )

            if len(text_input_interaction_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'text_input_interaction_values': (
                            text_input_interaction_values)
                    }
                )

        return states_with_values

    def filter_invalid_end_interactions(self, exp_states, exp_id_list):
        """Filter invalid end interaction states.

        Args:
            exp_states: state_domain.State. The exploration states.
            exp_id_list: List[str]. List of all exploration ids.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        for state_name, state in exp_states.items():
            if state.interaction.id != 'EndExploration':
                continue
            invalid_state_exp_ids = []
            recc_exp_ids = (
                state.interaction.customization_args
                ['recommendedExplorationIds'].value
            )

            for exp_id in recc_exp_ids:
                if exp_id not in exp_id_list:
                    invalid_state_exp_ids.append(exp_id)
            if len(invalid_state_exp_ids) > 0:
                (
                    states_with_values.append(
                        {
                            'state_name': state_name,
                            'invalid_exps': invalid_state_exp_ids
                        }
                    )
                )
        return states_with_values

    def get_exploration_from_model(self, exp):
        """Fetching exploration domain object from model

        Args:
            exp: ExplorationModel. The ExplorationModel from storage layer.

        Returns:
            exp_model|None: exp_domain.Exploration. The exploration domain
            object.
        """
        try:
            exp_model = exp_fetchers.get_exploration_from_model(exp)
        except:
            return None
        return exp_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        all_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                self.get_exploration_from_model)
            | 'Filter valid explorations' >> beam.Filter(
                lambda exp: exp is not None)
        )

        exp_ids_pcoll = (
            all_explorations
            | 'Map ids' >> beam.Map(
                lambda exp: exp.id
            )
        )

        combine_exp_ids_and_states = (
            all_explorations
            | 'Combine exp id and states' >> beam.Map(
                lambda exp: (exp.id, exp.states, exp.created_on)
            )
        )

        invalid_exps_with_errored_state_rte_values = (
            combine_exp_ids_and_states
            | 'Get invalid state rte values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_state_rte_values(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values for rte' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_state_rte_values = (
            invalid_exps_with_errored_state_rte_values
            | 'Show info for rte' >> beam.MapTuple(
                lambda exp_id, exp_states_rte_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the state '
                       f'RTE erroneous data are {exp_states_rte_errors}'
                    )
                )
            )
        )

        invalid_exps_with_errored_state_numeric_interaction = (
            combine_exp_ids_and_states
            | 'Get invalid numeric interaction values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id, self.filter_invalid_numeric_input_interaction(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values for state numeric interc'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_numeric_interac_state_values = (
            invalid_exps_with_errored_state_numeric_interaction
            | 'Show info for invalid numeric interac' >> beam.MapTuple(
                lambda exp_id, exp_numeric_interc_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state '
                   f'numeric input interaction erroneous data are '
                   f'{exp_numeric_interc_errors}'
                ))
            )
        )

        invalid_exps_with_errored_state_fraction_interaction = (
            combine_exp_ids_and_states
            | 'Get invalid fraction interaction values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id, self.filter_invalid_fraction_input_interaction(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values for state fraction interc'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_fraction_interac_state_values = (
            invalid_exps_with_errored_state_fraction_interaction
            | 'Show info for invalid fraction interac' >> beam.MapTuple(
                lambda exp_id, exp_fraction_interc_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state '
                   f'fraction input interaction erroneous data are '
                   f'{exp_fraction_interc_errors}'
                ))
            )
        )

        invalid_exps_with_errored_state_item_interaction = (
            combine_exp_ids_and_states
            | 'Get invalid item interaction values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id, self.filter_invalid_item_selec_input_interaction(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values for state item interc'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_item_interac_state_values = (
            invalid_exps_with_errored_state_item_interaction
            | 'Show info for invalid item interac' >> beam.MapTuple(
                lambda exp_id, exp_item_interc_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state '
                   f'item selection input interaction erroneous data are '
                   f'{exp_item_interc_errors}'
                ))
            )
        )

        invalid_exps_with_errored_state_drag_interaction = (
            combine_exp_ids_and_states
            | 'Get invalid drag drop interaction values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id, self.filter_invalid_drag_drop_input_interaction(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values for state drag interc'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_drag_interac_state_values = (
            invalid_exps_with_errored_state_drag_interaction
            | 'Show info for invalid drag drop interac' >> beam.MapTuple(
                lambda exp_id, exp_drag_interc_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state '
                   f'drag drop selection input interaction erroneous data are '
                   f'{exp_drag_interc_errors}'
                ))
            )
        )

        invalid_exps_with_errored_state_text_interaction = (
            combine_exp_ids_and_states
            | 'Get invalid text interaction values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id, self.filter_invalid_text_input_interaction(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values for state text interc'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_text_interac_state_values = (
            invalid_exps_with_errored_state_text_interaction
            | 'Show info for invalid text input interac' >> beam.MapTuple(
                lambda exp_id, exp_text_interc_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state '
                   f'text input interaction erroneous data are '
                   f'{exp_text_interc_errors}'
                ))
            )
        )

        invalid_exps_with_state_end_interac = (
            all_explorations
            | 'Filter invalid end interac' >> beam.Map(
                lambda exp, errored_data: (
                    exp.id, self.filter_invalid_end_interactions(
                        exp.states, errored_data), exp.created_on.date()
                    ), errored_data=beam.pvalue.AsList(exp_ids_pcoll)
            )
            | 'Remove empty values for state end interaction'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_invalid_state_end_interac = (
            invalid_exps_with_state_end_interac
            | 'Show info for invalid end interac' >> beam.MapTuple(
                lambda exp_id, invalid_values, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                        f'The id of exp is {exp_id}, '
                        f'created on {exp_created_on}, and the invalid '
                        f'end interac values are {invalid_values}'
                    )
                )
            )
        )

        return (
            (
                report_invalid_state_rte_values,
                report_invalid_numeric_interac_state_values,
                report_invalid_fraction_interac_state_values,
                report_invalid_item_interac_state_values,
                report_invalid_drag_interac_state_values,
                report_invalid_text_interac_state_values,
                report_invalid_state_end_interac
            )
            | 'Combine results' >> beam.Flatten()
        )
