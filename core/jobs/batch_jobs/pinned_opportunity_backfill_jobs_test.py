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

"""Unit tests for jobs.batch_jobs.pinned_opportunity_backfill_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import pinned_opportunity_backfill_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class BackfillPinnedOpportunityModelJobTests(job_test_utils.JobTestBase):
    """Tests for BackfillPinnedOpportunityModelJob."""

    JOB_CLASS: Type[
        pinned_opportunity_backfill_jobs.BackfillPinnedOpportunityModelJob
    ] = pinned_opportunity_backfill_jobs.BackfillPinnedOpportunityModelJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_backfills_pinned_opportunity_model(self) -> None:
        model = self.create_model(
            user_models.PinnedOpportunityModel,
            id='user_1.hi.topic_1',
            user_id='user_1',
            language_code='hi',
            topic_id='topic_1',
            opportunity_id='opportunity_1',
        )
        model.update_timestamps()
        self.put_multi([model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='PINNED OPPORTUNITY MODELS BACKFILLED SUCCESS: 1'
                ),
            ]
        )

        fetched_model = user_models.PinnedOpportunityModel.get_by_id(
            'user_1.hi.topic_1'
        )
        self.assertIsNotNone(fetched_model)
        self.assertEqual(
            fetched_model.entity_type, feconf.ENTITY_TYPE_EXPLORATION
        )


class AuditBackfillPinnedOpportunityModelJobTests(job_test_utils.JobTestBase):
    """Tests for AuditBackfillPinnedOpportunityModelJob."""

    JOB_CLASS: Type[
        pinned_opportunity_backfill_jobs.AuditBackfillPinnedOpportunityModelJob
    ] = pinned_opportunity_backfill_jobs.AuditBackfillPinnedOpportunityModelJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_audits_pinned_opportunity_model(self) -> None:
        model = self.create_model(
            user_models.PinnedOpportunityModel,
            id='user_1.hi.topic_1',
            user_id='user_1',
            language_code='hi',
            topic_id='topic_1',
            opportunity_id='opportunity_1',
        )
        model.update_timestamps()
        self.put_multi([model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='PINNED OPPORTUNITY MODELS BACKFILLED SUCCESS: 1'
                ),
            ]
        )

        # Since it is an audit job, datastore updates are disabled, but the job run result output should be produced.
        fetched_model = user_models.PinnedOpportunityModel.get_by_id(
            'user_1.hi.topic_1'
        )
        self.assertIsNotNone(fetched_model)
