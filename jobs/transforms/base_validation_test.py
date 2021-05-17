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

"""Unit tests for jobs.transforms.base_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.domain import change_domain
from core.domain import exp_fetchers
from core.domain import state_domain
from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.transforms import base_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, exp_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration])


class MockDomainObject(base_models.BaseModel):

    def validate(self, strict=True):
        """Mock validate function."""
        pass


class ValidateDeletedTests(job_test_utils.PipelinedTestBase):

    def test_process_reports_error_for_old_deleted_model(self):
        expired_model = base_models.BaseModel(
            id='123',
            deleted=True,
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([expired_model])
            | beam.ParDo(base_validation.ValidateDeletedModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.ModelExpiredError(expired_model),
        ])


class ValidateModelTimeFieldTests(job_test_utils.PipelinedTestBase):

    def test_process_reports_model_timestamp_relationship_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='123',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_validation.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InconsistentTimestampsError(
                invalid_timestamp),
        ])

    def test_process_reports_model_mutated_during_job_error(self):
        invalid_timestamp = base_models.BaseModel(
            id='124',
            created_on=self.NOW,
            last_updated=self.YEAR_LATER)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(base_validation.ValidateModelTimestamps())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.ModelMutatedDuringJobError(
                invalid_timestamp),
        ])


class ValidateModelIdTests(job_test_utils.PipelinedTestBase):

    def test_validate_model_id(self):
        invalid_id_model = base_models.BaseModel(
            id='123@?!*',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([invalid_id_model])
            | beam.ParDo(base_validation.ValidateBaseModelId())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.ModelIdRegexError(
                invalid_id_model,
                base_validation.BASE_MODEL_ID_PATTERN),
        ])


class ValidatePostCommitIsInvalidTests(job_test_utils.PipelinedTestBase):

    def test_validate_post_commit_is_invalid(self):
        invalid_commit_status = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='invalid',
            post_commit_is_private=False,
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_status])
            | beam.ParDo(base_validation.ValidatePostCommitStatus())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InvalidCommitStatusError(
                invalid_commit_status),
        ])


class ValidatePostCommitIsPrivateTests(job_test_utils.PipelinedTestBase):

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
            | beam.ParDo(base_validation.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InvalidPrivateCommitStatusError(
                invalid_commit_status),
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
            | beam.ParDo(base_validation.ValidatePostCommitIsPrivate())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InvalidPrivateCommitStatusError(
                invalid_commit_status),
        ])


class ValidatePostCommitIsPublicTests(job_test_utils.PipelinedTestBase):

    def test_validate_post_commit_is_public_when_status_is_public(self):
        invalid_commit_status = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='create',
            user_id='',
            post_commit_status='public',
            post_commit_community_owned=True,
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_status])
            | beam.ParDo(base_validation.ValidatePostCommitIsPublic())
        )

        self.assert_pcoll_empty(output)

    def test_validate_post_commit_is_public_when_status_is_private(self):
        invalid_commit_status = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='create',
            user_id='',
            post_commit_status='private',
            post_commit_community_owned=True,
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_status])
            | beam.ParDo(base_validation.ValidatePostCommitIsPublic())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InvalidPublicCommitStatusError(
                invalid_commit_status),
        ])

    def test_validate_post_commit_is_public_raise_exception(self):
        invalid_commit_status = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='create',
            user_id='',
            post_commit_status='public',
            post_commit_community_owned=False,
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_status])
            | beam.ParDo(base_validation.ValidatePostCommitIsPublic())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InvalidPublicCommitStatusError(
                invalid_commit_status),
        ])


class MockValidateModelDomainObjectInstancesWithNeutral(
        base_validation.ValidateModelDomainObjectInstances):
    def _get_model_domain_object_instance(self, item): # pylint: disable=unused-argument
        return MockDomainObject()

    def _get_domain_object_validation_type(self, item): # pylint: disable=unused-argument
        return base_validation.VALIDATION_MODES.neutral


class MockValidateModelDomainObjectInstancesWithStrict(
        base_validation.ValidateModelDomainObjectInstances):
    def _get_model_domain_object_instance(self, item): # pylint: disable=unused-argument
        return MockDomainObject()

    def _get_domain_object_validation_type(self, item): # pylint: disable=unused-argument
        return base_validation.VALIDATION_MODES.strict


class MockValidateModelDomainObjectInstancesWithNonStrict(
        base_validation.ValidateModelDomainObjectInstances):
    def _get_model_domain_object_instance(self, item): # pylint: disable=unused-argument
        return MockDomainObject()

    def _get_domain_object_validation_type(self, item): # pylint: disable=unused-argument
        return base_validation.VALIDATION_MODES.non_strict


class MockValidateModelDomainObjectInstancesWithInvalid(
        base_validation.ValidateModelDomainObjectInstances):
    def _get_model_domain_object_instance(self, item): # pylint: disable=unused-argument
        return MockDomainObject()

    def _get_domain_object_validation_type(self, item): # pylint: disable=unused-argument
        return 'invalid'


class MockValidateExplorationModelDomainObjectInstances(
        base_validation.ValidateModelDomainObjectInstances):
    def _get_model_domain_object_instance(self, item):
        return exp_fetchers.get_exploration_from_model(item)


class ValidateModelDomainObjectInstancesTests(job_test_utils.PipelinedTestBase):

    def test_validation_type_for_domain_object(
            self):
        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                base_validation.ValidateModelDomainObjectInstances())
        )

        self.assert_pcoll_equal(output, [])

    def test_validation_type_for_domain_object_with_neutral_type(
            self):
        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                MockValidateModelDomainObjectInstancesWithNeutral())
        )

        self.assert_pcoll_equal(output, [])

    def test_validation_type_for_domain_object_with_strict_type(
            self):
        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                MockValidateModelDomainObjectInstancesWithStrict())
        )

        self.assert_pcoll_equal(output, [])

    def test_validation_type_for_domain_object_with_non_strict_type(
            self):
        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                MockValidateModelDomainObjectInstancesWithNonStrict())
        )

        self.assert_pcoll_equal(output, [])

    def test_error_is_raised_with_invalid_validation_type_for_domain_object(
            self):
        model = base_models.BaseModel(
            id='mock-123',
            deleted=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(MockValidateModelDomainObjectInstancesWithInvalid())
        )
        self.assert_pcoll_equal(output, [
            base_validation_errors.ModelDomainObjectValidateError(
                model, 'Invalid validation type for domain object: invalid')
        ])

    def test_validation_type_for_exploration_domain_object(self):
        model_instance1 = exp_models.ExplorationModel(
            id='mock-123',
            title='title',
            category='category',
            language_code='en',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    state_domain.State.create_default_state(
                        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True
                    ).to_dict()),
            },
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW
        )

        model_instance2 = exp_models.ExplorationModel(
            id='mock-123',
            title='title',
            category='category',
            language_code='en',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    state_domain.State.create_default_state(
                        'end', is_initial_state=True
                    ).to_dict()),
            },
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW
        )

        output = (
            self.pipeline
            | beam.Create([model_instance1, model_instance2])
            | beam.ParDo(MockValidateExplorationModelDomainObjectInstances())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.ModelDomainObjectValidateError(
                model_instance2, 'The destination end is not a valid state.')
        ])


class ValidateCommitTypeTests(job_test_utils.PipelinedTestBase):

    def test_validate_commit_type(self):
        invalid_commit_type_model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='invalid-type',
            user_id='',
            post_commit_status='',
            commit_cmds=[])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_type_model])
            | beam.ParDo(base_validation.ValidateCommitType())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.InvalidCommitTypeError(
                invalid_commit_type_model),
        ])


class MockValidateCommitCmdsSchema(
        base_validation.BaseValidateCommitCmdsSchema):

    def process(self, input_model):
        self._get_change_domain_class(input_model)


class MockValidateCommitCmdsSchemaChangeDomain(
        base_validation.BaseValidateCommitCmdsSchema):

    def _get_change_domain_class(self, item):
        pass


class MockValidateWrongSchema(base_validation.BaseValidateCommitCmdsSchema):

    def _get_change_domain_class(self, item): # pylint: disable=unused-argument
        return change_domain.BaseChange


class ValidateCommitCmdsSchemaTests(job_test_utils.PipelinedTestBase):

    def test_validate_none_commit(self):
        invalid_commit_cmd_model = base_models.BaseCommitLogEntryModel(
            id='invalid',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(MockValidateCommitCmdsSchemaChangeDomain())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsNoneError(invalid_commit_cmd_model)
        ])

    def test_validate_wrong_commit_cmd_missing(self):
        invalid_commit_cmd_model = base_models.BaseCommitLogEntryModel(
            id='invalid',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{'cmd-invalid': 'invalid_test_command'}, {}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(MockValidateWrongSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd-invalid': 'invalid_test_command'},
                'Missing cmd key in change dict')
        ])

    def test_validate_wrong_commit_cmd(self):
        invalid_commit_cmd_model = base_models.BaseCommitLogEntryModel(
            id='invalid',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{'cmd': 'invalid_test_command'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(MockValidateWrongSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid_test_command'},
                'Command invalid_test_command is not allowed')
        ])

    def test_validate_raise_not_implemented(self):
        invalid_commit_cmd_model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{}])

        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'The _get_change_domain_class() method is missing from the '
                'derived class. It should be implemented in the derived class.'
            )
        ):
            MockValidateCommitCmdsSchema().process(invalid_commit_cmd_model)

    def test_validate_commit_cmds(self):
        invalid_commit_cmd_model = base_models.BaseCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test',
            user_id='',
            post_commit_status='',
            commit_cmds=[{'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(MockValidateWrongSchema())
        )

        self.assert_pcoll_equal(output, [])
