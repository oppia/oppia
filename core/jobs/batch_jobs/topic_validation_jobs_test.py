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

"""Unit tests for jobs.batch_jobs.topic_validation_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import topic_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(topic_models, ) = models.Registry.import_models([models.NAMES.topic])


class GetNumberOfTopicsWhereStoryIsPublishedNotBoolJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        topic_validation_jobs.GetNumberOfTopicsWhereStoryIsPublishedNotBoolJob)

    TOPIC_ID_1 = 'topic_id_1'
    TOPIC_ID_2 = 'topic_id_2'
    TOPIC_ID_3 = 'topic_id_3'
    STORY_1_ID = 'story_id_1'
    STORY_2_ID = 'story_id_2'
    STORY_3_ID = 'story_id_3'

    def setUp(self):
        super().setUp()

        # This is an invalid model with the value of string type.
        self.topic_model_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': 'False'
            }]
        )

        # This is valid model with the value of bool type.
        self.topic_model_2 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_2,
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_2_ID,
                'story_is_published': False},
                {
                'story_id': self.STORY_1_ID,
                'story_is_published': True},
                {
                'story_id': self.STORY_3_ID,
                'story_is_published': False
            }]
        )

        # This is an invalid model with the value of integer type.
        self.topic_model_3 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_3,
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_3_ID,
                'story_is_published': 69
            }]
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.topic_model_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('Topics SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.topic_model_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('Topics SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('Invalid SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of topic which has non boolean value ' +
                f'is {self.TOPIC_ID_3}'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([
            self.topic_model_1,
            self.topic_model_2,
            self.topic_model_3
        ])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('Topics SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('Invalid SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                'The id of topic which has non boolean value ' +
                f'is {self.TOPIC_ID_1}'),
            job_run_result.JobRunResult.as_stderr(
                'The id of topic which has non boolean value ' +
                f'is {self.TOPIC_ID_3}'),
        ])
