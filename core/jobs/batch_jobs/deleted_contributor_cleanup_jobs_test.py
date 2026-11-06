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

"""Tests for one-off cleanup of deleted activity contributors."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import deleted_contributor_cleanup_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import collection_models, exp_models, user_models

(collection_models, exp_models, user_models) = models.Registry.import_models(
    [models.Names.COLLECTION, models.Names.EXPLORATION, models.Names.USER]
)


class DeletedContributorCleanupJobTestBase(job_test_utils.JobTestBase):
    """Create activity summaries containing one deleted and one live user."""

    def setUp(self) -> None:
        super().setUp()
        self.live_user_id = 'live-user-id'
        self.missing_user_id = 'missing-user-id'
        live_user = self.create_model(
            user_models.UserSettingsModel,
            id=self.live_user_id,
            email='live@example.com',
        )
        self.exp_summary = exp_models.ExpSummaryModel(
            id='exp-id',
            title='Exploration',
            category='Mathematics',
            objective='Learn math',
            language_code='en',
            community_owned=False,
            contributor_ids=[self.live_user_id],
            contributors_summary={
                self.live_user_id: 3,
                self.missing_user_id: 2,
            },
        )
        self.collection_summary = collection_models.CollectionSummaryModel(
            id='col-id',
            title='Collection',
            category='Mathematics',
            objective='Learn math',
            language_code='en',
            community_owned=False,
            contributor_ids=[self.live_user_id, self.missing_user_id],
            contributors_summary={self.live_user_id: 1},
        )
        self.clean_summary = exp_models.ExpSummaryModel(
            id='clean-exp-id',
            title='Clean exploration',
            category='Mathematics',
            objective='Learn math',
            language_code='en',
            community_owned=False,
            contributor_ids=[self.live_user_id],
            contributors_summary={self.live_user_id: 1},
        )
        self.put_multi(
            [
                live_user,
                self.exp_summary,
                self.collection_summary,
                self.clean_summary,
            ]
        )


class RemoveDeletedContributorsFromSummaryModelsJobTests(
    DeletedContributorCleanupJobTestBase
):
    """Tests that the job removes only references to missing users."""

    JOB_CLASS: Type[
        deleted_contributor_cleanup_jobs.RemoveDeletedContributorsFromSummaryModelsJob
    ] = (
        deleted_contributor_cleanup_jobs.RemoveDeletedContributorsFromSummaryModelsJob
    )

    def test_removes_deleted_contributors_from_both_summary_types(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='ACTIVITY SUMMARIES CLEANED SUCCESS: 2'
                )
            ]
        )
        exp_summary = exp_models.ExpSummaryModel.get_by_id('exp-id')
        collection_summary = collection_models.CollectionSummaryModel.get_by_id(
            'col-id'
        )
        self.assertEqual(exp_summary.contributor_ids, [self.live_user_id])
        self.assertEqual(
            exp_summary.contributors_summary, {self.live_user_id: 3}
        )
        self.assertEqual(
            collection_summary.contributor_ids, [self.live_user_id]
        )
        self.assertEqual(
            collection_summary.contributors_summary, {self.live_user_id: 1}
        )
        clean_summary = exp_models.ExpSummaryModel.get_by_id('clean-exp-id')
        self.assertEqual(
            clean_summary.contributors_summary, {self.live_user_id: 1}
        )


class AuditRemoveDeletedContributorsFromSummaryModelsJobTests(
    DeletedContributorCleanupJobTestBase
):
    """Tests that the audit reports candidates without storing changes."""

    JOB_CLASS: Type[
        deleted_contributor_cleanup_jobs.AuditRemoveDeletedContributorsFromSummaryModelsJob
    ] = (
        deleted_contributor_cleanup_jobs.AuditRemoveDeletedContributorsFromSummaryModelsJob
    )

    def test_reports_models_without_updating_them(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='ACTIVITY SUMMARIES CLEANED SUCCESS: 2'
                )
            ]
        )
        exp_summary = exp_models.ExpSummaryModel.get_by_id('exp-id')
        collection_summary = collection_models.CollectionSummaryModel.get_by_id(
            'col-id'
        )
        self.assertIn(self.missing_user_id, exp_summary.contributors_summary)
        self.assertIn(self.missing_user_id, collection_summary.contributor_ids)
