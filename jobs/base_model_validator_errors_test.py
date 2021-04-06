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
import pickle

from core.platform import models
from core.tests import test_utils
import feconf
from jobs import base_model_validator_errors as errors
from jobs import jobs_utils
import python_utils

base_models, user_models = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))


class FooError(errors.ModelValidationErrorBase):
    """A simple test-only error."""

    def __init__(self, model):
        super(FooError, self).__init__(model)
        self.message = 'foo'


class BarError(errors.ModelValidationErrorBase):
    """A simple test-only error."""

    def __init__(self, model):
        super(BarError, self).__init__(model)
        self.message = 'bar'


class ModelValidatorErrorTestBase(test_utils.TestBase):
    """Base class for validator error tests."""

    NOW = datetime.datetime.utcnow()
    YEAR_AGO = NOW - datetime.timedelta(weeks=52)
    YEAR_LATER = NOW + datetime.timedelta(weeks=52)


class ModelValidationErrorBaseTests(ModelValidatorErrorTestBase):

    def setUp(self):
        super(ModelValidationErrorBaseTests, self).setUp()
        self.model = base_models.BaseModel(id='123')

    def test_message(self):
        error = FooError(self.model)

        self.assertEqual(error.message, 'FooError in BaseModel(id="123"): foo')

    def test_message_raises_not_implemented_error_if_not_assigned_a_value(self):
        class ErrorWithoutMessage(errors.ModelValidationErrorBase):
            """Subclass that does not assign a value to self.message."""

            pass

        error = ErrorWithoutMessage(self.model)

        self.assertRaisesRegexp(
            NotImplementedError,
            'self.message must be assigned a value in __init__',
            lambda: error.message)

    def test_message_raises_type_error_if_reassigned_a_value(self):
        class ErrorWithUpdateMessageMethod(errors.ModelValidationErrorBase):
            """Subclass that tries to reassign to self.message in a method."""

            def __init__(self, model):
                super(ErrorWithUpdateMessageMethod, self).__init__(model)
                self.message = 'initial message'

            def update_message(self):
                """Tries to reassign self.message."""
                self.message = 'updated message'

        error = ErrorWithUpdateMessageMethod(self.model)

        self.assertEqual(
            error.message,
            'ErrorWithUpdateMessageMethod in BaseModel(id="123"): initial '
            'message')
        self.assertRaisesRegexp(
            TypeError, 'self.message must be assigned to exactly once',
            error.update_message)
        self.assertEqual(
            error.message,
            'ErrorWithUpdateMessageMethod in BaseModel(id="123"): initial '
            'message')

    def test_message_raises_type_error_if_assigned_a_non_string_value(self):
        class ErrorWithIntMessage(errors.ModelValidationErrorBase):
            """Subclass that tries to assign an int value to self.message."""

            def __init__(self, model):
                super(ErrorWithIntMessage, self).__init__(model)
                self.message = 123

        self.assertRaisesRegexp(
            TypeError, 'self.message must be a string',
            lambda: ErrorWithIntMessage(self.model))

    def test_message_raises_value_error_if_assigned_an_empty_value(self):
        class ErrorWithEmptyMessage(errors.ModelValidationErrorBase):
            """Subclass that tries to assign an empty value to self.message."""

            def __init__(self, model):
                super(ErrorWithEmptyMessage, self).__init__(model)
                self.message = ''

        self.assertRaisesRegexp(
            ValueError, 'self.message must be a non-empty string',
            lambda: ErrorWithEmptyMessage(self.model))

    def test_str(self):
        self.assertEqual(
            repr(FooError(self.model)), 'FooError in BaseModel(id="123"): foo')
        self.assertEqual(
            python_utils.UNICODE(FooError(self.model)),
            'FooError in BaseModel(id="123"): foo')

    def test_equality_between_different_types(self):
        self.assertNotEqual(FooError(self.model), BarError(self.model))

    def test_equality_between_same_types_and_same_values(self):
        self.assertEqual(
            FooError(self.model),
            FooError(jobs_utils.clone_model(self.model)))

    def test_equality_between_same_types_and_different_values(self):
        self.assertNotEqual(
            FooError(self.model),
            FooError(jobs_utils.clone_model(self.model, id='987')))

    def test_hashable(self):
        set_of_errors = {
            FooError(self.model),
            FooError(jobs_utils.clone_model(self.model)),
        }
        self.assertEqual(len(set_of_errors), 1)

    def test_pickling_base_class_raises_not_implemented_error(self):
        self.assertRaisesRegexp(
            NotImplementedError,
            'self.message must be assigned a value in __init__',
            lambda: pickle.dumps(errors.ModelValidationErrorBase(self.model)))

    def test_pickling_sub_classes(self):
        foo_error, bar_error = FooError(self.model), BarError(self.model)

        pickled_foo_error, pickled_bar_error = (
            pickle.dumps(foo_error), pickle.dumps(bar_error))
        unpickled_foo_error, unpickled_bar_error = (
            pickle.loads(pickled_foo_error), pickle.loads(pickled_bar_error))

        self.assertEqual(foo_error, unpickled_foo_error)
        self.assertEqual(bar_error, unpickled_bar_error)
        self.assertNotEqual(unpickled_foo_error, unpickled_bar_error)


