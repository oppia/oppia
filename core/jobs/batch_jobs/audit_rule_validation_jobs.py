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

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

datastore_services = models.Registry.import_datastore_services()


(exp_models, opportunity_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.opportunity])


class ExpAuditRuleChecksJob(base_jobs.JobBase):
    """Job that filters out the explorations which contains only one answer
    group and one rule spec which is invalid according to our validation checks
    , removing them will result in the disconnected state
    """

    @staticmethod
    def _filter_invalid_drag_ans_group(answer_group, multi_item_value):
        """Helper function to check if the answer group is valid or not.
        It will check if the number of invalid rules are equal to the
        number of rules present inside the answer group, which is if
        all the rules inside the answer group are invalid

        Args:
            answer_group: state_domain.AnswerGroup. The answer group.
            multi_item_value: bool. If multiple items at same place are
                allowed or not

        Returns:
            bool. Returns True if number of invalid rules are equal to the
            number of rules inside the answer group.
        """
        invalid_rules = []
        for rule_spec in answer_group.rule_specs:
            if (
                rule_spec.rule_type == 'HasElementXBeforeElementY' and
                rule_spec.inputs['x'] == rule_spec.inputs['y']
            ):
                invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsEqualToOrdering':
                if (
                    len(rule_spec.inputs['x']) <= 0
                ):
                    invalid_rules.append(rule_spec)

            if multi_item_value:
                continue
            for ele in rule_spec.inputs['x']:
                if (
                    len(ele) > 1
                ):
                    invalid_rules.append(rule_spec)

            if (
                rule_spec.rule_type ==
                'IsEqualToOrderingWithOneItemAtIncorrectPosition'
            ):
                invalid_rules.append(rule_spec)

        return len(invalid_rules) == len(answer_group.rule_specs)

    @staticmethod
    def invalid_drag_drop_interactions(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, str]]:
        """DragAndDropInput interaction contains some invalid rules
        which we plan to remove. Need to check if all the rules inside
        the answer group is invalid and after removing it should not
        result in disconnection of current state to any other state.
        We will perform this by checking the number of invalid answer
        groups and the number of answer groups having destination other than
        try again are equal then we will store the state name and ans group

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.
            exp_lang_code: str. The language code of the exploration.

        Returns:
            invalid_states: List[Dict[str, str]]. List of invalid states with
            the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            multi_item_value = (
                state.interaction.customization_args
                ['allowMultipleItemsInSamePosition'].value
            )
            answer_groups = state.interaction.answer_groups
            invalid_ans_group_count = 0
            valid_dest_ans_group_count = 0
            invalid_ans_groups = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                if answer_group.outcome.dest == state_name:
                    continue
                valid_dest_ans_group_count += 1
                can_delete_ans_group = (
                    ExpAuditRuleChecksJob._filter_invalid_drag_ans_group(
                        answer_group, multi_item_value)
                )
                if can_delete_ans_group:
                    invalid_ans_group_count += 1
                    invalid_ans_groups.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        "ans_group_idx": invalid_ans_groups
                    }
                )

        return invalid_states

    @staticmethod
    def continue_interac_text_value_language(
        states_dict: Dict[str, state_domain.State],
        exp_lang_code: str
    ) -> List[str]:
        """Continue interaction having text value should not exceed 20,
        if it does we plan to set the default value. This function returns
        the language codes of the errored states

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.
            exp_lang_code: str. The language code of the exploration.

        Returns:
            errored_language_codes: List[str]. The list of language codes.
        """
        errored_language_codes = []

        for state in states_dict.values():
            if state.interaction.id != 'Continue':
                continue
            text_value = (
                state.interaction.customization_args
                ['buttonText'].value.unicode_str
            )
            if (
                len(text_value) > 20 and
                exp_lang_code not in errored_language_codes
            ):
                errored_language_codes.append(exp_lang_code)
        return errored_language_codes

    @staticmethod
    def item_selec_equals_value_between_min_max_value(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, str]]:
        """ItemSelection interaction having rule type `Equals` should
        have value between the minimum allowed selection and maximum
        allowed selection if it is not we need to remove the rule
        and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[Dict[str, str]]. List of invalid
            states with the invalid answer groups.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            answer_groups = state.interaction.answer_groups
            if state.interaction.id != 'ItemSelectionInput':
                continue
            min_value = (
                state.interaction.customization_args
                ['minAllowableSelectionCount'].value)
            max_value = (
                state.interaction.customization_args
                ['maxAllowableSelectionCount'].value)
            for ans_group_idx, answer_group in enumerate(answer_groups):
                if answer_group.outcome.dest == state_name:
                    continue
                invalid_rules = []
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'Equals':
                        if (
                            len(rule_spec.inputs['x']) < min_value or
                            len(rule_spec.inputs['x']) > max_value
                        ):
                            invalid_rules.append(rule_spec)
                if len(invalid_rules) == len(answer_group.rule_specs):
                    states_with_errored_values.append(
                        {
                            'state_name': state_name,
                            'ans_group': ans_group_idx
                        }
                    )
        return states_with_errored_values

    @staticmethod
    def _filter_invalid_numeric_ans_group(answer_group):
        """Helper function to check if the answer group is valid or not.
        It will check if the number of invalid rules are equal to the
        number of rules present inside the answer group, which is if
        all the rules inside the answer group are invalid

        Args:
            answer_group: state_domain.AnswerGroup. The answer group.
            multi_item_value: bool. If multiple items at same place are
                allowed or not

        Returns:
            bool. Returns True if number of invalid rules are equal to the
            number of rules inside the answer group.
        """
        invalid_rules = []
        for rule_spec in answer_group.rule_specs:
            if rule_spec.rule_type == 'IsLessThanOrEqualTo':
                try:
                    float(rule_spec.inputs['x'])
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsGreaterThanOrEqualTo':
                try:
                    float(rule_spec.inputs['x'])
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsLessThan':
                try:
                    float(rule_spec.inputs['x'])
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'IsLessThan':
                try:
                    float(rule_spec.inputs['x'])
                except Exception:
                    invalid_rules.append(rule_spec)

            if rule_spec.rule_type == 'Equals':
                try:
                    float(rule_spec.inputs['x'])
                except Exception:
                    invalid_rules.append(rule_spec)

        return len(invalid_rules) == len(answer_group.rule_specs)

    @staticmethod
    def numeric_input_invalid_values(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
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
            invalid_states: List[Dict[str, str]]. List of invalid states with
            the invalid answer groups.
        """
        invalid_states = []
        for state_name, state in states_dict.items():
            if state.interaction.id != 'NumericInput':
                continue
            answer_groups = state.interaction.answer_groups
            invalid_ans_group_count = 0
            valid_dest_ans_group_count = 0
            invalid_ans_groups = []
            for ans_group_idx, answer_group in enumerate(answer_groups):
                if answer_group.outcome.dest == state_name:
                    continue
                valid_dest_ans_group_count += 1
                can_delete_ans_group = (
                    ExpAuditRuleChecksJob._filter_invalid_numeric_ans_group(
                        answer_group)
                )

                if can_delete_ans_group:
                    invalid_ans_group_count += 1
                    invalid_ans_groups.append(ans_group_idx)

            if (
                invalid_ans_group_count == valid_dest_ans_group_count and
                invalid_ans_group_count != 0 and
                valid_dest_ans_group_count != 0
            ):
                invalid_states.append(
                    {
                        'state_name': state_name,
                        "ans_group_idx": invalid_ans_groups
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
        all_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
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
            self.pipeline
            | 'Get all ExplorationModels again' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
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

        # Curated exp code is taken from the PR #15298.
        curated_explorations = (
            (exps_with_id_and_models, all_exp_opportunities)
            | 'Combine the PCollections s' >> beam.CoGroupByKey()
            | 'Drop off the exp ids' >>
                beam.Values() # pylint: disable=no-value-for-parameter
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
                       f'drag drop rule states are {exp_drag_errors}'
                    )
                )
            )
        )

        # Continue Text should be non-empty and have a max-length of 20.
        filter_invalid_continue_text_values = (
            all_explorations
            | 'Get continue text language code values' >> beam.Map(
                lambda exp: (
                    exp.id, self.continue_interac_text_value_language(
                        exp.states, exp.language_code),
                    exp.created_on.date()
                )
            )
            | 'Remove empty values of continue interaction' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_continue_text_language_code_values = (
            filter_invalid_continue_text_values
            | 'Show info for continue invalid values' >> beam.MapTuple(
                lambda exp_id, cont_lang, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the '
                       f'invalid continue interaction language codes '
                       f'are {cont_lang}'
                    )
                )
            )
        )

        # ItemSelection == should have b/w min and max number of selections.
        filter_invalid_item_selec_equals_value_between_min_max = (
            combine_exp_ids_and_states
            | 'Get invalid item selection equals value between min and max'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.item_selec_equals_value_between_min_max_value(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values item selec equals value between min and max'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_item_selec_equals_value_between_min_max = (
            filter_invalid_item_selec_equals_value_between_min_max
            | 'Report count for invalid item selec values' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID ITEM SELECTION')
            )
        )

        report_invalid_item_selec_equals_value_between_min_max = (
            filter_invalid_item_selec_equals_value_between_min_max
            | 'Show info for item selec equals value' >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'item selection states are {exp_item_errors}'
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
                       f'numeric input rules '
                       f'states are {exp_numeric_errors}'
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

        return (
            (
                report_count_invalid_drag_drop_rules,
                report_invalid_drag_drop_rules,

                report_continue_text_language_code_values,

                report_count_invalid_item_selec_equals_value_between_min_max,
                report_invalid_item_selec_equals_value_between_min_max,

                report_count_invalid_numeric_input_values,
                report_invalid_numeric_input_values,

                report_count_invalid_rte_image_alt_value,
                report_invalid_rte_image_alt_value
            )
            | 'Combine results' >> beam.Flatten()
        )
