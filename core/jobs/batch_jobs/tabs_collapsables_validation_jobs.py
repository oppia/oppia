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

"""Validation jobs to check tabs, collapsables RTE tags"""

from __future__ import annotations

from core.domain import exp_domain, html_validation_service
from core.domain import exp_fetchers
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models
from core.domain import html_validation_service

import bs4
import apache_beam as beam
import json
from typing import Any, Dict, List, Optional, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

datastore_services = models.Registry.import_datastore_services()


(exp_models, opportunity_models, suggestion_models) = (
    models.Registry.import_models(
        [models.NAMES.exploration,
        models.NAMES.opportunity, models.NAMES.suggestion])
)


class TabsCollapsablesValidationJob(base_jobs.JobBase):
    """Job to test invalid RTE tabs and collapsibles tags"""

    @staticmethod
    def _filter_invalid_rte_values(html, states_with_errored_values):
        """Validates the RTE tags

        Args:
            html: str. RTE tags present inside the tabs or collapsibles tag.
            states_with_errored_values: List[str]. List containing RTE tag
                errors.
        """
        soup = bs4.BeautifulSoup(html, 'html.parser')
        for tag in soup.find_all():
            if tag.name == 'oppia-noninteractive-image':
                try:
                    if tag['alt-with-value'] in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'alt attr is empty'
                        )
                    if len(tag['alt-with-value']) < 5:
                        states_with_errored_values.append(
                            'alt attr length is less than 5'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'alt attr not exists'
                    )

                try:
                    if tag['filepath-with-value'] in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'filepath attr is empty'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'filepath attr not exists'
                    )

                try:
                    if len(tag['caption-with-value']) > 500:
                        states_with_errored_values.append(
                            'caption attr length is greater than 500'
                        )
                except Exception:
                    states_with_errored_values.append(
                        'caption attr not exists'
                    )

            elif tag.name == 'oppia-noninteractive-math':
                try:
                    if tag['math_content-with-value'] in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'math content attr is empty'
                        )
                    try:
                        math_content = json.loads(
                            tag['math_content-with-value'])
                        if math_content['raw_latex'].strip() in (
                                '&quot;&quot;', '', '\'\'', '\"\"'):
                            states_with_errored_values.append(
                                'raw lattex attr empty'
                            )
                    except Exception:
                        states_with_errored_values.append(
                            'raw lattex attr not exists'
                        )

                    try:
                        math_content = json.loads(
                            tag['math_content-with-value'])
                        svg_filename = math_content['svg_filename']
                        if svg_filename.strip() in (
                            '&quot;&quot;', '', '\'\'', '\"\"'):
                            states_with_errored_values.append(
                                'svg_filename attr empty'
                            )
                        elif svg_filename.strip()[-4:] != '.svg':
                            states_with_errored_values.append(
                                'svg_filename attr does not have svg extension'
                            )

                    except Exception:
                        states_with_errored_values.append(
                            'svg_filename attr not exists'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'math content attr not exists'
                    )

            elif tag.name == 'oppia-noninteractive-skillreview':
                try:
                    if tag['text-with-value'].strip() in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'text attr empty in skillreview tag'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'text attr not in skillreview tag'
                    )

                try:
                    if tag['skill_id-with-value'].strip() in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'skill_id attr empty in skillreview tag'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'skill_id attr not in skillreview tag'
                    )

            elif tag.name == 'oppia-noninteractive-video':
                start_value = 0
                end_value = 0
                try:
                    start_value = tag['start-with-value']

                except Exception:
                    states_with_errored_values.append(
                        'start value invalid'
                    )

                try:
                    end_value = tag['end-with-value']

                except Exception:
                    states_with_errored_values.append(
                        'end value invalid'
                    )

                try:
                    if tag['autoplay-with-value'] not in (
                        'true', 'false', '\"true\"', '\"false\"', True, False):
                        states_with_errored_values.append(
                            'autoplay value invalid'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'autoplay attr not exists'
                    )

                try:
                    if tag['video_id-with-value'].strip() in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'video id empty'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'No video id'
                    )

                if (start_value > end_value) and (
                    start_value != 0 and end_value != 0):
                    states_with_errored_values.append(
                            'start value greater than end value'
                        )

            elif tag.name == 'oppia-noninteractive-link':
                try:
                    if tag['text-with-value'].strip() in (
                        '&quot;&quot;', '', '\'\'', '\"\"'):
                        states_with_errored_values.append(
                            'text attr empty in link tag'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'No text attr in link tag'
                    )

                try:
                    tag['url-with-value']

                except Exception:
                    states_with_errored_values.append(
                        'No url attr in link tag'
                    )

            elif tag.name == 'oppia-noninteractive-tabs':
                states_with_errored_values.append(
                    'Nested tabs'
                )

            elif tag.name == 'oppia-noninteractive-collapsible':
                states_with_errored_values.append(
                    'Nested collapsables'
                )

    @staticmethod
    def invalid_tabs_rte_tag(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """Validating the `tabs` RTE tag, validates the following
            - `tab_contents-with-value` attribute should be present
            - Atleast one tab should be present inside the tag
            - RTE tags inside `tabs` should be valid

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            errored_values: List[Dict[str, object]]. Returns the errored
            tabs RTE tags.
        """
        errored_values = []
        for state_name, state in states_dict.items():
            states_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            tabs_tags = soup.find_all('oppia-noninteractive-tabs')
            for tag in tabs_tags:
                try:
                    tab_content_json = html_validation_service.unescape_html(
                        tag['tab_contents-with-value'])

                    tab_content_list = json.loads(tab_content_json)

                    if len(tab_content_list) == 0:
                        states_with_errored_values.append('No tabs')
                    for tab_content in tab_content_list:
                        (
                            TabsCollapsablesValidationJob.
                            _filter_invalid_rte_values(
                                tab_content['content'],
                                states_with_errored_values
                            )
                        )
                except Exception:
                    states_with_errored_values.append(
                        'No content attr in tabs'
                    )

            states_with_errored_values = list(set(states_with_errored_values))
            if len(states_with_errored_values) > 0:
                states_with_errored_values.sort()
                errored_values.append(
                    {
                        'state_name': state_name,
                        'errored_values': states_with_errored_values
                    }
                )
        return errored_values

    @staticmethod
    def invalid_collapsibles_rte_tag(
        states_dict: Dict[str, state_domain.State]
    ) -> List[Dict[str, object]]:
        """Validating the `collapsibles` RTE tag, validates the following
            - `content-with-value` attribute should be present
            - `heading-with-value` attribute should be present
            - RTE tags inside `collapsibles` should be valid

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            errored_values: List[Dict[str, object]]. Returns the errored
            collapsibles RTE tags.
        """
        errored_values = []
        for state_name, state in states_dict.items():
            states_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            collapsibles_tags = soup.find_all(
                'oppia-noninteractive-collapsible')
            for tag in collapsibles_tags:
                try:
                    collapsible_content_json = (
                        html_validation_service.unescape_html(
                        tag['content-with-value'])
                    )
                    collapsible_content_list = json.loads(
                        collapsible_content_json)
                    if len(collapsible_content_list) == 0:
                        states_with_errored_values.append(
                            'collapsible content empty')
                    (
                        TabsCollapsablesValidationJob.
                        _filter_invalid_rte_values(
                            collapsible_content_list,
                            states_with_errored_values
                        )
                    )
                except:
                    states_with_errored_values.append(
                        'No content attr in collapsible tag'
                    )

                try:
                    collapsible_heading_json = (
                        html_validation_service.unescape_html(
                        tag['heading-with-value'])
                    )
                    collapsible_heading_list = json.loads(
                        collapsible_heading_json)
                    if len(collapsible_heading_list) == 0:
                        states_with_errored_values.append(
                            'collapsible heading empty')
                except:
                    states_with_errored_values.append(
                        'No heading attr in collapsible tag'
                    )

            states_with_errored_values = list(set(states_with_errored_values))
            if len(states_with_errored_values) > 0:
                states_with_errored_values.sort()
                errored_values.append(
                    {
                        'state_name': state_name,
                        'errored_values': states_with_errored_values
                    }
                )
        return errored_values

    @staticmethod
    def filter_restricted_rte_tags(states_dict):
        """In curated explorations only 3 tags are allowed other than
        that are not allowed. This function filters all the restricted
        tags that are present inside the states

        Args:
            states_dict: dict[str, state_domain.State]. The state dictionary.

        Returns:
            errored_values: List[Dict[str, object]]. Returns the errored
            states having restricted RTE tags.
        """
        errored_values = []
        for state_name, state in states_dict.items():
            state_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            for tag in soup.find_all():
                if tag.name not in (
                    'p',
                    'oppia-noninteractive-image',
                    'oppia-noninteractive-math',
                    'oppia-noninteractive-skillreview'):
                    state_with_errored_values.append(tag)
            if len(state_with_errored_values) > 0:
                errored_values.append(
                    {
                        'state_name': state_name,
                        'state_with_errored_values': state_with_errored_values
                    }
                )

        return errored_values

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
        """Returns the pair of exp and opportunity models

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
        """Returns whether the exp model is curated or not

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

        filter_invalid_tabs = (
            combine_exp_ids_and_states
            | 'Get invalid tabs values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_date: (
                    exp_id, self.invalid_tabs_rte_tag(exp_states),
                    exp_date.date()
                )
            )
            | 'Remove empty values in invalid tabs' >> beam.Filter(
                lambda tabs: len(tabs[1]) > 0
            )
        )

        report_invalid_tabs = (
          filter_invalid_tabs
          | 'Report invalid tabs value' >> beam.MapTuple(
            lambda exp_id, tabs_errors, exp_created_on: (
                job_run_result.JobRunResult.as_stderr(
                    f'The id of the exp is {exp_id}, created on '
                    f'{exp_created_on} and the invalid tabs values are '
                    f'{tabs_errors}'
                )
            )
          )
        )

        report_count_invalid_tabs = (
            filter_invalid_tabs
            | 'Report count for invalid tabs tag' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID TABS TAG')
            )
        )

        filter_invalid_collapsibles = (
            combine_exp_ids_and_states
            | 'Get invalid collapsibles values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_date: (
                    exp_id, self.invalid_collapsibles_rte_tag(exp_states),
                    exp_date.date()
                )
            )
            | 'Remove empty values in invalid collapsibles' >> beam.Filter(
                lambda collapsibles: len(collapsibles[1]) > 0
            )
        )

        report_invalid_collapsibles = (
          filter_invalid_collapsibles
          | 'Report invalid collapsibles value' >> beam.MapTuple(
            lambda exp_id, collapsibles_errors, exp_created_on: (
                job_run_result.JobRunResult.as_stderr(
                    f'The id of the exp is {exp_id}, created on '
                    f'{exp_created_on} and the invalid collapsibles values '
                    f'are {collapsibles_errors}'
                )
            )
          )
        )

        report_count_invalid_collapsibles = (
            filter_invalid_collapsibles
            | 'Report count for invalid collapsibles tag' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID COLLAPSIBLES TAG')
            )
        )

        filter_curated_exps_having_restricted_tags = (
            curated_explorations
            | 'Get invalid RTE values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_date: (
                    exp_id, self.filter_restricted_rte_tags(exp_states),
                    exp_date.date()
                )
            )
            | 'Remove empty values in invalid curated exps'
            >> beam.Filter(
                lambda exps: len(exps[1]) > 0
            )
        )

        report_curated_exps_having_restricted_tags = (
            filter_curated_exps_having_restricted_tags
            | 'Report invalid curated RTE value' >> beam.MapTuple(
            lambda exp_id, rte_errors, exp_created_on: (
                job_run_result.JobRunResult.as_stderr(
                    f'The id of the exp is {exp_id}, created on '
                    f'{exp_created_on} and the invalid curated RTE '
                    f'values are {rte_errors}'
                )
            )
          )
        )

        report_count_curated_exps_having_restricted_tags = (
            filter_curated_exps_having_restricted_tags
            | 'Report count for invalid curated RTE tag' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'NUMBER OF EXPS WITH INVALID CURATED RTE TAG')
            )
        )

        return (
            (
                report_invalid_tabs,
                report_count_invalid_tabs,

                report_invalid_collapsibles,
                report_count_invalid_collapsibles,

                report_curated_exps_having_restricted_tags,
                report_count_curated_exps_having_restricted_tags
            )
            | 'Combine results' >> beam.Flatten()
        )
