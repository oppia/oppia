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

"""Unit tests for jobs.batch_jobs.dashboard_stats_one_off."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.batch_jobs import dashboard_stats_one_off
from jobs.types import job_run_result

(auth_models, base_models, user_models) = models.Registry.import_models(
    [models.NAMES.auth, models.NAMES.base_model, models.NAMES.user])


class DashboardStatsOneOffJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = dashboard_stats_one_off.DashboardStatsOneOffJob

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)

    def test_dashboard_stats_one_off(self):
        user_settings_model_1 = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_settings_model_2 = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_2, email='b@b.com')
        user_stats_model_1 = self.create_model(
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1)

        self.put_multi([
            user_settings_model_1, user_settings_model_2, user_stats_model_1])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS')
        ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_2)
        self.assertIsNotNone(user_stats_model)