class InconsistentTimestampsErrorTests(ModelValidatorErrorTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)
        error = errors.InconsistentTimestampsError(model)

        self.assertEqual(
            error.message,
            'InconsistentTimestampsError in BaseModel(id="123"): created_on=%r '
            'is later than last_updated=%r' % (self.NOW, self.YEAR_AGO))


class InvalidCommitStatusErrorTests(ModelValidatorErrorTestBase):

    def test_message_for_private_post_commit_status(self):
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='private',
            post_commit_is_private=False,
            commit_cmds=[])
        error = errors.InvalidCommitStatusError(model)

        self.assertEqual(
            error.message,
            'InvalidCommitStatusError in BaseCommitLogEntryModel(id="123"): '
            'post_commit_status="private" but post_commit_is_private=False')

    def test_message_for_public_post_commit_status(self):
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='public',
            post_commit_is_private=True,
            commit_cmds=[])
        error = errors.InvalidCommitStatusError(model)

        self.assertEqual(
            error.message,
            'InvalidCommitStatusError in BaseCommitLogEntryModel(id="123"): '
            'post_commit_status="public" but post_commit_is_private=True')


class ModelMutatedDuringJobErrorTests(ModelValidatorErrorTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)
        error = errors.ModelMutatedDuringJobError(model)

        self.assertEqual(
            error.message,
            'ModelMutatedDuringJobError in BaseModel(id="123"): '
            'last_updated=%r is later than the validation job\'s start time' % (
                model.last_updated))


class InvalidIdErrorTests(ModelValidatorErrorTestBase):

    def test_message(self):
        regex = '[a-z0-9]+'
        model = base_models.BaseModel(
            id='?!"',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        error = errors.InvalidIdError(model, regex)

        self.assertEqual(
            error.message,
            r'InvalidIdError in BaseModel(id="?!\""): id does not match the '
            r'expected regex="[a-z0-9]+"')


class ModelExpiredErrorTests(ModelValidatorErrorTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        error = errors.ModelExpiredError(model)

        self.assertEqual(
            error.message,
            'ModelExpiredError in BaseModel(id="123"): deleted=True when older '
            'than %d days' % (
                feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days))


class MissingCommitCommandDomainObjErrorTests(ModelValidatorErrorTestBase):

    def test_message(self):
        # define a model
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='private',
            post_commit_is_private=False,
            commit_cmds=[])
        error = errors.MissingCommitCommandDomainObjError(model)

        # assert equal to the expected error
        self.assertEqual(
            error.message,
            'Entity id 123: No commit command domain object defined '
            'for entity with commands: []')        


class CommitCommandValidationFailedErrorTests(ModelValidatorErrorTestBase):

    def test_message(self):
        # define a model
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='private',
            post_commit_is_private=False,
            commit_cmds=[])
        error = errors.CommitCommandValidationFailedError(model)

        # assert equal to the expected error
        self.assertEqual(
            error.message,
            'commit cmd [] check'
            'Entity id 123: Commit command domain validation for '
            'command: [what] failed with error: what ? ')        
