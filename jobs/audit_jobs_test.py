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

"""Unit tests for jobs.audit_jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
from jobs import audit_jobs
from jobs import job_options
from jobs import jobs_test_utils
from jobs.transforms import base_model_audits
from jobs.types import audit_errors

from apache_beam import runners
from apache_beam.testing import test_pipeline

(base_models, user_models) = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))


class AuditAllStorageModelsJobTests(jobs_test_utils.JobTestBase):

    JOB_CLASS = audit_jobs.AuditAllStorageModelsJob

    VALID_USER_ID = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)

    def test_empty_storage(self):
        self.assert_job_output_is_empty()

    def test_run_with_empty_model_getter(self):
        pipeline = test_pipeline.TestPipeline(
            runner=runners.DirectRunner(),
            options=job_options.JobOptions(model_getter=None))

        self.assertRaisesRegexp(
            ValueError, 'JobOptions.model_getter must not be None',
            audit_jobs.AuditAllStorageModelsJob(pipeline).run)

    def test_base_model_audits(self):
        base_model_with_invalid_id = base_models.BaseModel(
            id='123@?!*',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        base_model_with_invalid_timestamps = base_models.BaseModel(
            id='124',
            deleted=False,
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)
        base_model_with_inconsistent_timestamps = base_models.BaseModel(
            id='125',
            deleted=False,
            created_on=self.YEAR_LATER,
            last_updated=self.YEAR_AGO)
        expired_base_model = base_models.BaseModel(
            id='126',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        valid_base_model = base_models.BaseModel(
            id='127',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        self.model_io_stub.put_multi([
            base_model_with_invalid_id,
            base_model_with_invalid_timestamps,
            base_model_with_inconsistent_timestamps,
            expired_base_model,
            valid_base_model,
        ])

        self.assert_job_output_is([
            audit_errors.ModelIdRegexError(
                base_model_with_invalid_id,
                base_model_audits.BASE_MODEL_ID_REGEX.pattern),
            audit_errors.ModelMutatedDuringJobError(
                base_model_with_invalid_timestamps),
            audit_errors.InconsistentTimestampsError(
                base_model_with_inconsistent_timestamps),
            audit_errors.ModelExpiredError(expired_base_model),
        ])

    def test_user_audits(self):
        user_settings_model_with_invalid_id = user_models.UserSettingsModel(
            id='128', email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)
        user_settings_model_with_valid_id = user_models.UserSettingsModel(
            id=self.VALID_USER_ID, email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)

        self.model_io_stub.put_multi([
            user_settings_model_with_invalid_id,
            user_settings_model_with_valid_id,
        ])

        self.assert_job_output_is([
            audit_errors.ModelIdRegexError(
                user_settings_model_with_invalid_id, feconf.USER_ID_REGEX),
        ])
