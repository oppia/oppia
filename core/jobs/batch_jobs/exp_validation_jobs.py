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
    ) -> list[dict[str, list]]:
        """Returns the errored state RTE values, validates the following -

        - Image tags contain filepath, alt, and caption attributes,
        where caption can be an empty string with at most 160
        characters and alt should have at least 5 characters.
        - Math tags contain math_content, raw_latex, and svg_filename
        attributes, where svg_filename has an SVG extension.
        - Skillreview tags contain text attributes, text is non-empty.
        - Video tags contain video_id, start, end, and autoplay attributes,
        where start is before end.
        - Link tags contain text and url attributes, where text is non-empty
        and url begins with HTTPS.

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        for key, value in states_dict.items():
            rte_components_errors = []
            rte_components = html_cleaner.get_rte_components(
                value.content.html)
            for rte_component in rte_components:
                # RTE image validations for caption, alt and filepath.
                if rte_component['id'] == 'oppia-noninteractive-image':
                    # Validates if caption value is greater than 160.
                    cap_with_value = rte_component['customization_args'][
                        'caption-with-value']
                    alt_with_value = rte_component['customization_args'][
                        'alt-with-value']
                    file_with_value = rte_component['customization_args'][
                        'filepath-with-value']

                    if len(cap_with_value) > 160:
                        rte_components_errors.append(
                            'State - {key} Image tag caption value '.format(
                                key=key) +
                            'is greater than 160.')

                    # Validates if alt value is less than 5.
                    if len(alt_with_value) < 5:
                        rte_components_errors.append(
                            'State - {key} Image tag alt value '.format(
                                key=key) +
                            'is less than 5.')

                    # Validates if filepath extension is not svg.
                    if file_with_value[-3:] != 'svg':
                        rte_components_errors.append(
                            'State - {key} Image tag filepath value '.format(
                                key=key) +
                            'does not have svg extension.')

                # Validates if math tag filepath extension is not svg.
                elif rte_component['id'] == 'oppia-noninteractive-math':
                    svg_filename = rte_component['customization_args'][
                        'math_content-with-value']['svg_filename']

                    if svg_filename[-3:] != 'svg':
                        rte_components_errors.append(
                            'State - {key} Math tag svg_filename '.format(
                                key=key) +
                            'value has a non svg extension.')

                # Validates if skillreview text value is empty.
                elif (rte_component['id'] ==
                    'oppia-noninteractive-skillreview'):
                    text_with_value = rte_component['customization_args'][
                        'text-with-value']

                    if text_with_value == '':
                        rte_components_errors.append(
                            'State - {key} Skill review tag text '.format(
                                key=key) +
                            'value is empty.')

                # Validates if video start value is greater than end value.
                elif rte_component['id'] == 'oppia-noninteractive-video':
                    start_value = (
                        rte_component['customization_args']
                        ['start-with-value'])
                    end_value = (
                        rte_component['customization_args']
                        ['end-with-value'])

                    if int(start_value) > int(end_value):
                        rte_components_errors.append(
                            'State - {key} Video tag start '.format(
                                key=key) +
                            'value is greater than end value.')

                # Validates link url is not https and text value is not empty.
                elif rte_component['id'] == 'oppia-noninteractive-link':
                    url_value = rte_component['customization_args'][
                        'url-with-value'][:5]
                    text_with_value = rte_component['customization_args'][
                        'text-with-value']

                    if text_with_value == '':
                        rte_components_errors.append(
                            'State - {key} Link tag text '.format(
                                key=key) +
                            'value is empty.')

                    if url_value != 'https':
                        rte_components_errors.append(
                            'State - {key} Link tag url '.format(
                                key=key) +
                            'value does not start with https.')

            states_with_values.append(
                {'state_name': key,
                'rte_components_errors': rte_components_errors}
            )
        return states_with_values

    @staticmethod
    def filter_invalid_frac_numeric_num_unit_interactions(
        states_dict: dict[str, state_domain.State]
    ) -> list[dict[str, list]]:
        """Returns the errored state interaction values for

            - FractionInput
                - All rules should have solutions in simplest form if the
                simplest form setting is turned on
                - All rules should have solutions in proper form if the
                allow improper fraction setting is turned off
                - All rules should have solutions without integer parts
                when the allow nonzero integer parts setting is turned off
                - Fractional denominator should be > 0

            - NumericInput
                - For x in [a, b], a must not be greater than b
                - For x in [a-b, a+b], b must be a positive value

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
                    inputs_with_whole_nums = [
                        'HasDenominatorEqualTo',
                        'HasNumeratorEqualTo',
                        'HasIntegerPartEqualTo',
                        'HasNoFractionalPart'
                    ]
                    allow_non_zero_integ_part = (
                        value.interaction.customization_args[
                            'allowNonzeroIntegerPart'].value)
                    allow_imp_frac = (
                        value.interaction.customization_args[
                            'allowImproperFraction'].value)
                    allow_req_simple_form = (
                        value.interaction.customization_args[
                            'requireSimplestForm'].value)

                    for rule_spec in answer_group.rule_specs:
                        rule_spec_index = str(answer_group.rule_specs.index(
                            rule_spec))

                        if rule_spec.rule_type not in inputs_with_whole_nums:
                            num = rule_spec.inputs['f']['numerator']
                            den = rule_spec.inputs['f']['denominator']
                            whole = rule_spec.inputs['f']['wholeNumber']

                            # Validates if the denominator value is zero.
                            if den == 0:
                                fraction_interaction_invalid_values.append(
                                    'The rule {rule} of answer '.format(
                                        rule=rule_spec_index) +
                                    'group {answer_group} has '.format(
                                        answer_group=ans_group_index) +
                                    'denominator equals to zero.')

                            # Validates if the value not in simplest form.
                            if allow_req_simple_form is True:
                                if whole == 0:
                                    d = math.gcd(num, den)
                                    val_num = num // d
                                    val_den = den // d
                                if val_num != num and val_den != den:
                                    fraction_interaction_invalid_values.append(
                                        'The rule {rule} of answer '.format(
                                            rule=rule_spec_index) +
                                        'group {answer_group} do '.format(
                                            answer_group=ans_group_index) +
                                        'not have value in simple form')

                            # Validates if the value not in proper frac form.
                            if allow_imp_frac is False:
                                if den <= num:
                                    fraction_interaction_invalid_values.append(
                                        'The rule {rule} of answer '.format(
                                            rule=rule_spec_index) +
                                        'group {answer_group} do '.format(
                                            answer_group=ans_group_index) +
                                        'not have value in proper fraction')

                            # Validates if the value has non zero integ part.
                            if allow_non_zero_integ_part is False:
                                if whole != 0:
                                    fraction_interaction_invalid_values.append(
                                        'The rule {rule} of answer '.format(
                                            rule=rule_spec_index) +
                                        'group {answer_group} has '.format(
                                            answer_group=ans_group_index) +
                                        'non zero integer part.')

                        # Validates if the den is 0 having rule HasDenEqTo.
                        if rule_spec.rule_type == 'HasDenominatorEqualTo':
                            if rule_spec.inputs['x'] == 0:
                                fraction_interaction_invalid_values.append(
                                    'The rule {rule} of answer '.format(
                                        rule=rule_spec_index) +
                                    'group {answer_group} has '.format(
                                        answer_group=ans_group_index) +
                                    'denominator equals to zero ' +
                                    'having rule type HasDenominatorEqualTo.')

                        # Validates if the value != 0 when setting is turn off.
                        if rule_spec.rule_type == 'HasIntegerPartEqualTo':
                            if (allow_non_zero_integ_part is False and
                            rule_spec.inputs['x'] != 0):
                                fraction_interaction_invalid_values.append(
                                    'The rule {rule} of answer '.format(
                                        rule=rule_spec_index) +
                                    'group {answer_group} has '.format(
                                        answer_group=ans_group_index) +
                                    'non zero integer part having ' +
                                    'rule type HasIntegerPartEqualTo.')

                # Validates various values of NumericInput interaction.
                if value.interaction.id == 'NumericInput':
                    for rule_spec in answer_group.rule_specs:
                        rule_spec_index = str(answer_group.rule_specs.index(
                            rule_spec))
                        # Validates if tol value < 0 of rule IsWithTol.
                        if rule_spec.rule_type == 'IsWithinTolerance':
                            if rule_spec.inputs['tol'] < 0:
                                numeric_input_interaction_values.append(
                                    'The rule {rule} of answer '.format(
                                        rule=rule_spec_index) +
                                    'group {answer_group} having '.format(
                                        answer_group=ans_group_index) +
                                    'rule type IsWithinTolerance ' +
                                    'have tol value less than zero.')

                        # Validates if the 1st value is greater than 2nd.
                        if rule_spec.rule_type == 'IsInclusivelyBetween':
                            if rule_spec.inputs['a'] > rule_spec.inputs['b']:
                                numeric_input_interaction_values.append(
                                    'The rule {rule} of answer '.format(
                                        rule=rule_spec_index) +
                                    'group {answer_group} having '.format(
                                        answer_group=ans_group_index) +
                                    'rule type IsInclusivelyBetween ' +
                                    'have a value greater than b value')

                # Validates for NumberWithUnits interaction.
                if value.interaction.id == 'NumberWithUnits':
                    # Validates if IsEqui comes before IsEqual for same value.
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
                                    'The rule {rule} of answer '.format(
                                        rule=rule_spec_index) +
                                    'group {answer_group} has '.format(
                                        answer_group=ans_group_index) +
                                    'rule type equal is coming after ' +
                                    'rule type equivalent having same value')

            states_with_values.append(
                {'state_name': key,
                'numeric_input_interaction_values':
                numeric_input_interaction_values,
                'fraction_interaction_invalid_values':
                fraction_interaction_invalid_values,
                'number_with_units_errors': number_with_units_errors,
                }
            )
        return states_with_values

    @staticmethod
    def filter_invalid_multi_choice_and_item_selec_interac(
        states_dict: dict[str, state_domain.State]
    ) -> list[dict[str, list]]:
        """Returns the errored state interaction values for

            - MultipleChoiceInput
                - All MC inputs should have at least 4 options
                - Answer choices should be non-empty and unique
                - No answer choice should appear in more than one answer group
                - If all MC options have feedbacks, do not ask for
                a "Default Feedback"

            - ItemSelectionInput
                - Min number of selections should be no greater than max num
                - There should be enough choices to have max num of selections
                - All items should be unique and non-empty
                - None of the answer groups should be the same
                - `==` should have between min and max number of selections

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for key, value in states_dict.items():
            selected_equals_choices = []
            choice_prev_selected = False
            mc_interaction_invalid_values = []
            item_selec_interaction_values = []

            answer_groups = value.interaction.answer_groups
            for answer_group in answer_groups:
                answer_group_index = str(
                    answer_groups.index(answer_group))
                if value.interaction.id == 'MultipleChoiceInput':
                    # Validates if the rule is already present.
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
                                    'rule - {rule}, answer group '.format(
                                        rule=rule_spec_index) +
                                    '- {ans_group} is already present.'.format(
                                        ans_group=answer_group_index))

                # Validates if value < min or > max of rule type equals.
                if value.interaction.id == 'ItemSelectionInput':
                    choices = (
                    value.interaction.customization_args['choices'].value)
                    min_value = (
                        value.interaction.customization_args
                        ['minAllowableSelectionCount'].value)
                    max_value = (
                        value.interaction.customization_args
                        ['maxAllowableSelectionCount'].value)
                    for rule_spec in answer_group.rule_specs:
                        rule_spec_index = str(
                            answer_group.rule_specs.index(rule_spec))
                        if rule_spec.rule_type == 'Equals':
                            if (len(rule_spec.inputs['x']) < min_value or
                                len(rule_spec.inputs['x']) > max_value):
                                item_selec_interaction_values.append(
                                    'Selected choices of rule {rule} '.format(
                                        rule=rule_spec_index) +
                                    'of answer group {ans_group} '.format(
                                        ans_group=answer_group_index) +
                                    'either less than min_selection_value ' +
                                    'or greter than max_selection_value.')

            if value.interaction.id == 'MultipleChoiceInput':
                choices = (
                    value.interaction.customization_args['choices'].value)
                # Validates if the choices are less than 4.
                if len(choices) < 4:
                    mc_interaction_invalid_values.append(
                        'There should be atleast 4 choices'
                        + ' found ' + str(len(choices)))
                # Validates if the choice is empty or duplicate.
                seen_choices = []
                choice = None
                choice_empty = False
                choice_duplicate = False
                for choice in choices:
                    if choice.html == '<p></p>':
                        choice_empty = True
                    if choice.html in seen_choices:
                        choice_duplicate = True
                    seen_choices.append(choice.html)
                if choice_empty and choice is not None:
                    mc_interaction_invalid_values.append(
                        'There should not be any empty' +
                        ' choices')
                if choice_duplicate and choice is not None:
                    mc_interaction_invalid_values.append(
                        'There should not be any duplicate' +
                        ' choices')
                # Validates if all have feedback and still have deflt outcome.
                if (len(choices) == len(value.interaction.answer_groups)
                    and value.interaction.default_outcome is not None):
                    mc_interaction_invalid_values.append(
                        'All choices have feedback'
                        + ' and still has default outcome')

            if value.interaction.id == 'ItemSelectionInput':
                choices = (
                    value.interaction.customization_args['choices'].value)
                min_value = (
                    value.interaction.customization_args
                    ['minAllowableSelectionCount'].value)
                max_value = (
                    value.interaction.customization_args
                    ['maxAllowableSelectionCount'].value)
                # Validates if the min > max value.
                if min_value > max_value:
                    item_selec_interaction_values.append(
                        'Min value which is {min_value} '.format(
                            min_value=str(min_value)) +
                        'is greater than max value ' +
                        'which is {max_value}'.format(
                            max_value=str(max_value)))
                if len(choices) < max_value:
                    item_selec_interaction_values.append(
                        'Number of choices which is {choices} '.format(
                            choices=str(len(choices))) +
                        'is lesser than the ' +
                        'max value selection which is {max_value}'.format(
                            max_value=str(max_value)))
                # Validates if the choice is empty or duplicate.
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
                        'There should not be any empty' +
                        ' choices')
                if choice_duplicate:
                    item_selec_interaction_values.append(
                        'There should not be any duplicate' +
                        ' choices')

            states_with_values.append(
                {'state_name': key,
                'mc_interaction_invalid_values': mc_interaction_invalid_values,
                'item_selec_interaction_values': item_selec_interaction_values
                }
            )
        return states_with_values

    @staticmethod
    def filter_invalid_cont_end_drag_drop_interactions(
        states_dict: dict[str, state_domain.State]
    ) -> list[dict[str, list]]:
        """Returns the errored state interaction values for

            - DragAndDropSortInput
                - All inputs should be non-empty, unique
                - There should be at least 2 items
                - Multiple items can be in the same place iff the
                setting is turned on
                - `== +/- 1` should never be an option if the "multiple
                items in same place" option is turned off
                - for `a < b`, `a` should not be the same as `b`

            - EndExploration
                - Should not have a default outcome or any answer groups
                - Should be at most 3 recommended explorations

            - Continue
                - Text should be non-empty and have a max-length of 20
                - Should only have a default outcome (and no answer groups)
                associated with it

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

            answer_groups = value.interaction.answer_groups
            for answer_group in answer_groups:
                answer_group_index = str(answer_groups.index(answer_group))
                # Validates various value of DragAndDropSortInput interaction.
                if value.interaction.id == 'DragAndDropSortInput':
                    multi_item_value = (
                        value.interaction.customization_args
                        ['allowMultipleItemsInSamePosition'].value)
                    if not multi_item_value:
                        for rule_spec in answer_group.rule_specs:
                            rule_spec_index = str(answer_group.rule_specs.index(
                                rule_spec))
                            # Validates if multi value at same place.
                            for ele in rule_spec.inputs['x']:
                                if len(ele) > 1:
                                    drag_drop_interaction_values.append(
                                        'The rule {rule} '.format(
                                            rule=rule_spec_index) +
                                        'of answer group {ans_group} '.format(
                                            ans_group=answer_group_index) +
                                        'have multiple items at same place ' +
                                        'when multiple items in same ' +
                                        'position settings is turned off.')

                            # Validates OneItemIncPos present if multi set on.
                            if (rule_spec.rule_type ==
                            'IsEqualToOrderingWithOneItemAtIncorrectPosition'):
                                drag_drop_interaction_values.append(
                                    'The rule {rule} '.format(
                                        rule=rule_spec_index) +
                                    'of answer group {ans_group} '.format(
                                        ans_group=answer_group_index) +
                                    'having rule type - IsEqualToOrderingWith'
                                    + 'OneItemAtIncorrectPosition should not '
                                    + 'be there when the ' +
                                    'multiple items in same position ' +
                                    'setting is turned off.')

                            # Validates if both values are same of rule XBefY.
                            if (rule_spec.rule_type ==
                            'HasElementXBeforeElementY'):
                                if (rule_spec.inputs['x'] ==
                                rule_spec.inputs['y']):
                                    drag_drop_interaction_values.append(
                                        'The rule {rule} '.format(
                                            rule=rule_spec_index) +
                                        'of answer group {ans_group} '.format(
                                            ans_group=answer_group_index) +
                                        'the value 1 and value 2 cannot be ' +
                                        'same when rule type is ' +
                                        'HasElementXBeforeElementY')

            # Validates for EndExploration interaction.
            if value.interaction.id == 'EndExploration':
                # Validates if default value is present.
                if value.interaction.default_outcome is not None:
                    end_interaction_invalid_values.append(
                        'There should be no default' +
                        ' value present in the end exploration interaction.'
                    )

                # Validates if answer group is present.
                if len(value.interaction.answer_groups) > 0:
                    end_interaction_invalid_values.append(
                        'There should be no answer'
                        + ' groups present in the end exploration interaction.'
                    )

                recc_exp_ids = (
                    value.interaction.customization_args
                    ['recommendedExplorationIds'].value)
                # Validates if the recc exp ids more than 3.
                if len(recc_exp_ids) > 3:
                    end_interaction_invalid_values.append(
                        'Total number of recommended ' +
                        'explorations should not be more than 3, found ' +
                        '{rec_len}.'.format(rec_len=str(len(recc_exp_ids)))
                    )

            # Validates for Continue interaction.
            if value.interaction.id == 'Continue':
                text_value = (
                    value.interaction.customization_args
                    ['buttonText'].value.unicode_str)
                # Validates if value is empty or len > 20.
                if text_value == '' or len(text_value) > 20:
                    continue_interaction_invalid_values.append(
                        'The text value is invalid, either'
                        + ' it is empty or the character length is more'
                        + ' than 20, the value is {tex_value}'.format(
                            tex_value=str(text_value))
                    )

            if value.interaction.id == 'DragAndDropSortInput':
                choices = (
                    value.interaction.customization_args['choices'].value)
                # Validates that atleast 2 choices should be present.
                if len(choices) < 2:
                    drag_drop_interaction_values.append(
                        'Atleast 2 choices should be there')
                # Validates if the choice is empty or duplicate.
                seen_choices = []
                choice = None
                choice_empty = False
                choice_duplicate = False
                for choice in choices:
                    if choice.html == '<p></p>':
                        choice_empty = True
                    if choice.html in seen_choices:
                        choice_duplicate = True
                    seen_choices.append(choice.html)
                if choice_empty and choice is not None:
                    drag_drop_interaction_values.append(
                        'There should not be any empty' +
                        ' choices')
                if choice_duplicate and choice is not None:
                    drag_drop_interaction_values.append(
                        'There should not be any duplicate' +
                        ' choices')

            states_with_values.append(
                {'state_name': key,
                'end_interaction_invalid_values':
                end_interaction_invalid_values,
                'continue_interaction_invalid_values':
                continue_interaction_invalid_values,
                'drag_drop_interaction_values': drag_drop_interaction_values
                }
            )
        return states_with_values

    @staticmethod
    def filter_invalid_state_values(
        states_dict: dict[str, state_domain.State]
    ) -> list[dict[str, list]]:
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
                # Validates if tagged_skill_misconception_id not None.
                if answer_group.tagged_skill_misconception_id is not None:
                    tagged_skill_misconception_ids.append(
                        'The tagged_skill_misconception_id ' +
                        f'of answer group {answer_group_index} ' +
                        'is not None.')

                # Validates if lab_as_cor is True but dest is state itself.
                if (answer_group.outcome.dest == key
                and answer_group.outcome.labelled_as_correct is True):
                    wrong_labelled_as_correct_values.append(
                        'The value of labelled_as_correct ' +
                        'of answer group {ans_group} '.format(
                            ans_group=answer_group_index) +
                        'is True but the destination ' +
                        'is the state itself.')

                # Validates if no rule spec is present.
                if len(answer_group.rule_specs) == 0:
                    not_single_rule_spec.append(
                        'There is no rule present ' +
                        'in answer group {ans_group}'.format(
                            ans_group=answer_group_index) +
                        ', atleast one is required.')

                # Validates if refresher_exploration_id is not None.
                if answer_group.outcome.refresher_exploration_id is not None:
                    invalid_refresher_exploration_id.append(
                        'The refresher_exploration_id ' +
                        'of answer group {ans_group} '.format(
                            ans_group=answer_group_index) +
                        'is not None.')

                # Validates if the outcome dest is not valid.
                if answer_group.outcome.dest not in states_list:
                    invalid_destinations.append(
                        'The destination {dest} '.format(
                            dest=str(answer_group.outcome.dest)) +
                        'of answer group {ans_group} '.format(
                            ans_group=answer_group_index) +
                        'is not valid.')

            # Validates if dest of defalut outcome is not valid.
            if value.interaction.default_outcome is not None:
                if value.interaction.default_outcome.dest not in states_list:
                    invalid_default_outcome_dest.append(
                        'The destination of default outcome ' +
                        'is not valid, the value is {dest}'.format(
                            dest=str(value.interaction.default_outcome.dest))
                    )

                def_outcome_ref_exp_id = (
                    value.interaction.default_outcome.refresher_exploration_id)
                if def_outcome_ref_exp_id is not None:
                    invalid_refresher_exploration_id.append(
                        'The refresher_exploration_id '
                        + 'of default outcome is not None.')

            states_with_values.append(
                {'state_name': key,
                'tagged_skill_misconception_ids':
                tagged_skill_misconception_ids,
                'wrong_labelled_as_correct_values':
                wrong_labelled_as_correct_values,
                'not_single_rule_spec': not_single_rule_spec,
                'invalid_refresher_exploration_id':
                invalid_refresher_exploration_id,
                'invalid_destinations': invalid_destinations,
                'invalid_default_outcome_dest': invalid_default_outcome_dest,
                }
            )
        return states_with_values

    @staticmethod
    def remove_empty_values(
        errored_values: list[dict[str, list]]
    ) -> list[dict[str, list]]:
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
                   f'The id of exp is {exp_id}, ' +
                   f'created on {exp_created_on}, and the state' +
                   f' RTE erroneous data are {exp_states_rte_errors}'
                ))
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
            | 'Remove empty values from errored state interactions' >>
            beam.MapTuple(
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
                   f'The id of exp is {exp_id}, ' +
                   f'created on {exp_created_on}, and the state fraction,' +
                   ' numeric and number with units interaction erroneous ' +
                   f'data are {exp_states_interaction_errors}'
                ))
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
                   f'The id of exp is {exp_id}, ' +
                   f'created on {exp_created_on}, and the state multiple ' +
                   'choice and item selection interactions ' +
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
                   f'The id of exp is {exp_id}, ' +
                   f'created on {exp_created_on}, and the state continue, ' +
                   'end and drag and drop interactions ' +
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
                   f'The id of exp is {exp_id}, ' +
                   f'created on {exp_created_on}, and the state' +
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
