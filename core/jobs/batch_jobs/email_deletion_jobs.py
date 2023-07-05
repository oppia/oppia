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

"""Validation Jobs for blog models"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import email_models
    from mypy_imports import feedback_models
    from mypy_imports import user_models

(email_models, feedback_models, user_models) = models.Registry.import_models([
    models.Names.EMAIL, models.Names.FEEDBACK, models.Names.USER
])


class DeleteUnneededEmailRelatedModelsJob(base_jobs.JobBase):
    """Job that deletes emails models that belonged to users that were deleted
    as part of the wipeout process.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        deleted_user_ids_collection = (
            self.pipeline
            | 'Get all deleted user models' >> ndb_io.GetModels(
                user_models.DeletedUserModel.get_all())
            | 'Extract user IDs' >> beam.Map(
                lambda deleted_user_model: deleted_user_model.id)
        )
        deleted_user_ids = beam.pvalue.AsIter(deleted_user_ids_collection)

        sent_email_models_to_delete = (
            self.pipeline
            | 'Get all sent email models' >> ndb_io.GetModels(
                email_models.SentEmailModel.get_all())
            | 'Filter sent email models that belong to deleted users' >> (
                beam.Filter(
                    lambda model, ids: (
                        model.sender_id in ids or model.recipient_id in ids),
                    ids=deleted_user_ids
                ))
        )
        sent_email_models_to_delete_result = (
            sent_email_models_to_delete
            | 'Count sent email models to be deleted' >> (
                job_result_transforms.CountObjectsToJobRunResult('SENT EMAILS'))
        )

        bulk_email_models_to_delete = (
            self.pipeline
            | 'Get all bulk email models' >> ndb_io.GetModels(
                email_models.BulkEmailModel.get_all())
            | 'Filter bulk email models that belong to deleted users' >> (
                beam.Filter(
                    lambda model, ids: model.sender_id in ids,
                    ids=deleted_user_ids
                ))
        )
        bulk_email_models_to_delete_result = (
            bulk_email_models_to_delete
            | 'Count bulk email models to be deleted' >> (
                job_result_transforms.CountObjectsToJobRunResult('BULK EMAILS'))
        )

        unsent_feedback_email_models_to_delete = (
            self.pipeline
            | 'Get all unsent feedback models' >> ndb_io.GetModels(
                feedback_models.UnsentFeedbackEmailModel.get_all())
            | 'Filter unsent feedback models that belong to deleted users' >> (
                beam.Filter(
                    lambda model, ids: model.id in ids, ids=deleted_user_ids))
        )
        unsent_feedback_email_models_to_delete_result = (
            unsent_feedback_email_models_to_delete
            | 'Count unsent feedback email models to be deleted' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'FEEDBACK EMAILS'))
        )

        user_bulk_emails_models_to_delete = (
            self.pipeline
            | 'Get all user bulk email models' >> ndb_io.GetModels(
                user_models.UserBulkEmailsModel.get_all())
            | 'Filter user bulk email models that belong to deleted users' >> (
                beam.Filter(
                    lambda model, ids: model.id in ids, ids=deleted_user_ids))
        )
        user_bulk_emails_models_to_delete_result = (
            user_bulk_emails_models_to_delete
            | 'Count user bulk email models to be deleted' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'USER BULK EMAILS'))
        )

        unused_models_deletion = (
            (
                sent_email_models_to_delete,
                bulk_email_models_to_delete,
                unsent_feedback_email_models_to_delete,
                user_bulk_emails_models_to_delete
            )
            | 'Merge models' >> beam.Flatten()
            | 'Extract keys' >> beam.Map(lambda model: model.key)
            | 'Delete models' >> ndb_io.DeleteModels()
        )

        return (
            (
                sent_email_models_to_delete_result,
                bulk_email_models_to_delete_result,
                unsent_feedback_email_models_to_delete_result,
                user_bulk_emails_models_to_delete_result,
            )
            | 'Merge results' >> beam.Flatten()
        )
