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
from typing import Dict, List, Optional, Tuple

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
    def drag_drop_a_less_than_b_rule(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """DragAndDropInput interaction rule `HasElementXBeforeElementY`
        should not have value `X` equals to `Y`, if it does we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            answer_groups = state.interaction.answer_groups
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if (
                        rule_spec.rule_type ==
                        'HasElementXBeforeElementY'
                    ):
                        if (
                            rule_spec.inputs['x'] == rule_spec.inputs['y']
                        ):
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
        return states_with_errored_values

    @staticmethod
    def drag_drop_multi_item_at_same_place(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """DragAndDropInput interaction `allowMultipleItemsInSamePosition`
        option is false then no rule should contain multiple items at same
        place, if it does we need to remove the rule and for that we check
        if the state contains only one answer group and one rule spec
        because removing that will result in disconnection of the current
        state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            multi_item_value = (
                state.interaction.customization_args
                ['allowMultipleItemsInSamePosition'].value
            )
            answer_groups = state.interaction.answer_groups
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if not multi_item_value:
                        for ele in rule_spec.inputs['x']:
                            if len(ele) > 1:
                                if (
                                    len(answer_group.rule_specs) == 1 and
                                    len(answer_groups) == 1
                                ):
                                    states_with_errored_values.append(
                                        state_name
                                    )
                                    break
        return states_with_errored_values

    @staticmethod
    def drag_drop_one_item_at_incorrect_position(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """DragAndDropInput interaction, `allowMultipleItemsInSamePosition`
        option should be true if we have rule `IsEqualToOrderingWithOne
        ItemAtIncorrectPosition`, if it does we need to remove the rule
        and for that we check if the state contains only one answer group
        and one rule spec because removing that will result in disconnection
        of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            multi_item_value = (
                state.interaction.customization_args
                ['allowMultipleItemsInSamePosition'].value
            )
            answer_groups = state.interaction.answer_groups
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if not multi_item_value:
                        if (
                            rule_spec.rule_type ==
                            'IsEqualToOrderingWithOneItemAtIncorrectPosition'
                        ):
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
                                break
        return states_with_errored_values

    @staticmethod
    def drag_drop_equals_rule_empty_value(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """DragAndDropInput interaction rule `IsEqualToOrdering`
        should not be empty, if it is we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            if state.interaction.id != 'DragAndDropSortInput':
                continue
            answer_groups = state.interaction.answer_groups
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'IsEqualToOrdering':
                        if len(rule_spec.inputs['x']) <= 0:
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
                                break
        return states_with_errored_values

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
            if len(text_value) > 20:
                if exp_lang_code not in errored_language_codes:
                    errored_language_codes.append(exp_lang_code)
        return errored_language_codes

    @staticmethod
    def item_selec_equals_value_between_min_max_value(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """ItemSelection interaction having rule type `Equals` should
        have value between the minimum allowed selection and maximum
        allowed selection if it is not we need to remove the rule
        and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
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
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'Equals':
                        if (
                            len(rule_spec.inputs['x']) < min_value or
                            len(rule_spec.inputs['x']) > max_value
                        ):
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
                                break
        return states_with_errored_values

    @staticmethod
    def numeric_is_less_than_or_equal_rule_value_is_string(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """NumericInput interaction having rule type `IsLessThanOrEqualTo`
        should not contain string values, if it does we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            answer_groups = state.interaction.answer_groups
            if state.interaction.id != 'NumericInput':
                continue
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'IsLessThanOrEqualTo':
                        try:
                            float(rule_spec.inputs['x'])
                        except Exception:
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
        return states_with_errored_values

    @staticmethod
    def numeric_is_greater_than_or_equal_rule_value_is_string(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """NumericInput interaction having rule type `IsGreaterThanOrEqualTo`
        should not contain string values, if it does we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            answer_groups = state.interaction.answer_groups
            if state.interaction.id != 'NumericInput':
                continue
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'IsGreaterThanOrEqualTo':
                        try:
                            float(rule_spec.inputs['x'])
                        except Exception:
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
        return states_with_errored_values

    @staticmethod
    def numeric_is_greater_than_rule_value_is_string(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """NumericInput interaction having rule type `IsGreaterThan`
        should not contain string values, if it does we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            answer_groups = state.interaction.answer_groups
            if state.interaction.id != 'NumericInput':
                continue
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'IsGreaterThan':
                        try:
                            float(rule_spec.inputs['x'])
                        except Exception:
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
        return states_with_errored_values

    @staticmethod
    def numeric_is_less_than_rule_value_is_string(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """NumericInput interaction having rule type `IsLessThan`
        should not contain string values, if it does we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            answer_groups = state.interaction.answer_groups
            if state.interaction.id != 'NumericInput':
                continue
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'IsLessThan':
                        try:
                            float(rule_spec.inputs['x'])
                        except Exception:
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
        return states_with_errored_values

    @staticmethod
    def numeric_equal_rule_value_is_string(
        states_dict: Dict[str, state_domain.State]
    ) -> List[str]:
        """NumericInput interaction having rule type `Equals`
        should not contain string values, if it does we need to remove
        the rule and for that we check if the state contains only one answer
        group and one rule spec because removing that will result in
        disconnection of the current state to the next state

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            states_with_errored_values: List[str]. Errored state names that
            contains one answer group and one rule spec.
        """
        states_with_errored_values = []

        for state_name, state in states_dict.items():
            answer_groups = state.interaction.answer_groups
            if state.interaction.id != 'NumericInput':
                continue
            for answer_group in answer_groups:
                for rule_spec in answer_group.rule_specs:
                    if rule_spec.rule_type == 'Equals':
                        try:
                            float(rule_spec.inputs['x'])
                        except Exception:
                            if (
                                len(answer_group.rule_specs) == 1 and
                                len(answer_groups) == 1
                            ):
                                states_with_errored_values.append(
                                    state_name
                                )
        return states_with_errored_values

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
        model: Tuple[
            exp_models.ExplorationModel,
            opportunity_models.ExplorationOpportunitySummaryModel] |
            exp_models.ExplorationModel
    ) -> None | exp_domain.Exploration:
        """Returns the exploration domain object

        Args:
            model: tuple|exp_models.ExplorationModel. The pair of exp and
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

        # DragAndDrop for a < b, a should not be the same as b.
        filter_invalid_drag_drop_a_less_than_b_rule = (
            combine_exp_ids_and_states
            | 'Get invalid drag drop a < b rule' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.drag_drop_a_less_than_b_rule(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values a < b rule' >> beam.Filter(
                lambda exp: len(exp[1]) > 0)
        )

        report_count_invalid_drag_drop_a_less_than_b_rule = (
            filter_invalid_drag_drop_a_less_than_b_rule
            | 'Report count for invalid drag drop a < b rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID DRAG DROP a < b RULE')
            )
        )

        report_invalid_drag_drop_a_less_than_b_rule = (
            filter_invalid_drag_drop_a_less_than_b_rule
            | 'Show info for drag drop a < b' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'drag drop a < b rule states are {exp_drag_errors}'
                    )
                )
            )
        )

        # DragAndDrop multiple items can be in the same place iff
        # the setting is turned on.
        filter_invalid_drag_drop_multi_item_at_same_place = (
            combine_exp_ids_and_states
            | 'Get invalid drag drop multi item same place' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.drag_drop_multi_item_at_same_place(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values multi item rule' >> beam.Filter(
                lambda exp: len(exp[1]) > 0)
        )

        report_count_invalid_drag_drop_multi_item_at_same_place = (
            filter_invalid_drag_drop_multi_item_at_same_place
            | 'Report count for invalid drag drop multi item rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID DRAG DROP MULTI ITEM RULE')
            )
        )

        report_invalid_drag_drop_multi_item_at_same_place = (
            filter_invalid_drag_drop_multi_item_at_same_place
            | 'Show info for drag drop multi item same place' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'drag drop multi item at same place rule '
                       f'states are {exp_drag_errors}'
                    )
                )
            )
        )

        # DragAndDrop == +/- 1 should never be an option if the
        # "multiple items in same place" option is turned off.
        filter_invalid_drag_drop_one_item_at_incorrect_position = (
            combine_exp_ids_and_states
            | 'Get invalid drag drop one item at incorrect position'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.drag_drop_one_item_at_incorrect_position(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values one item at incorrect position rule'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0)
        )

        report_count_invalid_drag_drop_one_item_at_incorrect_position = (
            filter_invalid_drag_drop_one_item_at_incorrect_position
            | 'Report count for invalid drag drop incorrect by atmost 1' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID DRAG DROP ONE AT '
                    'INCORRECT RULE')
            )
        )

        report_invalid_drag_drop_one_item_at_incorrect_position = (
            filter_invalid_drag_drop_one_item_at_incorrect_position
            | 'Show info for drag drop one item incorrect' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'drag drop one item at incorrect position rule '
                       f'states are {exp_drag_errors}'
                    )
                )
            )
        )

        # DragAndDrop `IsEqualToOrdering` check have empty values.
        filter_invalid_drag_drop_equals_rule_empty_values = (
            combine_exp_ids_and_states
            | 'Get invalid drag drop equals rule empty values'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.drag_drop_equals_rule_empty_value(exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values of equals rule empty values' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_drag_drop_equals_rule_empty_values = (
            filter_invalid_drag_drop_equals_rule_empty_values
            | 'Report count for invalid equals rule empty values rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID DRAG DROP EQUALS RULE EMPTY')
            )
        )

        report_invalid_drag_drop_equals_rule_empty_values = (
            filter_invalid_drag_drop_equals_rule_empty_values
            | 'Show info for drag drop is equal a string' >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'drag drop equals rule have empty values and the '
                       f'states are {exp_drag_errors}'
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

        # NumericInput `IsLessThanOrEqualTo` check contains string value.
        filter_invalid_numeric_less_than_or_equal_rule_value_is_string = (
            combine_exp_ids_and_states
            | 'Get invalid numeric less than or equal rule is string'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_is_less_than_or_equal_rule_value_is_string(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values numeric less than or equal rule is string'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_numeric_less_than_equal_rule_value_string = (
            filter_invalid_numeric_less_than_or_equal_rule_value_is_string
            | 'Report count for invalid numeric less than or equal rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC LESS EQUAL RULE')
            )
        )

        report_invalid_numeric_less_than_equal_rule_value_is_string = (
            filter_invalid_numeric_less_than_or_equal_rule_value_is_string
            | 'Show info for numeric less than or equal' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'numeric input equal or less than rule '
                       f'states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # NumericInput `IsGreaterThanOrEqualTo` check contains string value.
        filter_invalid_numeric_greater_than_or_equal_rule_value_is_string = (
            combine_exp_ids_and_states
            | 'Get invalid numeric greater than or equal rule is string'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_is_greater_than_or_equal_rule_value_is_string(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values numeric greater than or equal rule is string'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_numeric_greater_than_equal_rule_is_string = (
            filter_invalid_numeric_greater_than_or_equal_rule_value_is_string
            | 'Report count for invalid numeric greater than or equal rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC GREATER EQUAL RULE')
            )
        )

        report_invalid_numeric_greater_than_equal_rule_is_string = (
            filter_invalid_numeric_greater_than_or_equal_rule_value_is_string
            | 'Show info for numeric greater than or equal' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'numeric input equal or greater than rule '
                       f'states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # NumericInput `IsLessThan` check contains string value.
        filter_invalid_numeric_less_than_rule_value_is_string = (
            combine_exp_ids_and_states
            | 'Get invalid numeric less than rule is string'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_is_less_than_rule_value_is_string(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values numeric less than rule is string'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_numeric_less_than_rule_value_is_string = (
            filter_invalid_numeric_less_than_rule_value_is_string
            | 'Report count for invalid numeric less than rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC LESS RULE')
            )
        )

        report_invalid_numeric_less_than_rule_value_is_string = (
            filter_invalid_numeric_less_than_rule_value_is_string
            | 'Show info for numeric less than' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'numeric input less than rule '
                       f'states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # NumericInput `IsGreaterThan` check contains string value.
        filter_invalid_numeric_greater_than_rule_value_is_string = (
            combine_exp_ids_and_states
            | 'Get invalid numeric greater than rule is string'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_is_greater_than_rule_value_is_string(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values numeric greater than rule is string'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_numeric_greater_than_rule_value_is_string = (
            filter_invalid_numeric_greater_than_rule_value_is_string
            | 'Report count for invalid numeric greater than rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC GREATER RULE')
            )
        )

        report_invalid_numeric_greater_than_rule_value_is_string = (
            filter_invalid_numeric_greater_than_rule_value_is_string
            | 'Show info for numeric greater than' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'numeric input greater than rule '
                       f'states are {exp_numeric_errors}'
                    )
                )
            )
        )

        # NumericInput `Equals` check contains string value.
        filter_invalid_numeric_equals_rule_value_is_string = (
            combine_exp_ids_and_states
            | 'Get invalid numeric equals rule is string'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.numeric_equal_rule_value_is_string(
                        exp_states),
                    exp_created_on.date()
                )
            )
            | 'Remove empty values numeric equals rule is string'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_count_invalid_numeric_equals_rule_value_is_string = (
            filter_invalid_numeric_equals_rule_value_is_string
            | 'Report count for invalid numeric equals rule' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID NUMERIC EQUALS RULE')
            )
        )

        report_invalid_numeric_equals_rule_value_is_string = (
            filter_invalid_numeric_equals_rule_value_is_string
            | 'Show info for numeric equals' >> beam.MapTuple(
                lambda exp_id, exp_numeric_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'numeric input equals rule '
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
                report_count_invalid_drag_drop_a_less_than_b_rule,
                report_invalid_drag_drop_a_less_than_b_rule,

                report_count_invalid_drag_drop_multi_item_at_same_place,
                report_invalid_drag_drop_multi_item_at_same_place,

                report_count_invalid_drag_drop_one_item_at_incorrect_position,
                report_invalid_drag_drop_one_item_at_incorrect_position,

                report_count_invalid_drag_drop_equals_rule_empty_values,
                report_invalid_drag_drop_equals_rule_empty_values,

                report_continue_text_language_code_values,

                report_count_invalid_item_selec_equals_value_between_min_max,
                report_invalid_item_selec_equals_value_between_min_max,

                report_count_invalid_numeric_less_than_equal_rule_value_string,
                report_invalid_numeric_less_than_equal_rule_value_is_string,

                report_count_invalid_numeric_greater_than_equal_rule_is_string,
                report_invalid_numeric_greater_than_equal_rule_is_string,

                report_count_invalid_numeric_less_than_rule_value_is_string,
                report_invalid_numeric_less_than_rule_value_is_string,

                report_count_invalid_numeric_greater_than_rule_value_is_string,
                report_invalid_numeric_greater_than_rule_value_is_string,

                report_count_invalid_numeric_equals_rule_value_is_string,
                report_invalid_numeric_equals_rule_value_is_string,

                report_count_invalid_rte_image_alt_value,
                report_invalid_rte_image_alt_value
            )
            | 'Combine results' >> beam.Flatten()
        )
