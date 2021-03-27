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
import unittest

from core.platform import models
from jobs import base_model_validator
from jobs import base_model_validator_errors as errors

import apache_beam as beam
from apache_beam.runners.direct import direct_runner
from apache_beam.testing import test_pipeline as pipeline
from apache_beam.testing import util as beam_testing_util

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class MockModel(base_models.BaseModel):
    pass


class BaseModelValidatorTests(unittest.TestCase):

    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = self.now - datetime.timedelta(weeks=52)
        self.year_later = self.now + datetime.timedelta(weeks=52)

    def test_base_model_validator_ptransform(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_id = MockModel(
                id='123@?!*',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            invalid_timestamp = MockModel(
                id='124',
                deleted=False,
                created_on=self.now,
                last_updated=self.year_later)
            expired_model = MockModel(
                id='125',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago)
            valid_model = MockModel(
                id='126',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = (
                p
                | beam.Create([
                    invalid_id, invalid_timestamp, expired_model, valid_model
                ]))

            output = pcoll | base_model_validator.BaseModelValidator()

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidIdError(invalid_id),
                    errors.ModelMutatedDuringJobError(invalid_timestamp),
                    errors.ModelExpiredError(expired_model)
                ]))


class ValidateDeletedTests(BaseModelValidatorTests):
    def test_process_reports_error_for_old_deleted_model(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            expired_model = MockModel(
                id='123',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago)
            pcoll = p | beam.Create([expired_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateDeleted()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelExpiredError(expired_model)
                ]))


class ValidateModelTimeFieldTests(BaseModelValidatorTests):
    def test_process_reports_model_timestamp_relationship_error(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_timestamp = MockModel(
                id='123',
                created_on=self.now,
                last_updated=self.year_ago)
            pcoll = p | beam.Create([invalid_timestamp])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelTimestampRelationshipError(invalid_timestamp)
                ]))

    def test_process_reports_model_mutated_during_job_error(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_timestamp = MockModel(
                id='124',
                created_on=self.now,
                last_updated=self.year_later)
            pcoll = p | beam.Create([invalid_timestamp])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelMutatedDuringJobError(invalid_timestamp)
                ]))


class ValidateModelIdTests(BaseModelValidatorTests):
    def test_validate_model_id(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_id_model = MockModel(
                id='123@?!*',
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = p | beam.Create([invalid_id_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelIdWithRegex(),
                    '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidIdError(invalid_id_model)
                ]))


class ValidatePostCommitIsPrivateTests(BaseModelValidatorTests):
    def test_validate_post_commit_is_private_when_status_is_public(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_commit_status = base_models.BaseCommitLogEntryModel(
                id='123',
                created_on=self.year_ago,
                last_updated=self.now,
                commit_type='invalid-type',
                user_id='',
                post_commit_status='public',
                post_commit_is_private=True,
                commit_cmds=[])
            pcoll = p | beam.Create([invalid_commit_status])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidatePostCommitIsPrivate()))
            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidCommitStatusError(
                        invalid_commit_status)
                ])
            )

    def test_validate_post_commit_is_private_when_status_is_private(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_commit_status = base_models.BaseCommitLogEntryModel(
                id='123',
                created_on=self.year_ago,
                last_updated=self.now,
                commit_type='invalid-type',
                user_id='',
                post_commit_status='private',
                post_commit_is_private=False,
                commit_cmds=[])
            pcoll = p | beam.Create([invalid_commit_status])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidatePostCommitIsPrivate()))
            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidCommitStatusError(
                        invalid_commit_status)
                ])
            )
