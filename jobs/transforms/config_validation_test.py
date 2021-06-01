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

"""Unit tests for jobs.transforms.config_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameter_domain as parameter_domain
from core.platform import models
from jobs import job_test_utils
from jobs.transforms import config_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, config_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.config])


class ValidateConfigCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidateConfigCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_config_property_change_object_with_missing_cmd(self):
        invalid_commit_cmd_model = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'invalid': 'data'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidateConfigCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_config_property_change_object_with_invalid_cmd(self):
        invalid_commit_cmd_model = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'cmd': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidateConfigCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_config_property_change_object_with_missing_attribute_in_cmd(self):
        invalid_commit_cmd_model = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'cmd': 'change_property_value'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidateConfigCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'change_property_value'},
                'The following required attributes are missing: '
                'new_value')
        ])

    def test_config_property_change_object_with_extra_attribute_in_cmd(self):
        invalid_commit_cmd_model = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': 'change_property_value',
                    'new_value': 'new_value',
                    'invalid': 'invalid'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidateConfigCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'change_property_value',
                    'new_value': 'new_value',
                    'invalid': 'invalid'
                },
                'The following extra attributes are present: invalid')
        ])


class ValidatePlatformParameterCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    CMD_EDIT_RULES = parameter_domain.PlatformParameterChange.CMD_EDIT_RULES

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidatePlatformParameterCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_param_change_object_with_missing_cmd_raises_exception(self):
        invalid_commit_cmd_model = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'invalid': 'data'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidatePlatformParameterCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_param_change_object_with_invalid_cmd_raises_exception(self):
        invalid_commit_cmd_model = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'cmd': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidatePlatformParameterCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_param_change_object_missing_attribute_in_cmd_raises_exception(
            self):
        invalid_commit_cmd_model = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'cmd': self.CMD_EDIT_RULES}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidatePlatformParameterCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': self.CMD_EDIT_RULES},
                'The following required attributes are missing: new_rules')
        ])

    def test_param_change_object_with_extra_attribute_in_cmd_raises_exception(
            self):
        invalid_commit_cmd_model = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': self.CMD_EDIT_RULES,
                    'new_rules': [],
                    'invalid': 'invalid'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                config_validation.ValidatePlatformParameterCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': self.CMD_EDIT_RULES,
                    'new_rules': [],
                    'invalid': 'invalid'
                },
                'The following extra attributes are present: invalid')
        ])
