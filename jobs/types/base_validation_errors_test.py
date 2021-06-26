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
from core.tests import test_utils as core_test_utils
import feconf
from jobs import job_utils
from jobs.types import base_validation_errors
from jobs.types import model_property

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class FooModel(base_models.BaseModel):
    """A model with an id property targeting a BarModel."""

    bar_id = datastore_services.StringProperty()


class BarModel(base_models.BaseModel):
    """A model with a simple string property named "value"."""

    value = datastore_services.StringProperty()


class FooError(base_validation_errors.BaseAuditError):
    """A simple test-only error."""

    def __init__(self, model):
        super(FooError, self).__init__('foo', model)


class BarError(base_validation_errors.BaseAuditError):
    """A simple test-only error."""

    def __init__(self, model):
        super(BarError, self).__init__('bar', model)


class AuditErrorsTestBase(core_test_utils.TestBase):
    """Base class for validator error tests."""

    NOW = datetime.datetime.utcnow()
    YEAR_AGO = NOW - datetime.timedelta(weeks=52)
    YEAR_LATER = NOW + datetime.timedelta(weeks=52)


class BaseAuditErrorTests(AuditErrorsTestBase):

    def setUp(self):
        super(BaseAuditErrorTests, self).setUp()
        self.model = base_models.BaseModel(id='123')

    def test_message(self):
        error = FooError(self.model)

        self.assertEqual(error.stderr, 'FooError in BaseModel(id="123"): foo')

    def test_stdout(self):
        error = FooError(self.model)

        self.assertEqual(error.stdout, '')

    def test_stderr(self):
        error = FooError(self.model)

        self.assertEqual(error.stderr, 'FooError in BaseModel(id="123"): foo')

    def test_message_raises_type_error_if_assigned_a_non_string_value(self):
        class ErrorWithIntMessage(base_validation_errors.BaseAuditError):
            """Subclass that tries to assign an int value to self.stderr."""

            def __init__(self, model):
                super(ErrorWithIntMessage, self).__init__(123, model)

        with self.assertRaisesRegexp(TypeError, 'must be a string'):
            ErrorWithIntMessage(self.model)

    def test_message_raises_value_error_if_assigned_an_empty_value(self):
        class ErrorWithEmptyMessage(base_validation_errors.BaseAuditError):
            """Subclass that tries to assign an empty value to self.stderr."""

            def __init__(self, model):
                super(ErrorWithEmptyMessage, self).__init__('', model)

        with self.assertRaisesRegexp(ValueError, 'must be a non-empty string'):
            ErrorWithEmptyMessage(self.model)

    def test_equality_between_different_types(self):
        self.assertNotEqual(FooError(self.model), BarError(self.model))

    def test_equality_between_same_types_and_same_values(self):
        self.assertEqual(
            FooError(self.model),
            FooError(job_utils.clone_model(self.model)))

    def test_equality_between_same_types_and_different_values(self):
        self.assertNotEqual(
            FooError(self.model),
            FooError(job_utils.clone_model(self.model, id='987')))

    def test_hashable(self):
        set_of_errors = {
            FooError(self.model),
            FooError(job_utils.clone_model(self.model)),
        }
        self.assertEqual(len(set_of_errors), 1)

    def test_pickling_sub_classes(self):
        foo_error, bar_error = FooError(self.model), BarError(self.model)

        pickled_foo_error, pickled_bar_error = (
            pickle.dumps(foo_error), pickle.dumps(bar_error))
        unpickled_foo_error, unpickled_bar_error = (
            pickle.loads(pickled_foo_error), pickle.loads(pickled_bar_error))

        self.assertEqual(foo_error, unpickled_foo_error)
        self.assertEqual(bar_error, unpickled_bar_error)
        self.assertNotEqual(unpickled_foo_error, unpickled_bar_error)


class InconsistentTimestampsErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)
        error = base_validation_errors.InconsistentTimestampsError(model)

        self.assertEqual(
            error.stderr,
            'InconsistentTimestampsError in BaseModel(id="123"): '
            'created_on=%r is later than last_updated=%r' % (
                self.NOW, self.YEAR_AGO))


