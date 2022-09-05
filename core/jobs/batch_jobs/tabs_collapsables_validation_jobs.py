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


(exp_models, opportunity_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.opportunity])


class TabsCollapsablesValidationJob(base_jobs.JobBase):
    """
    """
    @staticmethod
    def _filter_invalid_rte_values(html, states_with_errored_values):
        """
        """
        soup = bs4.BeautifulSoup(html, 'html.parser')
        for tag in soup.find_all():
            if tag.name == 'oppia-noninteractive-image':
                try:
                    print("**************************")
                    print(tag['alt-with-value'].strip() in ('&quot;&quot;', '', ""))
                    print(tag['alt-with-value'].strip() == " ")
                    print(tag['alt-with-value'])
                    print(type(tag['alt-with-value']))
                    if tag['alt-with-value'] in ('&quot;&quot;', '', ""):
                        states_with_errored_values.append(
                            'alt attr is empty'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'alt attr not exists'
                    )

                try:
                    if tag['filepath-with-value'] in ('&quot;&quot;', '', ""):
                        states_with_errored_values.append(
                            'filepath attr is empty'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'filepath attr not exists'
                    )

                try:
                    tag['caption-with-value']
                except Exception:
                    states_with_errored_values.append(
                        'caption attr not exists'
                    )

            elif tag.name == 'oppia-noninteractive-math':
                try:
                    if tag['math_content-with-value'] in ('', ""):
                        states_with_errored_values.append(
                            'math content attr is empty'
                        )
                    try:
                        if tag['math_content-with-value'][
                            'raw_latex'].strip() in ('&quot;&quot;', '', ""):
                            states_with_errored_values.append(
                                'raw lattex attr empty'
                            )
                    except Exception:
                        states_with_errored_values.append(
                            'raw lattex attr not exists'
                        )

                    try:
                        svg_filename = tag['math_content-with-value'][
                            'svg_filename']
                        if svg_filename.strip() in ('&quot;&quot;', '', ""):
                            states_with_errored_values.append(
                                'svg_filename attr empty'
                            )
                        elif svg_filename.strip().split('&quot;')[1] != '.svg':
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
                        '&quot;&quot;', '', ""):
                        states_with_errored_values.append(
                            'text attr empty in skillreview tag'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'text attr not in skillreview tag'
                    )

            elif tag.name == 'oppia-noninteractive-video':
                try:
                    tag['start-with-value']

                except Exception:
                    states_with_errored_values.append(
                        'start value invalid'
                    )

                try:
                    tag['end-with-value']

                except Exception:
                    states_with_errored_values.append(
                        'end value invalid'
                    )

                try:
                    if tag['autoplay-with-value'] not in ('true', 'false'):
                        states_with_errored_values.append(
                            'autoplay value invalid'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'autoplay value invalid'
                    )

                try:
                    if tag['video_id-with-value'].strip() in (
                        '&quot;&quot;', ''):
                        states_with_errored_values.append(
                            'video id empty'
                        )

                except Exception:
                    states_with_errored_values.append(
                        'No video id'
                    )

            elif tag.name == 'oppia-noninteractive-link':
                try:
                    if tag['text-with-value'].strip() in (
                        '&quot;&quot;', '', ""):
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

        """
        errored_values = []
        for state_name, state in states_dict.items():
            states_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            tabs_tags = soup.find_all('oppia-noninteractive-tabs')
            for tag in tabs_tags:
                if 'tab_contents-with-value' not in tag:
                    states_with_errored_values.append(
                        'No content attr in tabs'
                    )
                tab_content_json = html_validation_service.unescape_html(
                    tag['tab_contents-with-value'])

                tab_content_list = json.loads(tab_content_json)

                # abcd = "<p>Content</p><oppia-noninteractive-image alt-with-value=\"&amp;quot;&amp;quot;\" caption-with-value=\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;&amp;quot;\"></oppia-noninteractive-image><oppia-noninteractive-image></oppia-noninteractive-image><p>&nbsp;</p><p><oppia-noninteractive-link text-with-value=\"&amp;quot;&amp;quot;\" url-with-value=\"&amp;quot;&amp;quot;\"></oppia-noninteractive-link><oppia-noninteractive-link></oppia-noninteractive-link></p><p>&nbsp;</p><p><oppia-noninteractive-math math_content-with-value=\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;&amp;quot;}\"></oppia-noninteractive-math><oppia-noninteractive-math></oppia-noninteractive-math><oppia-noninteractive-math math_content-with-value=\'\'></oppia-noninteractive-math></p><p>&nbsp;</p><p><oppia-noninteractive-skillreview skill_id-with-value=\"&amp;quot;&amp;quot;\" text-with-value=\"&amp;quot;&amp;quot;\"></oppia-noninteractive-skillreview><oppia-noninteractive-skillreview></oppia-noninteractive-skillreview></p><oppia-noninteractive-video autoplay-with-value=\"&amp;quot;&amp;quot;\" end-with-value=\"&amp;quot;&amp;quot;\" start-with-value=\"&amp;quot;&amp;quot;\" video_id-with-value=\"&amp;quot;&amp;quot;\"></oppia-noninteractive-video><oppia-noninteractive-video></oppia-noninteractive-video>"
                # efgh = "<p>Content</p><oppia-noninteractive-image alt-with-value=\"&amp;quot;dssddsdssdsd&amp;quot;\" caption-with-value=\"&amp;quot;sdds&amp;quot;\" filepath-with-value=\"&amp;quot;img.svg&amp;quot;\"></oppia-noninteractive-image><p>&nbsp;</p><p><oppia-noninteractive-link text-with-value=\"&amp;quot;link&amp;quot;\" url-with-value=\"&amp;quot;https://www.example.com&amp;quot;\"></oppia-noninteractive-link></p><p>&nbsp;</p><p><oppia-noninteractive-math math_content-with-value=\"{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{x}{y}&amp;quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20220905_011442_tq4lzh784k_height_3d205_width_1d784_vertical_1d306.svg&amp;quot;}\"></oppia-noninteractive-math></p><p>&nbsp;</p><p><oppia-noninteractive-skillreview skill_id-with-value=\"&amp;quot;&amp;quot;\" text-with-value=\"&amp;quot;concept card&amp;quot;\"></oppia-noninteractive-skillreview></p><oppia-noninteractive-video autoplay-with-value=\"&amp;quot;&amp;quot;\" end-with-value=\"&amp;quot;&amp;quot;\" start-with-value=\"&amp;quot;&amp;quot;\" video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;quot;\"></oppia-noninteractive-video>"

                # tab_content_list[1]['content'] = abcd

                print("**********************************")
                print(tab_content_list)

                # print("**********************************")
                # print(html_validation_service.escape_html(json.dumps(tab_content_list)))

                if len(tab_content_list) == 0:
                    states_with_errored_values.append('No tabs')
                for tab_content in tab_content_list:
                    TabsCollapsablesValidationJob._filter_invalid_rte_values(
                        tab_content['content'], states_with_errored_values
                    )

            states_with_errored_values = list(set(states_with_errored_values))
            if len(states_with_errored_values) > 0:
                errored_values.append(
                    {
                        'state_name': state_name,
                        'errored_values': states_with_errored_values
                    }
                )
        # print(state.name.abc)
        return errored_values

    @staticmethod
    def invalid_collapsibles_rte_tag(
        states_dict: Dict[str, state_domain.State]
    ):
        """
        """
        errored_values = []
        for state_name, state in states_dict.items():
            states_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            collapsibles_tags = soup.find_all(
                'oppia-noninteractive-collapsible')
            for tag in collapsibles_tags:
                if 'content-with-value' not in tag:
                    states_with_errored_values.append(
                        'No content attr in collapsible tag'
                    )
                else:
                    collapsible_content_json = (
                        html_validation_service.unescape_html(
                        tag['content-with-value'])
                    )
                    collapsible_content_list = json.loads(
                        collapsible_content_json)
                    if len(collapsible_content_list) == 0:
                        states_with_errored_values.append(
                            'No collapsible content')
                    for collapsible_content in collapsible_content_list:
                        states_with_errored_values = (
                            TabsCollapsablesValidationJob.
                            _filter_invalid_rte_values(
                                collapsible_content['content'],
                                states_with_errored_values
                            )
                        )

                if 'heading-with-value' not in tag:
                    states_with_errored_values.append(
                        'No heading attr in collapsible tag'
                    )
                else:
                    collapsible_heading_json = (
                        html_validation_service.unescape_html(
                        tag['heading-with-value'])
                    )
                    collapsible_heading_list = json.loads(
                        collapsible_heading_json)
                    if len(collapsible_heading_list) == 0:
                        states_with_errored_values.append(
                            'No collapsible heading')

            if len(states_with_errored_values) > 0:
                errored_values.append(
                    {
                        'state_name': state_name,
                        'errored_values': states_with_errored_values
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

        filter_invalid_curated_tabs = (
            curated_explorations
            | 'Get invalid curated tabs values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_date: (
                    exp_id, self.invalid_tabs_rte_tag(exp_states),
                    exp_date.date()
                )
            )
            | 'Remove empty values in invalid curated tabs' >> beam.Filter(
                lambda tabs: len(tabs[1]) > 0
            )
        )

        report_invalid_curated_tabs = (
          filter_invalid_curated_tabs
          | 'Report invalid curated tabs value' >> beam.MapTuple(
            lambda exp_id, tabs_errors, exp_created_on: (
                job_run_result.JobRunResult.as_stderr(
                    f'The id of the exp is {exp_id}, created on '
                    f'{exp_created_on} and the invalid curated tabs values '
                    f'are {tabs_errors}'
                )
            )
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
                lambda tabs: len(tabs[1]) > 0
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

        filter_invalid_curated_collapsibles = (
            curated_explorations
            | 'Get invalid curated collapsibles values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_date: (
                    exp_id, self.invalid_collapsibles_rte_tag(exp_states),
                    exp_date.date()
                )
            )
            | 'Remove empty values in invalid curated collapsibles'
            >> beam.Filter(
                lambda tabs: len(tabs[1]) > 0
            )
        )

        report_invalid_curated_collapsibles = (
          filter_invalid_curated_collapsibles
          | 'Report invalid curated collapsibles value' >> beam.MapTuple(
            lambda exp_id, collapsibles_errors, exp_created_on: (
                job_run_result.JobRunResult.as_stderr(
                    f'The id of the exp is {exp_id}, created on '
                    f'{exp_created_on} and the invalid curated collapsibles '
                    f'values are {collapsibles_errors}'
                )
            )
          )
        )

        return (
            (
                report_invalid_tabs,
                report_invalid_curated_tabs,

                report_invalid_collapsibles,
                report_invalid_curated_collapsibles
            )
            | 'Combine results' >> beam.Flatten()
        )
