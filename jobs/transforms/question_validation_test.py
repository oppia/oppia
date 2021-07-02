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

"""Unit tests for jobs.transforms.question_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import question_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, question_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.question])


class ValidateQuestionCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = (
            question_models.QuestionCommitLogEntryModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                question_id='123',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                question_validation.ValidateQuestionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_change_dict_without_cmd(self):
        invalid_commit_cmd_model = (
            question_models.QuestionCommitLogEntryModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                question_id='123',
                post_commit_status='private',
                commit_cmds=[{'invalid': 'data'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                question_validation.ValidateQuestionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_change_dict_with_invalid_cmd(self):
        invalid_commit_cmd_model = (
            question_models.QuestionCommitLogEntryModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                question_id='123',
                post_commit_status='private',
                commit_cmds=[{'cmd': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                question_validation.ValidateQuestionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_change_dict_with_missing_attributes_in_cmd(self):
        invalid_commit_cmd_model = (
            question_models.QuestionSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': 'update_question_property',
                    'property_name': 'question_state_data',
                    'old_value': 'old_value'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                question_validation.ValidateQuestionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_question_property',
                    'property_name': 'question_state_data',
                    'old_value': 'old_value'
                },
                'The following required attributes are missing: new_value')
        ])

    def test_change_dict_with_extra_attributes_in_cmd(self):
        invalid_commit_cmd_model = (
            question_models.QuestionSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{'cmd': 'create_new', 'invalid': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                question_validation.ValidateQuestionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'create_new', 'invalid': 'invalid'},
                'The following extra attributes are present: invalid')
        ])

    def test_update_question_property_with_wrong_property_name(self):
        invalid_commit_cmd_model = (
            question_models.QuestionSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': 'update_question_property',
                    'property_name': 'wrong',
                    'new_value': 'new_value',
                    'old_value': 'old_value'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                question_validation.ValidateQuestionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_question_property',
                    'property_name': 'wrong',
                    'new_value': 'new_value',
                    'old_value': 'old_value'
                },
                'Value for property_name in cmd update_question_property: '
                'wrong is not allowed')
        ])
