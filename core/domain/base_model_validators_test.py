# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.base_model_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import re

from constants import constants
from core import jobs_registry
from core.domain import base_model_validators
from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])


class MockModel(base_models.BaseModel):
    pass


class MockSnapshotModel(base_models.BaseModel):
    commit_type = 'edit'
    commit_cmds = []


class MockBaseModelValidator(base_model_validators.BaseModelValidator):
    pass


class MockModelValidatorWithInvalidValidationType(
        base_model_validators.BaseModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _get_model_domain_object_instance(cls, unused_item):
        return MockModel()

    @classmethod
    def _get_domain_object_validation_type(cls, unused_item):
        return 'Invalid'


class MockSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []


class MockSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []


class MockSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):

    EXTERNAL_MODEL_NAME = 'external model'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'external_model_ids', MockModel, [])]


class MockBaseUserModelValidator(
        base_model_validators.BaseUserModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class MockCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    pass


class MockCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):

    EXTERNAL_MODEL_NAME = 'mockmodel'

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('mock'):
            return MockCommitLogEntryModel
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False
            )]


class BaseValidatorTests(test_utils.AuditJobsTestBase):

    USER_ID = 'uid_%s' % ('a' * 32)

    def setUp(self):
        super(BaseValidatorTests, self).setUp()
        self.invalid_model = MockModel(id='mockmodel')
        self.invalid_model.update_timestamps()
        self.invalid_model.put()

    def test_error_is_raised_if_fetch_external_properties_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'The _get_external_id_relationships() method is missing '
                'from the derived class. It should be implemented in the '
                'derived class.')):
            MockBaseModelValidator().validate(self.invalid_model)

    def test_error_is_get_external_model_properties_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'The _get_external_model_properties() method is missing '
                'from the derived class. It should be implemented in the '
                'derived class.')):
            MockSummaryModelValidator().validate(self.invalid_model)

    def test_error_is_raised_if_external_model_name_is_undefined(self):
        with self.assertRaisesRegexp(
            Exception, 'External model name should be specified'):
            MockSnapshotContentModelValidator().validate(self.invalid_model)

    def test_error_is_raised_if_get_change_domain_class_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'The _get_change_domain_class() method is missing from the '
                'derived class. It should be implemented in the '
                'derived class.')):
            snapshot_model = MockSnapshotModel(id='mockmodel')
            snapshot_model.update_timestamps()
            snapshot_model.put()
            MockSnapshotMetadataModelValidator().validate(snapshot_model)

    def test_error_is_raised_if_entity_classes_to_map_over_is_undefined(self):
        job_class = (
            prod_validation_jobs_one_off.ProdValidationAuditOneOffJob)
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'The entity_classes_to_map_over() method is missing from '
                'the derived class. It should be implemented in the '
                'derived class.')):
            with self.swap(jobs_registry, 'ONE_OFF_JOB_MANAGERS', [job_class]):
                job_id = job_class.create_new()
                job_class.enqueue(job_id)

    def test_error_is_raised_with_invalid_validation_type_for_domain_objects(
            self):
        MockModelValidatorWithInvalidValidationType.validate(self.invalid_model)
        expected_errors = {
            'domain object check': [
                'Entity id mockmodel: Entity fails domain validation with '
                'the error Invalid validation type for domain object: Invalid']}
        self.assertEqual(
            MockModelValidatorWithInvalidValidationType.errors, expected_errors)

    def test_no_error_is_raised_for_base_user_model(self):
        user = MockModel(id='12345')
        user.update_timestamps()
        user.put()
        MockBaseUserModelValidator().validate(user)

    def test_validate_deleted_reports_error_for_old_deleted_model(self):
        year_ago = datetime.datetime.utcnow() - datetime.timedelta(weeks=52)
        model = MockModel(
            id='123',
            deleted=True,
            last_updated=year_ago
        )
        model.update_timestamps(update_last_updated_time=False)
        model.put()
        validator = MockBaseUserModelValidator()
        validator.validate_deleted(model)
        self.assertEqual(
            validator.errors,
            {
                'entity stale check': [
                    'Entity id 123: model marked as '
                    'deleted is older than 8 weeks'
                ]
            }
        )

    def test_external_model_fetcher_with_user_settings_raise_error(self):
        with self.assertRaisesRegexp(
            Exception,
            'When fetching instances of UserSettingsModel, please use ' +
            'UserSettingsModelFetcherDetails instead of ' +
            'ExternalModelFetcherDetails'):
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [
                    feconf.MIGRATION_BOT_USER_ID, self.USER_ID,
                    self.PSEUDONYMOUS_ID
                ]
            )

    def test_external_model_fetcher_with_invalid_id(self):
        external_model = base_model_validators.ExternalModelFetcherDetails(
            'mock_field', MockModel, ['', 'user-1']
        )
        self.assertItemsEqual(external_model.model_ids, ['user-1'])
        self.assertItemsEqual(
            external_model.model_id_errors,
            ['A model id in the field \'mock_field\' is empty'])

    def test_user_setting_model_fetcher_with_invalid_id(self):
        user_settings_model = (
            base_model_validators.UserSettingsModelFetcherDetails(
                'mock_field', ['User-1', self.USER_ID],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False
            ))
        self.assertItemsEqual(user_settings_model.model_ids, [self.USER_ID])
        self.assertItemsEqual(
            user_settings_model.model_id_errors,
            ['The user id User-1 in the field \'mock_field\' is invalid'])

    def test_user_setting_model_fetcher_with_system_id(self):
        user_settings_model = (
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [
                    feconf.MIGRATION_BOT_USER_ID, self.USER_ID],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False
            ))
        self.assertItemsEqual(user_settings_model.model_ids, [self.USER_ID])
        self.assertItemsEqual(
            user_settings_model.model_id_errors,
            ['The field \'committer_ids\' should not contain system IDs'])

    def test_error_raised_if_model_ids_contain_pseudonymous_ids(self):
        user_settings_model = (
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [self.PSEUDONYMOUS_ID, self.USER_ID],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False
            ))
        self.assertItemsEqual(user_settings_model.model_ids, [self.USER_ID])
        self.assertItemsEqual(
            user_settings_model.model_id_errors,
            ['The field \'committer_ids\' should not contain pseudonymous IDs'])

    def test_error_raised_when_fetching_external_model_with_system_ids(self):
        model = MockCommitLogEntryModel(
            id='mock-12345',
            user_id=feconf.MIGRATION_BOT_USER_ID,
            commit_cmds=[])
        model.update_timestamps()
        mock_validator = MockCommitLogEntryModelValidator()
        mock_validator.errors.clear()
        mock_validator.validate(model)
        self.assertDictContainsSubset(
            {
                'invalid ids in field': [
                    'Entity id mock-12345: '
                    'The field \'user_id\' should not contain system IDs'
                ]
            },
            mock_validator.errors
        )

    def test_error_raised_when_fetching_external_model_with_pseudo_ids(self):
        model = MockCommitLogEntryModel(
            id='mock-12345',
            user_id=self.PSEUDONYMOUS_ID,
            commit_cmds=[])
        model.update_timestamps()
        mock_validator = MockCommitLogEntryModelValidator()
        mock_validator.errors.clear()
        mock_validator.validate(model)
        self.assertDictContainsSubset(
            {
                'invalid ids in field': [
                    'Entity id mock-12345: '
                    'The field \'user_id\' should not contain pseudonymous IDs'
                ]
            },
            mock_validator.errors
        )

    def test_error_raised_when_user_id_is_invalid(self):
        model = MockCommitLogEntryModel(
            id='mock-12345',
            user_id='invalid_user_id',
            commit_cmds=[])
        model.update_timestamps()
        mock_validator = MockCommitLogEntryModelValidator()
        mock_validator.errors.clear()
        mock_validator.validate(model)
        self.assertDictContainsSubset(
            {
                'invalid ids in field': [
                    'Entity id mock-12345: '
                    'The user id invalid_user_id in the field \'user_id\' is '
                    'invalid'
                ]
            },
            mock_validator.errors
        )

    def test_error_raised_when_commit_message_large(self):
        model = MockCommitLogEntryModel(
            id='mock-12345',
            user_id=feconf.MIGRATION_BOT_USER_ID,
            commit_cmds=[],
            commit_message='a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1))
        model.update_timestamps()
        mock_validator = MockCommitLogEntryModelValidator()
        mock_validator.errors.clear()
        mock_validator.validate(model)
        self.assertDictContainsSubset(
            {
                'commit message check': [
                    'Entity id mock-12345: '
                    'Commit message larger than accepted length'
                ]
            },
            mock_validator.errors
        )
