# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for migrating the terminal state of the Exploration to have texts inside P tag."""

from __future__ import annotations

import logging

from core import feconf
from core.constants import constants
from core.domain import exp_fetchers, exp_services, opportunity_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms, results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Any, Iterable, Optional, Sequence, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, datastore_services, exp_models

(base_models, exp_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.EXPLORATION]
)
datastore_services = models.Registry.import_datastore_services()


class ExplorationEndStateNormalizationJob(base_jobs.JobBase):
    """A one-off job for normalizing the end state of explorations."""

    DEFAULT_TERMINAL_STATE_CONTENT_WITHOUT_P_TAG = (
        'Congratulations, you have finished!'
    )
    DATASTORE_UPDATES_ALLOWED = True

    def update_end_state_content(self, exploration_model: Any) -> Optional[Any]:
        """Updates the end state content of the exploration to have texts inside P tag.

        Args:
            exploration_model: exp_models.ExplorationModel. The exploration model to be updated.

        Returns:
            Optional[exp_models.ExplorationModel]. The updated exploration
            model if any changes were made, else None.
        """
        is_exploration_updated = False

        with datastore_services.get_ndb_context():
            states = getattr(exploration_model, 'states', None) or {}

            for state in states.values():
                if (
                    state.get('content', {}).get('html')
                    == self.DEFAULT_TERMINAL_STATE_CONTENT_WITHOUT_P_TAG
                ):
                    state['content'][
                        'html'
                    ] = f'<p>{self.DEFAULT_TERMINAL_STATE_CONTENT_WITHOUT_P_TAG}</p>'
                    is_exploration_updated = True

            if is_exploration_updated:
                return exploration_model
            else:
                return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of job run results for ExplorationModels
        that were updated after end state normalization.

        Returns:
            beam.PCollection[job_run_result.JobRunResult]. A PCollection
            containing job run results with the IDs of the
            ExplorationModels that were updated or created.
        """
        exploration_models = (
            self.pipeline
            | 'Get exploration models'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
        )

        updated_exploration_models = (
            exploration_models
            | 'Update end state content'
            >> beam.Map(self.update_end_state_content)
            | 'Filter out None results'
            >> beam.Filter(lambda exploration: exploration is not None)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                updated_exploration_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return updated_exploration_models | 'Format results' >> beam.Map(
            lambda exploration: job_run_result.JobRunResult(
                stdout=(
                    f'Updated exploration with ID: {exploration.id} '
                    'after end state normalization.'
                )
            )
        )


class ExplorationEndStateNormalizationAuditJob(
    ExplorationEndStateNormalizationJob
):
    """A one-off job for auditing the end state of explorations."""

    DATASTORE_UPDATES_ALLOWED = False
