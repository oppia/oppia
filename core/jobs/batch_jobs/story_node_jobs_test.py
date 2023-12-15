# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for populating story node."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_node_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type
from typing_extensions import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import story_models
    from mypy_imports import topic_models

(story_models, topic_models) = models.Registry.import_models([
    models.Names.STORY, models.Names.TOPIC])


class PopulateStoryNodeJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        story_node_jobs.PopulateStoryNodeJob
    ] = story_node_jobs.PopulateStoryNodeJob

    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    TOPIC_1_ID: Final = 'topic_1_id'

    story_contents_dict_1 = {
        'nodes': [{
            'id': 'node_1',
            'title': 'title_1',
            'description': 'description_1',
            'thumbnail_filename': 'thumbnail_filename_1.svg',
            'thumbnail_bg_color': '#F8BF74',
            'thumbnail_size_in_bytes': None,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': 'outline',
            'outline_is_finalized': True,
            'exploration_id': 'exp_id_1'
        }, {
            'id': 'node_2',
            'title': 'title_2',
            'description': 'description_2',
            'thumbnail_filename': 'thumbnail_filename_2.svg',
            'thumbnail_bg_color': '#F8FF74',
            'thumbnail_size_in_bytes': None,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': 'outline',
            'outline_is_finalized': True,
            'exploration_id': 'exp_id_2'
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_3'
    }

    story_contents_dict_2 = {
        'nodes': [{
            'id': 'node_11',
            'title': 'title_11',
            'description': 'description_11',
            'thumbnail_filename': 'thumbnail_filename_11.svg',
            'thumbnail_bg_color': '#F8BF74',
            'thumbnail_size_in_bytes': None,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': 'outline',
            'outline_is_finalized': True,
            'exploration_id': 'exp_id_11'
        }],
        'initial_node_id': 'node_11',
        'next_node_id': 'node_22'
    }

    TOPIC_SNAPSHOT_1_DATE: Final = datetime.datetime(2023, 6, 12, 23, 0, 0, 0)
    TOPIC_SNAPSHOT_2_DATE: Final = datetime.datetime(2023, 6, 13, 1, 30, 0, 0)
    STORY_1_SHAPSHOT_1_DATE: Final = datetime.datetime(2023, 6, 13, 1, 0, 0, 0)
    STORY_1_SHAPSHOT_2_DATE: Final = datetime.datetime(2023, 6, 13, 2, 0, 0, 0)
    STORY_2_SHAPSHOT_1_DATE: Final = datetime.datetime(2023, 6, 13, 2, 0, 0, 0)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_story_nodes_are_populated(self) -> None:
        story_model_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title_1',
            language_code='en',
            notes='notes_1',
            description='description_1',
            story_contents=self.story_contents_dict_1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-1',
            version=2
        )
        story_model_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            story_contents_schema_version=4,
            title='title_2',
            language_code='en',
            notes='notes_2',
            description='description_2',
            story_contents=self.story_contents_dict_2,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-2',
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='en',
            description='description',
            url_fragment='/fragm',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': True
            }, {
                'story_id': self.STORY_2_ID,
                'story_is_published': False
            }],
            next_subtopic_id=1,
            page_title_fragment_for_web='fragm',
            story_reference_schema_version=1,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            version=2
        )
        story_1_snapshot_metadata_model_1 = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_1'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_1_DATE
        )
        story_1_snapshot_metadata_model_2 = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-2',
            commit_cmds=[{
                'cmd': 'update_story_node_property',
                'node_id': 'node_1',
                'property_name': 'description',
                'old_value': 'desc',
                'new_value': 'description'
            }, {
                'cmd': 'add_story_node',
                'node_id': 'node_2'
            }],
            commit_type=feconf.COMMIT_TYPE_EDIT,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_2_DATE
        )
        story_2_snapshot_metadata_model_1 = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_2_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_11'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_2_SHAPSHOT_1_DATE
        )
        topic_snapshot_metadata_model_1 = self.create_model(
            topic_models.TopicSnapshotMetadataModel,
            id=self.TOPIC_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_canonical_story',
                'story_id': self.STORY_1_ID
            }, {
                'cmd': 'add_canonical_story',
                'story_id': self.STORY_2_ID
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.TOPIC_SNAPSHOT_1_DATE
        )
        topic_snapshot_metadata_model_2 = self.create_model(
            topic_models.TopicSnapshotMetadataModel,
            id=self.TOPIC_1_ID + '-2',
            commit_cmds=[{
                'cmd': 'publish_story',
                'story_id': self.STORY_1_ID
            }],
            commit_type=feconf.COMMIT_TYPE_EDIT,
            committer_id='user_1',
            created_on=self.TOPIC_SNAPSHOT_2_DATE
        )

        self.put_multi(
            [story_model_1, story_model_2, topic_model,
            story_1_snapshot_metadata_model_1,
            story_1_snapshot_metadata_model_2,
            story_2_snapshot_metadata_model_1,
            topic_snapshot_metadata_model_1,
            topic_snapshot_metadata_model_2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOPIC MODELS WHOSE STORIES ARE UPDATED SUCCESS: 1'
            )
        ])
        updated_story_model_1 = story_models.StoryModel.get(
            self.STORY_1_ID
        )
        story_1_nodes = updated_story_model_1.story_contents['nodes']

        self.assertEqual(story_1_nodes[0]['status'], 'Published')
        self.assertEqual(story_1_nodes[0]['unpublishing_reason'], None)
        self.assertEqual(story_1_nodes[0]['first_publication_date_msecs'], (
            utils.get_time_in_millisecs(self.TOPIC_SNAPSHOT_2_DATE)))
        self.assertEqual(story_1_nodes[0]['planned_publication_date_msecs'], (
            utils.get_time_in_millisecs(self.TOPIC_SNAPSHOT_2_DATE)))
        self.assertEqual(story_1_nodes[0]['last_modified_msecs'], (
            utils.get_time_in_millisecs(self.STORY_1_SHAPSHOT_2_DATE)))

        self.assertEqual(story_1_nodes[1]['status'], 'Published')
        self.assertEqual(story_1_nodes[1]['unpublishing_reason'], None)
        self.assertEqual(story_1_nodes[1]['first_publication_date_msecs'], (
            utils.get_time_in_millisecs(self.STORY_1_SHAPSHOT_2_DATE)))
        self.assertEqual(story_1_nodes[1]['planned_publication_date_msecs'], (
            utils.get_time_in_millisecs(self.STORY_1_SHAPSHOT_2_DATE)))
        self.assertEqual(story_1_nodes[1]['last_modified_msecs'], (
            utils.get_time_in_millisecs(self.STORY_1_SHAPSHOT_2_DATE)))

        updated_story_model_2 = story_models.StoryModel.get(
            self.STORY_2_ID
        )
        story_2_nodes = updated_story_model_2.story_contents['nodes']

        self.assertEqual(story_2_nodes[0]['status'], 'Draft')
        self.assertEqual(story_2_nodes[0]['unpublishing_reason'], None)
        self.assertEqual(story_2_nodes[0]['first_publication_date_msecs'], (
            None))
        self.assertEqual(story_2_nodes[0]['planned_publication_date_msecs'], (
            None))
        self.assertEqual(story_2_nodes[0]['last_modified_msecs'], (
            utils.get_time_in_millisecs(self.STORY_2_SHAPSHOT_1_DATE)))

    def test_topic_with_no_story_reference_raises_error(self) -> None:
        story_model_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title_1',
            language_code='en',
            notes='notes_1',
            description='description_1',
            story_contents=self.story_contents_dict_1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-1',
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='en',
            description='description',
            url_fragment='/fragm',
            canonical_story_references=[],
            next_subtopic_id=1,
            page_title_fragment_for_web='fragm',
            story_reference_schema_version=1,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            version=1
        )
        story_snapshot_metadata_model = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_1'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_1_DATE
        )
        self.put_multi(
            [story_model_1, topic_model,
             story_snapshot_metadata_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'TOPIC MODELS WHOSE STORIES ARE UPDATED ERROR: '
                    '\"(\'story_1_id\', StopIteration())\": 1'
                )
            )
        ])

    def test_story_with_wrong_commit_history_raises_error(self) -> None:
        story_model_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title_1',
            language_code='en',
            notes='notes_1',
            description='description_1',
            story_contents=self.story_contents_dict_1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-1',
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='en',
            description='description',
            url_fragment='/fragm',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': True
            }],
            next_subtopic_id=1,
            page_title_fragment_for_web='fragm',
            story_reference_schema_version=1,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            version=1
        )
        story_snapshot_metadata_model = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_2'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_1_DATE
        )
        topic_snapshot_metadata_model = self.create_model(
            topic_models.TopicSnapshotMetadataModel,
            id=self.TOPIC_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_canonical_story',
                'story_id': self.STORY_1_ID
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.TOPIC_SNAPSHOT_1_DATE
        )
        self.put_multi(
            [story_model_1, topic_model,
             story_snapshot_metadata_model,
             topic_snapshot_metadata_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'TOPIC MODELS WHOSE STORIES ARE UPDATED ERROR: \"('
                    '\'story_1_id\', Exception(\'Node was not created.\''
                    '))\": 1'
                )
            )
        ])


class AuditPopulateStoryNodeJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        story_node_jobs.AuditPopulateStoryNodeJob
    ] = story_node_jobs.AuditPopulateStoryNodeJob

    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    TOPIC_1_ID: Final = 'topic_1_id'

    story_contents_dict_1 = {
        'nodes': [{
            'id': 'node_1',
            'title': 'title_1',
            'description': 'description_1',
            'thumbnail_filename': 'thumbnail_filename_1.svg',
            'thumbnail_bg_color': '#F8BF74',
            'thumbnail_size_in_bytes': None,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': 'outline',
            'outline_is_finalized': True,
            'exploration_id': 'exp_id_1'
        }, {
            'id': 'node_2',
            'title': 'title_2',
            'description': 'description_2',
            'thumbnail_filename': 'thumbnail_filename_2.svg',
            'thumbnail_bg_color': '#F8FF74',
            'thumbnail_size_in_bytes': None,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': 'outline',
            'outline_is_finalized': True,
            'exploration_id': 'exp_id_2'
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_3'
    }

    story_contents_dict_2 = {
        'nodes': [{
            'id': 'node_11',
            'title': 'title_11',
            'description': 'description_11',
            'thumbnail_filename': 'thumbnail_filename_11.svg',
            'thumbnail_bg_color': '#F8BF74',
            'thumbnail_size_in_bytes': None,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': 'outline',
            'outline_is_finalized': True,
            'exploration_id': 'exp_id_11'
        }],
        'initial_node_id': 'node_11',
        'next_node_id': 'node_22'
    }

    TOPIC_SNAPSHOT_1_DATE: Final = datetime.datetime(2023, 6, 12, 23, 0, 0, 0)
    TOPIC_SNAPSHOT_2_DATE: Final = datetime.datetime(2023, 6, 13, 1, 30, 0, 0)
    STORY_1_SHAPSHOT_1_DATE: Final = datetime.datetime(2023, 6, 13, 1, 0, 0, 0)
    STORY_1_SHAPSHOT_2_DATE: Final = datetime.datetime(2023, 6, 13, 2, 0, 0, 0)
    STORY_2_SHAPSHOT_1_DATE: Final = datetime.datetime(2023, 6, 13, 2, 0, 0, 0)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_story_nodes_are_populated(self) -> None:
        story_model_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title_1',
            language_code='en',
            notes='notes_1',
            description='description_1',
            story_contents=self.story_contents_dict_1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-1',
            version=2
        )
        story_model_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            story_contents_schema_version=4,
            title='title_2',
            language_code='en',
            notes='notes_2',
            description='description_2',
            story_contents=self.story_contents_dict_2,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-2',
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='en',
            description='description',
            url_fragment='/fragm',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': True
            }, {
                'story_id': self.STORY_2_ID,
                'story_is_published': False
            }],
            next_subtopic_id=1,
            page_title_fragment_for_web='fragm',
            story_reference_schema_version=1,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            version=2
        )
        story_1_snapshot_metadata_model_1 = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_1'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_1_DATE
        )
        story_1_snapshot_metadata_model_2 = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-2',
            commit_cmds=[{
                'cmd': 'update_story_node_property',
                'node_id': 'node_1',
                'property_name': 'description',
                'old_value': 'desc',
                'new_value': 'description'
            }, {
                'cmd': 'add_story_node',
                'node_id': 'node_2'
            }],
            commit_type=feconf.COMMIT_TYPE_EDIT,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_2_DATE
        )
        story_2_snapshot_metadata_model_1 = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_2_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_11'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_2_SHAPSHOT_1_DATE
        )
        topic_snapshot_metadata_model_1 = self.create_model(
            topic_models.TopicSnapshotMetadataModel,
            id=self.TOPIC_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_canonical_story',
                'story_id': self.STORY_1_ID
            }, {
                'cmd': 'add_canonical_story',
                'story_id': self.STORY_2_ID
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.TOPIC_SNAPSHOT_1_DATE
        )
        topic_snapshot_metadata_model_2 = self.create_model(
            topic_models.TopicSnapshotMetadataModel,
            id=self.TOPIC_1_ID + '-2',
            commit_cmds=[{
                'cmd': 'publish_story',
                'story_id': self.STORY_1_ID
            }],
            commit_type=feconf.COMMIT_TYPE_EDIT,
            committer_id='user_1',
            created_on=self.TOPIC_SNAPSHOT_2_DATE
        )

        self.put_multi(
            [story_model_1, story_model_2, topic_model,
            story_1_snapshot_metadata_model_1,
            story_1_snapshot_metadata_model_2,
            story_2_snapshot_metadata_model_1,
            topic_snapshot_metadata_model_1,
            topic_snapshot_metadata_model_2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOPIC MODELS WHOSE STORIES ARE UPDATED SUCCESS: 1'
            )
        ])

    def test_topic_with_no_story_reference_raises_error(self) -> None:
        story_model_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title_1',
            language_code='en',
            notes='notes_1',
            description='description_1',
            story_contents=self.story_contents_dict_1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-1',
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='en',
            description='description',
            url_fragment='/fragm',
            canonical_story_references=[],
            next_subtopic_id=1,
            page_title_fragment_for_web='fragm',
            story_reference_schema_version=1,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            version=1
        )
        story_snapshot_metadata_model = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_1'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_1_DATE
        )
        self.put_multi(
            [story_model_1, topic_model,
             story_snapshot_metadata_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'TOPIC MODELS WHOSE STORIES ARE UPDATED ERROR: \"(\''
                    'story_1_id\', StopIteration())\": 1'
                )
            )
        ])

    def test_story_with_wrong_commit_history_raises_error(self) -> None:
        story_model_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            story_contents_schema_version=4,
            title='title_1',
            language_code='en',
            notes='notes_1',
            description='description_1',
            story_contents=self.story_contents_dict_1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='urlfragment-1',
            version=1
        )
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic summary',
            canonical_name='topic summary',
            language_code='en',
            description='description',
            url_fragment='/fragm',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': True
            }],
            next_subtopic_id=1,
            page_title_fragment_for_web='fragm',
            story_reference_schema_version=1,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            version=1
        )
        story_snapshot_metadata_model = self.create_model(
            story_models.StorySnapshotMetadataModel,
            id=self.STORY_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_story_node',
                'node_id': 'node_2'
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.STORY_1_SHAPSHOT_1_DATE
        )
        topic_snapshot_metadata_model = self.create_model(
            topic_models.TopicSnapshotMetadataModel,
            id=self.TOPIC_1_ID + '-1',
            commit_cmds=[{
                'cmd': 'add_canonical_story',
                'story_id': self.STORY_1_ID
            }],
            commit_type=feconf.COMMIT_TYPE_CREATE,
            committer_id='user_1',
            created_on=self.TOPIC_SNAPSHOT_1_DATE
        )
        self.put_multi(
            [story_model_1, topic_model,
             story_snapshot_metadata_model,
             topic_snapshot_metadata_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'TOPIC MODELS WHOSE STORIES ARE UPDATED ERROR: \"(\''
                    'story_1_id\', Exception(\'Node was not created.\'))\": 1'
                )
            )
        ])
