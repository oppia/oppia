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
from jobs.types import user_model_errors
import python_utils

(base_models, user_models, topic_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user, models.NAMES.topic])

datastore_services = models.Registry.import_datastore_services()


class FooModel(base_models.BaseModel):
    """A model with an id property targeting a BarModel."""

    bar_id = datastore_services.StringProperty()


class BarModel(base_models.BaseModel):
    """A model with a simple string property named "value"."""

    value = datastore_services.StringProperty()


class FooError(user_model_errors.BaseAuditError):
    """A simple test-only error."""

    def __init__(self, model):
        super(FooError, self).__init__(model)
        self.message = 'foo'


class BarError(user_model_errors.BaseAuditError):
    """A simple test-only error."""

    def __init__(self, model):
        super(BarError, self).__init__(model)
        self.message = 'bar'


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

        self.assertEqual(
            error.message, 'FooError in BaseModel(id=\'123\'): foo')

    def test_message_raises_not_implemented_error_if_not_assigned_a_value(self):
        class ErrorWithoutMessage(user_model_errors.BaseAuditError):
            """Subclass that does not assign a value to self.message."""

            pass

        error = ErrorWithoutMessage(self.model)

        self.assertRaisesRegexp(
            NotImplementedError,
            'self.message must be assigned a value in __init__',
            lambda: error.message)

    def test_message_raises_type_error_if_reassigned_a_value(self):
        class ErrorWithUpdateMessageMethod(user_model_errors.BaseAuditError):
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
            'ErrorWithUpdateMessageMethod in BaseModel(id=\'123\'): initial '
            'message')
        self.assertRaisesRegexp(
            TypeError, 'self.message must be assigned to exactly once',
            error.update_message)
        self.assertEqual(
            error.message,
            'ErrorWithUpdateMessageMethod in BaseModel(id=\'123\'): initial '
            'message')

    def test_message_raises_type_error_if_assigned_a_non_string_value(self):
        class ErrorWithIntMessage(user_model_errors.BaseAuditError):
            """Subclass that tries to assign an int value to self.message."""

            def __init__(self, model):
                super(ErrorWithIntMessage, self).__init__(model)
                self.message = 123

        self.assertRaisesRegexp(
            TypeError, 'self.message must be a string',
            lambda: ErrorWithIntMessage(self.model))

    def test_message_raises_value_error_if_assigned_an_empty_value(self):
        class ErrorWithEmptyMessage(user_model_errors.BaseAuditError):
            """Subclass that tries to assign an empty value to self.message."""

            def __init__(self, model):
                super(ErrorWithEmptyMessage, self).__init__(model)
                self.message = ''

        self.assertRaisesRegexp(
            ValueError, 'self.message must be a non-empty string',
            lambda: ErrorWithEmptyMessage(self.model))

    def test_str(self):
        self.assertEqual(
            repr(FooError(self.model)),
            'u"FooError in BaseModel(id=\'123\'): foo"')
        self.assertEqual(
            python_utils.UNICODE(FooError(self.model)),
            'u"FooError in BaseModel(id=\'123\'): foo"')

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

    def test_pickling_base_class_raises_not_implemented_error(self):
        self.assertRaisesRegexp(
            NotImplementedError,
            'self.message must be assigned a value in __init__',
            lambda: pickle.dumps(user_model_errors.BaseAuditError(self.model)))

    def test_pickling_sub_classes(self):
        foo_error, bar_error = FooError(self.model), BarError(self.model)

        pickled_foo_error, pickled_bar_error = (
            pickle.dumps(foo_error), pickle.dumps(bar_error))
        unpickled_foo_error, unpickled_bar_error = (
            pickle.loads(pickled_foo_error), pickle.loads(pickled_bar_error))

        self.assertEqual(foo_error, unpickled_foo_error)
        self.assertEqual(bar_error, unpickled_bar_error)
        self.assertNotEqual(unpickled_foo_error, unpickled_bar_error)


class ModelExpiringErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = user_models.UserQueryModel(
            id='test',
            submitter_id='submitter',
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO
        )
        error = user_model_errors.ModelExpiringError(model)

        self.assertEqual(
            error.message,
            'ModelExpiringError in UserQueryModel(id=\'test\'): mark model '
            'as deleted when older than %s days' % (
                feconf.PERIOD_TO_MARK_MODELS_AS_DELETED.days))


class ModelIncorrectKeyErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = user_models.PendingDeletionRequestModel(
            id='test'
        )
        incorrect_keys = ['incorrect key']
        error = user_model_errors.ModelIncorrectKeyError(model, incorrect_keys)

        self.assertEqual(
            error.message,
            'ModelIncorrectKeyError in PendingDeletionRequestModel'
            '(id=\'test\'): contains keys %s are not allowed' %
            incorrect_keys)


class ModelIdRegexErrorTests(AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='?!"',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        error = user_model_errors.ModelIdRegexError(model, '[abc]{3}')

        self.assertEqual(
            error.message,
            'ModelIdRegexError in BaseModel(id=\'?!"\'): id does not '
            'match the expected regex=u\'[abc]{3}\'')


class DraftChangeListLastUpdatedNoneErrorTests(AuditErrorsTestBase):

    def test_message(self):
        draft_change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }]
        model = user_models.ExplorationUserDataModel(
            id='123',
            user_id='test',
            exploration_id='exploration_id',
            draft_change_list=draft_change_list,
            draft_change_list_last_updated=None,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO
        )
        error = user_model_errors.DraftChangeListLastUpdatedNoneError(model)

        self.assertEqual(
            error.message,
            'DraftChangeListLastUpdatedNoneError in ExplorationUserDataModel'
            '(id=\'123\'): draft change list %s exists but draft change list '
            'last updated is None' % draft_change_list)


class DraftChangeListLastUpdatedInvalidErrorTests(AuditErrorsTestBase):

    def test_message(self):
        draft_change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }]
        last_updated = self.NOW + datetime.timedelta(days=5)
        model = user_models.ExplorationUserDataModel(
            id='123',
            user_id='test',
            exploration_id='exploration_id',
            draft_change_list=draft_change_list,
            draft_change_list_last_updated=last_updated,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW
        )
        error = user_model_errors.DraftChangeListLastUpdatedInvalidError(model)

        self.assertEqual(
            error.message,
            'DraftChangeListLastUpdatedInvalidError in '
            'ExplorationUserDataModel(id=\'123\'): draft change list last '
            'updated %s is greater than the time when job was run' %
            last_updated)