class InvalidCommitStatusErrorTests(AuditErrorsTestBase):

    def test_message_for_invalid_post_commit_status(self):
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='invalid',
            post_commit_is_private=False,
            commit_cmds=[])
        error = base_validation_errors.InvalidCommitStatusError(model)
        self.assertEqual(
            error.stderr,
            'InvalidCommitStatusError in BaseCommitLogEntryModel(id="123"): '
            'post_commit_status is invalid')

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
        error = base_validation_errors.InvalidPrivateCommitStatusError(model)

        self.assertEqual(
            error.stderr,
            'InvalidPrivateCommitStatusError in '
            'BaseCommitLogEntryModel(id="123"): post_commit_status=private '
            'but post_commit_is_private=False')

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
        error = base_validation_errors.InvalidPrivateCommitStatusError(model)

        self.assertEqual(
            error.stderr,
            'InvalidPrivateCommitStatusError in '
            'BaseCommitLogEntryModel(id="123"): post_commit_status=public '
            'but post_commit_is_private=True')

    def test_message_for_public_post_commit_status_raise_exception(self):
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='create',
            user_id='',
            post_commit_status='public',
            post_commit_community_owned=False,
            commit_cmds=[])
        error = base_validation_errors.InvalidPublicCommitStatusError(model)

        self.assertEqual(
            error.stderr,
            'InvalidPublicCommitStatusError in '
            'BaseCommitLogEntryModel(id="123"): post_commit_status=public '
            'but post_commit_community_owned=False')


class ModelMutatedDuringJobErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)
        error = base_validation_errors.ModelMutatedDuringJobError(model)

        self.assertEqual(
            error.stderr,
            'ModelMutatedDuringJobError in BaseModel(id="123"): '
            'last_updated=%r is later than the audit job\'s start time' % (
                model.last_updated))


class ModelIdRegexErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='?!"',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        error = base_validation_errors.ModelIdRegexError(model, '[abc]{3}')

        self.assertEqual(
            error.stderr,
            'ModelIdRegexError in BaseModel(id="?!\\""): id does not '
            'match the expected regex="[abc]{3}"')


class ModelExpiredErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        error = base_validation_errors.ModelExpiredError(model)

        self.assertEqual(
            error.stderr,
            'ModelExpiredError in BaseModel(id="123"): deleted=True when '
            'older than %d days' % (
                feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days))


class ModelDomainObjectValidateErrorTests(AuditErrorsTestBase):

    def test_model_domain_object_validate_error(self):
        model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        error_message = 'Invalid validation type for domain object: Invalid'

        error = base_validation_errors.ModelDomainObjectValidateError(
            model, error_message)

        msg = (
            'ModelDomainObjectValidateError in BaseModel(id="123"): Entity'
            ' fails domain validation with the error: %s' % error_message)

        self.assertEqual(error.stderr, msg)


class InvalidCommitTypeErrorTests(AuditErrorsTestBase):

    def test_model_invalid_id_error(self):
        model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='',
            commit_cmds=[])
        error = base_validation_errors.InvalidCommitTypeError(model)

        self.assertEqual(
            error.stderr,
            'InvalidCommitTypeError in BaseCommitLogEntryModel(id="123"): '
            'Commit type invalid-type is not allowed')


class ModelRelationshipErrorTests(AuditErrorsTestBase):

    def test_message(self):
        error = base_validation_errors.ModelRelationshipError(
            model_property.ModelProperty(FooModel, FooModel.bar_id), '123',
            'BarModel', '123')

        self.assertEqual(
            error.stderr,
            'ModelRelationshipError in FooModel(id="123"): '
            'FooModel.bar_id="123" should correspond to the ID of an '
            'existing BarModel, but no such model exists')


class CommitCmdsNoneErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseCommitLogEntryModel(
            id='invalid',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{}])
        error = base_validation_errors.CommitCmdsNoneError(model)

        self.assertEqual(
            error.stderr,
            'CommitCmdsNoneError in BaseCommitLogEntryModel(id="invalid"): '
            'No commit command domain object '
            'defined for entity with commands: [{}]')


class CommitCmdsValidateErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseCommitLogEntryModel(
            id='invalid',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{'cmd-invalid': 'invalid_test_command'}])
        error_message = 'Missing cmd key in change dict'
        error = base_validation_errors.CommitCmdsValidateError(
            model, {'cmd-invalid': 'invalid_test_command'},
            error_message)

        self.assertEqual(
            error.stderr,
            'CommitCmdsValidateError in BaseCommitLogEntryModel'
            '(id="invalid"): Commit command domain validation for '
            'command: {u\'cmd-invalid\': u\'invalid_test_command\'} failed '
            'with error: Missing cmd key in change dict')
