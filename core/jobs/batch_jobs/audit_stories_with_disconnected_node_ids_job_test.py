# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for audit_topics_with_hanging_stories_job.py"""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import audit_stories_with_disconnected_node_ids_job
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:
    from mypy_imports import story_models

(story_models,) = models.Registry.import_models([models.Names.STORY])

datastore_services = models.Registry.import_datastore_services()


class AuditStoriesWithDisconnectedNodeIdsJobTest(job_test_utils.JobTestBase):
    """Test for AuditStoriesWithDisconnectedNodeIdsJob."""

    JOB_CLASS: Type[
        audit_stories_with_disconnected_node_ids_job.AuditStoriesWithDisconnectedNodeIdsJob
    ] = (
        audit_stories_with_disconnected_node_ids_job.AuditStoriesWithDisconnectedNodeIdsJob
    )

    TOPIC_ID_1: Final = 'topic_id_1'
    STORY_ID_1: Final = 'story_id_1'
    STORY_ID_2: Final = 'story_id_2'
    STORY_ID_3: Final = 'story_id_3'
    EXP_ID_1: Final = 'exp_id_1'
    EXP_ID_2: Final = 'exp_id_2'
    EXP_ID_3: Final = 'exp_id_3'
    EXP_ID_4: Final = 'exp_id_4'

    def test_empty_storage(self) -> None:
        """Tests that the job runs successfully on an empty datastore."""
        self.assert_job_output_is_empty()

    def test_stories_with_no_nodes_at_all(self) -> None:
        """Tests that the job reports stories that have an empty nodes list."""
        story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='Story Title 1',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [],
                'initial_node_id': None,
                'next_node_id': 1,
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )
        self.put_multi([story_1])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Story ID: {self.STORY_ID_1} has no nodes.'
                )
            ]
        )

    def test_stories_with_disconnected_node_ids(self) -> None:
        story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='Story Title 1',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'Chap 1 ',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': [],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_1,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                    {
                        'id': 'node_3',
                        'title': 'Chap 3 ',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': [],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_2,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'last_modified_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                ],
                'initial_node_id': 'node_1',
                'next_node_id': 'node_4',
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )
        self.put_multi([story_1])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Story ID: {self.STORY_ID_1} has disconnected nodes.'
                )
            ]
        )

    def test_stories_with_all_connected_node_ids(self) -> None:
        story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='Story Title 1',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'Chap 1 ',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': ['node_2'],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_1,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                    {
                        'id': 'node_2',
                        'title': 'Chap 2',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': [],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_2,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'last_modified_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                ],
                'initial_node_id': 'node_1',
                'next_node_id': 'node_4',
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )
        self.put_multi([story_1])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'SUCCESS: {self.STORY_ID_1} has no disconnected nodes.'
                )
            ]
        )

    def test_stories_with_all_the_three_cases(self) -> None:
        story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='Story Title 1',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [],
                'initial_node_id': None,
                'next_node_id': 1,
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )

        story_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_2,
            title='Story Title 2',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'Chap 1 ',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': [],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_1,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                    {
                        'id': 'node_3',
                        'title': 'Chap 3 ',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': [],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_2,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'last_modified_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                ],
                'initial_node_id': 'node_1',
                'next_node_id': 'node_4',
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )

        story_3 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_3,
            title='Story Title 3',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'Chap 1',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': ['node_2'],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_3,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                    {
                        'id': 'node_2',
                        'title': 'Chap 2',
                        'description': '',
                        'thumbnail_filename': 'img_20260113_002040_do1zy7ca1n_height_800_width_800.svg',
                        'thumbnail_bg_color': '#F8BF74',
                        'thumbnail_size_in_bytes': 2172,
                        'destination_node_ids': [],
                        'acquired_skill_ids': [],
                        'prerequisite_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'exploration_id': self.EXP_ID_4,
                        'status': 'Published',
                        'planned_publication_date_msecs': None,
                        'last_modified_msecs': None,
                        'first_publication_date_msecs': None,
                        'unpublishing_reason': None,
                    },
                ],
                'initial_node_id': 'node_1',
                'next_node_id': 'node_4',
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )
        self.put_multi([story_1, story_2, story_3])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Story ID: {self.STORY_ID_1} has no nodes.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'Story ID: {self.STORY_ID_2} has disconnected nodes.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'SUCCESS: {self.STORY_ID_3} has no disconnected nodes.'
                ),
            ]
        )
