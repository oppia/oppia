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

"""Unit tests for base_model_audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import jobs_test_base
from jobs.transforms import base_model_audits
from jobs.types import audit_errors

import apache_beam as beam

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class ValidateDeletedTests(jobs_test_base.JobsTestBase):

    def test_process_reports_error_for_old_deleted_model(self):
        expired_model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([expired_model])
            | beam.ParDo(base_model_audits.ValidateDeletedModel())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelExpiredError(expired_model),
        ])


class ValidateModelTimeFieldTests(jobs_test_base.JobsTestBase):

    def test_process_reports_model_timestamp_relationship_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_model_audits.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.InconsistentTimestampsError(invalid_timestamp),
        ])

    def test_process_reports_model_mutated_during_job_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='124',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_model_audits.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelMutatedDuringJobError(invalid_timestamp),
        ])


class ValidateModelIdTests(jobs_test_base.JobsTestBase):

    def test_validate_model_id(self):
        invalid_id_model = base_models.BaseModel(
            id='123@?!*',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([invalid_id_model])
            | beam.ParDo(base_model_audits.ValidateBaseModelId())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelIdRegexError(
                invalid_id_model,
                base_model_audits.ValidateBaseModelId.MODEL_ID_REGEX.pattern),
        ])


class ValidatePostCommitIsPrivateTests(jobs_test_base.JobsTestBase):

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
            | beam.ParDo(base_model_audits.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.InvalidCommitStatusError(invalid_commit_status),
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
            | beam.ParDo(base_model_audits.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.InvalidCommitStatusError(invalid_commit_status),
        ])
