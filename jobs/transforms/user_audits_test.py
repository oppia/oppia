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


class ValidateModelWithUserIdTests(job_test_utils.PipelinedTestBase):

    NOW = datetime.datetime.utcnow()

    def test_process_reports_error_for_invalid_uid(self):
        model_with_invalid_id = user_models.UserSettingsModel(
            id='123', email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_invalid_id])
            | beam.ParDo(user_audits.ValidateModelWithUserId())
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
            | beam.ParDo(user_audits.ValidateModelWithUserId())
        )

        self.assert_pcoll_equal(output, [])


class ValidateActivityMappingOnlyAllowedKeysTests(
        job_test_utils.PipelinedTestBase):

    USER_ID = 'test_id'
    INCORRECT_KEY = 'some_id'
    INCORRECT_KEY_VALUE = 'value'
    def test_process_with_incorrect_keys(self):

        test_model = user_models.PendingDeletionRequestModel(
            id=self.USER_ID
        )
        test_model.pseudonymizable_entity_mappings = {
            models.NAMES.audit: {self.INCORRECT_KEY: self.INCORRECT_KEY_VALUE}
        }

        output = (
            self.pipeline
            | beam.Create([test_model])
            | beam.ParDo(user_audits.ValidateActivityMappingOnlyAllowedKeys())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelIncorrectKeyError(
                test_model,
                [self.INCORRECT_KEY]
                )
        ])


class ValidateOldModelsMarkedDeletedTests(job_test_utils.PipelinedTestBase):

    NOW = datetime.datetime.utcnow()
    VALID_USER_ID = 'test_user'
    SUBMITTER_ID = 'submitter_id'

    def test_model_not_marked_as_deleted_when_older_than_4_weeks(self):
        model = user_models.UserQueryModel(
            id=self.VALID_USER_ID,
            submitter_id=self.SUBMITTER_ID,
            created_on=self.NOW - datetime.timedelta(weeks=5),
            last_updated=self.NOW - datetime.timedelta(weeks=5)
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_audits.ValidateOldModelsMarkedDeleted())
        )
        self.assert_pcoll_equal(output, [
            audit_errors.ModelExpiringError(model)
        ])

    def test_model_not_marked_as_deleted_recently(self):
        model = user_models.UserQueryModel(
            id=self.VALID_USER_ID,
            submitter_id=self.SUBMITTER_ID,
            created_on=self.NOW - datetime.timedelta(weeks=1),
            last_updated=self.NOW - datetime.timedelta(weeks=1)
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_audits.ValidateOldModelsMarkedDeleted())
        )
        self.assert_pcoll_equal(output, [])
