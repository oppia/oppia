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

"""Unit tests for BaseModelValidator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
from jobs import base_model_validator
from jobs import base_model_validator_errors as errors
from jobs import jobs_test_utils

import apache_beam as beam

base_models, user_models = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))

datastore_services = models.Registry.import_datastore_services()


class BaseModelValidatorTestBase(jobs_test_utils.BeamTestBase):
    """Test base for base_model_validator jobs with helpful constants."""

    NOW = datetime.datetime.utcnow()
    YEAR_AGO = NOW - datetime.timedelta(weeks=52)
    YEAR_LATER = NOW + datetime.timedelta(weeks=52)


class BaseModelValidatorTests(BaseModelValidatorTestBase):

    def test_base_model_validator_ptransform(self):
        model_with_invalid_id = base_models.BaseModel(
            id='123@?!*',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        model_with_invalid_timestamp = base_models.BaseModel(
            id='124',
            deleted=False,
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)
        expired_model = base_models.BaseModel(
            id='125',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        valid_model = base_models.BaseModel(
            id='126',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([
                model_with_invalid_id,
                model_with_invalid_timestamp,
                expired_model,
                valid_model,
            ])
            | base_model_validator.BaseModelValidator()
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidIdError(
                model_with_invalid_id,
                base_model_validator.DEFAULT_ID_REGEX_STRING),
            errors.ModelMutatedDuringJobError(model_with_invalid_timestamp),
            errors.ModelExpiredError(expired_model),
        ])


class ValidateDeletedTests(BaseModelValidatorTestBase):

    def test_process_reports_error_for_old_deleted_model(self):
        expired_model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([expired_model])
            | beam.ParDo(base_model_validator.ValidateDeletedModel())
        )

        self.assert_pcoll_equal(output, [
            errors.ModelExpiredError(expired_model),
        ])


class ValidateModelTimeFieldTests(BaseModelValidatorTestBase):

    def test_process_reports_model_timestamp_relationship_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_model_validator.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            errors.InconsistentTimestampsError(invalid_timestamp),
        ])

    def test_process_reports_model_mutated_during_job_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='124',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_model_validator.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            errors.ModelMutatedDuringJobError(invalid_timestamp),
        ])


class ValidateModelIdTests(BaseModelValidatorTestBase):

    def test_validate_model_id(self):
        invalid_id_model = base_models.BaseModel(
            id='123@?!*',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([invalid_id_model])
            | beam.ParDo(
                base_model_validator.ValidateModelIdWithRegex(),
                base_model_validator.DEFAULT_ID_REGEX_STRING)
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidIdError(
                invalid_id_model, base_model_validator.DEFAULT_ID_REGEX_STRING),
        ])


class ValidatePostCommitIsPrivateTests(BaseModelValidatorTestBase):

    def test_validate_post_commit_is_private_when_status_is_public(self):
        invalid_commit_status = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='public',
            post_commit_is_private=True,
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_status])
            | beam.ParDo(base_model_validator.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidCommitStatusError(invalid_commit_status),
        ])

    def test_validate_post_commit_is_private_when_status_is_private(self):
        invalid_commit_status = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='private',
            post_commit_is_private=False,
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_status])
            | beam.ParDo(base_model_validator.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidCommitStatusError(invalid_commit_status),
        ])
