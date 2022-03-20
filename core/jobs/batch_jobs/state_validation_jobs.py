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

"""Validation Jobs for exploration state"""

from __future__ import annotations

from core.domain import exp_fetchers
from core.jobs import base_jobs, job_utils
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpStatesHavingEmptyImageFieldJob(base_jobs.JobBase):
    """Job that returns exploration id and exploration states that have
    filepath-with-value field as an empty string.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exploration_with_states = (
            total_explorations
            | 'Combine exploration id and states' >> beam.Map(
                lambda exp: (exp.id, exp.states))
            | 'Get only states' >> beam.Map(
                lambda objects: (objects[0], self.get_states(objects[1]))
            )
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_invalid_states = (
            exploration_with_states
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stdout(
                    (objects[0], objects[1])
                ))
        )

        return (
            (
                report_invalid_states,
                report_number_of_exps_queried
            )
            | 'Combine results' >> beam.Flatten()
        )

    def get_states(self, states_dict):
        """Returns the array of state content html field

        Args:
            states_dict: dict. A dictionary of states.

        Returns:
            state_content_html: array. Array containing state
            content html field
        """
        state_content_html = []
        for _, value in states_dict.items():
            state_content_html.append(value.content.html)

        return state_content_html
