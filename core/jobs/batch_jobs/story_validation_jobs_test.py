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

"""Unit tests for jobs.batch_jobs.story_validation_jobs."""

from __future__ import annotations

import copy
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(story_models, ) = models.Registry.import_models([models.NAMES.story])


class GetNumberOfStoryNotesExceedsMaxLengthJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = story_validation_jobs.GetNumberOfStoryNotesExceedsMaxLengthJob

    STORY_ID_1 = 'id_1'
    STORY_ID_2 = 'id_2'
    STORY_ID_3 = 'id_3'
    latest_contents = {
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
            'exploration_id': 'exp_id'
        }],
        'initial_node_id': 'node_1111',
        'next_node_id': 'node_2222'
    }
    LONG_NOTES = '#####' * 1000 + '#'

    def setUp(self):
        super().setUp()

        # This is an invalid model with story notes length greater than 5000.
        self.story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes=self.LONG_NOTES,
            description='description',
            story_contents=copy.deepcopy(self.latest_contents),
            corresponding_topic_id='topic_1_id',
            url_fragment='urlfragment',
        )

        # This is valid model with story notes length greater than 5000.
        self.story_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=copy.deepcopy(self.latest_contents),
            corresponding_topic_id='topic_1_id',
            url_fragment='urlfragment',
        )

        # This is an invalid model with story notes length greater than 5000.
        self.story_3 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_3,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes=self.LONG_NOTES,
            description='description',
            story_contents=copy.deepcopy(self.latest_contents),
            corresponding_topic_id='topic_3_id',
            url_fragment='urlfragment',
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.story_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('Stories SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.story_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('Stories SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of story is {self.STORY_ID_1} and its actual '
                + f'length is {len(self.story_1.notes)}'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.story_1, self.story_2, self.story_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('Stories SUCCESS: 2'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of story is {self.STORY_ID_1} and its actual '
                + f'length is {len(self.story_1.notes)}'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of story is {self.STORY_ID_3} and its actual '
                + f'length is {len(self.story_3.notes)}'),
        ])
