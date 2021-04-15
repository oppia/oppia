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

"""Unit tests for jobs.transforms.auth_audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.transforms import auth_audits
from jobs.types import audit_errors

import apache_beam as beam

(auth_models,) = models.Registry.import_models([models.NAMES.auth])


class ValidateFirebaseSeedModelIdTests(job_test_utils.PipelinedTestBase):

    def test_reports_error_for_invalid_id(self):
        model_with_invalid_id = auth_models.FirebaseSeedModel(
            id='2', created_on=self.NOW, last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_invalid_id])
            | beam.ParDo(auth_audits.ValidateFirebaseSeedModelId())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelIdRegexError(
                model_with_invalid_id, auth_models.ONLY_FIREBASE_SEED_MODEL_ID),
        ])

    def test_reports_nothing_for_valid_id(self):
        model_with_valid_id = auth_models.FirebaseSeedModel(
            id=auth_models.ONLY_FIREBASE_SEED_MODEL_ID,
            created_on=self.NOW, last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_valid_id])
            | beam.ParDo(auth_audits.ValidateFirebaseSeedModelId())
        )

        self.assert_pcoll_equal(output, [])


class ValidateUserIdByFirebaseAuthIdModelIdTests(
        job_test_utils.PipelinedTestBase):

    def test_reports_error_for_invalid_id(self):
        model_with_invalid_id = auth_models.UserIdByFirebaseAuthIdModel(
            id='-!\'"', user_id='1', created_on=self.NOW, last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_invalid_id])
            | beam.ParDo(auth_audits.ValidateUserIdByFirebaseAuthIdModelId())
        )

        self.assert_pcoll_equal(output, [
            audit_errors.ModelIdRegexError(
                model_with_invalid_id, feconf.FIREBASE_AUTH_ID_REGEX),
        ])

    def test_reports_nothing_for_valid_id(self):
        model_with_valid_id = auth_models.UserIdByFirebaseAuthIdModel(
            id='123', user_id='1', created_on=self.NOW, last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_valid_id])
            | beam.ParDo(auth_audits.ValidateUserIdByFirebaseAuthIdModelId())
        )

        self.assert_pcoll_equal(output, [])
