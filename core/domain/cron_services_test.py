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

"""Unit tests for the cron_services."""

from __future__ import annotations

import datetime

from core import utils
from core.domain import cron_services, job_domain, job_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import beam_job_models, job_models, user_models

beam_job_models, job_models, user_models = models.Registry.import_models(
    [models.Names.BEAM_JOB, models.Names.JOB, models.Names.USER]
)


class CronServicesTests(test_utils.GenericTestBase):
    """Unit tests for the cron_services."""

    NINE_WEEKS = datetime.timedelta(weeks=9)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_delete_models_marked_as_deleted(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        completed_activities_model = user_models.CompletedActivitiesModel(
            id=admin_user_id,
            exploration_ids=[],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            last_updated=utils.get_current_utc_datetime() - self.NINE_WEEKS,
            deleted=True,
        )
        completed_activities_model.update_timestamps(
            update_last_updated_time=False
        )
        completed_activities_model.put()

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(admin_user_id)
        )

        cron_services.delete_models_marked_as_deleted()

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(admin_user_id)
        )

    def test_mark_outdated_models_as_deleted(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        current_time = utils.get_current_utc_datetime()
        job = job_domain.Job(
            job_id='job_id',
            job_type='job_type',
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
        outdated_time = current_time - datetime.timedelta(days=181)
        with self.swap(
            utils, 'get_current_utc_datetime', lambda: outdated_time
        ):
            job_services.save_job(job)

        beam_job_run_model = beam_job_models.BeamJobRunModel(
            id=beam_job_models.BeamJobRunModel.get_new_id(),
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.RUNNING.value,
            last_updated=outdated_time,
        )
        beam_job_run_model.update_timestamps(update_last_updated_time=False)
        beam_job_run_model.put()

        job_model = job_models.JobModel.get_by_id('job_id')
        self.assertIsNotNone(job_model)
        assert job_model is not None
        self.assertFalse(job_model.deleted)

        cron_services.mark_outdated_models_as_deleted()

        beam_job_model = beam_job_models.BeamJobRunModel.get_by_id(
            beam_job_run_model.id
        )
        self.assertIsNotNone(beam_job_model)
        assert beam_job_model is not None
        self.assertTrue(beam_job_model.deleted)

        job_model = job_models.JobModel.get_by_id('job_id')
        self.assertIsNotNone(job_model)
        assert job_model is not None
        self.assertTrue(job_model.deleted)
        self.assertIsNone(job_services.get_job_by_id('job_id'))

        future_time = current_time + datetime.timedelta(days=181)
        with self.swap(utils, 'get_current_utc_datetime', lambda: future_time):
            cron_services.delete_models_marked_as_deleted()

        self.assertIsNone(job_models.JobModel.get_by_id('job_id'))
