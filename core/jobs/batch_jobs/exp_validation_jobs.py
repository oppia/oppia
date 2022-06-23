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

"""Validation Jobs for exploration models"""

from __future__ import annotations

import math

from core.domain import exp_fetchers
from core.domain import html_cleaner
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

datastore_services = models.Registry.import_datastore_services()

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class ExpStateValidationJob(base_jobs.JobBase):
    """Job that tests the general state, rte and interaction validation"""

    @staticmethod
    def filter_invalid_state_rte_values(
        states_dict: dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state RTE values, validates the following -

        - Image tags contain filepath, alt, and caption attributes,
        where caption can be an empty string with at most 160
        characters and alt should have at least 5 characters.
        - Math tags contain math_content, raw_latex, and svg_filename
        attributes, where svg_filename has an SVG extension.
        - Skillreview tags contain text attributes, text is non-empty.
        - Video tags contain video_id, start, end, and autoplay attributes,
        where start is before end.
        - Link tags contain text where text is non-empty.

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
            rte_components = html_cleaner.get_rte_components(
                value.content.html)
            for rte_component in rte_components:
                # RTE image validations for caption, alt and filepath.
                if rte_component['id'] == 'oppia-noninteractive-image':
                    # Validates if caption value is <= 160.
                    cap_with_value = rte_component['customization_args'][
                        'caption-with-value']
                    alt_with_value = rte_component['customization_args'][
                        'alt-with-value']
                    file_with_value = rte_component['customization_args'][
                        'filepath-with-value']

                    if len(cap_with_value) > 160:
                        rte_components_errors.append(
                            f'State - {key} Image tag caption value '
                            f'is greater than 160 '
                            f'having value {file_with_value}.'
                        )

                    # Validates if alt value is greater than 5.
                    if len(alt_with_value) < 5:
                        rte_components_errors.append(
                            f'State - {key} Image tag alt value '
                            f'is less than 5 '
                            f'having value {file_with_value}.'
                        )

                    # Validates if filepath extension is svg.
                    if (
                        len(file_with_value) > 0 and
                        file_with_value[-3:] != 'svg'
                    ):
                        rte_components_errors.append(
                            f'State - {key} Image tag filepath value '
                            f'does not have svg extension '
                            f'having value {file_with_value}.'
                        )

                # Validates if math tag filepath extension is svg.
                elif rte_component['id'] == 'oppia-noninteractive-math':
                    svg_filename = rte_component['customization_args'][
                        'math_content-with-value']['svg_filename']

                    raw_latex = rte_component['customization_args'][
                        'math_content-with-value']['raw_latex']

                    if svg_filename[-3:] != 'svg':
                        rte_components_errors.append(
                            f'State - {key} Math tag svg_filename '
                            f'value has a non svg extension '
                            f'having value {svg_filename}.'
                        )

                    if raw_latex == '' or raw_latex is None:
                        rte_components_errors.append(
                            f'State - {key} Math tag raw_latex '
                            f'value is either empty or None '
                            f'having filename {svg_filename}.'
                        )

                # Validates if skillreview text value is non empty.
                elif (
                        rte_component['id'] == 
                        'oppia-noninteractive-skillreview'
                ):
                    text_with_value = rte_component['customization_args'][
                        'text-with-value']

                    if text_with_value == '' or text_with_value is None:
                        rte_components_errors.append(
                            f'State - {key} Skill review tag text '
                            f'value is either empty or None.'
                        )

                # Validates if video start value is lesser than end value.
                elif rte_component['id'] == 'oppia-noninteractive-video':
                    start_value = (
                        rte_component['customization_args']
                        ['start-with-value'])
                    end_value = (
                        rte_component['customization_args']
                        ['end-with-value'])
                    video_id = (
                        rte_component['customization_args']
                        ['video_id-with-value'])

                    if int(start_value) > int(end_value):
                        rte_components_errors.append(
                            f'State - {key} Video tag start '
                            f'value is greater than end value '
                            f'having video id {video_id}.'
                        )

                    if video_id == '' or video_id is None:
                        rte_components_errors.append(
                            f'State - {key} Video tag does '
                            f'not have a video_id.'
                        )

                # Validates if link text value is not empty.
                elif rte_component['id'] == 'oppia-noninteractive-link':
                    text_with_value = rte_component['customization_args'][
                        'text-with-value']
                    url_with_value = rte_component['customization_args'][
                        'url-with-value']

                    if text_with_value == '' or text_with_value is None:
                        rte_components_errors.append(
                            f'State - {key} Link tag text '
                            f'value is either empty or None '
                            f'having url {url_with_value}'
                        )

            states_with_values.append(
                {
                    'state_name': key,
                    'rte_components_errors': rte_components_errors
                }
            )
        return states_with_values

    @staticmethod
    def _validate_fraction_interaction(
        state, answer_group, ans_group_index
    ) -> None:
        """Returns the errored state interaction values for
        FractionInput
            - All rules should have solutions in simplest form if the
            simplest form setting is turned on
            - All rules should have solutions in proper form if the
            allow improper fraction setting is turned off
            - All rules should have solutions without integer parts
            when the allow nonzero integer parts setting is turned off
            - Fractional denominator should be > 0

        Args:
            value: state_domain.State. State object.
            answer_group: AnswerGroup. AnswerGroup object.
            ans_group_index: int. AnswerGroup index.

        Returns:
            fraction_interaction_invalid_values: List[str].
            Invalid interaction values.
        """
        fraction_interaction_invalid_values = []

        inputs_with_whole_nums = [
            'HasDenominatorEqualTo',
            'HasNumeratorEqualTo',
            'HasIntegerPartEqualTo',
            'HasNoFractionalPart'
        ]
        allow_non_zero_integ_part = (
            state.interaction.customization_args[
                'allowNonzeroIntegerPart'].value)
        allow_imp_frac = (
            state.interaction.customization_args[
                'allowImproperFraction'].value)
        require_simple_form = (
            state.interaction.customization_args[
                'requireSimplestForm'].value)

        for rule_spec in answer_group.rule_specs:
            rule_spec_index = str(answer_group.rule_specs.index(
                rule_spec))

            if rule_spec.rule_type not in inputs_with_whole_nums:
                num = rule_spec.inputs['f']['numerator']
                den = rule_spec.inputs['f']['denominator']
                whole = rule_spec.inputs['f']['wholeNumber']

                # Validates if the denominator is greater than zero.
                if den <= 0:
                    fraction_interaction_invalid_values.append(
                        f'The rule {rule_spec_index} of answer '
                        f'group {ans_group_index} has '
                        f'denominator equals to zero.'
                    )

                # Validates if the solution in simplest form.
                if require_simple_form:
                    d = math.gcd(num, den)
                    val_num = num // d
                    val_den = den // d
                    if val_num != num and val_den != den:
                        fraction_interaction_invalid_values.append(
                            f'The rule {rule_spec_index} of '
                            f'answer group {ans_group_index} do '
                            f'not have value in simple form'
                        )

                # Validates if the solution in proper frac form.
                if not allow_imp_frac:
                    if den <= num:
                        fraction_interaction_invalid_values.append(
                            f'The rule {rule_spec_index} of '
                            f'answer group {ans_group_index} do '
                            f'not have value in proper fraction'
                        )

                # Validates if the solution is without integ part.
                if not allow_non_zero_integ_part:
                    if whole != 0:
                        fraction_interaction_invalid_values.append(
                            f'The rule {rule_spec_index} of '
                            f'answer group {ans_group_index} has '
                            f'non zero integer part.'
                        )

            # Validates if the frac den is > 0.
            if rule_spec.rule_type == 'HasDenominatorEqualTo':
                if rule_spec.inputs['x'] == 0:
                    fraction_interaction_invalid_values.append(
                        f'The rule {rule_spec_index} of answer '
                        f'group {ans_group_index} has '
                        f'denominator equals to zero '
                        f'having rule type HasDenominatorEqualTo.'
                    )

            # Validates if the solution is without integ part.
            if rule_spec.rule_type == 'HasIntegerPartEqualTo':
                if (
                        not allow_non_zero_integ_part and
                        rule_spec.inputs['x'] != 0
                ):
                    fraction_interaction_invalid_values.append(
                        f'The rule {rule_spec_index} of answer '
                        f'group {ans_group_index} has '
                        f'non zero integer part having '
                        f'rule type HasIntegerPartEqualTo.'
                    )

        return fraction_interaction_invalid_values

    @staticmethod
    def _validate_numeric_interaction(
        answer_group, ans_group_index
    ) -> List[str]:
        """Returns the errored state interaction values for
        NumericInput
            - For x in [a, b], a must not be greater than b
            - For x in [a-b, a+b], b must be a positive value

        Args:
            answer_group: AnswerGroup. AnswerGroup object.
            ans_group_index: int. AnswerGroup index.

        Returns:
            numeric_input_interaction_values: List[str].
            Invalid interaction values.
        """
        numeric_input_interaction_values = []

        for rule_spec in answer_group.rule_specs:
            rule_spec_index = str(answer_group.rule_specs.index(
                rule_spec))
            # Validates x in [a-b, a+b], b must be a positive value.
            if rule_spec.rule_type == 'IsWithinTolerance':
                if rule_spec.inputs['tol'] <= 0:
                    numeric_input_interaction_values.append(
                        f'The rule {rule_spec_index} of answer '
                        f'group {ans_group_index} having '
                        f'rule type IsWithinTolerance '
                        f'have tol value less than zero.'
                    )

            # Validates x in [a, b], a must not be greater than b.
            if rule_spec.rule_type == 'IsInclusivelyBetween':
                if rule_spec.inputs['a'] > rule_spec.inputs['b']:
                    numeric_input_interaction_values.append(
                        f'The rule {rule_spec_index} of answer '
                        f'group {ans_group_index} having '
                        f'rule type IsInclusivelyBetween '
                        f'have a value greater than b value'
                    )
        return numeric_input_interaction_values

    @staticmethod
    def filter_invalid_frac_numeric_num_unit_interactions(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state interaction values for

            - FractionInput
            - NumericInput
            - NumberWithUnits
                - `equal to` should not come after `equivalent to` if
                they have the same value

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for key, value in states_dict.items():
            number_with_units_rules = []
            numeric_input_interaction_values = []
            fraction_interaction_invalid_values = []
            number_with_units_errors = []

            answer_groups = value.interaction.answer_groups
            for answer_group in answer_groups:
                ans_group_index = str(answer_groups.index(answer_group))
                # Validates various parts of FractionInput.
                if value.interaction.id == 'FractionInput':
                    fraction_interaction_invalid_values += (
                        ExpStateValidationJob._validate_fraction_interaction(
                            value, answer_group, ans_group_index
                        )
                    )

                # Validates various values of NumericInput interaction.
                if value.interaction.id == 'NumericInput':
                    numeric_input_interaction_values += (
                        ExpStateValidationJob._validate_numeric_interaction(
                            answer_group, ans_group_index
                        )
                    )

                # Validates for NumberWithUnits interaction.
                if value.interaction.id == 'NumberWithUnits':
                    # Validates equal to should not come after equivalent to.
                    for rule_spec in answer_group.rule_specs:
                        rule_spec_index = str(answer_group.rule_specs.index(
                            rule_spec))
                        if rule_spec.rule_type == 'IsEquivalentTo':
                            number_with_units_rules.append(
                                rule_spec.inputs['f'])
                        if rule_spec.rule_type == 'IsEqualTo':
                            if (rule_spec.inputs['f'] in
                                number_with_units_rules):
                                number_with_units_errors.append(
                                    f'The rule {rule_spec_index} of answer '
                                    f'group {ans_group_index} has '
                                    f'rule type equal is coming after '
                                    f'rule type equivalent having same value'
                                )

            states_with_values.append(
                {
                    'state_name': key,
                    'numeric_input_interaction_values': (
                        numeric_input_interaction_values),
                    'fraction_interaction_invalid_values': (
                        fraction_interaction_invalid_values),
                    'number_with_units_errors': number_with_units_errors,
                }
            )
        return states_with_values

    @staticmethod
    def _validate_multi_choice_interaction(state) -> List[str]:
        """Returns the errored state interaction values for
        MultipleChoiceInput
            - All MC inputs should have at least 4 options
            - Answer choices should be non-empty and unique
            - No answer choice should appear in more than one answer group
            - If all MC options have feedbacks, do not ask for
            a "Default Feedback"

        Args:
            value: state_domain.State. State object.

        Returns:
            mc_interaction_invalid_values: List[str].
            Invalid interaction values.
        """
        selected_equals_choices = []
        choice_prev_selected = False
        mc_interaction_invalid_values = []

        answer_groups = state.interaction.answer_groups
        for answer_group in answer_groups:
            answer_group_index = str(
                answer_groups.index(answer_group))
            # Validates no ans choice should appear more than one.
            for rule_spec in answer_group.rule_specs:
                rule_spec_index = str(
                    answer_group.rule_specs.index(rule_spec))
                if rule_spec.rule_type == 'Equals':
                    if rule_spec.inputs['x'] in selected_equals_choices:
                        choice_prev_selected = True
                    if not choice_prev_selected:
                        selected_equals_choices.append(
                            rule_spec.inputs['x'])
                    else:
                        mc_interaction_invalid_values.append(
                            f'rule - {rule_spec_index}, answer group '
                            f'- {answer_group_index} is '
                            f'already present.'
                        )
        choices = (
            state.interaction.customization_args['choices'].value)
        # Validates all inputs should have atleast 4 choices.
        if len(choices) < 4:
            mc_interaction_invalid_values.append(
                f'There should be atleast 4 choices '
                f'found {str(len(choices))}'
            )
        # Validates answer choices should be non-empty and unique.
        seen_choices = []
        choice_empty = False
        choice_duplicate = False
        for choice in choices:
            if choice.html == '<p></p>':
                choice_empty = True
            if choice.html in seen_choices:
                choice_duplicate = True
            seen_choices.append(choice.html)
        if choice_empty:
            mc_interaction_invalid_values.append(
                'There should not be any empty ' +
                'choices'
            )
        if choice_duplicate:
            mc_interaction_invalid_values.append(
                'There should not be any duplicate ' +
                'choices'
            )
        # Validates if all MC have feedbacks do not ask for def feedback.
        if (
                len(choices) == len(state.interaction.answer_groups)
                and state.interaction.default_outcome is not None
        ):
            mc_interaction_invalid_values.append(
                'All choices have feedback ' +
                'and still has default outcome'
            )

        return mc_interaction_invalid_values

    @staticmethod
    def _validate_item_selec_interaction(state) -> List[str]:
        """Returns the errored state interaction values for
        ItemSelectionInput
            - Min number of selections should be no greater than max num
            - There should be enough choices to have max num of selections
            - All items should be unique and non-empty
            - `==` should have between min and max number of selections

        Args:
            value: state_domain.State. State object.

        Returns:
            item_selec_interaction_values: List[str].
            Invalid interaction values.
        """
        item_selec_interaction_values = []
        answer_groups = state.interaction.answer_groups
        choices = (
            state.interaction.customization_args['choices'].value)

        for answer_group in answer_groups:
            answer_group_index = str(
                answer_groups.index(answer_group))
            # Validates `==` should be between min and max number of selec.
            min_value = (
                state.interaction.customization_args
                ['minAllowableSelectionCount'].value)
            max_value = (
                state.interaction.customization_args
                ['maxAllowableSelectionCount'].value)
            for rule_spec in answer_group.rule_specs:
                rule_index = str(
                    answer_group.rule_specs.index(rule_spec))
                if rule_spec.rule_type == 'Equals':
                    if (
                            len(rule_spec.inputs['x']) < min_value or
                            len(rule_spec.inputs['x']) > max_value
                        ):
                        item_selec_interaction_values.append(
                            f'Selected choices of rule {rule_index} '
                            f'of answer group {answer_group_index} '
                            f'either less than min_selection_value '
                            f'or greter than max_selection_value.'
                        )

        min_value = (
            state.interaction.customization_args
            ['minAllowableSelectionCount'].value)
        max_value = (
            state.interaction.customization_args
            ['maxAllowableSelectionCount'].value)
        # Validates min no of selec should be no greater than max num.
        if min_value > max_value:
            item_selec_interaction_values.append(
                f'Min value which is {str(min_value)} '
                f'is greater than max value '
                f'which is {str(max_value)}'
            )
        # Validates there should be enough choice to have max num of selec.
        if len(choices) < max_value:
            item_selec_interaction_values.append(
                f'Number of choices which is {str(len(choices))} '
                f'is lesser than the '
                f'max value selection which is {str(max_value)}'
            )
        # Validates all items should be unique and non-empty.
        seen_choices = []
        choice_empty = False
        choice_duplicate = False
        for choice in choices:
            if choice.html == '<p></p>':
                choice_empty = True
            if choice.html in seen_choices:
                choice_duplicate = True
            seen_choices.append(choice.html)
        if choice_empty:
            item_selec_interaction_values.append(
                'There should not be any empty ' +
                'choices'
            )
        if choice_duplicate:
            item_selec_interaction_values.append(
                'There should not be any duplicate ' +
                'choices'
            )

        return item_selec_interaction_values

    @staticmethod
    def filter_invalid_multi_choice_and_item_selec_interac(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state interaction values for

            - MultipleChoiceInput
            - ItemSelectionInput

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for key, value in states_dict.items():
            mc_interaction_invalid_values = []
            item_selec_interaction_values = []

            if value.interaction.id == 'MultipleChoiceInput':
                mc_interaction_invalid_values += (
                    ExpStateValidationJob._validate_multi_choice_interaction(
                        value
                    )
                )

            if value.interaction.id == 'ItemSelectionInput':
                item_selec_interaction_values += (
                    ExpStateValidationJob._validate_item_selec_interaction(
                        value
                    )
                )

            states_with_values.append(
                {
                    'state_name': key,
                    'mc_interaction_invalid_values': (
                        mc_interaction_invalid_values),
                    'item_selec_interaction_values': (
                        item_selec_interaction_values)
                }
            )

        return states_with_values

    @staticmethod
    def _validate_drag_drop_interaction(state) -> List[str]:
        """Returns the errored state interaction values for
        DragAndDropSortInput
            - All inputs should be non-empty, unique
            - There should be at least 2 items
            - Multiple items can be in the same place iff the
            setting is turned on
            - `== +/- 1` should never be an option if the "multiple
            items in same place" option is turned off
            - for `a < b`, `a` should not be the same as `b`

        Args:
            value: state_domain.State. State object.

        Returns:
            drag_drop_interaction_values: List[str].
            Invalid interaction values.
        """
        drag_drop_interaction_values = []

        answer_groups = state.interaction.answer_groups
        for answer_group in answer_groups:
            answer_group_index = str(answer_groups.index(answer_group))
            # Validates various value of DragAndDropSortInput interaction.
            multi_item_value = (
                state.interaction.customization_args
                ['allowMultipleItemsInSamePosition'].value)
            if not multi_item_value:
                for rule_spec in answer_group.rule_specs:
                    rule_spec_index = str(answer_group.rule_specs.index(
                        rule_spec))
                    # Validates multi items in same place iff setting on.
                    for ele in rule_spec.inputs['x']:
                        if len(ele) > 1:
                            drag_drop_interaction_values.append(
                                f'The rule {rule_spec_index} of '
                                f'answer group {answer_group_index} '
                                f'have multiple items at same place '
                                f'when multiple items in same '
                                f'position settings is turned off.'
                            )

                    # Validates == +/- 1 no option if multi item set off.
                    if (
                        rule_spec.rule_type ==
                        'IsEqualToOrderingWithOneItemAtIncorrectPosition'
                    ):
                        drag_drop_interaction_values.append(
                            f'The rule {rule_spec_index} '
                            f'of answer group {answer_group_index} '
                            f'having rule type - IsEqualToOrderingWith'
                            f'OneItemAtIncorrectPosition should not '
                            f'be there when the '
                            f'multiple items in same position '
                            f'setting is turned off.'
                        )

                    # Validates for a < b, a should not be the same as b.
                    if (
                        rule_spec.rule_type ==
                        'HasElementXBeforeElementY'
                    ):
                        if (
                            rule_spec.inputs['x'] == rule_spec.inputs['y']
                        ):
                            drag_drop_interaction_values.append(
                                f'The rule {rule_spec_index} of '
                                f'answer group {answer_group_index} '
                                f'the value 1 and value 2 cannot be '
                                f'same when rule type is '
                                f'HasElementXBeforeElementY'
                            )

        choices = (
            state.interaction.customization_args['choices'].value)
        # Validates there should be at least 2 items.
        if len(choices) < 2:
            drag_drop_interaction_values.append(
                'Atleast 2 choices should be there')
        # Validates all inputs should be non-empty, unique.
        seen_choices = []
        choice_empty = False
        choice_duplicate = False
        for choice in choices:
            if choice.html == '<p></p>':
                choice_empty = True
            if choice.html in seen_choices:
                choice_duplicate = True
            seen_choices.append(choice.html)
        if choice_empty:
            drag_drop_interaction_values.append(
                'There should not be any empty ' +
                'choices'
            )
        if choice_duplicate:
            drag_drop_interaction_values.append(
                'There should not be any duplicate ' +
                'choices'
            )

        return drag_drop_interaction_values

    @staticmethod
    def _validate_end_interaction(state) -> List[str]:
        """Returns the errored state interaction values for
        EndExploration
            - Should not have a default outcome or any answer groups
            - Should be at most 3 recommended explorations

        Args:
            value: state_domain.State. State object.

        Returns:
            end_interaction_invalid_values: List[str].
            Invalid interaction values.
        """
        end_interaction_invalid_values = []

        # Validates should'nt have def outcome or any answer groups.
        if state.interaction.default_outcome is not None:
            end_interaction_invalid_values.append(
                'There should be no default ' +
                'value present in the end exploration interaction.'
            )

        # Validates if answer group is present.
        if len(state.interaction.answer_groups) > 0:
            end_interaction_invalid_values.append(
                'There should be no answer ' +
                'groups present in the end exploration interaction.'
            )

        recc_exp_ids = (
            state.interaction.customization_args
            ['recommendedExplorationIds'].value)
        # Validates should be at most 3 recommended explorations.
        if len(recc_exp_ids) > 3:
            end_interaction_invalid_values.append(
                f'Total number of recommended '
                f'explorations should not be more than 3, found '
                f'{str(len(recc_exp_ids))}.'
            )

        return end_interaction_invalid_values

    @staticmethod
    def _validate_continue_interaction(state) -> List[str]:
        """Returns the errored state interaction values for
        Continue
            - Text should be non-empty and have a max-length of 20
            - Should not have any answer groups associated with it

        Args:
            value: state_domain.State. State object.

        Returns:
            continue_interaction_invalid_values: List[str].
            Invalid interaction values.
        """
        continue_interaction_invalid_values = []

        # Validates for Continue interaction.
        text_value = (
            state.interaction.customization_args
            ['buttonText'].value.unicode_str)
        # Validates text should be non-empty and have a max-length of 20.
        if text_value == '' or len(text_value) > 20 or text_value is None:
            continue_interaction_invalid_values.append(
                f'The text value is invalid, either '
                f'it is empty or the character length is more '
                f'than 20 or it is None, the value is {str(text_value)}'
            )

        # Validates should not have any answer groups associated with it.
        if len(state.interaction.answer_groups) > 0:
            continue_interaction_invalid_values.append(
                'There should be no answer ' +
                'groups present in the continue exploration interaction.'
            )
        return continue_interaction_invalid_values

    @staticmethod
    def filter_invalid_cont_end_drag_drop_interactions(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state interaction values for

            - DragAndDropSortInput
            - EndExploration
            - Continue

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for key, value in states_dict.items():
            end_interaction_invalid_values = []
            continue_interaction_invalid_values = []
            drag_drop_interaction_values = []

            if value.interaction.id == 'DragAndDropSortInput':
                drag_drop_interaction_values += (
                    ExpStateValidationJob._validate_drag_drop_interaction(
                        value
                    )
                )

            if value.interaction.id == 'EndExploration':
                end_interaction_invalid_values += (
                    ExpStateValidationJob._validate_end_interaction(value)
                )

            if value.interaction.id == 'Continue':
                continue_interaction_invalid_values += (
                    ExpStateValidationJob._validate_continue_interaction(value)
                )

            states_with_values.append(
                {
                    'state_name': key,
                    'end_interaction_invalid_values': (
                        end_interaction_invalid_values),
                    'continue_interaction_invalid_values': (
                        continue_interaction_invalid_values),
                    'drag_drop_interaction_values': (
                        drag_drop_interaction_values)
                }
            )
        return states_with_values

    @staticmethod
    def filter_invalid_state_values(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates the following -

        - tagged_skill_misconception_id should be None
        - The default outcome should have a valid destination node
        - destination_id should be non-empty and match the ID of a
        state in the exploration
        - Outcome labelled_as_correct should not be True if destination
        ID is (try again)
        - The answer group should have at least one rule spec
        - refresher_exploration_id should be None for all lessons

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        states_list = []

        for key, value in states_dict.items():
            states_list.append(key)

        for key, value in states_dict.items():
            tagged_skill_misconception_ids = []
            wrong_labelled_as_correct_values = []
            not_single_rule_spec = []
            invalid_refresher_exploration_id = []
            invalid_destinations = []
            invalid_default_outcome_dest = []
            answer_groups = value.interaction.answer_groups

            for answer_group in answer_groups:
                answer_group_index = str(answer_groups.index(answer_group))
                # Validates tagged_skill_misconception_id should be None.
                if answer_group.tagged_skill_misconception_id is not None:
                    tagged_skill_misconception_ids.append(
                        f'The tagged_skill_misconception_id '
                        f'of answer group {answer_group_index} '
                        f'is not None.'
                    )

                # Validates lab_as_correct should not True if dest try again.
                if (
                        answer_group.outcome.dest == key and
                        answer_group.outcome.labelled_as_correct
                ):
                    wrong_labelled_as_correct_values.append(
                        f'The value of labelled_as_correct '
                        f'of answer group {answer_group_index} '
                        f'is True but the destination '
                        f'is the state itself.'
                    )

                # Validates the ans group should have at least one rule spec.
                if len(answer_group.rule_specs) == 0:
                    not_single_rule_spec.append(
                        f'There is no rule present '
                        f'in answer group {answer_group_index}'
                        f', atleast one is required.'
                    )

                # Validates refresher_exploration_id be None for all lessons.
                if answer_group.outcome.refresher_exploration_id is not None:
                    invalid_refresher_exploration_id.append(
                        f'The refresher_exploration_id '
                        f'of answer group {answer_group_index} '
                        f'is not None.'
                    )

                # Validates dest_id should be non-empty and match the states.
                if (
                    answer_group.outcome.dest not in states_list or
                    answer_group.outcome.dest == ''
                ):
                    invalid_destinations.append(
                        f'The destination {str(answer_group.outcome.dest)} '
                        f'of answer group {answer_group_index} '
                        f'is not valid.'
                    )

            # Validates the def outcome should have a valid destination node.
            if value.interaction.default_outcome is not None:
                if value.interaction.default_outcome.dest not in states_list:
                    invalid_default_outcome_dest.append(
                        f'The destination of default outcome '
                        f'is not valid, the value is '
                        f'{str(value.interaction.default_outcome.dest)}'
                    )

                def_outcome_ref_exp_id = (
                    value.interaction.default_outcome.refresher_exploration_id)
                if def_outcome_ref_exp_id is not None:
                    invalid_refresher_exploration_id.append(
                        'The refresher_exploration_id ' +
                        'of default outcome is not None.'
                    )

            states_with_values.append(
                {
                    'state_name': key,
                    'tagged_skill_misconception_ids': (
                        tagged_skill_misconception_ids),
                    'wrong_labelled_as_correct_values': (
                        wrong_labelled_as_correct_values),
                    'not_single_rule_spec': not_single_rule_spec,
                    'invalid_refresher_exploration_id': (
                        invalid_refresher_exploration_id),
                    'invalid_destinations': invalid_destinations,
                    'invalid_default_outcome_dest': (
                        invalid_default_outcome_dest)
                }
            )
        return states_with_values

    @staticmethod
    def remove_empty_values(
        errored_values: List[dict[str, list]]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Remove the empty arrays

        Args:
            errored_values: list[dict]. The list of dictionaries
                containing the errored values.

        Returns:
            errored_values: list[dict]. The list of dictionaries
            containing the errored values with removed empty.
        """
        for ele in errored_values:
            for key, value in list(ele.items()):
                if len(value) == 0:
                    ele.pop(key)
        return errored_values

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        combine_exp_ids_and_states = (
            total_explorations
            | 'Combine exp id and states' >> beam.Map(
                lambda exp: (exp.id, exp.states, exp.created_on))
        )

        invalid_exps_with_errored_state_rte_values = (
            combine_exp_ids_and_states
            | 'Get invalid state rte values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_state_rte_values(exp_states),
                    exp_created_on))
            | 'Remove empty values for rte' >> beam.MapTuple(
                lambda exp_id, exp_states_rte_errors, exp_created_on: (
                    exp_id, self.remove_empty_values(exp_states_rte_errors),
                    exp_created_on.date()))
        )

        report_number_of_exps_queried = (
            invalid_exps_with_errored_state_rte_values
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS'))
        )

        report_invalid_state_rte_values = (
            invalid_exps_with_errored_state_rte_values
            | 'Show info for rte' >> beam.MapTuple(
                lambda exp_id, exp_states_rte_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the state'
                       f' RTE erroneous data are {exp_states_rte_errors}'
                    )
                )
            )
        )

        invalid_state_frac_numeric_num_with_unit_interactions_values = (
            combine_exp_ids_and_states
            | 'Invalid Fraction, Numeric, Number with units interactions'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_frac_numeric_num_unit_interactions(
                        exp_states), exp_created_on))
            | 'Remove empty values from errored state interactions'
            >> beam.MapTuple(
                lambda exp_id, exp_states_interaction_errors, exp_created_on: (
                    exp_id, self.remove_empty_values(
                    exp_states_interaction_errors),
                    exp_created_on.date()))
        )

        show_invalid_state_frac_numeric_num_with_unit_interactions = (
            invalid_state_frac_numeric_num_with_unit_interactions_values
            | 'Show info for Fraction, Numeric, Number with units interactions'
            >> beam.MapTuple(
                lambda exp_id, exp_states_interaction_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                        f'The id of exp is {exp_id}, '
                        f'created on {exp_created_on}, and the state fraction, '
                        f'numeric and number with units interaction erroneous '
                        f'data are {exp_states_interaction_errors}'
                    )
                )
            )
        )

        invalid_state_multiple_choice_and_item_selc_interactions_values = (
            combine_exp_ids_and_states
            | 'Invalid multiple choice and item selec interactions'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_multi_choice_and_item_selec_interac(
                        exp_states), exp_created_on))
            | 'Remove empty values from errored interactions'
            >> beam.MapTuple(
                lambda exp_id, exp_states_interaction_errors, exp_created_on: (
                    exp_id, self.remove_empty_values(
                    exp_states_interaction_errors),
                    exp_created_on.date()))
        )

        show_invalid_state_multi_choice_and_item_selc_interac_values = (
            invalid_state_multiple_choice_and_item_selc_interactions_values
            | 'Show info for multi choice and item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states_interaction_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state multiple '
                   f'choice and item selection interactions '
                   f'erroneous data are {exp_states_interaction_errors}'
                ))
            )
        )

        invalid_state_cont_end_drag_drop_interactions_values = (
            combine_exp_ids_and_states
            | 'Invalid continue, end, drag drop interactions' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_cont_end_drag_drop_interactions(
                        exp_states), exp_created_on))
            | 'Remove empty values from invalid interactions' >> beam.MapTuple(
                lambda exp_id, exp_states_interaction_errors, exp_created_on: (
                    exp_id, self.remove_empty_values(
                    exp_states_interaction_errors),
                    exp_created_on.date()))
        )

        show_invalid_state_cont_end_drag_drop_interac_values = (
            invalid_state_cont_end_drag_drop_interactions_values
            | 'Show info for continue, end, drag and drop' >> beam.MapTuple(
                lambda exp_id, exp_states_interaction_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state continue, '
                   f'end and drag and drop interactions '
                   f'erroneous data are {exp_states_interaction_errors}'
                ))
            )
        )

        invalid_exps_with_errored_states_values = (
            combine_exp_ids_and_states
            | 'Get invalid state values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_state_values(exp_states),
                    exp_created_on))
            | 'Remove empty values for state values' >> beam.MapTuple(
                lambda exp_id, exp_states_errors, exp_created_on: (
                    exp_id, self.remove_empty_values(exp_states_errors),
                    exp_created_on.date()))
        )

        report_invalid_state_values = (
            invalid_exps_with_errored_states_values
            | 'Show info for state values' >> beam.MapTuple(
                lambda exp_id, exp_states_errors, exp_created_on:
                (job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {exp_id}, '
                   f'created on {exp_created_on}, and the state'
                   f' erroneous data are {exp_states_errors}'
                ))
            )
        )

        return (
            (
                report_number_of_exps_queried,
                report_invalid_state_rte_values,
                show_invalid_state_frac_numeric_num_with_unit_interactions,
                show_invalid_state_multi_choice_and_item_selc_interac_values,
                show_invalid_state_cont_end_drag_drop_interac_values,
                report_invalid_state_values
            )
            | 'Combine results' >> beam.Flatten()
        )
