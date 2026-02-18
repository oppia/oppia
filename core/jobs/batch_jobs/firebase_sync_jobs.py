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

"""Job for bringing Firebase records in sync with Oppia's user & auth models."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import firebase_io
from core.jobs.types import job_run_result

import apache_beam as beam


class FirebaseSyncRecordsJob(base_jobs.JobBase):
    """Regenerate all Firebase records based on Oppia's user & auth models.

    This job runs in two phases:
    1. Delete ALL records that exist on the Firebase server.
    2. Import NEW records from the identifiers in Oppia's user & auth models.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        delete_results = (
            self.pipeline
            | 'Get all records from Firebase' >> firebase_io.GetStrongRecords()
            | 'Extract Firebase account ids' >> beam.Map(lambda r: r.auth_id)
            | 'Delete records from Firebase' >> firebase_io.DeleteRecords()
        )

        import_results = (
            self.pipeline
            | 'Get all records from Oppia' >> firebase_io.GetWeakRecords()
            | 'Convert to Firebase type' >> beam.Map(lambda r: r.into_import())
            | 'Wait on DeleteRecords()' >> beam.WaitOn(delete_results)
            | 'Import records into Firebase' >> firebase_io.ImportRecords()
        )

        return (delete_results, import_results) | beam.Flatten()
