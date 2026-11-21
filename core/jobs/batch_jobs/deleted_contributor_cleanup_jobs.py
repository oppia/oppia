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

"""One-off jobs to remove deleted users from activity contributor summaries."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import List, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        collection_models,
        datastore_services,
        exp_models,
        user_models,
    )

(collection_models, exp_models, user_models) = models.Registry.import_models(
    [models.Names.COLLECTION, models.Names.EXPLORATION, models.Names.USER]
)
datastore_services = models.Registry.import_datastore_services()

SummaryModel = Union[
    collection_models.CollectionSummaryModel, exp_models.ExpSummaryModel
]


def remove_deleted_contributors(
    summary_model: SummaryModel,
) -> List[SummaryModel]:
    """Remove references to user IDs without a UserSettingsModel.

    Args:
        summary_model: CollectionSummaryModel|ExpSummaryModel. Model to check.

    Returns:
        list(SummaryModel). The updated model, or an empty list if unchanged.
    """
    contributor_ids = list(
        set(summary_model.contributor_ids)
        | set(summary_model.contributors_summary)
    )
    with datastore_services.get_ndb_context():
        user_settings_models = user_models.UserSettingsModel.get_multi(
            contributor_ids, include_deleted=True
        )
    missing_ids = {
        contributor_id
        for contributor_id, user_settings_model in zip(
            contributor_ids, user_settings_models
        )
        if user_settings_model is None
    }
    if not missing_ids:
        return []

    summary_model.contributor_ids = [
        contributor_id
        for contributor_id in summary_model.contributor_ids
        if contributor_id not in missing_ids
    ]
    for contributor_id in missing_ids:
        summary_model.contributors_summary.pop(contributor_id, None)
    summary_model.update_timestamps()
    return [summary_model]


class RemoveDeletedContributorsFromSummaryModelsJob(base_jobs.JobBase):
    """Repair exploration and collection summaries left by older deletions."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_summaries = (
            self.pipeline
            | 'Get exploration summaries'
            >> ndb_io.GetModels(exp_models.ExpSummaryModel.get_all())
            | 'Clean exploration contributors'
            >> beam.FlatMap(remove_deleted_contributors)
        )
        collection_summaries = (
            self.pipeline
            | 'Get collection summaries'
            >> ndb_io.GetModels(
                collection_models.CollectionSummaryModel.get_all()
            )
            | 'Clean collection contributors'
            >> beam.FlatMap(remove_deleted_contributors)
        )
        updated_summaries = (
            exp_summaries,
            collection_summaries,
        ) | 'Merge cleaned summaries' >> beam.Flatten()
        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                updated_summaries
                | 'Put cleaned summaries' >> ndb_io.PutModels()
            )
        return (
            updated_summaries
            | 'Count cleaned summaries'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'ACTIVITY SUMMARIES CLEANED'
            )
        )


class AuditRemoveDeletedContributorsFromSummaryModelsJob(
    RemoveDeletedContributorsFromSummaryModelsJob
):
    """Audit the cleanup without updating models."""

    DATASTORE_UPDATES_ALLOWED = False
