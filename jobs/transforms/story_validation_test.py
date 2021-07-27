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

(base_models, story_models) = models.Registry.import_models( # type: ignore[no-untyped-call]
    [models.NAMES.base_model, models.NAMES.story])


class ValidateStorySnapshotMetadataModelTests(job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        # type: () -> None
        valid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='delete',
            commit_cmds=[{
                'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([valid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, []) # type: ignore[no-untyped-call]

    def test_story_change_object_with_missing_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds=[{'invalid': 'data'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {'invalid': 'data'},
                    'Missing cmd key in change dict')
            ])

    def test_story_change_object_with_invalid_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds=[{'invalid': 'data'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {'invalid': 'data'},
                    'Missing cmd key in change dict')
            ])

    def test_story_change_object_with_missing_attribute_in_cmd(self):
        # type: () -> None
        commit_dict = {
            'cmd': 'update_story_property',
            'property_name': 'title',
        }
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds=[commit_dict])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    commit_dict,
                    'The following required attributes are missing: '
                    'new_value, old_value')
            ])

    def test_story_change_object_with_extra_attribute_in_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_id',
                'invalid': 'invalid'
            }]
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    '{u\'node_id\': u\'node_id\', u\'cmd\': '
                    'u\'add_story_node\', u\'invalid\': u\'invalid\'}',
                    'The following required attributes are missing: title, '
                    'The following extra attributes are present: invalid')
            ])

    def test_story_change_object_with_invalid_story_property(self):
        # type: () -> None
        commit_dict = {
            'cmd': 'update_story_property',
            'property_name': 'invalid',
            'old_value': 'old_value',
            'new_value': 'new_value'
        }
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='edit',
            commit_cmds=[commit_dict])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    commit_dict,
                    'Value for property_name in cmd update_story_property: '
                    'invalid is not allowed')
            ])

    def test_story_change_object_with_invalid_story_node_property(self):
        # type: () -> None
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='edit',
            commit_cmds=[{
                'cmd': 'update_story_node_property',
                'node_id': 'node_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }]
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    '{u\'node_id\': u\'node_id\', u\'new_value\': '
                    'u\'new_value\', u\'cmd\': '
                    'u\'update_story_node_property\', u\'old_value\': '
                    'u\'old_value\', u\'property_name\': u\'invalid\'}',
                    'Value for property_name in cmd '
                    'update_story_node_property: invalid is not allowed')
            ])

    def test_story_change_object_with_invalid_story_contents_property(self):
        # type: () -> None
        commit_dict = {
            'cmd': 'update_story_contents_property',
            'property_name': 'invalid',
            'old_value': 'old_value',
            'new_value': 'new_value',
        }
        invalid_commit_cmd_model = story_models.StorySnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='edit',
            commit_cmds=[commit_dict])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStorySnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    commit_dict,
                    'Value for property_name in cmd '
                    'update_story_contents_property: invalid is not allowed')
            ])


class ValidateStoryCommitLogEntryModelTests(job_test_utils.PipelinedTestBase):

    def test_validate_story_model(self):
        # type: () -> None
        valid_commit_cmd_model = (
            story_models.StoryCommitLogEntryModel(
                id='story_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                story_id='story-id',
                user_id='user-id',
                commit_type='test-type',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([valid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, []) # type: ignore[no-untyped-call]

    def test_raises_commit_cmd_none_error(self):
        # type: () -> None
        invalid_commit_cmd_model = (
            story_models.StoryCommitLogEntryModel(
                id='model_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                story_id='story-id',
                user_id='user-id',
                commit_type='test-type',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                story_validation.ValidateStoryCommitLogEntryModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsNoneError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model)
            ])
