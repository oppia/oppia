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

"""Unit tests for jobs.transforms.story_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import story_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, story_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.story])


class ValidateStoryCommitCmdsSchemaTests(job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = story_models.StoryCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            story_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_story_change_object_with_missing_cmd(self):
        invalid_commit_cmd_model = story_models.StoryCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            story_id='123',
            post_commit_status='private',
            commit_cmds=[{'invalid': 'data'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_story_change_object_with_invalid_cmd(self):
        invalid_commit_cmd_model = story_models.StoryCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            story_id='123',
            post_commit_status='private',
            commit_cmds=[{'invalid': 'data'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_story_change_object_with_missing_attribute_in_cmd(self):
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{
                'cmd': 'update_story_property',
                'property_name': 'title',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_story_property',
                    'property_name': 'title',
                },
                'The following required attributes are missing: '
                'new_value, old_value')
        ])

    # Why can't I use dict here.
    def test_story_change_object_with_extra_attribute_in_cmd(self):
        invalid_commit_cmd_model = story_models.StoryCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            story_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_id',
                'invalid': 'invalid'
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                '{u\'cmd\': u\'add_story_node\', u\'node_id\': u\'node_id\', '
                'u\'invalid\': u\'invalid\'}',
                'The following required attributes are missing: title, '
                'The following extra attributes are present: invalid')
        ])

    def test_story_change_object_with_invalid_story_property(self):
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{
                'cmd': 'update_story_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_story_property',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd update_story_property: '
                'invalid is not allowed')
        ])

    # Why can't I use dict here.
    def test_story_change_object_with_invalid_story_node_property(self):
        invalid_commit_cmd_model = story_models.StoryCommitLogEntryModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            story_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': 'update_story_node_property',
                'node_id': 'node_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                '{u\'cmd\': u\'update_story_node_property\', u\'new_value\': '
                'u\'new_value\', u\'node_id\': u\'node_id\', u\'old_value\': '
                'u\'old_value\', u\'property_name\': u\'invalid\'}',
                'Value for property_name in cmd update_story_node_property: '
                'invalid is not allowed')
        ])

    def test_story_change_object_with_invalid_story_contents_property(self):
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{
                'cmd': 'update_story_contents_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_story_contents_property',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd update_story_contents_property:'
                ' invalid is not allowed')
        ])
