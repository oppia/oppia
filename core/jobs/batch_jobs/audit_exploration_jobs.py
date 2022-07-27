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

"""Validation jobs for checks from #15563 that need further audit."""

from __future__ import annotations

import html
import json

from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import rte_component_registry
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


class ExpStateAuditChecksJob(base_jobs.JobBase):
    """Job that validate some checks from PR #15563 and categorize
    the output in private, published and curated explorations.

    The checks are as follows -
        - refresher_exploration_id should be None for all lessons

        - Text should be non-empty and have a max-length of 20
        (Continue Interaction)

        - == should have between min and max number of selections
        (ItemSelection Interaction)

        - Multiple items can be in the same place iff the setting is
        turned on (DragAndDrop Interaction)

        - == +/- 1 should never be an option if the "multiple items in
        same place" option is turned off (DragAndDrop Interaction)

        - alt should have at least 5 characters (RTE image)

        - Image should have an SVG extension (RTE image)

        - Start value is before end value (RTE video)
    """

    def filter_curated_explorations(
        self,
        model_pair: Tuple[
            Optional[exp_models.ExplorationModel],
            Optional[opportunity_models.ExplorationOpportunitySummaryModel]
        ]
    ) -> bool:
        """Returns whether the exp model is curated or not.

        Args:
            model_pair: tuple. The pair of exp and opportunity models.

        Returns:
            bool. Returns whether the exp model is curated or not.
        """
        return (model_pair[0] is not None) and (model_pair[1] is not None)

    def get_exploration_from_models(
        self,
        model: Tuple[
            exp_models.ExplorationModel,
            opportunity_models.ExplorationOpportunitySummaryModel |
            exp_models.ExplorationModel
        ]
    ) -> exp_domain.Exploration:
        """Returns the exploration domain object.

        Args:
            model: tuple|exp_models.ExplorationModel. The pair of exp and
                opportunity models or just exp model.

        Returns:
            exp_models.ExplorationModel. Returns the exp domain object.
        """
        if isinstance(model, tuple):
            try:
                return exp_fetchers.get_exploration_from_model(model[0])
            except:
                return None
        else:
            try:
                return exp_fetchers.get_exploration_from_model(model)
            except:
                return None

    def convert_into_model_pair(
      self,
      models_list_pair: Tuple[
          List[exp_models.ExplorationModel],
          List[opportunity_models.ExplorationOpportunitySummaryModel]
        ]
    ) -> Tuple[
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
    def filter_invalid_ref_exp_id(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates
            - refresher_exploration_id should be None for all lessons

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in states_dict.items():
            invalid_refresher_exploration_id = []
            answer_groups = state.interaction.answer_groups

            for answer_group in answer_groups:
                answer_group_index = str(answer_groups.index(answer_group))

                # Validates refresher_exploration_id be None for all lessons.
                if answer_group.outcome.refresher_exploration_id is not None:
                    invalid_refresher_exploration_id.append(
                        f'The refresher_exploration_id '
                        f'of answer group {answer_group_index} '
                        f'is not None having value '
                        f'{answer_group.outcome.refresher_exploration_id}'
                    )

            default_outcome = state.interaction.default_outcome
            if default_outcome is not None:
                if default_outcome.refresher_exploration_id is not None:
                    invalid_refresher_exploration_id.append(
                        f'The refresher_exploration_id '
                        f'of default outcome '
                        f'is not None having value '
                        f'{default_outcome.refresher_exploration_id}'
                    )

            if len(invalid_refresher_exploration_id) > 0:
                states_with_values.append(
                    {'state_name': state_name,
                    'invalid_refresher_exploration_id': (
                        invalid_refresher_exploration_id)
                    }
            )

        return states_with_values

    @staticmethod
    def filter_invalid_cont_interac(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates
            - Text should be non-empty and have a max-length of 20

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in states_dict.items():
            continue_interaction_invalid_values = []
            if state.interaction.id == 'Continue':
                text_value = (
                    state.interaction.customization_args
                    ['buttonText'].value.unicode_str)
                if (
                    text_value == '' or len(text_value) > 20 or
                    text_value is None
                ):
                    continue_interaction_invalid_values.append(
                        f'The text value is invalid, either '
                        f'it is empty or the character length is more '
                        f'than 20 or it is None, the value is {str(text_value)}'
                    )

            if len(continue_interaction_invalid_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'continue_interaction_invalid_values': (
                            continue_interaction_invalid_values)
                    }
            )

        return states_with_values

    @staticmethod
    def filter_invalid_item_selec_interac(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates
            - == should have between min and max number of selections

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in states_dict.items():
            item_selec_interaction_values = []
            answer_groups = state.interaction.answer_groups
            if state.interaction.id == 'ItemSelectionInput':
                for answer_group in answer_groups:
                    answer_group_index = str(
                        answer_groups.index(answer_group))
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

            if len(item_selec_interaction_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'item_selec_interaction_values': (
                            item_selec_interaction_values
                        )
                    }
                )

        return states_with_values

    @staticmethod
    def filter_invalid_drag_drop_interac(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates
            - Multiple items can be in the same place iff the setting is
            turned on
            - == +/- 1 should never be an option if the "multiple items in
            same place" option is turned off

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in states_dict.items():
            drag_drop_interaction_values = []
            answer_groups = state.interaction.answer_groups
            if state.interaction.id == 'DragAndDropSortInput':
                for answer_group in answer_groups:
                    answer_group_index = str(
                        answer_groups.index(answer_group))

                    multi_item_value = (
                        state.interaction.customization_args
                        ['allowMultipleItemsInSamePosition'].value)

                    for rule_spec in answer_group.rule_specs:
                        rule_spec_index = str(answer_group.rule_specs.index(
                            rule_spec))
                        # Validates multi items in same place iff setting on.
                        if not multi_item_value:
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
                        if not multi_item_value:
                            if (
                                rule_spec.rule_type == (
                                    'IsEqualToOrderingWithOneItemAt' +
                                    'IncorrectPosition'
                                )
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

            if len(drag_drop_interaction_values) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'drag_drop_interaction_values': (
                            drag_drop_interaction_values
                        )
                    }
                )

        return states_with_values

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
                        continue

                component = {
                    'id': tag_name,
                    'customization_args': customization_args
                }
                components.append(component)
        return components

    @staticmethod
    def filter_invalid_rte_image_tag(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates
            - alt should have at least 5 characters
            - Image should have an SVG extension

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in states_dict.items():
            rte_image_errors = []
            rte_components = ExpStateAuditChecksJob._get_rte_components(
                state.content.html)
            for idx, rte_component in enumerate(rte_components):
                if rte_component['id'] == 'oppia-noninteractive-image':
                    try:
                        alt_with_value = rte_component['customization_args'][
                            'alt-with-value']
                    except Exception:
                        alt_with_value = 'Not found'

                    # Validates if alt value is greater than 5.
                    if (
                        alt_with_value != 'Not found' and
                        len(alt_with_value) < 5
                    ):
                        rte_image_errors.append(
                            f'State - {state_name} Image tag alt value '
                            f'is less than 5 at index {idx} '
                            f'having value {alt_with_value}.'
                        )
                    try:
                        file_with_value = rte_component['customization_args'][
                            'filepath-with-value']
                    except Exception:
                        file_with_value = 'Not found'

                    # Validates filepath extension is svg.
                    if (
                        file_with_value != 'Not found' and
                        len(file_with_value) > 4 and
                        file_with_value[-4:] != '.svg'
                    ):
                        rte_image_errors.append(
                            f'State - {state_name} Image tag filepath value '
                            f'at index {idx} does not have svg extension '
                            f'having value {file_with_value}.'
                        )

            if len(rte_image_errors) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'rte_image_errors': rte_image_errors
                    }
                )
        return states_with_values

    @staticmethod
    def filter_invalid_rte_video_tag(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, List[Dict[str, List[str]]]]]:
        """Returns the errored state values, validates
            - Start value is before end value

        Args:
            states_dict: dict[str, State]. The dictionary containing
                state name as key and State object as value.

        Returns:
            states_with_values: list[dict]. The list of dictionaries
            containing the errored values.
        """
        states_with_values = []

        for state_name, state in states_dict.items():
            rte_video_errors = []
            rte_components = ExpStateAuditChecksJob._get_rte_components(
                state.content.html)
            for idx, rte_component in enumerate(rte_components):
                if rte_component['id'] == 'oppia-noninteractive-video':
                    try:
                        start_value = (
                            rte_component['customization_args']
                            ['start-with-value'])
                        if start_value == '':
                            start_value = '0'
                    except Exception:
                        start_value = 'Not found'

                    try:
                        end_value = (
                            rte_component['customization_args']
                            ['end-with-value'])
                        if end_value == '':
                            end_value = '0'
                    except Exception:
                        end_value = 'Not found'

                    if (
                        (
                            start_value != 'Not found' and
                            end_value != 'Not found'
                        )
                        and float(start_value) > float(end_value)
                    ):
                        rte_video_errors.append(
                            f'State - {state_name} Video tag at '
                            f'index {idx}, start value {float(start_value)} '
                            f'is greater than end value {float(end_value)}'
                        )

            if len(rte_video_errors) > 0:
                states_with_values.append(
                    {
                        'state_name': state_name,
                        'rte_video_errors': rte_video_errors
                    }
                )
        return states_with_values

    def get_exp_summary_from_model(self, exp_summ):
        """Get exploration summary domain object.

        Args:
            exp_summ: exp_models.ExpSummaryModel. The exp summary model.

        Returns:
            exp_domain.ExplorationSummary | None. The exp summary or None.
        """
        try:
            return exp_fetchers.get_exploration_summary_from_model(exp_summ)
        except:
            return None

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

        all_explorations_summaries = (
            self.pipeline
            | 'Get all exp summary models' >> ndb_io.GetModels(
            exp_models.ExpSummaryModel.get_all(include_deleted=False))
            | 'Get exp summary from model' >> beam.Map(
            exp_fetchers.get_exploration_summary_from_model)
            | 'Filter valid exploration summaries' >> beam.Filter(
                lambda exp_summ: exp_summ is not None)
        )

        exp_private_summ_models = (
            all_explorations_summaries
            | 'Get private explorations' >> beam.Filter(
                lambda exp: exp.status == constants.ACTIVITY_STATUS_PRIVATE)
            | 'Map private exp with id' >> beam.Map(
                lambda exp_private: exp_private.id
            )
        )

        exp_public_summ_models = (
            all_explorations_summaries
            | 'Get public explorations' >> beam.Filter(
                lambda exp: exp.status == constants.ACTIVITY_STATUS_PUBLIC)
            | 'Map public exp with id' >> beam.Map(
                lambda exp_public: exp_public.id
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
            all_explorations
            | 'Get all ExplorationOpportunitySummaryModels' >>
                ndb_io.GetModels(
                    opportunity_models.ExplorationOpportunitySummaryModel
                        .get_all(include_deleted=False))
            | 'Create key-value pairs for opportunity models' >> beam.Map(
                lambda exp_opportunity_model: (
                    exp_opportunity_model.id, exp_opportunity_model))
        )

        # PCollection of private explorations.
        exp_private_explorations = (
            all_explorations
            | 'Filter private exps' >> beam.Filter(
                lambda exp, private_exp_list: exp.id in private_exp_list,
                    private_exp_list=beam.pvalue.AsList(
                        exp_private_summ_models)
            )
            | 'Map private exp id, states, created date' >> beam.Map(
                lambda exp: (exp.id, exp.states, exp.created_on)
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
        # PCollection of curated explorations.
        curated_explorations = (
            (exps_with_id_and_models, all_exp_opportunities)
            | 'Combine the PCollections' >> beam.CoGroupByKey()
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

        filter_curated_exps_with_invalid_ref_exp_id = (
            curated_explorations
            | 'Get curated exp with invalid ref exp id' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_ref_exp_id(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for ref exp id' >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_curated_exps_with_invalid_ref_exp_id = (
            filter_curated_exps_with_invalid_ref_exp_id
            | 'Report count of curated exp models with invalid ref exp id' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID REF EXP ID'))
        )

        report_curated_exps_with_invalid_ref_exp_id = (
            filter_curated_exps_with_invalid_ref_exp_id
            | 'Show info for exp having invalid ref exp id' >> beam.MapTuple(
                lambda exp_id, exp_ref_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated exp refresher_exp_id '
                       f'errors are {exp_ref_errors}'
                    )
                )
            )
        )

        filter_private_exps_with_invalid_ref_exp_id = (
            exp_private_explorations
            | 'Get private exp with invalid ref exp id' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_ref_exp_id(exp_states),
                    exp_created_on.date()))
            | 'Remove empty private exps having invalid ref_exp_id'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_private_exps_with_invalid_ref_exp_id = (
            filter_private_exps_with_invalid_ref_exp_id
            | 'Report count of private exp models with invalid ref exp id' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PRIVATE EXPS WITH INVALID REF EXP ID'))
        )

        report_private_exps_with_invalid_ref_exp_id = (
            filter_private_exps_with_invalid_ref_exp_id
            | 'Show info for private exp having invalid ref exp id'
            >> beam.MapTuple(
                lambda exp_id, exp_ref_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of private exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'private exp refresher_exp_id '
                       f'errors are {exp_ref_errors}'
                    )
                )
            )
        )

        filter_public_exps_with_invalid_ref_exp_id = (
            exp_public_explorations
            | 'Get public exp with invalid ref exp id' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_ref_exp_id(exp_states),
                    exp_created_on.date()))
            | 'Remove empty public exps having invalid ref_exp_id'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_public_exps_with_invalid_ref_exp_id = (
            filter_public_exps_with_invalid_ref_exp_id
            | 'Report count of public exp models with invalid ref exp id' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID REF EXP ID'))
        )

        report_public_exps_with_invalid_ref_exp_id = (
            filter_public_exps_with_invalid_ref_exp_id
            | 'Show info for public exp having invalid ref exp id'
            >> beam.MapTuple(
                lambda exp_id, exp_ref_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of public exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public exp refresher_exp_id '
                       f'errors are {exp_ref_errors}'
                    )
                )
            )
        )

        filter_curated_exps_with_invalid_continue_interac = (
            curated_explorations
            | 'Get curated exp with invalid cont interac' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_cont_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for curated exp cont interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_curated_exps_with_invalid_cont_interac = (
            filter_curated_exps_with_invalid_continue_interac
            | 'Report count of curated exp models with invalid cont inter' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID CONT INTERAC'))
        )

        report_curated_exps_with_invalid_continue_interac = (
            filter_curated_exps_with_invalid_continue_interac
            | 'Show info for exp having invalid cont interac' >> beam.MapTuple(
                lambda exp_id, exp_cont_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated exp continue interaction '
                       f'errors are {exp_cont_errors}'
                    )
                )
            )
        )

        filter_private_exps_with_invalid_continue_interac = (
            exp_private_explorations
            | 'Get private exp with invalid cont interac' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_cont_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for private exp cont interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_private_exps_with_invalid_cont_interac = (
            filter_private_exps_with_invalid_continue_interac
            | 'Report count of private exp models with invalid cont inter' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PRIVATE EXPS WITH INVALID CONT INTERAC'))
        )

        report_private_exps_with_invalid_continue_interac = (
            filter_private_exps_with_invalid_continue_interac
            | 'Show info for private exp having invalid cont interac'
            >> beam.MapTuple(
                lambda exp_id, exp_ref_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of private exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'private exp continue interaction '
                       f'errors are {exp_ref_errors}'
                    )
                )
            )
        )

        filter_public_exps_with_invalid_continue_interac = (
            exp_public_explorations
            | 'Get public exp with invalid cont interac' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_cont_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for public exp cont interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_public_exps_with_invalid_cont_interac = (
            filter_public_exps_with_invalid_continue_interac
            | 'Report count of public exp models with invalid cont inter' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID CONT INTERAC'))
        )

        report_public_exps_with_invalid_continue_interac = (
            filter_public_exps_with_invalid_continue_interac
            | 'Show info for public exp having invalid cont interac'
            >> beam.MapTuple(
                lambda exp_id, exp_ref_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of public exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public exp continue interaction '
                       f'errors are {exp_ref_errors}'
                    )
                )
            )
        )

        filter_curated_exps_with_invalid_item_selec_interac = (
            curated_explorations
            | 'Get curated exp with invalid item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_item_selec_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for curated exp item selec interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_curated_exps_with_invalid_item_selec_interac = (
            filter_curated_exps_with_invalid_item_selec_interac
            | 'Report count of curated exp models with invalid item interac'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID ITEM SELEC INTERAC')
            )
        )

        report_curated_exps_with_invalid_item_selec_interac = (
            filter_curated_exps_with_invalid_item_selec_interac
            | 'Show info for exp having invalid item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated exp item selection interaction errors '
                       f'are {exp_item_errors}'
                    )
                )
            )
        )

        filter_private_exps_with_invalid_item_selec_interac = (
            exp_private_explorations
            | 'Get private exp with invalid item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_item_selec_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for private exp item selec interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_private_exps_with_invalid_item_selec_interac = (
            filter_private_exps_with_invalid_item_selec_interac
            | 'Report count of private exp models with invalid item interac'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PRIVATE EXPS WITH INVALID ITEM SELEC INTERAC')
            )
        )

        report_private_exps_with_invalid_item_selec_interac = (
            filter_private_exps_with_invalid_item_selec_interac
            | 'Show info for private exp having invalid item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of private exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'private exp item selection interaction errors '
                       f'are {exp_item_errors}'
                    )
                )
            )
        )

        filter_public_exps_with_invalid_item_selec_interac = (
            exp_public_explorations
            | 'Get public exp with invalid item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_item_selec_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for public exp item selec interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_public_exps_with_invalid_item_selec_interac = (
            filter_public_exps_with_invalid_item_selec_interac
            | 'Report count of public exp models with invalid item interac'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID ITEM SELEC INTERAC')
            )
        )

        report_public_exps_with_invalid_item_selec_interac = (
            filter_public_exps_with_invalid_item_selec_interac
            | 'Show info for public exp having invalid item selec interac'
            >> beam.MapTuple(
                lambda exp_id, exp_item_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of public exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public exp item selection interaction errors '
                       f'are {exp_item_errors}'
                    )
                )
            )
        )

        filter_curated_exps_with_invalid_drag_drop_interac = (
            curated_explorations
            | 'Get curated exp with invalid drag drop interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_drag_drop_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for drag drop interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_curated_exps_with_invalid_drag_drop_interac = (
            filter_curated_exps_with_invalid_drag_drop_interac
            | 'Report count of curated exp models with invalid drag interac'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID DRAG DROP INTERAC')
            )
        )

        report_curated_exps_with_invalid_drag_drop_interac = (
            filter_curated_exps_with_invalid_drag_drop_interac
            | 'Show info for exp having invalid drag drop interac'
            >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated exp drag and drop interaction errors '
                       f'are {exp_drag_errors}'
                    )
                )
            )
        )

        filter_private_exps_with_invalid_drag_drop_interac = (
            exp_private_explorations
            | 'Get private exp with invalid drag drop interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_drag_drop_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for private exp drag drop interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_private_exps_with_invalid_drag_drop_interac = (
            filter_private_exps_with_invalid_drag_drop_interac
            | 'Report count of private exp models with invalid drag interac'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PRIVATE EXPS WITH INVALID DRAG DROP INTERAC')
            )
        )

        report_private_exps_with_invalid_drag_drop_interac = (
            filter_private_exps_with_invalid_drag_drop_interac
            | 'Show info for private exp having invalid drag drop interac'
            >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of private exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'private exp drag and drop interaction errors '
                       f'are {exp_drag_errors}'
                    )
                )
            )
        )

        filter_public_exps_with_invalid_drag_drop_interac = (
            exp_public_explorations
            | 'Get public exp with invalid drag drop interac'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_drag_drop_interac(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for public exp drag drop interac'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_public_exps_with_invalid_drag_drop_interac = (
            filter_public_exps_with_invalid_drag_drop_interac
            | 'Report count of public exp models with invalid drag interac'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID DRAG DROP INTERAC')
            )
        )

        report_public_exps_with_invalid_drag_drop_interac = (
            filter_public_exps_with_invalid_drag_drop_interac
            | 'Show info for public exp having invalid drag drop interac'
            >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of public exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public exp drag and drop interaction errors '
                       f'are {exp_drag_errors}'
                    )
                )
            )
        )

        filter_curated_exps_with_invalid_rte_image = (
            curated_explorations
            | 'Get curated exp with invalid rte image tag'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_rte_image_tag(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for rte image tag'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_curated_exps_with_invalid_rte_image = (
            filter_curated_exps_with_invalid_rte_image
            | 'Report count of curated exp models with invalid rte image'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID RTE IMAGE')
            )
        )

        report_curated_exps_with_invalid_rte_image = (
            filter_curated_exps_with_invalid_rte_image
            | 'Show info for exp having invalid rte image tag'
            >> beam.MapTuple(
                lambda exp_id, exp_image_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated exp RTE image tag errors '
                       f'are {exp_image_errors}'
                    )
                )
            )
        )

        filter_private_exps_with_invalid_rte_image = (
            exp_private_explorations
            | 'Get private exp with invalid rte image tag'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_rte_image_tag(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for private exp rte image tag'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_private_exps_with_invalid_rte_image = (
            filter_private_exps_with_invalid_rte_image
            | 'Report count of private exp models with invalid rte image'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PRIVATE EXPS WITH INVALID RTE IMAGE')
            )
        )

        report_private_exps_with_invalid_rte_image = (
            filter_private_exps_with_invalid_rte_image
            | 'Show info for private exp having invalid rte image tag'
            >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of private exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'private exp RTE image tag errors '
                       f'are {exp_drag_errors}'
                    )
                )
            )
        )

        filter_public_exps_with_invalid_rte_image = (
            exp_public_explorations
            | 'Get public exp with invalid rte image tag'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_rte_image_tag(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for public exp rte image tag'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_public_exps_with_invalid_rte_image = (
            filter_public_exps_with_invalid_rte_image
            | 'Report count of public exp models with invalid rte image'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID RTE IMAGE')
            )
        )

        report_public_exps_with_invalid_rte_image = (
            filter_public_exps_with_invalid_rte_image
            | 'Show info for public exp having invalid rte image tag'
            >> beam.MapTuple(
                lambda exp_id, exp_drag_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of public exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public exp RTE image tag errors '
                       f'are {exp_drag_errors}'
                    )
                )
            )
        )

        filter_curated_exps_with_invalid_rte_video = (
            curated_explorations
            | 'Get curated exp with invalid rte video tag'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_rte_video_tag(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for rte video tag'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_curated_exps_with_invalid_rte_video = (
            filter_curated_exps_with_invalid_rte_video
            | 'Report count of curated exp models with invalid rte video'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF CURATED EXPS WITH INVALID RTE VIDEO')
            )
        )

        report_curated_exps_with_invalid_rte_video = (
            filter_curated_exps_with_invalid_rte_video
            | 'Show info for exp having invalid rte video tag'
            >> beam.MapTuple(
                lambda exp_id, exp_video_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of curated exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'curated exp RTE video tag errors '
                       f'are {exp_video_errors}'
                    )
                )
            )
        )

        filter_private_exps_with_invalid_rte_video = (
            exp_private_explorations
            | 'Get private exp with invalid rte video tag'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_rte_video_tag(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for private exp rte video tag'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_private_exps_with_invalid_rte_video = (
            filter_private_exps_with_invalid_rte_video
            | 'Report count of private exp models with invalid rte video'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PRIVATE EXPS WITH INVALID RTE VIDEO')
            )
        )

        report_private_exps_with_invalid_rte_video = (
            filter_private_exps_with_invalid_rte_video
            | 'Show info for private exp having invalid rte video tag'
            >> beam.MapTuple(
                lambda exp_id, exp_video_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of private exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'private exp RTE video tag errors '
                       f'are {exp_video_errors}'
                    )
                )
            )
        )

        filter_public_exps_with_invalid_rte_video = (
            exp_public_explorations
            | 'Get public exp with invalid rte video tag'
            >> beam.MapTuple(
                lambda exp_id, exp_states, exp_created_on: (
                    exp_id,
                    self.filter_invalid_rte_video_tag(exp_states),
                    exp_created_on.date()))
            | 'Remove empty values for public exp rte video tag'
            >> beam.Filter(
                lambda exp: len(exp[1]) > 0
            )
        )

        report_number_of_public_exps_with_invalid_rte_video = (
            filter_public_exps_with_invalid_rte_video
            | 'Report count of public exp models with invalid rte video'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF PUBLIC EXPS WITH INVALID RTE VIDEO')
            )
        )

        report_public_exps_with_invalid_rte_video = (
            filter_public_exps_with_invalid_rte_video
            | 'Show info for public exp having invalid rte video tag'
            >> beam.MapTuple(
                lambda exp_id, exp_video_errors, exp_created_on: (
                    job_run_result.JobRunResult.as_stderr(
                       f'The id of public exp is {exp_id}, '
                       f'created on {exp_created_on}, and the invalid '
                       f'public exp RTE video tag errors '
                       f'are {exp_video_errors}'
                    )
                )
            )
        )

        return (
            (
                report_curated_exps_with_invalid_ref_exp_id,
                report_number_of_curated_exps_with_invalid_ref_exp_id,
                report_private_exps_with_invalid_ref_exp_id,
                report_number_of_private_exps_with_invalid_ref_exp_id,
                report_public_exps_with_invalid_ref_exp_id,
                report_number_of_public_exps_with_invalid_ref_exp_id,

                report_curated_exps_with_invalid_continue_interac,
                report_number_of_curated_exps_with_invalid_cont_interac,
                report_private_exps_with_invalid_continue_interac,
                report_number_of_private_exps_with_invalid_cont_interac,
                report_public_exps_with_invalid_continue_interac,
                report_number_of_public_exps_with_invalid_cont_interac,

                report_curated_exps_with_invalid_item_selec_interac,
                report_number_of_curated_exps_with_invalid_item_selec_interac,
                report_private_exps_with_invalid_item_selec_interac,
                report_number_of_private_exps_with_invalid_item_selec_interac,
                report_public_exps_with_invalid_item_selec_interac,
                report_number_of_public_exps_with_invalid_item_selec_interac,

                report_curated_exps_with_invalid_drag_drop_interac,
                report_number_of_curated_exps_with_invalid_drag_drop_interac,
                report_private_exps_with_invalid_drag_drop_interac,
                report_number_of_private_exps_with_invalid_drag_drop_interac,
                report_public_exps_with_invalid_drag_drop_interac,
                report_number_of_public_exps_with_invalid_drag_drop_interac,

                report_curated_exps_with_invalid_rte_image,
                report_number_of_curated_exps_with_invalid_rte_image,
                report_private_exps_with_invalid_rte_image,
                report_number_of_private_exps_with_invalid_rte_image,
                report_public_exps_with_invalid_rte_image,
                report_number_of_public_exps_with_invalid_rte_image,

                report_curated_exps_with_invalid_rte_video,
                report_number_of_curated_exps_with_invalid_rte_video,
                report_private_exps_with_invalid_rte_video,
                report_number_of_private_exps_with_invalid_rte_video,
                report_public_exps_with_invalid_rte_video,
                report_number_of_public_exps_with_invalid_rte_video
            )
            | 'Combine results' >> beam.Flatten()
        )
