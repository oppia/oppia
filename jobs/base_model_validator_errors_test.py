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

from core.platform import models
from core.tests import test_utils
import feconf
from jobs import base_model_validator_errors as errors
from jobs import jobs_utils

base_models, user_models = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))


class FooError(errors.ModelValidationError):
    """A simple error subclass with a distinct type."""

    def __init__(self, model):
        super(FooError, self).__init__(model)
        self.message = 'foo'


class BarError(errors.ModelValidationError):
    """A simple error subclass with a distinct type."""

    def __init__(self, model):
        super(BarError, self).__init__(model)
        self.message = 'bar'


class ValidatorErrorTestBase(test_utils.TestBase):
    """Base class for validator error tests."""

    NOW = datetime.datetime.utcnow()
    YEAR_AGO = NOW - datetime.timedelta(weeks=52)
    YEAR_LATER = NOW + datetime.timedelta(weeks=52)


class ModelValidationErrorTests(ValidatorErrorTestBase):

    def setUp(self):
        self.model = base_models.BaseModel(id='123')

    def test_message_raises_not_implemented_error_if_not_assigned_a_value(self):
        class ErrorWithoutMessage(errors.ModelValidationError):
            """Subclass that does not assign a value to self.message."""

            pass

        self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses must assign to self.message in __init__',
            lambda: ErrorWithoutMessage(self.model).message)

    def test_message_raises_value_error_if_assigned_an_empty_value(self):
        class ErrorWithEmptyMessage(errors.ModelValidationError):
            """Subclass that assigns an empty value to self.message."""

            def __init__(self, model):
                super(ErrorWithEmptyMessage, self).__init__(model)
                self.message = ''

        self.assertRaisesRegexp(
            ValueError, 'self.message must have a non-empty value',
            lambda: ErrorWithEmptyMessage(self.model))

    def test_repr(self):
        self.assertEqual(
            repr(FooError(self.model)), 'FooError in BaseModel(id="123"): foo')

    def test_equality_with_different_type(self):
        self.assertNotEqual(FooError(self.model), BarError(self.model))

    def test_equality_with_same_type_and_same_value(self):
        self.assertEqual(
            FooError(self.model),
            FooError(jobs_utils.clone_model(self.model)))

    def test_equality_with_same_type_and_different_value(self):
        self.assertNotEqual(
            FooError(self.model),
            FooError(jobs_utils.clone_model(self.model, id='987')))

    def test_hashable(self):
        set_of_errors = {
            FooError(self.model),
            FooError(jobs_utils.clone_model(self.model)),
        }
        self.assertEqual(len(set_of_errors), 1)


class ModelTimestampRelationshipErrorTests(ValidatorErrorTestBase):

    def test_model_timestamp_relationship_error(self):
        model = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)
        error = errors.ModelTimestampRelationshipError(model)

        self.assertEqual(
            error.message,
            'BaseModel(id="123"): created_on=%r is later than '
            'last_updated=%r' % (self.NOW, self.YEAR_AGO))


class ModelInvalidCommitStatusTests(ValidatorErrorTestBase):

    def test_model_with_invalid_post_commit_status_when_private(self):
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='private',
            post_commit_is_private=False,
            commit_cmds=[])
        error = errors.ModelInvalidCommitStatusError(model)

        self.assertEqual(
            error.message,
            'BaseCommitLogEntryModel(id="%s"): post_commit_status="private" '
            'but post_commit_is_private=False' % model.id)

    def test_model_with_invalid_post_commit_status_when_public(self):
        model = base_models.BaseCommitLogEntryModel(
            id=124,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='public',
            post_commit_is_private=True,
            commit_cmds=[])
        error = errors.ModelInvalidCommitStatusError(model)

        self.assertEqual(
            error.message,
            'BaseCommitLogEntryModel(id="%s"): post_commit_status="public" '
            'but post_commit_is_private=True' % model.id)


class ModelMutatedDuringJobErrorTests(ValidatorErrorTestBase):

    def test_model_mutated_during_job_error(self):
        model = base_models.BaseModel(
            id='124',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)
        error = errors.ModelMutatedDuringJobError(model)

        self.assertEqual(
            error.message,
            'BaseModel(id="%s"): last_updated=%r is later than the job\'s '
            'start time' % (
                model.id, model.last_updated))


class ModelInvalidIdErrorTests(ValidatorErrorTestBase):

    def test_model_invalid_id_error(self):
        model = base_models.BaseModel(
            id='123@?!*',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        error = errors.ModelInvalidIdError(model, 'abc')

        self.assertEqual(
            error.message,
            'BaseModel(id="%s"): id does not match the expected regex=%r' % (
                model.id, 'abc'))


class ModelExpiredErrorTests(ValidatorErrorTestBase):

    def test_model_expired_error(self):
        model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        error = errors.ModelExpiredError(model)

        self.assertEqual(
            error.message,
            'BaseModel(id="%s"): deleted=True and model is older than %s '
            'days' % (
                model.id,
                feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days))
