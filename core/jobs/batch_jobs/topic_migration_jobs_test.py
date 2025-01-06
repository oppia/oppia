# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.topic_migration_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import topic_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import topic_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = True
if MYPY:
    from mypy_imports import topic_models

(topic_model,) = models.Registry.import_models([models.Names.TOPIC])


class MigrateTopicJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        topic_migration_jobs.MigrateTopicJob
    ] = topic_migration_jobs.MigrateTopicJob

    TOPIC_1_ID: Final = 'topic_1_id'
    TOPIC_2_ID: Final = 'topic_2_id'

    def setUp(self) -> None:
        super().setUp()
        first_topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='cs',
            description='description',
            url_fragment='/fragm',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={}
        )
        first_topic_summary_model.update_timestamps()
        first_topic_summary_model.put()

        second_topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_2_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='cs',
            description='description',
            url_fragment='/fragm',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={}
        )
        second_topic_summary_model.update_timestamps()
        second_topic_summary_model.put()

        first_topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id=self.TOPIC_1_ID,
            topic_is_published=False
        )
        first_topic_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id=self.TOPIC_2_ID,
            topic_is_published=False
        )
        second_topic_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        mock_story_reference_schema_version = 2
        # A mock method to update story references is being
        # used since there are no higher versions for story reference
        # schema. This should be removed when newer schema versions are
        # added.
        def mock_update_story_references_from_model(
            unused_cls: Type[topic_domain.Topic],
            versioned_story_references: topic_domain.VersionedStoryReferencesDict, # pylint: disable=line-too-long
            current_version: int
        ) -> None:
            versioned_story_references['schema_version'] = current_version + 1

        self.story_reference_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_REFERENCE_SCHEMA_VERSION',
            mock_story_reference_schema_version)
        self.update_story_reference_swap = self.swap(
            topic_domain.Topic, 'update_story_references_from_model',
            classmethod(mock_update_story_references_from_model))

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_topic_with_unmigrated_prop_is_migrated(self) -> None:
        with self.story_reference_schema_version_swap, self.update_story_reference_swap: # pylint: disable=line-too-long
            unmigrated_topic_model = self.create_model(
                topic_models.TopicModel,
                id=self.TOPIC_1_ID,
                name='topic title',
                description='description',
                canonical_name='topic title',
                subtopic_schema_version=3,
                story_reference_schema_version=1,
                next_subtopic_id=1,
                language_code='cs',
                url_fragment='topic',
                page_title_fragment_for_web='fragm',
            )
            unmigrated_topic_model.update_timestamps()
            unmigrated_topic_model.commit(
                feconf.SYSTEM_COMMITTER_ID,
                'Create topic',
                [{'cmd': topic_domain.CMD_CREATE_NEW}]
            )

            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='TOPIC PROCESSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stdout='TOPIC MIGRATED SUCCESS: 1'),
            ])

            migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
            self.assertEqual(migrated_topic_model.version, 2)
            self.assertEqual(
                migrated_topic_model.subtopic_schema_version,
                feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)
            self.assertEqual(
                migrated_topic_model.story_reference_schema_version,
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION)

    def test_topic_summary_of_unmigrated_topic_is_updated(self) -> None:
        unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            description='description',
            canonical_name='topic title',
            subtopic_schema_version=3,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        unmigrated_topic_model.update_timestamps()
        unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOPIC PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='TOPIC MIGRATED SUCCESS: 1'),
        ])
        migrated_topic_summary_model = topic_models.TopicSummaryModel.get(
            self.TOPIC_1_ID
        )
        self.assertEqual(migrated_topic_summary_model.version, 2)

    def test_broken_topic_leads_to_no_migration(self) -> None:
        first_unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            canonical_name='topic title',
            description='description',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='abc',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        first_unmigrated_topic_model.update_timestamps()
        first_unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_2_ID,
            name='topic title',
            canonical_name='topic title',
            description='description',
            subtopic_schema_version=3,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        second_unmigrated_topic_model.update_timestamps()
        second_unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'TOPIC PROCESSED ERROR: "(\'topic_1_id\', ValidationError('
                    '\'Invalid language code: abc\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='TOPIC PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_topic_model = topic_models.TopicModel.get(
            self.TOPIC_1_ID)
        self.assertEqual(first_migrated_topic_model.version, 1)

        second_migrated_topic_model = topic_models.TopicModel.get(
            self.TOPIC_2_ID)
        self.assertEqual(second_migrated_topic_model.version, 1)

    def test_migrated_topic_is_not_migrated(self) -> None:
        unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            description='description',
            canonical_name='topic title',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        unmigrated_topic_model.update_timestamps()
        unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOPIC PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='TOPIC PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
        self.assertEqual(migrated_topic_model.version, 1)


class AuditTopicMigrateJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        topic_migration_jobs.AuditTopicMigrateJob
    ] = topic_migration_jobs.AuditTopicMigrateJob

    TOPIC_1_ID: Final = 'topic_1_id'
    TOPIC_2_ID: Final = 'topic_2_id'

    def setUp(self) -> None:
        super().setUp()
        first_topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='cs',
            description='description',
            url_fragment='/fragm',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={}
        )
        first_topic_summary_model.update_timestamps()
        first_topic_summary_model.put()

        second_topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_2_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='cs',
            description='description',
            url_fragment='/fragm',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={}
        )
        second_topic_summary_model.update_timestamps()
        second_topic_summary_model.put()

        first_topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id=self.TOPIC_1_ID,
            topic_is_published=False
        )
        first_topic_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id=self.TOPIC_2_ID,
            topic_is_published=False
        )
        second_topic_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        mock_story_reference_schema_version = 2
        # A mock method to update story references is being
        # used since there are no higher versions for story reference
        # schema. This should be removed when newer schema versions are
        # added.
        def mock_update_story_references_from_model(
            unused_cls: Type[topic_domain.Topic],
            versioned_story_references: topic_domain.VersionedStoryReferencesDict, # pylint: disable=line-too-long
            current_version: int
        ) -> None:
            versioned_story_references['schema_version'] = current_version + 1

        self.story_reference_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_REFERENCE_SCHEMA_VERSION',
            mock_story_reference_schema_version)
        self.update_story_reference_swap = self.swap(
            topic_domain.Topic, 'update_story_references_from_model',
            classmethod(mock_update_story_references_from_model))

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_broken_topic_leads_to_no_migration(self) -> None:
        first_unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            canonical_name='topic title',
            description='description',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='abc',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        first_unmigrated_topic_model.update_timestamps()
        first_unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_2_ID,
            name='topic title',
            canonical_name='topic title',
            description='description',
            subtopic_schema_version=3,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        second_unmigrated_topic_model.update_timestamps()
        second_unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'TOPIC PROCESSED ERROR: "(\'topic_1_id\', ValidationError('
                    '\'Invalid language code: abc\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='TOPIC PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_topic_model = topic_models.TopicModel.get(
            self.TOPIC_1_ID)
        self.assertEqual(first_migrated_topic_model.version, 1)

        second_migrated_topic_model = topic_models.TopicModel.get(
            self.TOPIC_2_ID)
        self.assertEqual(second_migrated_topic_model.version, 1)

    def test_migrated_topic_is_not_migrated(self) -> None:
        unmigrated_topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            description='description',
            canonical_name='topic title',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            page_title_fragment_for_web='fragm',
        )
        unmigrated_topic_model.update_timestamps()
        unmigrated_topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOPIC PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='TOPIC PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
        self.assertEqual(migrated_topic_model.version, 1)
