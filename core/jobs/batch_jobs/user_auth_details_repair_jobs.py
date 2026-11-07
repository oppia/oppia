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

"""Jobs that repair users whose UserAuthDetailsModel is missing or broken.

FirebaseServerSyncJob can only rebuild the Firebase record of a user whose
UserAuthDetailsModel exists and has a firebase_auth_id. These jobs find the
users that don't, then either report the repairs (dry run) or write them to the
datastore. See RepairUserAuthDetailsModels for the details of each repair.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import firebase_transforms, job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class RepairMissingUserAuthDetailsJobBase(base_jobs.JobBase):
    """Repairs users whose UserAuthDetailsModel is missing or broken.

    Attributes:
        DRY_RUN: bool. When True, the job is read-only and merely reports the
            models that would be put. When False, the job puts them into the
            datastore.
    """

    DRY_RUN = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        # NOTE: Deleted models are read as well because the repair refuses to
        # touch users with deleted models, and must see every existing
        # UserIdByFirebaseAuthIdModel to avoid assigning ambiguous IDs.
        user_auth_details_models = (
            self.pipeline
            | 'Get UserAuthDetailsModels'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
        )
        user_settings_models = (
            self.pipeline
            | 'Get UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True)
            )
        )
        user_id_by_firebase_auth_id_models = (
            self.pipeline
            | 'Get UserIdByFirebaseAuthIdModels'
            >> ndb_io.GetModels(
                auth_models.UserIdByFirebaseAuthIdModel.get_all(
                    include_deleted=True
                )
            )
        )

        repair_results = (
            (
                user_auth_details_models,
                user_settings_models,
                user_id_by_firebase_auth_id_models,
            )
            | 'Compute repairs'
            >> firebase_transforms.RepairUserAuthDetailsModels()
        )

        put_models = repair_results[
            firebase_transforms.RepairUserAuthDetailsModels.TAG_PUT
        ]

        if self.DRY_RUN:
            put_results = put_models | (
                job_result_transforms.CountObjectsToJobRunResult('WOULD PUT')
            )
        else:
            unused_put_results = (
                put_models | 'Put models into datastore' >> ndb_io.PutModels()
            )
            put_results = put_models | (
                job_result_transforms.CountObjectsToJobRunResult('PUT')
            )

        remaining_results = (
            repair_results
            | 'Format remaining results'
            >> job_result_transforms.FromTaggedOutputs(
                firebase_transforms.RepairUserAuthDetailsModels.TAG_OK,
                firebase_transforms.RepairUserAuthDetailsModels.TAG_PROBLEMS,
            )
        )

        return (put_results, remaining_results) | beam.Flatten()


class AuditMissingUserAuthDetailsJob(RepairMissingUserAuthDetailsJobBase):
    """Read-only: reports the repairs without putting any models."""

    DRY_RUN = True


class RepairMissingUserAuthDetailsJob(RepairMissingUserAuthDetailsJobBase):
    """Read-write: puts the repaired models into the datastore."""

    DRY_RUN = False
