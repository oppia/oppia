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
import unittest

from core.platform import models
import feconf
from jobs import base_model_validator
from jobs import base_model_validator_errors as errors

import apache_beam as beam
from apache_beam.runners.direct import direct_runner
from apache_beam.testing import test_pipeline as pipeline
from apache_beam.testing import util as beam_testing_util

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class MockModel(base_models.BaseModel):
    pass


class MockDomainObject(base_models.BaseModel):

    def validate(self, strict=True):
        """Mock validate function."""
        pass


class MockCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    pass


class MockModelValidator(base_model_validator.BaseModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []


class MockBaseModelValidator(
        base_model_validator.BaseModelValidator):
    pass


class BaseModelValidatorTests(unittest.TestCase):

    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = self.now - datetime.timedelta(weeks=52)
        self.year_later = self.now + datetime.timedelta(weeks=52)

    def test_base_model_validator_ptransform(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_id = MockModel(
                id='123@?!*',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            invalid_timestamp = MockModel(
                id='124',
                deleted=False,
                created_on=self.now,
                last_updated=self.year_later)
            expired_model = MockModel(
                id='125',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago)
            valid_model = MockModel(
                id='126',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = (
                p
                | beam.Create([
                    invalid_id, invalid_timestamp, expired_model, valid_model
                ]))

            output = pcoll | MockModelValidator()

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidIdError(invalid_id),
                    errors.ModelMutatedDuringJobError(invalid_timestamp),
                    errors.ModelExpiredError(expired_model)
                ]))

    def test_error_is_raised_if_fetch_external_properties_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            r'The _get_external_id_relationships\(\) method is missing from'
            ' the derived class. It should be implemented in the derived'
            ' class.'):
            MockBaseModelValidator()._get_external_id_relationships(None) # pylint: disable=protected-access


class BaseValidatorTests(unittest.TestCase):

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
            'mock_field', MockModel, ['', 'user-1']
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


class ValidateDeletedTests(BaseModelValidatorTests):
    def test_process_reports_error_for_old_deleted_model(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            expired_model = MockModel(
                id='123',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago)
            pcoll = p | beam.Create([expired_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateDeleted()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelExpiredError(expired_model)
                ]))


class ValidateModelTimeFieldTests(BaseModelValidatorTests):
    def test_process_reports_model_timestamp_relationship_error(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_timestamp = MockModel(
                id='123',
                created_on=self.now,
                last_updated=self.year_ago)
            pcoll = p | beam.Create([invalid_timestamp])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelTimestampRelationshipError(invalid_timestamp)
                ]))

    def test_process_reports_model_mutated_during_job_error(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_timestamp = MockModel(
                id='124',
                created_on=self.now,
                last_updated=self.year_later)
            pcoll = p | beam.Create([invalid_timestamp])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelMutatedDuringJobError(invalid_timestamp)
                ]))


class ValidateModelIdTests(BaseModelValidatorTests):
    def test_validate_model_id(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_id_model = MockModel(
                id='123@?!*',
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = p | beam.Create([invalid_id_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelIdWithRegex(),
                    '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidIdError(invalid_id_model)
                ]))


class ValidateModelDomainObjectInstancesTests(BaseModelValidatorTests):
    def test_error_is_raised_with_neutral_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_neutral_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'neutral'

        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            model = MockModel(
                id='mock-123',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = p | beam.Create([model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelDomainObjectInstances(),
                    mock_get_model_domain_object,
                    mock_get_domain_object_neutral_validation_type))

            beam_testing_util.assert_that(
                output, beam_testing_util.equal_to([]))

    def test_error_is_raised_with_strict_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_strict_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'strict'

        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            model = MockModel(
                id='mock-123',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = p | beam.Create([model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelDomainObjectInstances(),
                    mock_get_model_domain_object,
                    mock_get_domain_object_strict_validation_type))

            beam_testing_util.assert_that(
                output, beam_testing_util.equal_to([]))

    def test_error_is_raised_with_non_strict_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_non_strict_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'non-strict'

        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            model = MockModel(
                id='mock-123',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = p | beam.Create([model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelDomainObjectInstances(),
                    mock_get_model_domain_object,
                    mock_get_domain_object_non_strict_validation_type))

            beam_testing_util.assert_that(
                output, beam_testing_util.equal_to([]))

    def test_error_is_raised_with_invalid_validation_type_for_domain_object(
            self):
        def mock_get_model_domain_object(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object."""
            return MockDomainObject()

        def mock_get_domain_object_invalid_validation_type(item): # pylint: disable=unused-argument
            """Mock helper function to get the domain object type."""
            return 'Invalid'

        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            model = MockModel(
                id='mock-123',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now)
            pcoll = p | beam.Create([model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelDomainObjectInstances(),
                    mock_get_model_domain_object,
                    mock_get_domain_object_invalid_validation_type))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelDomainObjectValidateError(
                        model,
                        'Invalid validation type for domain object: Invalid')
                ]))


class ValidateIdsInModelFieldsTests(BaseModelValidatorTests):
    def test_error_raised_when_fetching_external_model_with_system_ids(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
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
                created_on=self.year_ago,
                last_updated=self.now,
                commit_cmds=[],
                post_commit_status='public',
                commit_type='create')
            pcoll = p | beam.Create([model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateIdsInModelFields(),
                    _get_external_id_relationships)
            )

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.IdsInModelFieldValidationError(
                        model,
                        'The field \'user_id\' should not contain system IDs')
                ]))


class ValidateExternalIdRelationshipsTests(BaseModelValidatorTests):

    USER_ID = 'uid_%s' % ('a' * 32)

    def test_error_raised_when_external_model_does_not_exists(self):
        with pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
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
                created_on=self.year_ago,
                last_updated=self.now,
                commit_cmds=[],
                post_commit_status='public',
                commit_type='create')
            pcoll = p | beam.Create([model])

            model_and_field_name_and_external_model_references = (
                pcoll
                | beam.ParDo(
                    base_model_validator.FetchFieldNameToExternalIdRelationships(), # pylint: disable=line-too-long
                    _get_external_id_relationships))

            output = (
                model_and_field_name_and_external_model_references
                | beam.ParDo(
                    base_model_validator.ValidateExternalIdRelationships()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelFieldCheckValidateError(
                        model, 'user_id', self.USER_ID,
                        user_models.UserSettingsModel)
                ]))
