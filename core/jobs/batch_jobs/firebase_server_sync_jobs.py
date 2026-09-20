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

import operator

from core.domain import feature_flag_domain
from core.jobs import base_jobs, job_utils
from core.jobs.io import firebase_io
from core.jobs.transforms import firebase_transforms, job_result_transforms
from core.jobs.types import job_run_result

import apache_beam as beam
from apache_beam import pvalue


class FirebaseServerSyncJobBase(base_jobs.JobBase):
    """Syncs the Firebase Authentication server against Oppia's user models.

    Attributes:
        DRY_RUN: bool. When True, the job is read-only and merely reports the
            changes that would be made. When False, the job applies the diff to
            the Firebase server.
    """

    DRY_RUN = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        if (
            not self.DRY_RUN
            and feature_flag_domain.get_server_mode()
            == feature_flag_domain.ServerMode.PROD
        ):
            raise PermissionError(
                'Refusing to mutate production Firebase authentication server.'
            )

        project_id = job_utils.resolve_project_id(self.pipeline)

        firebase_records = (
            self.pipeline
            | 'Get records directly from the Firebase server'
            >> firebase_io.GetRecordsDirectlyFromFirebase(project_id)
        )
        oppia_records, oppia_problems, auth_pairs = operator.itemgetter(
            firebase_io.RecreateRecordsFromOppiaModels.TAG_RECORDS,
            firebase_io.RecreateRecordsFromOppiaModels.TAG_PROBLEMS,
            firebase_io.RecreateRecordsFromOppiaModels.TAG_AUTH_PAIRS,
        )(
            self.pipeline
            | 'Recreate records from Oppia models'
            >> firebase_io.RecreateRecordsFromOppiaModels()
        )

        diff_results = (
            oppia_records,
            firebase_records,
        ) | 'Compute Diff' >> firebase_transforms.DiffFirebaseRecords(
            auth_pairs
        )

        oppia_is_ok = (
            diff_results[
                firebase_transforms.DiffFirebaseRecords.TAG_OPPIA_USER_COLLISION
            ]
            | 'Count Oppia user collisions' >> beam.combiners.Count.Globally()
            | 'Oppia is OK when there are zero user collisions'
            >> beam.Map(lambda count: count == 0)
        )

        add_records = diff_results[
            firebase_transforms.DiffFirebaseRecords.TAG_ADD
        ] | 'Gate adds on no Oppia collisions' >> beam.Filter(
            lambda _, gate_open: gate_open,
            gate_open=pvalue.AsSingleton(oppia_is_ok, default_value=False),
        )
        del_records = diff_results[
            firebase_transforms.DiffFirebaseRecords.TAG_DEL
        ] | 'Gate dels on no Oppia collisions' >> beam.Filter(
            lambda _, gate_open: gate_open,
            gate_open=pvalue.AsSingleton(oppia_is_ok, default_value=False),
        )

        if self.DRY_RUN:
            add_results = add_records | (
                job_result_transforms.CountObjectsToJobRunResult('WOULD CREATE')
            )
            del_results = del_records | (
                job_result_transforms.CountObjectsToJobRunResult('WOULD DELETE')
            )
        else:
            add_results = (
                add_records
                | beam.WaitOn(
                    del_results := (
                        del_records
                        | firebase_io.DeleteFirebaseRecords(project_id)
                    )
                )
                | firebase_io.CreateFirebaseRecords(project_id)
            )

        remaining_results = (
            diff_results
            | 'Format remaining results'
            >> job_result_transforms.FromTaggedOutputs(
                firebase_transforms.DiffFirebaseRecords.TAG_OK,
                firebase_transforms.DiffFirebaseRecords.TAG_OPPIA_USER_COLLISION,
                firebase_transforms.DiffFirebaseRecords.TAG_FIREBASE_ACCOUNT_COLLISION,
            )
        )

        return (
            add_results,
            del_results,
            remaining_results,
            oppia_problems,
        ) | beam.Flatten()


class AuditFirebaseServerSyncJob(FirebaseServerSyncJobBase):
    """Read-only: reports the Oppia-to-Firebase diff without applying it."""

    DRY_RUN = True


class FirebaseServerSyncJob(FirebaseServerSyncJobBase):
    """Read-write: applies the Oppia-to-Firebase diff to the Firebase server."""

    DRY_RUN = False
