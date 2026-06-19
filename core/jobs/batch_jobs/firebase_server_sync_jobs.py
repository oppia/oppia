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

"""Jobs that sync the Firebase Authentication server with Oppia's user models.

Oppia's user & authentication models are the source of truth. These jobs compute
the diff between them and the Firebase Authentication server, then either report
the diff (dry run) or apply it (create missing records and delete stale ones).
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import firebase_io
from core.jobs.transforms import firebase_transforms, job_result_transforms
from core.jobs.types import job_run_result

import apache_beam as beam


class FirebaseServerSyncJobBase(base_jobs.JobBase):
    """Syncs the Firebase Authentication server against Oppia's user models.

    Attributes:
        DRY_RUN: bool. When True, the job is read-only and merely reports the
            changes that would be made. When False, the job applies the diff to
            the Firebase server.
    """

    DRY_RUN = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        firebase_records = (
            self.pipeline
            | 'Get records directly from the Firebase server'
            >> firebase_io.GetRecordsDirectlyFromFirebase()
        )
        recreated_record_results = (
            self.pipeline
            | 'Recreate records from Oppia models'
            >> firebase_io.RecreateRecordsFromOppiaModels()
        )
        oppia_records = recreated_record_results[
            firebase_io.RecreateRecordsFromOppiaModels.TAG_RECORDS
        ]
        auth_id_user_id_pairs = recreated_record_results[
            firebase_io.RecreateRecordsFromOppiaModels.TAG_AUTH_PAIRS
        ]

        diff_results: firebase_transforms.DiffFirebaseRecords.OutputDict = (
            oppia_records,
            firebase_records,
        ) | 'Diff expected records (in Oppia) by actual records (in Firebase)' >> firebase_transforms.DiffFirebaseRecords(
            auth_pairs=auth_id_user_id_pairs,
        )

        if self.DRY_RUN:
            add_results = diff_results[
                'ADD'
            ] | 'Count records that would be created' >> job_result_transforms.CountObjectsToJobRunResult(
                'WOULD CREATE'
            )
            del_results = diff_results[
                'DEL'
            ] | 'Count records that would be deleted' >> job_result_transforms.CountObjectsToJobRunResult(
                'WOULD DELETE'
            )
        else:
            add_results = (
                diff_results['ADD']
                | 'Create the records' >> firebase_io.CreateFirebaseRecords()
            )
            del_results = (
                diff_results['DEL']
                | 'Delete the records' >> firebase_io.DeleteFirebaseRecords()
            )

        remaining_results = (
            diff_results
            | 'Format remaining results'
            >> job_result_transforms.FromTaggedOutputs(
                firebase_transforms.DiffFirebaseRecords.TAG_OK,
                firebase_transforms.DiffFirebaseRecords.TAG_EMAIL_CONFLICT,
                firebase_transforms.DiffFirebaseRecords.TAG_AUTH_ID_CONFLICT,
            )
        )

        return (add_results, del_results, remaining_results) | beam.Flatten()


class AuditFirebaseServerSyncJob(FirebaseServerSyncJobBase):
    """Read-only: reports the Oppia-to-Firebase diff without applying it."""

    DRY_RUN = True


class FirebaseServerSyncJob(FirebaseServerSyncJobBase):
    """Read-write: applies the Oppia-to-Firebase diff to the Firebase server."""

    DRY_RUN = False
