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

"""Unit tests for user model validator errors."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
import feconf
from jobs.types import base_validation_errors
from jobs.types import base_validation_errors_test
from jobs.types import user_validation_errors

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class ModelExpiringErrorTests(base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self):
        model = user_models.UserQueryModel(
            id='test',
            submitter_id='submitter',
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO
        )
        error = user_validation_errors.ModelExpiringError(model)

        self.assertEqual(
            error.message,
            'ModelExpiringError in UserQueryModel(id=\'test\'): mark model '
            'as deleted when older than %s days' % (
                feconf.PERIOD_TO_MARK_MODELS_AS_DELETED.days))


class ModelIncorrectKeyErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self):
        model = user_models.PendingDeletionRequestModel(
            id='test'
        )
        incorrect_keys = ['incorrect key']
        error = user_validation_errors.ModelIncorrectKeyError(
            model, incorrect_keys)

        self.assertEqual(
            error.message,
            'ModelIncorrectKeyError in PendingDeletionRequestModel'
            '(id=\'test\'): contains keys %s are not allowed' %
            incorrect_keys)


class ModelIdRegexErrorTests(base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self):
        model = base_models.BaseModel(
            id='?!"',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        error = base_validation_errors.ModelIdRegexError(model, '[abc]{3}')

        self.assertEqual(
            error.message,
            'ModelIdRegexError in BaseModel(id=\'?!"\'): id does not '
            'match the expected regex=u\'[abc]{3}\'')


class DraftChangeListLastUpdatedNoneErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

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
        error = (
            user_validation_errors.
            DraftChangeListLastUpdatedNoneError(model))

        self.assertEqual(
            error.message,
            'DraftChangeListLastUpdatedNoneError in ExplorationUserDataModel'
            '(id=\'123\'): draft change list %s exists but draft change list '
            'last updated is None' % draft_change_list)


class DraftChangeListLastUpdatedInvalidErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

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
        error = (
            user_validation_errors.
            DraftChangeListLastUpdatedInvalidError(model))

        self.assertEqual(
            error.message,
            'DraftChangeListLastUpdatedInvalidError in '
            'ExplorationUserDataModel(id=\'123\'): draft change list last '
            'updated %s is greater than the time when job was run' %
            last_updated)


class ArchivedModelNotMarkedDeletedErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self):
        model = user_models.UserQueryModel(
            id='test',
            submitter_id='submitter',
            created_on=self.NOW,
            last_updated=self.NOW,
            query_status=feconf.USER_QUERY_STATUS_ARCHIVED
        )
        error = user_validation_errors.ArchivedModelNotMarkedDeletedError(model)

        self.assertEqual(
            error.message,
            'ArchivedModelNotMarkedDeletedError in '
            'UserQueryModel(id=\'test\'): model is archived '
            'but not marked as deleted')
