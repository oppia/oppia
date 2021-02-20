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
""" Unit tests for base model validator errors"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import unittest

from core.platform import models
from jobs import base_model_validator_errors as errors

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])


class MockModel(base_models.BaseModel):
    pass


class ValidatorErrorTestBase(unittest.TestCase):
    """Base class for valiator error tests"""

    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = self.now - datetime.timedelta(weeks=52)
        self.year_later = self.now + datetime.timedelta(weeks=52)


class ModelTimestampRelationshipErrorTests(ValidatorErrorTestBase):
    def test_model_timestamp_relationship_error(self):
        model = MockModel(
            id='123',
            created_on=self.now,
            last_updated=self.year_ago)
        error = errors.ModelTimestampRelationshipError(model)

        msg = (
            'Entity ID %s: The created_on field has a value %s which '
            'is greater than the value %s of last_updated field'
            % (model.id, model.created_on, model.last_updated))
        self.assertEqual(error.message, msg)


class ModelMutatedDuringJobErrorTests(ValidatorErrorTestBase):
    def test_model_mutated_during_job_error(self):
        model = MockModel(
            id='124',
            created_on=self.now,
            last_updated=self.year_later)
        error = errors.ModelMutatedDuringJobError(model)

        msg = (
            'Entity id %s: The last_updated field has a value %s which '
            'is greater than the time when the job was run'
            % (model.id, model.last_updated))

        self.assertEqual(error.message, msg)


class ModelInvalidIdErrorTests(ValidatorErrorTestBase):
    def test_model_invalid_id_error(self):
        model = MockModel(
            id='123@?!*',
            created_on=self.year_ago,
            last_updated=self.now)
        error = errors.ModelInvalidIdError(model)

        msg = (
            'Entity id %s: Entity id does not match regex pattern'
            % (model.id))

        self.assertEqual(error.message, msg)


class ModelExpiredErrorTests(ValidatorErrorTestBase):
    def test_model_expired_error(self):
        model = MockModel(
            id='123',
            deleted=True,
            created_on=self.year_ago,
            last_updated=self.year_ago)

        error = errors.ModelExpiredError(model)

        msg = (
            'Entity id %s: model marked as deleted is older than %s days'
            % (model.id, errors.PERIOD_TO_HARD_DELETE_MODEL_IN_DAYS))

        self.assertEqual(error.message, msg)
