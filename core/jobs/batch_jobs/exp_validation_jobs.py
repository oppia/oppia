# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Validation Jobs for exploration models"""

from __future__ import annotations
from math import gcd

from core.domain import exp_fetchers
from core.domain.html_cleaner import get_rte_components
from core.domain.state_domain import State
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models
from core.jobs.transforms import job_result_transforms

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

datastore_services = models.Registry.import_datastore_services()

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class ExpStateValidationJob(base_jobs.JobBase):
    """Job that tests the general state, rte and interaction validation"""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        total_explorations_with_ids = (
            total_explorations
            | 'Map with id' >> beam.Map(
                lambda exp: exp.id)
        )

        total_explorations_list = beam.pvalue.AsIter(
            total_explorations_with_ids)

        combne_exp_ids_and_states = (
            total_explorations
            | 'Combine exp id and states' >> beam.Map(
                lambda exp: (exp.id, exp.states))
        )

        invalid_exps_with_errored_state_rte_values = (
            combne_exp_ids_and_states
            | 'Get invalid state rte values' >> beam.Map(
                lambda objects: (
                    objects[0],
                    self.filter_invalid_state_rte_values(objects[1])))
            | 'Remove empty values for rte' >> beam.Map(
                lambda objects: (
                    objects[0], self.remove_empty_values(objects[1])))
        )

        report_number_of_exps_queried = (
            invalid_exps_with_errored_state_rte_values
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS'))
        )

        report_invalid_state_rte_values = (
            invalid_exps_with_errored_state_rte_values
            | 'Show info for rte' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {objects[0]}, and the state RTE ' +
                   f'erroneous data are {objects[1]}'
                )
            )
        )

        invalid_exps_with_errored_state_interaction_values = (
            combne_exp_ids_and_states
            | 'Get invalid state interaction values' >> beam.Map(
                lambda objects: (
                    objects[0],
                    self.filter_invalid_state_interaction_values(
                        objects[1], total_explorations_list)))
            | 'Remove empty values for state interaction' >> beam.Map(
                lambda objects: (
                    objects[0], self.remove_empty_values(objects[1])))
        )

        report_invalid_state_interaction_values = (
            invalid_exps_with_errored_state_interaction_values
            | 'Show info for state interaction' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {objects[0]}, and the state interaction'
                   + f' erroneous data are {objects[1]}'
                )
            )
        )

        invalid_exps_with_errored_states_values = (
            combne_exp_ids_and_states
            | 'Get invalid state values' >> beam.Map(
                lambda objects: (
                    objects[0],
                    self.filter_invalid_state_values(objects[1])))
            | 'Remove empty values for state values' >> beam.Map(
                lambda objects: (
                    objects[0], self.remove_empty_values(objects[1])))
        )

        report_invalid_state_values = (
            invalid_exps_with_errored_states_values
            | 'Show info for state values' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                   f'The id of exp is {objects[0]}, and the state'
                   + f' erroneous data are {objects[1]}'
                )
            )
        )

        return (
            (
                report_number_of_exps_queried,
                report_invalid_state_rte_values,
                report_invalid_state_interaction_values,
                report_invalid_state_values
            )
            | 'Combine results' >> beam.Flatten()
        )

    def filter_invalid_state_rte_values(
        self, states_dict: dict[str, State]) -> list[dict]:
        """Returns the errored state RTE values.

        Args:
            states_dict: dict[str, State]. The dictionary containing
            state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        rte_components_errors = []
        for key, value in states_dict.items():
            rte_components = get_rte_components(value.content.html)
            if len(rte_components) > 0:
                for rte_component in rte_components:
                    if rte_component['id'] == 'oppia-noninteractive-image':
                        if len(rte_component['customization_args']
                        ['caption-with-value']) > 160:
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Image tag caption value"
                                + " is greater than 160.")
                        if len(rte_component['customization_args']
                        ['alt-with-value']) < 5:
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Image tag alt value" + " is less than 5.")
                        if (rte_component['customization_args']
                        ['filepath-with-value'][-3:] != 'svg'):
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Image tag filepath value" +
                                " does not have svg extension")

                    elif rte_component['id'] == 'oppia-noninteractive-math':
                        svg_filename = (rte_component['customization_args'][
                            'math_content-with-value']['svg_filename'])
                        if svg_filename[-3:] != 'svg':
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Math tag svg_filename value"
                                + " has a non svg extension.")

                    elif (rte_component['id'] ==
                        'oppia-noninteractive-skillreview'):
                        if (rte_component['customization_args']
                        ['text-with-value']) == '':
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Skill review tag text value" + " is empty.")

                    elif rte_component['id'] == 'oppia-noninteractive-video':
                        start_value = (
                            rte_component['customization_args']
                            ['start-with-value'])
                        end_value = (
                            rte_component['customization_args']
                            ['end-with-value'])

                        if int(start_value) > int(end_value):
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Video tag start value" + " is greater than"
                                " end value.")

                    elif rte_component['id'] == 'oppia-noninteractive-link':
                        if (rte_component['customization_args']
                        ['text-with-value']) == '':
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Link tag text value" + " is empty.")

                        elif (['customization_args']['url-with-value'][:5]
                        != 'https'):
                            rte_components_errors.append(
                                "State - " + str(key) +
                                " Link tag url value" + " does not start "
                                + "with https.")

            states_with_values.append(
                {"state_name": key,
                "rte_components_errors": rte_components_errors}
            )
        return states_with_values

    def filter_invalid_state_interaction_values(
            self, states_dict: dict[str, State],
            exp_ids: list[str]) -> list[dict]:
        """Returns the errored state interaction values.

        Args:
            states_dict: dict[str, State]. The dictionary containing
            state name as key and State object as value.

            exp_ids: list[str]. The list of exploration ids.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        answer_groups_list = []
        states_with_values = []
        end_interaction_invalid_values = []
        continue_interaction_invalid_values = []
        numeric_input_interaction_values = []
        fraction_interaction_invalid_values = []
        number_with_units_errors = []
        mc_interaction_invalid_values = []
        item_selec_interaction_values = []
        drag_drop_interaction_values = []

        for key, value in states_dict.items():
            answer_groups = value.interaction.answer_groups
            for answer_group in answer_groups:
                if value.interaction.id == "FractionInput":
                    inputs_with_whole_nums = ["HasDenominatorEqualTo",
                    "HasNumeratorEqualTo", "HasIntegerPartEqualTo",
                    "HasNoFractionalPart"]
                    for rule_spec in answer_group.rule_specs:
                        if rule_spec.rule_type not in inputs_with_whole_nums:
                            num = rule_spec.inputs['f']['numerator']
                            den = rule_spec.inputs['f']['denominator']
                            whole = rule_spec.inputs['f']['wholeNumber']

                            if den == 0:
                                fraction_interaction_invalid_values.append(
                                    "The rule " +
                                    str(answer_group.rule_specs.index(
                                    rule_spec)) + " of answer group " +
                                    str(answer_groups.index(answer_group)) +
                                    " has denominator equals to zero.")

                            if (value.interaction.customization_args
                            ['requireSimplestForm'].value) == True:
                                if whole == 0:
                                    d = gcd(num, den)
                                    val_num = num // d
                                    val_den = den // d
                                if val_num != num and val_den != den:
                                    fraction_interaction_invalid_values.append(
                                        "The rule " +
                                        str(answer_group.rule_specs.index(
                                        rule_spec)) + " of answer group " +
                                        str(answer_groups.index(
                                        answer_group)) + " do not have value "+
                                        "in simple form")

                            if (value.interaction.customization_args
                            ['allowImproperFraction'].value) == False:
                                if den <= num:
                                    fraction_interaction_invalid_values.append(
                                        "The rule " +
                                        str(answer_group.rule_specs.index(
                                        rule_spec)) + " of answer group " +
                                        str(answer_groups.index(
                                        answer_group)) + " do not have " +
                                        "value in proper fraction"
                                    )

                            if (value.interaction.customization_args
                            ['allowNonzeroIntegerPart'].value) == False:
                                if whole != 0:
                                    fraction_interaction_invalid_values.append(
                                        "The rule " +
                                        str(answer_group.rule_specs.index(
                                        rule_spec)) + " of answer group " +
                                        str(answer_groups.index(
                                        answer_group)) + " has non zero " +
                                        "integer part.")

                        if rule_spec.rule_type == "HasDenominatorEqualTo":
                            if rule_spec.inputs['x'] == 0:
                                fraction_interaction_invalid_values.append(
                                    "The rule " +
                                    str(answer_group.rule_specs.index(
                                    rule_spec)) + " of answer group " +
                                    str(answer_groups.index(
                                    answer_group)) + " has denominator " +
                                    "equals to zero.")

                if value.interaction.id == "NumericInput":
                    for rule_spec in answer_group.rule_specs:
                        if rule_spec.rule_type == 'IsWithinTolerance':
                            if rule_spec.inputs['tol'] < 0:
                                numeric_input_interaction_values.append(
                                    "The rule " +
                                    str(answer_group.rule_specs.index(
                                    rule_spec))+ " of answer group " + str(
                                    answer_groups.index(answer_group))
                                    + " having rule type IsWithinTolerance" +
                                    " have tol value less than zero.")

                        if rule_spec.rule_type == 'IsInclusivelyBetween':
                            if rule_spec.inputs['a'] > rule_spec.inputs['b']:
                                numeric_input_interaction_values.append(
                                    "The rule " +
                                    str(answer_group.rule_specs.index(
                                    rule_spec))+ " of answer group " + str(
                                    answer_groups.index(answer_group))
                                    + " having rule type" +
                                    " IsInclusivelyBetween" +
                                    " have a value greater than b value")

                if value.interaction.id == "NumberWithUnits":
                    number_with_units_rules = []
                    for rule_spec in answer_group.rule_specs:
                        if rule_spec.rule_type == "IsEquivalentTo":
                            number_with_units_rules.append(
                                rule_spec.inputs)
                        if rule_spec.rule_type == "IsEqualTo":
                            if rule_spec.inputs in number_with_units_rules:
                                number_with_units_errors.append(
                                    "The rule " +
                                    str(answer_group.rule_specs.index(
                                    rule_spec))+ " of answer group " + str(
                                    answer_groups.index(answer_group))
                                    + " equal to coming after equivalent to "
                                    + "for the same value")

                if value.interaction.id == "MultipleChoiceInput":
                    selected_equals_choices = []
                    choice_prev_selected = False
                    for rule_spec in answer_group.rule_specs:
                        if rule_spec.rule_type == "Equals":
                            if rule_spec.inputs.x in selected_equals_choices:
                                choice_prev_selected = True
                            if not choice_prev_selected:
                                selected_equals_choices.append(
                                    rule_spec.inputs.x)
                            else:
                                mc_interaction_invalid_values.append(
                                    "rule - " + str(
                                    answer_group.rule_specs.index(rule_spec)) +
                                    ', answer group - ' +str(
                                    answer_groups.index(answer_group)) +
                                    " is already present.")

                if value.interaction.id == "ItemSelectionInput":
                    min_value = (
                        value.interaction.customization_args
                        ['minAllowableSelectionCount'].value)
                    max_value = (
                        value.interaction.customization_args
                        ['maxAllowableSelectionCount'].value)
                    if answer_group not in answer_groups_list:
                        answer_groups_list.append(answer_group)
                    else:
                        item_selec_interaction_values.append(
                            ("The " + str(answer_groups.index(
                                answer_group)) + " anser group is duplicate"))
                    for rule_spec in answer_group.rule_specs:
                        if rule_spec.rule_type == "Equals":
                            if (len(rule_spec.inputs.x) < min_value and
                                len(rule_spec.inputs.x) > max_value):
                                item_selec_interaction_values.append(
                                    "Selected choices are " +
                                    "either less than min_selection_value or" +
                                    " greter than max_selection_value.")

                if value.interaction.id == "DragAndDropSortInput":
                    multi_item_value = (
                        value.interaction.customization_args
                        ['allowMultipleItemsInSamePosition'].value)
                    if not multi_item_value:
                        for rule_spec in answer_group.rule_specs:
                            for ele in rule_spec.inputs['x']:
                                if len(ele) > 1:
                                    drag_drop_interaction_values.append(
                                        "The rule " +
                                        + str(answer_group.rule_specs.index(
                                        rule_spec)) + " of answer group " +
                                        str(answer_groups.index(answer_group))+
                                        " have multiple items at same place.")

                            if (rule_spec.rule_type ==
                            "IsEqualToOrderingWithOneItemAtIncorrectPosition"):
                                drag_drop_interaction_values.append(
                                    "The rule " +
                                    + str(answer_group.rule_specs.index(
                                    rule_spec)) + " of answer group " +
                                    str(answer_groups.index(answer_group))+
                                    " should not be there when the " +
                                    "multiple items in same position" +
                                    " setting is turned off.")

                            if (rule_spec.rule_type ==
                            "HasElementXBeforeElementY"):
                                if (rule_spec.inputs['x'] ==
                                rule_spec.inputs['y']):
                                    drag_drop_interaction_values.append(
                                        "The rule " +
                                        + str(answer_group.rule_specs.index(
                                        rule_spec)) + " of answer group " +
                                        str(answer_groups.index(answer_group))+
                                        " The value 1 and value 2 cannot be "
                                        + "same when rule type is " +
                                        "HasElementXBeforeElementY")

            if value.interaction.id == "EndExploration":
                if value.interaction.default_outcome != None:
                    end_interaction_invalid_values.append(
                        "There should be no default" +
                        " value present in the end exploration interaction."
                    )

                if len(value.interaction.answer_groups) > 0:
                    end_interaction_invalid_values.append(
                        "There should be no answer"
                        +" groups present in the end exploration interaction."
                    )

                recc_exp_ids = (
                    value.interaction.customization_args
                    ['recommendedExplorationIds'].value)
                if len(recc_exp_ids) > 3:
                    end_interaction_invalid_values.append(
                        "Total number of recommended "
                        + "explorations should not be more than 3, found "
                        + str(len(recc_exp_ids)) + ".")
                else:
                    errored_exps = []
                    for ele in recc_exp_ids:
                        if ele not in exp_ids:
                            errored_exps.append(ele)
                    if len(errored_exps) > 0:
                        end_interaction_invalid_values.append(
                            "These explorations are not"
                            + " valid " + str(errored_exps))

            if value.interaction.id == "Continue":
                text_value = (
                    value.interaction.customization_args
                    ['buttonText'].value.unicode_str)
                if text_value == "" or len(text_value) > 20:
                    continue_interaction_invalid_values.append(
                        "The text value is invalid, either"
                        + " it is empty or the character length is more"
                        + " than 20, the value is " + str(text_value))

            if value.interaction.id == "MultipleChoiceInput":
                choices = (
                    value.interaction.customization_args['choices'].value)
                if len(choices) < 4:
                    mc_interaction_invalid_values.append(
                        "There should be atleast 4 choices"
                        + " found " + str(len(choices)))
                seen_choices = []
                choice_empty = False
                choice_duplicate = False
                for choice in choices:
                    if choice.html == "<p><p>":
                        choice_empty = True
                    if choice.html in seen_choices:
                        choice_duplicate = True
                    seen_choices.append(choice.html)
                if choice_empty:
                    mc_interaction_invalid_values.append(
                        {"choice_empty": True})
                if choice_duplicate:
                    mc_interaction_invalid_values.append(
                        {"choice_duplicate": True})
                if (len(choices) == len(value.interaction.answer_groups)
                    and value.interaction.default_outcome is not None):
                    mc_interaction_invalid_values.append(
                        "All choices have feedback"
                        + " and still has default outcome")

            if value.interaction.id == "ItemSelectionInput":
                choices = (
                    value.interaction.customization_args['choices'].value)
                min_value = (
                    value.interaction.customization_args
                    ['minAllowableSelectionCount'].value)
                max_value = (
                    value.interaction.customization_args
                    ['maxAllowableSelectionCount'].value)
                if min_value > max_value:
                    item_selec_interaction_values.append(
                        "Min value which is " +
                        str(min_value) + " is greater than max value "
                        + "which is " + str(max_value))
                if len(choices) < max_value:
                    item_selec_interaction_values.append(
                        "Number of choices which is "
                        + str(len(choices)) + " is lesser than the" +
                        " max value selection which is " + str(max_value))
                seen_choices = []
                choice_empty = False
                choice_duplicate = False
                for choice in choices:
                    if choice.html == "<p><p>":
                        choice_empty = True
                    if choice.html in seen_choices:
                        choice_duplicate = True
                    seen_choices.append(choice.html)
                if choice_empty:
                    item_selec_interaction_values.append(
                        "There should not be any empty" +
                        " choices - " + str(choices.index(choice)))
                if choice_duplicate:
                    item_selec_interaction_values.append(
                        "There should not be any duplicate" +
                        " choices - " + str(choices.index(choice)))

            if value.interaction.id == "DragAndDropSortInput":
                choices = (
                    value.interaction.customization_args['choices'].value)
                if len(choices) < 2:
                    drag_drop_interaction_values.append(
                        "Atleast 2 choices should be there")
                seen_choices = []
                choice_empty = False
                choice_duplicate = False
                for choice in choices:
                    if choice.html == "<p><p>":
                        choice_empty = True
                    if choice.html in seen_choices:
                        choice_duplicate = True
                    seen_choices.append(choice.html)
                if choice_empty:
                    drag_drop_interaction_values.append(
                        "There should not be any empty" +
                        " choices - " + str(choices.index(choice)))
                if choice_duplicate:
                    drag_drop_interaction_values.append(
                        "There should not be any duplicate" +
                        " choices - " + str(choices.index(choice)))

            states_with_values.append(
                {"state_name": key,
                "end_interaction_invalid_values":
                end_interaction_invalid_values,
                "continue_interaction_invalid_values":
                continue_interaction_invalid_values,
                "numeric_input_interaction_values":
                numeric_input_interaction_values,
                "fraction_interaction_invalid_values":
                fraction_interaction_invalid_values,
                "mc_interaction_invalid_values": mc_interaction_invalid_values,
                "item_selec_interaction_values": item_selec_interaction_values,
                }
            )
        return states_with_values

    def filter_invalid_state_values(
            self, states_dict: dict[str, State]) -> list[dict]:
        """Returns the errored state values.

        Args:
            states_dict: dict[str, State]. The dictionary containing
            state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []
        states_list = []
        tagged_skill_misconception_ids = []
        wrong_labelled_as_correct_values = []
        not_sinle_rule_spec = []
        invalid_refresher_exploration_id = []
        invalid_destinations = []
        invalid_default_outcome_dest = []

        for key, value in states_dict.items():
            states_list.append(key)

        for key, value in states_dict.items():
            answer_groups = value.interaction.answer_groups
            for answer_group in answer_groups:

                if answer_group.tagged_skill_misconception_id != None:
                    tagged_skill_misconception_ids.append(
                        "The tagged_skill_misconception_id"
                        + " of answer group " +
                        f'{str(answer_groups.index(answer_group))}' +
                        " is not None.")

                if (answer_group.outcome.dest != key
                and answer_group.outcome.labelled_as_correct == True):
                    wrong_labelled_as_correct_values.append(
                        "The value of labelled_as_correct"
                        + " of answer group " + str(answer_groups.index(
                        answer_group)) + " is True but the destination "
                        + "is the state itself.")

                if len(answer_group.rule_specs) == 0:
                    not_sinle_rule_spec.append(
                        "There is no rule present"
                        + "in answer group " + str(answer_groups.index(
                        answer_group)) + ", atleast one is required.")

                if answer_group.outcome.refresher_exploration_id != None:
                    invalid_refresher_exploration_id.append(
                        "The refresher_exploration_id"
                        + "of answer group " + str(answer_groups.index(
                        answer_group)) + " is not None.")

                if answer_group.outcome.dest not in states_list:
                    invalid_destinations.append(
                        "The destination " +
                        str(answer_group.outcome.dest) + " of answer group "
                        + str(answer_groups.index(answer_group)) + " is not "
                        + "valid.")

            if value.interaction.default_outcome is not None:
                if value.interaction.default_outcome.dest not in states_list:
                    invalid_default_outcome_dest.append(
                        "The destination of default outcome"
                        + " is not valid, the value is " + str(
                            value.interaction.default_outcome.dest))

            states_with_values.append(
                {"state_name": key,
                "tagged_skill_misconception_ids":
                tagged_skill_misconception_ids,
                "wrong_labelled_as_correct_values":
                wrong_labelled_as_correct_values,
                "not_sinle_rule_spec": not_sinle_rule_spec,
                "invalid_refresher_exploration_id":
                invalid_refresher_exploration_id,
                "invalid_destinations": invalid_destinations,
                "invalid_default_outcome_dest": invalid_default_outcome_dest,}
            )
        return states_with_values

    def remove_empty_values(self, errored_values):
        """
        """
        for ele in errored_values:
            for key, value in list(ele.items()):
                if len(value) == 0:
                    ele.pop(key)
        return errored_values
