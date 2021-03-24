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

"""Unit tests for base model validator errors."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import unittest

from core.domain import cron_services
from core.platform import models
from jobs import base_model_validator_errors as errors

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])


class MockModel(base_models.BaseModel):
    pass


class ValidatorErrorTestBase(unittest.TestCase):
    """Base class for validator error tests."""

    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = self.now - datetime.timedelta(weeks=52)
        self.year_later = self.now + datetime.timedelta(weeks=52)


class ModelValidationErrorTests(ValidatorErrorTestBase):
    def setUp(self):
        super(ModelValidationErrorTests, self).setUp()
        self.model = MockModel(
            id='123',
            created_on=self.year_ago,
            last_updated=self.now)
        self.error = errors.ModelValidationError(self.model)

    def test_set_base_message(self):
        self.assertEqual(self.error.base_message, 'Entity id 123:')

    def test_message_raises_not_implemented_error(self):
        self.assertRaises(
            NotImplementedError,
            callableObj=(lambda: self.error.message))

    def test_repr_returns_key(self):
        self.assertEqual(
            errors.ModelInvalidIdError(
                self.model).__repr__(),
            'ModelInvalidIdError: '
            'Entity id 123: Entity id does not match regex pattern')

    def test_eq_when_classes_are_different(self):
        self.assertEqual(
            errors.ModelInvalidIdError(self.model).__eq__(
                errors.ModelExpiredError(self.model)),
            NotImplemented)

    def test_eq_when_classes_are_same(self):
        model_two = MockModel(
            id='123',
            created_on=self.year_ago,
            last_updated=self.now)

        self.assertTrue(
            errors.ModelInvalidIdError(self.model).__eq__(
                errors.ModelInvalidIdError(model_two)))

    def test_ne_when_classes_are_same(self):
        model_two = MockModel(
            id='123',
            created_on=self.year_ago,
            last_updated=self.now)

        self.assertFalse(
            errors.ModelInvalidIdError(self.model).__ne__(
                errors.ModelInvalidIdError(model_two)))

    def test_hash(self):
        test_err = errors.ModelInvalidIdError(self.model)
        expected_hash = hash((
            test_err.__class__, test_err.key, test_err.message))
        self.assertEqual(test_err.__hash__(), expected_hash)


class ModelTimestampRelationshipErrorTests(ValidatorErrorTestBase):
    def test_model_timestamp_relationship_error(self):
        model = MockModel(
            id='123',
            created_on=self.now,
            last_updated=self.year_ago)
        error = errors.ModelTimestampRelationshipError(model)

        msg = (
            'Entity id %s: The created_on field has a value %s which '
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

        days = cron_services.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days
        msg = (
            'Entity id %s: Model marked as deleted is older than %s days'
            % (model.id, days))

        self.assertEqual(error.message, msg)


class ModelInvalidCommitStatusTests(ValidatorErrorTestBase):
    def test_model_invalid_commit_status(self):
        model1 = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.year_ago,
            last_updated=self.now,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='private',
            post_commit_is_private=False,
            commit_cmds=[])
        error1 = errors.ModelInvalidCommitStatusError(model1)
        model2 = base_models.BaseCommitLogEntryModel(
            id=124,
            created_on=self.year_ago,
            last_updated=self.now,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='public',
            post_commit_is_private=True,
            commit_cmds=[])
        error2 = errors.ModelInvalidCommitStatusError(model2)
        msg1 = (
            'Entity id %s: Post commit status is private but '
            'post_commit_is_private is False' % model1.id)
        msg2 = (
            'Entity id %s: Post commit status is public but '
            'post_commit_is_private is True' % model2.id)
        self.assertEqual(error1.message, msg1)
        self.assertEqual(error2.message, msg2)
