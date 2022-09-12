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

"""Unit tests for jobs.transforms.topic_validation."""

from __future__ import annotations

from core.domain import topic_domain
from core.jobs import job_test_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import topic_validation
from core.jobs.types import base_validation_errors
from core.jobs.types import topic_validation_errors
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import topic_models

(base_models, topic_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.TOPIC])


class ValidateCanonicalNameMatchesNameInLowercaseTests(
        job_test_utils.PipelinedTestBase):

    def test_process_for_not_matching_canonical_name(self) -> None:
        model_with_different_name = topic_models.TopicModel(
            id='123',
            name='name',
            created_on=self.NOW,
            last_updated=self.NOW,
            url_fragment='name-two',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        output = (
            self.pipeline
            | beam.Create([model_with_different_name])
            | beam.ParDo(
                topic_validation.ValidateCanonicalNameMatchesNameInLowercase())
        )
        self.assert_pcoll_equal(output, [
            topic_validation_errors.ModelCanonicalNameMismatchError(
                model_with_different_name)
        ])

    def test_process_for_matching_canonical_name(self) -> None:
        model_with_same_name = topic_models.TopicModel(
            id='123',
            name='SOMEthing',
            created_on=self.NOW,
            last_updated=self.NOW,
            url_fragment='name-two',
            canonical_name='something',
            next_subtopic_id=1,
            language_code='en',
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        output = (
            self.pipeline
            | beam.Create([model_with_same_name])
            | beam.ParDo(
                topic_validation.ValidateCanonicalNameMatchesNameInLowercase())
        )
        self.assert_pcoll_equal(output, [])


class ValidateTopicSnapshotMetadataModelTests(job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self) -> None:
        valid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
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
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [])

    def test_topic_change_object_with_missing_cmd(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='delete',
            commit_cmds=[{'invalid': 'data'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_topic_change_object_with_invalid_cmd(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='delete',
            commit_cmds=[{'cmd': 'invalid'}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_topic_change_object_with_missing_attribute_in_cmd(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='edit',
            commit_cmds=[{
                'cmd': 'update_topic_property',
                'property_name': 'name',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_topic_property',
                    'property_name': 'name',
                },
                'The following required attributes are missing: '
                'new_value, old_value')
        ])

    def test_topic_change_object_with_extra_attribute_in_cmd(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds=[{
                'cmd': 'add_subtopic',
                'title': 'title',
                'subtopic_id': 'subtopic_id',
                'url_fragment': 'url-fragment',
                'invalid': 'invalid'
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'add_subtopic',
                    'title': 'title',
                    'subtopic_id': 'subtopic_id',
                    'url_fragment': 'url-fragment',
                    'invalid': 'invalid'
                },
                'The following extra attributes are present: invalid')
        ])

    def test_topic_change_object_with_invalid_topic_property(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='edit',
            commit_cmds=[{
                'cmd': 'update_topic_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_topic_property',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd update_topic_property: '
                'invalid is not allowed')
        ])

    def test_topic_change_object_with_invalid_subtopic_property(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
            id='123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='edit',
            commit_cmds=[{
                'cmd': 'update_subtopic_property',
                'subtopic_id': 'subtopic_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            }])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_subtopic_property',
                    'subtopic_id': 'subtopic_id',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd update_subtopic_property: '
                'invalid is not allowed')
        ])

    def test_topic_change_object_with_invalid_subtopic_page_property(
        self
    ) -> None:
        invalid_commit_cmd_model = topic_models.TopicSnapshotMetadataModel(
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

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {
                    'cmd': 'update_subtopic_page_property',
                    'subtopic_id': 'subtopic_id',
                    'property_name': 'invalid',
                    'old_value': 'old_value',
                    'new_value': 'new_value',
                },
                'Value for property_name in cmd update_subtopic_page_property: '
                'invalid is not allowed')
        ])


class ValidateTopicRightsSnapshotMetadataModelTests(
        job_test_utils.PipelinedTestBase):

    def test_topic_rights_change_object_with_missing_cmd(self) -> None:
        invalid_commit_cmd_model = (
            topic_models.TopicRightsSnapshotMetadataModel(
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
                topic_validation.ValidateTopicRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'invalid': 'data'},
                'Missing cmd key in change dict')
        ])

    def test_topic_change_rights_object_with_invalid_cmd(self) -> None:
        invalid_commit_cmd_model = (
            topic_models.TopicRightsSnapshotMetadataModel(
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
                topic_validation.ValidateTopicRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                {'cmd': 'invalid'},
                'Command invalid is not allowed')
        ])

    def test_topic_rights_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        commit_dict = {
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
        }
        invalid_commit_cmd_model = (
            topic_models.TopicRightsSnapshotMetadataModel(
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
                topic_validation.ValidateTopicRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'The following required attributes are missing: '
                'new_role, old_role')
        ])

    def test_topic_rights_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        commit_dict = {
            'cmd': 'publish_topic',
            'invalid': 'invalid'
        }
        invalid_commit_cmd_model = (
            topic_models.TopicRightsSnapshotMetadataModel(
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
                topic_validation.ValidateTopicRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'The following extra attributes are present: invalid')
        ])

    def test_topic_rights_change_object_with_invalid_role(self) -> None:
        commit_dict = {
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
            'old_role': 'invalid',
            'new_role': topic_domain.ROLE_MANAGER
        }
        invalid_commit_cmd_model = (
            topic_models.TopicRightsSnapshotMetadataModel(
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
                topic_validation.ValidateTopicRightsSnapshotMetadataModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsValidateError(
                invalid_commit_cmd_model,
                commit_dict,
                'Value for old_role in cmd change_role: '
                'invalid is not allowed')
        ])


class ValidateTopicCommitLogEntryModelTests(job_test_utils.PipelinedTestBase):

    def test_validate_rights_model(self) -> None:
        valid_commit_cmd_model = topic_models.TopicCommitLogEntryModel(
            id='rights_id123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            topic_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([valid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, [])

    def test_validate_topic_model(self) -> None:
        valid_commit_cmd_model = topic_models.TopicCommitLogEntryModel(
            id='topic_id123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            topic_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([valid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, [])

    def test_raises_commit_cmd_none_error(self) -> None:
        invalid_commit_cmd_model = topic_models.TopicCommitLogEntryModel(
            id='model_id123',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            commit_type='test-type',
            user_id='',
            topic_id='123',
            post_commit_status='private',
            commit_cmds=[{
                'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                topic_validation.ValidateTopicCommitLogEntryModel())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.CommitCmdsNoneError(invalid_commit_cmd_model)
        ])


class RelationshipsOfTests(test_utils.TestBase):

    def test_topic_summary_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'TopicSummaryModel', 'id'),
            ['TopicModel', 'TopicRightsModel'])
