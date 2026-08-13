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

"""Audit and migration jobs for legacy feedback models."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models, general_feedback_models

(feedback_models, general_feedback_models) = models.Registry.import_models(
    [models.Names.FEEDBACK, models.Names.GENERAL_FEEDBACK]
)

datastore_services = models.Registry.import_datastore_services()


class MigrateLegacyFeedbackJob(base_jobs.JobBase):
    """Migration job for legacy feedback models."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the migration.

        Returns:
            PCollection. A PCollection of results from the migration.
        """
        legacy_threads = (
            self.pipeline
            | 'Get GeneralFeedbackThreadModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False
                )
            )
        )
        # We will add transforms over here
        # We will add the migration transforms here.
        return legacy_threads | 'Log legacy feedback threads' >> beam.Map(
            lambda thread: job_run_result.JobRunResult.as_stdout(
                'Found legacy feedback thread: id=%s' % thread.id
            )
        )


class AuditLegacyFeedbackJob(base_jobs.JobBase):
    """Audit job for legacy feedback models."""

    DATASTORE_UPDATES_ALLOWED = False
