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

from __future__ import annotations

from core.domain import rights_domain
from core.jobs import job_test_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import collection_validation
from core.jobs.types import base_validation_errors
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import collection_models

(base_models, collection_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.COLLECTION])


class ValidateCollectionSnapshotMetadataModelTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='model_id-1',
                committer_id='committer_id',
                commit_type='delete',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [])

    def test_collection_change_object_with_missing_cmd(self) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='123',
                committer_id='committer_id',
                commit_type='create',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_cmds=[{'invalid': 'data'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_collection_change_object_with_invalid_cmd(self) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='123',
                committer_id='committer_id',
                commit_type='create',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                commit_cmds=[{'cmd': 'invalid'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_collection_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='123',
                committer_id='committer_id',
                commit_type='create',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
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
                collection_validation.ValidateCollectionSnapshotMetadataModel())
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

    def test_collection_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='123',
                committer_id='committer_id',
                commit_type='create',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
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
                collection_validation.ValidateCollectionSnapshotMetadataModel())
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

    def test_collection_change_object_with_invalid_collection_property(
        self
    ) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionSnapshotMetadataModel(
                id='123',
                committer_id='committer_id',
                commit_type='create',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
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
                collection_validation.ValidateCollectionSnapshotMetadataModel())
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


class RelationshipsOfTests(test_utils.TestBase):

    def test_collection_summary_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'CollectionSummaryModel', 'id'),
            ['CollectionModel', 'CollectionRightsModel'])


class ValidateCollectionRightsSnapshotMetadataModelTests(
        job_test_utils.PipelinedTestBase):

    def test_collection_rights_change_object_with_missing_cmd(self) -> None:
        commit_dict = {'invalid': 'data'}
        invalid_commit_cmd_model = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds=[commit_dict])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation
                .ValidateCollectionRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'Missing cmd key in change dict')
        ])

    def test_collection_rights_change_object_with_invalid_cmd(self) -> None:
        commit_dict = {'cmd': 'invalid'}
        invalid_commit_cmd_model = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='create',
                commit_cmds=[commit_dict])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation
                .ValidateCollectionRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'Command invalid is not allowed')
        ])

    def test_collection_rights_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        commit_dict = {
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
        }
        invalid_commit_cmd_model = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='edit',
                commit_cmds=[commit_dict])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation
                .ValidateCollectionRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'The following required attributes are missing: '
                'new_role, old_role')
        ])

    def test_collection_rights_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        commit_dict = {
            'cmd': 'change_private_viewability',
            'old_viewable_if_private': 'old_viewable_if_private',
            'new_viewable_if_private': 'new_viewable_if_private',
            'invalid': 'invalid'
        }
        invalid_commit_cmd_model = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='edit',
                commit_cmds=[commit_dict])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation
                .ValidateCollectionRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'The following extra attributes are present: invalid')
        ])

    def test_collection_rights_change_object_with_invalid_role(self) -> None:
        commit_dict = {
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
            'old_role': rights_domain.ROLE_OWNER,
            'new_role': 'invalid',
        }
        invalid_commit_cmd_model = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='edit',
                commit_cmds=[commit_dict])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation
                .ValidateCollectionRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'Value for new_role in cmd change_role: '
                'invalid is not allowed')
        ])

    def test_collection_rights_change_object_with_invalid_status(
        self
    ) -> None:
        commit_dict = {
            'cmd': 'change_collection_status',
            'old_status': rights_domain.ACTIVITY_STATUS_PRIVATE,
            'new_status': 'invalid'
        }
        invalid_commit_cmd_model = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                committer_id='committer_id',
                commit_type='edit',
                commit_cmds=[commit_dict])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation
                .ValidateCollectionRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'Value for new_status in cmd change_collection_status: '
                'invalid is not allowed')
        ])


class ValidateCollectionCommitLogEntryModelTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_rights_model(self) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='rights_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                collection_id='collection_id',
                user_id='',
                commit_type='test-type',
                post_commit_status='private',
                commit_cmds=[{'cmd': 'create_new'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, [])

    def test_validate_collection_model(self) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='collection_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                collection_id='collection_id',
                user_id='',
                commit_type='test-type',
                post_commit_status='private',
                commit_cmds=[{
                    'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, [])

    def test_raises_commit_cmd_none_error(self) -> None:
        invalid_commit_cmd_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='model_id123',
                created_on=self.YEAR_AGO,
                last_updated=self.NOW,
                collection_id='collection_id',
                user_id='',
                commit_type='test-type',
                post_commit_status='private',
                commit_cmds=[{'cmd': 'create_new'}])
        )

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                collection_validation.ValidateCollectionCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsNoneError(invalid_commit_cmd_model)
        ])
