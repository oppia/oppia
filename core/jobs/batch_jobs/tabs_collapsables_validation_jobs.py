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
        for tag in soup:
            if tag.name == 'oppia-noninteractive-image':
                if 'alt-with-value' not in tag:
                    states_with_errored_values.append(
                        'alt attr not exists'
                    )

                if 'filepath-with-value' not in tag:
                    states_with_errored_values.append(
                        'filepath attr not exists'
                    )

            elif tag.name == 'oppia-noninteractive-math':
                if 'math_content-with-value' not in tag:
                    states_with_errored_values.append(
                        'math content attr not exists'
                    )
                else:
                    if 'raw_latex' not in tag['math_content-with-value']:
                        states_with_errored_values.append(
                            'raw lattex attr not exists'
                        )
                    elif tag['math_content-with-value'][
                        'raw_latex'] is None:
                        states_with_errored_values.append(
                            'raw lattex attr None'
                        )
                    elif tag['math_content-with-value'][
                        'raw_latex'].strip() == '':
                        states_with_errored_values.append(
                            'raw lattex attr empty'
                        )

            elif tag.name == 'oppia-noninteractive-skillreview':
                if 'text-with-value' not in tag:
                    states_with_errored_values.append(
                        'text attr not in skillreview tag'
                    )
                elif tag['text-with-value'] is None:
                    states_with_errored_values.append(
                        'text attr None in skillreview tag'
                    )
                elif tag['text-with-value'].strip() == '':
                    states_with_errored_values.append(
                        'text attr empty in skillreview tag'
                    )

            elif tag.name == 'oppia-noninteractive-video':
                if 'start-with-value' not in tag:
                    states_with_errored_values.append(
                        'start value invalid'
                    )

                if 'end-with-value' not in tag:
                    states_with_errored_values.append(
                        'end value invalid'
                    )

                if 'autoplay-with-value' not in tag:
                    states_with_errored_values.append(
                        'autoplay value invalid'
                    )

                if 'autoplay-with-value' in tag:
                    if tag['autoplay-with-value'] not in ('true', 'false'):
                        states_with_errored_values.append(
                            'autoplay value invalid'
                        )

                if 'video_id-with-value' not in tag:
                    states_with_errored_values.append(
                        'No video id'
                    )

                if 'video_id-with-value' in tag:
                    if tag['video_id-with-value'] is None:
                        states_with_errored_values.append(
                            'No video id'
                        )
                    elif tag['video_id-with-value'].strip() == '':
                        states_with_errored_values.append(
                            'video id empty'
                        )

            elif tag.name == 'oppia-noninteractive-link':
                if (
                    'text-with-value' not in tag or
                    'url-with-value' not in tag
                ):
                    states_with_errored_values.append(
                        'No text or url attr in link tag'
                    )

                elif tag['text-with-value'].strip() == '':
                    states_with_errored_values.append(
                        'text attr empty in link tag'
                    )

            elif tag.name == 'oppia-noninteractive-tabs':
                states_with_errored_values.append(
                    'Nested tabs'
                )

            elif tag.name == 'oppia-noninteractive-collapsible':
                states_with_errored_values.append(
                    'Nested collapsables'
                )

        return states_with_errored_values


    @staticmethod
    def invalid_tabs_rte_tag(
        states_dict: Dict[str, state_domain.State]
    ):
        """
        """
        errored_values = []
        for state_name, state in states_dict.items():
            states_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            for tag in soup:
                if tag.name != 'oppia-noninteractive-tabs':
                    continue
                if 'tab_contents-with-value' not in tag:
                    states_with_errored_values.append(
                        'Not content attr in tabs'
                    )
                tab_content_json = html_validation_service.unescape_html(
                    tag['tab_contents-with-value'])
                tab_content_list = json.loads(tab_content_json)
                if len(tab_content_list) == 0:
                    states_with_errored_values.append('No tabs')
                for tab_content in tab_content_list:
                    states_with_errored_values = (
                        TabsCollapsablesValidationJob.
                        _filter_invalid_rte_values(
                            tab_content['content'], states_with_errored_values
                        )
                    )
            if len(states_with_errored_values) > 0:
                errored_values.append(
                    {
                        'state_name': state_name,
                        'errored_values': states_with_errored_values
                    }
                )
        return errored_values

    @staticmethod
    def invalid_collapsables_rte_tag(
        states_dict: Dict[str, state_domain.State]
    ):
        """
        """
        # Work is not completed for this part.
        errored_values = []
        for state_name, state in states_dict.items():
            states_with_errored_values = []
            html = state.content.html
            soup = bs4.BeautifulSoup(html, 'html.parser')
            for tag in soup:
                if tag.name != 'oppia-noninteractive-collapsible':
                    continue
                if 'content-with-value' not in tag:
                    states_with_errored_values.append(
                        'No content attr in collapsible tag'
                    )
                if 'heading-with-value' not in tag:
                    states_with_errored_values.append(
                        'No heading attr in collapsible tag'
                    )
                else:
                    collapsible_heading_json = html_validation_service.unescape_html(
                        tag['heading-with-value'])
                    collapsible_heading_json = json.loads(collapsible_content_json)
                    if len(collapsible_heading_json) == 0:
                        states_with_errored_values.append('No collapsible')

                collapsible_content_json = html_validation_service.unescape_html(
                    tag['content-with-value'])
                collapsible_content_list = json.loads(collapsible_content_json)
                if len(collapsible_content_list) == 0:
                    states_with_errored_values.append('No collapsible')
                for collapsible_content in collapsible_content_list:
                    states_with_errored_values = (
                        TabsCollapsablesValidationJob.
                        _filter_invalid_rte_values(
                            collapsible_content['content'],
                            states_with_errored_values
                        )
                    )
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

        invalid_tabs = (
            combine_exp_ids_and_states
            | 'Get invalid values' >> beam.MapTuple(
                lambda exp_id, exp_states, exp_date: (
                    exp_id, self.invalid_tabs_rte_tag(exp_states), exp_date
                )
            )
        )

        report = (
          invalid_tabs
          | 'Repirt' >> beam.MapTuple(
            lambda exp_id, exp_multi_errors, exp_created_on: (
                job_run_result.JobRunResult.as_stderr(
                    f'The error is {exp_multi_errors}'
                )
            )
          )
        )

        return report
