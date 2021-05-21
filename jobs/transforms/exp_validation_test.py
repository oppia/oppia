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

"""Unit tests for jobs.transforms.exp_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import exp_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, exp_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration])


class ValidateExplorationCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = exp_models.ExplorationCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            exploration_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_validate_exp_model_object_with_missing_cmd(self):
        invalid_commit_cmd_model = exp_models.ExplorationCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            exploration_id='123',
            post_commit_status='private',
            commit_cmds=[{'invalid': 'data'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_validate_exp_model_object_with_invalid_cmd(self):
        invalid_commit_cmd_model = exp_models.ExplorationCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            exploration_id='123',
            post_commit_status='private',
            commit_cmds=[{'cmd': 'invalid'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_validate_exp_model_object_with_missing_attribute_in_cmd(self):
        invalid_commit_cmd_model = exp_models.ExplorationCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            exploration_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'old_value': 'old_value'
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'edit_state_property',
                    'property_name': 'content',
                    'old_value': 'old_value'
                },
                'The following required attributes are missing: '
                'new_value, state_name')
        ])

    def test_validate_exp_model_object_with_extra_attribute_in_cmd(self):
        invalid_commit_cmd_model = exp_models.ExplorationSnapshotMetadataModel(
            id='model_id-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{
                'cmd': 'rename_state',
                'old_state_name': 'old_state_name',
                'new_state_name': 'new_state_name',
                'invalid': 'invalid'
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'rename_state',
                    'old_state_name': 'old_state_name',
                    'new_state_name': 'new_state_name',
                    'invalid': 'invalid'
                },
                'The following extra attributes are present: invalid')
        ])

    def test_validate_exp_model_object_with_invalid_exploration_property(self):
        invalid_commit_cmd_model = exp_models.ExplorationSnapshotMetadataModel(
            id='model_id-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{
                'cmd': 'edit_exploration_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd edit_exploration_property: '
                'invalid is not allowed')
        ])

    def test_validate_exp_model_object_with_invalid_state_property(self):
        invalid_commit_cmd_model = exp_models.ExplorationSnapshotMetadataModel(
            id='model_id-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{
                'cmd': 'edit_state_property',
                'state_name': 'state_name',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_validation.ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'edit_state_property',
                    'state_name': 'state_name',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd edit_state_property: '
                'invalid is not allowed')
        ])
