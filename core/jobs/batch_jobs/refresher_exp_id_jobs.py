# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Jobs that extract Collection models information."""

from __future__ import annotations

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Iterable, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models


(exp_models,) = models.Registry.import_models([models.NAMES.exploration])

datastore_services = models.Registry.import_datastore_services()


class FilterRefresherExplorationIdJob(base_jobs.JobBase):
    """Job that match entity_type as collection."""

    @staticmethod
    def _process_exploration_states(
        exp: datastore_services.Model) -> Iterable[Tuple[str, str]]:
        """Filter explorations with a refresher_exploration_id .

        Args:
            exp: datastore_services.Model.
                Exploration model to check for refresher_exploration_id.

        Yields:
            (str,str). Tuple containing exploration id and state name.
        """

        for state_name, state in exp.states.items():
            interaction = state.interaction
            if interaction.default_outcome.refresher_exploration_id is not None:
                yield (exp.id, state_name)
                return

            for group in interaction.answer_groups:
                if group.outcome.refresher_exploration_id is not None:
                    yield (exp.id, state_name)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        matching entity_type as collection.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            matching entity_type as collection.
        """
        refresher_exp_id_models = (
            self.pipeline
            | 'Get all Exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Extract ' >> beam.FlatMap(
                self._process_exploration_states)
        )

        return (
            refresher_exp_id_models
            | 'The output' >> beam.MapTuple(
                lambda exp_id, state: job_run_result.JobRunResult.as_stdout(
                    'exp_id: %s, state name: %s' % (exp_id, state)
                ))
        )
