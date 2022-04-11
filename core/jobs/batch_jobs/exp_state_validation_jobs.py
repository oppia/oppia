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

from __future__ import annotations

from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])

class GetNumberOfExpWithInvalidStateClassifierModelIdJob(base_jobs.JobBase):
    """Job that returns curated explorations where state classifier
    model id is not None."""

    def get_invalid_state_names(self, states):
        """Returns a list of state names that have not None
        classifier model id.
        
        Args:
            states: list[States]. The list of states.

        Returns:
            list[str]. Returns a list of state names that have not None
            classifier model id.
        """
        invalid_state_names = []
        for state_name in states:
            if states[state_name].classifier_model_id is not None:
                invalid_state_names.append(state_name)
        return invalid_state_names

    def filter_invalid_states(self, states):
        """Returns True if any state has classifier model id not None.
        
        Args:
            states: dict(str, State). A dict of states.

        Returns:
            bool. Returns True if any state has classifier model id not None.
        """
        for state_name in states:
            if states[state_name].classifier_model_id is not None:
                return True
        return False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid curated explorations where
        state classifier model id is not None along with the state names.

        Returns:
            PCollection. Returns PCollection of invalid curated explorations
            where state classifier model id is not None along with the
            state names.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        curated_explorations = (
            total_explorations
            | 'Combine exploration ids and states' >> beam.Map(
                lambda exp: (exp.id, exp.states))
            | 'Filter curated explorations' >> beam.Filter(
                lambda exp: opportunity_services
                    .is_exploration_available_for_contribution(exp[0]))
        )

        curated_exps_having_state_classifier_model_id_not_none = (
            curated_explorations
            | 'Filter curated explorations having state classifier model id' >>
                beam.Filter(lambda id, states: (
                    self.filter_invalid_states(states)))
        )

        report_number_of_exps_queried = (
            curated_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            curated_exps_having_state_classifier_model_id_not_none
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_states_along_with_state_name = (
            curated_exps_having_state_classifier_model_id_not_none
            | 'Save info on invalid exps' >> beam.Map(
                lambda id, states: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the states having not None '
                    'classifier model id are %s'
                    % (id, self.get_invalid_state_names(states))
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_states_along_with_state_name
            )
            | 'Combine results' >> beam.Flatten()
        )
