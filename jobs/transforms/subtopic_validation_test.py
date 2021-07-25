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

"""Unit tests for jobs.transforms.subtopic_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import subtopic_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, subtopic_models) = models.Registry.import_models( # type: ignore[no-untyped-call]
    [models.NAMES.base_model, models.NAMES.subtopic])


class ValidateSubtopicCommitCmdsSchemaTests(job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        # type: () -> None
        valid_commit_cmd_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='delete',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([valid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, []) # type: ignore[no-untyped-call]

    def test_subtopic_page_change_object_with_missing_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='delete',
                commit_cmds=[{'invalid': 'data'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageSnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {'invalid': 'data'},
                    'Missing cmd key in change dict')
            ])

    def test_subtopic_page_change_object_with_invalid_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='delete',
                commit_cmds=[{'cmd': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageSnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {'cmd': 'invalid'},
                    'Command invalid is not allowed')
            ])

    def test_subtopic_page_change_object_with_missing_attribute_in_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='edit',
                commit_cmds=[{
                    'cmd': 'update_subtopic_page_property',
                    'property_name': '<p>page_contents_html</p>',
                    'subtopic_id': 'subtopic_id'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageSnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {
                        'cmd': 'update_subtopic_page_property',
                        'property_name': '<p>page_contents_html</p>',
                        'subtopic_id': 'subtopic_id'
                    },
                    'The following required attributes are missing: '
                    'new_value, old_value')
            ])

    def test_subtopic_page_change_object_with_extra_attribute_in_cmd(self):
        # type: () -> None
        invalid_commit_cmd_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds=[{
                    'cmd': 'create_new',
                    'topic_id': 'topic_id',
                    'subtopic_id': 'subtopic_id',
                    'invalid': 'invalid'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageSnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {
                        'cmd': 'create_new',
                        'topic_id': 'topic_id',
                        'subtopic_id': 'subtopic_id',
                        'invalid': 'invalid'
                    },
                    'The following extra attributes are present: invalid')
            ])

    def test_subtopic_page_change_object_with_invalid_subtopic_page_property(
            self):
        # type: () -> None
        invalid_commit_cmd_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='edit',
                commit_cmds=[{
                    'cmd': 'update_subtopic_page_property',
                    'subtopic_id': 'subtopic_id',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageSnapshotMetadataModel())
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsValidateError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model,
                    {
                        'cmd': 'update_subtopic_page_property',
                        'subtopic_id': 'subtopic_id',
                        'property_name': 'invalid',
                        'old_value': 'old_value',
                        'new_value': 'new_value',
                    },
                    'Value for property_name in cmd '
                    'update_subtopic_page_property: invalid is not allowed')
            ])


class ValidateSubtopicPageCommitLogEntryModelTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_subtopic_page_model(self):
        # type: () -> None
        valid_commit_cmd_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel(
                id='subtopicpage_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                subtopic_page_id='123',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([valid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, []) # type: ignore[no-untyped-call]

    def test_raises_commit_cmd_none_error(self):
        # type: () -> None
        invalid_commit_cmd_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel(
                id='model_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                subtopic_page_id='123',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                subtopic_validation.ValidateSubtopicPageCommitLogEntryModel(
                ))
        )

        self.assert_pcoll_equal( # type: ignore[no-untyped-call]
            output, [
                base_validation_errors.CommitCmdsNoneError( # type: ignore[no-untyped-call]
                    invalid_commit_cmd_model)
            ])
