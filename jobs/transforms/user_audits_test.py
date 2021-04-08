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

"""Unit tests for jobs.transforms.user_audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.transforms import user_audits
from jobs.types import audit_errors

import apache_beam as beam

(user_models,) = models.Registry.import_models([models.NAMES.user])


class ValidateUserModelIdTests(job_test_utils.PipelinedTestBase):

    NOW = datetime.datetime.utcnow()

    def test_process_reports_error_for_invalid_uid(self):
        model_with_invalid_id = user_models.UserSettingsModel(
            id='123', email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_invalid_id])
            | beam.ParDo(user_audits.ValidateUserModelId())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelIdRegexError(
                model_with_invalid_id, feconf.USER_ID_REGEX),
        ])

    def test_process_reports_nothing_for_valid_uid(self):
        valid_user_id = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
        model_with_valid_id = user_models.UserSettingsModel(
            id=valid_user_id, email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_valid_id])
            | beam.ParDo(user_audits.ValidateUserModelId())
        )

        self.assert_pcoll_equal(output, [])
