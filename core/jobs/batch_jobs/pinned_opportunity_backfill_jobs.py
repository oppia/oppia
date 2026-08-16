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

"""Beam jobs to backfill PinnedOpportunityModels."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class BackfillPinnedOpportunityModelJob(base_jobs.JobBase):
    """Job that backfills entity_type field to 'exploration' for existing PinnedOpportunityModels."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        pinned_opportunity_query = user_models.PinnedOpportunityModel.get_all()
        pinned_opportunities = (
            self.pipeline
            | 'Get all PinnedOpportunityModels'
            >> ndb_io.GetModels(pinned_opportunity_query)
        )

        # Here we use MyPy ignore because "setattr" does not return a value.
        updated_pinned_opportunities = (
            pinned_opportunities
            | 'Set entity_type'
            >> beam.Map(
                lambda model: (
                    setattr(  # type: ignore[func-returns-value]
                        model, 'entity_type', feconf.ENTITY_TYPE_EXPLORATION
                    ),
                    model,
                )[1]
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                updated_pinned_opportunities
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        job_run_results = (
            updated_pinned_opportunities
            | 'Count backfilled models'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'PINNED OPPORTUNITY MODELS BACKFILLED'
            )
        )

        return job_run_results


class AuditBackfillPinnedOpportunityModelJob(BackfillPinnedOpportunityModelJob):
    """Job that audits BackfillPinnedOpportunityModelJob."""

    DATASTORE_UPDATES_ALLOWED = False
