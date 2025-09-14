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

"""Unit tests for jobs.batch_jobs.exp_recommendation_computation_jobs."""

from __future__ import annotations

import copy
import datetime

from core import feconf
from core.domain import story_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import story_models
    from mypy_imports import topic_models

(story_models, topic_models) = models.Registry.import_models([
    models.Names.STORY, models.Names.TOPIC
])

datastore_services = models.Registry.import_datastore_services()


class MigrateStoryJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        story_migration_jobs.MigrateStoryJob
    ] = story_migration_jobs.MigrateStoryJob

    STORY_1_ID: Final = 'story_1_id'
    TOPIC_1_ID: Final = 'topic_1_id'
    STORY_2_ID: Final = 'story_2_id'

    def setUp(self) -> None:
        super().setUp()
        story_summary_model = self.create_model(
            story_models.StorySummaryModel,
            id=self.STORY_1_ID,
            title='title',
            url_fragment='urlfragment',
            language_code='cs',
            description='description',
            node_titles=['title1', 'title2'],
            story_model_last_updated=datetime.datetime.utcnow(),
            story_model_created_on=datetime.datetime.utcnow(),
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': False
            }],
            page_title_fragment_for_web='fragm',
        )
        datastore_services.update_timestamps_multi([
            topic_model, story_summary_model])
        datastore_services.put_multi([topic_model, story_summary_model])
        self.latest_contents: story_domain.StoryContentsDict = {
            'nodes': [{
                'id': 'node_1111',
                'title': 'title',
                'description': 'description',
                'thumbnail_filename': 'thumbnail_filename.svg',
                'thumbnail_bg_color': '#F8BF74',
                'thumbnail_size_in_bytes': None,
                'destination_node_ids': [],
                'acquired_skill_ids': [],
                'prerequisite_skill_ids': [],
                'outline': 'outline',
                'outline_is_finalized': True,
                'exploration_id': 'exp_id',
                'status': None,
                'planned_publication_date_msecs': None,
                'last_modified_msecs': None,
                'first_publication_date_msecs': None,
                'unpublishing_reason': None
            }],
            'initial_node_id': 'node_1111',
            'next_node_id': 'node_2222'
        }
        self.broken_contents = copy.deepcopy(self.latest_contents)
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally
        # test wrong inputs that we can normally catch by typing.
        self.broken_contents['nodes'][0]['description'] = 123  # type: ignore[arg-type]

        self.unmigrated_contents = copy.deepcopy(self.latest_contents)
        self.unmigrated_contents['nodes'][0]['thumbnail_size_in_bytes'] = 123

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_story_with_unmigrated_rubric_is_migrated(self) -> None:
        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.unmigrated_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model.update_timestamps()
        story_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='STORY PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='STORY MIGRATED SUCCESS: 1'),
        ])

        migrated_story_model = story_models.StoryModel.get(self.STORY_1_ID)
        self.assertEqual(migrated_story_model.version, 2)
        self.assertEqual(
            migrated_story_model.story_contents_schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            migrated_story_model.story_contents, self.latest_contents)

    def test_broken_story_is_not_migrated(self) -> None:
        story_model_one = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.broken_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model_one.update_timestamps()
        story_model_one.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        story_model_two = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.unmigrated_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model_two.update_timestamps()
        story_model_two.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'STORY PROCESSED ERROR: "(\'story_1_id\', ValidationError('
                    '\'Expected description to be a string, received 123\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(stdout='STORY PROCESSED SUCCESS: 1')
        ])

        migrated_story_model = story_models.StoryModel.get(self.STORY_1_ID)
        self.assertEqual(migrated_story_model.version, 1)
        migrated_story_model = story_models.StoryModel.get(self.STORY_2_ID)
        self.assertEqual(migrated_story_model.version, 1)

    def test_migrated_story_is_not_migrated(self) -> None:
        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.latest_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model.update_timestamps()
        story_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='STORY PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='STORY PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_story_model = story_models.StoryModel.get(self.STORY_1_ID)
        self.assertEqual(migrated_story_model.version, 1)


class AuditStoryMigrationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        story_migration_jobs.AuditStoryMigrationJob
    ] = story_migration_jobs.AuditStoryMigrationJob

    STORY_1_ID: Final = 'story_1_id'
    TOPIC_1_ID: Final = 'topic_1_id'

    def setUp(self) -> None:
        super().setUp()
        story_summary_model = self.create_model(
            story_models.StorySummaryModel,
            id=self.STORY_1_ID,
            title='title',
            url_fragment='urlfragment',
            language_code='cs',
            description='description',
            node_titles=['title1', 'title2'],
            story_model_last_updated=datetime.datetime.utcnow(),
            story_model_created_on=datetime.datetime.utcnow(),
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': False
            }],
            page_title_fragment_for_web='fragm',
        )
        datastore_services.update_timestamps_multi([
            topic_model, story_summary_model])
        datastore_services.put_multi([topic_model, story_summary_model])
        self.latest_contents: story_domain.StoryContentsDict = {
            'nodes': [{
                'id': 'node_1111',
                'title': 'title',
                'description': 'description',
                'thumbnail_filename': 'thumbnail_filename.svg',
                'thumbnail_bg_color': '#F8BF74',
                'thumbnail_size_in_bytes': None,
                'destination_node_ids': [],
                'acquired_skill_ids': [],
                'prerequisite_skill_ids': [],
                'outline': 'outline',
                'outline_is_finalized': True,
                'exploration_id': 'exp_id',
                'status': 'Published',
                'planned_publication_date_msecs': 100,
                'last_modified_msecs': 100,
                'first_publication_date_msecs': 200,
                'unpublishing_reason': None
            }],
            'initial_node_id': 'node_1111',
            'next_node_id': 'node_2222'
        }
        self.broken_contents = copy.deepcopy(self.latest_contents)
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally
        # test wrong inputs that we can normally catch by typing.
        self.broken_contents['nodes'][0]['description'] = 123  # type: ignore[arg-type]

        self.unmigrated_contents = copy.deepcopy(self.latest_contents)
        self.unmigrated_contents['nodes'][0]['thumbnail_size_in_bytes'] = 123

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_story_with_unmigrated_rubric_is_migrated(self) -> None:
        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.unmigrated_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model.update_timestamps()
        story_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='STORY PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='STORY MIGRATED SUCCESS: 1'),
        ])

    def test_broken_story_is_not_migrated(self) -> None:
        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.broken_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model.update_timestamps()
        story_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'STORY PROCESSED ERROR: "(\'story_1_id\', ValidationError('
                    '\'Expected description to be a string, received 123\''
                    '))": 1'
                )
            )
        ])

        migrated_story_model = story_models.StoryModel.get(self.STORY_1_ID)
        self.assertEqual(migrated_story_model.version, 1)

    def test_migrated_story_is_not_migrated(self) -> None:
        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=self.latest_contents,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment',
        )
        story_model.update_timestamps()
        story_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create story', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='STORY PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='STORY PREVIOUSLY MIGRATED SUCCESS: 1'),
        ])

        migrated_story_model = story_models.StoryModel.get(self.STORY_1_ID)
        self.assertEqual(migrated_story_model.version, 1)
