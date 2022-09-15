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

"""Unit tests for jobs.batch_jobs.topic_migration_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import caching_services
from core.domain import topic_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import topic_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type
from typing_extensions import Final

MYPY = True
if MYPY:
    from mypy_imports import topic_models

(topic_model,) = models.Registry.import_models([models.Names.TOPIC])


class MigrateTopicJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        topic_migration_jobs.MigrateTopicJob
    ] = topic_migration_jobs.MigrateTopicJob

    TOPIC_1_ID: Final = 'topic_1_id'

    def setUp(self) -> None:
        super().setUp()
        topic_summary_model = self.create_model(
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
            version=1
        )
        topic_summary_model.update_timestamps()
        topic_summary_model.put()

        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id=self.TOPIC_1_ID,
            topic_is_published=False
        )
        topic_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_topic_with_unmigrated_prop_is_migrated(self) -> None:
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
            job_run_result.JobRunResult(stdout='CACHE DELETION SUCCESS: 1')
        ])

        migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
        self.assertEqual(migrated_topic_model.version, 2)
        self.assertEqual(
            migrated_topic_model.subtopic_schema_version,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)

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
            job_run_result.JobRunResult(stdout='CACHE DELETION SUCCESS: 1')
        ])
        migrated_topic_summary_model = topic_models.TopicSummaryModel.get(
            self.TOPIC_1_ID
        )
        self.assertEqual(migrated_topic_summary_model.version, 2)

    def test_broken_cache_is_reported(self) -> None:
        cache_swap = self.swap_to_always_raise(
            caching_services, 'delete_multi', Exception('cache deletion error'))
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

        with cache_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='TOPIC MIGRATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TOPIC PROCESSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stderr='CACHE DELETION ERROR: "cache deletion error": 1'
                )
            ])
        migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
        self.assertEqual(migrated_topic_model.version, 2)

    def test_broken_topic_is_not_migrated(self) -> None:
        unmigrated_topic_model = self.create_model(
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
        unmigrated_topic_model.update_timestamps()
        unmigrated_topic_model.commit(
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
            )
        ])
        migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
        self.assertEqual(migrated_topic_model.version, 1)

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
            job_run_result.JobRunResult(stdout='TOPIC PROCESSED SUCCESS: 1')
        ])

        migrated_topic_model = topic_models.TopicModel.get(self.TOPIC_1_ID)
        self.assertEqual(migrated_topic_model.version, 1)
