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

"""Unit tests for jobs.transforms.collection_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import collection_validation
from jobs.types import base_validation_errors

import apache_beam as beam

(base_models, collection_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.collection])


class ValidateCollectionCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                collection_id='123',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_collection_change_object_with_missing_cmd(self):
        invalid_commit_cmd_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                collection_id='123',
                post_commit_status='private',
                commit_cmds=[{'invalid': 'data'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_collection_change_object_with_invalid_cmd(self):
        invalid_commit_cmd_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_type='test-type',
                user_id='',
                collection_id='123',
                post_commit_status='private',
                commit_cmds=[{'cmd': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_collection_change_object_with_missing_attribute_in_cmd(self):
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': 'edit_collection_node_property',
                    'property_name': 'category',
                    'old_value': 'old_value'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'edit_collection_node_property',
                    'property_name': 'category',
                    'old_value': 'old_value'
                },
                'The following required attributes are missing: '
                'exploration_id, new_value')
        ])

    def test_collection_change_object_with_extra_attribute_in_cmd(self):
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': 'edit_collection_node_property',
                    'exploration_id': 'exploration_id',
                    'property_name': 'category',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                    'invalid': 'invalid'
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'edit_collection_node_property',
                    'exploration_id': 'exploration_id',
                    'property_name': 'category',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                    'invalid': 'invalid'
                },
                'The following extra attributes are present: invalid')
        ])

    def test_collection_change_object_with_invalid_collection_property(self):
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='model_id-1',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds_user_ids=[
                    'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
                content_user_ids=['content_user_1_id', 'content_user_2_id'],
                commit_cmds=[{
                    'cmd': 'edit_collection_property',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                }])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'edit_collection_property',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd edit_collection_property: '
                'invalid is not allowed')
        ])
