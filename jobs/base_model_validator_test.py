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

"""Unit tests for BaseModelValidator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
import feconf
from jobs import base_model_validator
from jobs import base_model_validator_errors as errors
from jobs import jobs_test_utils

import apache_beam as beam

base_models, user_models = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))

datastore_services = models.Registry.import_datastore_services()


class BaseModelValidatorTestBase(jobs_test_utils.BeamTestBase):
    """Test base for base_model_validator jobs with helpful constants."""

    NOW = datetime.datetime.utcnow()
    YEAR_AGO = NOW - datetime.timedelta(weeks=52)
    YEAR_LATER = NOW + datetime.timedelta(weeks=52)

class MockDomainObject(base_models.BaseModel):

    def validate(self, strict=True):
        """Mock validate function."""
        pass


class MockCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    pass


class MockBaseModelValidator(base_model_validator.BaseModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []


class MockModelValidator(
        base_model_validator.BaseModelValidator):
    pass


class BaseModelValidatorTests(BaseModelValidatorTestBase):

    def test_base_model_validator_ptransform(self):
        model_with_invalid_id = base_models.BaseModel(
            id='123@?!*',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        model_with_invalid_timestamp = base_models.BaseModel(
            id='124',
            deleted=False,
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)
        expired_model = base_models.BaseModel(
            id='125',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)
        valid_model = base_models.BaseModel(
            id='126',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([
                model_with_invalid_id,
                model_with_invalid_timestamp,
                expired_model,
                valid_model,
            ])
            | MockBaseModelValidator()
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidIdError(
                model_with_invalid_id,
                base_model_validator.DEFAULT_ID_REGEX_STRING),
            errors.ModelMutatedDuringJobError(model_with_invalid_timestamp),
            errors.ModelExpiredError(expired_model),
        ])
    
    def test_error_is_raised_if_fetch_external_properties_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            r'The _get_external_id_relationships\(\) method is missing from'
            ' the derived class. It should be implemented in the derived'
            ' class.'):
            MockModelValidator()._get_external_id_relationships(None) # pylint: disable=protected-access


class BaseValidatorTests(BaseModelValidatorTestBase):

    USER_ID = 'uid_%s' % ('a' * 32)
    PSEUDONYMOUS_ID = 'pid_%s' % ('a' * 32)

    def test_external_model_fetcher_with_user_settings_raise_error(self):
        with self.assertRaisesRegexp(
            Exception,
            'When fetching instances of UserSettingsModel, please use ' +
            'UserSettingsModelFetcherDetails instead of ' +
            'ExternalModelFetcherDetails'):
            base_model_validator.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [
                    feconf.MIGRATION_BOT_USER_ID, self.USER_ID,
                    self.PSEUDONYMOUS_ID
                ]
            )

    def test_external_model_fetcher_with_invalid_id(self):
        external_model = base_model_validator.ExternalModelFetcherDetails(
            'mock_field', base_models.BaseModel, ['', 'user-1']
        )
        self.assertItemsEqual(external_model.model_ids, ['user-1'])
        self.assertItemsEqual(
            external_model.model_id_errors,
            ['A model id in the field \'mock_field\' is empty'])

    def test_user_setting_model_fetcher_with_invalid_id(self):
        user_settings_model = (
            base_model_validator.UserSettingsModelFetcherDetails(
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
            base_model_validator.UserSettingsModelFetcherDetails(
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
            base_model_validator.UserSettingsModelFetcherDetails(
                'committer_ids', [self.PSEUDONYMOUS_ID, self.USER_ID],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False
            ))
        self.assertItemsEqual(user_settings_model.model_ids, [self.USER_ID])
        self.assertItemsEqual(
            user_settings_model.model_id_errors,
            ['The field \'committer_ids\' should not contain pseudonymous IDs'])


class ValidateDeletedTests(BaseModelValidatorTestBase):

    def test_process_reports_error_for_old_deleted_model(self):
        expired_model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([expired_model])
            | beam.ParDo(base_model_validator.ValidateDeletedModel())
        )

        self.assert_pcoll_equal(output, [
            errors.ModelExpiredError(expired_model),
        ])


class ValidateModelTimeFieldTests(BaseModelValidatorTestBase):

    def test_process_reports_model_timestamp_relationship_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_model_validator.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            errors.InconsistentTimestampsError(invalid_timestamp),
        ])

    def test_process_reports_model_mutated_during_job_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='124',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_model_validator.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            errors.ModelMutatedDuringJobError(invalid_timestamp),
        ])


class ValidateModelIdTests(BaseModelValidatorTestBase):

    def test_validate_model_id(self):
        invalid_id_model = base_models.BaseModel(
            id='123@?!*',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([invalid_id_model])
            | beam.ParDo(
                base_model_validator.ValidateModelIdWithRegex(),
                base_model_validator.DEFAULT_ID_REGEX_STRING)
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidIdError(
                invalid_id_model, base_model_validator.DEFAULT_ID_REGEX_STRING),
        ])


class ValidatePostCommitIsPrivateTests(BaseModelValidatorTestBase):

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
            | beam.ParDo(base_model_validator.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidCommitStatusError(invalid_commit_status),
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
            | beam.ParDo(base_model_validator.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            errors.InvalidCommitStatusError(invalid_commit_status),
        ])

class ValidateModelDomainObjectInstancesTests(BaseModelValidatorTests):

    def test_error_is_raised_with_neutral_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_neutral_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'neutral'

        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_model_validator.ValidateModelDomainObjectInstances(),
                mock_get_model_domain_object,
                mock_get_domain_object_neutral_validation_type))

        self.assert_pcoll_equal(output, [])

    def test_error_is_raised_with_strict_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_strict_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'strict'

        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_model_validator.ValidateModelDomainObjectInstances(),
                mock_get_model_domain_object,
                mock_get_domain_object_strict_validation_type))

        self.assert_pcoll_equal(output, [])

    def test_error_is_raised_with_non_strict_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_non_strict_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'non-strict'

        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_model_validator.ValidateModelDomainObjectInstances(),
                mock_get_model_domain_object,
                mock_get_domain_object_non_strict_validation_type))

        self.assert_pcoll_equal(output, [])

    def test_error_is_raised_with_invalid_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_invalid_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'Invalid'

        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_model_validator.ValidateModelDomainObjectInstances(),
                mock_get_model_domain_object,
                mock_get_domain_object_invalid_validation_type))

        self.assert_pcoll_equal(output, [
            errors.ModelDomainObjectValidateError(
                model, 'Invalid validation type for domain object: Invalid')
        ])


class ValidateIdsInModelFieldsTests(BaseModelValidatorTests):
    def test_error_raised_when_fetching_external_model_with_system_ids(self):
        def _get_external_id_relationships(item):
            """Mock helper function to get external id relationships."""
            return [
                base_model_validator.UserSettingsModelFetcherDetails(
                    'user_id', [item.user_id],
                    may_contain_system_ids=False,
                    may_contain_pseudonymous_ids=False
                )]

        model = MockCommitLogEntryModel(
            id='mock-12345',
            user_id=feconf.MIGRATION_BOT_USER_ID,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_cmds=[],
            post_commit_status='public',
            commit_type='create')

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_model_validator.ValidateIdsInModelFields(),
                _get_external_id_relationships)
        )

        self.assert_pcoll_equal(output, [
            errors.IdsInModelFieldValidationError(
                model,
                'The field \'user_id\' should not contain system IDs')
        ])


class ValidateExternalIdRelationshipsTests(BaseModelValidatorTests):

    USER_ID = 'uid_%s' % ('a' * 32)

    def test_error_raised_when_external_model_does_not_exists(self):
        def _get_external_id_relationships(item):
            """Mock helper function to get external id relationships."""
            return [
                base_model_validator.UserSettingsModelFetcherDetails(
                    'user_id', [item.user_id],
                    may_contain_system_ids=False,
                    may_contain_pseudonymous_ids=False
                )]

        model = MockCommitLogEntryModel(
            id='mock-12345',
            user_id=self.USER_ID,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_cmds=[],
            post_commit_status='public',
            commit_type='create')

        model_and_field_name_and_external_model_references = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_model_validator.FetchFieldNameToExternalIdRelationships(), # pylint: disable=line-too-long
                _get_external_id_relationships))

        output = (
            model_and_field_name_and_external_model_references
            | beam.ParDo(
                base_model_validator.ValidateExternalIdRelationships()))

        self.assert_pcoll_equal(output, [
            errors.ModelFieldCheckValidateError(
                model, 'user_id', self.USER_ID, user_models.UserSettingsModel)
        ])

