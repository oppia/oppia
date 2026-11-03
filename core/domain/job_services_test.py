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

"""Tests for core.domain.job_services."""

from __future__ import annotations

import datetime

from core import utils
from core.domain import cron_services, job_domain, job_services
from core.tests import test_utils


class JobServicesTests(test_utils.GenericTestBase):
    """Tests for job services."""

    def test_save_and_get_job_round_trip(self) -> None:
        job = job_domain.Job(
            job_id='job_id',
            job_type='job_type',
            time_queued_msec=1.0,
            time_started_msec=2.0,
            time_finished_msec=3.0,
            status_code='completed',
            metadata={'key': 'value'},
            output=['output'],
            error=None,
            has_been_cleaned_up=True,
            additional_job_params={'param': 'value'},
        )

        job_services.save_job(job)
        saved_job = job_services.get_job_by_id(job.job_id)
        assert saved_job is not None
        self.assertEqual(saved_job.to_dict(), job.to_dict())

        updated_job = job_domain.Job(
            job_id=job.job_id,
            job_type='updated_job_type',
            time_queued_msec=4.0,
            time_started_msec=None,
            time_finished_msec=None,
            status_code='queued',
            metadata=None,
            output=None,
            error=None,
            has_been_cleaned_up=False,
            additional_job_params=None,
        )
        job_services.save_job(updated_job)
        saved_updated_job = job_services.get_job_by_id(updated_job.job_id)
        assert saved_updated_job is not None
        self.assertEqual(saved_updated_job.to_dict(), updated_job.to_dict())

    def test_get_job_by_id_returns_none_for_unknown_id(self) -> None:
        self.assertIsNone(job_services.get_job_by_id('unknown_job_id'))

    def test_get_unfinished_jobs(self) -> None:
        jobs_to_save = [
            job_domain.Job(
                job_id='queued_job',
                job_type='test_job_type',
                time_queued_msec=1.0,
                time_started_msec=None,
                time_finished_msec=None,
                status_code='queued',
                metadata=None,
                output=None,
                error=None,
                has_been_cleaned_up=False,
                additional_job_params=None,
            ),
            job_domain.Job(
                job_id='started_job',
                job_type='test_job_type',
                time_queued_msec=2.0,
                time_started_msec=3.0,
                time_finished_msec=None,
                status_code='started',
                metadata=None,
                output=None,
                error=None,
                has_been_cleaned_up=False,
                additional_job_params=None,
            ),
            job_domain.Job(
                job_id='completed_job',
                job_type='test_job_type',
                time_queued_msec=4.0,
                time_started_msec=5.0,
                time_finished_msec=6.0,
                status_code='completed',
                metadata=None,
                output=[],
                error=None,
                has_been_cleaned_up=False,
                additional_job_params=None,
            ),
            job_domain.Job(
                job_id='other_type_job',
                job_type='other_job_type',
                time_queued_msec=0.5,
                time_started_msec=None,
                time_finished_msec=None,
                status_code='queued',
                metadata=None,
                output=None,
                error=None,
                has_been_cleaned_up=False,
                additional_job_params=None,
            ),
        ]
        for job in jobs_to_save:
            job_services.save_job(job)

        self.assertItemsEqual(
            [
                job.job_id
                for job in job_services.get_unfinished_jobs('test_job_type')
            ],
            ['queued_job', 'started_job'],
        )
        self.assertTrue(
            job_services.do_unfinished_jobs_exist('test_job_type')
        )
        self.assertFalse(
            job_services.do_unfinished_jobs_exist('completed_job_type')
        )
        self.assertEqual(
            [
                job.job_id
                for job in job_services.get_all_unfinished_jobs(2)
            ],
            ['started_job', 'queued_job'],
        )

    def test_mark_outdated_jobs_as_deleted(self) -> None:
        outdated_job = job_domain.Job(
            job_id='outdated_job',
            job_type='test_job_type',
            time_queued_msec=1.0,
            time_started_msec=None,
            time_finished_msec=None,
            status_code='queued',
            metadata=None,
            output=None,
            error=None,
            has_been_cleaned_up=False,
            additional_job_params=None,
        )
        current_time = utils.get_current_utc_datetime()
        outdated_time = current_time - datetime.timedelta(days=181)
        with self.swap(
            utils, 'get_current_utc_datetime', lambda: outdated_time
        ):
            job_services.save_job(outdated_job)

        job_services.mark_outdated_jobs_as_deleted(current_time)

        future_time = current_time + datetime.timedelta(days=181)
        with self.swap(
            utils, 'get_current_utc_datetime', lambda: future_time
        ):
            cron_services.delete_models_marked_as_deleted()
        self.assertIsNone(job_services.get_job_by_id('outdated_job'))
